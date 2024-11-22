import * as vscode from 'vscode';
import { commands } from "../constants/commands.const";
import { AnalysisResult } from "../models/analysis-result.model";

export class CCodeLensProvider implements vscode.CodeLensProvider {
	private static instance: CCodeLensProvider;
	private static analysisResults: Map<string, Map<number, AnalysisResult>> = new Map();

	private constructor() { }

	public static getInstance(): CCodeLensProvider {
		if (!CCodeLensProvider.instance) {
			CCodeLensProvider.instance = new CCodeLensProvider();
		}
		return CCodeLensProvider.instance;
	}

	public static updateAnalysisResult(uri: vscode.Uri, range: vscode.Range, result: AnalysisResult) {
		const key = uri.toString();
		if (!this.analysisResults.has(key)) {
			this.analysisResults.set(key, new Map());
		}
		this.analysisResults.get(key)!.set(range.start.line, result);

		// Trigger CodeLens refresh by notifying VS Code that the document has changed
		const editor = vscode.window.visibleTextEditors.find(editor => editor.document.uri.toString() === uri.toString());
		if (editor) {
			editor.document.save(); // Save document to force refresh
		}
	}

	public async provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.CodeLens[]> {
		const codeLenses: vscode.CodeLens[] = [];

		// Retrieve document symbols using the executeDocumentSymbolProvider command
		const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
			'vscode.executeDocumentSymbolProvider',
			document.uri
		);

		// Filter for function symbols
		const functionSymbols = symbols.filter(symbol => symbol.kind === vscode.SymbolKind.Function);

		// Iterate over the function symbols
		functionSymbols.forEach(symbol => {
			const range: vscode.Range = symbol.range;
			const startPos = range.start;
			const endPos = range.end;

			// Create CodeLens for AST analysis
			codeLenses.push(new vscode.CodeLens(range, {
				title: 'Analyze AST',
				command: commands.analyzeFunctionAST,
				arguments: [document.uri, range]
			}));

			// Create CodeLens for LLM analysis
			codeLenses.push(new vscode.CodeLens(range, {
				title: 'Analyze LLM',
				command: commands.analyzeFunctionLLM,
				arguments: [document.uri, range]
			}));

			// Add complexity information, if available
			const analysisResult = CCodeLensProvider.analysisResults.get(document.uri.toString())?.get(startPos.line);
			if (analysisResult) {
				codeLenses.push(new vscode.CodeLens(range, {
					title: `Complexity: ${analysisResult.bigO}`,
					command: commands.analyzeFunctionLLM,
					arguments: [document.uri, range]
				}));
			}
		});

		return codeLenses;
	}

}
