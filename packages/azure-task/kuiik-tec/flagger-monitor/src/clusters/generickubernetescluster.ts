"use strict";

import * as tl from "azure-pipelines-task-lib/task";
import * as yaml from "js-yaml";

export async function getKubeConfig(): Promise<string> {
    var kubernetesServiceEndpoint = tl.getInput("kubernetesServiceEndpoint", true);
    var authorizationType = tl.getEndpointDataParameter(kubernetesServiceEndpoint, 'authorizationType', true);
    if (!authorizationType || authorizationType === "Kubeconfig")
    {
        return getKubeconfigForCluster(kubernetesServiceEndpoint);
    }
    else if (authorizationType === "ServiceAccount" || authorizationType === "AzureSubscription")
    {
        return createKubeconfig(kubernetesServiceEndpoint);
    } 
}

export function getKubeconfigForCluster(kubernetesServiceEndpoint: string) {
    const kubeconfig = tl.getEndpointAuthorizationParameter(kubernetesServiceEndpoint, 'kubeconfig', false);
    const clusterContext = tl.getEndpointAuthorizationParameter(kubernetesServiceEndpoint, 'clusterContext', true);
    if (!clusterContext) {
        return kubeconfig;
    }
    const kubeconfigTemplate = yaml.load(kubeconfig);
    kubeconfigTemplate['current-context'] = clusterContext;
    const modifiedKubeConfig = yaml.dump(kubeconfigTemplate);
    return modifiedKubeConfig.toString();
}

export function createKubeconfig(kubernetesServiceEndpoint) {
    const kubeconfigTemplateString = '{"apiVersion":"v1","kind":"Config","clusters":[{"cluster":{"certificate-authority-data": null,"server": null}}], "users":[{"user":{"token": null}}]}';
    const kubeconfigTemplate = JSON.parse(kubeconfigTemplateString);
    //populate server url, ca cert and token fields
    kubeconfigTemplate.clusters[0].cluster.server = tl.getEndpointUrl(kubernetesServiceEndpoint, false);
    kubeconfigTemplate.clusters[0].cluster['certificate-authority-data'] = tl.getEndpointAuthorizationParameter(kubernetesServiceEndpoint, 'serviceAccountCertificate', false);
    const base64ApiToken = Buffer.from(tl.getEndpointAuthorizationParameter(kubernetesServiceEndpoint, 'apiToken', false), 'base64');
    kubeconfigTemplate.users[0].user.token = base64ApiToken.toString();
    return JSON.stringify(kubeconfigTemplate);
}
