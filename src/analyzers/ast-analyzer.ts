import { exec } from "child_process";
import { promisify } from "util";
import * as vscode from 'vscode';
import { AnalysisResult } from "../models/analysis-result.model";
import { BinaryOperator, CallExpr, DeclRefExpr, ForStmt, IfStmt, ImplicitCastExpr, IntegerLiteral, VarDecl, WhileStmt } from "../models/ast-node-kind.model";
import { ASTNode } from "../models/ast-node.model";
import { Analyzer } from "./analyzer.interface";

const execPromise = promisify(exec);
type ClangNode = ASTNode;

interface NodeAnalysisResult {
    complexity: number;
    operations: number;
    value?: number;
}

export class ASTAnalyzer implements Analyzer {
    private complexity: number;
    private variableTable: Map<string, number>;
    private outputChannel: vscode.OutputChannel;

    constructor() {
        this.complexity = 0;
        this.variableTable = new Map<string, number>();
        this.outputChannel = vscode.window.createOutputChannel('CodePerformanceDebugger');
    }

    public async analyze(code: string): Promise<AnalysisResult> {
        const filePath = vscode.window.activeTextEditor?.document.fileName;

        if (filePath) {
            try {
                const ast = await this.getAST(filePath);
                if (ast) {
                    this.complexity = this.traverse(ast);
                } else {
                    vscode.window.showWarningMessage('No AST available for analysis.');
                }
            } catch (error) {
                console.error('Error during analysis:', error);
            }
        } else {
            vscode.window.showWarningMessage('No active file to analyze.');
        }

        return { bigO: this.complexity.toString(), message: 'Analysis completed.' } as AnalysisResult;
    }

    private async getAST(filePath: string): Promise<ClangNode | null> {
        try {
            vscode.window.showInformationMessage('Getting AST...');
            const command = `clang -Xclang -ast-dump=json -fsyntax-only -w ${filePath}`;
            const { stdout, stderr } = await execPromise(command, { maxBuffer: 1024 * 1024 * 10 });

            if (stderr) {
                vscode.window.showErrorMessage(`AST retrieval failed: ${stderr}`);
                return null;
            }

            vscode.window.showInformationMessage('AST retrieved successfully.');
            return JSON.parse(stdout) as ClangNode;
        } catch (error) {
            vscode.window.showErrorMessage('Error during AST retrieval: ' + JSON.stringify(error) ?? '');
            return null;
        }
    }

    private traverse(node: ASTNode): number {
        const { operations } = this.analyzeNodeComplexity(node);
        let totalOperations = operations;

        if (node.inner && node.inner.length > 0) {
            for (const child of node.inner) {
                totalOperations += this.traverse(child);

            }
        }

        return totalOperations;
    }

    private analyzeNodeComplexity(node: ASTNode): NodeAnalysisResult {
        let nodeComplexity = 0;
        let operationCount = 0;

        switch (node.kind) {
            case 'ForStmt':
            case 'WhileStmt':
                const iterationResult = this.getIterationComplexity(node);
                nodeComplexity += iterationResult.complexity;
                operationCount += iterationResult.operations;
                break;
            case 'IfStmt':
                const conditionalResult = this.analyzeConditional(node as IfStmt);
                nodeComplexity += conditionalResult.complexity;
                operationCount += conditionalResult.operations;
                break;
            case 'CallExpr':
                const functionCallResult = this.analyzeFunctionCall(node as CallExpr);
                nodeComplexity += functionCallResult.complexity;
                operationCount += functionCallResult.operations;
                break;
            case 'BinaryOperator':
                const binaryOperatorResult = this.analyzeBinaryOperator(node as BinaryOperator);
                nodeComplexity += binaryOperatorResult.complexity;
                operationCount += binaryOperatorResult.operations;
                break;
            case 'VarDecl':
                // Assuming the node has a value property for initialization
                if (node.inner && node.inner.length > 0) {
                    const value = this.evaluateExpression(node.inner[0]);
                    this.variableTable.set((node as VarDecl).name, value.value ?? 0); // Store variable in table
                }
                break;
            case 'CompoundStmt':
                for (const innerNode of node.inner) {
                    const result = this.analyzeNodeComplexity(innerNode);
                    nodeComplexity += result.complexity;
                    operationCount += result.operations;
                }
                break;
            default:
                nodeComplexity += 1; // Default complexity for other nodes
                operationCount += 1; // Count the operation for visiting this node
                break;
        }

        return { complexity: nodeComplexity, operations: operationCount };
    }


