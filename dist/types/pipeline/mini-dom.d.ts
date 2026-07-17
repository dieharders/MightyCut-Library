export type ElementNode = {
    type: "element";
    tag: string;
    /** Attributes in source order. */
    attrs: Record<string, string>;
    children: DomNode[];
};
export type TextNode = {
    type: "text";
    text: string;
};
export type CommentNode = {
    type: "comment";
    text: string;
};
export type DomNode = ElementNode | TextNode | CommentNode;
/** Parse an HTML fragment into a flat list of top-level nodes. */
export declare const parseFragment: (html: string) => DomNode[];
/** Serialize a node (or list) back to HTML. */
export declare const serialize: (node: DomNode | DomNode[]) => string;
export declare const isElement: (n: DomNode) => n is ElementNode;
/** Deep clone a node. */
export declare const cloneNode: <T extends DomNode>(n: T) => T;
/** All descendant elements (and self) matching the predicate, depth-first. */
export declare const findAll: (node: DomNode | DomNode[], pred: (el: ElementNode) => boolean) => ElementNode[];
/** First descendant element (or self) matching the predicate. */
export declare const find: (node: DomNode | DomNode[], pred: (el: ElementNode) => boolean) => ElementNode | null;
/** Replace an element's children with a single text node. */
export declare const setText: (el: ElementNode, text: string) => void;
/** Remove every element matching the predicate from the tree (in place). */
export declare const removeWhere: (nodes: DomNode[], pred: (el: ElementNode) => boolean) => void;
/** Convenience: attribute-equality predicate. */
export declare const attrEq: (name: string, value: string) => (el: ElementNode) => boolean;
/** Convenience: attribute-present predicate. */
export declare const hasAttr: (name: string) => (el: ElementNode) => boolean;
