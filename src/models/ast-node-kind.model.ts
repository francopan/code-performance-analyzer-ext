import { NodeKind } from "../enums/node-kind.enum";
import { ASTNode, ASTNodeLocation } from "./ast-node.model";

type ValueCategory = 'prvalue' | 'lvalue' | string;
type NodeType =
    | { qualType: 'int' }
    | { qualType: 'char' }
    | { qualType: 'unsigned long' }
    | { qualType: 'unsigned int' }
    | { qualType: 'float' }
    | { qualType: 'double' }
    | { qualType: 'void' }
    | { qualType: 'bool' }
    | { qualType: 'long' }
    | { qualType: 'short' }
    | { qualType: 'signed char' }
    | { qualType: 'unsigned char' }
    | { qualType: 'wchar_t' }
    | { qualType: string }; // For other custom or undefined types
type CastKind = 'LValueToRValue' | string;

export interface OtherVariant extends ASTNode {
    kind: NodeKind;
}

export interface NamespaceDecl extends ASTNode {
    name?: string;
}

export interface EnumDecl extends ASTNode {
    name?: string;
}

export interface EnumConstantDecl extends ASTNode {
    name: string;
}

export interface ForStmt extends ASTNode { }
export interface WhileStmt extends ASTNode { }
export interface IfStmt extends ASTNode { }

export interface IntegerLiteral extends ASTNode {
    type: NodeType;
    value: string;
    valueCategory: string;
}

export interface ReturnStmt extends ASTNode {
}

export interface DeclRefExpr extends ASTNode {
    referencedDecl: VarDecl;
    type: NodeType;
    valueCategory: string;
}

export interface VarDecl extends ASTNode {
    init: string;
    isUsed: boolean;
    loc: ASTNodeLocation;
    name: string;
    type: NodeType;
}


export interface ImplicitCastExpr extends ASTNode {
    castKind: CastKind;
    type: NodeType;
    valueCategory: ValueCategory;
}

export interface StringLiteral extends ASTNode {
    type: NodeType;
    value: string;
    valueCategory: ValueCategory;
}

export interface CallExpr extends ASTNode {
    type: NodeType;
    valueCategory: ValueCategory;
}

export interface ParenExpr extends ASTNode {
    type: NodeType;
    valueCategory: ValueCategory;
}

export interface UnaryExprOrTypeTraitExpr extends ASTNode {
    name: string;
    type: NodeType;
    valueCategory: ValueCategory;
}

export interface ArraySubscriptExpr extends ASTNode {
    name: string;
    type: NodeType;
    valueCategory: ValueCategory;
}

export interface BinaryOperator extends ASTNode {
    opcode: string;
    type: NodeType;
    valueCategory: ValueCategory;
}

export interface UnaryOperator extends ASTNode {
    opcode: string;
    type: NodeType;
    valueCategory: ValueCategory;
}


export interface InitListExpr extends ASTNode {
    type: NodeType;
    valueCategory: ValueCategory;
}

export interface DeclStmt extends ASTNode { }

export interface CompoundStmt extends ASTNode { }