export type SubComposition = {
    /** Composition id (also the scene-scoped class prefix; cls === compId). */
    compId: string;
    /** This slide's VO line ids, in narration order (from spec.json). */
    voIds: string[];
    /** Markup inside the page wrapper. */
    bodyHtml: string;
    /** Tween statements; run after the entrance (page, at, atIndex, lineId in scope). */
    bodyJs?: string;
    /** Page-exit tween statement(s); run after the body, anchored to scene end (`dur` in scope). */
    exitJs?: string;
    /** Page-entrance tween statement(s); `page` (the page wrapper) is in scope. */
    entranceJs: string;
    /** Classes on the page wrapper besides `${compId}-page` (e.g. "mc-page" or "bframe bf-cover"). */
    pageClasses: string;
    /** Inline style on the page wrapper (e.g. the BLOCK ground background). */
    pageStyle?: string;
    /** Extra scoped CSS appended after the `.${compId}-root` rule. */
    bodyCss?: string;
    /** HTML before the page wrapper inside the root (e.g. in-slide decorations). */
    preBody?: string;
    /** HTML inserted right after the composition-id div opens (e.g. extra <link>s). */
    extraHead?: string;
};
/**
 * Assemble one sub-composition HTML document. The 4 stock themes call this with
 * pageClasses "mc-page"(+center) and no extraHead/pageStyle, reproducing the
 * pre-extraction bytes exactly; the BLOCK builder passes a frame ground wrapper.
 */
export declare const wrapSubComposition: (parts: SubComposition) => string;
