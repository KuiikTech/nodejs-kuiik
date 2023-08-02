"use strict";

import * as tl from 'azure-pipelines-task-lib/task';
import * as path from 'path';
import * as fs from 'fs';
import * as flaggerUtils from "./utils"
import asTable from 'as-table';

import { Kubelogin } from 'azure-pipelines-tasks-kubernetes-common/kubelogin';

import kubernetescli from "./kubernetescli"

tl.setResourcePath(path.join(__dirname, '..', 'task.json'));
tl.setResourcePath(path.join(__dirname, '../node_modules/azure-pipelines-tasks-azure-arm-rest/module.json'));
tl.cd(tl.getInput("cwd"));

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
const taskStartTime = new Date().toISOString();

const SUCCESSFUL_STATES = ['succeeded', 'initialized'];
const FAILED_STATES = ['failed'];
const COMPLETED_STATES = ['succeeded', 'initialized', 'failed'];
const UNKNOWN_STATE = 'unknown'

function getKubeConfigFilePath(): string {
    var userdir = flaggerUtils.getTaskTempDir();
    return path.join(userdir, "config");
}

function getClusterType(): any {
    var connectionType = tl.getInput("connectionType", true);
    var endpoint = tl.getInput("azureSubscriptionEndpoint")
    if (connectionType === "Azure Resource Manager" && endpoint) {
        return require("./clusters/armkubernetescluster")
    }

    return require("./clusters/generickubernetescluster")
}

async function getKubeConfigFile(): Promise<string> {
    return getClusterType().getKubeConfig().then((config) => {
        var configFilePath = getKubeConfigFilePath();
        tl.debug(tl.loc("KubeConfigFilePath", configFilePath));
        fs.writeFileSync(configFilePath, config);
        fs.chmodSync(configFilePath, '600');
        return configFilePath;
    });
}

async function run() {
    var connectionType = tl.getInput("connectionType", true);
    var kubectlCli: kubernetescli;

    var externalAuth = connectionType === "None";
    if (externalAuth && !tl.getVariable("KUBECONFIG")) {
        tl.error(tl.loc("KubeConfigFilePathWithConectionnTypeNoNe"));
    } else {
        var kubeconfigfilePath = externalAuth ? tl.getVariable("KUBECONFIG") : await getKubeConfigFile();
        kubectlCli = new kubernetescli(kubeconfigfilePath);
        kubectlCli.login();
    }

    const kubelogin = new Kubelogin(flaggerUtils.getTaskTempDir());

    if (kubelogin.isAvailable()) {
        tl.debug('Kubelogin is installed. Converting kubeconfig.');
        const serviceConnection: string = tl.getInput('azureSubscriptionEndpoint', false);
        try {
            await kubelogin.login(serviceConnection);
        } catch (err) {
            tl.debug(tl.loc('KubeloginFailed', err));
        }
    }

    const canaryNameInput: string = tl.getInput('canaryNameInput', true);
    const canaryNames: string[] = canaryNameInput.split(/[, \n]+/).filter(name => name.trim() !== '');

    var telemetry = {
        connectionType: connectionType,
        jobId: tl.getVariable('SYSTEM_JOBID')
    };
    console.log("##vso[telemetry.publish area=%s;feature=%s]%s",
        "TaskEndpointId",
        "FlaggerCanaryMonitor",
        JSON.stringify(telemetry));

    const namespace: string = tl.getInput("namespace", false);
    var argumentsInput = tl.getInput("arguments", false)

    if(namespace) {
        kubectlCli.addArgument("--namespace ".concat(namespace));
    }
    if(argumentsInput) {
        kubectlCli.addArgument(argumentsInput);
    }

    const initialAwait = +tl.getInput("initialValueInput", true);
    const updateFrequency = +tl.getInput("frequencyInput", true);
    const timeout = +tl.getInput("timeoutInput", true);
    let attempts = 1;
    let timeElapsed = 0;

    const canaryResults: {
        name: string;
        status: string;
        lastTransitionTime: string
    }[] = canaryNames.map((name) => ({
        name,
        status: UNKNOWN_STATE,
        lastTransitionTime: taskStartTime,
    }));

    console.log('Start of monitoring.');
    console.log(`Waiting for ${initialAwait} second start time...`);    
    await sleep(initialAwait * 1000);
    console.log(`Monitoring...`); 
    while (timeElapsed < timeout) {

        const kubectlLog = kubectlCli.getCanariesByNames(canaryNames, true);

        if (kubectlLog.code !== 0) {
            tl.error(kubectlLog.stderr);
            tl.setResult(tl.TaskResult.Failed, 'Error executing kubectl command.');
            return;
        }

        const canaryStatus = kubectlLog.stdout;
        const canaryStatusLines = canaryStatus.split('\n');
        for (const canaryStatusLine of canaryStatusLines) {
            tl.debug(canaryStatus);
            const [canaryName, canaryStatusText, canaryWeight, lastTransitionTime] = canaryStatusLine.split(/\s+/);
            const canaryResult = canaryResults.find((result) => result.name === canaryName);
            if (canaryResult) {
                canaryResult.status = canaryStatusText.toLowerCase();
                canaryResult.lastTransitionTime = lastTransitionTime;
            }
        }

        // Check if all canaries have finished
        const allCompleted = canaryResults.every((result) => COMPLETED_STATES.includes(result.status));
        if (allCompleted) {
            const allSucceeded = canaryResults.every((result) => SUCCESSFUL_STATES.includes(result.status));
            const allTransitionTimesValid = canaryResults.every(
                (result) => flaggerUtils.compareDates(result.lastTransitionTime, taskStartTime)
            );

            if(allSucceeded && allTransitionTimesValid){
                tl.setResult(tl.TaskResult.Succeeded, 'All canaries succeeded.');
            } else if(allSucceeded && !allTransitionTimesValid) {
                const issuesCanaries = canaryResults
                    .filter((result) => !flaggerUtils.compareDates(result.lastTransitionTime, taskStartTime))
                    .map((result) => result.name).join(', ');
                tl.setResult(
                    tl.TaskResult.SucceededWithIssues,
                    `All canaries succeeded, but some of them did not change their transition time during monitoring: ${issuesCanaries}.`
                );
            } else {
                const failedCanaries = canaryResults
                    .filter((result) => FAILED_STATES.includes(result.status))
                    .map((result) => result.name).join(', ');
                tl.setResult(tl.TaskResult.Failed, `Canaries failed: ${failedCanaries}`);
            }
            console.log(asTable(canaryResults));
            return;
        }

        await sleep(updateFrequency * 1000);
        timeElapsed += updateFrequency;
    }

    const unknownOrIncompletedCanries = canaryResults
        .filter((result) => FAILED_STATES.includes(result.status))
        .map((result) => result.name).join(', ');
    tl.setResult(tl.TaskResult.Failed, `Timeout for task reached. Status  of canaries did not completed or status in unknown: ${unknownOrIncompletedCanries}`);
    console.log(asTable(canaryResults));
}

run().then(() => {
    // do nothing
}, (reason) => {
    tl.setResult(tl.TaskResult.Failed, reason);
});