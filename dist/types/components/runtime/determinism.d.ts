/** Throw if `js` contains a banned non-deterministic token (outside string literals). */
export declare const scrubDeterminism: (js: string, where?: string) => void;
