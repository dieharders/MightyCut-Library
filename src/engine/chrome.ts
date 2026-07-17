// Gallery + editor chrome — the styling for the showcase gallery cards / param
// tables / child editors (SHOWCASE_CHROME) and the deck editor toolbar + captions
// (EDITOR_CHROME), ported verbatim from the harness commands so the engine carries
// its own look. Injected into the mount root (Shadow DOM) by mountShowcase/mountEditor.
// Colors reference the theme :root tokens (injected alongside) with hard fallbacks.

export const SHOWCASE_CHROME = `
:root { color-scheme: light; }
* { box-sizing: border-box; }
body { margin: 0; font-family: var(--disp, "Inter", system-ui, sans-serif); background: var(--offwhite, #fffdf5); color: var(--black, #000); }

/* BLOCKFRAME header band (ported from the styleguide .foot) */
.bf-header { padding: 40px 48px; background: var(--black, #000); color: var(--white, #fff); display: flex; justify-content: space-between; align-items: center; gap: 32px; flex-wrap: wrap; }
.bf-wordmark { font-family: var(--disp, "Inter", sans-serif); font-weight: 900; text-transform: uppercase; letter-spacing: -0.03em; font-size: 34px; }
.bf-desc { font-family: var(--mono, "Space Grotesk", ui-monospace, monospace); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; font-size: 12px; color: #aaa; max-width: 520px; text-align: right; line-height: 1.5; }

section { padding: 44px 48px; border-bottom: 4px solid var(--black, #000); }
.sec-head { display: flex; align-items: center; gap: 20px; margin-bottom: 30px; }
.sec-head h2 { font-family: var(--disp, "Inter", sans-serif); font-weight: 900; text-transform: uppercase; letter-spacing: -0.03em; font-size: 40px; line-height: 1; margin: 0; }
.sec-head .sp { flex: 1; height: 4px; background: var(--black, #000); }

.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(520px, 1fr)); gap: 24px; }
.grid--full { grid-template-columns: 1fr; } /* a single full-width card (e.g. the HUD frame) */
.card { background: var(--white, #fff); border: 3px solid var(--black, #000); box-shadow: 6px 6px 0 var(--black, #000); padding: 16px; }
.card-head { display: flex; align-items: baseline; gap: 10px; margin-bottom: 10px; }
.card-name { font-family: var(--disp, "Inter", sans-serif); font-weight: 800; text-transform: uppercase; font-size: 17px; }
.card-kind { font-family: var(--mono, "Space Grotesk", monospace); font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: #888; }
.stage { border: 2px solid var(--black, #000); background: #fafafa; overflow: hidden; }
.stage--frame { width: 100%; aspect-ratio: 16/9; position: relative; }
.stage--frame .stage-inner { position: absolute; top: 0; left: 0; width: 1920px; height: 1080px; transform-origin: top left; }
.stage--frame .stage-inner > div { position: absolute; inset: 0; }
.stage--chrome { background: var(--blue, #c0f7fe); }
.stage--comp { width: 100%; aspect-ratio: 16/9; display: grid; place-items: center; }
.stage--comp .stage-inner { container-type: size; width: 100%; height: 100%; position: relative; }
.stage--comp .stage-inner > div { position: absolute; inset: 0; display: grid; place-items: center; }
.err { color: #c0392b; font-size: 12px; min-height: 16px; margin-top: 6px; font-family: var(--mono, ui-monospace, monospace); }

.params { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
.params tr { border-top: 1px solid #eee; }
.p-name { padding: 6px 8px 6px 0; vertical-align: top; width: 42%; }
.p-name code { font-family: var(--mono, monospace); font-weight: 700; }
.p-desc { color: #777; font-weight: 400; margin-top: 2px; }
.p-input { padding: 6px 0; }
.p-input input, .p-input select { width: 100%; padding: 4px 6px; border: 1px solid #bbb; font: inherit; font-size: 12px; }

/* Palette — block swatch chrome */
.swatches { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 24px; }
.sw { border: 4px solid var(--black, #000); background: var(--white, #fff); box-shadow: 8px 8px 0 var(--black, #000); }
.sw .chip { height: 120px; border-bottom: 4px solid var(--black, #000); }
.sw .meta { padding: 14px 16px; }
.sw .name { font-family: var(--disp, "Inter", sans-serif); font-weight: 800; text-transform: uppercase; letter-spacing: -0.01em; font-size: 18px; }
.sw .hex { font-family: var(--mono, monospace); font-weight: 500; font-size: 12px; letter-spacing: 0.04em; margin-top: 6px; }

/* Typography */
.type-row { display: grid; grid-template-columns: 220px 1fr; align-items: center; gap: 24px; padding: 22px 0; border-bottom: 4px solid var(--black, #000); }
.type-row:last-child { border-bottom: 0; }
.type-row .tok { font-family: var(--mono, monospace); font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; font-size: 12px; }
.type-row .m { font-family: var(--mono, monospace); font-weight: 500; font-size: 11px; color: #444; margin-top: 8px; line-height: 1.5; }
.type-spec { overflow: hidden; }

/* Frame Rules */
.dos { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
.do-card { border: 4px solid var(--black, #000); box-shadow: 8px 8px 0 var(--black, #000); padding: 32px; }
.do-card.do { background: var(--green, #99e885); }
.do-card.dont { background: var(--white, #fff); }
.do-card h4 { font-family: var(--disp, "Inter", sans-serif); font-weight: 900; text-transform: uppercase; letter-spacing: -0.02em; font-size: 28px; margin: 0 0 18px; }
.do-card ul { list-style: none; margin: 0; padding: 0; }
.do-card li { font-family: var(--disp, "Inter", sans-serif); font-weight: 500; font-size: 15px; line-height: 1.55; padding-left: 26px; position: relative; margin-bottom: 12px; }
.do-card li::before { position: absolute; left: 0; font-family: var(--disp, "Inter", sans-serif); font-weight: 900; }
.do-card.do li::before { content: "+"; }
.do-card.dont li::before { content: "\\00d7"; }

/* Child editor (data entry) */
.child-editor { margin-top: 12px; border-top: 3px solid var(--black, #000); padding-top: 10px; }
.kids-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 8px; flex-wrap: wrap; }
.kids-title { font-family: var(--mono, monospace); font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; font-size: 11px; color: #555; }
.kids-btns { display: flex; gap: 6px; flex-wrap: wrap; }
.kids-add { font-family: var(--mono, monospace); font-weight: 700; text-transform: uppercase; font-size: 11px; border: 2px solid var(--black, #000); background: var(--yellow, #f7cb46); box-shadow: 2px 2px 0 var(--black, #000); padding: 5px 10px; cursor: pointer; }
.kids-add:active { box-shadow: 0 0 0 var(--black, #000); transform: translate(2px, 2px); }
.kids { display: flex; flex-direction: column; gap: 8px; }
.kid { display: flex; align-items: flex-start; gap: 8px; border: 1px solid #ccc; padding: 8px; }
.kid-fields { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 8px; flex: 1; }
.kid-type { grid-column: 1 / -1; justify-self: start; font-family: var(--mono, monospace); font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; font-size: 10px; color: var(--black, #000); background: var(--yellow, #f7cb46); border: 1px solid var(--black, #000); padding: 1px 7px; }
.kid-cell { display: flex; flex-direction: column; gap: 3px; }
.kid-key { font-family: var(--mono, monospace); font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #777; }
.kid-cell input, .kid-cell select { width: 100%; padding: 3px 5px; border: 1px solid #bbb; font: inherit; font-size: 11px; }
.kid-rm { flex-shrink: 0; border: 2px solid var(--black, #000); background: var(--pink, #fe90e8); font-weight: 800; width: 26px; height: 26px; cursor: pointer; line-height: 1; }

/* Ground override control (treatment cards) */
.ground-row { display: flex; align-items: center; gap: 10px; margin-top: 12px; border-top: 3px solid var(--black, #000); padding-top: 10px; }
.ground-label { font-family: var(--mono, monospace); font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; font-size: 11px; color: #555; }
.ground-select { padding: 4px 6px; border: 1px solid #bbb; font: inherit; font-size: 12px; }

/* Transition controls (component + treatment cards) — assign in/out + timing, replay live */
.trans-outer { display: flex; align-items: center; gap: 12px; margin-top: 12px; border-top: 3px solid var(--black, #000); padding-top: 10px; flex-wrap: wrap; }
.trans-title { font-family: var(--mono, monospace); font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; font-size: 11px; color: #555; }
.trans-row { display: flex; gap: 12px; flex-wrap: wrap; }
.trans-field { display: flex; align-items: center; gap: 5px; }
.trans-label { font-family: var(--mono, monospace); font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #777; }
.trans-select { padding: 4px 6px; border: 1px solid #bbb; font: inherit; font-size: 12px; }

@media (max-width: 1100px) {
  .grid { grid-template-columns: 1fr; }
  .dos { grid-template-columns: 1fr; }
  .type-row { grid-template-columns: 1fr; }
}
`;