    private getIterationComplexity(node: ForStmt | WhileStmt): NodeAnalysisResult {
        if (this.isForStmt(node)) {
            return this.analyzeForStmt(node);
        }

        if (this.isWhileStmt(node)) {
            return this.analyzeWhileStmt(node);
        }

        throw new Error("Unsupported node type");
    }

    private analyzeForStmt(node: ForStmt): NodeAnalysisResult {
        let iterations = 1;
        let operationCount = 0;

        const [init, , condition, increment, loopBody] = node.inner;

        operationCount += this.analyzeNodeComplexity(init).operations;

        const conditionResult = this.evaluateConditionIterations(condition);
        iterations = conditionResult.complexity;

        const incrementResult = this.evaluateIncrement(increment);
        operationCount += incrementResult.operations;

        if (incrementResult.complexity > 0) {
            iterations = Math.max(1, Math.floor(iterations / incrementResult.complexity));
        } else {
            this.outputChannel.appendLine("Increment complexity is zero, defaulting iterations to 1.");
        }

        const loopBodyOperationCount = this.analyzeNodeComplexity(loopBody).operations;
        operationCount += loopBodyOperationCount * iterations;

        return { complexity: 0, operations: operationCount };
    }

    private analyzeWhileStmt(node: WhileStmt): NodeAnalysisResult {
        let iterations = 1;
        let operationCount = 0;

        const [condition, loopBody] = node.inner;

        const conditionResult = this.evaluateConditionIterations(condition);
        iterations = conditionResult.complexity;
        operationCount += conditionResult.operations;

        const loopBodyOperationCount = this.analyzeNodeComplexity(loopBody).operations;
        operationCount += loopBodyOperationCount * iterations;

        return { complexity: iterations, operations: operationCount };
    }

    private isForStmt(node: ForStmt | WhileStmt): node is ForStmt {
        return node.kind === 'ForStmt';
    }

    private isWhileStmt(node: ForStmt | WhileStmt): node is WhileStmt {
        return node.kind === 'WhileStmt';
    }

    private evaluateConditionIterations(conditionNode: ASTNode): NodeAnalysisResult {
        let operationCount = 0;

        if (conditionNode.kind === 'BinaryOperator') {
            const binaryOperatorNode = conditionNode as BinaryOperator;

            // Evaluate left and right expressions
            const leftResult = this.evaluateExpression(conditionNode.inner[0]);
            const rightResult = this.evaluateExpression(conditionNode.inner[1]);

            // Log evaluated values
            this.outputChannel.appendLine(`Condition: ${binaryOperatorNode.opcode}, Left Value: ${leftResult.value}, Right Value: ${rightResult.value}`);

            // Ensure left and right results are defined before performing operations
            if (leftResult.value !== undefined && rightResult.value !== undefined) {
                operationCount += leftResult.operations + rightResult.operations;

                switch (binaryOperatorNode.opcode) {
                    case '<':
                        return { complexity: Math.max(0, rightResult.value - leftResult.value), operations: operationCount };
                    case '<=':
                        return { complexity: Math.max(0, rightResult.value - leftResult.value + 1), operations: operationCount };
                    case '>':
                        return { complexity: Math.max(0, leftResult.value - rightResult.value), operations: operationCount };
                    case '>=':
                        return { complexity: Math.max(0, leftResult.value - rightResult.value + 1), operations: operationCount };
                    case '==':
                        return { complexity: leftResult.value === rightResult.value ? 1 : 0, operations: operationCount };
                    case '!=':
                        return { complexity: leftResult.value !== rightResult.value ? 1 : 0, operations: operationCount };
                }
            }
        }

        return { complexity: 0, operations: operationCount }; // Return 0 if no valid evaluation is possible
    }


