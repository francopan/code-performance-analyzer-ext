import { render } from "ejs";
import { join } from "path";
import { readFileSync } from "fs";
import { AnalysisResult } from "../models/analysis-result";
import * as vscode from 'vscode';
import { panels } from "../constants/panels.const";

export class AnalysisResultWebview implements vscode.Disposable {

    private isDebugMode: boolean = false;
    private extensionPath: string = '';
    private panel?: vscode.WebviewPanel;
    private static instance: AnalysisResultWebview;

    public static getInstance(): AnalysisResultWebview {
        if (!AnalysisResultWebview.instance) {
            AnalysisResultWebview.instance = new AnalysisResultWebview();
        }
        return AnalysisResultWebview.instance;
    }

    public async showAnalysisResult(result: AnalysisResult) {
        this.panel?.dispose();
        this.panel = vscode.window.createWebviewPanel(
            panels.analysisResult,
            'Analysis Result',
            vscode.ViewColumn.Beside,
            {}
        );
        this.panel.webview.html = this.renderTemplate('analysis-result.ejs', result) ?? 'Error loading result';
    }

    public dispose() {
        this.panel?.dispose();
    }

    public setIsDebugMode(value: boolean): void {
        this.isDebugMode = value;
    }

    public setExtensionPath(path: string): void {
        this.extensionPath = path;
    }

    private renderTemplate(fileName: string, data: ejs.Data): string {
        const templateDir = this.isDebugMode ? 'src/webviews' : '';
        const templatePath = join(this.extensionPath, templateDir, fileName);
        const template = readFileSync(templatePath, 'utf8');
        const htmlContent = render(template, data);

        return htmlContent;
    }


}