export const EDITOR_CHROME = `
.toolbar { position: sticky; top: 0; z-index: 50; display: flex; align-items: center; gap: 14px; padding: 14px 24px; background: var(--black,#000); color: var(--white,#fff); border-bottom: 4px solid var(--black,#000); flex-wrap: wrap; }
.tb-title { font-family: var(--disp,"Inter",sans-serif); font-weight: 900; text-transform: uppercase; letter-spacing: -0.02em; font-size: 20px; }
.tb-theme { font-family: var(--mono,"Space Grotesk",monospace); font-size: 12px; letter-spacing: .06em; color: #aaa; text-transform: uppercase; }
.tb-spacer { flex: 1; }
.tb-btn { font-family: var(--mono,monospace); font-weight: 700; text-transform: uppercase; font-size: 12px; border: 2px solid var(--white,#fff); background: transparent; color: var(--white,#fff); padding: 7px 14px; cursor: pointer; }
.tb-btn:hover { background: var(--white,#fff); color: var(--black,#000); }
.tb-btn--primary { background: var(--yellow,#f7cb46); color: var(--black,#000); border-color: var(--black,#000); box-shadow: 3px 3px 0 rgba(255,255,255,.35); }
.tb-msg { padding: 8px 24px; font-family: var(--mono,monospace); font-size: 12px; color: #555; min-height: 16px; background: var(--offwhite,#fffdf5); border-bottom: 1px solid #ddd; }
.tb-msg--err { color: #c0392b; font-weight: 700; }
.grid { padding: 24px; }
/* Captions editor (deck-scene cards) — one text field per VO/caption line */
.vo-editor { margin-top: 12px; border-top: 3px solid var(--black,#000); padding-top: 10px; }
.vo-bar { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 8px; flex-wrap: wrap; }
.vo-title { font-family: var(--mono,monospace); font-weight: 700; text-transform: uppercase; letter-spacing: .06em; font-size: 11px; color: #555; }
.vo-note { font-family: var(--mono,monospace); font-size: 10px; color: #999; }
.vo-list { display: flex; flex-direction: column; gap: 6px; }
.vo-row { display: flex; align-items: center; gap: 8px; }
.vo-key { flex-shrink: 0; width: 74px; font-family: var(--mono,monospace); font-size: 10px; text-transform: uppercase; letter-spacing: .06em; color: #777; }
.vo-input { flex: 1; min-width: 0; padding: 5px 7px; border: 1px solid #bbb; font: inherit; font-size: 12px; }
`;
