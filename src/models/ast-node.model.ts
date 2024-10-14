export interface ASTNodeLocation { offset: number, line: number, col: number, tokLen: number }

export interface ASTNode {
    id: string;
    kind: string;
    range?: {
        begin: ASTNodeLocation,
        end: ASTNodeLocation
    }
    inner: ASTNode[];
}