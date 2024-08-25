import { CancellationToken, CodeLens, CodeLensProvider, ProviderResult, Range, TextDocument, Uri, languages, window } from "vscode";
import { AnalysisResult } from "../models/analysis-result";

export class CCodeLensProvider implements CodeLensProvider {
	private static instance: CCodeLensProvider;
	private static analysisResults: Map<string, Map<number, AnalysisResult>> = new Map();

	// Private constructor to prevent instantiation
	private constructor() { }

	public static getInstance(): CCodeLensProvider {
		if (!CCodeLensProvider.instance) {
			CCodeLensProvider.instance = new CCodeLensProvider();
		}
		return CCodeLensProvider.instance;
	}

	public static updateAnalysisResult(uri: Uri, range: Range, result: AnalysisResult) {
		const key = uri.toString();
		if (!this.analysisResults.has(key)) {
			this.analysisResults.set(key, new Map());
		}
		this.analysisResults.get(key)!.set(range.start.line, result);

		// Trigger CodeLens refresh by notifying VS Code that the document has changed
		const editor = window.visibleTextEditors.find(editor => editor.document.uri.toString() === uri.toString());
		if (editor) {
			editor.document.save(); // Save document to force refresh
		}
	}

	provideCodeLenses(document: TextDocument, token: CancellationToken): ProviderResult<CodeLens[]> {
		const codeLenses: CodeLens[] = [];

		const text = document.getText();
		const functionRegex = /[\w]+\s+[\w]+\s*\([^)]*\)\s*{?/g;
		let match: RegExpExecArray | null;

		while (match = functionRegex.exec(text)) {
			const line = document.lineAt(document.positionAt(match.index).line);
			const range = new Range(line.range.start, line.range.end);

			const analysisResult = CCodeLensProvider.analysisResults.get(document.uri.toString())?.get(line.lineNumber);
			const annotationText = analysisResult
				? ` Complexity: ${analysisResult.bigO}`
				: '';

			codeLenses.push(new CodeLens(range, {
				title: `Analyze${annotationText}`,
				command: 'extension.analyzeFunction',
				arguments: [document.uri, range]
			}));
		}

		return codeLenses;
	}

}
