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

  // Entrance: fade + rise from below (the old riseIn spring).
  MC.riseIn = function (tl, target, at, opts) {
    var o = opts || {};
    tl.from(
      target,
      {
        y: o.dist != null ? o.dist : 26,
        opacity: 0,
        duration: o.dur != null ? o.dur : 0.65,
        ease: o.ease || "power3.out",
      },
      at || 0,
    );
    return tl;
  };

  // Plain fade in.
  MC.fadeIn = function (tl, target, at, opts) {
    var o = opts || {};
    tl.from(
      target,
      { opacity: 0, duration: o.dur != null ? o.dur : 0.55, ease: o.ease || "power2.out" },
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
    var timeOf = function (t) {
      if (!t) return ctx.leadIn;
      var plus = t.plus || 0;
      if (t.at === "line") {
        var n = t.n || 0;
        return ctx.at(ctx.lineId(n), ctx.leadIn + 0.1 + n * 0.16 + plus);
      }
      if (t.at === "index") return ctx.atIndex(t.n) + plus;
      if (t.at === "leadIn") return ctx.leadIn + plus;
      if (t.at === "seconds") return t.t || 0;
      return ctx.leadIn;
    };
    for (var i = 0; i < anims.length; i++) {
      var a = anims[i];
      var sel = "." + a.target;
      var el = ctx.q(sel);
      if (!el) continue; // optional/removed slot — gsap.from(null) would throw
      var when = timeOf(a.time);
      var o = a.opts || {};
      if (a.kind === "riseIn") MC.riseIn(tl, el, when, o);
      else if (a.kind === "fadeIn") MC.fadeIn(tl, el, when, o);
      else if (a.kind === "staggerIn") MC.staggerIn(tl, ctx.qa(sel + " > *"), when, o);
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
          el,
          {
            scale: o.from != null ? o.from : 0.9,
            opacity: 0,
            duration: o.dur != null ? o.dur : 0.6,
            ease: o.ease || "back.out(1.5)",
          },
          when,
        );
      } else if (a.kind === "from") {
        tl.from(el, o, when);
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

  /* ------------------------------------------------------ progress ring --- */

  /**
   * Animated percent ring with count-up center (port of ProgressRing).
   * Builds SVG inside `container`; animate via the returned addTo(tl, atSec).
   *
   *   MC.progressRing(el, { value: 96, label: "Detection", color: "var(--accent)" }).addTo(tl, at)
   */
  MC.progressRing = function (container, opts) {
    var o = opts || {};
    var value = o.value || 0;
    var size = o.size || 260;
    var thickness = o.thickness || 14;
    var suffix = o.suffix != null ? o.suffix : "%";
    var decimals = o.decimals || 0;
    var color = o.color || "var(--accent)";
    var cx = size / 2;
    var r = (size - thickness) / 2;
    var circumference = 2 * Math.PI * r;

    container.innerHTML =
      '<div style="display:inline-flex;flex-direction:column;align-items:center;gap:14px;">' +
      '<div style="position:relative;width:' + size + "px;height:" + size + 'px;">' +
      '<svg width="' + size + '" height="' + size + '" style="display:block">' +
      '<circle cx="' + cx + '" cy="' + cx + '" r="' + r +
      '" fill="none" stroke="var(--steel)" stroke-width="' + thickness + '" opacity="0.45"/>' +
      '<circle class="mc-ring-arc" cx="' + cx + '" cy="' + cx + '" r="' + r +
      '" fill="none" stroke="' + color + '" stroke-width="' + thickness +
      '" stroke-linecap="round" stroke-dasharray="' + circumference +
      '" stroke-dashoffset="' + circumference + '" transform="rotate(-90 ' + cx + " " + cx + ')"/>' +
      "</svg>" +
      '<div class="mc-ring-value" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;' +
      "font-family:var(--font-heading);font-size:" + size * 0.21 + "px;font-weight:700;letter-spacing:-1px;color:" +
      color + ';opacity:0;"></div>' +
      "</div>" +
      (o.label
        ? '<div style="font-family:var(--font-body);font-size:var(--fs-small);color:var(--text-muted);">' +
          o.label +
          "</div>"
        : "") +
      "</div>";

    var arc = container.querySelector(".mc-ring-arc");
    var valueEl = container.querySelector(".mc-ring-value");

    return {
      addTo: function (tl, at) {
        var dur = o.dur != null ? o.dur : 1.4;
        tl.to(
          arc,
          {
            strokeDashoffset: circumference * (1 - value / 100),
            duration: dur,
            ease: "power2.out",
          },
          at || 0,
        );
        tl.to(valueEl, { opacity: 1, duration: 0.3 }, at || 0);
        var proxy = { v: 0 };
        tl.to(
          proxy,
          {
            v: value,
            duration: dur,
            ease: "power2.out",
            onUpdate: function () {
              valueEl.textContent = proxy.v.toFixed(decimals) + suffix;
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