    private evaluateExpression(node: ASTNode): NodeAnalysisResult {
        // If it's a literal value
        if (node.kind === 'IntegerLiteral') {
            return { complexity: 0, value: Number.parseInt((node as IntegerLiteral).value), operations: 1 }; // Assuming IntegerLiteral has a 'value' property
        }

        // If it's a variable reference
        if (node.kind === 'DeclRefExpr') {
            return this.getVariableValue((node as DeclRefExpr));
        }

        // Handle implicit casts
        if (node.kind === 'ImplicitCastExpr' && node.inner.length > 0) {
            return this.evaluateExpression((node as ImplicitCastExpr).inner[0]);
        }

        // If the node is a binary operator, recursively evaluate both sides
        if (node.kind === 'BinaryOperator') {
            const leftResult = this.evaluateExpression(node.inner[0]);
            const rightResult = this.evaluateExpression(node.inner[1]);
            const binaryOperationResult = this.evaluateBinaryOperation((node as BinaryOperator).opcode, leftResult.complexity, rightResult.complexity);
            return { complexity: binaryOperationResult, operations: leftResult.operations + rightResult.operations + 1 };
        }

        return { complexity: 0, operations: 0 }; // Return 0 if it can't be evaluated
    }

    private evaluateBinaryOperation(opcode: string, leftValue: number, rightValue: number): number {
        switch (opcode) {
            case '+':
                return leftValue + rightValue;
            case '-':
                return leftValue - rightValue;
            case '*':
                return leftValue * rightValue;
            case '/':
                return rightValue !== 0 ? leftValue / rightValue : 0; // Avoid division by zero
            case '%':
                return leftValue % rightValue;
            // Add more cases as needed
            default:
                return 0; // Unknown operation
        }
    }

    private analyzeFunctionCall(node: CallExpr): NodeAnalysisResult {
        return { complexity: 2, operations: 1 };  // Placeholder complexity for function calls
    }

    private analyzeBinaryOperator(binaryOp: BinaryOperator): NodeAnalysisResult {
        let complexity = 0;
        let operations = 0;

        switch (binaryOp.opcode) {
            case '&&':
            case '||':
                complexity += 1;
                operations += 1;
                break;
            case '+':
            case '-':
            case '*':
            case '/':
                complexity += 0.5;
                operations += 1;
                break;
        }

        return { complexity, operations };
    }

    private analyzeConditional(node: IfStmt): NodeAnalysisResult {
        const conditionResult = this.analyzeNodeComplexity(node.inner[0]);
        const trueBlockResult = this.analyzeNodeComplexity(node.inner[1]);
        const falseBlockResult = node.inner[2] ? this.analyzeNodeComplexity(node.inner[2]) : { complexity: 0, operations: 0 };

        return {
            complexity: Math.max(trueBlockResult.complexity, falseBlockResult.complexity) + conditionResult.complexity,
            operations: conditionResult.operations + trueBlockResult.operations + falseBlockResult.operations
        };
    }

    private evaluateIncrement(node: ASTNode): NodeAnalysisResult {
        this.outputChannel.appendLine(`${JSON.stringify(node)}`);

        // Handle post-increment and pre-increment (++i or i++)
        if (node.kind === 'UnaryOperator' && node.inner.length === 1) {
            const operand = node.inner[0]; // This is the variable being incremented
            if ((node as any).opcode === '++' || (node as any).opcode === '--') {
                return { complexity: 1, operations: 1 }; // Increment or decrement operation
            }
        }

        // If it's a BinaryOperator case (for statements like i = i + 1)
        if (node.kind === 'BinaryOperator' && node.inner.length === 2) {
            const left = node.inner[0];
            const right = node.inner[1];
            return { complexity: 1, operations: 1 };
        }

        return { complexity: 0, operations: 0 }; // Return 0 if no valid increment operation is found
    }


    private getVariableValue(node: ASTNode): NodeAnalysisResult {
        // Example to demonstrate fetching variable values
        if (node.kind === 'DeclRefExpr') {
            const varName = (node as DeclRefExpr).referencedDecl.name; // Assuming DeclRefExpr has a name property
            const varValue = this.variableTable.get(varName) || 0; // Get value from variable table or default to 0
            return { complexity: 0, value: varValue, operations: 1 }; // Assuming complexity is based on variable value
        }
        return { complexity: 0, value: 0, operations: 0 }; // Default return
    }
}
