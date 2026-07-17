/** Prefix every top-level rule's selector list with `.<root>-root `. */
export declare const scopeCss: (css: string, root: string) => string;
/** Collect + dedupe component CSS by component name (each authored once). */
export declare const collectCss: (parts: {
    name: string;
    css: string;
}[]) => string;
