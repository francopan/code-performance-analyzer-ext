import { NodeKind } from "../enums/node-kind.enum";

export interface ASTNodeLocation { offset: number, line: number, col: number, tokLen: number }

export interface ASTNode {
    id: string;
    kind: NodeKind;
    range?: {
        begin: ASTNodeLocation,
        end: ASTNodeLocation
    }
    inner: ASTNode[];
}