import * as tl from 'azure-pipelines-task-lib/task';
import * as fs from "fs";
import * as tr from "azure-pipelines-task-lib/toolrunner";
import basecommand from "./basecommand"

const EXIT_CODE_SUCCESS = 0;
const EXIT_CODE_FAILURE = 2;

export default class kubernetescli extends basecommand {

    private kubeconfigPath: string;
    private command: string;
    private arguments: string[] = [];
    constructor(kubeconfigPath: string) {
        super(true);
        this.kubeconfigPath = kubeconfigPath;
    }

    public setCommand(command: string): void {
        this.command = command;
    }

    public getCommand(): string {
        return this.command;
    }

    public addArgument(argument: string): void {
        this.arguments.push(argument);
    }

    public getArguments(): string[] {
        return this.arguments;
    }

    public resetArguments(): void {
        this.arguments = [];
    }

    public getTool(): string {
        return "kubectl";
    }

    public login(): void {
        process.env["KUBECONFIG"] = this.kubeconfigPath;
    }

    public logout(): void {
        if (this.kubeconfigPath != null && fs.existsSync(this.kubeconfigPath)) {
            delete process.env["KUBECONFIG"];
            fs.unlinkSync(this.kubeconfigPath);
        }
    }

    public setKubeConfigEnvVariable() {
        if (this.kubeconfigPath && fs.existsSync(this.kubeconfigPath)) {
            tl.setVariable("KUBECONFIG", this.kubeconfigPath);
            tl.setVariable('helmExitCode', EXIT_CODE_SUCCESS.toString());
        }
        else {
            tl.error(tl.loc('KubernetesServiceConnectionNotFound'));
            tl.setVariable('helmExitCode', EXIT_CODE_FAILURE.toString());
            throw new Error(tl.loc('KubernetesServiceConnectionNotFound'));
        }
    }

    public unsetKubeConfigEnvVariable() {
        var kubeConfigPath = tl.getVariable("KUBECONFIG");
        if (kubeConfigPath) {
            tl.setVariable("KUBECONFIG", "");
        }
        tl.setVariable('helmExitCode', EXIT_CODE_SUCCESS.toString());
    }

    public execKubectlCommand(silent?: boolean): tr.IExecSyncResult {
        var command = this.createCommand();
        command.arg(this.command);
        this.arguments.forEach((value) => {
            command.line(value);
        });

        return this.execCommandSync(command, { silent: !!silent } as tr.IExecOptions);
    }

    public getAllPods(silent?: boolean): tr.IExecSyncResult {
        var command = this.createCommand();
        command.arg('get');
        command.arg('pods');
        this.arguments.forEach((value) => {
            command.line(value);
        });
        return this.execCommandSync(command, { silent: !!silent } as tr.IExecOptions);
    }

    public getCanariesByNames(canaryNames: string[], silent?: boolean): tr.IExecSyncResult {
        var command = this.createCommand();
        command.arg('get');
        command.arg('canaries');
        this.arguments.forEach((value) => {
            command.line(value);
        });
        canaryNames.forEach((value) => {
            command.line(value);
        });
        return this.execCommandSync(command, { silent: !!silent } as tr.IExecOptions);
    }

    public getClusterInfo(): tr.IExecSyncResult {
        const command = this.createCommand();
        command.arg('cluster-info');
        return this.execCommandSync(command);
    }

    public getKubectlVersion(): tr.IExecSyncResult {
        var command = this.createCommand();
        command.arg('version');
        command.line('--client');
        command.line('--short');
        command.line('--output=json');

        return this.execCommandSync(command);
    }
}
