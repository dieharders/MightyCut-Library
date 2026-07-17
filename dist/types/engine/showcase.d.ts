export type ShowcaseHandle = {
    destroy: () => void;
};
/**
 * Mount the block component gallery into `container` (inside a Shadow DOM for
 * style isolation). Returns a handle whose `destroy()` removes the resize
 * listener and clears the shadow. `themeName` defaults to 'block'.
 */
export declare const mountShowcase: (container: HTMLElement, themeName?: string) => Promise<ShowcaseHandle>;
