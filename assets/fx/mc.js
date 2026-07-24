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

  // Entrance: fade + rise from below (the old riseIn spring).
  MC.riseIn = function (tl, target, at, opts) {
    var o = opts || {};
    tl.from(
      target,
      withStagger(
        {
          y: o.dist != null ? o.dist : 26,
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
        y: o.dist != null ? o.dist : 26,
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
        y: o.dy != null ? o.dy : -8,
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
      { x: o.x || 0, y: o.y || 0, opacity: 0, duration: o.dur != null ? o.dur : 0.6, ease: o.ease || "power3.out" },
      at || 0,
    );
    return tl;
  };

  // Drop-in-from-above entrance (fall).
  MC.fallIn = function (tl, target, at, opts) {
    var o = opts || {};
    tl.from(
      target,
      { y: o.dist != null ? -o.dist : -40, opacity: 0, duration: o.dur != null ? o.dur : 0.6, ease: o.ease || "power3.out" },
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
      { y: o.dist != null ? -o.dist : -26, opacity: 0, duration: o.dur != null ? o.dur : 0.6, ease: o.ease || "power3.in" },
      at || 0,
    );
    return tl;
  };

  MC.fallOut = function (tl, target, at, opts) {
    var o = opts || {};
    tl.to(
      target,
      { y: o.dist != null ? o.dist : 26, opacity: 0, duration: o.dur != null ? o.dur : 0.6, ease: o.ease || "power3.in" },
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
      { x: o.x || 0, y: o.y || 0, opacity: 0, duration: o.dur != null ? o.dur : 0.6, ease: o.ease || "power3.in" },
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
    var PER_CAPTION = 0.1, MIN_SLOT_DELAY = 0.15, slotDefault = 0.5;
    for (var si = 0; si < anims.length; si++) {
      if (anims[si].time && anims[si].time.at === "slot" && anims[si].time.d != null) { slotDefault = anims[si].time.d; break; }
    }
    var slotDelay = Math.max(MIN_SLOT_DELAY, slotDefault - PER_CAPTION * (ctx.voCount || 0));
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
    var BACKDROP_FX = { particleBg: 1, washSpin: 1, hueShift: 1 };
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
        // `from` opts are raw gsap vars; `ro` is those plus the fan-out stagger.
        tl.from(box, ro, when);
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
    var width = canvas.width || 1920;
    var height = canvas.height || 1080;
    canvas.width = width;
    canvas.height = height;

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
