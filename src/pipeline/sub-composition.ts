// The HyperFrames sub-composition wrapper — the load-bearing render contract
// shared by the per-kind slide templates (slide-templates.ts) and the BLOCK
// frame builder (frame-builder.ts).
//
// Every compositions/sNN-<id>.html is a <template>-wrapped data-composition-id
// doc whose <script> reads BARE __hyperframes.getVariables() -> {dur, leadIn,
// lines}, defines at()/atIndex()/lineId(), builds ONE paused GSAP timeline, and
// registers window.__timelines["sNN-<id>"]. Sub-compositions are imported into
// the root document (the runtime uses document.importNode, not iframes), so all
// markup/CSS lives in one shared DOM — callers MUST scope their classes under
// the composition id to avoid cross-instance leaks.
//
// This was extracted verbatim from slide-templates.ts so the four stock themes
// stay byte-identical; a byte-stability check in generators.test.ts guards it.

/** Safe string literal for inline <script> (also breaks "</script" sequences). */
const js = (s: string): string => JSON.stringify(s).replace(/<\//g, "<\\/");

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
export const wrapSubComposition = (parts: SubComposition): string => {
  const { compId, voIds, bodyHtml, entranceJs, pageClasses } = parts;
  const cls = compId;
  const bodyCss = parts.bodyCss ?? "";
  const bodyJs = parts.bodyJs ?? "";
  const exitJs = parts.exitJs ?? "";
  const exitBlock = exitJs ? `\n          ${exitJs}` : "";
  const pageStyle = parts.pageStyle ? ` style="${parts.pageStyle}"` : "";
  const preBody = parts.preBody ?? "";
  const extraHead = parts.extraHead ?? "";

  return `<!doctype html>
<html
  lang="en"
  data-composition-variables='[
    {"id":"dur","type":"number","label":"Scene duration (s)","default":6},
    {"id":"leadIn","type":"number","label":"Lead-in (s)","default":0.4},
    {"id":"lines","type":"string","label":"VO line offsets JSON","default":"{}"}
  ]'
>
  <body>
    <template id="${compId}-template">
      <div data-composition-id="${compId}" data-width="1920" data-height="1080">${extraHead}
        <style>
          .${cls}-root { position: absolute; inset: 0; overflow: hidden; }${bodyCss}
        </style>
        <div class="${cls}-root">
          ${preBody}
          <div class="${pageClasses} ${cls}-page"${pageStyle}>${bodyHtml}
          </div>
        </div>
        <script>
          // Bare __hyperframes/document/gsap — the bundler injects per-instance
          // scoped versions as function parameters. Never use window.* forms.
          var v =
            typeof __hyperframes !== "undefined" && __hyperframes && __hyperframes.getVariables
              ? __hyperframes.getVariables()
              : {};
          var lines = {};
          try {
            lines = typeof v.lines === "string" ? JSON.parse(v.lines || "{}") : v.lines || {};
          } catch (e) { lines = {}; }
          var dur = typeof v.dur === "number" ? v.dur : 6;
          var leadIn = typeof v.leadIn === "number" ? v.leadIn : 0.4;
          // Narration sync: scene-local start (s) of a VO line, with fallback.
          var at = function (id, fb) { return lines[id] != null ? lines[id] : fb != null ? fb : leadIn; };
          var lineStarts = Object.keys(lines).map(function (k) { return lines[k]; });
          var atIndex = function (n) {
            if (!lineStarts.length) return leadIn + Math.min(n, 3) * 0.45;
            return lineStarts[Math.max(0, Math.min(n, lineStarts.length - 1))];
          };
          // This slide's VO line ids, in narration order (from spec.json).
          var voIds = ${JSON.stringify(voIds)};
          var lineId = function (n) { return voIds[Math.min(n, Math.max(voIds.length - 1, 0))] || ""; };

          var q = function (sel) { return document.querySelector(sel); };
          var qa = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };
          var page = q(".${cls}-page");

          var tl = gsap.timeline({ paused: true });
          ${entranceJs}
${bodyJs}${exitBlock}

          window.__timelines = window.__timelines || {};
          window.__timelines[${js(compId)}] = tl;
        </script>
      </div>
    </template>
  </body>
</html>
`;
};
