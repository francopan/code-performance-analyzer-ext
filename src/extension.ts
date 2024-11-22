import * as vscode from 'vscode';
import { ASTAnalyzer } from './analyzers/ast-analyzer';
import { LLMAnalyzer } from './analyzers/llm-analyzer';
import { commands } from './constants/commands.const';
import { CCodeLensProvider } from './lenses/c.lens';
import { AnalysisResultWebview } from './webviews/analyzis-result.webview';

let statusBar: vscode.StatusBarItem;
let codeLens: vscode.Disposable | undefined;
let webView: AnalysisResultWebview | undefined;
let llmAnalyzer: LLMAnalyzer;
let astAnalyzer: ASTAnalyzer;

export function activate(context: vscode.ExtensionContext) {
	initializeWebView(context);
	registerCodeLensProvider(context);
	initializeStatusBar(context);
	registerCommands(context);
	instantiateAnalyzers();
}

function initializeWebView(context: vscode.ExtensionContext) {
	webView = AnalysisResultWebview.getInstance();
	webView.setExtensionPath(context.extensionPath);
	webView.setIsDebugMode(process.env.DEBUG_MODE === 'true');
	context.subscriptions.push(webView);
}

function registerCodeLensProvider(context: vscode.ExtensionContext) {
	codeLens = vscode.languages.registerCodeLensProvider({ language: 'c' }, CCodeLensProvider.getInstance());
	context.subscriptions.push(codeLens);
}

function initializeStatusBar(context: vscode.ExtensionContext) {
	statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
	statusBar.text = 'Ready';
	context.subscriptions.push(statusBar);
}

function instantiateAnalyzers() {
	const config = vscode.workspace.getConfiguration('llmAnalyzer');
	const apiUrl = config.get<string>('apiUrl') || 'http://127.0.0.1:11434/api/generate';
	const model = config.get<string>('model') || 'mistral';
	llmAnalyzer = new LLMAnalyzer(apiUrl, model);
	astAnalyzer = new ASTAnalyzer();
}

function registerCommands(context: vscode.ExtensionContext) {
	const commandsToRegister: Array<{ command: string, method: 'ast' | 'llm', isContextMenu?: boolean }> = [
		{ command: commands.analyzeFunctionAST, method: 'ast' },
		{ command: commands.analyzeFunctionLLM, method: 'llm' },
		{ command: commands.analyzeSelectedCodeAST, method: 'ast', isContextMenu: true },
		{ command: commands.analyzeSelectedCodeLLM, method: 'llm', isContextMenu: true }
	];

	for (const { command, method, isContextMenu = false } of commandsToRegister) {
		const registerCommand = vscode.commands.registerCommand(command, async (uri: vscode.Uri, range: vscode.Range) => {
			await analyzeSelectedCode(uri, range, method, !isContextMenu);
		});
		context.subscriptions.push(registerCommand);
	}
}

async function analyzeSelectedCode(uri: vscode.Uri, range: vscode.Range, method: 'ast' | 'llm', updateCodeLens = true) {
	try {
		const document = await vscode.workspace.openTextDocument(uri);
		const code = document.getText(range);

		if (!code) {
			throw new Error('No code selected.');
		}

		statusBar.text = 'Analyzing code...';
		statusBar.show();

		const analysisResult = method === 'ast'
			? await astAnalyzer.analyze(code)
			: await llmAnalyzer.analyze(code);

		if (analysisResult) {
			if (updateCodeLens) {
				CCodeLensProvider.updateAnalysisResult(uri, range, analysisResult);
			}
			await vscode.window.activeTextEditor?.document.save();
			webView?.showAnalysisResult(analysisResult);
		} else {
			throw new Error('Analysis result is undefined.');
		}
	} catch (error: any) {
		vscode.window.showErrorMessage(`Failed to analyze code: ${error.message}`);
		console.error(error);
	} finally {
		statusBar.text = 'Analysis completed';
		setTimeout(() => statusBar.hide(), 3000);
	}
}
