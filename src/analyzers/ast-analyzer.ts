import { exec } from "child_process";
import { promisify } from "util";
import * as vscode from 'vscode';
import { AnalysisResult } from "../models/analysis-result.model";
import { Analyzer } from "./analyzer.interface";

const execPromise = promisify(exec);

export class ASTAnalyzer implements Analyzer {

    public async analyze(code: string): Promise<AnalysisResult> {
        const filePath = vscode.window.activeTextEditor?.document.fileName;

        if (filePath) {
            try {
                vscode.window.showInformationMessage('Getting AST...');
                const ast = await this.getAST(filePath);
                vscode.window.showInformationMessage('AST retrieved successfully. Check the output panel for details.');
                const complexity = 0;
                this.appendToOutput(ast, complexity);
            } catch (error) {
                console.error('Error retrieving AST:', error);
            }
        }

        return { bigO: 'O(1)', message: '1' } as AnalysisResult;
    }


    private appendToOutput(ast: string, complexity: number) {
        const outputChannel = vscode.window.createOutputChannel('Clang AST');
        outputChannel.show();
        outputChannel.appendLine(ast);
        outputChannel.appendLine(complexity.toString());
    }

    private async getAST(filePath: string): Promise<string> {
        try {
            const command = `clang -Xclang -ast-dump -fsyntax-only -w ${filePath}`;
            const { stdout, stderr } = await execPromise(command);

            if (stderr) {
                console.error('Error:', stderr);
                throw new Error(stderr);
            }

            return stdout;
        } catch (error) {
            console.error('Failed to retrieve AST:', error);
            throw error;
        }
    }


}

