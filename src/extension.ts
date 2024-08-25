import * as vscode from 'vscode';
import axios from 'axios';
import { AnalysisResult } from './models/analysis-result';
import { CCodeLensProvider } from './providers/c-code-lens-provider';

let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
	const codeLensProvider = vscode.languages.registerCodeLensProvider({ language: 'c' }, CCodeLensProvider.getInstance());
	context.subscriptions.push(codeLensProvider);

	// Create and show a status bar item
	statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
	context.subscriptions.push(statusBarItem);

	let analyzeFunctionCommand = vscode.commands.registerCommand('extension.analyzeFunction', async (uri: vscode.Uri, range: vscode.Range) => {
		const document = await vscode.workspace.openTextDocument(uri);
		const code = document.getText(range);

		if (!code) {
			vscode.window.showErrorMessage('No code selected.');
			return;
		}

		statusBarItem.text = 'Analyzing code...';
		statusBarItem.show();

		try {
			const analysisResult = await analyzeCode(code);
			// Notify CodeLens provider of the update
			CCodeLensProvider.updateAnalysisResult(uri, range, analysisResult);

			// Show the result in a webview
			showAnalysisResult(analysisResult);

			// Force refresh of the CodeLens provider
			vscode.window.activeTextEditor?.document.save();

		} catch (error) {
			vscode.window.showErrorMessage('Failed to analyze code.');
			console.error(error);
		} finally {
			statusBarItem.text = 'Analysis completed';
			setTimeout(() => statusBarItem.hide(), 3000); // Hide status after 3 seconds
		}
	});

	context.subscriptions.push(analyzeFunctionCommand);
}

async function analyzeCode(code: string): Promise<AnalysisResult> {
	const url = 'http://127.0.0.1:11434/api/generate';
	const prompt = `Code: \`\`\`c\n${code}\n\`\`\` 
    Analyze the code for its time complexity in Big O notation. 
    IN ORDER FOR ME TO PARSE THE RESULT, RETURN A JSON OBJECT WITH KEYS "bigO" AND "message". USE "message" FOR ANY EXPLANATION OR ERROR, BUT DO NOT INCLUDE ANY OTHER TEXT BEFORE OR AFTER THE JSON.

    Expected result format:

    {
        "bigO": "O(n^2)",
        "message": "Explanation of the time complexity"
    }

	OR

	{
        "bigO": null,
        "message": "Explanation of the reason why cannot give complexity"
    }
    `;

	try {
		const response = await axios.post(url, {
			model: 'mistral',
			prompt: prompt,
			stream: false
		});
		console.log(response.data)
		const responseText = response.data.response.trim();

		let result;
		try {
			result = JSON.parse(responseText) as AnalysisResult;

		} catch (e) {
			console.error('Failed to parse JSON response:', responseText);
			throw new Error('Invalid JSON response');
		}

		return result;
	} catch (error) {
		console.error('Error while analyzing code:', error);
		throw error;
	}
}

function showAnalysisResult(result: AnalysisResult) {
	const panel = vscode.window.createWebviewPanel(
		'analysisResult',
		'Analysis Result',
		vscode.ViewColumn.Beside,
		{}
	);

	panel.webview.html = getWebviewContent(result);
}

function getWebviewContent(result: AnalysisResult): string {
	return `
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<title>Analysis Result</title>
		</head>
		<body>
			<h1>Analysis Result</h1>
			<p><strong>Big O:</strong> ${result.bigO ? result.bigO : 'N/A'}</p>
			<p><strong>Message:</strong> ${result.message}</p>
		</body>
		</html>`;
}

export function deactivate() { }
