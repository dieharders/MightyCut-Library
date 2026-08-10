/*
 * MightyCut shared composition library (window.MC).
 *
 * Deterministic helpers for HyperFrames compositions: every animation is a
 * tween on the caller's paused GSAP timeline (seek-driven), never wall-clock
 * or rAF based. No Math.random / Date.now — randomness goes through
 * MC.seededRandom.
 *
 * Conventions:
 *  - Helpers that animate take (tl, target, atSec, opts). `target` should be
 *    an Element / NodeList the CALLER resolved via its own (scoped) document —
 *    inside sub-composition scripts, selector strings resolve against the
 *    global document and can leak across instances.
 *  - All times are SECONDS on the composition's timeline.
 *  - WebGL contexts must be created via MC.glContext (forces antialias: true).
 */
(function () {
  "use strict";

  var MC = {};

  /* ------------------------------------------------------------ random --- */

  /** Deterministic PRNG (mulberry32) seeded by a string. Returns () => [0,1). */
  MC.seededRandom = function (seed) {
    var h = 1779033703 ^ String(seed).length;
    var s = String(seed);
    for (var i = 0; i < s.length; i++) {
      h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    var a = h >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  /* ------------------------------------------------------------- webgl --- */

  /**
   * The ONLY sanctioned way to create a WebGL context: antialiasing is forced
   * on, and preserveDrawingBuffer is enabled so seeked frames capture cleanly.
   */
  MC.glContext = function (canvas, opts) {
    var options = Object.assign({}, opts || {}, {
      antialias: true,
      preserveDrawingBuffer: true,
    });
    return (
      canvas.getContext("webgl2", options) || canvas.getContext("webgl", options)
    );
  };

  /* -------------------------------------------------------------- icons --- */

  // 21-icon set (stroke style: round caps/joins, 24x24 viewBox, strokeWidth 1.8).
  var ICON_PATHS = {
    doc: '<path d="M6 3h7l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M13 3v5h5"/><path d="M8.5 13h7M8.5 16.5h7"/>',
    image:
      '<rect x="4" y="5" width="16" height="14" rx="1.5"/><circle cx="9" cy="10" r="1.6"/><path d="M5 17l4.5-4.5L13 16l3-3 3 3.5"/>',
    email:
      '<rect x="3.5" y="6" width="17" height="12" rx="1.5"/><path d="M4 7l8 6 8-6"/>',
    word: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M5.5 9.5l1.3 5L8.2 11l1.4 3.5L11 9.5"/><path d="M13.5 10h4.5M13.5 12.5h4.5M13.5 15h4.5"/>',
    database:
      '<ellipse cx="12" cy="5.5" rx="7" ry="2.8"/><path d="M5 5.5v6c0 1.6 3.1 2.8 7 2.8s7-1.2 7-2.8v-6"/><path d="M5 11.5v6c0 1.6 3.1 2.8 7 2.8s7-1.2 7-2.8v-6"/>',
    graph:
      '<circle cx="6" cy="7" r="2.4"/><circle cx="18" cy="6" r="2.4"/><circle cx="17" cy="17.5" r="2.4"/><circle cx="7" cy="17" r="2.4"/><path d="M8 7.5l8-1M7.5 9l8.5 7M8.8 16.4l6-1M7.2 15l0-6"/>',
    shield:
      '<path d="M12 3l7 2.5v5c0 5-3.2 8.4-7 10-3.8-1.6-7-5-7-10v-5L12 3Z"/><path d="M9 12l2.2 2.2L15.5 10"/>',
    cloud:
      '<path d="M7.5 18a4 4 0 0 1-.4-7.98A5 5 0 0 1 17 9.5a3.5 3.5 0 0 1 .2 8.5H7.5Z"/>',
    cube: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
    sparkles:
      '<path d="M12 4l1.6 4.2L18 10l-4.4 1.8L12 16l-1.6-4.2L6 10l4.4-1.8L12 4Z"/><path d="M18.5 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2Z"/>',
    chip: '<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M10 7V4M14 7V4M10 20v-3M14 20v-3M7 10H4M7 14H4M20 10h-3M20 14h-3"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    cross: '<path d="M6 6l12 12M18 6L6 18"/>',
    lock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    layers:
      '<path d="M12 3l9 5-9 5-9-5 9-5Z"/><path d="M3 13l9 5 9-5M3 17l9 5 9-5"/>',
    sync: '<path d="M4 11a8 8 0 0 1 13.5-5.3L20 8"/><path d="M20 4v4h-4"/><path d="M20 13a8 8 0 0 1-13.5 5.3L4 16"/><path d="M4 20v-4h4"/>',
    arrowRight: '<path d="M4 12h15M13 6l6 6-6 6"/>',
    users:
      '<circle cx="9" cy="8" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M16 6.2a3 3 0 0 1 0 5.6M16.5 19a5.5 5.5 0 0 0-2.2-4.4"/>',
    gauge: '<path d="M4 18a8 8 0 1 1 16 0"/><path d="M12 18l4-5"/>',
    filter: '<path d="M4 5h16l-6 7v6l-4 2v-8L4 5Z"/>',
  };

  MC.iconNames = Object.keys(ICON_PATHS);

  /** Narrow an untrusted icon name (LLM spec) to a known one, or null. */
  MC.asIconName = function (name) {
    return name && Object.prototype.hasOwnProperty.call(ICON_PATHS, name)
      ? name
      : null;
  };

  /** Inline SVG markup for a named icon. opts: {size, color, strokeWidth}. */
  MC.icon = function (name, opts) {
    var o = opts || {};
    var size = o.size || 24;
    var color = o.color || "currentColor";
    var sw = o.strokeWidth || 1.8;
    var body = ICON_PATHS[name] || ICON_PATHS.sparkles;
    return (
      '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' +
      color + '" stroke-width="' + sw +
      '" stroke-linecap="round" stroke-linejoin="round">' + body + "</svg>"
    );
  };

  /* ------------------------------------------------------ tween helpers --- */

  // A whole-element reveal that got fanned across SEVERAL boxes (applyAnims'
  // display:contents retarget) carries `opts.stagger` — the gsap stagger config —
  // so the boxes cascade instead of firing in lockstep. Single-box reveals never
  // set it, and the key is omitted entirely then (byte/behaviour preserving).
  var withStagger = function (vars, o) {
    if (o && o.stagger) vars.stagger = o.stagger;
    return vars;
  };

  // DESIGN PIXELS -> CANVAS PIXELS.
  //
  // Every tween distance below (a 26px rise, a 140px page slide) is a plain GSAP pixel, and
  // GSAP pixels do NOT follow rem. The render document sets a canvas-derived root font-size
  // (types/canvas.ts rootFontSizePx) so authored rem sizes are a fixed fraction of the
  // frame; without this conversion the MOTION would stay at its 1920-sized travel while the
  // layout around it shrank — a 26px rise is a quarter of a card at 1920 and a third of one
  // at 1280. Passing them through the same ratio keeps travel proportional to the frame.
  //
  // Reading the ratio back off the document, rather than being told it, is what keeps this
  // working in BOTH consumers of this file with no extra plumbing: in the render the root is
  // canvas-derived so the ratio is the canvas scale, and in the browser preview the root is
  // the host's 16px and the scene is laid out in design units, so the ratio is exactly 1 and
  // nothing moves. Deterministic (a static computed style), so the render stays reproducible.
  // MEMOIZED: getComputedStyle flushes pending style, and the root font-size cannot change
  // during a render (it is a static rule in the generated document), so reading it once per
  // scene instead of once per tween keeps this off the per-anim path — the same reason
  // applyAnims memoizes its display:contents lookup.
  var BASE_FONT_PX = 16;
  var remRatio = null;
  var u = function (px) {
    if (remRatio === null) {
      remRatio = 1;
      try {
        var fs = parseFloat(getComputedStyle(document.documentElement).fontSize);
        if (fs > 0) remRatio = fs / BASE_FONT_PX;
      } catch (_e) {
        /* no document (unit tests, non-DOM hosts) — design pixels pass through unchanged */
      }
    }
    return px * remRatio;
  };
  MC.u = u;

  // The same conversion for a RAW GSAP vars object, which is the one way design pixels reach
  // gsap without passing through a factory above: the `from`-style element transitions
  // (transitions.ts's slide-*/fall) put their travel straight into the descriptor's opts as
  // `x`/`y` literals, and applyAnims hands those to tl.from() verbatim. Unconverted, they
  // travelled full 1920-sized distances inside a smaller frame while every MC-factory reveal
  // beside them scaled — the exact split u() exists to prevent.
  //
  // Only the two translate keys. `opacity`/`scale` are unitless and `clipPath: inset(0 100% …)`
  // is already relative, so a non-travel `from` (wipe) must pass through untouched — hence the
  // early return, which also keeps those descriptors byte-identical. A COPY, never a mutation:
  // the showcase replays one descriptor's opts over and over, so scaling in place would compound
  // on every replay. String values ("100%", "+=20") are left alone; only numbers are design px.
  var uVars = function (vars) {
    if (!vars || (typeof vars.x !== "number" && typeof vars.y !== "number")) return vars;
    var out = Object.assign({}, vars);
    if (typeof out.x === "number") out.x = u(out.x);
    if (typeof out.y === "number") out.y = u(out.y);
    return out;
  };
  MC.uVars = uVars;

  // Entrance: fade + rise from below (the old riseIn spring).
  MC.riseIn = function (tl, target, at, opts) {
    var o = opts || {};
    tl.from(
      target,
      withStagger(
        {
          y: u(o.dist != null ? o.dist : 26),
          opacity: 0,
          duration: o.dur != null ? o.dur : 0.65,
          ease: o.ease || "power3.out",
        },
        o,
      ),
      at || 0,
    );
    return tl;
  };

  // Plain fade in.
  MC.fadeIn = function (tl, target, at, opts) {
    var o = opts || {};
    tl.from(
      target,
      withStagger(
        { opacity: 0, duration: o.dur != null ? o.dur : 0.55, ease: o.ease || "power2.out" },
        o,
      ),
      at || 0,
    );
    return tl;
  };

  // Staggered rise for a list of elements.
  MC.staggerIn = function (tl, targets, at, opts) {
    var o = opts || {};
    tl.from(
      targets,
      {
        y: u(o.dist != null ? o.dist : 26),
        opacity: 0,
        duration: o.dur != null ? o.dur : 0.6,
        ease: o.ease || "power3.out",
        stagger: { each: o.each != null ? o.each : 0.25, from: "start" },
      },
      at || 0,
    );
    return tl;
  };

  // Grow a horizontal rule / bar from 0 (expects transform-origin left).
  MC.rule = function (tl, target, at, opts) {
    var o = opts || {};
    tl.fromTo(
      target,
      { scaleX: 0 },
      { scaleX: 1, duration: o.dur != null ? o.dur : 0.8, ease: o.ease || "power3.out" },
      at || 0,
    );
    return tl;
  };

  // Gentle breathing drift during a hold. Finite yoyo repeats (no repeat:-1).
  MC.float = function (tl, target, at, opts) {
    var o = opts || {};
    var dur = o.dur != null ? o.dur : 2.4;
    var hold = o.hold != null ? o.hold : 6;
    var cycles = Math.max(1, Math.ceil(hold / dur));
    tl.to(
      target,
      {
        y: u(o.dy != null ? o.dy : -8),
        duration: dur,
        ease: "sine.inOut",
        yoyo: true,
        repeat: cycles * 2 - 1,
      },
      at || 0,
    );
    return tl;
  };

  // Count a number up in an element's textContent (seek-safe proxy tween).
  MC.countUp = function (tl, el, at, opts) {
    var o = opts || {};
    var to = o.to || 0;
    var decimals = o.decimals || 0;
    var prefix = o.prefix || "";
    var suffix = o.suffix || "";
    var proxy = { v: 0 };
    tl.to(
      proxy,
      {
        v: to,
        duration: o.dur != null ? o.dur : 1.6,
        ease: o.ease || "power2.out",
        onUpdate: function () {
          el.textContent = prefix + proxy.v.toFixed(decimals) + suffix;
        },
      },
      at || 0,
    );
    return tl;
  };

  // Scale + fade entrance (the inline scaleIn used by applyAnims, exposed as a
  // callable so the whole-page transition can use it too).
  MC.scaleIn = function (tl, target, at, opts) {
    var o = opts || {};
    tl.from(
      target,
      {
        scale: o.from != null ? o.from : 0.9,
        opacity: 0,
        duration: o.dur != null ? o.dur : 0.6,
        ease: o.ease || "back.out(1.5)",
      },
      at || 0,
    );
    return tl;
  };

  // Slide entrance from an x/y offset (page transitions: slide-left/right/up/down).
  MC.slideIn = function (tl, target, at, opts) {
    var o = opts || {};
    tl.from(
      target,
      { x: u(o.x || 0), y: u(o.y || 0), opacity: 0, duration: o.dur != null ? o.dur : 0.6, ease: o.ease || "power3.out" },
      at || 0,
    );
    return tl;
  };

  // Drop-in-from-above entrance (fall).
  MC.fallIn = function (tl, target, at, opts) {
    var o = opts || {};
    tl.from(
      target,
      { y: -u(o.dist != null ? o.dist : 40), opacity: 0, duration: o.dur != null ? o.dur : 0.6, ease: o.ease || "power3.out" },
      at || 0,
    );
    return tl;
  };

  // Clip-path wipe entrance (reveal left → right).
  MC.wipeIn = function (tl, target, at, opts) {
    var o = opts || {};
    tl.fromTo(
      target,
      { clipPath: "inset(0 100% 0 0)" },
      { clipPath: "inset(0 0% 0 0)", duration: o.dur != null ? o.dur : 0.6, ease: o.ease || "power2.inOut" },
      at || 0,
    );
    return tl;
  };

  /* ------------------------------------------------------- exit tweens (out) --- */
  // Exits animate an element OUT to a hidden state via tl.to (seek-safe, like float).
  // Used by the treatment whole-page transition (sceneExitJs), never by applyAnims.

  MC.fadeOut = function (tl, target, at, opts) {
    var o = opts || {};
    tl.to(target, { opacity: 0, duration: o.dur != null ? o.dur : 0.55, ease: o.ease || "power2.in" }, at || 0);
    return tl;
  };

  MC.riseOut = function (tl, target, at, opts) {
    var o = opts || {};
    tl.to(
      target,
      { y: -u(o.dist != null ? o.dist : 26), opacity: 0, duration: o.dur != null ? o.dur : 0.6, ease: o.ease || "power3.in" },
      at || 0,
    );
    return tl;
  };

  MC.fallOut = function (tl, target, at, opts) {
    var o = opts || {};
    tl.to(
      target,
      { y: u(o.dist != null ? o.dist : 26), opacity: 0, duration: o.dur != null ? o.dur : 0.6, ease: o.ease || "power3.in" },
      at || 0,
    );
    return tl;
  };

  MC.scaleOut = function (tl, target, at, opts) {
    var o = opts || {};
    tl.to(
      target,
      { scale: o.to != null ? o.to : 0.9, opacity: 0, duration: o.dur != null ? o.dur : 0.6, ease: o.ease || "power2.in" },
      at || 0,
    );
    return tl;
  };

  MC.slideOut = function (tl, target, at, opts) {
    var o = opts || {};
    tl.to(
      target,
      { x: u(o.x || 0), y: u(o.y || 0), opacity: 0, duration: o.dur != null ? o.dur : 0.6, ease: o.ease || "power3.in" },
      at || 0,
    );
    return tl;
  };

  MC.wipeOut = function (tl, target, at, opts) {
    var o = opts || {};
    tl.to(target, { clipPath: "inset(0 0 0 100%)", duration: o.dur != null ? o.dur : 0.6, ease: o.ease || "power2.inOut" }, at || 0);
    return tl;
  };

  /* ---------------------------------------------------- anim interpreter --- */

  /**
   * Interpret a list of JSON animation descriptors onto a paused timeline. This
   * is the ONE motion interpreter shared by the render pipeline (the slide's
   * inline <script> calls it) and the interactive showcase (hover replay). Each
   * descriptor is { kind, target, time, opts }; `target` is a fully-qualified
   * scoped class (no leading dot). `ctx` supplies the narration-timing helpers
   * and the scoped query fns:
   *   { q, qa, at, atIndex, lineId, leadIn, page }
   * Content reveals key to VO lines (time.at === "line"/"index"); "seconds" is
   * for the fixed entrance only. Missing targets are skipped (optional slots).
   */
  MC.applyAnims = function (tl, anims, ctx) {
    if (!anims || !anims.length) return tl;
    // Ordered-cascade slot delay: the treatment schedules elements into slots (decorations,
    // title, children …); the gap between slots tightens as the slide narrates more, so every
    // element is up well before the VO finishes reading and nothing flashes at the end. A no-VO
    // scene (voCount 0, incl. the showcase) uses the full per-treatment default `d`.
    // CEILING (the `fit` pass below): the cascade must FINISH inside the scene, not merely
    // tighten with caption count. voCount is a poor proxy for scene LENGTH — a scene narrated
    // by a single line is short (leadIn + one padded line + tailOut) yet gets the widest gap,
    // so a treatment with many slots cascaded nearly to the scene's end and its content was
    // still arriving after the frame the stills sample. (Measured on the sample deck:
    // bar-ranking's last reveal landed at 3.10s of a 3.47s scene in every theme; capsule's
    // cover at 3.40s.) Slots also grow with the DECORATION count — treatment.ts gives
    // decorations slots 0..N-1 ahead of the title — so a purely ambient choice could push the
    // headline off the end. Fit the whole cascade into CASCADE_BUDGET of the scene. This only
    // ever TIGHTENS: a scene long enough for its own cascade keeps the caption-count gap.
    var PER_CAPTION = 0.1, MIN_SLOT_DELAY = 0.15, slotDefault = 0.6, CASCADE_BUDGET = 0.55;
    // A slot fires at `leadIn + n * slotDelay + plus` (timeOf below), so the binding
    // constraint is per-anim, not just the highest n: a mid-cascade slot carrying a big
    // `plus` can land after a later bare one. Solve each anim's budget for slotDelay and keep
    // the tightest. n === 0 is skipped — its time does not move with slotDelay at all.
    var budget = ctx.dur > 0 ? ctx.dur * CASCADE_BUDGET - ctx.leadIn : 0;
    var fit = Infinity, haveDefault = false;
    for (var si = 0; si < anims.length; si++) {
      var st = anims[si].time;
      if (!st || st.at !== "slot") continue;
      if (!haveDefault && st.d != null) { slotDefault = st.d; haveDefault = true; } // first wins
      var sn = st.n || 0;
      if (ctx.dur > 0 && sn > 0) {
        var cand = (budget - (st.plus || 0)) / sn;
        if (cand < fit) fit = cand;
      }
    }
    var slotDelay = Math.max(MIN_SLOT_DELAY, slotDefault - PER_CAPTION * (ctx.voCount || 0));
    if (fit < Infinity) slotDelay = Math.min(slotDelay, Math.max(MIN_SLOT_DELAY, fit));
    var timeOf = function (t) {
      if (!t) return ctx.leadIn;
      var plus = t.plus || 0;
      if (t.at === "slot") return ctx.leadIn + (t.n || 0) * slotDelay + plus;
      if (t.at === "line") {
        var n = t.n || 0;
        return ctx.at(ctx.lineId(n), ctx.leadIn + 0.1 + n * 0.16 + plus);
      }
      if (t.at === "index") return ctx.atIndex(t.n) + plus;
      if (t.at === "leadIn") return ctx.leadIn + plus;
      if (t.at === "seconds") return t.t || 0;
      return ctx.leadIn;
    };
    // The from-style whole-box reveals (see the one-reveal-per-box guard below) and the
    // boxes already claimed by one in THIS call. MIRRORS runtime/anim.ts's REVEAL_KINDS,
    // which the build-time dedupe uses; boxless-reveal.test.ts drives this interpreter
    // kind-by-kind from that list, so the two can't drift.
    var REVEAL_KINDS = { riseIn: 1, fadeIn: 1, scaleIn: 1, staggerIn: 1, from: 1 };
    // The backdrop FX a `backdrop` descriptor may name (see the backdrop arm below).
    // particleBg paints a canvas; washSpin turns a plain element; hueShift drifts a plain
    // element's hue. All answer the same factory contract — fx(el, opts).addTo(tl, atSec, durationSec).
    var BACKDROP_FX = { particleBg: 1, washSpin: 1, hueShift: 1, sunburstBg: 1 };
    var revealed = [];
    // display:contents lookups, memoized per call. getComputedStyle FLUSHES pending style,
    // and a scene runs one applyAnims over every descriptor — without this, a scene with N
    // anims pays N style recalcs at timeline-build time, several of them for the same
    // element (a picked entrance + the element's own internals share a target). Null
    // prototype so a target named `toString`/`constructor` can't read as a cache hit.
    var displayOf = Object.create(null);
    for (var i = 0; i < anims.length; i++) {
      var a = anims[i];
      var sel = "." + a.target;
      var el = ctx.q(sel);
      if (!el) continue; // optional/removed slot — gsap.from(null) would throw
      var when = timeOf(a.time);
      var o = a.opts || {};
      // An element with `display: contents` generates NO box, so a transform/opacity
      // tween on it runs but paints nothing. The ledger Row is display:contents (its
      // cells flow into the parent .ledger grid), so ANY whole-element entrance on a
      // Row — pop/rise/fade from the editor's transition picker — was a silent no-op.
      // Retarget to the children, which DO generate boxes. `staggerIn` already targets
      // children, which is why the Row's DEFAULT reveal always worked and only an
      // explicitly chosen transition appeared to be ignored. Resolved at runtime, not
      // baked into the descriptor, because whether a component is display:contents is
      // the active THEME's choice.
      // When that retarget fans ONE reveal onto SEVERAL boxes, it must cascade, not fire
      // them in lockstep: the element's own default reveal for a box-less root is a
      // `staggerIn` over exactly those children (the ledger Row's cells enter left→right),
      // and the build-time one-reveal-per-box dedupe DROPS it in favour of a picked
      // transition — so without a stagger here, assigning any transition (even the same
      // one) flattened the cascade. Theme-agnostic: it keys off the resolved boxes, not
      // off which component/theme made the root display:contents. `each` is overridable
      // per descriptor; 0.08 matches the box-less components' default staggerIn.
      var box = el;
      var fan = null; // gsap stagger config when one reveal drives many boxes
      try {
        if (displayOf[a.target] === undefined) {
          displayOf[a.target] =
            typeof getComputedStyle === "function" ? getComputedStyle(el).display : "";
        }
        if (displayOf[a.target] === "contents") {
          var kids = ctx.qa(sel + " > *");
          if (kids && kids.length) {
            box = kids;
            if (kids.length > 1) fan = { each: o.each != null ? o.each : 0.08, from: "start" };
          }
        }
      } catch (_e) {
        /* no computed style (non-DOM host) — fall back to the element itself */
        displayOf[a.target] = "";
      }
      // Reveal opts with the fan-out stagger folded in (a COPY — never mutate the
      // descriptor's own opts, which the showcase replays over and over).
      var ro = fan ? Object.assign({}, o, { stagger: fan }) : o;
      // Defence in depth: never let a SECOND whole-box reveal land on a box that already
      // has one. Every reveal kind compiles to `tl.from()`, and two of them on the same
      // element fight over immediateRender — the later tween samples the earlier one's
      // from-state (opacity 0) as its END value, so the box reveals and then vanishes for
      // good. runtime/component.ts dedupes this at build time; this guard covers the lists
      // it can't reach — hand-authored descriptors and scenes BAKED + hand-locked before
      // that fix. Only the whole-box OPACITY reveals are guarded — rule/float/countUp are
      // to/fromTo tweens, and growBar is a `from` but on a sub-part's scale alone (never
      // opacity), so all of them legitimately stack on top of a reveal.
      var boxes = a.kind === "staggerIn" ? ctx.qa(sel + " > *") : box;
      if (REVEAL_KINDS[a.kind] === 1 && boxes) {
        var list = boxes.nodeType == null && boxes.length != null ? boxes : [boxes];
        var owned = false;
        for (var bi = 0; bi < list.length; bi++) {
          if (revealed.indexOf(list[bi]) !== -1) { owned = true; break; }
        }
        if (owned) continue; // an earlier reveal already owns these boxes
        for (var bj = 0; bj < list.length; bj++) revealed.push(list[bj]);
      }
      if (a.kind === "riseIn") MC.riseIn(tl, box, when, ro);
      else if (a.kind === "fadeIn") MC.fadeIn(tl, box, when, ro);
      else if (a.kind === "staggerIn") MC.staggerIn(tl, boxes, when, o);
      else if (a.kind === "rule") MC.rule(tl, el, when, o);
      else if (a.kind === "float") MC.float(tl, el, when, o);
      else if (a.kind === "countUp") MC.countUp(tl, el, when, o);
      else if (a.kind === "growBar") {
        var gb = {};
        gb[o.prop || "scaleY"] = 0;
        gb.duration = o.dur != null ? o.dur : 0.7;
        gb.ease = o.ease || "power3.out";
        tl.from(el, gb, when);
      } else if (a.kind === "scaleIn") {
        tl.from(
          box,
          withStagger(
            {
              scale: o.from != null ? o.from : 0.9,
              opacity: 0,
              duration: o.dur != null ? o.dur : 0.6,
              ease: o.ease || "back.out(1.5)",
            },
            ro,
          ),
          when,
        );
      } else if (a.kind === "from") {
        // `from` opts are raw gsap vars; `ro` is those plus the fan-out stagger. This is the
        // ONLY arm whose distances never touched an MC factory, so it is where uVars converts
        // them (see uVars above) — every other kind above is already canvas-relative.
        tl.from(box, uVars(ro), when);
      } else if (a.kind === "backdrop") {
        // An animated full-bleed backdrop (the constellation's particle canvas, the gradient
        // wash's slow turn): an FX factory the DESIGN names via o.fn, driven off the scene
        // clock for the rest of the scene. Deterministic (seeded or purely time-driven; no
        // rAF/Date.now), so seeking any frame repaints identically.
        //
        // o.fn is an ALLOWLISTED name, not a free lookup on MC: a bare `MC[o.fn]` resolves an
        // inherited Object.prototype member (`constructor`, `toString`) or any other MC export
        // to a function, which then throws on `.addTo` and takes the whole timeline build with
        // it. An unknown name is a silent no-op instead, matching how a missing target is
        // skipped above. Add a name here when a new backdrop FX ships — a tripwire in
        // boxless-reveal.test.ts fails if a registered design names one this list lacks.
        var fx = BACKDROP_FX[o.fn] === 1 && typeof MC[o.fn] === "function" ? MC[o.fn] : null;
        if (fx) {
          try {
            fx(el, o).addTo(tl, when, Math.max(0, (ctx.dur || 6) - when));
          } catch (_bdErr) {
            /* a broken FX must not abort the rest of the scene's timeline */
          }
        }
      }
    }
    return tl;
  };

  /**
   * Build a ctx for the showcase: queries scoped to a card root, and a synthetic
   * narration schedule (no VO lines) so hover replay looks like the render. Since
   * lineId() returns "" and at() returns its fallback, "line" reveals fall back to
   * their staggered offsets — the same shape the render uses when a scene has few
   * VO lines.
   */
  MC.showcaseCtx = function (root) {
    return {
      q: function (s) {
        return root.querySelector(s);
      },
      qa: function (s) {
        return Array.prototype.slice.call(root.querySelectorAll(s));
      },
      at: function (_id, fb) {
        return fb || 0;
      },
      atIndex: function (n) {
        return 0.4 + 0.2 * Math.max(0, n);
      },
      lineId: function () {
        return "";
      },
      leadIn: 0.1,
      voCount: 0,
      // Scene duration for animated backdrops on hover-replay (render passes the real dur).
      dur: 6,
      page: root,
    };
  };

  /* -------------------------------------------------------- particle bg --- */

  /**
   * Deterministic graph-network backdrop on a 2D canvas (port of the old
   * CanvasParticleBg). Node motion is a pure function of timeline time via a
   * proxy tween — seeking any frame repaints identically.
   *
   *   MC.particleBg(canvasEl, { seed, colorRgb: "52,225,255" }).addTo(tl, 0, totalSec)
   */
  MC.particleBg = function (canvas, opts) {
    var o = opts || {};
    var nodeCount = o.nodeCount || 52;
    var linkDistance = o.linkDistance || 230;
    var opacity = o.opacity != null ? o.opacity : 0.55;
    var rgb = o.colorRgb || "52,225,255";
    // SCALE THE DRAWING, NOT THE NUMBERS.
    //
    // The backing buffer is canvas-sized and CSS-stretched to the frame 1:1, so every absolute
    // number in this factory — drift amplitude, link distance, node radius, hairline width —
    // is a fraction of the frame at 1920 and a LARGER fraction at any smaller canvas. Scaling
    // them one by one is both a list to keep in sync and the wrong shape for a <canvas>: the
    // context can carry the ratio for all of them at once. So the whole factory is authored in
    // DESIGN units (a 1920-wide field, exactly as the CSS is) and paint() stamps one transform.
    // Same trick sunburstBg plays with its `unit` factor, done once instead of per value.
    //
    // At the design canvas the scale is 1 and the transform is the identity, so the painted
    // output is unchanged. The PRNG is untouched either way — nothing multiplies a rand()
    // result now, so the seeded field is identical at every canvas, only drawn smaller.
    var bufferW = canvas.width || 1920;
    var bufferH = canvas.height || 1080;
    canvas.width = bufferW;
    canvas.height = bufferH;
    var scale = bufferW / 1920;
    var width = 1920; // design units — NOT bufferW/scale, which can land a float short
    var height = bufferH / scale;

    var rand = MC.seededRandom(o.seed || "mightycut");
    var nodes = [];
    for (var i = 0; i < nodeCount; i++) {
      nodes.push({
        bx: rand() * width,
        by: rand() * height,
        amp: 16 + rand() * 46,
        phase: rand() * Math.PI * 2,
        speed: 0.2 + rand() * 0.5,
        r: 1.4 + rand() * 2.2,
        hub: rand() > 0.82,
      });
    }

    var ctx = canvas.getContext("2d");

    var paint = function (t) {
      if (!ctx) return;
      // Design units -> buffer pixels, for everything below. setTransform (not scale) so a
      // repaint never compounds on the last frame's matrix; clearRect then covers the whole
      // buffer because width*scale === bufferW by construction.
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.clearRect(0, 0, width, height);
      var pts = nodes.map(function (n) {
        return {
          x: n.bx + Math.cos(t * n.speed + n.phase) * n.amp,
          y: n.by + Math.sin(t * n.speed * 0.8 + n.phase) * n.amp,
          r: n.r,
          hub: n.hub,
        };
      });
      for (var i = 0; i < pts.length; i++) {
        for (var j = i + 1; j < pts.length; j++) {
          var dx = pts[i].x - pts[j].x;
          var dy = pts[i].y - pts[j].y;
          var d = Math.hypot(dx, dy);
          if (d < linkDistance) {
            ctx.strokeStyle = "rgba(" + rgb + "," + (1 - d / linkDistance) * 0.16 * opacity + ")";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
      }
      for (var k = 0; k < pts.length; k++) {
        var p = pts[k];
        var r = p.hub ? p.r * 2.1 : p.r;
        if (p.hub) {
          var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 6);
          g.addColorStop(0, "rgba(" + rgb + "," + 0.5 * opacity + ")");
          g.addColorStop(1, "rgba(" + rgb + ",0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r * 6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = "rgba(" + rgb + "," + (p.hub ? 0.9 : 0.5) * opacity + ")";
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    paint(0);

    return {
      /** Drive the particle clock from atSec for durationSec on the timeline. */
      addTo: function (tl, at, durationSec) {
        var proxy = { t: 0 };
        tl.to(
          proxy,
          {
            t: durationSec,
            duration: durationSec,
            ease: "none",
            onUpdate: function () {
              paint(proxy.t);
            },
          },
          at || 0,
        );
        return tl;
      },
    };
  };

  /* ------------------------------------------------------------ sunburst --- */

  /**
   * The `sunburst` backdrop — a radial glow with spiral arm fans turning slowly out of it —
   * painted into a <canvas> instead of composed as SVG. Same factory contract as MC.particleBg.
   *
   * WHY A CANVAS, WHEN THE ARTWORK IS VECTOR. This shipped as an inline SVG rotating one inner
   * <g>, which was smooth to scroll but stuttered badly the moment it animated — and stayed
   * slow after the fill count was cut 59 -> 18 and after mix-blend-mode was removed, so neither
   * was the cause. The cause is that an SVG transform DIRTIES THE PAINT of the subtree it lives
   * in: the preview stage renders a 1920x1080 slide and scales it down, so every frame of the
   * rotation re-rastered the backdrop AND everything around it. Nothing inside one SVG is static
   * from the rasteriser's point of view once any part of it moves — which is exactly why cutting
   * fills did nothing, since the two survivors are the full-frame ones.
   *
   * A canvas has its OWN backing surface. Writing pixels into it does not invalidate the paint
   * of anything else, so the slide is untouched by the animation — the same reason the
   * `constellation` backdrop is smooth on the same page while this one was not.
   *
   * IT ALSO REMOVES THE OVERSIZE. Rotating an ELEMENT means its own corners swing into frame, so
   * it has to be grown until its inscribed circle covers the frame from the pivot — with the
   * burst anchored at a corner that is a 280rem square, ~9.7x the frame's area, and it is what
   * made scrolling slow when the layer itself was the thing turning. Here the rotation is a
   * transform on the DRAWING CONTEXT, so the canvas is exactly the frame and nothing is oversized.
   *
   * COST PER FRAME. Two drawImage blits of pre-rendered, frame-sized layers (the ground+glow
   * beneath the arms, the veil disc above them — both static, so they are rendered ONCE at setup)
   * plus one fill per arm. For scale, particleBg paints ~1300 line strokes and ~50 radial
   * gradients every frame and is smooth, so a dozen-odd path fills has ample headroom.
   *
   * DETERMINISM. Identical to particleBg: the angle is a pure function of timeline position via a
   * proxy tween — no rAF, no wall clock, no repeat — so the renderer, which SEEKS a paused
   * timeline frame by frame, repaints identically for a given frame.
   *
   * The artwork itself is NOT hardcoded here. Path, fan and glow ramp all arrive through opts so
   * primitives/backdrops.ts stays the single source of truth for the design; this function only
   * knows how to draw what it is handed.
   */
  MC.sunburstBg = function (canvas, opts) {
    var o = opts || {};
    var W = canvas.width || 1920;
    var H = canvas.height || 1080;
    canvas.width = W;
    canvas.height = H;
    // NEVER bail out of the factory on a missing context. The tween is scheduled
    // unconditionally (see addTo) and every draw is guarded instead — same contract as
    // particleBg. Returning a no-op addTo here would silently drop this backdrop's tween from
    // the scene timeline, which is a worse failure than simply not painting, and it also makes
    // the design invisible to the BACKDROP_FX allowlist tripwire (which asserts that every
    // registered design actually schedules something through the real interpreter).
    var ctx = typeof canvas.getContext === "function" ? canvas.getContext("2d") : null;

    var deg = o.deg != null ? o.deg : -24;
    // Artwork units -> canvas pixels. The design authors against a 2000-unit-wide viewBox; the
    // canvas is 1920 wide, so everything below is drawn through this one factor.
    var unit = W / (o.viewW || 2000);
    var outer = (o.outer || 3000) * unit; // the glow disc's radius
    var parse = function (s, dflt) {
      try { return JSON.parse(s); } catch (_e) { return dflt; }
    };
    var fan = parse(o.fan, []); // [[scale, rotateDeg], …] — one entry per arm
    var ramp = parse(o.glow, []); // [[offset, grey], …] — the glow's stop ladder
    var grey = function (v) { return "rgb(" + v + "," + v + "," + v + ")"; };

    // The burst is anchored at the artwork's ORIGIN, which the design pins to a frame corner.
    var ox = (o.originX || 0) * unit;
    var oy = (o.originY || 0) * unit;

    /**
     * An offscreen, frame-sized layer, or null where there is nothing to draw — no document to
     * make one in, no 2D context, or a `draw` that returns false because its inputs are empty.
     * Null MATTERS: paint() skips a null layer, so a layer that would be fully transparent costs
     * neither the ~8MB backing store nor a per-frame drawImage of nothing.
     */
    var layer = function (draw) {
      if (typeof document === "undefined" || typeof document.createElement !== "function") return null;
      var c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      var cx = typeof c.getContext === "function" ? c.getContext("2d") : null;
      if (!cx) return null;
      return draw(cx) === false ? null : c;
    };

    /** The radial ramp, shared by the glow and the veil. */
    var discGradient = function (cx) {
      var g = cx.createRadialGradient(ox, oy, 0, ox, oy, outer);
      for (var i = 0; i < ramp.length; i++) {
        // Offsets must be non-decreasing; the ladder deliberately repeats one to make a hard
        // edge (the artwork's concentric banding), which addColorStop handles as-is.
        g.addColorStop(Math.min(1, Math.max(0, ramp[i][0])), grey(ramp[i][1]));
      }
      return g;
    };

    // BENEATH the arms: the ground tone, then the glow disc over it.
    var below = layer(function (cx) {
      cx.fillStyle = grey(o.ground != null ? o.ground : 135);
      cx.fillRect(0, 0, W, H);
      if (ramp.length) {
        cx.fillStyle = discGradient(cx);
        cx.fillRect(0, 0, W, H);
      }
    });

    // ABOVE the arms: the veil disc, which is what keeps them sitting IN the light rather than
    // on top of it. It is the one part that cannot fold into the glow — it is on the far side.
    var veilAlpha = o.veilAlpha != null ? o.veilAlpha : 0.6;
    var above = layer(function (cx) {
      if (!ramp.length || veilAlpha <= 0) return false; // nothing to veil — see `layer`
      cx.globalAlpha = veilAlpha;
      var g = cx.createRadialGradient(ox, oy, 0, ox, oy, outer);
      g.addColorStop(0, grey(o.veilInner != null ? o.veilInner : 212));
      g.addColorStop(1, grey(o.veilOuter != null ? o.veilOuter : 135));
      cx.fillStyle = g;
      cx.fillRect(0, 0, W, H);
    });

    // The arm, as a reusable path in ARTWORK units. Path2D caches the parsed geometry, so the
    // per-frame cost is the fill, not re-parsing 60 bezier segments per arm per frame.
    var arm = typeof Path2D === "function" && o.armPath ? new Path2D(o.armPath) : null;
    var armLen = o.armLen || 1550;

    var paint = function (rot) {
      if (!ctx) return; // no 2D context (stub element, context loss) — draw nothing, tween still runs
      ctx.clearRect(0, 0, W, H);
      if (below) ctx.drawImage(below, 0, 0);
      if (arm && fan.length) {
        ctx.save();
        ctx.translate(ox, oy);
        ctx.rotate((rot * Math.PI) / 180);
        for (var i = 0; i < fan.length; i++) {
          ctx.save();
          ctx.rotate((fan[i][1] * Math.PI) / 180);
          ctx.scale(fan[i][0] * unit, fan[i][0] * unit);
          // Built INSIDE the transform so it scales and turns with the arm — the canvas
          // equivalent of the source gradient's gradientUnits="userSpaceOnUse".
          var g = ctx.createLinearGradient(0, 0, armLen, 0);
          g.addColorStop(0, grey(o.armInner != null ? o.armInner : 174));
          g.addColorStop(1, grey(o.armOuter != null ? o.armOuter : 135));
          ctx.fillStyle = g;
          ctx.fill(arm);
          ctx.restore();
        }
        ctx.restore();
      }
      if (above) ctx.drawImage(above, 0, 0);
    };

    paint(0);

    return {
      /** Turn the arms from 0 to `deg` over durationSec, starting at atSec. */
      addTo: function (tl, at, durationSec) {
        var proxy = { r: 0 };
        tl.to(
          proxy,
          {
            r: deg,
            duration: durationSec,
            ease: "none",
            onUpdate: function () {
              paint(proxy.r);
            },
          },
          at || 0,
        );
        return tl;
      },
    };
  };

  /* ----------------------------------------------------------- wash spin --- */

  /**
   * Very slow rotation of a full-bleed element — the motion behind the `gradient` backdrop's
   * two-tone atmospheric wash. Same factory contract as MC.particleBg above: hand it the
   * element plus the descriptor's opts, then addTo(tl, atSec, durationSec) to schedule it.
   *
   *   MC.washSpin(el, { deg: 10 }).addTo(tl, 0, totalSec)
   *
   * DETERMINISM. The whole effect is ONE plain, time-driven tween — no rAF, no wall clock, no
   * timers, no infinite repeat (every one of those is banned by the determinism scrub, and the
   * renderer never "plays" anyway: it SEEKS a paused timeline frame by frame). Because the
   * angle is a pure function of timeline position, every run lands on the same rotation for
   * the same frame, and no seed is needed.
   *
   * GEOMETRY IS THE CALLER'S JOB. Rotating an element that exactly fills its parent swings
   * the element's own corners into view. The design must therefore oversize the target to at
   * least sqrt(2) of the clipping parent in BOTH axes and turn it about its own centre, with
   * the parent clipping the overflow — see the `gradient` design in primitives/backdrops.ts,
   * which uses left/top -25% at 150% x 150% with transform-origin 50% 50%.
   *
   * Nothing here touches the DOM or a rendering context, so the boxless-reveal tripwire can
   * drive it against a bare stub element.
   */
  MC.washSpin = function (el, opts) {
    var o = opts || {};
    // Degrees swept across the WHOLE scene, not per second: `deg` is a total, so a longer
    // slide turns more slowly rather than further. Keep it small — this is atmosphere.
    var deg = o.deg != null ? o.deg : 10;
    return {
      /** Turn from the element's resting angle to `deg` over durationSec, starting at atSec. */
      addTo: function (tl, at, durationSec) {
        tl.to(
          el,
          {
            rotation: deg,
            duration: durationSec,
            ease: "none",
          },
          at || 0,
        );
        return tl;
      },
    };
  };

  /* ---------------------------------------------------------- hue shift --- */

  /**
   * Very slow hue drift of a full-bleed element — the "soothing colour shift" behind the `hatch`
   * backdrop's vanishing stripes. Same factory contract as MC.washSpin / MC.particleBg: hand it
   * the element plus the descriptor's opts, then addTo(tl, atSec, durationSec) to schedule it.
   *
   *   MC.hueShift(el, { deg: 28 }).addTo(tl, 0, totalSec)
   *
   * The effect is a single time-driven tween of a plain proxy object whose value we write onto
   * el.style.filter as `hue-rotate(<n>deg)` each update. It touches NO transform (the layer keeps
   * its own), and hue-rotate is a no-op on a hueless (near-black/white) ink, so a theme that
   * paints hatch in its dark ink simply doesn't drift — only a saturated hook (professional's
   * cobalt) visibly shifts.
   *
   * DETERMINISM. One plain, ease-less tween — no rAF, no wall clock, no timers, no infinite
   * repeat. The hue is a pure function of timeline position, so seeking any frame lands on the
   * same rotation and every run is byte-identical; no seed needed. onUpdate fires only when the
   * (seeked) playhead moves, exactly as the renderer drives it.
   */
  MC.hueShift = function (el, opts) {
    var o = opts || {};
    // Degrees of hue drift across the WHOLE scene (a total, not a rate) — keep it small so it is
    // felt at the edge of vision, never watched.
    var deg = o.deg != null ? o.deg : 28;
    var st = { h: 0 };
    return {
      /** Drift the element's hue from 0 to `deg` over durationSec, starting at atSec. */
      addTo: function (tl, at, durationSec) {
        tl.to(
          st,
          {
            h: deg,
            duration: durationSec,
            ease: "none",
            onUpdate: function () {
              if (el && el.style) el.style.filter = "hue-rotate(" + st.h + "deg)";
            },
          },
          at || 0,
        );
        return tl;
      },
    };
  };

  window.MC = MC;
})();
