import { exec } from "child_process";
import { promisify } from "util";
import * as vscode from 'vscode';
import { AnalysisResult } from "../models/analysis-result.model";
import { BinaryOperator, CallExpr, DeclRefExpr, DeclStmt, ForStmt, IfStmt, ImplicitCastExpr, IntegerLiteral, VarDecl, WhileStmt } from "../models/ast-node-kind.model";
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
    private operationsCount: number[] = [];
    private currentN = 0;

    constructor() {
        this.complexity = 0;
        this.variableTable = new Map<string, number>();
        this.outputChannel = vscode.window.createOutputChannel('CodePerformanceDebugger');
    }

    public async analyze(code: string, runs?: number[]): Promise<AnalysisResult> {
        const results: AnalysisResult[] = [];
        const operationCounts: number[] = [];
        const fixedRuns = runs ?? [10000000, 100000000, 1000000000, 10000000000, 100000000000];

        for (const n of (fixedRuns)) {
            const filePath = vscode.window.activeTextEditor?.document.fileName;
            this.currentN = n;
            this.variableTable = new Map<string, number>();
            this.complexity = 0;
            if (filePath) {
                try {
                    const ast = await this.getAST(filePath);
                    if (ast) {
                        this.complexity = this.traverse(ast);
                        operationCounts.push(this.complexity);
                        this.outputChannel.appendLine(`Operations: ${operationCounts}`);
                        results.push({ bigO: this.complexity.toString(), message: `Analysis completed for n=${n}.` });
                    } else {
                        vscode.window.showWarningMessage('No AST available for analysis.');
                    }
                } catch (error) {
                    console.error('Error during analysis:', error);
                }
            } else {
                vscode.window.showWarningMessage('No active file to analyze.');
            }
        }

        // Log operation counts for debugging
        console.log('Operation Counts:', operationCounts);

        // Now categorize based on the operation counts
        //const growthCategory = this.categorizeGrowthUsingLagrange(operationCounts, fixedRuns);
        // const growthCategory = this.categorizeGrowthUsingRawRates(operationCounts, fixedRuns);
        const growthCategory = this.categorizeGrowth(operationCounts, fixedRuns);

        return { bigO: growthCategory, message: '' };
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
        this.operationsCount.push(operations);
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
                this.handleVariableDeclaration(node as VarDecl);
                operationCount += 1;
                nodeComplexity += 1;
                break;
            case 'CompoundStmt':
                // Check if 'inner' is defined and iterable
                if (Array.isArray(node.inner)) {
                    for (const innerNode of node.inner) {
                        const result = this.analyzeNodeComplexity(innerNode);
                        nodeComplexity += result.complexity;
                        operationCount += result.operations;
                    }
                } else {
                    // Handle case where 'inner' is not iterable or undefined
                    this.outputChannel.appendLine("Warning: 'inner' is not iterable for CompoundStmt.");
                    nodeComplexity += 1; // Default complexity for other nodes
                    operationCount += 1; // Count the operation for visiting this node
                }
                break;
            default:
                nodeComplexity += 1; // Default complexity for other nodes
                operationCount += 1; // Count the operation for visiting this node
                break;
        }

        return { complexity: nodeComplexity * operationCount, operations: operationCount };
    }

    private handleVariableDeclaration(node: VarDecl): void {
        const varName = node.name;  // Assuming `VarDecl` has a `name` property
        let varValue = this.currentN;  // Default value is `currentN`

        // If the variable has an initializer, handle it
        if (node.inner && node.inner?.length > 0 && node.inner[0].kind === 'IntegerLiteral') {
            this.evaluateExpression(node.inner[0], varName);
        } else {
            this.variableTable.set(varName, varValue);
        }
    }



    private getIterationComplexity(node: ForStmt | WhileStmt): NodeAnalysisResult {

        if (this.isExponentialPatternInLoop(node)) {
            const exp = this.currentN.toString().length;
            return { complexity: Math.pow(2, exp * exp), operations: Math.pow(2, exp * exp) };
        }

        if (this.isForStmt(node)) {
            return this.analyzeForStmt(node);
        }

        if (this.isWhileStmt(node)) {
            return this.analyzeWhileStmt(node);
        }

        throw new Error("Unsupported node type");
    }

    private isExponentialPatternInLoop(node: ForStmt | WhileStmt): boolean {
        if (node.kind === 'ForStmt' || node.kind === 'WhileStmt') {
            const [loopInit, , loopCondition, loopIncrement, loopBody] = node.inner;

            let loopControlVar: string | null = null;

            // Check initialization to detect the control variable and any exponential growth
            if (loopInit.kind === 'BinaryOperator') {
                const initOp = loopInit as BinaryOperator;
                if (initOp.opcode === '=') {
                    const leftOperand = initOp.inner[0];
                    const rightOperand = initOp.inner[1];

                    // If the left operand is a declaration reference, we identify it as the control variable
                    if (leftOperand.kind === 'DeclRefExpr') {
                        loopControlVar = (leftOperand as DeclRefExpr).referencedDecl.name; // Store the control variable's name
                    }

                    // Check if the right operand involves an exponential operation (shift or multiplication)
                    if (rightOperand.kind === 'BinaryOperator') {
                        const rightOp = rightOperand as BinaryOperator;
                        if (rightOp.opcode === '<<' || rightOp.opcode === '>>' || rightOp.opcode === '*') {
                            return true;  // Exponential initialization like `controlVar = 1 << n`, `controlVar = controlVar * 2`
                        }
                    }
                }
            }

            // Handle case where the variable is declared without initialization
            if (loopInit.kind === 'DeclStmt') {
                const declStmt = loopInit as DeclStmt;
                for (const decl of declStmt.inner) {
                    if (decl.kind === 'VarDecl') {
                        loopControlVar = (decl as VarDecl).name;
                    }
                }
            }

            // If no control variable found in initialization, return false (no exponential pattern detected)
            if (!loopControlVar) { return false; }

            // Check the loop condition to see if it involves an exponential pattern (bit-shift or multiplication)
            if (loopCondition.kind === 'BinaryOperator') {
                const conditionOp = loopCondition as BinaryOperator;
                if (conditionOp.opcode === '<' || conditionOp.opcode === '>=' || conditionOp.opcode === '<=') {
                    const leftOperand = conditionOp.inner[0];
                    const rightOperand = conditionOp.inner[1];

                    // Check if the control variable is involved in an exponential pattern in the condition
                    if (leftOperand.kind === 'DeclRefExpr' && (leftOperand as DeclRefExpr).referencedDecl.name === loopControlVar) {
                        // Check for shift or multiplication patterns in the right operand
                        if (rightOperand.kind === 'BinaryOperator') {
                            const rightOp = rightOperand as BinaryOperator;
                            if (rightOp.opcode === '<<' || rightOp.opcode === '>>' || rightOp.opcode === '*' || rightOp.opcode === '+') {
                                return true;  // Exponential condition like `controlVar < (1 << n)` or `controlVar < (controlVar * 2)`
                            }
                        }

                        // Specifically check for exponential iteration count (2^n or 1 << n)
                        if (rightOperand.kind === 'BinaryOperator' && (rightOperand as BinaryOperator).opcode === '<<') {
                            const shiftOp = rightOperand as BinaryOperator;
                            const shiftLeftOperand = shiftOp.inner[0] as IntegerLiteral;
                            const shiftRightOperand = shiftOp.inner[1] as DeclRefExpr;

                            // If we are comparing controlVar to 2^n (1 << n)
                            if (shiftLeftOperand.kind === 'IntegerLiteral' && shiftLeftOperand.value === '1' &&
                                shiftRightOperand.kind === 'DeclRefExpr' &&
                                shiftRightOperand.referencedDecl.name === loopControlVar) {
                                return true;  // Exponential pattern like `i < (1 << n)`
                            }
                        }
                    }
                }
            }

            // Check the loop increment for exponential growth patterns (shift or multiplication)
            if (loopIncrement.kind === 'BinaryOperator') {
                const incrementOp = loopIncrement as BinaryOperator;
                if (incrementOp.opcode === '+') {
                    const leftOperand = incrementOp.inner[0];
                    const rightOperand = incrementOp.inner[1];

                    // Check if the increment involves an exponential growth pattern (shift or multiplication)
                    if (leftOperand.kind === 'DeclRefExpr' && (leftOperand as DeclRefExpr).referencedDecl.name === loopControlVar) {
                        if (rightOperand.kind === 'BinaryOperator') {
                            const rightOp = rightOperand as BinaryOperator;
                            if (rightOp.opcode === '<<' || rightOp.opcode === '>>' || rightOp.opcode === '*') {
                                return true;  // Exponential increment like `controlVar += (1 << n)` or `controlVar += (controlVar * 2)`
                            }
                        }
                    }
                }
            }

            // Check the loop body for exponential patterns affecting the control variable
            if (loopBody.kind === 'CompoundStmt') {
                for (const innerNode of loopBody.inner) {
                    if (this.containsExponentialPatternInBody(innerNode, loopControlVar)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    private containsExponentialPatternInBody(node: ASTNode, loopControlVar: string): boolean {
        if (node.kind === 'BinaryOperator') {
            const opNode = node as BinaryOperator;
            const operator = opNode.opcode;


            // Check if the left operand is the control variable or involves an integer literal or implicit cast
            const leftOperand = opNode.inner[0];
            const rightOperand = opNode.inner[1];

            // Check if the left operand is the control variable (DeclRefExpr, IntegerLiteral, ImplicitCastExpr)
            if (this.isControlVariable(leftOperand, loopControlVar) || this.isControlVariable(rightOperand, loopControlVar)) {
                this.outputChannel.appendLine(`Operator: ${operator}`);

                // Check for assignment, addition, or exponential operations (shift, multiplication)
                if (operator === '=' || operator === '+' || operator === '*' || operator === '<<' || operator === '>>') {
                    this.outputChannel.appendLine(`Exponential pattern detected with operator: ${operator}`);
                    return true;  // Exponential pattern like `controlVar = controlVar * 2`, `controlVar <<= 1`
                }
            }
        }

        // Recursively check inner nodes for exponential patterns in the body
        if (node.inner && node.inner.length > 0) {
            for (const innerNode of node.inner) {
                if (this.containsExponentialPatternInBody(innerNode, loopControlVar)) {
                    return true;
                }
            }
        }

        return false;
    }

    // Helper method to check if an operand is the control variable or involves an IntegerLiteral or ImplicitCastExpr
    private isControlVariable(operand: ASTNode, loopControlVar: string): boolean {
        if (operand.kind === 'DeclRefExpr') {
            // Direct variable reference
            return (operand as DeclRefExpr).referencedDecl.name === loopControlVar;
        }

        if (operand.kind === 'IntegerLiteral') {
            // Direct integer literal; we don't normally expect this for a control variable but handle it just in case
            return false;
        }

        if (operand.kind === 'ImplicitCastExpr') {
            // Check inside the cast expression
            const castOperand = (operand as ImplicitCastExpr).inner[0];
            return this.isControlVariable(castOperand, loopControlVar);
        }

        // If it's none of the above, it's not the control variable
        return false;
    }


    private analyzeForStmt(node: ForStmt): NodeAnalysisResult {
        let iterations = 1;
        let operationCount = 0;

        const [init, , condition, increment, loopBody] = node.inner;

        // Consider `n` for condition iterations
        const conditionResult = this.evaluateConditionIterations(condition);
        iterations = Math.max(conditionResult.complexity, 1);


        // Increment behavior might depend on `n` as well
        const incrementResult = this.evaluateIncrement(increment);
        operationCount += incrementResult.complexity * incrementResult.operations;


        // Adjust based on `n`
        if (iterations > 0) {
            iterations = Math.max(1, Math.floor(iterations / (operationCount || 1)));
        }

        // Multiply operation count by iterations (account for `n`)
        const loopBodyOperationCount = this.analyzeNodeComplexity(loopBody).operations;
        operationCount += loopBodyOperationCount * iterations; // Body * iterations
        operationCount += this.analyzeNodeComplexity(init).operations; // Add initialization

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

            // Ensure left and right results are defined before performing operations
            if (leftResult.value !== undefined && rightResult.value !== undefined) {
                operationCount += 1;

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


    private evaluateExpression(node: ASTNode, name?: string): NodeAnalysisResult {
        // If it's a literal value (IntegerLiteral)
        if (node.kind === 'IntegerLiteral') {
            const value = Number.parseInt((node as IntegerLiteral).value);
            const literalName = `literal_${value}`;
            this.variableTable.set(name ?? literalName, value);

            return { complexity: 0, value: value, operations: 1 };  // 1 operation for evaluating the literal value
        }

        // Handle other expressions (variables, casts, binary operators, etc.)
        if (node.kind === 'DeclRefExpr') {
            return this.getVariableValue((node as DeclRefExpr));
        }

        // Handle implicit casts (evaluate the inner expression)
        if (node.kind === 'ImplicitCastExpr' && node.inner.length > 0) {
            return this.evaluateExpression((node as ImplicitCastExpr).inner[0]);
        }

        // If the node is a binary operator, recursively evaluate both sides
        if (node.kind === 'BinaryOperator') {
            const leftResult = this.evaluateExpression(node.inner[0]);
            const rightResult = this.evaluateExpression(node.inner[1]);
            const binaryOperationResult = this.evaluateBinaryOperation((node as BinaryOperator).opcode, leftResult.value ?? 0, rightResult.value ?? 0);
            return { complexity: binaryOperationResult, operations: leftResult.operations + rightResult.operations + 1 };
        }

        return { complexity: 0, operations: 0 };  // Default case: return 0 if it can't be evaluated
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


    private getVariableValue(node: DeclRefExpr): NodeAnalysisResult {
        const varName = node.referencedDecl.name;
        const varValue = this.variableTable.get(varName);

        // If the variable or literal is not found in the table, assume a default value
        const finalValue = varValue === undefined || varValue === null ? this.currentN : varValue;

        return { complexity: 0, value: finalValue, operations: 1 };  // Return value and operations (1 for lookup)
    }


    private categorizeGrowth(arr: number[], sizes: number[]): string {
        const n = arr.length;

        if (n < 2) {
            return "Not enough elements to determine growth";
        }

        const growthRatios: number[] = [];
        const inputGrowthRatios: number[] = [];

        // Calculate growth ratios for operations and input sizes
        for (let i = 1; i < n; i++) {
            const growthRate = arr[i] / arr[i - 1];
            const sizeGrowth = sizes[i] / sizes[i - 1];

            growthRatios.push(growthRate);
            inputGrowthRatios.push(sizeGrowth);
        }

        // Now we compare the growth rate of operations with the growth rate of input sizes.
        let totalGrowthDifference = 0;

        for (let i = 0; i < growthRatios.length; i++) {
            const ratioDifference = growthRatios[i] / inputGrowthRatios[i];
            totalGrowthDifference += ratioDifference;
        }

        const avgGrowthDifference = Math.round(totalGrowthDifference / growthRatios.length);

        // Log the average growth difference for debugging
        this.outputChannel.appendLine(`Average Growth Difference: ${avgGrowthDifference}`);

        // Step 4: Categorize based on the average growth ratio
        if (avgGrowthDifference < 0.01) {
            return "O(1) - Constant time";
        } else if (avgGrowthDifference < 1) {
            return "O(log n) - Logarithmic time";
        } else if (avgGrowthDifference < 10) {
            return "O(n) - Linear time";
        } else if (avgGrowthDifference < 100) {
            return "O(n²) - Quadratic time";
        } else if (avgGrowthDifference < 1001) {
            return "O(n³) - Cubic time";
        } else if (avgGrowthDifference < 1000001) {
            return "O(2^n) or greater - Exponential time";  // Exponential time complexity
        } else {
            return "O(n^k) - Polynomial time";  // Catch-all for polynomial growth
        }
    }

}
