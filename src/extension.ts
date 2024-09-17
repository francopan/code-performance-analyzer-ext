import * as vscode from 'vscode';
import { ASTAnalyzer } from './analyzers/ast-analyzer';
import { LLMAnalyzer } from './analyzers/llm-analyzer';
import { commands } from './constants/commands.const';
import { CCodeLensProvider } from './lenses/c.lens';
import { AnalysisResult } from './models/analysis-result';
import { AnalysisResultWebview } from './webviews/analyzis-result.webview';


let statusBar: vscode.StatusBarItem;
let codeLens: vscode.Disposable | undefined;
let webView: AnalysisResultWebview | undefined;
let llmAnalyzer: LLMAnalyzer | undefined;
let astAnalyzer: ASTAnalyzer | undefined;


export function activate(context: vscode.ExtensionContext) {
	// Start WebView
	webView = AnalysisResultWebview.getInstance();
	webView.setExtensionPath(context.extensionPath);
	webView.setIsDebugMode(process.env.DEBUG_MODE === 'true');
	context.subscriptions.push(webView);

	// Start Code Lens 
	codeLens = vscode.languages.registerCodeLensProvider({ language: 'c' }, CCodeLensProvider.getInstance());
	context.subscriptions.push(codeLens);

	// Start Status Bar 
	statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
	context.subscriptions.push(statusBar);

	// Add Analyze Commands
	const { analyzeASTCommand, analyzeLLMCommand } = addAnalyzeCommands();
	context.subscriptions.push(analyzeASTCommand);
	context.subscriptions.push(analyzeLLMCommand);

	// Instantiate Analyzers
	llmAnalyzer = new LLMAnalyzer();
	astAnalyzer = new ASTAnalyzer();
}

function addAnalyzeCommands() {
	const analyzeASTCommand = vscode.commands.registerCommand(commands.analyzeFunctionAST, async (uri: vscode.Uri, range: vscode.Range) => {
		await analyzeSelectedCode(uri, range, 'ast');
	});

	const analyzeLLMCommand = vscode.commands.registerCommand(commands.analyzeFunctionLLM, async (uri: vscode.Uri, range: vscode.Range) => {
		await analyzeSelectedCode(uri, range, 'llm');
	});
	return { analyzeASTCommand, analyzeLLMCommand };
}

async function analyzeSelectedCode(uri: vscode.Uri, range: vscode.Range, method: 'ast' | 'llm') {
	const document = await vscode.workspace.openTextDocument(uri);
	const code = document.getText(range);

	if (!code) {
		vscode.window.showErrorMessage('No code selected.');
		return;
	}

	statusBar.text = 'Analyzing code...';
	statusBar.show();

	try {
		let analysisResult: AnalysisResult | undefined;

		if (method === 'ast') {
			analysisResult = await astAnalyzer?.analyze(code);
		} else {
			analysisResult = await llmAnalyzer?.analyze(code);
		}

		if (analysisResult) {
			CCodeLensProvider.updateAnalysisResult(uri, range, analysisResult);
			await vscode.window.activeTextEditor?.document.save();
			webView?.showAnalysisResult(analysisResult);
		}
	} catch (error) {
		vscode.window.showErrorMessage('Failed to analyze code.');
		console.error(error);
	} finally {
		statusBar.text = 'Analysis completed';
		setTimeout(() => statusBar.hide(), 3000);
	}
}

