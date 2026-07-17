const THEMES = ["block"];
const loadTheme = async (name) => {
  switch (name) {
    case "block": {
      const m = await import("./register-block.js");
      return m.registerBlock();
    }
    default:
      throw new Error(`unknown theme: ${name} (available: ${THEMES.join(", ")})`);
  }
};
const VOID_TAGS = /* @__PURE__ */ new Set(["br", "hr", "img", "input", "meta", "link", "source"]);
const parseFragment = (html) => {
  const roots = [];
  const stack = [];
  const push = (n) => {
    if (stack.length) stack[stack.length - 1].children.push(n);
    else roots.push(n);
  };
  let i = 0;
  const len = html.length;
  while (i < len) {
    if (html[i] === "<") {
      if (html.startsWith("<!--", i)) {
        const end = html.indexOf("-->", i + 2);
        const stop2 = end === -1 ? len : Math.max(i + 4, end);
        push({ type: "comment", text: html.slice(i + 4, stop2) });
        i = end === -1 ? len : end + 3;
        continue;
      }
      if (html[i + 1] === "/") {
        const end = html.indexOf(">", i);
        const stop2 = end === -1 ? len : end;
        const name = html.slice(i + 2, stop2).trim().toLowerCase();
        for (let s = stack.length - 1; s >= 0; s--) {
          if (stack[s].tag === name) {
            stack.length = s;
            break;
          }
        }
        i = end === -1 ? len : end + 1;
        continue;
      }
      let j = i + 1;
      let quote = "";
      while (j < len) {
        const c = html[j];
        if (quote) {
          if (c === quote) quote = "";
        } else if (c === '"' || c === "'") {
          quote = c;
        } else if (c === ">") {
          break;
        }
        j++;
      }
      const rawTag = html.slice(i + 1, j);
      const tagEnd = rawTag.replace(/\s+$/, "");
      const selfClose = tagEnd.endsWith("/") && /[\s"']/.test(tagEnd.charAt(tagEnd.length - 2) || " ");
      const el = parseOpenTag(selfClose ? tagEnd.slice(0, -1) : rawTag);
      push(el);
      if (!selfClose && !VOID_TAGS.has(el.tag)) stack.push(el);
      i = j + 1;
      continue;
    }
    const next = html.indexOf("<", i);
    const stop = next === -1 ? len : next;
    push({ type: "text", text: html.slice(i, stop) });
    i = stop;
  }
  return roots;
};
const parseOpenTag = (raw) => {
  const trimmed = raw.trim();
  const sp = trimmed.search(/\s/);
  const tag = (sp === -1 ? trimmed : trimmed.slice(0, sp)).toLowerCase().replace(/\/$/, "");
  const attrs = {};
  if (sp !== -1) {
    const rest = trimmed.slice(sp + 1);
    const re = /([^\s=/]+)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
    let m;
    while ((m = re.exec(rest)) !== null) {
      const name = m[1];
      const value = m[3] ?? m[4] ?? m[5] ?? "";
      attrs[name] = value;
    }
  }
  return { type: "element", tag, attrs, children: [] };
};
const ATTR_ESCAPE = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
const serialize = (node) => {
  if (Array.isArray(node)) return node.map(serialize).join("");
  if (node.type === "text") return node.text;
  if (node.type === "comment") return `<!--${node.text}-->`;
  const attrs = Object.entries(node.attrs).map(([k, v]) => v === "" ? ` ${k}` : ` ${k}="${ATTR_ESCAPE(v)}"`).join("");
  if (VOID_TAGS.has(node.tag)) return `<${node.tag}${attrs}>`;
  return `<${node.tag}${attrs}>${node.children.map(serialize).join("")}</${node.tag}>`;
};
const isElement = (n) => n.type === "element";
const findAll = (node, pred) => {
  const out = [];
  const visit = (n) => {
    if (!isElement(n)) return;
    if (pred(n)) out.push(n);
    for (const c of n.children) visit(c);
  };
  (Array.isArray(node) ? node : [node]).forEach(visit);
  return out;
};
const find = (node, pred) => findAll(node, pred)[0] ?? null;
const setText = (el, text) => {
  el.children = [{ type: "text", text }];
};
const removeWhere = (nodes, pred) => {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i];
    if (isElement(n)) {
      if (pred(n)) {
        nodes.splice(i, 1);
        continue;
      }
      removeWhere(n.children, pred);
    }
  }
};
const attrEq = (name, value) => (el) => el.attrs[name] === value;
const hasAttr = (name) => (el) => name in el.attrs;
const js = (s) => JSON.stringify(s).replace(/<\//g, "<\\/");
const wrapSubComposition = (parts) => {
  const { compId, voIds, bodyHtml, entranceJs, pageClasses } = parts;
  const cls = compId;
  const bodyCss = parts.bodyCss ?? "";
  const bodyJs = parts.bodyJs ?? "";
  const exitJs = parts.exitJs ?? "";
  const exitBlock = exitJs ? `
          ${exitJs}` : "";
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
        <\/script>
      </div>
    </template>
  </body>
</html>
`;
};
const scopeCss = (css, root) => {
  const prefix = `.${root}-root`;
  return css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|})\s*([^{}@]+)\{/g, (_m, close, selector) => {
    const scoped = selector.split(",").map((s) => `${prefix} ${s.trim()}`).join(",\n");
    return `${close ? `${close}
` : ""}${scoped} {`;
  }).trim();
};
const collectCss = (parts) => {
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const p of parts) {
    if (seen.has(p.name)) continue;
    seen.add(p.name);
    const trimmed = p.css.trim();
    if (trimmed) out.push(`/* ${p.name} */
${trimmed}`);
  }
  return out.join("\n\n");
};
const buildScene = (treatment, ctx, overrides) => {
  const parts = treatment.buildScene(ctx);
  if (overrides?.ground) {
    parts.pageStyle = (parts.pageStyle ?? "").replace(
      /background:\s*var\(--[a-z]+\)/,
      `background: var(--${overrides.ground})`
    );
  }
  return parts;
};
const renderScene = (treatment, ctx, overrides) => wrapSubComposition(buildScene(treatment, ctx, overrides));
const buildPreview = (inst, ctx) => {
  const bn = inst.buildNode(ctx);
  if (inst.kind === "treatment") {
    const own = (bn.node.attrs.style ?? "").trim().replace(/;\s*$/, "");
    const ground = `background: var(--${inst.ground})`;
    bn.node.attrs.style = own ? `${own}; ${ground}` : ground;
  }
  return {
    html: `<div class="${ctx.compId}-root">${serialize(bn.node)}</div>`,
    css: scopeCss(bn.css, ctx.compId),
    anims: bn.anims
  };
};
function $constructor(name, initializer2, params) {
  function init(inst, def) {
    var _a;
    Object.defineProperty(inst, "_zod", {
      value: inst._zod ?? {},
      enumerable: false
    });
    (_a = inst._zod).traits ?? (_a.traits = /* @__PURE__ */ new Set());
    inst._zod.traits.add(name);
    initializer2(inst, def);
    for (const k in _.prototype) {
      if (!(k in inst))
        Object.defineProperty(inst, k, { value: _.prototype[k].bind(inst) });
    }
    inst._zod.constr = _;
    inst._zod.def = def;
  }
  const Parent = params?.Parent ?? Object;
  class Definition extends Parent {
  }
  Object.defineProperty(Definition, "name", { value: name });
  function _(def) {
    var _a;
    const inst = params?.Parent ? new Definition() : this;
    init(inst, def);
    (_a = inst._zod).deferred ?? (_a.deferred = []);
    for (const fn of inst._zod.deferred) {
      fn();
    }
    return inst;
  }
  Object.defineProperty(_, "init", { value: init });
  Object.defineProperty(_, Symbol.hasInstance, {
    value: (inst) => {
      if (params?.Parent && inst instanceof params.Parent)
        return true;
      return inst?._zod?.traits?.has(name);
    }
  });
  Object.defineProperty(_, "name", { value: name });
  return _;
}
class $ZodAsyncError extends Error {
  constructor() {
    super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);
  }
}
const globalConfig = {};
function config(newConfig) {
  return globalConfig;
}
function getEnumValues(entries) {
  const numericValues = Object.values(entries).filter((v) => typeof v === "number");
  const values = Object.entries(entries).filter(([k, _]) => numericValues.indexOf(+k) === -1).map(([_, v]) => v);
  return values;
}
function jsonStringifyReplacer(_, value) {
  if (typeof value === "bigint")
    return value.toString();
  return value;
}
function cached(getter) {
  return {
    get value() {
      {
        const value = getter();
        Object.defineProperty(this, "value", { value });
        return value;
      }
    }
  };
}
function nullish(input) {
  return input === null || input === void 0;
}
function cleanRegex(source) {
  const start = source.startsWith("^") ? 1 : 0;
  const end = source.endsWith("$") ? source.length - 1 : source.length;
  return source.slice(start, end);
}
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}
function defineLazy(object2, key, getter) {
  Object.defineProperty(object2, key, {
    get() {
      {
        const value = getter();
        object2[key] = value;
        return value;
      }
    },
    set(v) {
      Object.defineProperty(object2, key, {
        value: v
        // configurable: true,
      });
    },
    configurable: true
  });
}
function assignProp(target, prop, value) {
  Object.defineProperty(target, prop, {
    value,
    writable: true,
    enumerable: true,
    configurable: true
  });
}
function esc$1(str) {
  return JSON.stringify(str);
}
const captureStackTrace = Error.captureStackTrace ? Error.captureStackTrace : (..._args) => {
};
function isObject(data) {
  return typeof data === "object" && data !== null && !Array.isArray(data);
}
const allowsEval = cached(() => {
  if (typeof navigator !== "undefined" && navigator?.userAgent?.includes("Cloudflare")) {
    return false;
  }
  try {
    const F = Function;
    new F("");
    return true;
  } catch (_) {
    return false;
  }
});
function isPlainObject(o) {
  if (isObject(o) === false)
    return false;
  const ctor = o.constructor;
  if (ctor === void 0)
    return true;
  const prot = ctor.prototype;
  if (isObject(prot) === false)
    return false;
  if (Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf") === false) {
    return false;
  }
  return true;
}
const propertyKeyTypes = /* @__PURE__ */ new Set(["string", "number", "symbol"]);
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function clone(inst, def, params) {
  const cl = new inst._zod.constr(def ?? inst._zod.def);
  if (!def || params?.parent)
    cl._zod.parent = inst;
  return cl;
}
function normalizeParams(_params) {
  const params = _params;
  if (!params)
    return {};
  if (typeof params === "string")
    return { error: () => params };
  if (params?.message !== void 0) {
    if (params?.error !== void 0)
      throw new Error("Cannot specify both `message` and `error` params");
    params.error = params.message;
  }
  delete params.message;
  if (typeof params.error === "string")
    return { ...params, error: () => params.error };
  return params;
}
function optionalKeys(shape) {
  return Object.keys(shape).filter((k) => {
    return shape[k]._zod.optin === "optional" && shape[k]._zod.optout === "optional";
  });
}
const NUMBER_FORMAT_RANGES = {
  safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
  int32: [-2147483648, 2147483647],
  uint32: [0, 4294967295],
  float32: [-34028234663852886e22, 34028234663852886e22],
  float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
};
function pick(schema, mask) {
  const newShape = {};
  const currDef = schema._zod.def;
  for (const key in mask) {
    if (!(key in currDef.shape)) {
      throw new Error(`Unrecognized key: "${key}"`);
    }
    if (!mask[key])
      continue;
    newShape[key] = currDef.shape[key];
  }
  return clone(schema, {
    ...schema._zod.def,
    shape: newShape,
    checks: []
  });
}
function omit(schema, mask) {
  const newShape = { ...schema._zod.def.shape };
  const currDef = schema._zod.def;
  for (const key in mask) {
    if (!(key in currDef.shape)) {
      throw new Error(`Unrecognized key: "${key}"`);
    }
    if (!mask[key])
      continue;
    delete newShape[key];
  }
  return clone(schema, {
    ...schema._zod.def,
    shape: newShape,
    checks: []
  });
}
function extend(schema, shape) {
  if (!isPlainObject(shape)) {
    throw new Error("Invalid input to extend: expected a plain object");
  }
  const def = {
    ...schema._zod.def,
    get shape() {
      const _shape = { ...schema._zod.def.shape, ...shape };
      assignProp(this, "shape", _shape);
      return _shape;
    },
    checks: []
    // delete existing checks
  };
  return clone(schema, def);
}
function merge(a, b) {
  return clone(a, {
    ...a._zod.def,
    get shape() {
      const _shape = { ...a._zod.def.shape, ...b._zod.def.shape };
      assignProp(this, "shape", _shape);
      return _shape;
    },
    catchall: b._zod.def.catchall,
    checks: []
    // delete existing checks
  });
}
function partial(Class, schema, mask) {
  const oldShape = schema._zod.def.shape;
  const shape = { ...oldShape };
  if (mask) {
    for (const key in mask) {
      if (!(key in oldShape)) {
        throw new Error(`Unrecognized key: "${key}"`);
      }
      if (!mask[key])
        continue;
      shape[key] = Class ? new Class({
        type: "optional",
        innerType: oldShape[key]
      }) : oldShape[key];
    }
  } else {
    for (const key in oldShape) {
      shape[key] = Class ? new Class({
        type: "optional",
        innerType: oldShape[key]
      }) : oldShape[key];
    }
  }
  return clone(schema, {
    ...schema._zod.def,
    shape,
    checks: []
  });
}
function required(Class, schema, mask) {
  const oldShape = schema._zod.def.shape;
  const shape = { ...oldShape };
  if (mask) {
    for (const key in mask) {
      if (!(key in shape)) {
        throw new Error(`Unrecognized key: "${key}"`);
      }
      if (!mask[key])
        continue;
      shape[key] = new Class({
        type: "nonoptional",
        innerType: oldShape[key]
      });
    }
  } else {
    for (const key in oldShape) {
      shape[key] = new Class({
        type: "nonoptional",
        innerType: oldShape[key]
      });
    }
  }
  return clone(schema, {
    ...schema._zod.def,
    shape,
    // optional: [],
    checks: []
  });
}
function aborted(x, startIndex = 0) {
  for (let i = startIndex; i < x.issues.length; i++) {
    if (x.issues[i]?.continue !== true)
      return true;
  }
  return false;
}
function prefixIssues(path, issues) {
  return issues.map((iss) => {
    var _a;
    (_a = iss).path ?? (_a.path = []);
    iss.path.unshift(path);
    return iss;
  });
}
function unwrapMessage(message) {
  return typeof message === "string" ? message : message?.message;
}
function finalizeIssue(iss, ctx, config2) {
  const full = { ...iss, path: iss.path ?? [] };
  if (!iss.message) {
    const message = unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ?? unwrapMessage(ctx?.error?.(iss)) ?? unwrapMessage(config2.customError?.(iss)) ?? unwrapMessage(config2.localeError?.(iss)) ?? "Invalid input";
    full.message = message;
  }
  delete full.inst;
  delete full.continue;
  if (!ctx?.reportInput) {
    delete full.input;
  }
  return full;
}
function getLengthableOrigin(input) {
  if (Array.isArray(input))
    return "array";
  if (typeof input === "string")
    return "string";
  return "unknown";
}
function issue(...args) {
  const [iss, input, inst] = args;
  if (typeof iss === "string") {
    return {
      message: iss,
      code: "custom",
      input,
      inst
    };
  }
  return { ...iss };
}
const initializer$1 = (inst, def) => {
  inst.name = "$ZodError";
  Object.defineProperty(inst, "_zod", {
    value: inst._zod,
    enumerable: false
  });
  Object.defineProperty(inst, "issues", {
    value: def,
    enumerable: false
  });
  Object.defineProperty(inst, "message", {
    get() {
      return JSON.stringify(def, jsonStringifyReplacer, 2);
    },
    enumerable: true
    // configurable: false,
  });
  Object.defineProperty(inst, "toString", {
    value: () => inst.message,
    enumerable: false
  });
};
const $ZodError = $constructor("$ZodError", initializer$1);
const $ZodRealError = $constructor("$ZodError", initializer$1, { Parent: Error });
function flattenError(error, mapper = (issue2) => issue2.message) {
  const fieldErrors = {};
  const formErrors = [];
  for (const sub of error.issues) {
    if (sub.path.length > 0) {
      fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [];
      fieldErrors[sub.path[0]].push(mapper(sub));
    } else {
      formErrors.push(mapper(sub));
    }
  }
  return { formErrors, fieldErrors };
}
function formatError(error, _mapper) {
  const mapper = _mapper || function(issue2) {
    return issue2.message;
  };
  const fieldErrors = { _errors: [] };
  const processError = (error2) => {
    for (const issue2 of error2.issues) {
      if (issue2.code === "invalid_union" && issue2.errors.length) {
        issue2.errors.map((issues) => processError({ issues }));
      } else if (issue2.code === "invalid_key") {
        processError({ issues: issue2.issues });
      } else if (issue2.code === "invalid_element") {
        processError({ issues: issue2.issues });
      } else if (issue2.path.length === 0) {
        fieldErrors._errors.push(mapper(issue2));
      } else {
        let curr = fieldErrors;
        let i = 0;
        while (i < issue2.path.length) {
          const el = issue2.path[i];
          const terminal = i === issue2.path.length - 1;
          if (!terminal) {
            curr[el] = curr[el] || { _errors: [] };
          } else {
            curr[el] = curr[el] || { _errors: [] };
            curr[el]._errors.push(mapper(issue2));
          }
          curr = curr[el];
          i++;
        }
      }
    }
  };
  processError(error);
  return fieldErrors;
}
const _parse = (_Err) => (schema, value, _ctx, _params) => {
  const ctx = _ctx ? Object.assign(_ctx, { async: false }) : { async: false };
  const result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise) {
    throw new $ZodAsyncError();
  }
  if (result.issues.length) {
    const e = new (_params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
    captureStackTrace(e, _params?.callee);
    throw e;
  }
  return result.value;
};
const _parseAsync = (_Err) => async (schema, value, _ctx, params) => {
  const ctx = _ctx ? Object.assign(_ctx, { async: true }) : { async: true };
  let result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise)
    result = await result;
  if (result.issues.length) {
    const e = new (params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
    captureStackTrace(e, params?.callee);
    throw e;
  }
  return result.value;
};
const _safeParse = (_Err) => (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
  const result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise) {
    throw new $ZodAsyncError();
  }
  return result.issues.length ? {
    success: false,
    error: new (_Err ?? $ZodError)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
  } : { success: true, data: result.value };
};
const safeParse$1 = /* @__PURE__ */ _safeParse($ZodRealError);
const _safeParseAsync = (_Err) => async (schema, value, _ctx) => {
  const ctx = _ctx ? Object.assign(_ctx, { async: true }) : { async: true };
  let result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise)
    result = await result;
  return result.issues.length ? {
    success: false,
    error: new _Err(result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
  } : { success: true, data: result.value };
};
const safeParseAsync$1 = /* @__PURE__ */ _safeParseAsync($ZodRealError);
const cuid = /^[cC][^\s-]{8,}$/;
const cuid2 = /^[0-9a-z]+$/;
const ulid = /^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/;
const xid = /^[0-9a-vA-V]{20}$/;
const ksuid = /^[A-Za-z0-9]{27}$/;
const nanoid = /^[a-zA-Z0-9_-]{21}$/;
const duration$1 = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;
const guid = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;
const uuid = (version2) => {
  if (!version2)
    return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000)$/;
  return new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${version2}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`);
};
const email = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;
const _emoji$1 = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
function emoji() {
  return new RegExp(_emoji$1, "u");
}
const ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
const ipv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})$/;
const cidrv4 = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/;
const cidrv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
const base64 = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/;
const base64url = /^[A-Za-z0-9_-]*$/;
const hostname = /^([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+$/;
const e164 = /^\+(?:[0-9]){6,14}[0-9]$/;
const dateSource = `(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))`;
const date$1 = /* @__PURE__ */ new RegExp(`^${dateSource}$`);
function timeSource(args) {
  const hhmm = `(?:[01]\\d|2[0-3]):[0-5]\\d`;
  const regex = typeof args.precision === "number" ? args.precision === -1 ? `${hhmm}` : args.precision === 0 ? `${hhmm}:[0-5]\\d` : `${hhmm}:[0-5]\\d\\.\\d{${args.precision}}` : `${hhmm}(?::[0-5]\\d(?:\\.\\d+)?)?`;
  return regex;
}
function time$1(args) {
  return new RegExp(`^${timeSource(args)}$`);
}
function datetime$1(args) {
  const time2 = timeSource({ precision: args.precision });
  const opts = ["Z"];
  if (args.local)
    opts.push("");
  if (args.offset)
    opts.push(`([+-]\\d{2}:\\d{2})`);
  const timeRegex = `${time2}(?:${opts.join("|")})`;
  return new RegExp(`^${dateSource}T(?:${timeRegex})$`);
}
const string$1 = (params) => {
  const regex = params ? `[\\s\\S]{${params?.minimum ?? 0},${params?.maximum ?? ""}}` : `[\\s\\S]*`;
  return new RegExp(`^${regex}$`);
};
const integer = /^\d+$/;
const number$1 = /^-?\d+(?:\.\d+)?/i;
const boolean$1 = /true|false/i;
const lowercase = /^[^A-Z]*$/;
const uppercase = /^[^a-z]*$/;
const $ZodCheck = /* @__PURE__ */ $constructor("$ZodCheck", (inst, def) => {
  var _a;
  inst._zod ?? (inst._zod = {});
  inst._zod.def = def;
  (_a = inst._zod).onattach ?? (_a.onattach = []);
});
const numericOriginMap = {
  number: "number",
  bigint: "bigint",
  object: "date"
};
const $ZodCheckLessThan = /* @__PURE__ */ $constructor("$ZodCheckLessThan", (inst, def) => {
  $ZodCheck.init(inst, def);
  const origin = numericOriginMap[typeof def.value];
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    const curr = (def.inclusive ? bag.maximum : bag.exclusiveMaximum) ?? Number.POSITIVE_INFINITY;
    if (def.value < curr) {
      if (def.inclusive)
        bag.maximum = def.value;
      else
        bag.exclusiveMaximum = def.value;
    }
  });
  inst._zod.check = (payload) => {
    if (def.inclusive ? payload.value <= def.value : payload.value < def.value) {
      return;
    }
    payload.issues.push({
      origin,
      code: "too_big",
      maximum: def.value,
      input: payload.value,
      inclusive: def.inclusive,
      inst,
      continue: !def.abort
    });
  };
});
const $ZodCheckGreaterThan = /* @__PURE__ */ $constructor("$ZodCheckGreaterThan", (inst, def) => {
  $ZodCheck.init(inst, def);
  const origin = numericOriginMap[typeof def.value];
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    const curr = (def.inclusive ? bag.minimum : bag.exclusiveMinimum) ?? Number.NEGATIVE_INFINITY;
    if (def.value > curr) {
      if (def.inclusive)
        bag.minimum = def.value;
      else
        bag.exclusiveMinimum = def.value;
    }
  });
  inst._zod.check = (payload) => {
    if (def.inclusive ? payload.value >= def.value : payload.value > def.value) {
      return;
    }
    payload.issues.push({
      origin,
      code: "too_small",
      minimum: def.value,
      input: payload.value,
      inclusive: def.inclusive,
      inst,
      continue: !def.abort
    });
  };
});
const $ZodCheckMultipleOf = /* @__PURE__ */ $constructor("$ZodCheckMultipleOf", (inst, def) => {
  $ZodCheck.init(inst, def);
  inst._zod.onattach.push((inst2) => {
    var _a;
    (_a = inst2._zod.bag).multipleOf ?? (_a.multipleOf = def.value);
  });
  inst._zod.check = (payload) => {
    if (typeof payload.value !== typeof def.value)
      throw new Error("Cannot mix number and bigint in multiple_of check.");
    const isMultiple = typeof payload.value === "bigint" ? payload.value % def.value === BigInt(0) : floatSafeRemainder(payload.value, def.value) === 0;
    if (isMultiple)
      return;
    payload.issues.push({
      origin: typeof payload.value,
      code: "not_multiple_of",
      divisor: def.value,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
const $ZodCheckNumberFormat = /* @__PURE__ */ $constructor("$ZodCheckNumberFormat", (inst, def) => {
  $ZodCheck.init(inst, def);
  def.format = def.format || "float64";
  const isInt = def.format?.includes("int");
  const origin = isInt ? "int" : "number";
  const [minimum, maximum] = NUMBER_FORMAT_RANGES[def.format];
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.format = def.format;
    bag.minimum = minimum;
    bag.maximum = maximum;
    if (isInt)
      bag.pattern = integer;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    if (isInt) {
      if (!Number.isInteger(input)) {
        payload.issues.push({
          expected: origin,
          format: def.format,
          code: "invalid_type",
          input,
          inst
        });
        return;
      }
      if (!Number.isSafeInteger(input)) {
        if (input > 0) {
          payload.issues.push({
            input,
            code: "too_big",
            maximum: Number.MAX_SAFE_INTEGER,
            note: "Integers must be within the safe integer range.",
            inst,
            origin,
            continue: !def.abort
          });
        } else {
          payload.issues.push({
            input,
            code: "too_small",
            minimum: Number.MIN_SAFE_INTEGER,
            note: "Integers must be within the safe integer range.",
            inst,
            origin,
            continue: !def.abort
          });
        }
        return;
      }
    }
    if (input < minimum) {
      payload.issues.push({
        origin: "number",
        input,
        code: "too_small",
        minimum,
        inclusive: true,
        inst,
        continue: !def.abort
      });
    }
    if (input > maximum) {
      payload.issues.push({
        origin: "number",
        input,
        code: "too_big",
        maximum,
        inst
      });
    }
  };
});
const $ZodCheckMaxLength = /* @__PURE__ */ $constructor("$ZodCheckMaxLength", (inst, def) => {
  var _a;
  $ZodCheck.init(inst, def);
  (_a = inst._zod.def).when ?? (_a.when = (payload) => {
    const val = payload.value;
    return !nullish(val) && val.length !== void 0;
  });
  inst._zod.onattach.push((inst2) => {
    const curr = inst2._zod.bag.maximum ?? Number.POSITIVE_INFINITY;
    if (def.maximum < curr)
      inst2._zod.bag.maximum = def.maximum;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    const length = input.length;
    if (length <= def.maximum)
      return;
    const origin = getLengthableOrigin(input);
    payload.issues.push({
      origin,
      code: "too_big",
      maximum: def.maximum,
      inclusive: true,
      input,
      inst,
      continue: !def.abort
    });
  };
});
const $ZodCheckMinLength = /* @__PURE__ */ $constructor("$ZodCheckMinLength", (inst, def) => {
  var _a;
  $ZodCheck.init(inst, def);
  (_a = inst._zod.def).when ?? (_a.when = (payload) => {
    const val = payload.value;
    return !nullish(val) && val.length !== void 0;
  });
  inst._zod.onattach.push((inst2) => {
    const curr = inst2._zod.bag.minimum ?? Number.NEGATIVE_INFINITY;
    if (def.minimum > curr)
      inst2._zod.bag.minimum = def.minimum;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    const length = input.length;
    if (length >= def.minimum)
      return;
    const origin = getLengthableOrigin(input);
    payload.issues.push({
      origin,
      code: "too_small",
      minimum: def.minimum,
      inclusive: true,
      input,
      inst,
      continue: !def.abort
    });
  };
});
const $ZodCheckLengthEquals = /* @__PURE__ */ $constructor("$ZodCheckLengthEquals", (inst, def) => {
  var _a;
  $ZodCheck.init(inst, def);
  (_a = inst._zod.def).when ?? (_a.when = (payload) => {
    const val = payload.value;
    return !nullish(val) && val.length !== void 0;
  });
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.minimum = def.length;
    bag.maximum = def.length;
    bag.length = def.length;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    const length = input.length;
    if (length === def.length)
      return;
    const origin = getLengthableOrigin(input);
    const tooBig = length > def.length;
    payload.issues.push({
      origin,
      ...tooBig ? { code: "too_big", maximum: def.length } : { code: "too_small", minimum: def.length },
      inclusive: true,
      exact: true,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
const $ZodCheckStringFormat = /* @__PURE__ */ $constructor("$ZodCheckStringFormat", (inst, def) => {
  var _a, _b;
  $ZodCheck.init(inst, def);
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.format = def.format;
    if (def.pattern) {
      bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
      bag.patterns.add(def.pattern);
    }
  });
  if (def.pattern)
    (_a = inst._zod).check ?? (_a.check = (payload) => {
      def.pattern.lastIndex = 0;
      if (def.pattern.test(payload.value))
        return;
      payload.issues.push({
        origin: "string",
        code: "invalid_format",
        format: def.format,
        input: payload.value,
        ...def.pattern ? { pattern: def.pattern.toString() } : {},
        inst,
        continue: !def.abort
      });
    });
  else
    (_b = inst._zod).check ?? (_b.check = () => {
    });
});
const $ZodCheckRegex = /* @__PURE__ */ $constructor("$ZodCheckRegex", (inst, def) => {
  $ZodCheckStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    def.pattern.lastIndex = 0;
    if (def.pattern.test(payload.value))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "regex",
      input: payload.value,
      pattern: def.pattern.toString(),
      inst,
      continue: !def.abort
    });
  };
});
const $ZodCheckLowerCase = /* @__PURE__ */ $constructor("$ZodCheckLowerCase", (inst, def) => {
  def.pattern ?? (def.pattern = lowercase);
  $ZodCheckStringFormat.init(inst, def);
});
const $ZodCheckUpperCase = /* @__PURE__ */ $constructor("$ZodCheckUpperCase", (inst, def) => {
  def.pattern ?? (def.pattern = uppercase);
  $ZodCheckStringFormat.init(inst, def);
});
const $ZodCheckIncludes = /* @__PURE__ */ $constructor("$ZodCheckIncludes", (inst, def) => {
  $ZodCheck.init(inst, def);
  const escapedRegex = escapeRegex(def.includes);
  const pattern = new RegExp(typeof def.position === "number" ? `^.{${def.position}}${escapedRegex}` : escapedRegex);
  def.pattern = pattern;
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
    bag.patterns.add(pattern);
  });
  inst._zod.check = (payload) => {
    if (payload.value.includes(def.includes, def.position))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "includes",
      includes: def.includes,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
const $ZodCheckStartsWith = /* @__PURE__ */ $constructor("$ZodCheckStartsWith", (inst, def) => {
  $ZodCheck.init(inst, def);
  const pattern = new RegExp(`^${escapeRegex(def.prefix)}.*`);
  def.pattern ?? (def.pattern = pattern);
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
    bag.patterns.add(pattern);
  });
  inst._zod.check = (payload) => {
    if (payload.value.startsWith(def.prefix))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "starts_with",
      prefix: def.prefix,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
const $ZodCheckEndsWith = /* @__PURE__ */ $constructor("$ZodCheckEndsWith", (inst, def) => {
  $ZodCheck.init(inst, def);
  const pattern = new RegExp(`.*${escapeRegex(def.suffix)}$`);
  def.pattern ?? (def.pattern = pattern);
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
    bag.patterns.add(pattern);
  });
  inst._zod.check = (payload) => {
    if (payload.value.endsWith(def.suffix))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "ends_with",
      suffix: def.suffix,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
const $ZodCheckOverwrite = /* @__PURE__ */ $constructor("$ZodCheckOverwrite", (inst, def) => {
  $ZodCheck.init(inst, def);
  inst._zod.check = (payload) => {
    payload.value = def.tx(payload.value);
  };
});
class Doc {
  constructor(args = []) {
    this.content = [];
    this.indent = 0;
    if (this)
      this.args = args;
  }
  indented(fn) {
    this.indent += 1;
    fn(this);
    this.indent -= 1;
  }
  write(arg) {
    if (typeof arg === "function") {
      arg(this, { execution: "sync" });
      arg(this, { execution: "async" });
      return;
    }
    const content = arg;
    const lines = content.split("\n").filter((x) => x);
    const minIndent = Math.min(...lines.map((x) => x.length - x.trimStart().length));
    const dedented = lines.map((x) => x.slice(minIndent)).map((x) => " ".repeat(this.indent * 2) + x);
    for (const line of dedented) {
      this.content.push(line);
    }
  }
  compile() {
    const F = Function;
    const args = this?.args;
    const content = this?.content ?? [``];
    const lines = [...content.map((x) => `  ${x}`)];
    return new F(...args, lines.join("\n"));
  }
}
const version = {
  major: 4,
  minor: 0,
  patch: 0
};
const $ZodType = /* @__PURE__ */ $constructor("$ZodType", (inst, def) => {
  var _a;
  inst ?? (inst = {});
  inst._zod.def = def;
  inst._zod.bag = inst._zod.bag || {};
  inst._zod.version = version;
  const checks = [...inst._zod.def.checks ?? []];
  if (inst._zod.traits.has("$ZodCheck")) {
    checks.unshift(inst);
  }
  for (const ch of checks) {
    for (const fn of ch._zod.onattach) {
      fn(inst);
    }
  }
  if (checks.length === 0) {
    (_a = inst._zod).deferred ?? (_a.deferred = []);
    inst._zod.deferred?.push(() => {
      inst._zod.run = inst._zod.parse;
    });
  } else {
    const runChecks = (payload, checks2, ctx) => {
      let isAborted = aborted(payload);
      let asyncResult;
      for (const ch of checks2) {
        if (ch._zod.def.when) {
          const shouldRun = ch._zod.def.when(payload);
          if (!shouldRun)
            continue;
        } else if (isAborted) {
          continue;
        }
        const currLen = payload.issues.length;
        const _ = ch._zod.check(payload);
        if (_ instanceof Promise && ctx?.async === false) {
          throw new $ZodAsyncError();
        }
        if (asyncResult || _ instanceof Promise) {
          asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
            await _;
            const nextLen = payload.issues.length;
            if (nextLen === currLen)
              return;
            if (!isAborted)
              isAborted = aborted(payload, currLen);
          });
        } else {
          const nextLen = payload.issues.length;
          if (nextLen === currLen)
            continue;
          if (!isAborted)
            isAborted = aborted(payload, currLen);
        }
      }
      if (asyncResult) {
        return asyncResult.then(() => {
          return payload;
        });
      }
      return payload;
    };
    inst._zod.run = (payload, ctx) => {
      const result = inst._zod.parse(payload, ctx);
      if (result instanceof Promise) {
        if (ctx.async === false)
          throw new $ZodAsyncError();
        return result.then((result2) => runChecks(result2, checks, ctx));
      }
      return runChecks(result, checks, ctx);
    };
  }
  inst["~standard"] = {
    validate: (value) => {
      try {
        const r = safeParse$1(inst, value);
        return r.success ? { value: r.data } : { issues: r.error?.issues };
      } catch (_) {
        return safeParseAsync$1(inst, value).then((r) => r.success ? { value: r.data } : { issues: r.error?.issues });
      }
    },
    vendor: "zod",
    version: 1
  };
});
const $ZodString = /* @__PURE__ */ $constructor("$ZodString", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = [...inst?._zod.bag?.patterns ?? []].pop() ?? string$1(inst._zod.bag);
  inst._zod.parse = (payload, _) => {
    if (def.coerce)
      try {
        payload.value = String(payload.value);
      } catch (_2) {
      }
    if (typeof payload.value === "string")
      return payload;
    payload.issues.push({
      expected: "string",
      code: "invalid_type",
      input: payload.value,
      inst
    });
    return payload;
  };
});
const $ZodStringFormat = /* @__PURE__ */ $constructor("$ZodStringFormat", (inst, def) => {
  $ZodCheckStringFormat.init(inst, def);
  $ZodString.init(inst, def);
});
const $ZodGUID = /* @__PURE__ */ $constructor("$ZodGUID", (inst, def) => {
  def.pattern ?? (def.pattern = guid);
  $ZodStringFormat.init(inst, def);
});
const $ZodUUID = /* @__PURE__ */ $constructor("$ZodUUID", (inst, def) => {
  if (def.version) {
    const versionMap = {
      v1: 1,
      v2: 2,
      v3: 3,
      v4: 4,
      v5: 5,
      v6: 6,
      v7: 7,
      v8: 8
    };
    const v = versionMap[def.version];
    if (v === void 0)
      throw new Error(`Invalid UUID version: "${def.version}"`);
    def.pattern ?? (def.pattern = uuid(v));
  } else
    def.pattern ?? (def.pattern = uuid());
  $ZodStringFormat.init(inst, def);
});
const $ZodEmail = /* @__PURE__ */ $constructor("$ZodEmail", (inst, def) => {
  def.pattern ?? (def.pattern = email);
  $ZodStringFormat.init(inst, def);
});
const $ZodURL = /* @__PURE__ */ $constructor("$ZodURL", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    try {
      const orig = payload.value;
      const url = new URL(orig);
      const href = url.href;
      if (def.hostname) {
        def.hostname.lastIndex = 0;
        if (!def.hostname.test(url.hostname)) {
          payload.issues.push({
            code: "invalid_format",
            format: "url",
            note: "Invalid hostname",
            pattern: hostname.source,
            input: payload.value,
            inst,
            continue: !def.abort
          });
        }
      }
      if (def.protocol) {
        def.protocol.lastIndex = 0;
        if (!def.protocol.test(url.protocol.endsWith(":") ? url.protocol.slice(0, -1) : url.protocol)) {
          payload.issues.push({
            code: "invalid_format",
            format: "url",
            note: "Invalid protocol",
            pattern: def.protocol.source,
            input: payload.value,
            inst,
            continue: !def.abort
          });
        }
      }
      if (!orig.endsWith("/") && href.endsWith("/")) {
        payload.value = href.slice(0, -1);
      } else {
        payload.value = href;
      }
      return;
    } catch (_) {
      payload.issues.push({
        code: "invalid_format",
        format: "url",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
const $ZodEmoji = /* @__PURE__ */ $constructor("$ZodEmoji", (inst, def) => {
  def.pattern ?? (def.pattern = emoji());
  $ZodStringFormat.init(inst, def);
});
const $ZodNanoID = /* @__PURE__ */ $constructor("$ZodNanoID", (inst, def) => {
  def.pattern ?? (def.pattern = nanoid);
  $ZodStringFormat.init(inst, def);
});
const $ZodCUID = /* @__PURE__ */ $constructor("$ZodCUID", (inst, def) => {
  def.pattern ?? (def.pattern = cuid);
  $ZodStringFormat.init(inst, def);
});
const $ZodCUID2 = /* @__PURE__ */ $constructor("$ZodCUID2", (inst, def) => {
  def.pattern ?? (def.pattern = cuid2);
  $ZodStringFormat.init(inst, def);
});
const $ZodULID = /* @__PURE__ */ $constructor("$ZodULID", (inst, def) => {
  def.pattern ?? (def.pattern = ulid);
  $ZodStringFormat.init(inst, def);
});
const $ZodXID = /* @__PURE__ */ $constructor("$ZodXID", (inst, def) => {
  def.pattern ?? (def.pattern = xid);
  $ZodStringFormat.init(inst, def);
});
const $ZodKSUID = /* @__PURE__ */ $constructor("$ZodKSUID", (inst, def) => {
  def.pattern ?? (def.pattern = ksuid);
  $ZodStringFormat.init(inst, def);
});
const $ZodISODateTime = /* @__PURE__ */ $constructor("$ZodISODateTime", (inst, def) => {
  def.pattern ?? (def.pattern = datetime$1(def));
  $ZodStringFormat.init(inst, def);
});
const $ZodISODate = /* @__PURE__ */ $constructor("$ZodISODate", (inst, def) => {
  def.pattern ?? (def.pattern = date$1);
  $ZodStringFormat.init(inst, def);
});
const $ZodISOTime = /* @__PURE__ */ $constructor("$ZodISOTime", (inst, def) => {
  def.pattern ?? (def.pattern = time$1(def));
  $ZodStringFormat.init(inst, def);
});
const $ZodISODuration = /* @__PURE__ */ $constructor("$ZodISODuration", (inst, def) => {
  def.pattern ?? (def.pattern = duration$1);
  $ZodStringFormat.init(inst, def);
});
const $ZodIPv4 = /* @__PURE__ */ $constructor("$ZodIPv4", (inst, def) => {
  def.pattern ?? (def.pattern = ipv4);
  $ZodStringFormat.init(inst, def);
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.format = `ipv4`;
  });
});
const $ZodIPv6 = /* @__PURE__ */ $constructor("$ZodIPv6", (inst, def) => {
  def.pattern ?? (def.pattern = ipv6);
  $ZodStringFormat.init(inst, def);
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.format = `ipv6`;
  });
  inst._zod.check = (payload) => {
    try {
      new URL(`http://[${payload.value}]`);
    } catch {
      payload.issues.push({
        code: "invalid_format",
        format: "ipv6",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
const $ZodCIDRv4 = /* @__PURE__ */ $constructor("$ZodCIDRv4", (inst, def) => {
  def.pattern ?? (def.pattern = cidrv4);
  $ZodStringFormat.init(inst, def);
});
const $ZodCIDRv6 = /* @__PURE__ */ $constructor("$ZodCIDRv6", (inst, def) => {
  def.pattern ?? (def.pattern = cidrv6);
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    const [address, prefix] = payload.value.split("/");
    try {
      if (!prefix)
        throw new Error();
      const prefixNum = Number(prefix);
      if (`${prefixNum}` !== prefix)
        throw new Error();
      if (prefixNum < 0 || prefixNum > 128)
        throw new Error();
      new URL(`http://[${address}]`);
    } catch {
      payload.issues.push({
        code: "invalid_format",
        format: "cidrv6",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
function isValidBase64(data) {
  if (data === "")
    return true;
  if (data.length % 4 !== 0)
    return false;
  try {
    atob(data);
    return true;
  } catch {
    return false;
  }
}
const $ZodBase64 = /* @__PURE__ */ $constructor("$ZodBase64", (inst, def) => {
  def.pattern ?? (def.pattern = base64);
  $ZodStringFormat.init(inst, def);
  inst._zod.onattach.push((inst2) => {
    inst2._zod.bag.contentEncoding = "base64";
  });
  inst._zod.check = (payload) => {
    if (isValidBase64(payload.value))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "base64",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
function isValidBase64URL(data) {
  if (!base64url.test(data))
    return false;
  const base642 = data.replace(/[-_]/g, (c) => c === "-" ? "+" : "/");
  const padded = base642.padEnd(Math.ceil(base642.length / 4) * 4, "=");
  return isValidBase64(padded);
}
const $ZodBase64URL = /* @__PURE__ */ $constructor("$ZodBase64URL", (inst, def) => {
  def.pattern ?? (def.pattern = base64url);
  $ZodStringFormat.init(inst, def);
  inst._zod.onattach.push((inst2) => {
    inst2._zod.bag.contentEncoding = "base64url";
  });
  inst._zod.check = (payload) => {
    if (isValidBase64URL(payload.value))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "base64url",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
const $ZodE164 = /* @__PURE__ */ $constructor("$ZodE164", (inst, def) => {
  def.pattern ?? (def.pattern = e164);
  $ZodStringFormat.init(inst, def);
});
function isValidJWT(token, algorithm = null) {
  try {
    const tokensParts = token.split(".");
    if (tokensParts.length !== 3)
      return false;
    const [header] = tokensParts;
    if (!header)
      return false;
    const parsedHeader = JSON.parse(atob(header));
    if ("typ" in parsedHeader && parsedHeader?.typ !== "JWT")
      return false;
    if (!parsedHeader.alg)
      return false;
    if (algorithm && (!("alg" in parsedHeader) || parsedHeader.alg !== algorithm))
      return false;
    return true;
  } catch {
    return false;
  }
}
const $ZodJWT = /* @__PURE__ */ $constructor("$ZodJWT", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (isValidJWT(payload.value, def.alg))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "jwt",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
const $ZodNumber = /* @__PURE__ */ $constructor("$ZodNumber", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = inst._zod.bag.pattern ?? number$1;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = Number(payload.value);
      } catch (_) {
      }
    const input = payload.value;
    if (typeof input === "number" && !Number.isNaN(input) && Number.isFinite(input)) {
      return payload;
    }
    const received = typeof input === "number" ? Number.isNaN(input) ? "NaN" : !Number.isFinite(input) ? "Infinity" : void 0 : void 0;
    payload.issues.push({
      expected: "number",
      code: "invalid_type",
      input,
      inst,
      ...received ? { received } : {}
    });
    return payload;
  };
});
const $ZodNumberFormat = /* @__PURE__ */ $constructor("$ZodNumber", (inst, def) => {
  $ZodCheckNumberFormat.init(inst, def);
  $ZodNumber.init(inst, def);
});
const $ZodBoolean = /* @__PURE__ */ $constructor("$ZodBoolean", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = boolean$1;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = Boolean(payload.value);
      } catch (_) {
      }
    const input = payload.value;
    if (typeof input === "boolean")
      return payload;
    payload.issues.push({
      expected: "boolean",
      code: "invalid_type",
      input,
      inst
    });
    return payload;
  };
});
const $ZodUnknown = /* @__PURE__ */ $constructor("$ZodUnknown", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload) => payload;
});
const $ZodNever = /* @__PURE__ */ $constructor("$ZodNever", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    payload.issues.push({
      expected: "never",
      code: "invalid_type",
      input: payload.value,
      inst
    });
    return payload;
  };
});
function handleArrayResult(result, final, index) {
  if (result.issues.length) {
    final.issues.push(...prefixIssues(index, result.issues));
  }
  final.value[index] = result.value;
}
const $ZodArray = /* @__PURE__ */ $constructor("$ZodArray", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!Array.isArray(input)) {
      payload.issues.push({
        expected: "array",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    payload.value = Array(input.length);
    const proms = [];
    for (let i = 0; i < input.length; i++) {
      const item = input[i];
      const result = def.element._zod.run({
        value: item,
        issues: []
      }, ctx);
      if (result instanceof Promise) {
        proms.push(result.then((result2) => handleArrayResult(result2, payload, i)));
      } else {
        handleArrayResult(result, payload, i);
      }
    }
    if (proms.length) {
      return Promise.all(proms).then(() => payload);
    }
    return payload;
  };
});
function handleObjectResult(result, final, key) {
  if (result.issues.length) {
    final.issues.push(...prefixIssues(key, result.issues));
  }
  final.value[key] = result.value;
}
function handleOptionalObjectResult(result, final, key, input) {
  if (result.issues.length) {
    if (input[key] === void 0) {
      if (key in input) {
        final.value[key] = void 0;
      } else {
        final.value[key] = result.value;
      }
    } else {
      final.issues.push(...prefixIssues(key, result.issues));
    }
  } else if (result.value === void 0) {
    if (key in input)
      final.value[key] = void 0;
  } else {
    final.value[key] = result.value;
  }
}
const $ZodObject = /* @__PURE__ */ $constructor("$ZodObject", (inst, def) => {
  $ZodType.init(inst, def);
  const _normalized = cached(() => {
    const keys = Object.keys(def.shape);
    for (const k of keys) {
      if (!(def.shape[k] instanceof $ZodType)) {
        throw new Error(`Invalid element at key "${k}": expected a Zod schema`);
      }
    }
    const okeys = optionalKeys(def.shape);
    return {
      shape: def.shape,
      keys,
      keySet: new Set(keys),
      numKeys: keys.length,
      optionalKeys: new Set(okeys)
    };
  });
  defineLazy(inst._zod, "propValues", () => {
    const shape = def.shape;
    const propValues = {};
    for (const key in shape) {
      const field = shape[key]._zod;
      if (field.values) {
        propValues[key] ?? (propValues[key] = /* @__PURE__ */ new Set());
        for (const v of field.values)
          propValues[key].add(v);
      }
    }
    return propValues;
  });
  const generateFastpass = (shape) => {
    const doc = new Doc(["shape", "payload", "ctx"]);
    const normalized = _normalized.value;
    const parseStr = (key) => {
      const k = esc$1(key);
      return `shape[${k}]._zod.run({ value: input[${k}], issues: [] }, ctx)`;
    };
    doc.write(`const input = payload.value;`);
    const ids = /* @__PURE__ */ Object.create(null);
    let counter = 0;
    for (const key of normalized.keys) {
      ids[key] = `key_${counter++}`;
    }
    doc.write(`const newResult = {}`);
    for (const key of normalized.keys) {
      if (normalized.optionalKeys.has(key)) {
        const id2 = ids[key];
        doc.write(`const ${id2} = ${parseStr(key)};`);
        const k = esc$1(key);
        doc.write(`
        if (${id2}.issues.length) {
          if (input[${k}] === undefined) {
            if (${k} in input) {
              newResult[${k}] = undefined;
            }
          } else {
            payload.issues = payload.issues.concat(
              ${id2}.issues.map((iss) => ({
                ...iss,
                path: iss.path ? [${k}, ...iss.path] : [${k}],
              }))
            );
          }
        } else if (${id2}.value === undefined) {
          if (${k} in input) newResult[${k}] = undefined;
        } else {
          newResult[${k}] = ${id2}.value;
        }
        `);
      } else {
        const id2 = ids[key];
        doc.write(`const ${id2} = ${parseStr(key)};`);
        doc.write(`
          if (${id2}.issues.length) payload.issues = payload.issues.concat(${id2}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${esc$1(key)}, ...iss.path] : [${esc$1(key)}]
          })));`);
        doc.write(`newResult[${esc$1(key)}] = ${id2}.value`);
      }
    }
    doc.write(`payload.value = newResult;`);
    doc.write(`return payload;`);
    const fn = doc.compile();
    return (payload, ctx) => fn(shape, payload, ctx);
  };
  let fastpass;
  const isObject$1 = isObject;
  const jit = !globalConfig.jitless;
  const allowsEval$1 = allowsEval;
  const fastEnabled = jit && allowsEval$1.value;
  const catchall = def.catchall;
  let value;
  inst._zod.parse = (payload, ctx) => {
    value ?? (value = _normalized.value);
    const input = payload.value;
    if (!isObject$1(input)) {
      payload.issues.push({
        expected: "object",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    const proms = [];
    if (jit && fastEnabled && ctx?.async === false && ctx.jitless !== true) {
      if (!fastpass)
        fastpass = generateFastpass(def.shape);
      payload = fastpass(payload, ctx);
    } else {
      payload.value = {};
      const shape = value.shape;
      for (const key of value.keys) {
        const el = shape[key];
        const r = el._zod.run({ value: input[key], issues: [] }, ctx);
        const isOptional = el._zod.optin === "optional" && el._zod.optout === "optional";
        if (r instanceof Promise) {
          proms.push(r.then((r2) => isOptional ? handleOptionalObjectResult(r2, payload, key, input) : handleObjectResult(r2, payload, key)));
        } else if (isOptional) {
          handleOptionalObjectResult(r, payload, key, input);
        } else {
          handleObjectResult(r, payload, key);
        }
      }
    }
    if (!catchall) {
      return proms.length ? Promise.all(proms).then(() => payload) : payload;
    }
    const unrecognized = [];
    const keySet = value.keySet;
    const _catchall = catchall._zod;
    const t = _catchall.def.type;
    for (const key of Object.keys(input)) {
      if (keySet.has(key))
        continue;
      if (t === "never") {
        unrecognized.push(key);
        continue;
      }
      const r = _catchall.run({ value: input[key], issues: [] }, ctx);
      if (r instanceof Promise) {
        proms.push(r.then((r2) => handleObjectResult(r2, payload, key)));
      } else {
        handleObjectResult(r, payload, key);
      }
    }
    if (unrecognized.length) {
      payload.issues.push({
        code: "unrecognized_keys",
        keys: unrecognized,
        input,
        inst
      });
    }
    if (!proms.length)
      return payload;
    return Promise.all(proms).then(() => {
      return payload;
    });
  };
});
function handleUnionResults(results, final, inst, ctx) {
  for (const result of results) {
    if (result.issues.length === 0) {
      final.value = result.value;
      return final;
    }
  }
  final.issues.push({
    code: "invalid_union",
    input: final.value,
    inst,
    errors: results.map((result) => result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
  });
  return final;
}
const $ZodUnion = /* @__PURE__ */ $constructor("$ZodUnion", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "optin", () => def.options.some((o) => o._zod.optin === "optional") ? "optional" : void 0);
  defineLazy(inst._zod, "optout", () => def.options.some((o) => o._zod.optout === "optional") ? "optional" : void 0);
  defineLazy(inst._zod, "values", () => {
    if (def.options.every((o) => o._zod.values)) {
      return new Set(def.options.flatMap((option) => Array.from(option._zod.values)));
    }
    return void 0;
  });
  defineLazy(inst._zod, "pattern", () => {
    if (def.options.every((o) => o._zod.pattern)) {
      const patterns = def.options.map((o) => o._zod.pattern);
      return new RegExp(`^(${patterns.map((p) => cleanRegex(p.source)).join("|")})$`);
    }
    return void 0;
  });
  inst._zod.parse = (payload, ctx) => {
    let async = false;
    const results = [];
    for (const option of def.options) {
      const result = option._zod.run({
        value: payload.value,
        issues: []
      }, ctx);
      if (result instanceof Promise) {
        results.push(result);
        async = true;
      } else {
        if (result.issues.length === 0)
          return result;
        results.push(result);
      }
    }
    if (!async)
      return handleUnionResults(results, payload, inst, ctx);
    return Promise.all(results).then((results2) => {
      return handleUnionResults(results2, payload, inst, ctx);
    });
  };
});
const $ZodIntersection = /* @__PURE__ */ $constructor("$ZodIntersection", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    const left = def.left._zod.run({ value: input, issues: [] }, ctx);
    const right = def.right._zod.run({ value: input, issues: [] }, ctx);
    const async = left instanceof Promise || right instanceof Promise;
    if (async) {
      return Promise.all([left, right]).then(([left2, right2]) => {
        return handleIntersectionResults(payload, left2, right2);
      });
    }
    return handleIntersectionResults(payload, left, right);
  };
});
function mergeValues(a, b) {
  if (a === b) {
    return { valid: true, data: a };
  }
  if (a instanceof Date && b instanceof Date && +a === +b) {
    return { valid: true, data: a };
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const bKeys = Object.keys(b);
    const sharedKeys = Object.keys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return {
          valid: false,
          mergeErrorPath: [key, ...sharedValue.mergeErrorPath]
        };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return { valid: false, mergeErrorPath: [] };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return {
          valid: false,
          mergeErrorPath: [index, ...sharedValue.mergeErrorPath]
        };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  }
  return { valid: false, mergeErrorPath: [] };
}
function handleIntersectionResults(result, left, right) {
  if (left.issues.length) {
    result.issues.push(...left.issues);
  }
  if (right.issues.length) {
    result.issues.push(...right.issues);
  }
  if (aborted(result))
    return result;
  const merged = mergeValues(left.value, right.value);
  if (!merged.valid) {
    throw new Error(`Unmergable intersection. Error path: ${JSON.stringify(merged.mergeErrorPath)}`);
  }
  result.value = merged.data;
  return result;
}
const $ZodTuple = /* @__PURE__ */ $constructor("$ZodTuple", (inst, def) => {
  $ZodType.init(inst, def);
  const items = def.items;
  const optStart = items.length - [...items].reverse().findIndex((item) => item._zod.optin !== "optional");
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!Array.isArray(input)) {
      payload.issues.push({
        input,
        inst,
        expected: "tuple",
        code: "invalid_type"
      });
      return payload;
    }
    payload.value = [];
    const proms = [];
    if (!def.rest) {
      const tooBig = input.length > items.length;
      const tooSmall = input.length < optStart - 1;
      if (tooBig || tooSmall) {
        payload.issues.push({
          input,
          inst,
          origin: "array",
          ...tooBig ? { code: "too_big", maximum: items.length } : { code: "too_small", minimum: items.length }
        });
        return payload;
      }
    }
    let i = -1;
    for (const item of items) {
      i++;
      if (i >= input.length) {
        if (i >= optStart)
          continue;
      }
      const result = item._zod.run({
        value: input[i],
        issues: []
      }, ctx);
      if (result instanceof Promise) {
        proms.push(result.then((result2) => handleTupleResult(result2, payload, i)));
      } else {
        handleTupleResult(result, payload, i);
      }
    }
    if (def.rest) {
      const rest = input.slice(items.length);
      for (const el of rest) {
        i++;
        const result = def.rest._zod.run({
          value: el,
          issues: []
        }, ctx);
        if (result instanceof Promise) {
          proms.push(result.then((result2) => handleTupleResult(result2, payload, i)));
        } else {
          handleTupleResult(result, payload, i);
        }
      }
    }
    if (proms.length)
      return Promise.all(proms).then(() => payload);
    return payload;
  };
});
function handleTupleResult(result, final, index) {
  if (result.issues.length) {
    final.issues.push(...prefixIssues(index, result.issues));
  }
  final.value[index] = result.value;
}
const $ZodRecord = /* @__PURE__ */ $constructor("$ZodRecord", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!isPlainObject(input)) {
      payload.issues.push({
        expected: "record",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    const proms = [];
    if (def.keyType._zod.values) {
      const values = def.keyType._zod.values;
      payload.value = {};
      for (const key of values) {
        if (typeof key === "string" || typeof key === "number" || typeof key === "symbol") {
          const result = def.valueType._zod.run({ value: input[key], issues: [] }, ctx);
          if (result instanceof Promise) {
            proms.push(result.then((result2) => {
              if (result2.issues.length) {
                payload.issues.push(...prefixIssues(key, result2.issues));
              }
              payload.value[key] = result2.value;
            }));
          } else {
            if (result.issues.length) {
              payload.issues.push(...prefixIssues(key, result.issues));
            }
            payload.value[key] = result.value;
          }
        }
      }
      let unrecognized;
      for (const key in input) {
        if (!values.has(key)) {
          unrecognized = unrecognized ?? [];
          unrecognized.push(key);
        }
      }
      if (unrecognized && unrecognized.length > 0) {
        payload.issues.push({
          code: "unrecognized_keys",
          input,
          inst,
          keys: unrecognized
        });
      }
    } else {
      payload.value = {};
      for (const key of Reflect.ownKeys(input)) {
        if (key === "__proto__")
          continue;
        const keyResult = def.keyType._zod.run({ value: key, issues: [] }, ctx);
        if (keyResult instanceof Promise) {
          throw new Error("Async schemas not supported in object keys currently");
        }
        if (keyResult.issues.length) {
          payload.issues.push({
            origin: "record",
            code: "invalid_key",
            issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config())),
            input: key,
            path: [key],
            inst
          });
          payload.value[keyResult.value] = keyResult.value;
          continue;
        }
        const result = def.valueType._zod.run({ value: input[key], issues: [] }, ctx);
        if (result instanceof Promise) {
          proms.push(result.then((result2) => {
            if (result2.issues.length) {
              payload.issues.push(...prefixIssues(key, result2.issues));
            }
            payload.value[keyResult.value] = result2.value;
          }));
        } else {
          if (result.issues.length) {
            payload.issues.push(...prefixIssues(key, result.issues));
          }
          payload.value[keyResult.value] = result.value;
        }
      }
    }
    if (proms.length) {
      return Promise.all(proms).then(() => payload);
    }
    return payload;
  };
});
const $ZodEnum = /* @__PURE__ */ $constructor("$ZodEnum", (inst, def) => {
  $ZodType.init(inst, def);
  const values = getEnumValues(def.entries);
  inst._zod.values = new Set(values);
  inst._zod.pattern = new RegExp(`^(${values.filter((k) => propertyKeyTypes.has(typeof k)).map((o) => typeof o === "string" ? escapeRegex(o) : o.toString()).join("|")})$`);
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (inst._zod.values.has(input)) {
      return payload;
    }
    payload.issues.push({
      code: "invalid_value",
      values,
      input,
      inst
    });
    return payload;
  };
});
const $ZodLiteral = /* @__PURE__ */ $constructor("$ZodLiteral", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.values = new Set(def.values);
  inst._zod.pattern = new RegExp(`^(${def.values.map((o) => typeof o === "string" ? escapeRegex(o) : o ? o.toString() : String(o)).join("|")})$`);
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (inst._zod.values.has(input)) {
      return payload;
    }
    payload.issues.push({
      code: "invalid_value",
      values: def.values,
      input,
      inst
    });
    return payload;
  };
});
const $ZodTransform = /* @__PURE__ */ $constructor("$ZodTransform", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    const _out = def.transform(payload.value, payload);
    if (_ctx.async) {
      const output = _out instanceof Promise ? _out : Promise.resolve(_out);
      return output.then((output2) => {
        payload.value = output2;
        return payload;
      });
    }
    if (_out instanceof Promise) {
      throw new $ZodAsyncError();
    }
    payload.value = _out;
    return payload;
  };
});
const $ZodOptional = /* @__PURE__ */ $constructor("$ZodOptional", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  inst._zod.optout = "optional";
  defineLazy(inst._zod, "values", () => {
    return def.innerType._zod.values ? /* @__PURE__ */ new Set([...def.innerType._zod.values, void 0]) : void 0;
  });
  defineLazy(inst._zod, "pattern", () => {
    const pattern = def.innerType._zod.pattern;
    return pattern ? new RegExp(`^(${cleanRegex(pattern.source)})?$`) : void 0;
  });
  inst._zod.parse = (payload, ctx) => {
    if (def.innerType._zod.optin === "optional") {
      return def.innerType._zod.run(payload, ctx);
    }
    if (payload.value === void 0) {
      return payload;
    }
    return def.innerType._zod.run(payload, ctx);
  };
});
const $ZodNullable = /* @__PURE__ */ $constructor("$ZodNullable", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "optin", () => def.innerType._zod.optin);
  defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
  defineLazy(inst._zod, "pattern", () => {
    const pattern = def.innerType._zod.pattern;
    return pattern ? new RegExp(`^(${cleanRegex(pattern.source)}|null)$`) : void 0;
  });
  defineLazy(inst._zod, "values", () => {
    return def.innerType._zod.values ? /* @__PURE__ */ new Set([...def.innerType._zod.values, null]) : void 0;
  });
  inst._zod.parse = (payload, ctx) => {
    if (payload.value === null)
      return payload;
    return def.innerType._zod.run(payload, ctx);
  };
});
const $ZodDefault = /* @__PURE__ */ $constructor("$ZodDefault", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (payload.value === void 0) {
      payload.value = def.defaultValue;
      return payload;
    }
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result2) => handleDefaultResult(result2, def));
    }
    return handleDefaultResult(result, def);
  };
});
function handleDefaultResult(payload, def) {
  if (payload.value === void 0) {
    payload.value = def.defaultValue;
  }
  return payload;
}
const $ZodPrefault = /* @__PURE__ */ $constructor("$ZodPrefault", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (payload.value === void 0) {
      payload.value = def.defaultValue;
    }
    return def.innerType._zod.run(payload, ctx);
  };
});
const $ZodNonOptional = /* @__PURE__ */ $constructor("$ZodNonOptional", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "values", () => {
    const v = def.innerType._zod.values;
    return v ? new Set([...v].filter((x) => x !== void 0)) : void 0;
  });
  inst._zod.parse = (payload, ctx) => {
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result2) => handleNonOptionalResult(result2, inst));
    }
    return handleNonOptionalResult(result, inst);
  };
});
function handleNonOptionalResult(payload, inst) {
  if (!payload.issues.length && payload.value === void 0) {
    payload.issues.push({
      code: "invalid_type",
      expected: "nonoptional",
      input: payload.value,
      inst
    });
  }
  return payload;
}
const $ZodCatch = /* @__PURE__ */ $constructor("$ZodCatch", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result2) => {
        payload.value = result2.value;
        if (result2.issues.length) {
          payload.value = def.catchValue({
            ...payload,
            error: {
              issues: result2.issues.map((iss) => finalizeIssue(iss, ctx, config()))
            },
            input: payload.value
          });
          payload.issues = [];
        }
        return payload;
      });
    }
    payload.value = result.value;
    if (result.issues.length) {
      payload.value = def.catchValue({
        ...payload,
        error: {
          issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config()))
        },
        input: payload.value
      });
      payload.issues = [];
    }
    return payload;
  };
});
const $ZodPipe = /* @__PURE__ */ $constructor("$ZodPipe", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "values", () => def.in._zod.values);
  defineLazy(inst._zod, "optin", () => def.in._zod.optin);
  defineLazy(inst._zod, "optout", () => def.out._zod.optout);
  inst._zod.parse = (payload, ctx) => {
    const left = def.in._zod.run(payload, ctx);
    if (left instanceof Promise) {
      return left.then((left2) => handlePipeResult(left2, def, ctx));
    }
    return handlePipeResult(left, def, ctx);
  };
});
function handlePipeResult(left, def, ctx) {
  if (aborted(left)) {
    return left;
  }
  return def.out._zod.run({ value: left.value, issues: left.issues }, ctx);
}
const $ZodReadonly = /* @__PURE__ */ $constructor("$ZodReadonly", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "propValues", () => def.innerType._zod.propValues);
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  defineLazy(inst._zod, "optin", () => def.innerType._zod.optin);
  defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
  inst._zod.parse = (payload, ctx) => {
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then(handleReadonlyResult);
    }
    return handleReadonlyResult(result);
  };
});
function handleReadonlyResult(payload) {
  payload.value = Object.freeze(payload.value);
  return payload;
}
const $ZodCustom = /* @__PURE__ */ $constructor("$ZodCustom", (inst, def) => {
  $ZodCheck.init(inst, def);
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _) => {
    return payload;
  };
  inst._zod.check = (payload) => {
    const input = payload.value;
    const r = def.fn(input);
    if (r instanceof Promise) {
      return r.then((r2) => handleRefineResult(r2, payload, input, inst));
    }
    handleRefineResult(r, payload, input, inst);
    return;
  };
});
function handleRefineResult(result, payload, input, inst) {
  if (!result) {
    const _iss = {
      code: "custom",
      input,
      inst,
      // incorporates params.error into issue reporting
      path: [...inst._zod.def.path ?? []],
      // incorporates params.error into issue reporting
      continue: !inst._zod.def.abort
      // params: inst._zod.def.params,
    };
    if (inst._zod.def.params)
      _iss.params = inst._zod.def.params;
    payload.issues.push(issue(_iss));
  }
}
class $ZodRegistry {
  constructor() {
    this._map = /* @__PURE__ */ new Map();
    this._idmap = /* @__PURE__ */ new Map();
  }
  add(schema, ..._meta) {
    const meta = _meta[0];
    this._map.set(schema, meta);
    if (meta && typeof meta === "object" && "id" in meta) {
      if (this._idmap.has(meta.id)) {
        throw new Error(`ID ${meta.id} already exists in the registry`);
      }
      this._idmap.set(meta.id, schema);
    }
    return this;
  }
  clear() {
    this._map = /* @__PURE__ */ new Map();
    this._idmap = /* @__PURE__ */ new Map();
    return this;
  }
  remove(schema) {
    const meta = this._map.get(schema);
    if (meta && typeof meta === "object" && "id" in meta) {
      this._idmap.delete(meta.id);
    }
    this._map.delete(schema);
    return this;
  }
  get(schema) {
    const p = schema._zod.parent;
    if (p) {
      const pm = { ...this.get(p) ?? {} };
      delete pm.id;
      return { ...pm, ...this._map.get(schema) };
    }
    return this._map.get(schema);
  }
  has(schema) {
    return this._map.has(schema);
  }
}
function registry() {
  return new $ZodRegistry();
}
const globalRegistry = /* @__PURE__ */ registry();
function _string(Class, params) {
  return new Class({
    type: "string",
    ...normalizeParams(params)
  });
}
function _email(Class, params) {
  return new Class({
    type: "string",
    format: "email",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _guid(Class, params) {
  return new Class({
    type: "string",
    format: "guid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _uuid(Class, params) {
  return new Class({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _uuidv4(Class, params) {
  return new Class({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v4",
    ...normalizeParams(params)
  });
}
function _uuidv6(Class, params) {
  return new Class({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v6",
    ...normalizeParams(params)
  });
}
function _uuidv7(Class, params) {
  return new Class({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v7",
    ...normalizeParams(params)
  });
}
function _url(Class, params) {
  return new Class({
    type: "string",
    format: "url",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _emoji(Class, params) {
  return new Class({
    type: "string",
    format: "emoji",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _nanoid(Class, params) {
  return new Class({
    type: "string",
    format: "nanoid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _cuid(Class, params) {
  return new Class({
    type: "string",
    format: "cuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _cuid2(Class, params) {
  return new Class({
    type: "string",
    format: "cuid2",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _ulid(Class, params) {
  return new Class({
    type: "string",
    format: "ulid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _xid(Class, params) {
  return new Class({
    type: "string",
    format: "xid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _ksuid(Class, params) {
  return new Class({
    type: "string",
    format: "ksuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _ipv4(Class, params) {
  return new Class({
    type: "string",
    format: "ipv4",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _ipv6(Class, params) {
  return new Class({
    type: "string",
    format: "ipv6",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _cidrv4(Class, params) {
  return new Class({
    type: "string",
    format: "cidrv4",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _cidrv6(Class, params) {
  return new Class({
    type: "string",
    format: "cidrv6",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _base64(Class, params) {
  return new Class({
    type: "string",
    format: "base64",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _base64url(Class, params) {
  return new Class({
    type: "string",
    format: "base64url",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _e164(Class, params) {
  return new Class({
    type: "string",
    format: "e164",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _jwt(Class, params) {
  return new Class({
    type: "string",
    format: "jwt",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _isoDateTime(Class, params) {
  return new Class({
    type: "string",
    format: "datetime",
    check: "string_format",
    offset: false,
    local: false,
    precision: null,
    ...normalizeParams(params)
  });
}
function _isoDate(Class, params) {
  return new Class({
    type: "string",
    format: "date",
    check: "string_format",
    ...normalizeParams(params)
  });
}
function _isoTime(Class, params) {
  return new Class({
    type: "string",
    format: "time",
    check: "string_format",
    precision: null,
    ...normalizeParams(params)
  });
}
function _isoDuration(Class, params) {
  return new Class({
    type: "string",
    format: "duration",
    check: "string_format",
    ...normalizeParams(params)
  });
}
function _number(Class, params) {
  return new Class({
    type: "number",
    checks: [],
    ...normalizeParams(params)
  });
}
function _int(Class, params) {
  return new Class({
    type: "number",
    check: "number_format",
    abort: false,
    format: "safeint",
    ...normalizeParams(params)
  });
}
function _boolean(Class, params) {
  return new Class({
    type: "boolean",
    ...normalizeParams(params)
  });
}
function _unknown(Class) {
  return new Class({
    type: "unknown"
  });
}
function _never(Class, params) {
  return new Class({
    type: "never",
    ...normalizeParams(params)
  });
}
function _lt(value, params) {
  return new $ZodCheckLessThan({
    check: "less_than",
    ...normalizeParams(params),
    value,
    inclusive: false
  });
}
function _lte(value, params) {
  return new $ZodCheckLessThan({
    check: "less_than",
    ...normalizeParams(params),
    value,
    inclusive: true
  });
}
function _gt(value, params) {
  return new $ZodCheckGreaterThan({
    check: "greater_than",
    ...normalizeParams(params),
    value,
    inclusive: false
  });
}
function _gte(value, params) {
  return new $ZodCheckGreaterThan({
    check: "greater_than",
    ...normalizeParams(params),
    value,
    inclusive: true
  });
}
function _multipleOf(value, params) {
  return new $ZodCheckMultipleOf({
    check: "multiple_of",
    ...normalizeParams(params),
    value
  });
}
function _maxLength(maximum, params) {
  const ch = new $ZodCheckMaxLength({
    check: "max_length",
    ...normalizeParams(params),
    maximum
  });
  return ch;
}
function _minLength(minimum, params) {
  return new $ZodCheckMinLength({
    check: "min_length",
    ...normalizeParams(params),
    minimum
  });
}
function _length(length, params) {
  return new $ZodCheckLengthEquals({
    check: "length_equals",
    ...normalizeParams(params),
    length
  });
}
function _regex(pattern, params) {
  return new $ZodCheckRegex({
    check: "string_format",
    format: "regex",
    ...normalizeParams(params),
    pattern
  });
}
function _lowercase(params) {
  return new $ZodCheckLowerCase({
    check: "string_format",
    format: "lowercase",
    ...normalizeParams(params)
  });
}
function _uppercase(params) {
  return new $ZodCheckUpperCase({
    check: "string_format",
    format: "uppercase",
    ...normalizeParams(params)
  });
}
function _includes(includes, params) {
  return new $ZodCheckIncludes({
    check: "string_format",
    format: "includes",
    ...normalizeParams(params),
    includes
  });
}
function _startsWith(prefix, params) {
  return new $ZodCheckStartsWith({
    check: "string_format",
    format: "starts_with",
    ...normalizeParams(params),
    prefix
  });
}
function _endsWith(suffix, params) {
  return new $ZodCheckEndsWith({
    check: "string_format",
    format: "ends_with",
    ...normalizeParams(params),
    suffix
  });
}
function _overwrite(tx) {
  return new $ZodCheckOverwrite({
    check: "overwrite",
    tx
  });
}
function _normalize(form) {
  return _overwrite((input) => input.normalize(form));
}
function _trim() {
  return _overwrite((input) => input.trim());
}
function _toLowerCase() {
  return _overwrite((input) => input.toLowerCase());
}
function _toUpperCase() {
  return _overwrite((input) => input.toUpperCase());
}
function _array(Class, element, params) {
  return new Class({
    type: "array",
    element,
    // get element() {
    //   return element;
    // },
    ...normalizeParams(params)
  });
}
function _refine(Class, fn, _params) {
  const schema = new Class({
    type: "custom",
    check: "custom",
    fn,
    ...normalizeParams(_params)
  });
  return schema;
}
class JSONSchemaGenerator {
  constructor(params) {
    this.counter = 0;
    this.metadataRegistry = params?.metadata ?? globalRegistry;
    this.target = params?.target ?? "draft-2020-12";
    this.unrepresentable = params?.unrepresentable ?? "throw";
    this.override = params?.override ?? (() => {
    });
    this.io = params?.io ?? "output";
    this.seen = /* @__PURE__ */ new Map();
  }
  process(schema, _params = { path: [], schemaPath: [] }) {
    var _a;
    const def = schema._zod.def;
    const formatMap = {
      guid: "uuid",
      url: "uri",
      datetime: "date-time",
      json_string: "json-string",
      regex: ""
      // do not set
    };
    const seen = this.seen.get(schema);
    if (seen) {
      seen.count++;
      const isCycle = _params.schemaPath.includes(schema);
      if (isCycle) {
        seen.cycle = _params.path;
      }
      return seen.schema;
    }
    const result = { schema: {}, count: 1, cycle: void 0, path: _params.path };
    this.seen.set(schema, result);
    const overrideSchema = schema._zod.toJSONSchema?.();
    if (overrideSchema) {
      result.schema = overrideSchema;
    } else {
      const params = {
        ..._params,
        schemaPath: [..._params.schemaPath, schema],
        path: _params.path
      };
      const parent = schema._zod.parent;
      if (parent) {
        result.ref = parent;
        this.process(parent, params);
        this.seen.get(parent).isParent = true;
      } else {
        const _json = result.schema;
        switch (def.type) {
          case "string": {
            const json = _json;
            json.type = "string";
            const { minimum, maximum, format, patterns, contentEncoding } = schema._zod.bag;
            if (typeof minimum === "number")
              json.minLength = minimum;
            if (typeof maximum === "number")
              json.maxLength = maximum;
            if (format) {
              json.format = formatMap[format] ?? format;
              if (json.format === "")
                delete json.format;
            }
            if (contentEncoding)
              json.contentEncoding = contentEncoding;
            if (patterns && patterns.size > 0) {
              const regexes = [...patterns];
              if (regexes.length === 1)
                json.pattern = regexes[0].source;
              else if (regexes.length > 1) {
                result.schema.allOf = [
                  ...regexes.map((regex) => ({
                    ...this.target === "draft-7" ? { type: "string" } : {},
                    pattern: regex.source
                  }))
                ];
              }
            }
            break;
          }
          case "number": {
            const json = _json;
            const { minimum, maximum, format, multipleOf, exclusiveMaximum, exclusiveMinimum } = schema._zod.bag;
            if (typeof format === "string" && format.includes("int"))
              json.type = "integer";
            else
              json.type = "number";
            if (typeof exclusiveMinimum === "number")
              json.exclusiveMinimum = exclusiveMinimum;
            if (typeof minimum === "number") {
              json.minimum = minimum;
              if (typeof exclusiveMinimum === "number") {
                if (exclusiveMinimum >= minimum)
                  delete json.minimum;
                else
                  delete json.exclusiveMinimum;
              }
            }
            if (typeof exclusiveMaximum === "number")
              json.exclusiveMaximum = exclusiveMaximum;
            if (typeof maximum === "number") {
              json.maximum = maximum;
              if (typeof exclusiveMaximum === "number") {
                if (exclusiveMaximum <= maximum)
                  delete json.maximum;
                else
                  delete json.exclusiveMaximum;
              }
            }
            if (typeof multipleOf === "number")
              json.multipleOf = multipleOf;
            break;
          }
          case "boolean": {
            const json = _json;
            json.type = "boolean";
            break;
          }
          case "bigint": {
            if (this.unrepresentable === "throw") {
              throw new Error("BigInt cannot be represented in JSON Schema");
            }
            break;
          }
          case "symbol": {
            if (this.unrepresentable === "throw") {
              throw new Error("Symbols cannot be represented in JSON Schema");
            }
            break;
          }
          case "null": {
            _json.type = "null";
            break;
          }
          case "any": {
            break;
          }
          case "unknown": {
            break;
          }
          case "undefined": {
            if (this.unrepresentable === "throw") {
              throw new Error("Undefined cannot be represented in JSON Schema");
            }
            break;
          }
          case "void": {
            if (this.unrepresentable === "throw") {
              throw new Error("Void cannot be represented in JSON Schema");
            }
            break;
          }
          case "never": {
            _json.not = {};
            break;
          }
          case "date": {
            if (this.unrepresentable === "throw") {
              throw new Error("Date cannot be represented in JSON Schema");
            }
            break;
          }
          case "array": {
            const json = _json;
            const { minimum, maximum } = schema._zod.bag;
            if (typeof minimum === "number")
              json.minItems = minimum;
            if (typeof maximum === "number")
              json.maxItems = maximum;
            json.type = "array";
            json.items = this.process(def.element, { ...params, path: [...params.path, "items"] });
            break;
          }
          case "object": {
            const json = _json;
            json.type = "object";
            json.properties = {};
            const shape = def.shape;
            for (const key in shape) {
              json.properties[key] = this.process(shape[key], {
                ...params,
                path: [...params.path, "properties", key]
              });
            }
            const allKeys = new Set(Object.keys(shape));
            const requiredKeys = new Set([...allKeys].filter((key) => {
              const v = def.shape[key]._zod;
              if (this.io === "input") {
                return v.optin === void 0;
              } else {
                return v.optout === void 0;
              }
            }));
            if (requiredKeys.size > 0) {
              json.required = Array.from(requiredKeys);
            }
            if (def.catchall?._zod.def.type === "never") {
              json.additionalProperties = false;
            } else if (!def.catchall) {
              if (this.io === "output")
                json.additionalProperties = false;
            } else if (def.catchall) {
              json.additionalProperties = this.process(def.catchall, {
                ...params,
                path: [...params.path, "additionalProperties"]
              });
            }
            break;
          }
          case "union": {
            const json = _json;
            json.anyOf = def.options.map((x, i) => this.process(x, {
              ...params,
              path: [...params.path, "anyOf", i]
            }));
            break;
          }
          case "intersection": {
            const json = _json;
            const a = this.process(def.left, {
              ...params,
              path: [...params.path, "allOf", 0]
            });
            const b = this.process(def.right, {
              ...params,
              path: [...params.path, "allOf", 1]
            });
            const isSimpleIntersection = (val) => "allOf" in val && Object.keys(val).length === 1;
            const allOf = [
              ...isSimpleIntersection(a) ? a.allOf : [a],
              ...isSimpleIntersection(b) ? b.allOf : [b]
            ];
            json.allOf = allOf;
            break;
          }
          case "tuple": {
            const json = _json;
            json.type = "array";
            const prefixItems = def.items.map((x, i) => this.process(x, { ...params, path: [...params.path, "prefixItems", i] }));
            if (this.target === "draft-2020-12") {
              json.prefixItems = prefixItems;
            } else {
              json.items = prefixItems;
            }
            if (def.rest) {
              const rest = this.process(def.rest, {
                ...params,
                path: [...params.path, "items"]
              });
              if (this.target === "draft-2020-12") {
                json.items = rest;
              } else {
                json.additionalItems = rest;
              }
            }
            if (def.rest) {
              json.items = this.process(def.rest, {
                ...params,
                path: [...params.path, "items"]
              });
            }
            const { minimum, maximum } = schema._zod.bag;
            if (typeof minimum === "number")
              json.minItems = minimum;
            if (typeof maximum === "number")
              json.maxItems = maximum;
            break;
          }
          case "record": {
            const json = _json;
            json.type = "object";
            json.propertyNames = this.process(def.keyType, { ...params, path: [...params.path, "propertyNames"] });
            json.additionalProperties = this.process(def.valueType, {
              ...params,
              path: [...params.path, "additionalProperties"]
            });
            break;
          }
          case "map": {
            if (this.unrepresentable === "throw") {
              throw new Error("Map cannot be represented in JSON Schema");
            }
            break;
          }
          case "set": {
            if (this.unrepresentable === "throw") {
              throw new Error("Set cannot be represented in JSON Schema");
            }
            break;
          }
          case "enum": {
            const json = _json;
            const values = getEnumValues(def.entries);
            if (values.every((v) => typeof v === "number"))
              json.type = "number";
            if (values.every((v) => typeof v === "string"))
              json.type = "string";
            json.enum = values;
            break;
          }
          case "literal": {
            const json = _json;
            const vals = [];
            for (const val of def.values) {
              if (val === void 0) {
                if (this.unrepresentable === "throw") {
                  throw new Error("Literal `undefined` cannot be represented in JSON Schema");
                }
              } else if (typeof val === "bigint") {
                if (this.unrepresentable === "throw") {
                  throw new Error("BigInt literals cannot be represented in JSON Schema");
                } else {
                  vals.push(Number(val));
                }
              } else {
                vals.push(val);
              }
            }
            if (vals.length === 0) ;
            else if (vals.length === 1) {
              const val = vals[0];
              json.type = val === null ? "null" : typeof val;
              json.const = val;
            } else {
              if (vals.every((v) => typeof v === "number"))
                json.type = "number";
              if (vals.every((v) => typeof v === "string"))
                json.type = "string";
              if (vals.every((v) => typeof v === "boolean"))
                json.type = "string";
              if (vals.every((v) => v === null))
                json.type = "null";
              json.enum = vals;
            }
            break;
          }
          case "file": {
            const json = _json;
            const file = {
              type: "string",
              format: "binary",
              contentEncoding: "binary"
            };
            const { minimum, maximum, mime } = schema._zod.bag;
            if (minimum !== void 0)
              file.minLength = minimum;
            if (maximum !== void 0)
              file.maxLength = maximum;
            if (mime) {
              if (mime.length === 1) {
                file.contentMediaType = mime[0];
                Object.assign(json, file);
              } else {
                json.anyOf = mime.map((m) => {
                  const mFile = { ...file, contentMediaType: m };
                  return mFile;
                });
              }
            } else {
              Object.assign(json, file);
            }
            break;
          }
          case "transform": {
            if (this.unrepresentable === "throw") {
              throw new Error("Transforms cannot be represented in JSON Schema");
            }
            break;
          }
          case "nullable": {
            const inner = this.process(def.innerType, params);
            _json.anyOf = [inner, { type: "null" }];
            break;
          }
          case "nonoptional": {
            this.process(def.innerType, params);
            result.ref = def.innerType;
            break;
          }
          case "success": {
            const json = _json;
            json.type = "boolean";
            break;
          }
          case "default": {
            this.process(def.innerType, params);
            result.ref = def.innerType;
            _json.default = JSON.parse(JSON.stringify(def.defaultValue));
            break;
          }
          case "prefault": {
            this.process(def.innerType, params);
            result.ref = def.innerType;
            if (this.io === "input")
              _json._prefault = JSON.parse(JSON.stringify(def.defaultValue));
            break;
          }
          case "catch": {
            this.process(def.innerType, params);
            result.ref = def.innerType;
            let catchValue;
            try {
              catchValue = def.catchValue(void 0);
            } catch {
              throw new Error("Dynamic catch values are not supported in JSON Schema");
            }
            _json.default = catchValue;
            break;
          }
          case "nan": {
            if (this.unrepresentable === "throw") {
              throw new Error("NaN cannot be represented in JSON Schema");
            }
            break;
          }
          case "template_literal": {
            const json = _json;
            const pattern = schema._zod.pattern;
            if (!pattern)
              throw new Error("Pattern not found in template literal");
            json.type = "string";
            json.pattern = pattern.source;
            break;
          }
          case "pipe": {
            const innerType = this.io === "input" ? def.in._zod.def.type === "transform" ? def.out : def.in : def.out;
            this.process(innerType, params);
            result.ref = innerType;
            break;
          }
          case "readonly": {
            this.process(def.innerType, params);
            result.ref = def.innerType;
            _json.readOnly = true;
            break;
          }
          // passthrough types
          case "promise": {
            this.process(def.innerType, params);
            result.ref = def.innerType;
            break;
          }
          case "optional": {
            this.process(def.innerType, params);
            result.ref = def.innerType;
            break;
          }
          case "lazy": {
            const innerType = schema._zod.innerType;
            this.process(innerType, params);
            result.ref = innerType;
            break;
          }
          case "custom": {
            if (this.unrepresentable === "throw") {
              throw new Error("Custom types cannot be represented in JSON Schema");
            }
            break;
          }
        }
      }
    }
    const meta = this.metadataRegistry.get(schema);
    if (meta)
      Object.assign(result.schema, meta);
    if (this.io === "input" && isTransforming(schema)) {
      delete result.schema.examples;
      delete result.schema.default;
    }
    if (this.io === "input" && result.schema._prefault)
      (_a = result.schema).default ?? (_a.default = result.schema._prefault);
    delete result.schema._prefault;
    const _result = this.seen.get(schema);
    return _result.schema;
  }
  emit(schema, _params) {
    const params = {
      cycles: _params?.cycles ?? "ref",
      reused: _params?.reused ?? "inline",
      // unrepresentable: _params?.unrepresentable ?? "throw",
      // uri: _params?.uri ?? ((id) => `${id}`),
      external: _params?.external ?? void 0
    };
    const root = this.seen.get(schema);
    if (!root)
      throw new Error("Unprocessed schema. This is a bug in Zod.");
    const makeURI = (entry) => {
      const defsSegment = this.target === "draft-2020-12" ? "$defs" : "definitions";
      if (params.external) {
        const externalId = params.external.registry.get(entry[0])?.id;
        const uriGenerator = params.external.uri ?? ((id3) => id3);
        if (externalId) {
          return { ref: uriGenerator(externalId) };
        }
        const id2 = entry[1].defId ?? entry[1].schema.id ?? `schema${this.counter++}`;
        entry[1].defId = id2;
        return { defId: id2, ref: `${uriGenerator("__shared")}#/${defsSegment}/${id2}` };
      }
      if (entry[1] === root) {
        return { ref: "#" };
      }
      const uriPrefix = `#`;
      const defUriPrefix = `${uriPrefix}/${defsSegment}/`;
      const defId = entry[1].schema.id ?? `__schema${this.counter++}`;
      return { defId, ref: defUriPrefix + defId };
    };
    const extractToDef = (entry) => {
      if (entry[1].schema.$ref) {
        return;
      }
      const seen = entry[1];
      const { ref, defId } = makeURI(entry);
      seen.def = { ...seen.schema };
      if (defId)
        seen.defId = defId;
      const schema2 = seen.schema;
      for (const key in schema2) {
        delete schema2[key];
      }
      schema2.$ref = ref;
    };
    if (params.cycles === "throw") {
      for (const entry of this.seen.entries()) {
        const seen = entry[1];
        if (seen.cycle) {
          throw new Error(`Cycle detected: #/${seen.cycle?.join("/")}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`);
        }
      }
    }
    for (const entry of this.seen.entries()) {
      const seen = entry[1];
      if (schema === entry[0]) {
        extractToDef(entry);
        continue;
      }
      if (params.external) {
        const ext = params.external.registry.get(entry[0])?.id;
        if (schema !== entry[0] && ext) {
          extractToDef(entry);
          continue;
        }
      }
      const id2 = this.metadataRegistry.get(entry[0])?.id;
      if (id2) {
        extractToDef(entry);
        continue;
      }
      if (seen.cycle) {
        extractToDef(entry);
        continue;
      }
      if (seen.count > 1) {
        if (params.reused === "ref") {
          extractToDef(entry);
          continue;
        }
      }
    }
    const flattenRef = (zodSchema, params2) => {
      const seen = this.seen.get(zodSchema);
      const schema2 = seen.def ?? seen.schema;
      const _cached = { ...schema2 };
      if (seen.ref === null) {
        return;
      }
      const ref = seen.ref;
      seen.ref = null;
      if (ref) {
        flattenRef(ref, params2);
        const refSchema = this.seen.get(ref).schema;
        if (refSchema.$ref && params2.target === "draft-7") {
          schema2.allOf = schema2.allOf ?? [];
          schema2.allOf.push(refSchema);
        } else {
          Object.assign(schema2, refSchema);
          Object.assign(schema2, _cached);
        }
      }
      if (!seen.isParent)
        this.override({
          zodSchema,
          jsonSchema: schema2,
          path: seen.path ?? []
        });
    };
    for (const entry of [...this.seen.entries()].reverse()) {
      flattenRef(entry[0], { target: this.target });
    }
    const result = {};
    if (this.target === "draft-2020-12") {
      result.$schema = "https://json-schema.org/draft/2020-12/schema";
    } else if (this.target === "draft-7") {
      result.$schema = "http://json-schema.org/draft-07/schema#";
    } else {
      console.warn(`Invalid target: ${this.target}`);
    }
    if (params.external?.uri) {
      const id2 = params.external.registry.get(schema)?.id;
      if (!id2)
        throw new Error("Schema is missing an `id` property");
      result.$id = params.external.uri(id2);
    }
    Object.assign(result, root.def);
    const defs = params.external?.defs ?? {};
    for (const entry of this.seen.entries()) {
      const seen = entry[1];
      if (seen.def && seen.defId) {
        defs[seen.defId] = seen.def;
      }
    }
    if (params.external) ;
    else {
      if (Object.keys(defs).length > 0) {
        if (this.target === "draft-2020-12") {
          result.$defs = defs;
        } else {
          result.definitions = defs;
        }
      }
    }
    try {
      return JSON.parse(JSON.stringify(result));
    } catch (_err) {
      throw new Error("Error converting schema to JSON.");
    }
  }
}
function toJSONSchema(input, _params) {
  if (input instanceof $ZodRegistry) {
    const gen2 = new JSONSchemaGenerator(_params);
    const defs = {};
    for (const entry of input._idmap.entries()) {
      const [_, schema] = entry;
      gen2.process(schema);
    }
    const schemas = {};
    const external = {
      registry: input,
      uri: _params?.uri,
      defs
    };
    for (const entry of input._idmap.entries()) {
      const [key, schema] = entry;
      schemas[key] = gen2.emit(schema, {
        ..._params,
        external
      });
    }
    if (Object.keys(defs).length > 0) {
      const defsSegment = gen2.target === "draft-2020-12" ? "$defs" : "definitions";
      schemas.__shared = {
        [defsSegment]: defs
      };
    }
    return { schemas };
  }
  const gen = new JSONSchemaGenerator(_params);
  gen.process(input);
  return gen.emit(input, _params);
}
function isTransforming(_schema, _ctx) {
  const ctx = _ctx ?? { seen: /* @__PURE__ */ new Set() };
  if (ctx.seen.has(_schema))
    return false;
  ctx.seen.add(_schema);
  const schema = _schema;
  const def = schema._zod.def;
  switch (def.type) {
    case "string":
    case "number":
    case "bigint":
    case "boolean":
    case "date":
    case "symbol":
    case "undefined":
    case "null":
    case "any":
    case "unknown":
    case "never":
    case "void":
    case "literal":
    case "enum":
    case "nan":
    case "file":
    case "template_literal":
      return false;
    case "array": {
      return isTransforming(def.element, ctx);
    }
    case "object": {
      for (const key in def.shape) {
        if (isTransforming(def.shape[key], ctx))
          return true;
      }
      return false;
    }
    case "union": {
      for (const option of def.options) {
        if (isTransforming(option, ctx))
          return true;
      }
      return false;
    }
    case "intersection": {
      return isTransforming(def.left, ctx) || isTransforming(def.right, ctx);
    }
    case "tuple": {
      for (const item of def.items) {
        if (isTransforming(item, ctx))
          return true;
      }
      if (def.rest && isTransforming(def.rest, ctx))
        return true;
      return false;
    }
    case "record": {
      return isTransforming(def.keyType, ctx) || isTransforming(def.valueType, ctx);
    }
    case "map": {
      return isTransforming(def.keyType, ctx) || isTransforming(def.valueType, ctx);
    }
    case "set": {
      return isTransforming(def.valueType, ctx);
    }
    // inner types
    case "promise":
    case "optional":
    case "nonoptional":
    case "nullable":
    case "readonly":
      return isTransforming(def.innerType, ctx);
    case "lazy":
      return isTransforming(def.getter(), ctx);
    case "default": {
      return isTransforming(def.innerType, ctx);
    }
    case "prefault": {
      return isTransforming(def.innerType, ctx);
    }
    case "custom": {
      return false;
    }
    case "transform": {
      return true;
    }
    case "pipe": {
      return isTransforming(def.in, ctx) || isTransforming(def.out, ctx);
    }
    case "success": {
      return false;
    }
    case "catch": {
      return false;
    }
  }
  throw new Error(`Unknown schema type: ${def.type}`);
}
const ZodISODateTime = /* @__PURE__ */ $constructor("ZodISODateTime", (inst, def) => {
  $ZodISODateTime.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function datetime(params) {
  return _isoDateTime(ZodISODateTime, params);
}
const ZodISODate = /* @__PURE__ */ $constructor("ZodISODate", (inst, def) => {
  $ZodISODate.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function date(params) {
  return _isoDate(ZodISODate, params);
}
const ZodISOTime = /* @__PURE__ */ $constructor("ZodISOTime", (inst, def) => {
  $ZodISOTime.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function time(params) {
  return _isoTime(ZodISOTime, params);
}
const ZodISODuration = /* @__PURE__ */ $constructor("ZodISODuration", (inst, def) => {
  $ZodISODuration.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function duration(params) {
  return _isoDuration(ZodISODuration, params);
}
const initializer = (inst, issues) => {
  $ZodError.init(inst, issues);
  inst.name = "ZodError";
  Object.defineProperties(inst, {
    format: {
      value: (mapper) => formatError(inst, mapper)
      // enumerable: false,
    },
    flatten: {
      value: (mapper) => flattenError(inst, mapper)
      // enumerable: false,
    },
    addIssue: {
      value: (issue2) => inst.issues.push(issue2)
      // enumerable: false,
    },
    addIssues: {
      value: (issues2) => inst.issues.push(...issues2)
      // enumerable: false,
    },
    isEmpty: {
      get() {
        return inst.issues.length === 0;
      }
      // enumerable: false,
    }
  });
};
const ZodRealError = $constructor("ZodError", initializer, {
  Parent: Error
});
const parse = /* @__PURE__ */ _parse(ZodRealError);
const parseAsync = /* @__PURE__ */ _parseAsync(ZodRealError);
const safeParse = /* @__PURE__ */ _safeParse(ZodRealError);
const safeParseAsync = /* @__PURE__ */ _safeParseAsync(ZodRealError);
const ZodType = /* @__PURE__ */ $constructor("ZodType", (inst, def) => {
  $ZodType.init(inst, def);
  inst.def = def;
  Object.defineProperty(inst, "_def", { value: def });
  inst.check = (...checks) => {
    return inst.clone(
      {
        ...def,
        checks: [
          ...def.checks ?? [],
          ...checks.map((ch) => typeof ch === "function" ? { _zod: { check: ch, def: { check: "custom" }, onattach: [] } } : ch)
        ]
      }
      // { parent: true }
    );
  };
  inst.clone = (def2, params) => clone(inst, def2, params);
  inst.brand = () => inst;
  inst.register = ((reg, meta) => {
    reg.add(inst, meta);
    return inst;
  });
  inst.parse = (data, params) => parse(inst, data, params, { callee: inst.parse });
  inst.safeParse = (data, params) => safeParse(inst, data, params);
  inst.parseAsync = async (data, params) => parseAsync(inst, data, params, { callee: inst.parseAsync });
  inst.safeParseAsync = async (data, params) => safeParseAsync(inst, data, params);
  inst.spa = inst.safeParseAsync;
  inst.refine = (check2, params) => inst.check(refine(check2, params));
  inst.superRefine = (refinement) => inst.check(superRefine(refinement));
  inst.overwrite = (fn) => inst.check(_overwrite(fn));
  inst.optional = () => optional(inst);
  inst.nullable = () => nullable(inst);
  inst.nullish = () => optional(nullable(inst));
  inst.nonoptional = (params) => nonoptional(inst, params);
  inst.array = () => array(inst);
  inst.or = (arg) => union([inst, arg]);
  inst.and = (arg) => intersection(inst, arg);
  inst.transform = (tx) => pipe(inst, transform(tx));
  inst.default = (def2) => _default(inst, def2);
  inst.prefault = (def2) => prefault(inst, def2);
  inst.catch = (params) => _catch(inst, params);
  inst.pipe = (target) => pipe(inst, target);
  inst.readonly = () => readonly(inst);
  inst.describe = (description) => {
    const cl = inst.clone();
    globalRegistry.add(cl, { description });
    return cl;
  };
  Object.defineProperty(inst, "description", {
    get() {
      return globalRegistry.get(inst)?.description;
    },
    configurable: true
  });
  inst.meta = (...args) => {
    if (args.length === 0) {
      return globalRegistry.get(inst);
    }
    const cl = inst.clone();
    globalRegistry.add(cl, args[0]);
    return cl;
  };
  inst.isOptional = () => inst.safeParse(void 0).success;
  inst.isNullable = () => inst.safeParse(null).success;
  return inst;
});
const _ZodString = /* @__PURE__ */ $constructor("_ZodString", (inst, def) => {
  $ZodString.init(inst, def);
  ZodType.init(inst, def);
  const bag = inst._zod.bag;
  inst.format = bag.format ?? null;
  inst.minLength = bag.minimum ?? null;
  inst.maxLength = bag.maximum ?? null;
  inst.regex = (...args) => inst.check(_regex(...args));
  inst.includes = (...args) => inst.check(_includes(...args));
  inst.startsWith = (...args) => inst.check(_startsWith(...args));
  inst.endsWith = (...args) => inst.check(_endsWith(...args));
  inst.min = (...args) => inst.check(_minLength(...args));
  inst.max = (...args) => inst.check(_maxLength(...args));
  inst.length = (...args) => inst.check(_length(...args));
  inst.nonempty = (...args) => inst.check(_minLength(1, ...args));
  inst.lowercase = (params) => inst.check(_lowercase(params));
  inst.uppercase = (params) => inst.check(_uppercase(params));
  inst.trim = () => inst.check(_trim());
  inst.normalize = (...args) => inst.check(_normalize(...args));
  inst.toLowerCase = () => inst.check(_toLowerCase());
  inst.toUpperCase = () => inst.check(_toUpperCase());
});
const ZodString = /* @__PURE__ */ $constructor("ZodString", (inst, def) => {
  $ZodString.init(inst, def);
  _ZodString.init(inst, def);
  inst.email = (params) => inst.check(_email(ZodEmail, params));
  inst.url = (params) => inst.check(_url(ZodURL, params));
  inst.jwt = (params) => inst.check(_jwt(ZodJWT, params));
  inst.emoji = (params) => inst.check(_emoji(ZodEmoji, params));
  inst.guid = (params) => inst.check(_guid(ZodGUID, params));
  inst.uuid = (params) => inst.check(_uuid(ZodUUID, params));
  inst.uuidv4 = (params) => inst.check(_uuidv4(ZodUUID, params));
  inst.uuidv6 = (params) => inst.check(_uuidv6(ZodUUID, params));
  inst.uuidv7 = (params) => inst.check(_uuidv7(ZodUUID, params));
  inst.nanoid = (params) => inst.check(_nanoid(ZodNanoID, params));
  inst.guid = (params) => inst.check(_guid(ZodGUID, params));
  inst.cuid = (params) => inst.check(_cuid(ZodCUID, params));
  inst.cuid2 = (params) => inst.check(_cuid2(ZodCUID2, params));
  inst.ulid = (params) => inst.check(_ulid(ZodULID, params));
  inst.base64 = (params) => inst.check(_base64(ZodBase64, params));
  inst.base64url = (params) => inst.check(_base64url(ZodBase64URL, params));
  inst.xid = (params) => inst.check(_xid(ZodXID, params));
  inst.ksuid = (params) => inst.check(_ksuid(ZodKSUID, params));
  inst.ipv4 = (params) => inst.check(_ipv4(ZodIPv4, params));
  inst.ipv6 = (params) => inst.check(_ipv6(ZodIPv6, params));
  inst.cidrv4 = (params) => inst.check(_cidrv4(ZodCIDRv4, params));
  inst.cidrv6 = (params) => inst.check(_cidrv6(ZodCIDRv6, params));
  inst.e164 = (params) => inst.check(_e164(ZodE164, params));
  inst.datetime = (params) => inst.check(datetime(params));
  inst.date = (params) => inst.check(date(params));
  inst.time = (params) => inst.check(time(params));
  inst.duration = (params) => inst.check(duration(params));
});
function string(params) {
  return _string(ZodString, params);
}
const ZodStringFormat = /* @__PURE__ */ $constructor("ZodStringFormat", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  _ZodString.init(inst, def);
});
const ZodEmail = /* @__PURE__ */ $constructor("ZodEmail", (inst, def) => {
  $ZodEmail.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodGUID = /* @__PURE__ */ $constructor("ZodGUID", (inst, def) => {
  $ZodGUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodUUID = /* @__PURE__ */ $constructor("ZodUUID", (inst, def) => {
  $ZodUUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodURL = /* @__PURE__ */ $constructor("ZodURL", (inst, def) => {
  $ZodURL.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodEmoji = /* @__PURE__ */ $constructor("ZodEmoji", (inst, def) => {
  $ZodEmoji.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodNanoID = /* @__PURE__ */ $constructor("ZodNanoID", (inst, def) => {
  $ZodNanoID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodCUID = /* @__PURE__ */ $constructor("ZodCUID", (inst, def) => {
  $ZodCUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodCUID2 = /* @__PURE__ */ $constructor("ZodCUID2", (inst, def) => {
  $ZodCUID2.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodULID = /* @__PURE__ */ $constructor("ZodULID", (inst, def) => {
  $ZodULID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodXID = /* @__PURE__ */ $constructor("ZodXID", (inst, def) => {
  $ZodXID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodKSUID = /* @__PURE__ */ $constructor("ZodKSUID", (inst, def) => {
  $ZodKSUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodIPv4 = /* @__PURE__ */ $constructor("ZodIPv4", (inst, def) => {
  $ZodIPv4.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodIPv6 = /* @__PURE__ */ $constructor("ZodIPv6", (inst, def) => {
  $ZodIPv6.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodCIDRv4 = /* @__PURE__ */ $constructor("ZodCIDRv4", (inst, def) => {
  $ZodCIDRv4.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodCIDRv6 = /* @__PURE__ */ $constructor("ZodCIDRv6", (inst, def) => {
  $ZodCIDRv6.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodBase64 = /* @__PURE__ */ $constructor("ZodBase64", (inst, def) => {
  $ZodBase64.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodBase64URL = /* @__PURE__ */ $constructor("ZodBase64URL", (inst, def) => {
  $ZodBase64URL.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodE164 = /* @__PURE__ */ $constructor("ZodE164", (inst, def) => {
  $ZodE164.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodJWT = /* @__PURE__ */ $constructor("ZodJWT", (inst, def) => {
  $ZodJWT.init(inst, def);
  ZodStringFormat.init(inst, def);
});
const ZodNumber = /* @__PURE__ */ $constructor("ZodNumber", (inst, def) => {
  $ZodNumber.init(inst, def);
  ZodType.init(inst, def);
  inst.gt = (value, params) => inst.check(_gt(value, params));
  inst.gte = (value, params) => inst.check(_gte(value, params));
  inst.min = (value, params) => inst.check(_gte(value, params));
  inst.lt = (value, params) => inst.check(_lt(value, params));
  inst.lte = (value, params) => inst.check(_lte(value, params));
  inst.max = (value, params) => inst.check(_lte(value, params));
  inst.int = (params) => inst.check(int(params));
  inst.safe = (params) => inst.check(int(params));
  inst.positive = (params) => inst.check(_gt(0, params));
  inst.nonnegative = (params) => inst.check(_gte(0, params));
  inst.negative = (params) => inst.check(_lt(0, params));
  inst.nonpositive = (params) => inst.check(_lte(0, params));
  inst.multipleOf = (value, params) => inst.check(_multipleOf(value, params));
  inst.step = (value, params) => inst.check(_multipleOf(value, params));
  inst.finite = () => inst;
  const bag = inst._zod.bag;
  inst.minValue = Math.max(bag.minimum ?? Number.NEGATIVE_INFINITY, bag.exclusiveMinimum ?? Number.NEGATIVE_INFINITY) ?? null;
  inst.maxValue = Math.min(bag.maximum ?? Number.POSITIVE_INFINITY, bag.exclusiveMaximum ?? Number.POSITIVE_INFINITY) ?? null;
  inst.isInt = (bag.format ?? "").includes("int") || Number.isSafeInteger(bag.multipleOf ?? 0.5);
  inst.isFinite = true;
  inst.format = bag.format ?? null;
});
function number(params) {
  return _number(ZodNumber, params);
}
const ZodNumberFormat = /* @__PURE__ */ $constructor("ZodNumberFormat", (inst, def) => {
  $ZodNumberFormat.init(inst, def);
  ZodNumber.init(inst, def);
});
function int(params) {
  return _int(ZodNumberFormat, params);
}
const ZodBoolean = /* @__PURE__ */ $constructor("ZodBoolean", (inst, def) => {
  $ZodBoolean.init(inst, def);
  ZodType.init(inst, def);
});
function boolean(params) {
  return _boolean(ZodBoolean, params);
}
const ZodUnknown = /* @__PURE__ */ $constructor("ZodUnknown", (inst, def) => {
  $ZodUnknown.init(inst, def);
  ZodType.init(inst, def);
});
function unknown() {
  return _unknown(ZodUnknown);
}
const ZodNever = /* @__PURE__ */ $constructor("ZodNever", (inst, def) => {
  $ZodNever.init(inst, def);
  ZodType.init(inst, def);
});
function never(params) {
  return _never(ZodNever, params);
}
const ZodArray = /* @__PURE__ */ $constructor("ZodArray", (inst, def) => {
  $ZodArray.init(inst, def);
  ZodType.init(inst, def);
  inst.element = def.element;
  inst.min = (minLength, params) => inst.check(_minLength(minLength, params));
  inst.nonempty = (params) => inst.check(_minLength(1, params));
  inst.max = (maxLength, params) => inst.check(_maxLength(maxLength, params));
  inst.length = (len, params) => inst.check(_length(len, params));
  inst.unwrap = () => inst.element;
});
function array(element, params) {
  return _array(ZodArray, element, params);
}
const ZodObject = /* @__PURE__ */ $constructor("ZodObject", (inst, def) => {
  $ZodObject.init(inst, def);
  ZodType.init(inst, def);
  defineLazy(inst, "shape", () => def.shape);
  inst.keyof = () => _enum(Object.keys(inst._zod.def.shape));
  inst.catchall = (catchall) => inst.clone({ ...inst._zod.def, catchall });
  inst.passthrough = () => inst.clone({ ...inst._zod.def, catchall: unknown() });
  inst.loose = () => inst.clone({ ...inst._zod.def, catchall: unknown() });
  inst.strict = () => inst.clone({ ...inst._zod.def, catchall: never() });
  inst.strip = () => inst.clone({ ...inst._zod.def, catchall: void 0 });
  inst.extend = (incoming) => {
    return extend(inst, incoming);
  };
  inst.merge = (other) => merge(inst, other);
  inst.pick = (mask) => pick(inst, mask);
  inst.omit = (mask) => omit(inst, mask);
  inst.partial = (...args) => partial(ZodOptional, inst, args[0]);
  inst.required = (...args) => required(ZodNonOptional, inst, args[0]);
});
function object(shape, params) {
  const def = {
    type: "object",
    get shape() {
      assignProp(this, "shape", { ...shape });
      return this.shape;
    },
    ...normalizeParams(params)
  };
  return new ZodObject(def);
}
const ZodUnion = /* @__PURE__ */ $constructor("ZodUnion", (inst, def) => {
  $ZodUnion.init(inst, def);
  ZodType.init(inst, def);
  inst.options = def.options;
});
function union(options, params) {
  return new ZodUnion({
    type: "union",
    options,
    ...normalizeParams(params)
  });
}
const ZodIntersection = /* @__PURE__ */ $constructor("ZodIntersection", (inst, def) => {
  $ZodIntersection.init(inst, def);
  ZodType.init(inst, def);
});
function intersection(left, right) {
  return new ZodIntersection({
    type: "intersection",
    left,
    right
  });
}
const ZodTuple = /* @__PURE__ */ $constructor("ZodTuple", (inst, def) => {
  $ZodTuple.init(inst, def);
  ZodType.init(inst, def);
  inst.rest = (rest) => inst.clone({
    ...inst._zod.def,
    rest
  });
});
function tuple(items, _paramsOrRest, _params) {
  const hasRest = _paramsOrRest instanceof $ZodType;
  const params = hasRest ? _params : _paramsOrRest;
  const rest = hasRest ? _paramsOrRest : null;
  return new ZodTuple({
    type: "tuple",
    items,
    rest,
    ...normalizeParams(params)
  });
}
const ZodRecord = /* @__PURE__ */ $constructor("ZodRecord", (inst, def) => {
  $ZodRecord.init(inst, def);
  ZodType.init(inst, def);
  inst.keyType = def.keyType;
  inst.valueType = def.valueType;
});
function record(keyType, valueType, params) {
  return new ZodRecord({
    type: "record",
    keyType,
    valueType,
    ...normalizeParams(params)
  });
}
const ZodEnum = /* @__PURE__ */ $constructor("ZodEnum", (inst, def) => {
  $ZodEnum.init(inst, def);
  ZodType.init(inst, def);
  inst.enum = def.entries;
  inst.options = Object.values(def.entries);
  const keys = new Set(Object.keys(def.entries));
  inst.extract = (values, params) => {
    const newEntries = {};
    for (const value of values) {
      if (keys.has(value)) {
        newEntries[value] = def.entries[value];
      } else
        throw new Error(`Key ${value} not found in enum`);
    }
    return new ZodEnum({
      ...def,
      checks: [],
      ...normalizeParams(params),
      entries: newEntries
    });
  };
  inst.exclude = (values, params) => {
    const newEntries = { ...def.entries };
    for (const value of values) {
      if (keys.has(value)) {
        delete newEntries[value];
      } else
        throw new Error(`Key ${value} not found in enum`);
    }
    return new ZodEnum({
      ...def,
      checks: [],
      ...normalizeParams(params),
      entries: newEntries
    });
  };
});
function _enum(values, params) {
  const entries = Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values;
  return new ZodEnum({
    type: "enum",
    entries,
    ...normalizeParams(params)
  });
}
const ZodLiteral = /* @__PURE__ */ $constructor("ZodLiteral", (inst, def) => {
  $ZodLiteral.init(inst, def);
  ZodType.init(inst, def);
  inst.values = new Set(def.values);
  Object.defineProperty(inst, "value", {
    get() {
      if (def.values.length > 1) {
        throw new Error("This schema contains multiple valid literal values. Use `.values` instead.");
      }
      return def.values[0];
    }
  });
});
function literal(value, params) {
  return new ZodLiteral({
    type: "literal",
    values: Array.isArray(value) ? value : [value],
    ...normalizeParams(params)
  });
}
const ZodTransform = /* @__PURE__ */ $constructor("ZodTransform", (inst, def) => {
  $ZodTransform.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    payload.addIssue = (issue$1) => {
      if (typeof issue$1 === "string") {
        payload.issues.push(issue(issue$1, payload.value, def));
      } else {
        const _issue = issue$1;
        if (_issue.fatal)
          _issue.continue = false;
        _issue.code ?? (_issue.code = "custom");
        _issue.input ?? (_issue.input = payload.value);
        _issue.inst ?? (_issue.inst = inst);
        _issue.continue ?? (_issue.continue = true);
        payload.issues.push(issue(_issue));
      }
    };
    const output = def.transform(payload.value, payload);
    if (output instanceof Promise) {
      return output.then((output2) => {
        payload.value = output2;
        return payload;
      });
    }
    payload.value = output;
    return payload;
  };
});
function transform(fn) {
  return new ZodTransform({
    type: "transform",
    transform: fn
  });
}
const ZodOptional = /* @__PURE__ */ $constructor("ZodOptional", (inst, def) => {
  $ZodOptional.init(inst, def);
  ZodType.init(inst, def);
  inst.unwrap = () => inst._zod.def.innerType;
});
function optional(innerType) {
  return new ZodOptional({
    type: "optional",
    innerType
  });
}
const ZodNullable = /* @__PURE__ */ $constructor("ZodNullable", (inst, def) => {
  $ZodNullable.init(inst, def);
  ZodType.init(inst, def);
  inst.unwrap = () => inst._zod.def.innerType;
});
function nullable(innerType) {
  return new ZodNullable({
    type: "nullable",
    innerType
  });
}
const ZodDefault = /* @__PURE__ */ $constructor("ZodDefault", (inst, def) => {
  $ZodDefault.init(inst, def);
  ZodType.init(inst, def);
  inst.unwrap = () => inst._zod.def.innerType;
  inst.removeDefault = inst.unwrap;
});
function _default(innerType, defaultValue) {
  return new ZodDefault({
    type: "default",
    innerType,
    get defaultValue() {
      return typeof defaultValue === "function" ? defaultValue() : defaultValue;
    }
  });
}
const ZodPrefault = /* @__PURE__ */ $constructor("ZodPrefault", (inst, def) => {
  $ZodPrefault.init(inst, def);
  ZodType.init(inst, def);
  inst.unwrap = () => inst._zod.def.innerType;
});
function prefault(innerType, defaultValue) {
  return new ZodPrefault({
    type: "prefault",
    innerType,
    get defaultValue() {
      return typeof defaultValue === "function" ? defaultValue() : defaultValue;
    }
  });
}
const ZodNonOptional = /* @__PURE__ */ $constructor("ZodNonOptional", (inst, def) => {
  $ZodNonOptional.init(inst, def);
  ZodType.init(inst, def);
  inst.unwrap = () => inst._zod.def.innerType;
});
function nonoptional(innerType, params) {
  return new ZodNonOptional({
    type: "nonoptional",
    innerType,
    ...normalizeParams(params)
  });
}
const ZodCatch = /* @__PURE__ */ $constructor("ZodCatch", (inst, def) => {
  $ZodCatch.init(inst, def);
  ZodType.init(inst, def);
  inst.unwrap = () => inst._zod.def.innerType;
  inst.removeCatch = inst.unwrap;
});
function _catch(innerType, catchValue) {
  return new ZodCatch({
    type: "catch",
    innerType,
    catchValue: typeof catchValue === "function" ? catchValue : () => catchValue
  });
}
const ZodPipe = /* @__PURE__ */ $constructor("ZodPipe", (inst, def) => {
  $ZodPipe.init(inst, def);
  ZodType.init(inst, def);
  inst.in = def.in;
  inst.out = def.out;
});
function pipe(in_, out) {
  return new ZodPipe({
    type: "pipe",
    in: in_,
    out
    // ...util.normalizeParams(params),
  });
}
const ZodReadonly = /* @__PURE__ */ $constructor("ZodReadonly", (inst, def) => {
  $ZodReadonly.init(inst, def);
  ZodType.init(inst, def);
});
function readonly(innerType) {
  return new ZodReadonly({
    type: "readonly",
    innerType
  });
}
const ZodCustom = /* @__PURE__ */ $constructor("ZodCustom", (inst, def) => {
  $ZodCustom.init(inst, def);
  ZodType.init(inst, def);
});
function check(fn) {
  const ch = new $ZodCheck({
    check: "custom"
    // ...util.normalizeParams(params),
  });
  ch._zod.check = fn;
  return ch;
}
function refine(fn, _params = {}) {
  return _refine(ZodCustom, fn, _params);
}
function superRefine(fn) {
  const ch = check((payload) => {
    payload.addIssue = (issue$1) => {
      if (typeof issue$1 === "string") {
        payload.issues.push(issue(issue$1, payload.value, ch._zod.def));
      } else {
        const _issue = issue$1;
        if (_issue.fatal)
          _issue.continue = false;
        _issue.code ?? (_issue.code = "custom");
        _issue.input ?? (_issue.input = payload.value);
        _issue.inst ?? (_issue.inst = ch);
        _issue.continue ?? (_issue.continue = !ch._zod.def.abort);
        payload.issues.push(issue(_issue));
      }
    };
    return fn(payload.value, payload);
  });
  return ch;
}
const TIMING_PRESETS = ["short", "medium", "long"];
const TIMING_SECONDS = { short: 1, medium: 3, long: 5 };
const TRANSITION_NAMES = [
  "none",
  "fade",
  "rise",
  "fall",
  "scale",
  "pop",
  "slide-left",
  "slide-right",
  "slide-up",
  "slide-down",
  "wipe"
];
const nameSchema = _enum(TRANSITION_NAMES);
const timeSchema = _enum(TIMING_PRESETS);
const TransitionSpecSchema = object({
  animIn: nameSchema.optional().describe("Effect the scene page enters with (default a soft fade)"),
  animOut: nameSchema.optional().describe("Effect the scene page exits with (default none / hard cut)"),
  timeIn: timeSchema.optional().describe("IN duration: short=1s, medium=3s, long=5s"),
  timeOut: timeSchema.optional().describe("OUT duration: short=1s, medium=3s, long=5s")
});
object({
  animIn: nameSchema.optional().describe("Effect the element enters with"),
  timeIn: timeSchema.optional().describe("IN duration: short=1s, medium=3s, long=5s")
});
const AnimTimeSchema = union([
  object({
    at: literal("line"),
    n: number().int().min(0).describe("VO line index this reveal keys to (0 = first line)"),
    plus: number().optional().describe("Seconds added to the fallback stagger")
  }).describe("Fire at the Nth VO line's start (fallback: a small staggered offset)"),
  object({
    at: literal("index"),
    n: number().int().min(0),
    plus: number().optional()
  }).describe("Fire at the Nth narration offset (atIndex)"),
  object({ at: literal("leadIn"), plus: number().optional() }).describe("Fire at the scene lead-in"),
  object({ at: literal("seconds"), t: number() }).describe("Fire at a fixed second (entrance only)")
]).describe("When an animation fires — keyed to narration, not wall-clock");
const ANIM_KINDS = [
  "riseIn",
  "fadeIn",
  "staggerIn",
  "rule",
  "float",
  "countUp",
  "growBar",
  "scaleIn",
  "from"
];
const AnimDescriptorSchema = object({
  kind: _enum(ANIM_KINDS).describe("Which MC.* motion to apply"),
  target: string().min(1).describe("The element's data-anim id (before scoping)"),
  time: AnimTimeSchema,
  opts: record(string(), union([number(), string(), boolean()])).optional().describe("Tween options: dist, dur, ease, each (stagger), to/decimals/prefix/suffix (countUp), prop/from")
});
const offsetAnim = (a, addN, addPlus) => {
  const t = a.time;
  if (t.at === "line" || t.at === "index") {
    return { ...a, time: { ...t, n: t.n + addN, plus: (t.plus ?? 0) + addPlus } };
  }
  return a;
};
const qualifyAnim = (a, prefix) => ({
  ...a,
  target: `${prefix}-${a.target}`
});
const CLOSE_SCRIPT = /<\//g;
const serializeAnims = (anims) => {
  if (anims.length === 0) return "";
  const json = JSON.stringify(anims).replace(CLOSE_SCRIPT, "<\\/");
  return `          MC.applyAnims(tl, ${json}, { q: q, qa: qa, at: at, atIndex: atIndex, lineId: lineId, leadIn: leadIn, page: page });`;
};
const DEFAULT_ENTRANCE = 'tl.from(page, { opacity: 0, duration: 0.3, ease: "power2.out" }, 0);';
const ELEM_DIST = 120;
const ELEM_DUR = 0.6;
const PAGE_SLIDE = 140;
const elementIn = (name, target, timeSec, extraOpts) => {
  const time2 = { at: "line", n: 0 };
  const mk = (kind, opts) => {
    const o = Object.keys(opts).length ? opts : void 0;
    return o ? { kind, target, time: time2, opts: o } : { kind, target, time: time2 };
  };
  const dur = timeSec != null ? { dur: timeSec } : {};
  const gsapDur = timeSec ?? ELEM_DUR;
  switch (name) {
    case "none":
      return null;
    case "fade":
      return mk("fadeIn", { ...extraOpts ?? {}, ...dur });
    case "rise":
      return mk("riseIn", { ...extraOpts ?? {}, ...dur });
    case "scale":
      return mk("scaleIn", { ...extraOpts ?? {}, ...dur });
    case "pop":
      return mk("scaleIn", { from: 0.8, ease: "back.out(2)", ...extraOpts ?? {}, ...dur });
    case "fall":
      return mk("from", { y: -ELEM_DIST, opacity: 0, duration: gsapDur, ease: "power3.out" });
    case "slide-left":
      return mk("from", { x: -ELEM_DIST, opacity: 0, duration: gsapDur, ease: "power3.out" });
    case "slide-right":
      return mk("from", { x: ELEM_DIST, opacity: 0, duration: gsapDur, ease: "power3.out" });
    case "slide-up":
      return mk("from", { y: ELEM_DIST, opacity: 0, duration: gsapDur, ease: "power3.out" });
    case "slide-down":
      return mk("from", { y: -ELEM_DIST, opacity: 0, duration: gsapDur, ease: "power3.out" });
    case "wipe":
      return mk("from", { clipPath: "inset(0 100% 0 0)", duration: gsapDur, ease: "power2.inOut" });
  }
};
const PAGE_IN = {
  fade: { fn: "fadeIn", opts: {} },
  rise: { fn: "riseIn", opts: { dist: 40 } },
  fall: { fn: "fallIn", opts: { dist: 40 } },
  scale: { fn: "scaleIn", opts: {} },
  pop: { fn: "scaleIn", opts: { from: 0.8, ease: "back.out(2)" } },
  "slide-left": { fn: "slideIn", opts: { x: -PAGE_SLIDE } },
  "slide-right": { fn: "slideIn", opts: { x: PAGE_SLIDE } },
  "slide-up": { fn: "slideIn", opts: { y: PAGE_SLIDE } },
  "slide-down": { fn: "slideIn", opts: { y: -PAGE_SLIDE } },
  wipe: { fn: "wipeIn", opts: {} }
};
const PAGE_OUT = {
  fade: { fn: "fadeOut", opts: {} },
  rise: { fn: "riseOut", opts: { dist: 40 } },
  fall: { fn: "fallOut", opts: { dist: 40 } },
  scale: { fn: "scaleOut", opts: {} },
  pop: { fn: "scaleOut", opts: {} },
  "slide-left": { fn: "slideOut", opts: { x: -PAGE_SLIDE } },
  "slide-right": { fn: "slideOut", opts: { x: PAGE_SLIDE } },
  "slide-up": { fn: "slideOut", opts: { y: -PAGE_SLIDE } },
  "slide-down": { fn: "slideOut", opts: { y: PAGE_SLIDE } },
  wipe: { fn: "wipeOut", opts: {} }
};
const pageInFor = (name) => PAGE_IN[name] ?? null;
const pageOutFor = (name) => PAGE_OUT[name] ?? null;
const optStr = (o) => Object.entries(o).map(([k, v]) => `, ${k}: ${typeof v === "string" ? JSON.stringify(v) : v}`).join("");
const sceneEntranceJs = (animIn, timeIn = "short") => {
  const p = pageInFor(animIn);
  if (!p) return DEFAULT_ENTRANCE;
  const tIn = TIMING_SECONDS[timeIn];
  return `var _din = Math.min(${tIn}, dur);
          MC.${p.fn}(tl, page, 0, { dur: _din${optStr(p.opts)} });`;
};
const sceneExitJs = (animOut, timeIn = "short", timeOut = "short") => {
  const p = pageOutFor(animOut);
  if (!p) return "";
  const tIn = TIMING_SECONDS[timeIn];
  const tOut = TIMING_SECONDS[timeOut];
  return `var _dout = Math.min(${tOut}, Math.max(0, dur - Math.min(${tIn}, dur)));
          MC.${p.fn}(tl, page, dur - _dout, { dur: _dout${optStr(p.opts)} });`;
};
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const rootElement = (html) => {
  const root = parseFragment(html).find(isElement);
  if (!root || !isElement(root)) throw new Error("template has no root element");
  return root;
};
const addClass = (el, cls) => {
  const cur = el.attrs.class ?? "";
  el.attrs.class = cur ? `${cur} ${cls}` : cls;
};
const mergeStyle = (el, style) => {
  if (!style) return;
  const cur = (el.attrs.style ?? "").trim().replace(/;\s*$/, "");
  el.attrs.style = cur ? `${cur}; ${style}` : style;
};
const styleProps = (props) => Object.entries(props).map(([k, v]) => `${k}: ${v}`).join("; ");
const fillSlots = (root, fills) => {
  for (const [slot, value] of Object.entries(fills)) {
    const el = find(root, attrEq("data-slot", slot));
    if (!el) continue;
    if (value == null || value === "") {
      el.attrs["data-remove"] = "";
      continue;
    }
    setText(el, esc(String(value)));
    delete el.attrs["data-slot"];
  }
};
const fillRaw = (root, fills) => {
  for (const [slot, value] of Object.entries(fills)) {
    const el = find(root, attrEq("data-html", slot));
    if (!el) continue;
    if (value == null || value === "") {
      el.attrs["data-remove"] = "";
      continue;
    }
    el.children = [{ type: "text", text: value }];
    delete el.attrs["data-html"];
  }
};
const stampAnims = (root, prefix) => {
  const ids = /* @__PURE__ */ new Set();
  for (const el of findAll(root, hasAttr("data-anim"))) {
    const id2 = el.attrs["data-anim"];
    ids.add(id2);
    addClass(el, `${prefix}-${id2}`);
    delete el.attrs["data-anim"];
  }
  return ids;
};
const pruneRemoved = (root) => {
  removeWhere(root.children, hasAttr("data-remove"));
};
const ANNOTATION_ATTRS = ["data-slot", "data-html", "data-anim", "data-children", "data-remove", "data-deco", "data-deco-dot"];
const stripAnnotations = (root) => {
  for (const el of findAll(root, () => true)) {
    for (const a of ANNOTATION_ATTRS) delete el.attrs[a];
  }
};
const childrenContainer = (root) => find(root, hasAttr("data-children"));
function component(def) {
  let cachedJson = null;
  const jsonSchema = () => cachedJson ??= toJSONSchema(def.schema, { io: "input" });
  const parse2 = (raw) => def.schema.parse(raw === void 0 ? def.example : raw);
  const factory = ((raw) => {
    let animOverride = null;
    let transitionOverride = null;
    const instance = {
      name: def.name,
      kind: "component",
      jsonSchema,
      defaults: () => def.schema.parse(def.example),
      withAnim(anims) {
        animOverride = anims;
        return this;
      },
      withTransition(t) {
        transitionOverride = t;
        return this;
      },
      buildNode(ctx) {
        const p = parse2(raw);
        const root = rootElement(def.template);
        if (def.fill) fillSlots(root, def.fill(p));
        if (def.rawFill) fillRaw(root, def.rawFill(p));
        pruneRemoved(root);
        stampAnims(root, ctx.idPrefix);
        if (def.layout) mergeStyle(root, styleProps(def.layout(p)));
        stripAnnotations(root);
        const internals = animOverride ?? (def.anim ? def.anim(p) : []);
        const useDefault = !transitionOverride?.animIn;
        const inName = transitionOverride?.animIn ?? def.animIn;
        const inTime = transitionOverride?.timeIn ?? def.timeIn;
        const entrance = inName && inName !== "none" ? elementIn(
          inName,
          def.animTarget ?? "item",
          inTime ? TIMING_SECONDS[inTime] : void 0,
          useDefault ? def.animInOpts : void 0
        ) : null;
        const local = entrance ? [entrance, ...internals] : internals;
        const anims = local.map((a) => qualifyAnim(a, ctx.idPrefix));
        return { node: root, css: def.css, anims };
      },
      build(ctx) {
        const bn = this.buildNode(ctx);
        return { html: serialize(bn.node), css: bn.css, anims: bn.anims };
      }
    };
    return instance;
  });
  return Object.assign(factory, {
    componentName: def.name,
    kind: "component",
    schema: def.schema,
    frame: def.frame,
    jsonSchema,
    defaults: () => def.schema.parse(def.example)
  });
}
const components = /* @__PURE__ */ new Map();
const treatments = /* @__PURE__ */ new Map();
const registerComponent = (factory) => {
  if (components.has(factory.componentName)) {
    throw new Error(`duplicate component '${factory.componentName}'`);
  }
  components.set(factory.componentName, factory);
  return factory;
};
const registerTreatment = (factory) => {
  if (treatments.has(factory.treatmentName)) {
    throw new Error(`duplicate treatment '${factory.treatmentName}'`);
  }
  treatments.set(factory.treatmentName, factory);
  return factory;
};
const getComponent = (name) => {
  const f = components.get(name);
  if (!f) throw new Error(`unknown component '${name}' (registered: ${[...components.keys()].join(", ")})`);
  return f;
};
const getTreatment = (name) => {
  const f = treatments.get(name);
  if (!f) throw new Error(`unknown treatment '${name}' (registered: ${[...treatments.keys()].join(", ")})`);
  return f;
};
const hasComponent = (name) => components.has(name);
const hasTreatment = (name) => treatments.has(name);
const componentNames = () => [...components.keys()].sort();
const treatmentNames = () => [...treatments.keys()].sort();
const allComponents = () => [...components.values()];
const allTreatments = () => [...treatments.values()];
const rootContext = (compId, theme, opts) => ({
  compId,
  idPrefix: compId,
  theme,
  mode: opts?.mode ?? "render",
  voIds: opts?.voIds
});
const gsapSrc = `/*!\r
 * GSAP 3.14.2\r
 * https://gsap.com\r
 * \r
 * @license Copyright 2025, GreenSock. All rights reserved.\r
 * Subject to the terms at https://gsap.com/standard-license.\r
 * @author: Jack Doyle, jack@greensock.com\r
 */\r
\r
!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?e(exports):"function"==typeof define&&define.amd?define(["exports"],e):e((t=t||self).window=t.window||{})}(this,function(e){"use strict";function _inheritsLoose(t,e){t.prototype=Object.create(e.prototype),(t.prototype.constructor=t).__proto__=e}function _assertThisInitialized(t){if(void 0===t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return t}function r(t){return"string"==typeof t}function s(t){return"function"==typeof t}function t(t){return"number"==typeof t}function u(t){return void 0===t}function v(t){return"object"==typeof t}function w(t){return!1!==t}function x(){return"undefined"!=typeof window}function y(t){return s(t)||r(t)}function R(t){return(i=bt(t,ht))&&Fe}function S(t,e){return console.warn("Invalid property",t,"set to",e,"Missing plugin? gsap.registerPlugin()")}function T(t,e){return!e&&console.warn(t)}function U(t,e){return t&&(ht[t]=e)&&i&&(i[t]=e)||ht}function V(){return 0}function ga(t){var e,r,i=t[0];if(v(i)||s(i)||(t=[t]),!(e=(i._gsap||{}).harness)){for(r=yt.length;r--&&!yt[r].targetTest(i););e=yt[r]}for(r=t.length;r--;)t[r]&&(t[r]._gsap||(t[r]._gsap=new Xt(t[r],e)))||t.splice(r,1);return t}function ha(t){return t._gsap||ga(Pt(t))[0]._gsap}function ia(t,e,r){return(r=t[e])&&s(r)?t[e]():u(r)&&t.getAttribute&&t.getAttribute(e)||r}function ja(t,e){return(t=t.split(",")).forEach(e)||t}function ka(t){return Math.round(1e5*t)/1e5||0}function la(t){return Math.round(1e7*t)/1e7||0}function ma(t,e){var r=e.charAt(0),i=parseFloat(e.substr(2));return t=parseFloat(t),"+"===r?t+i:"-"===r?t-i:"*"===r?t*i:t/i}function na(t,e){for(var r=e.length,i=0;t.indexOf(e[i])<0&&++i<r;);return i<r}function oa(){var t,e,r=pt.length,i=pt.slice(0);for(_t={},t=pt.length=0;t<r;t++)(e=i[t])&&e._lazy&&(e.render(e._lazy[0],e._lazy[1],!0)._lazy=0)}function pa(t){return!!(t._initted||t._startAt||t.add)}function qa(t,e,r,i){pt.length&&!I&&oa(),t.render(e,r,i||!!(I&&e<0&&pa(t))),pt.length&&!I&&oa()}function ra(t){var e=parseFloat(t);return(e||0===e)&&(t+"").match(ot).length<2?e:r(t)?t.trim():t}function sa(t){return t}function ta(t,e){for(var r in e)r in t||(t[r]=e[r]);return t}function wa(t,e){for(var r in e)"__proto__"!==r&&"constructor"!==r&&"prototype"!==r&&(t[r]=v(e[r])?wa(t[r]||(t[r]={}),e[r]):e[r]);return t}function xa(t,e){var r,i={};for(r in t)r in e||(i[r]=t[r]);return i}function ya(t){var e=t.parent||L,r=t.keyframes?function _setKeyframeDefaults(i){return function(t,e){for(var r in e)r in t||"duration"===r&&i||"ease"===r||(t[r]=e[r])}}($(t.keyframes)):ta;if(w(t.inherit))for(;e;)r(t,e.vars.defaults),e=e.parent||e._dp;return t}function Aa(t,e,r,i,n){void 0===r&&(r="_first"),void 0===i&&(i="_last");var a,s=t[i];if(n)for(a=e[n];s&&s[n]>a;)s=s._prev;return s?(e._next=s._next,s._next=e):(e._next=t[r],t[r]=e),e._next?e._next._prev=e:t[i]=e,e._prev=s,e.parent=e._dp=t,e}function Ba(t,e,r,i){void 0===r&&(r="_first"),void 0===i&&(i="_last");var n=e._prev,a=e._next;n?n._next=a:t[r]===e&&(t[r]=a),a?a._prev=n:t[i]===e&&(t[i]=n),e._next=e._prev=e.parent=null}function Ca(t,e){t.parent&&(!e||t.parent.autoRemoveChildren)&&t.parent.remove&&t.parent.remove(t),t._act=0}function Da(t,e){if(t&&(!e||e._end>t._dur||e._start<0))for(var r=t;r;)r._dirty=1,r=r.parent;return t}function Fa(t,e,r,i){return t._startAt&&(I?t._startAt.revert(ft):t.vars.immediateRender&&!t.vars.autoRevert||t._startAt.render(e,!0,i))}function Ha(t){return t._repeat?wt(t._tTime,t=t.duration()+t._rDelay)*t:0}function Ja(t,e){return(t-e._start)*e._ts+(0<=e._ts?0:e._dirty?e.totalDuration():e._tDur)}function Ka(t){return t._end=la(t._start+(t._tDur/Math.abs(t._ts||t._rts||q)||0))}function La(t,e){var r=t._dp;return r&&r.smoothChildTiming&&t._ts&&(t._start=la(r._time-(0<t._ts?e/t._ts:((t._dirty?t.totalDuration():t._tDur)-e)/-t._ts)),Ka(t),r._dirty||Da(r,t)),t}function Ma(t,e){var r;if((e._time||!e._dur&&e._initted||e._start<t._time&&(e._dur||!e.add))&&(r=Ja(t.rawTime(),e),(!e._dur||Mt(0,e.totalDuration(),r)-e._tTime>q)&&e.render(r,!0)),Da(t,e)._dp&&t._initted&&t._time>=t._dur&&t._ts){if(t._dur<t.duration())for(r=t;r._dp;)0<=r.rawTime()&&r.totalTime(r._tTime),r=r._dp;t._zTime=-q}}function Na(e,r,i,n){return r.parent&&Ca(r),r._start=la((t(i)?i:i||e!==L?Ot(e,i,r):e._time)+r._delay),r._end=la(r._start+(r.totalDuration()/Math.abs(r.timeScale())||0)),Aa(e,r,"_first","_last",e._sort?"_start":0),xt(r)||(e._recent=r),n||Ma(e,r),e._ts<0&&La(e,e._tTime),e}function Oa(t,e){return(ht.ScrollTrigger||S("scrollTrigger",e))&&ht.ScrollTrigger.create(e,t)}function Pa(t,e,r,i,n){return Qt(t,e,n),t._initted?!r&&t._pt&&!I&&(t._dur&&!1!==t.vars.lazy||!t._dur&&t.vars.lazy)&&f!==It.frame?(pt.push(t),t._lazy=[n,i],1):void 0:1}function Ua(t,e,r,i){var n=t._repeat,a=la(e)||0,s=t._tTime/t._tDur;return s&&!i&&(t._time*=a/t._dur),t._dur=a,t._tDur=n?n<0?1e10:la(a*(n+1)+t._rDelay*n):a,0<s&&!i&&La(t,t._tTime=t._tDur*s),t.parent&&Ka(t),r||Da(t.parent,t),t}function Va(t){return t instanceof Zt?Da(t):Ua(t,t._dur)}function Ya(e,r,i){var n,a,s=t(r[1]),o=(s?2:1)+(e<2?0:1),u=r[o];if(s&&(u.duration=r[1]),u.parent=i,e){for(n=u,a=i;a&&!("immediateRender"in n);)n=a.vars.defaults||{},a=w(a.vars.inherit)&&a.parent;u.immediateRender=w(n.immediateRender),e<2?u.runBackwards=1:u.startAt=r[o-1]}return new te(r[0],u,r[1+o])}function Za(t,e){return t||0===t?e(t):e}function _a(t,e){return r(t)&&(e=ut.exec(t))?e[1]:""}function cb(t,e){return t&&v(t)&&"length"in t&&(!e&&!t.length||t.length-1 in t&&v(t[0]))&&!t.nodeType&&t!==h}function fb(r){return r=Pt(r)[0]||T("Invalid scope")||{},function(t){var e=r.current||r.nativeElement||r;return Pt(t,e.querySelectorAll?e:e===r?T("Invalid scope")||a.createElement("div"):r)}}function gb(t){return t.sort(function(){return.5-Math.random()})}function hb(t){if(s(t))return t;var p=v(t)?t:{each:t},_=Vt(p.ease),m=p.from||0,g=parseFloat(p.base)||0,y={},e=0<m&&m<1,T=isNaN(m)||e,b=p.axis,w=m,x=m;return r(m)?w=x={center:.5,edges:.5,end:1}[m]||0:!e&&T&&(w=m[0],x=m[1]),function(t,e,r){var i,n,a,s,o,u,h,l,f,d=(r||p).length,c=y[d];if(!c){if(!(f="auto"===p.grid?0:(p.grid||[1,X])[1])){for(h=-X;h<(h=r[f++].getBoundingClientRect().left)&&f<d;);f<d&&f--}for(c=y[d]=[],i=T?Math.min(f,d)*w-.5:m%f,n=f===X?0:T?d*x/f-.5:m/f|0,l=X,u=h=0;u<d;u++)a=u%f-i,s=n-(u/f|0),c[u]=o=b?Math.abs("y"===b?s:a):J(a*a+s*s),h<o&&(h=o),o<l&&(l=o);"random"===m&&gb(c),c.max=h-l,c.min=l,c.v=d=(parseFloat(p.amount)||parseFloat(p.each)*(d<f?d-1:b?"y"===b?d/f:f:Math.max(f,d/f))||0)*("edges"===m?-1:1),c.b=d<0?g-d:g,c.u=_a(p.amount||p.each)||0,_=_&&d<0?jt(_):_}return d=(c[t]-c.min)/c.max||0,la(c.b+(_?_(d):d)*c.v)+c.u}}function ib(i){var n=Math.pow(10,((i+"").split(".")[1]||"").length);return function(e){var r=la(Math.round(parseFloat(e)/i)*i*n);return(r-r%1)/n+(t(e)?0:_a(e))}}function jb(h,e){var l,f,r=$(h);return!r&&v(h)&&(l=r=h.radius||X,h.values?(h=Pt(h.values),(f=!t(h[0]))&&(l*=l)):h=ib(h.increment)),Za(e,r?s(h)?function(t){return f=h(t),Math.abs(f-t)<=l?f:t}:function(e){for(var r,i,n=parseFloat(f?e.x:e),a=parseFloat(f?e.y:0),s=X,o=0,u=h.length;u--;)(r=f?(r=h[u].x-n)*r+(i=h[u].y-a)*i:Math.abs(h[u]-n))<s&&(s=r,o=u);return o=!l||s<=l?h[o]:e,f||o===e||t(e)?o:o+_a(e)}:ib(h))}function kb(t,e,r,i){return Za($(t)?!e:!0===r?!!(r=0):!i,function(){return $(t)?t[~~(Math.random()*t.length)]:(r=r||1e-5)&&(i=r<1?Math.pow(10,(r+"").length-2):1)&&Math.floor(Math.round((t-r/2+Math.random()*(e-t+.99*r))/r)*r*i)/i})}function ob(e,r,t){return Za(t,function(t){return e[~~r(t)]})}function rb(t){return t.replace(tt,function(t){var e=t.indexOf("[")+1,r=t.substring(e||7,e?t.indexOf("]"):t.length-1).split(et);return kb(e?r:+r[0],e?0:+r[1],+r[2]||1e-5)})}function ub(t,e,r){var i,n,a,s=t.labels,o=X;for(i in s)(n=s[i]-e)<0==!!r&&n&&o>(n=Math.abs(n))&&(a=i,o=n);return a}function wb(t){return Ca(t),t.scrollTrigger&&t.scrollTrigger.kill(!!I),t.progress()<1&&Dt(t,"onInterrupt"),t}function zb(t){if(t)if(t=!t.name&&t.default||t,x()||t.headless){var e=t.name,r=s(t),i=e&&!r&&t.init?function(){this._props=[]}:t,n={init:V,render:ve,add:Jt,kill:Te,modifier:ye,rawVars:0},a={targetTest:0,get:0,getSetter:le,aliases:{},register:0};if(Lt(),t!==i){if(mt[e])return;ta(i,ta(xa(t,n),a)),bt(i.prototype,bt(n,xa(t,a))),mt[i.prop=e]=i,t.targetTest&&(yt.push(i),ct[e]=1),e=("css"===e?"CSS":e.charAt(0).toUpperCase()+e.substr(1))+"Plugin"}U(e,i),t.register&&t.register(Fe,i,we)}else St.push(t)}function Cb(t,e,r){return(6*(t+=t<0?1:1<t?-1:0)<1?e+(r-e)*t*6:t<.5?r:3*t<2?e+(r-e)*(2/3-t)*6:e)*zt+.5|0}function Db(e,r,i){var n,a,s,o,u,h,l,f,d,c,p=e?t(e)?[e>>16,e>>8&zt,e&zt]:0:Et.black;if(!p){if(","===e.substr(-1)&&(e=e.substr(0,e.length-1)),Et[e])p=Et[e];else if("#"===e.charAt(0)){if(e.length<6&&(e="#"+(n=e.charAt(1))+n+(a=e.charAt(2))+a+(s=e.charAt(3))+s+(5===e.length?e.charAt(4)+e.charAt(4):"")),9===e.length)return[(p=parseInt(e.substr(1,6),16))>>16,p>>8&zt,p&zt,parseInt(e.substr(7),16)/255];p=[(e=parseInt(e.substr(1),16))>>16,e>>8&zt,e&zt]}else if("hsl"===e.substr(0,3))if(p=c=e.match(rt),r){if(~e.indexOf("="))return p=e.match(it),i&&p.length<4&&(p[3]=1),p}else o=+p[0]%360/360,u=p[1]/100,n=2*(h=p[2]/100)-(a=h<=.5?h*(u+1):h+u-h*u),3<p.length&&(p[3]*=1),p[0]=Cb(o+1/3,n,a),p[1]=Cb(o,n,a),p[2]=Cb(o-1/3,n,a);else p=e.match(rt)||Et.transparent;p=p.map(Number)}return r&&!c&&(n=p[0]/zt,a=p[1]/zt,s=p[2]/zt,h=((l=Math.max(n,a,s))+(f=Math.min(n,a,s)))/2,l===f?o=u=0:(d=l-f,u=.5<h?d/(2-l-f):d/(l+f),o=l===n?(a-s)/d+(a<s?6:0):l===a?(s-n)/d+2:(n-a)/d+4,o*=60),p[0]=~~(o+.5),p[1]=~~(100*u+.5),p[2]=~~(100*h+.5)),i&&p.length<4&&(p[3]=1),p}function Eb(t){var r=[],i=[],n=-1;return t.split(Rt).forEach(function(t){var e=t.match(nt)||[];r.push.apply(r,e),i.push(n+=e.length+1)}),r.c=i,r}function Fb(t,e,r){var i,n,a,s,o="",u=(t+o).match(Rt),h=e?"hsla(":"rgba(",l=0;if(!u)return t;if(u=u.map(function(t){return(t=Db(t,e,1))&&h+(e?t[0]+","+t[1]+"%,"+t[2]+"%,"+t[3]:t.join(","))+")"}),r&&(a=Eb(t),(i=r.c).join(o)!==a.c.join(o)))for(s=(n=t.replace(Rt,"1").split(nt)).length-1;l<s;l++)o+=n[l]+(~i.indexOf(l)?u.shift()||h+"0,0,0,0)":(a.length?a:u.length?u:r).shift());if(!n)for(s=(n=t.split(Rt)).length-1;l<s;l++)o+=n[l]+u[l];return o+n[s]}function Ib(t){var e,r=t.join(" ");if(Rt.lastIndex=0,Rt.test(r))return e=Ft.test(r),t[1]=Fb(t[1],e),t[0]=Fb(t[0],e,Eb(t[1])),!0}function Rb(t){var e=(t+"").split("("),r=Bt[e[0]];return r&&1<e.length&&r.config?r.config.apply(null,~t.indexOf("{")?[function _parseObjectInString(t){for(var e,r,i,n={},a=t.substr(1,t.length-3).split(":"),s=a[0],o=1,u=a.length;o<u;o++)r=a[o],e=o!==u-1?r.lastIndexOf(","):r.length,i=r.substr(0,e),n[s]=isNaN(i)?i.replace(Nt,"").trim():+i,s=r.substr(e+1).trim();return n}(e[1])]:function _valueInParentheses(t){var e=t.indexOf("(")+1,r=t.indexOf(")"),i=t.indexOf("(",e);return t.substring(e,~i&&i<r?t.indexOf(")",r+1):r)}(t).split(",").map(ra)):Bt._CE&&Yt.test(t)?Bt._CE("",t):r}function Tb(t,e){for(var r,i=t._first;i;)i instanceof Zt?Tb(i,e):!i.vars.yoyoEase||i._yoyo&&i._repeat||i._yoyo===e||(i.timeline?Tb(i.timeline,e):(r=i._ease,i._ease=i._yEase,i._yEase=r,i._yoyo=e)),i=i._next}function Vb(t,e,r,i){void 0===r&&(r=function easeOut(t){return 1-e(1-t)}),void 0===i&&(i=function easeInOut(t){return t<.5?e(2*t)/2:1-e(2*(1-t))/2});var n,a={easeIn:e,easeOut:r,easeInOut:i};return ja(t,function(t){for(var e in Bt[t]=ht[t]=a,Bt[n=t.toLowerCase()]=r,a)Bt[n+("easeIn"===e?".in":"easeOut"===e?".out":".inOut")]=Bt[t+"."+e]=a[e]}),a}function Wb(e){return function(t){return t<.5?(1-e(1-2*t))/2:.5+e(2*(t-.5))/2}}function Xb(r,t,e){function Lm(t){return 1===t?1:i*Math.pow(2,-10*t)*G((t-a)*n)+1}var i=1<=t?t:1,n=(e||(r?.3:.45))/(t<1?t:1),a=n/Z*(Math.asin(1/i)||0),s="out"===r?Lm:"in"===r?function(t){return 1-Lm(1-t)}:Wb(Lm);return n=Z/n,s.config=function(t,e){return Xb(r,t,e)},s}function Yb(e,r){function Tm(t){return t?--t*t*((r+1)*t+r)+1:0}void 0===r&&(r=1.70158);var t="out"===e?Tm:"in"===e?function(t){return 1-Tm(1-t)}:Wb(Tm);return t.config=function(t){return Yb(e,t)},t}var F,I,l,L,h,n,a,i,o,f,d,c,p,_,m,g,b,k,O,M,C,P,A,D,z,E,B,Y,N={autoSleep:120,force3D:"auto",nullTargetWarn:1,units:{lineHeight:""}},j={duration:.5,overwrite:!1,delay:0},X=1e8,q=1/X,Z=2*Math.PI,W=Z/4,H=0,J=Math.sqrt,Q=Math.cos,G=Math.sin,K="function"==typeof ArrayBuffer&&ArrayBuffer.isView||function(){},$=Array.isArray,tt=/random\\([^)]+\\)/g,et=/,\\s*/g,rt=/(?:-?\\.?\\d|\\.)+/gi,it=/[-+=.]*\\d+[.e\\-+]*\\d*[e\\-+]*\\d*/g,nt=/[-+=.]*\\d+[.e-]*\\d*[a-z%]*/g,at=/[-+=.]*\\d+\\.?\\d*(?:e-|e\\+)?\\d*/gi,st=/[+-]=-?[.\\d]+/,ot=/[^,'"\\[\\]\\s]+/gi,ut=/^[+\\-=e\\s\\d]*\\d+[.\\d]*([a-z]*|%)\\s*$/i,ht={},lt={suppressEvents:!0,isStart:!0,kill:!1},ft={suppressEvents:!0,kill:!1},dt={suppressEvents:!0},ct={},pt=[],_t={},mt={},gt={},vt=30,yt=[],Tt="",bt=function _merge(t,e){for(var r in e)t[r]=e[r];return t},wt=function _animationCycle(t,e){var r=Math.floor(t=la(t/e));return t&&r===t?r-1:r},xt=function _isFromOrFromStart(t){var e=t.data;return"isFromStart"===e||"isStart"===e},kt={_start:0,endTime:V,totalDuration:V},Ot=function _parsePosition(t,e,i){var n,a,s,o=t.labels,u=t._recent||kt,h=t.duration()>=X?u.endTime(!1):t._dur;return r(e)&&(isNaN(e)||e in o)?(a=e.charAt(0),s="%"===e.substr(-1),n=e.indexOf("="),"<"===a||">"===a?(0<=n&&(e=e.replace(/=/,"")),("<"===a?u._start:u.endTime(0<=u._repeat))+(parseFloat(e.substr(1))||0)*(s?(n<0?u:i).totalDuration()/100:1)):n<0?(e in o||(o[e]=h),o[e]):(a=parseFloat(e.charAt(n-1)+e.substr(n+1)),s&&i&&(a=a/100*($(i)?i[0]:i).totalDuration()),1<n?_parsePosition(t,e.substr(0,n-1),i)+a:h+a)):null==e?h:+e},Mt=function _clamp(t,e,r){return r<t?t:e<r?e:r},Ct=[].slice,Pt=function toArray(t,e,i){return l&&!e&&l.selector?l.selector(t):!r(t)||i||!n&&Lt()?$(t)?function _flatten(t,e,i){return void 0===i&&(i=[]),t.forEach(function(t){return r(t)&&!e||cb(t,1)?i.push.apply(i,Pt(t)):i.push(t)})||i}(t,i):cb(t)?Ct.call(t,0):t?[t]:[]:Ct.call((e||a).querySelectorAll(t),0)},At=function mapRange(e,t,r,i,n){var a=t-e,s=i-r;return Za(n,function(t){return r+((t-e)/a*s||0)})},Dt=function _callback(t,e,r){var i,n,a,s=t.vars,o=s[e],u=l,h=t._ctx;if(o)return i=s[e+"Params"],n=s.callbackScope||t,r&&pt.length&&oa(),h&&(l=h),a=i?o.apply(n,i):o.call(n),l=u,a},St=[],zt=255,Et={aqua:[0,zt,zt],lime:[0,zt,0],silver:[192,192,192],black:[0,0,0],maroon:[128,0,0],teal:[0,128,128],blue:[0,0,zt],navy:[0,0,128],white:[zt,zt,zt],olive:[128,128,0],yellow:[zt,zt,0],orange:[zt,165,0],gray:[128,128,128],purple:[128,0,128],green:[0,128,0],red:[zt,0,0],pink:[zt,192,203],cyan:[0,zt,zt],transparent:[zt,zt,zt,0]},Rt=function(){var t,e="(?:\\\\b(?:(?:rgb|rgba|hsl|hsla)\\\\(.+?\\\\))|\\\\B#(?:[0-9a-f]{3,4}){1,2}\\\\b";for(t in Et)e+="|"+t+"\\\\b";return new RegExp(e+")","gi")}(),Ft=/hsl[a]?\\(/,It=(O=Date.now,M=500,C=33,P=O(),A=P,z=D=1e3/240,g={time:0,frame:0,tick:function tick(){Al(!0)},deltaRatio:function deltaRatio(t){return b/(1e3/(t||60))},wake:function wake(){o&&(!n&&x()&&(h=n=window,a=h.document||{},ht.gsap=Fe,(h.gsapVersions||(h.gsapVersions=[])).push(Fe.version),R(i||h.GreenSockGlobals||!h.gsap&&h||{}),St.forEach(zb)),m="undefined"!=typeof requestAnimationFrame&&requestAnimationFrame,p&&g.sleep(),_=m||function(t){return setTimeout(t,z-1e3*g.time+1|0)},c=1,Al(2))},sleep:function sleep(){(m?cancelAnimationFrame:clearTimeout)(p),c=0,_=V},lagSmoothing:function lagSmoothing(t,e){M=t||1/0,C=Math.min(e||33,M)},fps:function fps(t){D=1e3/(t||240),z=1e3*g.time+D},add:function add(n,t,e){var a=t?function(t,e,r,i){n(t,e,r,i),g.remove(a)}:n;return g.remove(n),E[e?"unshift":"push"](a),Lt(),a},remove:function remove(t,e){~(e=E.indexOf(t))&&E.splice(e,1)&&e<=k&&k--},_listeners:E=[]}),Lt=function _wake(){return!c&&It.wake()},Bt={},Yt=/^[\\d.\\-M][\\d.\\-,\\s]/,Nt=/["']/g,jt=function _invertEase(e){return function(t){return 1-e(1-t)}},Vt=function _parseEase(t,e){return t&&(s(t)?t:Bt[t]||Rb(t))||e};function Al(t){var e,r,i,n,a=O()-A,s=!0===t;if((M<a||a<0)&&(P+=a-C),(0<(e=(i=(A+=a)-P)-z)||s)&&(n=++g.frame,b=i-1e3*g.time,g.time=i/=1e3,z+=e+(D<=e?4:D-e),r=1),s||(p=_(Al)),r)for(k=0;k<E.length;k++)E[k](i,b,n,t)}function jn(t){return t<Y?B*t*t:t<.7272727272727273?B*Math.pow(t-1.5/2.75,2)+.75:t<.9090909090909092?B*(t-=2.25/2.75)*t+.9375:B*Math.pow(t-2.625/2.75,2)+.984375}ja("Linear,Quad,Cubic,Quart,Quint,Strong",function(t,e){var r=e<5?e+1:e;Vb(t+",Power"+(r-1),e?function(t){return Math.pow(t,r)}:function(t){return t},function(t){return 1-Math.pow(1-t,r)},function(t){return t<.5?Math.pow(2*t,r)/2:1-Math.pow(2*(1-t),r)/2})}),Bt.Linear.easeNone=Bt.none=Bt.Linear.easeIn,Vb("Elastic",Xb("in"),Xb("out"),Xb()),B=7.5625,Y=1/2.75,Vb("Bounce",function(t){return 1-jn(1-t)},jn),Vb("Expo",function(t){return Math.pow(2,10*(t-1))*t+t*t*t*t*t*t*(1-t)}),Vb("Circ",function(t){return-(J(1-t*t)-1)}),Vb("Sine",function(t){return 1===t?1:1-Q(t*W)}),Vb("Back",Yb("in"),Yb("out"),Yb()),Bt.SteppedEase=Bt.steps=ht.SteppedEase={config:function config(t,e){void 0===t&&(t=1);var r=1/t,i=t+(e?0:1),n=e?1:0;return function(t){return((i*Mt(0,.99999999,t)|0)+n)*r}}},j.ease=Bt["quad.out"],ja("onComplete,onUpdate,onStart,onRepeat,onReverseComplete,onInterrupt",function(t){return Tt+=t+","+t+"Params,"});var Ut,Xt=function GSCache(t,e){this.id=H++,(t._gsap=this).target=t,this.harness=e,this.get=e?e.get:ia,this.set=e?e.getSetter:le},qt=((Ut=Animation.prototype).delay=function delay(t){return t||0===t?(this.parent&&this.parent.smoothChildTiming&&this.startTime(this._start+t-this._delay),this._delay=t,this):this._delay},Ut.duration=function duration(t){return arguments.length?this.totalDuration(0<this._repeat?t+(t+this._rDelay)*this._repeat:t):this.totalDuration()&&this._dur},Ut.totalDuration=function totalDuration(t){return arguments.length?(this._dirty=0,Ua(this,this._repeat<0?t:(t-this._repeat*this._rDelay)/(this._repeat+1))):this._tDur},Ut.totalTime=function totalTime(t,e){if(Lt(),!arguments.length)return this._tTime;var r=this._dp;if(r&&r.smoothChildTiming&&this._ts){for(La(this,t),!r._dp||r.parent||Ma(r,this);r&&r.parent;)r.parent._time!==r._start+(0<=r._ts?r._tTime/r._ts:(r.totalDuration()-r._tTime)/-r._ts)&&r.totalTime(r._tTime,!0),r=r.parent;!this.parent&&this._dp.autoRemoveChildren&&(0<this._ts&&t<this._tDur||this._ts<0&&0<t||!this._tDur&&!t)&&Na(this._dp,this,this._start-this._delay)}return(this._tTime!==t||!this._dur&&!e||this._initted&&Math.abs(this._zTime)===q||!this._initted&&this._dur&&t||!t&&!this._initted&&(this.add||this._ptLookup))&&(this._ts||(this._pTime=t),qa(this,t,e)),this},Ut.time=function time(t,e){return arguments.length?this.totalTime(Math.min(this.totalDuration(),t+Ha(this))%(this._dur+this._rDelay)||(t?this._dur:0),e):this._time},Ut.totalProgress=function totalProgress(t,e){return arguments.length?this.totalTime(this.totalDuration()*t,e):this.totalDuration()?Math.min(1,this._tTime/this._tDur):0<=this.rawTime()&&this._initted?1:0},Ut.progress=function progress(t,e){return arguments.length?this.totalTime(this.duration()*(!this._yoyo||1&this.iteration()?t:1-t)+Ha(this),e):this.duration()?Math.min(1,this._time/this._dur):0<this.rawTime()?1:0},Ut.iteration=function iteration(t,e){var r=this.duration()+this._rDelay;return arguments.length?this.totalTime(this._time+(t-1)*r,e):this._repeat?wt(this._tTime,r)+1:1},Ut.timeScale=function timeScale(t,e){if(!arguments.length)return this._rts===-q?0:this._rts;if(this._rts===t)return this;var r=this.parent&&this._ts?Ja(this.parent._time,this):this._tTime;return this._rts=+t||0,this._ts=this._ps||t===-q?0:this._rts,this.totalTime(Mt(-Math.abs(this._delay),this.totalDuration(),r),!1!==e),Ka(this),function _recacheAncestors(t){for(var e=t.parent;e&&e.parent;)e._dirty=1,e.totalDuration(),e=e.parent;return t}(this)},Ut.paused=function paused(t){return arguments.length?(this._ps!==t&&((this._ps=t)?(this._pTime=this._tTime||Math.max(-this._delay,this.rawTime()),this._ts=this._act=0):(Lt(),this._ts=this._rts,this.totalTime(this.parent&&!this.parent.smoothChildTiming?this.rawTime():this._tTime||this._pTime,1===this.progress()&&Math.abs(this._zTime)!==q&&(this._tTime-=q)))),this):this._ps},Ut.startTime=function startTime(t){if(arguments.length){this._start=la(t);var e=this.parent||this._dp;return!e||!e._sort&&this.parent||Na(e,this,this._start-this._delay),this}return this._start},Ut.endTime=function endTime(t){return this._start+(w(t)?this.totalDuration():this.duration())/Math.abs(this._ts||1)},Ut.rawTime=function rawTime(t){var e=this.parent||this._dp;return e?t&&(!this._ts||this._repeat&&this._time&&this.totalProgress()<1)?this._tTime%(this._dur+this._rDelay):this._ts?Ja(e.rawTime(t),this):this._tTime:this._tTime},Ut.revert=function revert(t){void 0===t&&(t=dt);var e=I;return I=t,pa(this)&&(this.timeline&&this.timeline.revert(t),this.totalTime(-.01,t.suppressEvents)),"nested"!==this.data&&!1!==t.kill&&this.kill(),I=e,this},Ut.globalTime=function globalTime(t){for(var e=this,r=arguments.length?t:e.rawTime();e;)r=e._start+r/(Math.abs(e._ts)||1),e=e._dp;return!this.parent&&this._sat?this._sat.globalTime(t):r},Ut.repeat=function repeat(t){return arguments.length?(this._repeat=t===1/0?-2:t,Va(this)):-2===this._repeat?1/0:this._repeat},Ut.repeatDelay=function repeatDelay(t){if(arguments.length){var e=this._time;return this._rDelay=t,Va(this),e?this.time(e):this}return this._rDelay},Ut.yoyo=function yoyo(t){return arguments.length?(this._yoyo=t,this):this._yoyo},Ut.seek=function seek(t,e){return this.totalTime(Ot(this,t),w(e))},Ut.restart=function restart(t,e){return this.play().totalTime(t?-this._delay:0,w(e)),this._dur||(this._zTime=-q),this},Ut.play=function play(t,e){return null!=t&&this.seek(t,e),this.reversed(!1).paused(!1)},Ut.reverse=function reverse(t,e){return null!=t&&this.seek(t||this.totalDuration(),e),this.reversed(!0).paused(!1)},Ut.pause=function pause(t,e){return null!=t&&this.seek(t,e),this.paused(!0)},Ut.resume=function resume(){return this.paused(!1)},Ut.reversed=function reversed(t){return arguments.length?(!!t!==this.reversed()&&this.timeScale(-this._rts||(t?-q:0)),this):this._rts<0},Ut.invalidate=function invalidate(){return this._initted=this._act=0,this._zTime=-q,this},Ut.isActive=function isActive(){var t,e=this.parent||this._dp,r=this._start;return!(e&&!(this._ts&&this._initted&&e.isActive()&&(t=e.rawTime(!0))>=r&&t<this.endTime(!0)-q))},Ut.eventCallback=function eventCallback(t,e,r){var i=this.vars;return 1<arguments.length?(e?(i[t]=e,r&&(i[t+"Params"]=r),"onUpdate"===t&&(this._onUpdate=e)):delete i[t],this):i[t]},Ut.then=function then(t){var i=this,n=i._prom;return new Promise(function(e){function Fo(){var t=i.then;i.then=null,n&&n(),s(r)&&(r=r(i))&&(r.then||r===i)&&(i.then=t),e(r),i.then=t}var r=s(t)?t:sa;i._initted&&1===i.totalProgress()&&0<=i._ts||!i._tTime&&i._ts<0?Fo():i._prom=Fo})},Ut.kill=function kill(){wb(this)},Animation);function Animation(t){this.vars=t,this._delay=+t.delay||0,(this._repeat=t.repeat===1/0?-2:t.repeat||0)&&(this._rDelay=t.repeatDelay||0,this._yoyo=!!t.yoyo||!!t.yoyoEase),this._ts=1,Ua(this,+t.duration,1,1),this.data=t.data,l&&(this._ctx=l).data.push(this),c||It.wake()}ta(qt.prototype,{_time:0,_start:0,_end:0,_tTime:0,_tDur:0,_dirty:0,_repeat:0,_yoyo:!1,parent:null,_initted:!1,_rDelay:0,_ts:1,_dp:0,ratio:0,_zTime:-q,_prom:0,_ps:!1,_rts:1});var Zt=function(i){function Timeline(t,e){var r;return void 0===t&&(t={}),(r=i.call(this,t)||this).labels={},r.smoothChildTiming=!!t.smoothChildTiming,r.autoRemoveChildren=!!t.autoRemoveChildren,r._sort=w(t.sortChildren),L&&Na(t.parent||L,_assertThisInitialized(r),e),t.reversed&&r.reverse(),t.paused&&r.paused(!0),t.scrollTrigger&&Oa(_assertThisInitialized(r),t.scrollTrigger),r}_inheritsLoose(Timeline,i);var e=Timeline.prototype;return e.to=function to(t,e,r){return Ya(0,arguments,this),this},e.from=function from(t,e,r){return Ya(1,arguments,this),this},e.fromTo=function fromTo(t,e,r,i){return Ya(2,arguments,this),this},e.set=function set(t,e,r){return e.duration=0,e.parent=this,ya(e).repeatDelay||(e.repeat=0),e.immediateRender=!!e.immediateRender,new te(t,e,Ot(this,r),1),this},e.call=function call(t,e,r){return Na(this,te.delayedCall(0,t,e),r)},e.staggerTo=function staggerTo(t,e,r,i,n,a,s){return r.duration=e,r.stagger=r.stagger||i,r.onComplete=a,r.onCompleteParams=s,r.parent=this,new te(t,r,Ot(this,n)),this},e.staggerFrom=function staggerFrom(t,e,r,i,n,a,s){return r.runBackwards=1,ya(r).immediateRender=w(r.immediateRender),this.staggerTo(t,e,r,i,n,a,s)},e.staggerFromTo=function staggerFromTo(t,e,r,i,n,a,s,o){return i.startAt=r,ya(i).immediateRender=w(i.immediateRender),this.staggerTo(t,e,i,n,a,s,o)},e.render=function render(t,e,r){var i,n,a,s,o,u,h,l,f,d,c,p,_=this._time,m=this._dirty?this.totalDuration():this._tDur,g=this._dur,v=t<=0?0:la(t),y=this._zTime<0!=t<0&&(this._initted||!g);if(this!==L&&m<v&&0<=t&&(v=m),v!==this._tTime||r||y){if(_!==this._time&&g&&(v+=this._time-_,t+=this._time-_),i=v,f=this._start,u=!(l=this._ts),y&&(g||(_=this._zTime),!t&&e||(this._zTime=t)),this._repeat){if(c=this._yoyo,o=g+this._rDelay,this._repeat<-1&&t<0)return this.totalTime(100*o+t,e,r);if(i=la(v%o),v===m?(s=this._repeat,i=g):((s=~~(d=la(v/o)))&&s===d&&(i=g,s--),g<i&&(i=g)),d=wt(this._tTime,o),!_&&this._tTime&&d!==s&&this._tTime-d*o-this._dur<=0&&(d=s),c&&1&s&&(i=g-i,p=1),s!==d&&!this._lock){var T=c&&1&d,b=T===(c&&1&s);if(s<d&&(T=!T),_=T?0:v%g?g:v,this._lock=1,this.render(_||(p?0:la(s*o)),e,!g)._lock=0,this._tTime=v,!e&&this.parent&&Dt(this,"onRepeat"),this.vars.repeatRefresh&&!p&&(this.invalidate()._lock=1,d=s),_&&_!==this._time||u!=!this._ts||this.vars.onRepeat&&!this.parent&&!this._act)return this;if(g=this._dur,m=this._tDur,b&&(this._lock=2,_=T?g:-1e-4,this.render(_,!0),this.vars.repeatRefresh&&!p&&this.invalidate()),this._lock=0,!this._ts&&!u)return this;Tb(this,p)}}if(this._hasPause&&!this._forcing&&this._lock<2&&(h=function _findNextPauseTween(t,e,r){var i;if(e<r)for(i=t._first;i&&i._start<=r;){if("isPause"===i.data&&i._start>e)return i;i=i._next}else for(i=t._last;i&&i._start>=r;){if("isPause"===i.data&&i._start<e)return i;i=i._prev}}(this,la(_),la(i)))&&(v-=i-(i=h._start)),this._tTime=v,this._time=i,this._act=!l,this._initted||(this._onUpdate=this.vars.onUpdate,this._initted=1,this._zTime=t,_=0),!_&&v&&g&&!e&&!d&&(Dt(this,"onStart"),this._tTime!==v))return this;if(_<=i&&0<=t)for(n=this._first;n;){if(a=n._next,(n._act||i>=n._start)&&n._ts&&h!==n){if(n.parent!==this)return this.render(t,e,r);if(n.render(0<n._ts?(i-n._start)*n._ts:(n._dirty?n.totalDuration():n._tDur)+(i-n._start)*n._ts,e,r),i!==this._time||!this._ts&&!u){h=0,a&&(v+=this._zTime=-q);break}}n=a}else{n=this._last;for(var w=t<0?t:i;n;){if(a=n._prev,(n._act||w<=n._end)&&n._ts&&h!==n){if(n.parent!==this)return this.render(t,e,r);if(n.render(0<n._ts?(w-n._start)*n._ts:(n._dirty?n.totalDuration():n._tDur)+(w-n._start)*n._ts,e,r||I&&pa(n)),i!==this._time||!this._ts&&!u){h=0,a&&(v+=this._zTime=w?-q:q);break}}n=a}}if(h&&!e&&(this.pause(),h.render(_<=i?0:-q)._zTime=_<=i?1:-1,this._ts))return this._start=f,Ka(this),this.render(t,e,r);this._onUpdate&&!e&&Dt(this,"onUpdate",!0),(v===m&&this._tTime>=this.totalDuration()||!v&&_)&&(f!==this._start&&Math.abs(l)===Math.abs(this._ts)||this._lock||(!t&&g||!(v===m&&0<this._ts||!v&&this._ts<0)||Ca(this,1),e||t<0&&!_||!v&&!_&&m||(Dt(this,v===m&&0<=t?"onComplete":"onReverseComplete",!0),!this._prom||v<m&&0<this.timeScale()||this._prom())))}return this},e.add=function add(e,i){var n=this;if(t(i)||(i=Ot(this,i,e)),!(e instanceof qt)){if($(e))return e.forEach(function(t){return n.add(t,i)}),this;if(r(e))return this.addLabel(e,i);if(!s(e))return this;e=te.delayedCall(0,e)}return this!==e?Na(this,e,i):this},e.getChildren=function getChildren(t,e,r,i){void 0===t&&(t=!0),void 0===e&&(e=!0),void 0===r&&(r=!0),void 0===i&&(i=-X);for(var n=[],a=this._first;a;)a._start>=i&&(a instanceof te?e&&n.push(a):(r&&n.push(a),t&&n.push.apply(n,a.getChildren(!0,e,r)))),a=a._next;return n},e.getById=function getById(t){for(var e=this.getChildren(1,1,1),r=e.length;r--;)if(e[r].vars.id===t)return e[r]},e.remove=function remove(t){return r(t)?this.removeLabel(t):s(t)?this.killTweensOf(t):(t.parent===this&&Ba(this,t),t===this._recent&&(this._recent=this._last),Da(this))},e.totalTime=function totalTime(t,e){return arguments.length?(this._forcing=1,!this._dp&&this._ts&&(this._start=la(It.time-(0<this._ts?t/this._ts:(this.totalDuration()-t)/-this._ts))),i.prototype.totalTime.call(this,t,e),this._forcing=0,this):this._tTime},e.addLabel=function addLabel(t,e){return this.labels[t]=Ot(this,e),this},e.removeLabel=function removeLabel(t){return delete this.labels[t],this},e.addPause=function addPause(t,e,r){var i=te.delayedCall(0,e||V,r);return i.data="isPause",this._hasPause=1,Na(this,i,Ot(this,t))},e.removePause=function removePause(t){var e=this._first;for(t=Ot(this,t);e;)e._start===t&&"isPause"===e.data&&Ca(e),e=e._next},e.killTweensOf=function killTweensOf(t,e,r){for(var i=this.getTweensOf(t,r),n=i.length;n--;)Wt!==i[n]&&i[n].kill(t,e);return this},e.getTweensOf=function getTweensOf(e,r){for(var i,n=[],a=Pt(e),s=this._first,o=t(r);s;)s instanceof te?na(s._targets,a)&&(o?(!Wt||s._initted&&s._ts)&&s.globalTime(0)<=r&&s.globalTime(s.totalDuration())>r:!r||s.isActive())&&n.push(s):(i=s.getTweensOf(a,r)).length&&n.push.apply(n,i),s=s._next;return n},e.tweenTo=function tweenTo(t,e){e=e||{};var r,i=this,n=Ot(i,t),a=e.startAt,s=e.onStart,o=e.onStartParams,u=e.immediateRender,h=te.to(i,ta({ease:e.ease||"none",lazy:!1,immediateRender:!1,time:n,overwrite:"auto",duration:e.duration||Math.abs((n-(a&&"time"in a?a.time:i._time))/i.timeScale())||q,onStart:function onStart(){if(i.pause(),!r){var t=e.duration||Math.abs((n-(a&&"time"in a?a.time:i._time))/i.timeScale());h._dur!==t&&Ua(h,t,0,1).render(h._time,!0,!0),r=1}s&&s.apply(h,o||[])}},e));return u?h.render(0):h},e.tweenFromTo=function tweenFromTo(t,e,r){return this.tweenTo(e,ta({startAt:{time:Ot(this,t)}},r))},e.recent=function recent(){return this._recent},e.nextLabel=function nextLabel(t){return void 0===t&&(t=this._time),ub(this,Ot(this,t))},e.previousLabel=function previousLabel(t){return void 0===t&&(t=this._time),ub(this,Ot(this,t),1)},e.currentLabel=function currentLabel(t){return arguments.length?this.seek(t,!0):this.previousLabel(this._time+q)},e.shiftChildren=function shiftChildren(t,e,r){void 0===r&&(r=0);var i,n=this._first,a=this.labels;for(t=la(t);n;)n._start>=r&&(n._start+=t,n._end+=t),n=n._next;if(e)for(i in a)a[i]>=r&&(a[i]+=t);return Da(this)},e.invalidate=function invalidate(t){var e=this._first;for(this._lock=0;e;)e.invalidate(t),e=e._next;return i.prototype.invalidate.call(this,t)},e.clear=function clear(t){void 0===t&&(t=!0);for(var e,r=this._first;r;)e=r._next,this.remove(r),r=e;return this._dp&&(this._time=this._tTime=this._pTime=0),t&&(this.labels={}),Da(this)},e.totalDuration=function totalDuration(t){var e,r,i,n=0,a=this,s=a._last,o=X;if(arguments.length)return a.timeScale((a._repeat<0?a.duration():a.totalDuration())/(a.reversed()?-t:t));if(a._dirty){for(i=a.parent;s;)e=s._prev,s._dirty&&s.totalDuration(),o<(r=s._start)&&a._sort&&s._ts&&!a._lock?(a._lock=1,Na(a,s,r-s._delay,1)._lock=0):o=r,r<0&&s._ts&&(n-=r,(!i&&!a._dp||i&&i.smoothChildTiming)&&(a._start+=la(r/a._ts),a._time-=r,a._tTime-=r),a.shiftChildren(-r,!1,-Infinity),o=0),s._end>n&&s._ts&&(n=s._end),s=e;Ua(a,a===L&&a._time>n?a._time:n,1,1),a._dirty=0}return a._tDur},Timeline.updateRoot=function updateRoot(t){if(L._ts&&(qa(L,Ja(t,L)),f=It.frame),It.frame>=vt){vt+=N.autoSleep||120;var e=L._first;if((!e||!e._ts)&&N.autoSleep&&It._listeners.length<2){for(;e&&!e._ts;)e=e._next;e||It.sleep()}}},Timeline}(qt);ta(Zt.prototype,{_lock:0,_hasPause:0,_forcing:0});function dc(t,e,i,n,a,o){var u,h,l,f;if(mt[t]&&!1!==(u=new mt[t]).init(a,u.rawVars?e[t]:function _processVars(t,e,i,n,a){if(s(t)&&(t=Gt(t,a,e,i,n)),!v(t)||t.style&&t.nodeType||$(t)||K(t))return r(t)?Gt(t,a,e,i,n):t;var o,u={};for(o in t)u[o]=Gt(t[o],a,e,i,n);return u}(e[t],n,a,o,i),i,n,o)&&(i._pt=h=new we(i._pt,a,t,0,1,u.render,u,0,u.priority),i!==d))for(l=i._ptLookup[i._targets.indexOf(a)],f=u._props.length;f--;)l[u._props[f]]=h;return u}function jc(t,r,e,i){var n,a,s=r.ease||i||"power1.inOut";if($(r))a=e[t]||(e[t]=[]),r.forEach(function(t,e){return a.push({t:e/(r.length-1)*100,v:t,e:s})});else for(n in r)a=e[n]||(e[n]=[]),"ease"===n||a.push({t:parseFloat(t),v:r[n],e:s})}var Wt,Ht,Jt=function _addPropTween(t,e,i,n,a,o,u,h,l,f){s(n)&&(n=n(a||0,t,o));var d,c=t[e],p="get"!==i?i:s(c)?l?t[e.indexOf("set")||!s(t["get"+e.substr(3)])?e:"get"+e.substr(3)](l):t[e]():c,_=s(c)?l?ue:re:ee;if(r(n)&&(~n.indexOf("random(")&&(n=rb(n)),"="===n.charAt(1)&&(!(d=ma(p,n)+(_a(p)||0))&&0!==d||(n=d))),!f||p!==n||Ht)return isNaN(p*n)||""===n?(c||e in t||S(e,n),function _addComplexStringPropTween(t,e,r,i,n,a,s){var o,u,h,l,f,d,c,p,_=new we(this._pt,t,e,0,1,ge,null,n),m=0,g=0;for(_.b=r,_.e=i,r+="",(c=~(i+="").indexOf("random("))&&(i=rb(i)),a&&(a(p=[r,i],t,e),r=p[0],i=p[1]),u=r.match(at)||[];o=at.exec(i);)l=o[0],f=i.substring(m,o.index),h?h=(h+1)%5:"rgba("===f.substr(-5)&&(h=1),l!==u[g++]&&(d=parseFloat(u[g-1])||0,_._pt={_next:_._pt,p:f||1===g?f:",",s:d,c:"="===l.charAt(1)?ma(d,l)-d:parseFloat(l)-d,m:h&&h<4?Math.round:0},m=at.lastIndex);return _.c=m<i.length?i.substring(m,i.length):"",_.fp=s,(st.test(i)||c)&&(_.e=0),this._pt=_}.call(this,t,e,p,n,_,h||N.stringFilter,l)):(d=new we(this._pt,t,e,+p||0,n-(p||0),"boolean"==typeof c?_e:ce,0,_),l&&(d.fp=l),u&&d.modifier(u,this,t),this._pt=d)},Qt=function _initTween(t,e,r){var i,n,a,s,o,u,h,l,f,d,c,p,_,m=t.vars,g=m.ease,v=m.startAt,y=m.immediateRender,T=m.lazy,b=m.onUpdate,x=m.runBackwards,k=m.yoyoEase,O=m.keyframes,M=m.autoRevert,C=t._dur,P=t._startAt,A=t._targets,D=t.parent,S=D&&"nested"===D.data?D.vars.targets:A,z="auto"===t._overwrite&&!F,E=t.timeline;if(!E||O&&g||(g="none"),t._ease=Vt(g,j.ease),t._yEase=k?jt(Vt(!0===k?g:k,j.ease)):0,k&&t._yoyo&&!t._repeat&&(k=t._yEase,t._yEase=t._ease,t._ease=k),t._from=!E&&!!m.runBackwards,!E||O&&!m.stagger){if(p=(l=A[0]?ha(A[0]).harness:0)&&m[l.prop],i=xa(m,ct),P&&(P._zTime<0&&P.progress(1),e<0&&x&&y&&!M?P.render(-1,!0):P.revert(x&&C?ft:lt),P._lazy=0),v){if(Ca(t._startAt=te.set(A,ta({data:"isStart",overwrite:!1,parent:D,immediateRender:!0,lazy:!P&&w(T),startAt:null,delay:0,onUpdate:b&&function(){return Dt(t,"onUpdate")},stagger:0},v))),t._startAt._dp=0,t._startAt._sat=t,e<0&&(I||!y&&!M)&&t._startAt.revert(ft),y&&C&&e<=0&&r<=0)return void(e&&(t._zTime=e))}else if(x&&C&&!P)if(e&&(y=!1),a=ta({overwrite:!1,data:"isFromStart",lazy:y&&!P&&w(T),immediateRender:y,stagger:0,parent:D},i),p&&(a[l.prop]=p),Ca(t._startAt=te.set(A,a)),t._startAt._dp=0,t._startAt._sat=t,e<0&&(I?t._startAt.revert(ft):t._startAt.render(-1,!0)),t._zTime=e,y){if(!e)return}else _initTween(t._startAt,q,q);for(t._pt=t._ptCache=0,T=C&&w(T)||T&&!C,n=0;n<A.length;n++){if(h=(o=A[n])._gsap||ga(A)[n]._gsap,t._ptLookup[n]=d={},_t[h.id]&&pt.length&&oa(),c=S===A?n:S.indexOf(o),l&&!1!==(f=new l).init(o,p||i,t,c,S)&&(t._pt=s=new we(t._pt,o,f.name,0,1,f.render,f,0,f.priority),f._props.forEach(function(t){d[t]=s}),f.priority&&(u=1)),!l||p)for(a in i)mt[a]&&(f=dc(a,i,t,c,o,S))?f.priority&&(u=1):d[a]=s=Jt.call(t,o,a,"get",i[a],c,S,0,m.stringFilter);t._op&&t._op[n]&&t.kill(o,t._op[n]),z&&t._pt&&(Wt=t,L.killTweensOf(o,d,t.globalTime(e)),_=!t.parent,Wt=0),t._pt&&T&&(_t[h.id]=1)}u&&be(t),t._onInit&&t._onInit(t)}t._onUpdate=b,t._initted=(!t._op||t._pt)&&!_,O&&e<=0&&E.render(X,!0,!0)},Gt=function _parseFuncOrString(t,e,i,n,a){return s(t)?t.call(e,i,n,a):r(t)&&~t.indexOf("random(")?rb(t):t},Kt=Tt+"repeat,repeatDelay,yoyo,repeatRefresh,yoyoEase,autoRevert",$t={};ja(Kt+",id,stagger,delay,duration,paused,scrollTrigger",function(t){return $t[t]=1});var te=function(R){function Tween(e,r,i,n){var a;"number"==typeof r&&(i.duration=r,r=i,i=null);var s,o,u,h,l,f,d,c,p=(a=R.call(this,n?r:ya(r))||this).vars,_=p.duration,m=p.delay,g=p.immediateRender,b=p.stagger,x=p.overwrite,k=p.keyframes,O=p.defaults,M=p.scrollTrigger,C=p.yoyoEase,P=r.parent||L,A=($(e)||K(e)?t(e[0]):"length"in r)?[e]:Pt(e);if(a._targets=A.length?ga(A):T("GSAP target "+e+" not found. https://gsap.com",!N.nullTargetWarn)||[],a._ptLookup=[],a._overwrite=x,k||b||y(_)||y(m)){if(r=a.vars,(s=a.timeline=new Zt({data:"nested",defaults:O||{},targets:P&&"nested"===P.data?P.vars.targets:A})).kill(),s.parent=s._dp=_assertThisInitialized(a),s._start=0,b||y(_)||y(m)){if(h=A.length,d=b&&hb(b),v(b))for(l in b)~Kt.indexOf(l)&&((c=c||{})[l]=b[l]);for(o=0;o<h;o++)(u=xa(r,$t)).stagger=0,C&&(u.yoyoEase=C),c&&bt(u,c),f=A[o],u.duration=+Gt(_,_assertThisInitialized(a),o,f,A),u.delay=(+Gt(m,_assertThisInitialized(a),o,f,A)||0)-a._delay,!b&&1===h&&u.delay&&(a._delay=m=u.delay,a._start+=m,u.delay=0),s.to(f,u,d?d(o,f,A):0),s._ease=Bt.none;s.duration()?_=m=0:a.timeline=0}else if(k){ya(ta(s.vars.defaults,{ease:"none"})),s._ease=Vt(k.ease||r.ease||"none");var D,S,z,E=0;if($(k))k.forEach(function(t){return s.to(A,t,">")}),s.duration();else{for(l in u={},k)"ease"===l||"easeEach"===l||jc(l,k[l],u,k.easeEach);for(l in u)for(D=u[l].sort(function(t,e){return t.t-e.t}),o=E=0;o<D.length;o++)(z={ease:(S=D[o]).e,duration:(S.t-(o?D[o-1].t:0))/100*_})[l]=S.v,s.to(A,z,E),E+=z.duration;s.duration()<_&&s.to({},{duration:_-s.duration()})}}_||a.duration(_=s.duration())}else a.timeline=0;return!0!==x||F||(Wt=_assertThisInitialized(a),L.killTweensOf(A),Wt=0),Na(P,_assertThisInitialized(a),i),r.reversed&&a.reverse(),r.paused&&a.paused(!0),(g||!_&&!k&&a._start===la(P._time)&&w(g)&&function _hasNoPausedAncestors(t){return!t||t._ts&&_hasNoPausedAncestors(t.parent)}(_assertThisInitialized(a))&&"nested"!==P.data)&&(a._tTime=-q,a.render(Math.max(0,-m)||0)),M&&Oa(_assertThisInitialized(a),M),a}_inheritsLoose(Tween,R);var e=Tween.prototype;return e.render=function render(t,e,r){var i,n,a,s,o,u,h,l,f,d=this._time,c=this._tDur,p=this._dur,_=t<0,m=c-q<t&&!_?c:t<q?0:t;if(p){if(m!==this._tTime||!t||r||!this._initted&&this._tTime||this._startAt&&this._zTime<0!=_||this._lazy){if(i=m,l=this.timeline,this._repeat){if(s=p+this._rDelay,this._repeat<-1&&_)return this.totalTime(100*s+t,e,r);if(i=la(m%s),m===c?(a=this._repeat,i=p):(a=~~(o=la(m/s)))&&a===o?(i=p,a--):p<i&&(i=p),(u=this._yoyo&&1&a)&&(f=this._yEase,i=p-i),o=wt(this._tTime,s),i===d&&!r&&this._initted&&a===o)return this._tTime=m,this;a!==o&&(l&&this._yEase&&Tb(l,u),this.vars.repeatRefresh&&!u&&!this._lock&&i!==s&&this._initted&&(this._lock=r=1,this.render(la(s*a),!0).invalidate()._lock=0))}if(!this._initted){if(Pa(this,_?t:i,r,e,m))return this._tTime=0,this;if(!(d===this._time||r&&this.vars.repeatRefresh&&a!==o))return this;if(p!==this._dur)return this.render(t,e,r)}if(this._tTime=m,this._time=i,!this._act&&this._ts&&(this._act=1,this._lazy=0),this.ratio=h=(f||this._ease)(i/p),this._from&&(this.ratio=h=1-h),!d&&m&&!e&&!o&&(Dt(this,"onStart"),this._tTime!==m))return this;for(n=this._pt;n;)n.r(h,n.d),n=n._next;l&&l.render(t<0?t:l._dur*l._ease(i/this._dur),e,r)||this._startAt&&(this._zTime=t),this._onUpdate&&!e&&(_&&Fa(this,t,0,r),Dt(this,"onUpdate")),this._repeat&&a!==o&&this.vars.onRepeat&&!e&&this.parent&&Dt(this,"onRepeat"),m!==this._tDur&&m||this._tTime!==m||(_&&!this._onUpdate&&Fa(this,t,0,!0),!t&&p||!(m===this._tDur&&0<this._ts||!m&&this._ts<0)||Ca(this,1),e||_&&!d||!(m||d||u)||(Dt(this,m===c?"onComplete":"onReverseComplete",!0),!this._prom||m<c&&0<this.timeScale()||this._prom()))}}else!function _renderZeroDurationTween(t,e,r,i){var n,a,s,o=t.ratio,u=e<0||!e&&(!t._start&&function _parentPlayheadIsBeforeStart(t){var e=t.parent;return e&&e._ts&&e._initted&&!e._lock&&(e.rawTime()<0||_parentPlayheadIsBeforeStart(e))}(t)&&(t._initted||!xt(t))||(t._ts<0||t._dp._ts<0)&&!xt(t))?0:1,h=t._rDelay,l=0;if(h&&t._repeat&&(l=Mt(0,t._tDur,e),a=wt(l,h),t._yoyo&&1&a&&(u=1-u),a!==wt(t._tTime,h)&&(o=1-u,t.vars.repeatRefresh&&t._initted&&t.invalidate())),u!==o||I||i||t._zTime===q||!e&&t._zTime){if(!t._initted&&Pa(t,e,i,r,l))return;for(s=t._zTime,t._zTime=e||(r?q:0),r=r||e&&!s,t.ratio=u,t._from&&(u=1-u),t._time=0,t._tTime=l,n=t._pt;n;)n.r(u,n.d),n=n._next;e<0&&Fa(t,e,0,!0),t._onUpdate&&!r&&Dt(t,"onUpdate"),l&&t._repeat&&!r&&t.parent&&Dt(t,"onRepeat"),(e>=t._tDur||e<0)&&t.ratio===u&&(u&&Ca(t,1),r||I||(Dt(t,u?"onComplete":"onReverseComplete",!0),t._prom&&t._prom()))}else t._zTime||(t._zTime=e)}(this,t,e,r);return this},e.targets=function targets(){return this._targets},e.invalidate=function invalidate(t){return t&&this.vars.runBackwards||(this._startAt=0),this._pt=this._op=this._onUpdate=this._lazy=this.ratio=0,this._ptLookup=[],this.timeline&&this.timeline.invalidate(t),R.prototype.invalidate.call(this,t)},e.resetTo=function resetTo(t,e,r,i,n){c||It.wake(),this._ts||this.play();var a,s=Math.min(this._dur,(this._dp._time-this._start)*this._ts);return this._initted||Qt(this,s),a=this._ease(s/this._dur),function _updatePropTweens(t,e,r,i,n,a,s,o){var u,h,l,f,d=(t._pt&&t._ptCache||(t._ptCache={}))[e];if(!d)for(d=t._ptCache[e]=[],l=t._ptLookup,f=t._targets.length;f--;){if((u=l[f][e])&&u.d&&u.d._pt)for(u=u.d._pt;u&&u.p!==e&&u.fp!==e;)u=u._next;if(!u)return Ht=1,t.vars[e]="+=0",Qt(t,s),Ht=0,o?T(e+" not eligible for reset"):1;d.push(u)}for(f=d.length;f--;)(u=(h=d[f])._pt||h).s=!i&&0!==i||n?u.s+(i||0)+a*u.c:i,u.c=r-u.s,h.e&&(h.e=ka(r)+_a(h.e)),h.b&&(h.b=u.s+_a(h.b))}(this,t,e,r,i,a,s,n)?this.resetTo(t,e,r,i,1):(La(this,0),this.parent||Aa(this._dp,this,"_first","_last",this._dp._sort?"_start":0),this.render(0))},e.kill=function kill(t,e){if(void 0===e&&(e="all"),!(t||e&&"all"!==e))return this._lazy=this._pt=0,this.parent?wb(this):this.scrollTrigger&&this.scrollTrigger.kill(!!I),this;if(this.timeline){var i=this.timeline.totalDuration();return this.timeline.killTweensOf(t,e,Wt&&!0!==Wt.vars.overwrite)._first||wb(this),this.parent&&i!==this.timeline.totalDuration()&&Ua(this,this._dur*this.timeline._tDur/i,0,1),this}var n,a,s,o,u,h,l,f=this._targets,d=t?Pt(t):f,c=this._ptLookup,p=this._pt;if((!e||"all"===e)&&function _arraysMatch(t,e){for(var r=t.length,i=r===e.length;i&&r--&&t[r]===e[r];);return r<0}(f,d))return"all"===e&&(this._pt=0),wb(this);for(n=this._op=this._op||[],"all"!==e&&(r(e)&&(u={},ja(e,function(t){return u[t]=1}),e=u),e=function _addAliasesToVars(t,e){var r,i,n,a,s=t[0]?ha(t[0]).harness:0,o=s&&s.aliases;if(!o)return e;for(i in r=bt({},e),o)if(i in r)for(n=(a=o[i].split(",")).length;n--;)r[a[n]]=r[i];return r}(f,e)),l=f.length;l--;)if(~d.indexOf(f[l]))for(u in a=c[l],"all"===e?(n[l]=e,o=a,s={}):(s=n[l]=n[l]||{},o=e),o)(h=a&&a[u])&&("kill"in h.d&&!0!==h.d.kill(u)||Ba(this,h,"_pt"),delete a[u]),"all"!==s&&(s[u]=1);return this._initted&&!this._pt&&p&&wb(this),this},Tween.to=function to(t,e,r){return new Tween(t,e,r)},Tween.from=function from(t,e){return Ya(1,arguments)},Tween.delayedCall=function delayedCall(t,e,r,i){return new Tween(e,0,{immediateRender:!1,lazy:!1,overwrite:!1,delay:t,onComplete:e,onReverseComplete:e,onCompleteParams:r,onReverseCompleteParams:r,callbackScope:i})},Tween.fromTo=function fromTo(t,e,r){return Ya(2,arguments)},Tween.set=function set(t,e){return e.duration=0,e.repeatDelay||(e.repeat=0),new Tween(t,e)},Tween.killTweensOf=function killTweensOf(t,e,r){return L.killTweensOf(t,e,r)},Tween}(qt);ta(te.prototype,{_targets:[],_lazy:0,_startAt:0,_op:0,_onInit:0}),ja("staggerTo,staggerFrom,staggerFromTo",function(r){te[r]=function(){var t=new Zt,e=Ct.call(arguments,0);return e.splice("staggerFromTo"===r?5:4,0,0),t[r].apply(t,e)}});function rc(t,e,r){return t.setAttribute(e,r)}function zc(t,e,r,i){i.mSet(t,e,i.m.call(i.tween,r,i.mt),i)}var ee=function _setterPlain(t,e,r){return t[e]=r},re=function _setterFunc(t,e,r){return t[e](r)},ue=function _setterFuncWithParam(t,e,r,i){return t[e](i.fp,r)},le=function _getSetter(t,e){return s(t[e])?re:u(t[e])&&t.setAttribute?rc:ee},ce=function _renderPlain(t,e){return e.set(e.t,e.p,Math.round(1e6*(e.s+e.c*t))/1e6,e)},_e=function _renderBoolean(t,e){return e.set(e.t,e.p,!!(e.s+e.c*t),e)},ge=function _renderComplexString(t,e){var r=e._pt,i="";if(!t&&e.b)i=e.b;else if(1===t&&e.e)i=e.e;else{for(;r;)i=r.p+(r.m?r.m(r.s+r.c*t):Math.round(1e4*(r.s+r.c*t))/1e4)+i,r=r._next;i+=e.c}e.set(e.t,e.p,i,e)},ve=function _renderPropTweens(t,e){for(var r=e._pt;r;)r.r(t,r.d),r=r._next},ye=function _addPluginModifier(t,e,r,i){for(var n,a=this._pt;a;)n=a._next,a.p===i&&a.modifier(t,e,r),a=n},Te=function _killPropTweensOf(t){for(var e,r,i=this._pt;i;)r=i._next,i.p===t&&!i.op||i.op===t?Ba(this,i,"_pt"):i.dep||(e=1),i=r;return!e},be=function _sortPropTweensByPriority(t){for(var e,r,i,n,a=t._pt;a;){for(e=a._next,r=i;r&&r.pr>a.pr;)r=r._next;(a._prev=r?r._prev:n)?a._prev._next=a:i=a,(a._next=r)?r._prev=a:n=a,a=e}t._pt=i},we=(PropTween.prototype.modifier=function modifier(t,e,r){this.mSet=this.mSet||this.set,this.set=zc,this.m=t,this.mt=r,this.tween=e},PropTween);function PropTween(t,e,r,i,n,a,s,o,u){this.t=e,this.s=i,this.c=n,this.p=r,this.r=a||ce,this.d=s||this,this.set=o||ee,this.pr=u||0,(this._next=t)&&(t._prev=this)}ja(Tt+"parent,duration,ease,delay,overwrite,runBackwards,startAt,yoyo,immediateRender,repeat,repeatDelay,data,paused,reversed,lazy,callbackScope,stringFilter,id,yoyoEase,stagger,inherit,repeatRefresh,keyframes,autoRevert,scrollTrigger",function(t){return ct[t]=1}),ht.TweenMax=ht.TweenLite=te,ht.TimelineLite=ht.TimelineMax=Zt,L=new Zt({sortChildren:!1,defaults:j,autoRemoveChildren:!0,id:"root",smoothChildTiming:!0}),N.stringFilter=Ib;function Hc(t){return(Oe[t]||Me).map(function(t){return t()})}function Ic(){var t=Date.now(),o=[];2<t-Ce&&(Hc("matchMediaInit"),ke.forEach(function(t){var e,r,i,n,a=t.queries,s=t.conditions;for(r in a)(e=h.matchMedia(a[r]).matches)&&(i=1),e!==s[r]&&(s[r]=e,n=1);n&&(t.revert(),i&&o.push(t))}),Hc("matchMediaRevert"),o.forEach(function(e){return e.onMatch(e,function(t){return e.add(null,t)})}),Ce=t,Hc("matchMedia"))}var xe,ke=[],Oe={},Me=[],Ce=0,Pe=0,De=((xe=Context.prototype).add=function add(t,i,n){function Jw(){var t,e=l,r=a.selector;return e&&e!==a&&e.data.push(a),n&&(a.selector=fb(n)),l=a,t=i.apply(a,arguments),s(t)&&a._r.push(t),l=e,a.selector=r,a.isReverted=!1,t}s(t)&&(n=i,i=t,t=s);var a=this;return a.last=Jw,t===s?Jw(a,function(t){return a.add(null,t)}):t?a[t]=Jw:Jw},xe.ignore=function ignore(t){var e=l;l=null,t(this),l=e},xe.getTweens=function getTweens(){var e=[];return this.data.forEach(function(t){return t instanceof Context?e.push.apply(e,t.getTweens()):t instanceof te&&!(t.parent&&"nested"===t.parent.data)&&e.push(t)}),e},xe.clear=function clear(){this._r.length=this.data.length=0},xe.kill=function kill(i,t){var n=this;if(i?function(){for(var t,e=n.getTweens(),r=n.data.length;r--;)"isFlip"===(t=n.data[r]).data&&(t.revert(),t.getChildren(!0,!0,!1).forEach(function(t){return e.splice(e.indexOf(t),1)}));for(e.map(function(t){return{g:t._dur||t._delay||t._sat&&!t._sat.vars.immediateRender?t.globalTime(0):-1/0,t:t}}).sort(function(t,e){return e.g-t.g||-1/0}).forEach(function(t){return t.t.revert(i)}),r=n.data.length;r--;)(t=n.data[r])instanceof Zt?"nested"!==t.data&&(t.scrollTrigger&&t.scrollTrigger.revert(),t.kill()):t instanceof te||!t.revert||t.revert(i);n._r.forEach(function(t){return t(i,n)}),n.isReverted=!0}():this.data.forEach(function(t){return t.kill&&t.kill()}),this.clear(),t)for(var e=ke.length;e--;)ke[e].id===this.id&&ke.splice(e,1)},xe.revert=function revert(t){this.kill(t||{})},Context);function Context(t,e){this.selector=e&&fb(e),this.data=[],this._r=[],this.isReverted=!1,this.id=Pe++,t&&this.add(t)}var Se,Ee=((Se=MatchMedia.prototype).add=function add(t,e,r){v(t)||(t={matches:t});var i,n,a,s=new De(0,r||this.scope),o=s.conditions={};for(n in l&&!s.selector&&(s.selector=l.selector),this.contexts.push(s),e=s.add("onMatch",e),s.queries=t)"all"===n?a=1:(i=h.matchMedia(t[n]))&&(ke.indexOf(s)<0&&ke.push(s),(o[n]=i.matches)&&(a=1),i.addListener?i.addListener(Ic):i.addEventListener("change",Ic));return a&&e(s,function(t){return s.add(null,t)}),this},Se.revert=function revert(t){this.kill(t||{})},Se.kill=function kill(e){this.contexts.forEach(function(t){return t.kill(e,!0)})},MatchMedia);function MatchMedia(t){this.contexts=[],this.scope=t,l&&l.data.push(this)}var Re={registerPlugin:function registerPlugin(){for(var t=arguments.length,e=new Array(t),r=0;r<t;r++)e[r]=arguments[r];e.forEach(function(t){return zb(t)})},timeline:function timeline(t){return new Zt(t)},getTweensOf:function getTweensOf(t,e){return L.getTweensOf(t,e)},getProperty:function getProperty(i,t,e,n){r(i)&&(i=Pt(i)[0]);var a=ha(i||{}).get,s=e?sa:ra;return"native"===e&&(e=""),i?t?s((mt[t]&&mt[t].get||a)(i,t,e,n)):function(t,e,r){return s((mt[t]&&mt[t].get||a)(i,t,e,r))}:i},quickSetter:function quickSetter(r,e,i){if(1<(r=Pt(r)).length){var n=r.map(function(t){return Fe.quickSetter(t,e,i)}),a=n.length;return function(t){for(var e=a;e--;)n[e](t)}}r=r[0]||{};var s=mt[e],o=ha(r),u=o.harness&&(o.harness.aliases||{})[e]||e,h=s?function(t){var e=new s;d._pt=0,e.init(r,i?t+i:t,d,0,[r]),e.render(1,e),d._pt&&ve(1,d)}:o.set(r,u);return s?h:function(t){return h(r,u,i?t+i:t,o,1)}},quickTo:function quickTo(t,i,e){function by(t,e,r){return n.resetTo(i,t,e,r)}var r,n=Fe.to(t,ta(((r={})[i]="+=0.1",r.paused=!0,r.stagger=0,r),e||{}));return by.tween=n,by},isTweening:function isTweening(t){return 0<L.getTweensOf(t,!0).length},defaults:function defaults(t){return t&&t.ease&&(t.ease=Vt(t.ease,j.ease)),wa(j,t||{})},config:function config(t){return wa(N,t||{})},registerEffect:function registerEffect(t){var i=t.name,n=t.effect,e=t.plugins,a=t.defaults,r=t.extendTimeline;(e||"").split(",").forEach(function(t){return t&&!mt[t]&&!ht[t]&&T(i+" effect requires "+t+" plugin.")}),gt[i]=function(t,e,r){return n(Pt(t),ta(e||{},a),r)},r&&(Zt.prototype[i]=function(t,e,r){return this.add(gt[i](t,v(e)?e:(r=e)&&{},this),r)})},registerEase:function registerEase(t,e){Bt[t]=Vt(e)},parseEase:function parseEase(t,e){return arguments.length?Vt(t,e):Bt},getById:function getById(t){return L.getById(t)},exportRoot:function exportRoot(t,e){void 0===t&&(t={});var r,i,n=new Zt(t);for(n.smoothChildTiming=w(t.smoothChildTiming),L.remove(n),n._dp=0,n._time=n._tTime=L._time,r=L._first;r;)i=r._next,!e&&!r._dur&&r instanceof te&&r.vars.onComplete===r._targets[0]||Na(n,r,r._start-r._delay),r=i;return Na(L,n,0),n},context:function context(t,e){return t?new De(t,e):l},matchMedia:function matchMedia(t){return new Ee(t)},matchMediaRefresh:function matchMediaRefresh(){return ke.forEach(function(t){var e,r,i=t.conditions;for(r in i)i[r]&&(i[r]=!1,e=1);e&&t.revert()})||Ic()},addEventListener:function addEventListener(t,e){var r=Oe[t]||(Oe[t]=[]);~r.indexOf(e)||r.push(e)},removeEventListener:function removeEventListener(t,e){var r=Oe[t],i=r&&r.indexOf(e);0<=i&&r.splice(i,1)},utils:{wrap:function wrap(e,t,r){var i=t-e;return $(e)?ob(e,wrap(0,e.length),t):Za(r,function(t){return(i+(t-e)%i)%i+e})},wrapYoyo:function wrapYoyo(e,t,r){var i=t-e,n=2*i;return $(e)?ob(e,wrapYoyo(0,e.length-1),t):Za(r,function(t){return e+(i<(t=(n+(t-e)%n)%n||0)?n-t:t)})},distribute:hb,random:kb,snap:jb,normalize:function normalize(t,e,r){return At(t,e,0,1,r)},getUnit:_a,clamp:function clamp(e,r,t){return Za(t,function(t){return Mt(e,r,t)})},splitColor:Db,toArray:Pt,selector:fb,mapRange:At,pipe:function pipe(){for(var t=arguments.length,e=new Array(t),r=0;r<t;r++)e[r]=arguments[r];return function(t){return e.reduce(function(t,e){return e(t)},t)}},unitize:function unitize(e,r){return function(t){return e(parseFloat(t))+(r||_a(t))}},interpolate:function interpolate(e,i,t,n){var a=isNaN(e+i)?0:function(t){return(1-t)*e+t*i};if(!a){var s,o,u,h,l,f=r(e),d={};if(!0===t&&(n=1)&&(t=null),f)e={p:e},i={p:i};else if($(e)&&!$(i)){for(u=[],h=e.length,l=h-2,o=1;o<h;o++)u.push(interpolate(e[o-1],e[o]));h--,a=function func(t){t*=h;var e=Math.min(l,~~t);return u[e](t-e)},t=i}else n||(e=bt($(e)?[]:{},e));if(!u){for(s in i)Jt.call(d,e,s,"get",i[s]);a=function func(t){return ve(t,d)||(f?e.p:e)}}}return Za(t,a)},shuffle:gb},install:R,effects:gt,ticker:It,updateRoot:Zt.updateRoot,plugins:mt,globalTimeline:L,core:{PropTween:we,globals:U,Tween:te,Timeline:Zt,Animation:qt,getCache:ha,_removeLinkedListItem:Ba,reverting:function reverting(){return I},context:function context(t){return t&&l&&(l.data.push(t),t._ctx=l),l},suppressOverwrites:function suppressOverwrites(t){return F=t}}};ja("to,from,fromTo,delayedCall,set,killTweensOf",function(t){return Re[t]=te[t]}),It.add(Zt.updateRoot),d=Re.to({},{duration:0});function Mc(t,e){for(var r=t._pt;r&&r.p!==e&&r.op!==e&&r.fp!==e;)r=r._next;return r}function Oc(t,a){return{name:t,headless:1,rawVars:1,init:function init(t,n,e){e._onInit=function(t){var e,i;if(r(n)&&(e={},ja(n,function(t){return e[t]=1}),n=e),a){for(i in e={},n)e[i]=a(n[i]);n=e}!function _addModifiers(t,e){var r,i,n,a=t._targets;for(r in e)for(i=a.length;i--;)(n=(n=t._ptLookup[i][r])&&n.d)&&(n._pt&&(n=Mc(n,r)),n&&n.modifier&&n.modifier(e[r],t,a[i],r))}(t,n)}}}}var Fe=Re.registerPlugin({name:"attr",init:function init(t,e,r,i,n){var a,s,o;for(a in this.tween=r,e)o=t.getAttribute(a)||"",(s=this.add(t,"setAttribute",(o||0)+"",e[a],i,n,0,0,a)).op=a,s.b=o,this._props.push(a)},render:function render(t,e){for(var r=e._pt;r;)I?r.set(r.t,r.p,r.b,r):r.r(t,r.d),r=r._next}},{name:"endArray",headless:1,init:function init(t,e){for(var r=e.length;r--;)this.add(t,r,t[r]||0,e[r],0,0,0,0,0,1)}},Oc("roundProps",ib),Oc("modifiers"),Oc("snap",jb))||Re;te.version=Zt.version=Fe.version="3.14.2",o=1,x()&&Lt();function yd(t,e){return e.set(e.t,e.p,Math.round(1e4*(e.s+e.c*t))/1e4+e.u,e)}function zd(t,e){return e.set(e.t,e.p,1===t?e.e:Math.round(1e4*(e.s+e.c*t))/1e4+e.u,e)}function Ad(t,e){return e.set(e.t,e.p,t?Math.round(1e4*(e.s+e.c*t))/1e4+e.u:e.b,e)}function Bd(t,e){return e.set(e.t,e.p,1===t?e.e:t?Math.round(1e4*(e.s+e.c*t))/1e4+e.u:e.b,e)}function Cd(t,e){var r=e.s+e.c*t;e.set(e.t,e.p,~~(r+(r<0?-.5:.5))+e.u,e)}function Dd(t,e){return e.set(e.t,e.p,t?e.e:e.b,e)}function Ed(t,e){return e.set(e.t,e.p,1!==t?e.b:e.e,e)}function Fd(t,e,r){return t.style[e]=r}function Gd(t,e,r){return t.style.setProperty(e,r)}function Hd(t,e,r){return t._gsap[e]=r}function Id(t,e,r){return t._gsap.scaleX=t._gsap.scaleY=r}function Jd(t,e,r,i,n){var a=t._gsap;a.scaleX=a.scaleY=r,a.renderTransform(n,a)}function Kd(t,e,r,i,n){var a=t._gsap;a[e]=r,a.renderTransform(n,a)}function Nd(t,e){var r=this,i=this.target,n=i.style,a=i._gsap;if(t in hr&&n){if(this.tfm=this.tfm||{},"transform"===t)return mr.transform.split(",").forEach(function(t){return Nd.call(r,t,e)});if(~(t=mr[t]||t).indexOf(",")?t.split(",").forEach(function(t){return r.tfm[t]=xr(i,t)}):this.tfm[t]=a.x?a[t]:xr(i,t),t===vr&&(this.tfm.zOrigin=a.zOrigin),0<=this.props.indexOf(gr))return;a.svg&&(this.svgo=i.getAttribute("data-svg-origin"),this.props.push(vr,e,"")),t=gr}(n||e)&&this.props.push(t,e,n[t])}function Od(t){t.translate&&(t.removeProperty("translate"),t.removeProperty("scale"),t.removeProperty("rotate"))}function Pd(){var t,e,r=this.props,i=this.target,n=i.style,a=i._gsap;for(t=0;t<r.length;t+=3)r[t+1]?2===r[t+1]?i[r[t]](r[t+2]):i[r[t]]=r[t+2]:r[t+2]?n[r[t]]=r[t+2]:n.removeProperty("--"===r[t].substr(0,2)?r[t]:r[t].replace(cr,"-$1").toLowerCase());if(this.tfm){for(e in this.tfm)a[e]=this.tfm[e];a.svg&&(a.renderTransform(),i.setAttribute("data-svg-origin",this.svgo||"")),(t=Ue())&&t.isStart||n[gr]||(Od(n),a.zOrigin&&n[vr]&&(n[vr]+=" "+a.zOrigin+"px",a.zOrigin=0,a.renderTransform()),a.uncache=1)}}function Qd(t,e){var r={target:t,props:[],revert:Pd,save:Nd};return t._gsap||Fe.core.getCache(t),e&&t.style&&t.nodeType&&e.split(",").forEach(function(t){return r.save(t)}),r}function Sd(t,e){var r=Le.createElementNS?Le.createElementNS((e||"http://www.w3.org/1999/xhtml").replace(/^https/,"http"),t):Le.createElement(t);return r&&r.style?r:Le.createElement(t)}function Td(t,e,r){var i=getComputedStyle(t);return i[e]||i.getPropertyValue(e.replace(cr,"-$1").toLowerCase())||i.getPropertyValue(e)||!r&&Td(t,Tr(e)||e,1)||""}function Wd(){(function _windowExists(){return"undefined"!=typeof window})()&&window.document&&(Ie=window,Le=Ie.document,Ye=Le.documentElement,je=Sd("div")||{style:{}},Sd("div"),gr=Tr(gr),vr=gr+"Origin",je.style.cssText="border-width:0;line-height:0;position:absolute;padding:0",Xe=!!Tr("perspective"),Ue=Fe.core.reverting,Ne=1)}function Xd(t){var e,r=t.ownerSVGElement,i=Sd("svg",r&&r.getAttribute("xmlns")||"http://www.w3.org/2000/svg"),n=t.cloneNode(!0);n.style.display="block",i.appendChild(n),Ye.appendChild(i);try{e=n.getBBox()}catch(t){}return i.removeChild(n),Ye.removeChild(i),e}function Yd(t,e){for(var r=e.length;r--;)if(t.hasAttribute(e[r]))return t.getAttribute(e[r])}function Zd(e){var r,i;try{r=e.getBBox()}catch(t){r=Xd(e),i=1}return r&&(r.width||r.height)||i||(r=Xd(e)),!r||r.width||r.x||r.y?r:{x:+Yd(e,["x","cx","x1"])||0,y:+Yd(e,["y","cy","y1"])||0,width:0,height:0}}function $d(t){return!(!t.getCTM||t.parentNode&&!t.ownerSVGElement||!Zd(t))}function _d(t,e){if(e){var r,i=t.style;e in hr&&e!==vr&&(e=gr),i.removeProperty?("ms"!==(r=e.substr(0,2))&&"webkit"!==e.substr(0,6)||(e="-"+e),i.removeProperty("--"===r?e:e.replace(cr,"-$1").toLowerCase())):i.removeAttribute(e)}}function ae(t,e,r,i,n,a){var s=new we(t._pt,e,r,0,1,a?Ed:Dd);return(t._pt=s).b=i,s.e=n,t._props.push(r),s}function de(t,e,r,i){var n,a,s,o,u=parseFloat(r)||0,h=(r+"").trim().substr((u+"").length)||"px",l=je.style,f=pr.test(e),d="svg"===t.tagName.toLowerCase(),c=(d?"client":"offset")+(f?"Width":"Height"),p="px"===i,_="%"===i;if(i===h||!u||br[i]||br[h])return u;if("px"===h||p||(u=de(t,e,r,"px")),o=t.getCTM&&$d(t),(_||"%"===h)&&(hr[e]||~e.indexOf("adius")))return n=o?t.getBBox()[f?"width":"height"]:t[c],ka(_?u/n*100:u/100*n);if(l[f?"width":"height"]=100+(p?h:i),a="rem"!==i&&~e.indexOf("adius")||"em"===i&&t.appendChild&&!d?t:t.parentNode,o&&(a=(t.ownerSVGElement||{}).parentNode),a&&a!==Le&&a.appendChild||(a=Le.body),(s=a._gsap)&&_&&s.width&&f&&s.time===It.time&&!s.uncache)return ka(u/s.width*100);if(!_||"height"!==e&&"width"!==e)!_&&"%"!==h||wr[Td(a,"display")]||(l.position=Td(t,"position")),a===t&&(l.position="static"),a.appendChild(je),n=je[c],a.removeChild(je),l.position="absolute";else{var m=t.style[e];t.style[e]=100+i,n=t[c],m?t.style[e]=m:_d(t,e)}return f&&_&&((s=ha(a)).time=It.time,s.width=a[c]),ka(p?n*u/100:n&&u?100/n*u:0)}function fe(t,e,r,i){if(!r||"none"===r){var n=Tr(e,t,1),a=n&&Td(t,n,1);a&&a!==r?(e=n,r=a):"borderColor"===e&&(r=Td(t,"borderTopColor"))}var s,o,u,h,l,f,d,c,p,_,m,g=new we(this._pt,t.style,e,0,1,ge),v=0,y=0;if(g.b=r,g.e=i,r+="","var(--"===(i+="").substring(0,6)&&(i=Td(t,i.substring(4,i.indexOf(")")))),"auto"===i&&(f=t.style[e],t.style[e]=i,i=Td(t,e)||i,f?t.style[e]=f:_d(t,e)),Ib(s=[r,i]),i=s[1],u=(r=s[0]).match(nt)||[],(i.match(nt)||[]).length){for(;o=nt.exec(i);)d=o[0],p=i.substring(v,o.index),l?l=(l+1)%5:"rgba("!==p.substr(-5)&&"hsla("!==p.substr(-5)||(l=1),d!==(f=u[y++]||"")&&(h=parseFloat(f)||0,m=f.substr((h+"").length),"="===d.charAt(1)&&(d=ma(h,d)+m),c=parseFloat(d),_=d.substr((c+"").length),v=nt.lastIndex-_.length,_||(_=_||N.units[e]||m,v===i.length&&(i+=_,g.e+=_)),m!==_&&(h=de(t,e,f,_)||0),g._pt={_next:g._pt,p:p||1===y?p:",",s:h,c:c-h,m:l&&l<4||"zIndex"===e?Math.round:0});g.c=v<i.length?i.substring(v,i.length):""}else g.r="display"===e&&"none"===i?Ed:Dd;return st.test(i)&&(g.e=0),this._pt=g}function he(t){var e=t.split(" "),r=e[0],i=e[1]||"50%";return"top"!==r&&"bottom"!==r&&"left"!==i&&"right"!==i||(t=r,r=i,i=t),e[0]=kr[r]||r,e[1]=kr[i]||i,e.join(" ")}function ie(t,e){if(e.tween&&e.tween._time===e.tween._dur){var r,i,n,a=e.t,s=a.style,o=e.u,u=a._gsap;if("all"===o||!0===o)s.cssText="",i=1;else for(n=(o=o.split(",")).length;-1<--n;)r=o[n],hr[r]&&(i=1,r="transformOrigin"===r?vr:gr),_d(a,r);i&&(_d(a,gr),u&&(u.svg&&a.removeAttribute("transform"),s.scale=s.rotate=s.translate="none",Pr(a,1),u.uncache=1,Od(s)))}}function me(t){return"matrix(1, 0, 0, 1, 0, 0)"===t||"none"===t||!t}function ne(t){var e=Td(t,gr);return me(e)?Mr:e.substr(7).match(it).map(ka)}function oe(t,e){var r,i,n,a,s=t._gsap||ha(t),o=t.style,u=ne(t);return s.svg&&t.getAttribute("transform")?"1,0,0,1,0,0"===(u=[(n=t.transform.baseVal.consolidate().matrix).a,n.b,n.c,n.d,n.e,n.f]).join(",")?Mr:u:(u!==Mr||t.offsetParent||t===Ye||s.svg||(n=o.display,o.display="block",(r=t.parentNode)&&(t.offsetParent||t.getBoundingClientRect().width)||(a=1,i=t.nextElementSibling,Ye.appendChild(t)),u=ne(t),n?o.display=n:_d(t,"display"),a&&(i?r.insertBefore(t,i):r?r.appendChild(t):Ye.removeChild(t))),e&&6<u.length?[u[0],u[1],u[4],u[5],u[12],u[13]]:u)}function pe(t,e,r,i,n,a){var s,o,u,h=t._gsap,l=n||oe(t,!0),f=h.xOrigin||0,d=h.yOrigin||0,c=h.xOffset||0,p=h.yOffset||0,_=l[0],m=l[1],g=l[2],v=l[3],y=l[4],T=l[5],b=e.split(" "),w=parseFloat(b[0])||0,x=parseFloat(b[1])||0;r?l!==Mr&&(o=_*v-m*g)&&(u=w*(-m/o)+x*(_/o)-(_*T-m*y)/o,w=w*(v/o)+x*(-g/o)+(g*T-v*y)/o,x=u):(w=(s=Zd(t)).x+(~b[0].indexOf("%")?w/100*s.width:w),x=s.y+(~(b[1]||b[0]).indexOf("%")?x/100*s.height:x)),i||!1!==i&&h.smooth?(y=w-f,T=x-d,h.xOffset=c+(y*_+T*g)-y,h.yOffset=p+(y*m+T*v)-T):h.xOffset=h.yOffset=0,h.xOrigin=w,h.yOrigin=x,h.smooth=!!i,h.origin=e,h.originIsAbsolute=!!r,t.style[vr]="0px 0px",a&&(ae(a,h,"xOrigin",f,w),ae(a,h,"yOrigin",d,x),ae(a,h,"xOffset",c,h.xOffset),ae(a,h,"yOffset",p,h.yOffset)),t.setAttribute("data-svg-origin",w+" "+x)}function se(t,e,r){var i=_a(e);return ka(parseFloat(e)+parseFloat(de(t,"x",r+"px",i)))+i}function ze(t,e,i,n,a){var s,o,u=360,h=r(a),l=parseFloat(a)*(h&&~a.indexOf("rad")?lr:1)-n,f=n+l+"deg";return h&&("short"===(s=a.split("_")[1])&&(l%=u)!==l%180&&(l+=l<0?u:-u),"cw"===s&&l<0?l=(l+36e9)%u-~~(l/u)*u:"ccw"===s&&0<l&&(l=(l-36e9)%u-~~(l/u)*u)),t._pt=o=new we(t._pt,e,i,n,l,zd),o.e=f,o.u="deg",t._props.push(i),o}function Ae(t,e){for(var r in e)t[r]=e[r];return t}function Be(t,e,r){var i,n,a,s,o,u,h,l=Ae({},r._gsap),f=r.style;for(n in l.svg?(a=r.getAttribute("transform"),r.setAttribute("transform",""),f[gr]=e,i=Pr(r,1),_d(r,gr),r.setAttribute("transform",a)):(a=getComputedStyle(r)[gr],f[gr]=e,i=Pr(r,1),f[gr]=a),hr)(a=l[n])!==(s=i[n])&&"perspective,force3D,transformOrigin,svgOrigin".indexOf(n)<0&&(o=_a(a)!==(h=_a(s))?de(r,n,a,h):parseFloat(a),u=parseFloat(s),t._pt=new we(t._pt,i,n,o,u-o,yd),t._pt.u=h||0,t._props.push(n));Ae(i,l)}var Ie,Le,Ye,Ne,je,Ve,Ue,Xe,qe=Bt.Power0,Ze=Bt.Power1,We=Bt.Power2,He=Bt.Power3,Je=Bt.Power4,Qe=Bt.Linear,Ge=Bt.Quad,Ke=Bt.Cubic,$e=Bt.Quart,tr=Bt.Quint,er=Bt.Strong,rr=Bt.Elastic,ir=Bt.Back,nr=Bt.SteppedEase,ar=Bt.Bounce,sr=Bt.Sine,or=Bt.Expo,ur=Bt.Circ,hr={},lr=180/Math.PI,fr=Math.PI/180,dr=Math.atan2,cr=/([A-Z])/g,pr=/(left|right|width|margin|padding|x)/i,_r=/[\\s,\\(]\\S/,mr={autoAlpha:"opacity,visibility",scale:"scaleX,scaleY",alpha:"opacity"},gr="transform",vr=gr+"Origin",yr="O,Moz,ms,Ms,Webkit".split(","),Tr=function _checkPropPrefix(t,e,r){var i=(e||je).style,n=5;if(t in i&&!r)return t;for(t=t.charAt(0).toUpperCase()+t.substr(1);n--&&!(yr[n]+t in i););return n<0?null:(3===n?"ms":0<=n?yr[n]:"")+t},br={deg:1,rad:1,turn:1},wr={grid:1,flex:1},xr=function _get(t,e,r,i){var n;return Ne||Wd(),e in mr&&"transform"!==e&&~(e=mr[e]).indexOf(",")&&(e=e.split(",")[0]),hr[e]&&"transform"!==e?(n=Pr(t,i),n="transformOrigin"!==e?n[e]:n.svg?n.origin:Ar(Td(t,vr))+" "+n.zOrigin+"px"):(n=t.style[e])&&"auto"!==n&&!i&&!~(n+"").indexOf("calc(")||(n=Or[e]&&Or[e](t,e,r)||Td(t,e)||ia(t,e)||("opacity"===e?1:0)),r&&!~(n+"").trim().indexOf(" ")?de(t,e,n,r)+r:n},kr={top:"0%",bottom:"100%",left:"0%",right:"100%",center:"50%"},Or={clearProps:function clearProps(t,e,r,i,n){if("isFromStart"!==n.data){var a=t._pt=new we(t._pt,e,r,0,0,ie);return a.u=i,a.pr=-10,a.tween=n,t._props.push(r),1}}},Mr=[1,0,0,1,0,0],Cr={},Pr=function _parseTransform(t,e){var r=t._gsap||new Xt(t);if("x"in r&&!e&&!r.uncache)return r;var i,n,a,s,o,u,h,l,f,d,c,p,_,m,g,v,y,T,b,w,x,k,O,M,C,P,A,D,S,z,E,R,F=t.style,I=r.scaleX<0,L="deg",B=getComputedStyle(t),Y=Td(t,vr)||"0";return i=n=a=u=h=l=f=d=c=0,s=o=1,r.svg=!(!t.getCTM||!$d(t)),B.translate&&("none"===B.translate&&"none"===B.scale&&"none"===B.rotate||(F[gr]=("none"!==B.translate?"translate3d("+(B.translate+" 0 0").split(" ").slice(0,3).join(", ")+") ":"")+("none"!==B.rotate?"rotate("+B.rotate+") ":"")+("none"!==B.scale?"scale("+B.scale.split(" ").join(",")+") ":"")+("none"!==B[gr]?B[gr]:"")),F.scale=F.rotate=F.translate="none"),m=oe(t,r.svg),r.svg&&(M=r.uncache?(C=t.getBBox(),Y=r.xOrigin-C.x+"px "+(r.yOrigin-C.y)+"px",""):!e&&t.getAttribute("data-svg-origin"),pe(t,M||Y,!!M||r.originIsAbsolute,!1!==r.smooth,m)),p=r.xOrigin||0,_=r.yOrigin||0,m!==Mr&&(T=m[0],b=m[1],w=m[2],x=m[3],i=k=m[4],n=O=m[5],6===m.length?(s=Math.sqrt(T*T+b*b),o=Math.sqrt(x*x+w*w),u=T||b?dr(b,T)*lr:0,(f=w||x?dr(w,x)*lr+u:0)&&(o*=Math.abs(Math.cos(f*fr))),r.svg&&(i-=p-(p*T+_*w),n-=_-(p*b+_*x))):(R=m[6],z=m[7],A=m[8],D=m[9],S=m[10],E=m[11],i=m[12],n=m[13],a=m[14],h=(g=dr(R,S))*lr,g&&(M=k*(v=Math.cos(-g))+A*(y=Math.sin(-g)),C=O*v+D*y,P=R*v+S*y,A=k*-y+A*v,D=O*-y+D*v,S=R*-y+S*v,E=z*-y+E*v,k=M,O=C,R=P),l=(g=dr(-w,S))*lr,g&&(v=Math.cos(-g),E=x*(y=Math.sin(-g))+E*v,T=M=T*v-A*y,b=C=b*v-D*y,w=P=w*v-S*y),u=(g=dr(b,T))*lr,g&&(M=T*(v=Math.cos(g))+b*(y=Math.sin(g)),C=k*v+O*y,b=b*v-T*y,O=O*v-k*y,T=M,k=C),h&&359.9<Math.abs(h)+Math.abs(u)&&(h=u=0,l=180-l),s=ka(Math.sqrt(T*T+b*b+w*w)),o=ka(Math.sqrt(O*O+R*R)),g=dr(k,O),f=2e-4<Math.abs(g)?g*lr:0,c=E?1/(E<0?-E:E):0),r.svg&&(M=t.getAttribute("transform"),r.forceCSS=t.setAttribute("transform","")||!me(Td(t,gr)),M&&t.setAttribute("transform",M))),90<Math.abs(f)&&Math.abs(f)<270&&(I?(s*=-1,f+=u<=0?180:-180,u+=u<=0?180:-180):(o*=-1,f+=f<=0?180:-180)),e=e||r.uncache,r.x=i-((r.xPercent=i&&(!e&&r.xPercent||(Math.round(t.offsetWidth/2)===Math.round(-i)?-50:0)))?t.offsetWidth*r.xPercent/100:0)+"px",r.y=n-((r.yPercent=n&&(!e&&r.yPercent||(Math.round(t.offsetHeight/2)===Math.round(-n)?-50:0)))?t.offsetHeight*r.yPercent/100:0)+"px",r.z=a+"px",r.scaleX=ka(s),r.scaleY=ka(o),r.rotation=ka(u)+L,r.rotationX=ka(h)+L,r.rotationY=ka(l)+L,r.skewX=f+L,r.skewY=d+L,r.transformPerspective=c+"px",(r.zOrigin=parseFloat(Y.split(" ")[2])||!e&&r.zOrigin||0)&&(F[vr]=Ar(Y)),r.xOffset=r.yOffset=0,r.force3D=N.force3D,r.renderTransform=r.svg?Fr:Xe?Rr:Dr,r.uncache=0,r},Ar=function _firstTwoOnly(t){return(t=t.split(" "))[0]+" "+t[1]},Dr=function _renderNon3DTransforms(t,e){e.z="0px",e.rotationY=e.rotationX="0deg",e.force3D=0,Rr(t,e)},Sr="0deg",zr="0px",Er=") ",Rr=function _renderCSSTransforms(t,e){var r=e||this,i=r.xPercent,n=r.yPercent,a=r.x,s=r.y,o=r.z,u=r.rotation,h=r.rotationY,l=r.rotationX,f=r.skewX,d=r.skewY,c=r.scaleX,p=r.scaleY,_=r.transformPerspective,m=r.force3D,g=r.target,v=r.zOrigin,y="",T="auto"===m&&t&&1!==t||!0===m;if(v&&(l!==Sr||h!==Sr)){var b,w=parseFloat(h)*fr,x=Math.sin(w),k=Math.cos(w);w=parseFloat(l)*fr,b=Math.cos(w),a=se(g,a,x*b*-v),s=se(g,s,-Math.sin(w)*-v),o=se(g,o,k*b*-v+v)}_!==zr&&(y+="perspective("+_+Er),(i||n)&&(y+="translate("+i+"%, "+n+"%) "),!T&&a===zr&&s===zr&&o===zr||(y+=o!==zr||T?"translate3d("+a+", "+s+", "+o+") ":"translate("+a+", "+s+Er),u!==Sr&&(y+="rotate("+u+Er),h!==Sr&&(y+="rotateY("+h+Er),l!==Sr&&(y+="rotateX("+l+Er),f===Sr&&d===Sr||(y+="skew("+f+", "+d+Er),1===c&&1===p||(y+="scale("+c+", "+p+Er),g.style[gr]=y||"translate(0, 0)"},Fr=function _renderSVGTransforms(t,e){var r,i,n,a,s,o=e||this,u=o.xPercent,h=o.yPercent,l=o.x,f=o.y,d=o.rotation,c=o.skewX,p=o.skewY,_=o.scaleX,m=o.scaleY,g=o.target,v=o.xOrigin,y=o.yOrigin,T=o.xOffset,b=o.yOffset,w=o.forceCSS,x=parseFloat(l),k=parseFloat(f);d=parseFloat(d),c=parseFloat(c),(p=parseFloat(p))&&(c+=p=parseFloat(p),d+=p),d||c?(d*=fr,c*=fr,r=Math.cos(d)*_,i=Math.sin(d)*_,n=Math.sin(d-c)*-m,a=Math.cos(d-c)*m,c&&(p*=fr,s=Math.tan(c-p),n*=s=Math.sqrt(1+s*s),a*=s,p&&(s=Math.tan(p),r*=s=Math.sqrt(1+s*s),i*=s)),r=ka(r),i=ka(i),n=ka(n),a=ka(a)):(r=_,a=m,i=n=0),(x&&!~(l+"").indexOf("px")||k&&!~(f+"").indexOf("px"))&&(x=de(g,"x",l,"px"),k=de(g,"y",f,"px")),(v||y||T||b)&&(x=ka(x+v-(v*r+y*n)+T),k=ka(k+y-(v*i+y*a)+b)),(u||h)&&(s=g.getBBox(),x=ka(x+u/100*s.width),k=ka(k+h/100*s.height)),s="matrix("+r+","+i+","+n+","+a+","+x+","+k+")",g.setAttribute("transform",s),w&&(g.style[gr]=s)};ja("padding,margin,Width,Radius",function(e,r){var t="Right",i="Bottom",n="Left",o=(r<3?["Top",t,i,n]:["Top"+n,"Top"+t,i+t,i+n]).map(function(t){return r<2?e+t:"border"+t+e});Or[1<r?"border"+e:e]=function(e,t,r,i,n){var a,s;if(arguments.length<4)return a=o.map(function(t){return xr(e,t,r)}),5===(s=a.join(" ")).split(a[0]).length?a[0]:s;a=(i+"").split(" "),s={},o.forEach(function(t,e){return s[t]=a[e]=a[e]||a[(e-1)/2|0]}),e.init(t,s,n)}});var Ir,Lr,Br,Yr={name:"css",register:Wd,targetTest:function targetTest(t){return t.style&&t.nodeType},init:function init(t,e,i,n,a){var s,o,u,h,l,f,d,c,p,_,m,g,v,y,T,b,w,x=this._props,k=t.style,O=i.vars.startAt;for(d in Ne||Wd(),this.styles=this.styles||Qd(t),b=this.styles.props,this.tween=i,e)if("autoRound"!==d&&(o=e[d],!mt[d]||!dc(d,e,i,n,t,a)))if(l=typeof o,f=Or[d],"function"===l&&(l=typeof(o=o.call(i,n,t,a))),"string"===l&&~o.indexOf("random(")&&(o=rb(o)),f)f(this,t,d,o,i)&&(T=1);else if("--"===d.substr(0,2))s=(getComputedStyle(t).getPropertyValue(d)+"").trim(),o+="",Rt.lastIndex=0,Rt.test(s)||(c=_a(s),(p=_a(o))?c!==p&&(s=de(t,d,s,p)+p):c&&(o+=c)),this.add(k,"setProperty",s,o,n,a,0,0,d),x.push(d),b.push(d,0,k[d]);else if("undefined"!==l){if(O&&d in O?(s="function"==typeof O[d]?O[d].call(i,n,t,a):O[d],r(s)&&~s.indexOf("random(")&&(s=rb(s)),_a(s+"")||"auto"===s||(s+=N.units[d]||_a(xr(t,d))||""),"="===(s+"").charAt(1)&&(s=xr(t,d))):s=xr(t,d),h=parseFloat(s),(_="string"===l&&"="===o.charAt(1)&&o.substr(0,2))&&(o=o.substr(2)),u=parseFloat(o),d in mr&&("autoAlpha"===d&&(1===h&&"hidden"===xr(t,"visibility")&&u&&(h=0),b.push("visibility",0,k.visibility),ae(this,k,"visibility",h?"inherit":"hidden",u?"inherit":"hidden",!u)),"scale"!==d&&"transform"!==d&&~(d=mr[d]).indexOf(",")&&(d=d.split(",")[0])),m=d in hr){if(this.styles.save(d),w=o,"string"===l&&"var(--"===o.substring(0,6)){if("calc("===(o=Td(t,o.substring(4,o.indexOf(")")))).substring(0,5)){var M=t.style.perspective;t.style.perspective=o,o=Td(t,"perspective"),M?t.style.perspective=M:_d(t,"perspective")}u=parseFloat(o)}if(g||((v=t._gsap).renderTransform&&!e.parseTransform||Pr(t,e.parseTransform),y=!1!==e.smoothOrigin&&v.smooth,(g=this._pt=new we(this._pt,k,gr,0,1,v.renderTransform,v,0,-1)).dep=1),"scale"===d)this._pt=new we(this._pt,v,"scaleY",v.scaleY,(_?ma(v.scaleY,_+u):u)-v.scaleY||0,yd),this._pt.u=0,x.push("scaleY",d),d+="X";else{if("transformOrigin"===d){b.push(vr,0,k[vr]),o=he(o),v.svg?pe(t,o,0,y,0,this):((p=parseFloat(o.split(" ")[2])||0)!==v.zOrigin&&ae(this,v,"zOrigin",v.zOrigin,p),ae(this,k,d,Ar(s),Ar(o)));continue}if("svgOrigin"===d){pe(t,o,1,y,0,this);continue}if(d in Cr){ze(this,v,d,h,_?ma(h,_+o):o);continue}if("smoothOrigin"===d){ae(this,v,"smooth",v.smooth,o);continue}if("force3D"===d){v[d]=o;continue}if("transform"===d){Be(this,o,t);continue}}}else d in k||(d=Tr(d)||d);if(m||(u||0===u)&&(h||0===h)&&!_r.test(o)&&d in k)u=u||0,(c=(s+"").substr((h+"").length))!==(p=_a(o)||(d in N.units?N.units[d]:c))&&(h=de(t,d,s,p)),this._pt=new we(this._pt,m?v:k,d,h,(_?ma(h,_+u):u)-h,m||"px"!==p&&"zIndex"!==d||!1===e.autoRound?yd:Cd),this._pt.u=p||0,m&&w!==o?(this._pt.b=s,this._pt.e=w,this._pt.r=Bd):c!==p&&"%"!==p&&(this._pt.b=s,this._pt.r=Ad);else if(d in k)fe.call(this,t,d,s,_?_+o:o);else if(d in t)this.add(t,d,s||t[d],_?_+o:o,n,a);else if("parseTransform"!==d){S(d,o);continue}m||(d in k?b.push(d,0,k[d]):"function"==typeof t[d]?b.push(d,2,t[d]()):b.push(d,1,s||t[d])),x.push(d)}T&&be(this)},render:function render(t,e){if(e.tween._time||!Ue())for(var r=e._pt;r;)r.r(t,r.d),r=r._next;else e.styles.revert()},get:xr,aliases:mr,getSetter:function getSetter(t,e,r){var i=mr[e];return i&&i.indexOf(",")<0&&(e=i),e in hr&&e!==vr&&(t._gsap.x||xr(t,"x"))?r&&Ve===r?"scale"===e?Id:Hd:(Ve=r||{})&&("scale"===e?Jd:Kd):t.style&&!u(t.style[e])?Fd:~e.indexOf("-")?Gd:le(t,e)},core:{_removeProperty:_d,_getMatrix:oe}};Fe.utils.checkPrefix=Tr,Fe.core.getStyleSaver=Qd,Br=ja((Ir="x,y,z,scale,scaleX,scaleY,xPercent,yPercent")+","+(Lr="rotation,rotationX,rotationY,skewX,skewY")+",transform,transformOrigin,svgOrigin,force3D,smoothOrigin,transformPerspective",function(t){hr[t]=1}),ja(Lr,function(t){N.units[t]="deg",Cr[t]=1}),mr[Br[13]]=Ir+","+Lr,ja("0:translateX,1:translateY,2:translateZ,8:rotate,8:rotationZ,8:rotateZ,9:rotateX,10:rotateY",function(t){var e=t.split(":");mr[e[1]]=Br[e[0]]}),ja("x,y,z,top,right,bottom,left,width,height,fontSize,padding,margin,perspective",function(t){N.units[t]="px"}),Fe.registerPlugin(Yr);var Nr=Fe.registerPlugin(Yr)||Fe,jr=Nr.core.Tween;e.Back=ir,e.Bounce=ar,e.CSSPlugin=Yr,e.Circ=ur,e.Cubic=Ke,e.Elastic=rr,e.Expo=or,e.Linear=Qe,e.Power0=qe,e.Power1=Ze,e.Power2=We,e.Power3=He,e.Power4=Je,e.Quad=Ge,e.Quart=$e,e.Quint=tr,e.Sine=sr,e.SteppedEase=nr,e.Strong=er,e.TimelineLite=Zt,e.TimelineMax=Zt,e.TweenLite=te,e.TweenMax=jr,e.default=Nr,e.gsap=Nr;if (typeof(window)==="undefined"||window!==e){Object.defineProperty(e,"__esModule",{value:!0})} else {delete e.default}});\r
\r
`;
const mcSrc = `/*\r
 * MightyCut shared composition library (window.MC).\r
 *\r
 * Deterministic helpers for HyperFrames compositions: every animation is a\r
 * tween on the caller's paused GSAP timeline (seek-driven), never wall-clock\r
 * or rAF based. No Math.random / Date.now — randomness goes through\r
 * MC.seededRandom.\r
 *\r
 * Conventions:\r
 *  - Helpers that animate take (tl, target, atSec, opts). \`target\` should be\r
 *    an Element / NodeList the CALLER resolved via its own (scoped) document —\r
 *    inside sub-composition scripts, selector strings resolve against the\r
 *    global document and can leak across instances.\r
 *  - All times are SECONDS on the composition's timeline.\r
 *  - WebGL contexts must be created via MC.glContext (forces antialias: true).\r
 */\r
(function () {\r
  "use strict";\r
\r
  var MC = {};\r
\r
  /* ------------------------------------------------------------ random --- */\r
\r
  /** Deterministic PRNG (mulberry32) seeded by a string. Returns () => [0,1). */\r
  MC.seededRandom = function (seed) {\r
    var h = 1779033703 ^ String(seed).length;\r
    var s = String(seed);\r
    for (var i = 0; i < s.length; i++) {\r
      h = Math.imul(h ^ s.charCodeAt(i), 3432918353);\r
      h = (h << 13) | (h >>> 19);\r
    }\r
    var a = h >>> 0;\r
    return function () {\r
      a |= 0;\r
      a = (a + 0x6d2b79f5) | 0;\r
      var t = Math.imul(a ^ (a >>> 15), 1 | a);\r
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;\r
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;\r
    };\r
  };\r
\r
  /* ------------------------------------------------------------- webgl --- */\r
\r
  /**\r
   * The ONLY sanctioned way to create a WebGL context: antialiasing is forced\r
   * on, and preserveDrawingBuffer is enabled so seeked frames capture cleanly.\r
   */\r
  MC.glContext = function (canvas, opts) {\r
    var options = Object.assign({}, opts || {}, {\r
      antialias: true,\r
      preserveDrawingBuffer: true,\r
    });\r
    return (\r
      canvas.getContext("webgl2", options) || canvas.getContext("webgl", options)\r
    );\r
  };\r
\r
  /* -------------------------------------------------------------- icons --- */\r
\r
  // 21-icon set (stroke style: round caps/joins, 24x24 viewBox, strokeWidth 1.8).\r
  var ICON_PATHS = {\r
    doc: '<path d="M6 3h7l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M13 3v5h5"/><path d="M8.5 13h7M8.5 16.5h7"/>',\r
    image:\r
      '<rect x="4" y="5" width="16" height="14" rx="1.5"/><circle cx="9" cy="10" r="1.6"/><path d="M5 17l4.5-4.5L13 16l3-3 3 3.5"/>',\r
    email:\r
      '<rect x="3.5" y="6" width="17" height="12" rx="1.5"/><path d="M4 7l8 6 8-6"/>',\r
    word: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M5.5 9.5l1.3 5L8.2 11l1.4 3.5L11 9.5"/><path d="M13.5 10h4.5M13.5 12.5h4.5M13.5 15h4.5"/>',\r
    database:\r
      '<ellipse cx="12" cy="5.5" rx="7" ry="2.8"/><path d="M5 5.5v6c0 1.6 3.1 2.8 7 2.8s7-1.2 7-2.8v-6"/><path d="M5 11.5v6c0 1.6 3.1 2.8 7 2.8s7-1.2 7-2.8v-6"/>',\r
    graph:\r
      '<circle cx="6" cy="7" r="2.4"/><circle cx="18" cy="6" r="2.4"/><circle cx="17" cy="17.5" r="2.4"/><circle cx="7" cy="17" r="2.4"/><path d="M8 7.5l8-1M7.5 9l8.5 7M8.8 16.4l6-1M7.2 15l0-6"/>',\r
    shield:\r
      '<path d="M12 3l7 2.5v5c0 5-3.2 8.4-7 10-3.8-1.6-7-5-7-10v-5L12 3Z"/><path d="M9 12l2.2 2.2L15.5 10"/>',\r
    cloud:\r
      '<path d="M7.5 18a4 4 0 0 1-.4-7.98A5 5 0 0 1 17 9.5a3.5 3.5 0 0 1 .2 8.5H7.5Z"/>',\r
    cube: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/>',\r
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',\r
    sparkles:\r
      '<path d="M12 4l1.6 4.2L18 10l-4.4 1.8L12 16l-1.6-4.2L6 10l4.4-1.8L12 4Z"/><path d="M18.5 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2Z"/>',\r
    chip: '<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M10 7V4M14 7V4M10 20v-3M14 20v-3M7 10H4M7 14H4M20 10h-3M20 14h-3"/>',\r
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',\r
    cross: '<path d="M6 6l12 12M18 6L6 18"/>',\r
    lock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',\r
    layers:\r
      '<path d="M12 3l9 5-9 5-9-5 9-5Z"/><path d="M3 13l9 5 9-5M3 17l9 5 9-5"/>',\r
    sync: '<path d="M4 11a8 8 0 0 1 13.5-5.3L20 8"/><path d="M20 4v4h-4"/><path d="M20 13a8 8 0 0 1-13.5 5.3L4 16"/><path d="M4 20v-4h4"/>',\r
    arrowRight: '<path d="M4 12h15M13 6l6 6-6 6"/>',\r
    users:\r
      '<circle cx="9" cy="8" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M16 6.2a3 3 0 0 1 0 5.6M16.5 19a5.5 5.5 0 0 0-2.2-4.4"/>',\r
    gauge: '<path d="M4 18a8 8 0 1 1 16 0"/><path d="M12 18l4-5"/>',\r
    filter: '<path d="M4 5h16l-6 7v6l-4 2v-8L4 5Z"/>',\r
  };\r
\r
  MC.iconNames = Object.keys(ICON_PATHS);\r
\r
  /** Narrow an untrusted icon name (LLM spec) to a known one, or null. */\r
  MC.asIconName = function (name) {\r
    return name && Object.prototype.hasOwnProperty.call(ICON_PATHS, name)\r
      ? name\r
      : null;\r
  };\r
\r
  /** Inline SVG markup for a named icon. opts: {size, color, strokeWidth}. */\r
  MC.icon = function (name, opts) {\r
    var o = opts || {};\r
    var size = o.size || 24;\r
    var color = o.color || "currentColor";\r
    var sw = o.strokeWidth || 1.8;\r
    var body = ICON_PATHS[name] || ICON_PATHS.sparkles;\r
    return (\r
      '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' +\r
      color + '" stroke-width="' + sw +\r
      '" stroke-linecap="round" stroke-linejoin="round">' + body + "</svg>"\r
    );\r
  };\r
\r
  /* ------------------------------------------------------ tween helpers --- */\r
\r
  // Entrance: fade + rise from below (the old riseIn spring).\r
  MC.riseIn = function (tl, target, at, opts) {\r
    var o = opts || {};\r
    tl.from(\r
      target,\r
      {\r
        y: o.dist != null ? o.dist : 26,\r
        opacity: 0,\r
        duration: o.dur != null ? o.dur : 0.65,\r
        ease: o.ease || "power3.out",\r
      },\r
      at || 0,\r
    );\r
    return tl;\r
  };\r
\r
  // Plain fade in.\r
  MC.fadeIn = function (tl, target, at, opts) {\r
    var o = opts || {};\r
    tl.from(\r
      target,\r
      { opacity: 0, duration: o.dur != null ? o.dur : 0.55, ease: o.ease || "power2.out" },\r
      at || 0,\r
    );\r
    return tl;\r
  };\r
\r
  // Staggered rise for a list of elements.\r
  MC.staggerIn = function (tl, targets, at, opts) {\r
    var o = opts || {};\r
    tl.from(\r
      targets,\r
      {\r
        y: o.dist != null ? o.dist : 26,\r
        opacity: 0,\r
        duration: o.dur != null ? o.dur : 0.6,\r
        ease: o.ease || "power3.out",\r
        stagger: { each: o.each != null ? o.each : 0.25, from: "start" },\r
      },\r
      at || 0,\r
    );\r
    return tl;\r
  };\r
\r
  // Grow a horizontal rule / bar from 0 (expects transform-origin left).\r
  MC.rule = function (tl, target, at, opts) {\r
    var o = opts || {};\r
    tl.fromTo(\r
      target,\r
      { scaleX: 0 },\r
      { scaleX: 1, duration: o.dur != null ? o.dur : 0.8, ease: o.ease || "power3.out" },\r
      at || 0,\r
    );\r
    return tl;\r
  };\r
\r
  // Gentle breathing drift during a hold. Finite yoyo repeats (no repeat:-1).\r
  MC.float = function (tl, target, at, opts) {\r
    var o = opts || {};\r
    var dur = o.dur != null ? o.dur : 2.4;\r
    var hold = o.hold != null ? o.hold : 6;\r
    var cycles = Math.max(1, Math.ceil(hold / dur));\r
    tl.to(\r
      target,\r
      {\r
        y: o.dy != null ? o.dy : -8,\r
        duration: dur,\r
        ease: "sine.inOut",\r
        yoyo: true,\r
        repeat: cycles * 2 - 1,\r
      },\r
      at || 0,\r
    );\r
    return tl;\r
  };\r
\r
  // Count a number up in an element's textContent (seek-safe proxy tween).\r
  MC.countUp = function (tl, el, at, opts) {\r
    var o = opts || {};\r
    var to = o.to || 0;\r
    var decimals = o.decimals || 0;\r
    var prefix = o.prefix || "";\r
    var suffix = o.suffix || "";\r
    var proxy = { v: 0 };\r
    tl.to(\r
      proxy,\r
      {\r
        v: to,\r
        duration: o.dur != null ? o.dur : 1.6,\r
        ease: o.ease || "power2.out",\r
        onUpdate: function () {\r
          el.textContent = prefix + proxy.v.toFixed(decimals) + suffix;\r
        },\r
      },\r
      at || 0,\r
    );\r
    return tl;\r
  };\r
\r
  // Scale + fade entrance (the inline scaleIn used by applyAnims, exposed as a\r
  // callable so the whole-page transition can use it too).\r
  MC.scaleIn = function (tl, target, at, opts) {\r
    var o = opts || {};\r
    tl.from(\r
      target,\r
      {\r
        scale: o.from != null ? o.from : 0.9,\r
        opacity: 0,\r
        duration: o.dur != null ? o.dur : 0.6,\r
        ease: o.ease || "back.out(1.5)",\r
      },\r
      at || 0,\r
    );\r
    return tl;\r
  };\r
\r
  // Slide entrance from an x/y offset (page transitions: slide-left/right/up/down).\r
  MC.slideIn = function (tl, target, at, opts) {\r
    var o = opts || {};\r
    tl.from(\r
      target,\r
      { x: o.x || 0, y: o.y || 0, opacity: 0, duration: o.dur != null ? o.dur : 0.6, ease: o.ease || "power3.out" },\r
      at || 0,\r
    );\r
    return tl;\r
  };\r
\r
  // Drop-in-from-above entrance (fall).\r
  MC.fallIn = function (tl, target, at, opts) {\r
    var o = opts || {};\r
    tl.from(\r
      target,\r
      { y: o.dist != null ? -o.dist : -40, opacity: 0, duration: o.dur != null ? o.dur : 0.6, ease: o.ease || "power3.out" },\r
      at || 0,\r
    );\r
    return tl;\r
  };\r
\r
  // Clip-path wipe entrance (reveal left → right).\r
  MC.wipeIn = function (tl, target, at, opts) {\r
    var o = opts || {};\r
    tl.fromTo(\r
      target,\r
      { clipPath: "inset(0 100% 0 0)" },\r
      { clipPath: "inset(0 0% 0 0)", duration: o.dur != null ? o.dur : 0.6, ease: o.ease || "power2.inOut" },\r
      at || 0,\r
    );\r
    return tl;\r
  };\r
\r
  /* ------------------------------------------------------- exit tweens (out) --- */\r
  // Exits animate an element OUT to a hidden state via tl.to (seek-safe, like float).\r
  // Used by the treatment whole-page transition (sceneExitJs), never by applyAnims.\r
\r
  MC.fadeOut = function (tl, target, at, opts) {\r
    var o = opts || {};\r
    tl.to(target, { opacity: 0, duration: o.dur != null ? o.dur : 0.55, ease: o.ease || "power2.in" }, at || 0);\r
    return tl;\r
  };\r
\r
  MC.riseOut = function (tl, target, at, opts) {\r
    var o = opts || {};\r
    tl.to(\r
      target,\r
      { y: o.dist != null ? -o.dist : -26, opacity: 0, duration: o.dur != null ? o.dur : 0.6, ease: o.ease || "power3.in" },\r
      at || 0,\r
    );\r
    return tl;\r
  };\r
\r
  MC.fallOut = function (tl, target, at, opts) {\r
    var o = opts || {};\r
    tl.to(\r
      target,\r
      { y: o.dist != null ? o.dist : 26, opacity: 0, duration: o.dur != null ? o.dur : 0.6, ease: o.ease || "power3.in" },\r
      at || 0,\r
    );\r
    return tl;\r
  };\r
\r
  MC.scaleOut = function (tl, target, at, opts) {\r
    var o = opts || {};\r
    tl.to(\r
      target,\r
      { scale: o.to != null ? o.to : 0.9, opacity: 0, duration: o.dur != null ? o.dur : 0.6, ease: o.ease || "power2.in" },\r
      at || 0,\r
    );\r
    return tl;\r
  };\r
\r
  MC.slideOut = function (tl, target, at, opts) {\r
    var o = opts || {};\r
    tl.to(\r
      target,\r
      { x: o.x || 0, y: o.y || 0, opacity: 0, duration: o.dur != null ? o.dur : 0.6, ease: o.ease || "power3.in" },\r
      at || 0,\r
    );\r
    return tl;\r
  };\r
\r
  MC.wipeOut = function (tl, target, at, opts) {\r
    var o = opts || {};\r
    tl.to(target, { clipPath: "inset(0 0 0 100%)", duration: o.dur != null ? o.dur : 0.6, ease: o.ease || "power2.inOut" }, at || 0);\r
    return tl;\r
  };\r
\r
  /* ---------------------------------------------------- anim interpreter --- */\r
\r
  /**\r
   * Interpret a list of JSON animation descriptors onto a paused timeline. This\r
   * is the ONE motion interpreter shared by the render pipeline (the slide's\r
   * inline <script> calls it) and the interactive showcase (hover replay). Each\r
   * descriptor is { kind, target, time, opts }; \`target\` is a fully-qualified\r
   * scoped class (no leading dot). \`ctx\` supplies the narration-timing helpers\r
   * and the scoped query fns:\r
   *   { q, qa, at, atIndex, lineId, leadIn, page }\r
   * Content reveals key to VO lines (time.at === "line"/"index"); "seconds" is\r
   * for the fixed entrance only. Missing targets are skipped (optional slots).\r
   */\r
  MC.applyAnims = function (tl, anims, ctx) {\r
    if (!anims || !anims.length) return tl;\r
    var timeOf = function (t) {\r
      if (!t) return ctx.leadIn;\r
      var plus = t.plus || 0;\r
      if (t.at === "line") {\r
        var n = t.n || 0;\r
        return ctx.at(ctx.lineId(n), ctx.leadIn + 0.1 + n * 0.16 + plus);\r
      }\r
      if (t.at === "index") return ctx.atIndex(t.n) + plus;\r
      if (t.at === "leadIn") return ctx.leadIn + plus;\r
      if (t.at === "seconds") return t.t || 0;\r
      return ctx.leadIn;\r
    };\r
    for (var i = 0; i < anims.length; i++) {\r
      var a = anims[i];\r
      var sel = "." + a.target;\r
      var el = ctx.q(sel);\r
      if (!el) continue; // optional/removed slot — gsap.from(null) would throw\r
      var when = timeOf(a.time);\r
      var o = a.opts || {};\r
      if (a.kind === "riseIn") MC.riseIn(tl, el, when, o);\r
      else if (a.kind === "fadeIn") MC.fadeIn(tl, el, when, o);\r
      else if (a.kind === "staggerIn") MC.staggerIn(tl, ctx.qa(sel + " > *"), when, o);\r
      else if (a.kind === "rule") MC.rule(tl, el, when, o);\r
      else if (a.kind === "float") MC.float(tl, el, when, o);\r
      else if (a.kind === "countUp") MC.countUp(tl, el, when, o);\r
      else if (a.kind === "growBar") {\r
        var gb = {};\r
        gb[o.prop || "scaleY"] = 0;\r
        gb.duration = o.dur != null ? o.dur : 0.7;\r
        gb.ease = o.ease || "power3.out";\r
        tl.from(el, gb, when);\r
      } else if (a.kind === "scaleIn") {\r
        tl.from(\r
          el,\r
          {\r
            scale: o.from != null ? o.from : 0.9,\r
            opacity: 0,\r
            duration: o.dur != null ? o.dur : 0.6,\r
            ease: o.ease || "back.out(1.5)",\r
          },\r
          when,\r
        );\r
      } else if (a.kind === "from") {\r
        tl.from(el, o, when);\r
      }\r
    }\r
    return tl;\r
  };\r
\r
  /**\r
   * Build a ctx for the showcase: queries scoped to a card root, and a synthetic\r
   * narration schedule (no VO lines) so hover replay looks like the render. Since\r
   * lineId() returns "" and at() returns its fallback, "line" reveals fall back to\r
   * their staggered offsets — the same shape the render uses when a scene has few\r
   * VO lines.\r
   */\r
  MC.showcaseCtx = function (root) {\r
    return {\r
      q: function (s) {\r
        return root.querySelector(s);\r
      },\r
      qa: function (s) {\r
        return Array.prototype.slice.call(root.querySelectorAll(s));\r
      },\r
      at: function (_id, fb) {\r
        return fb || 0;\r
      },\r
      atIndex: function (n) {\r
        return 0.4 + 0.2 * Math.max(0, n);\r
      },\r
      lineId: function () {\r
        return "";\r
      },\r
      leadIn: 0.1,\r
      page: root,\r
    };\r
  };\r
\r
  /* -------------------------------------------------------- particle bg --- */\r
\r
  /**\r
   * Deterministic graph-network backdrop on a 2D canvas (port of the old\r
   * CanvasParticleBg). Node motion is a pure function of timeline time via a\r
   * proxy tween — seeking any frame repaints identically.\r
   *\r
   *   MC.particleBg(canvasEl, { seed, colorRgb: "52,225,255" }).addTo(tl, 0, totalSec)\r
   */\r
  MC.particleBg = function (canvas, opts) {\r
    var o = opts || {};\r
    var nodeCount = o.nodeCount || 52;\r
    var linkDistance = o.linkDistance || 230;\r
    var opacity = o.opacity != null ? o.opacity : 0.55;\r
    var rgb = o.colorRgb || "52,225,255";\r
    var width = canvas.width || 1920;\r
    var height = canvas.height || 1080;\r
    canvas.width = width;\r
    canvas.height = height;\r
\r
    var rand = MC.seededRandom(o.seed || "mightycut");\r
    var nodes = [];\r
    for (var i = 0; i < nodeCount; i++) {\r
      nodes.push({\r
        bx: rand() * width,\r
        by: rand() * height,\r
        amp: 16 + rand() * 46,\r
        phase: rand() * Math.PI * 2,\r
        speed: 0.2 + rand() * 0.5,\r
        r: 1.4 + rand() * 2.2,\r
        hub: rand() > 0.82,\r
      });\r
    }\r
\r
    var ctx = canvas.getContext("2d");\r
\r
    var paint = function (t) {\r
      if (!ctx) return;\r
      ctx.clearRect(0, 0, width, height);\r
      var pts = nodes.map(function (n) {\r
        return {\r
          x: n.bx + Math.cos(t * n.speed + n.phase) * n.amp,\r
          y: n.by + Math.sin(t * n.speed * 0.8 + n.phase) * n.amp,\r
          r: n.r,\r
          hub: n.hub,\r
        };\r
      });\r
      for (var i = 0; i < pts.length; i++) {\r
        for (var j = i + 1; j < pts.length; j++) {\r
          var dx = pts[i].x - pts[j].x;\r
          var dy = pts[i].y - pts[j].y;\r
          var d = Math.hypot(dx, dy);\r
          if (d < linkDistance) {\r
            ctx.strokeStyle = "rgba(" + rgb + "," + (1 - d / linkDistance) * 0.16 * opacity + ")";\r
            ctx.lineWidth = 1;\r
            ctx.beginPath();\r
            ctx.moveTo(pts[i].x, pts[i].y);\r
            ctx.lineTo(pts[j].x, pts[j].y);\r
            ctx.stroke();\r
          }\r
        }\r
      }\r
      for (var k = 0; k < pts.length; k++) {\r
        var p = pts[k];\r
        var r = p.hub ? p.r * 2.1 : p.r;\r
        if (p.hub) {\r
          var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 6);\r
          g.addColorStop(0, "rgba(" + rgb + "," + 0.5 * opacity + ")");\r
          g.addColorStop(1, "rgba(" + rgb + ",0)");\r
          ctx.fillStyle = g;\r
          ctx.beginPath();\r
          ctx.arc(p.x, p.y, r * 6, 0, Math.PI * 2);\r
          ctx.fill();\r
        }\r
        ctx.fillStyle = "rgba(" + rgb + "," + (p.hub ? 0.9 : 0.5) * opacity + ")";\r
        ctx.beginPath();\r
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);\r
        ctx.fill();\r
      }\r
    };\r
\r
    paint(0);\r
\r
    return {\r
      /** Drive the particle clock from atSec for durationSec on the timeline. */\r
      addTo: function (tl, at, durationSec) {\r
        var proxy = { t: 0 };\r
        tl.to(\r
          proxy,\r
          {\r
            t: durationSec,\r
            duration: durationSec,\r
            ease: "none",\r
            onUpdate: function () {\r
              paint(proxy.t);\r
            },\r
          },\r
          at || 0,\r
        );\r
        return tl;\r
      },\r
    };\r
  };\r
\r
  /* ------------------------------------------------------ progress ring --- */\r
\r
  /**\r
   * Animated percent ring with count-up center (port of ProgressRing).\r
   * Builds SVG inside \`container\`; animate via the returned addTo(tl, atSec).\r
   *\r
   *   MC.progressRing(el, { value: 96, label: "Detection", color: "var(--accent)" }).addTo(tl, at)\r
   */\r
  MC.progressRing = function (container, opts) {\r
    var o = opts || {};\r
    var value = o.value || 0;\r
    var size = o.size || 260;\r
    var thickness = o.thickness || 14;\r
    var suffix = o.suffix != null ? o.suffix : "%";\r
    var decimals = o.decimals || 0;\r
    var color = o.color || "var(--accent)";\r
    var cx = size / 2;\r
    var r = (size - thickness) / 2;\r
    var circumference = 2 * Math.PI * r;\r
\r
    container.innerHTML =\r
      '<div style="display:inline-flex;flex-direction:column;align-items:center;gap:14px;">' +\r
      '<div style="position:relative;width:' + size + "px;height:" + size + 'px;">' +\r
      '<svg width="' + size + '" height="' + size + '" style="display:block">' +\r
      '<circle cx="' + cx + '" cy="' + cx + '" r="' + r +\r
      '" fill="none" stroke="var(--steel)" stroke-width="' + thickness + '" opacity="0.45"/>' +\r
      '<circle class="mc-ring-arc" cx="' + cx + '" cy="' + cx + '" r="' + r +\r
      '" fill="none" stroke="' + color + '" stroke-width="' + thickness +\r
      '" stroke-linecap="round" stroke-dasharray="' + circumference +\r
      '" stroke-dashoffset="' + circumference + '" transform="rotate(-90 ' + cx + " " + cx + ')"/>' +\r
      "</svg>" +\r
      '<div class="mc-ring-value" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;' +\r
      "font-family:var(--font-heading);font-size:" + size * 0.21 + "px;font-weight:700;letter-spacing:-1px;color:" +\r
      color + ';opacity:0;"></div>' +\r
      "</div>" +\r
      (o.label\r
        ? '<div style="font-family:var(--font-body);font-size:var(--fs-small);color:var(--text-muted);">' +\r
          o.label +\r
          "</div>"\r
        : "") +\r
      "</div>";\r
\r
    var arc = container.querySelector(".mc-ring-arc");\r
    var valueEl = container.querySelector(".mc-ring-value");\r
\r
    return {\r
      addTo: function (tl, at) {\r
        var dur = o.dur != null ? o.dur : 1.4;\r
        tl.to(\r
          arc,\r
          {\r
            strokeDashoffset: circumference * (1 - value / 100),\r
            duration: dur,\r
            ease: "power2.out",\r
          },\r
          at || 0,\r
        );\r
        tl.to(valueEl, { opacity: 1, duration: 0.3 }, at || 0);\r
        var proxy = { v: 0 };\r
        tl.to(\r
          proxy,\r
          {\r
            v: value,\r
            duration: dur,\r
            ease: "power2.out",\r
            onUpdate: function () {\r
              valueEl.textContent = proxy.v.toFixed(decimals) + suffix;\r
            },\r
          },\r
          at || 0,\r
        );\r
        return tl;\r
      },\r
    };\r
  };\r
\r
  window.MC = MC;\r
})();\r
`;
let booted = false;
const inject = (src) => {
  const s = document.createElement("script");
  s.textContent = src;
  document.head.appendChild(s);
};
const bootstrapFx = () => {
  if (booted || typeof document === "undefined") return;
  booted = true;
  const w = window;
  if (!w.gsap) inject(gsapSrc);
  if (!w.MC) inject(mcSrc);
};
const previewCss = (frame) => `
:host { display: block; color-scheme: light; font-family: var(--disp, "Inter", system-ui, sans-serif); color: var(--black, #000); }
.mc-stage { width: 100%; overflow: hidden; background: #fafafa; }
.mc-stage--frame { position: relative; aspect-ratio: 16 / 9; }
.mc-stage--frame .mc-stage-inner { position: absolute; top: 0; left: 0; width: 1920px; height: 1080px; transform-origin: top left; }
.mc-stage--frame .mc-stage-inner > * { position: absolute; inset: 0; }
.mc-stage--comp { display: grid; place-items: center; padding: 24px; container-type: inline-size; }
.mc-stage--comp .mc-stage-inner { width: 100%; container-type: size; position: relative; min-height: 180px; }
${frame ? "" : ".mc-stage--comp .mc-stage-inner > * { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }"}
`;
const mountPreview = (container, instance, theme, opts = {}) => {
  bootstrapFx();
  const compId = opts.compId ?? "mc-preview";
  const frame = opts.frame ?? instance.kind === "treatment";
  const ctx = rootContext(compId, theme, { mode: "showcase" });
  const built = buildPreview(instance, ctx);
  const css = built.css;
  const anims = built.anims;
  const html = opts.ground ? built.html.replace(/background:\s*var\(--[a-z]+\)/, `background: var(--${opts.ground})`) : built.html;
  const shadow = container.shadowRoot ?? container.attachShadow({ mode: "open" });
  shadow.replaceChildren();
  const style = document.createElement("style");
  style.textContent = `${theme.css.replace(/:root/g, ":host")}
${previewCss(frame)}
${css}`;
  shadow.appendChild(style);
  const stage = document.createElement("div");
  stage.className = frame ? "mc-stage mc-stage--frame" : "mc-stage mc-stage--comp";
  const inner = document.createElement("div");
  inner.className = "mc-stage-inner";
  inner.innerHTML = html;
  stage.appendChild(inner);
  shadow.appendChild(stage);
  const gsap = window.gsap;
  const MC = window.MC;
  const scale = () => {
    if (frame) inner.style.transform = `scale(${stage.clientWidth / 1920})`;
  };
  let tl = null;
  const HOLD = 0.5;
  const pageTx = instance.kind === "treatment" ? instance.pageTransition() : null;
  const settle = () => {
    if (!gsap || !MC) return;
    const timeline = tl = gsap.timeline({ paused: true });
    MC.applyAnims(timeline, anims, MC.showcaseCtx(inner));
    let holdAt = timeline.duration();
    if (pageTx && (pageTx.animIn || pageTx.animOut)) {
      const pageEl = inner.querySelector(`.${compId}-root`) ?? inner;
      const play = (spec, at, durSec) => {
        if (!spec) return;
        const fn = MC[spec.fn];
        if (fn) fn(timeline, pageEl, at, { dur: durSec, ...spec.opts });
      };
      if (pageTx.animIn && pageTx.animIn !== "none") play(pageInFor(pageTx.animIn), 0, TIMING_SECONDS[pageTx.timeIn ?? "short"]);
      holdAt = timeline.duration();
      if (pageTx.animOut && pageTx.animOut !== "none") {
        play(pageOutFor(pageTx.animOut), holdAt + HOLD, TIMING_SECONDS[pageTx.timeOut ?? "short"]);
        timeline.eventCallback("onComplete", () => tl?.time(holdAt).pause());
      }
    }
    timeline.time(holdAt).pause();
  };
  requestAnimationFrame(() => {
    scale();
    settle();
  });
  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => scale()) : null;
  ro?.observe(stage);
  return {
    replay: () => tl?.restart(),
    destroy: () => {
      ro?.disconnect();
      tl?.kill();
      shadow.replaceChildren();
    }
  };
};
const issuesSummary = (error) => error.issues.slice(0, 12).map((i) => `- ${i.path.join(".") || "(root)"}: ${i.message}`).join("\n");
const DECORATION_COMPONENTS = ["starburst", "slab", "stripe", "badge"];
const STAR = "polygon(50% 4.5%, 61% 39.5%, 98% 39.5%, 68% 61.5%, 79% 95.5%, 50% 74.5%, 21% 95.5%, 32% 61.5%, 2% 39.5%, 39% 39.5%)";
const BURST = "polygon(50% 0%, 60% 22%, 84% 12%, 78% 38%, 100% 50%, 78% 62%, 84% 88%, 60% 78%, 50% 100%, 40% 78%, 16% 88%, 22% 62%, 0% 50%, 22% 38%, 16% 12%, 40% 22%)";
const TRIANGLE = "polygon(50% 2%, 98% 98%, 2% 98%)";
const RHOMBUS = "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)";
const HEXAGON = "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)";
const CROSS = "polygon(35% 0%, 65% 0%, 65% 35%, 100% 35%, 100% 65%, 65% 65%, 65% 100%, 35% 100%, 35% 65%, 0% 65%, 0% 35%, 35% 35%)";
const SHIELD = "polygon(50% 0%, 100% 18%, 100% 62%, 50% 100%, 0% 62%, 0% 18%)";
const TAG = "polygon(0% 0%, 78% 0%, 100% 50%, 78% 100%, 0% 100%)";
const SHAPES = {
  // starburst family — pointed & round bursts
  star: { clip: STAR },
  burst: { clip: BURST },
  triangle: { clip: TRIANGLE },
  circle: { radius: "50%", box: true },
  // slab family — angular blocks
  square: { box: true },
  rectangle: { box: true, h: 0.6 },
  rhombus: { clip: RHOMBUS },
  hexagon: { clip: HEXAGON },
  cross: { clip: CROSS },
  // stripe family — repeating-gradient fills
  stripe: { pattern: "stripe", h: 0.42 },
  bars: { pattern: "bars", h: 0.42 },
  grid: { pattern: "grid" },
  // badge family — rounded / tag shapes
  shield: { clip: SHIELD },
  tag: { clip: TAG },
  ticket: { box: true, radius: "2cqw", h: 0.6 },
  capsule: { box: true, radius: "999px", h: 0.5 }
};
const svgPoints = (clip) => clip.replace(/polygon\(|\)|%/g, "").split(",").map((pt) => pt.trim().replace(/\s+/g, ",")).join(" ");
const patternBg = (kind, color) => {
  if (kind === "stripe") {
    return `repeating-linear-gradient(45deg, var(--black), var(--black) 0.8cqw, ${color} 0.8cqw, ${color} 2.4cqw)`;
  }
  if (kind === "bars") {
    return `repeating-linear-gradient(90deg, var(--black), var(--black) 0.9cqw, ${color} 0.9cqw, ${color} 2.7cqw)`;
  }
  return `repeating-linear-gradient(0deg, var(--black) 0 0.4cqw, transparent 0.4cqw 2.6cqw), repeating-linear-gradient(90deg, var(--black) 0 0.4cqw, transparent 0.4cqw 2.6cqw), linear-gradient(${color}, ${color})`;
};
const DECO_TEMPLATE = `<div class="deco" data-anim="item"><i class="deco-shape" data-html="shape"></i></div>`;
const DECO_CSS = `.deco {
  position: absolute;
  left: var(--d-x, 50%);
  top: var(--d-y, 50%);
  width: var(--d-w, 16cqw);
  height: var(--d-h, 16cqw);
  transform: translate(-50%, -50%) rotate(var(--d-rot, 0deg));
  background: var(--d-bg, transparent);
  border: var(--d-border, none);
  border-radius: var(--d-radius, 0);
  filter: drop-shadow(0.5cqw 0.5cqw 0 var(--black));
  z-index: var(--d-z, 1);
  pointer-events: none;
}
.deco-shape { position: absolute; inset: 0; }
.deco-shape svg { display: block; width: 100%; height: 100%; overflow: visible; }`;
const decorationLayout = (p) => {
  const s = SHAPES[p.variant] ?? SHAPES.square;
  const color = `var(--${p.accent})`;
  const vars = {
    "--d-x": `${p.x}%`,
    "--d-y": `${p.y}%`,
    "--d-w": `${p.size}cqw`,
    "--d-h": `${(p.size * (s.h ?? 1)).toFixed(2)}cqw`,
    "--d-rot": `${p.rotate}deg`,
    "--d-z": p.layer === "front" ? "5" : "1"
  };
  if (!s.clip) {
    vars["--d-bg"] = s.pattern ? patternBg(s.pattern, color) : color;
    if (s.radius) vars["--d-radius"] = s.radius;
    if (s.box) vars["--d-border"] = "0.3cqw solid var(--black)";
  }
  return vars;
};
const decoSvg = (p) => {
  const clip = SHAPES[p.variant]?.clip;
  if (!clip) return "";
  return `<svg viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><polygon points="${svgPoints(clip)}" vector-effect="non-scaling-stroke" style="fill: var(--${p.accent}); stroke: var(--black); stroke-width: 3.5; stroke-linejoin: round"></polygon></svg>`;
};
const decorationComponent = (name, variants, example) => component({
  name,
  schema: object({
    variant: _enum(variants).default(variants[0]).describe(`Shape (this decoration's family: ${variants.join(", ")})`),
    x: number().min(0).max(100).default(50).describe("Center X in page-space % (0 = left … 100 = right; edges bleed off-frame)"),
    y: number().min(0).max(100).default(50).describe("Center Y in page-space % (0 = top … 100 = bottom)"),
    size: number().positive().max(60).default(16).describe("Size in cqw (percent of page width)"),
    rotate: number().min(-180).max(180).default(0).describe("Rotation in degrees (block tilt: ±2–12°)"),
    layer: _enum(["back", "front"]).default("back").describe("Behind the content (back) or over it (front)"),
    accent: _enum(["pink", "blue", "green", "yellow", "cream"]).default("pink").describe("Fill color token")
  }),
  template: DECO_TEMPLATE,
  css: DECO_CSS,
  example,
  // Polygon variants inject their shape as inline SVG; box/pattern variants leave the
  // slot empty (null ⇒ the shape span self-removes) and render via CSS on the div.
  rawFill: (p) => ({ shape: SHAPES[p.variant]?.clip ? decoSvg(p) : null }),
  layout: decorationLayout,
  // The whole-shape entrance IS the transition (so an assigned animIn REPLACES it
  // rather than doubling up). Default reproduces the old decorationAnim byte-for-byte.
  animIn: "scale",
  animInOpts: { from: 0.4 }
});
const tokensCss = `:root {
  --black: #000000;
  --white: #ffffff;
  --offwhite: #fffdf5;
  --pink: #fe90e8;
  --blue: #c0f7fe;
  --green: #99e885;
  --yellow: #f7cb46;
  --cream: #ffdc8b;
  --disp: "Inter", sans-serif;
  --mono: "Space Grotesk", sans-serif;
}`;
const frameCss = `.block-frame {
  position: absolute;
  inset: 0;
  overflow: hidden;
  container-type: size;
  font-family: var(--disp);
  color: var(--black);
}
.block-frame > .body {
  position: absolute;
  inset: 0;
  z-index: 3;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}
.block-frame .pill {
  display: inline-block;
  align-self: flex-start;
  border: 0.25cqw solid var(--black);
  background: var(--white);
  box-shadow: 0.4cqw 0.4cqw 0 var(--black);
  padding: 0.5cqw 1.2cqw;
  font-family: var(--mono);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 1.1cqw;
  line-height: 1.2;
}
.block-frame h3 {
  font-family: var(--disp);
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: -0.03em;
  line-height: 0.95;
  margin: 0;
}
.block-frame .dg {
  position: absolute;
  inset: 0;
  opacity: 0.32;
  background-image: radial-gradient(circle, var(--black) 0.14cqw, transparent 0.14cqw);
  background-size: 3cqw 3cqw;
  z-index: 1;
  pointer-events: none;
}`;
const palette = [
  { name: "Pink", hex: "#FE90E8", varName: "pink" },
  { name: "Blue", hex: "#C0F7FE", varName: "blue" },
  { name: "Green", hex: "#99E885", varName: "green" },
  { name: "Yellow", hex: "#F7CB46", note: "CTA", varName: "yellow" },
  { name: "Cream", hex: "#FFDC8B", varName: "cream" },
  { name: "Off-White", hex: "#FFFDF5", note: "canvas", varName: "offwhite" },
  { name: "White", hex: "#FFFFFF", note: "cards", varName: "white" },
  { name: "Black", hex: "#000000", note: "all borders", varName: "black" }
];
const displayBase = "font-family: var(--disp); text-transform: uppercase; line-height: 0.95;";
const typography = [
  {
    token: "heading-xl",
    spec: "Inter 900 · uppercase · −0.03em",
    sample: "Maximal.",
    style: `${displayBase} font-weight: 900; letter-spacing: -0.03em; font-size: 80px;`
  },
  {
    token: "heading-lg",
    spec: "Inter 800 · uppercase · −0.02em",
    sample: "Bordered & Bold",
    style: `${displayBase} font-weight: 800; letter-spacing: -0.02em; font-size: 50px;`
  },
  {
    token: "stat-number",
    spec: "Inter 900 · line 1",
    sample: "240",
    style: "font-family: var(--disp); font-weight: 900; line-height: 1; letter-spacing: -0.02em; font-size: 64px;"
  },
  {
    token: "body",
    spec: "Inter 500 · sentence case · line 1.6",
    sample: "Body runs Inter at weight 500, sentence case — the calm against the heavy uppercase display.",
    style: "font-family: var(--disp); font-weight: 500; font-size: 18px; line-height: 1.6; max-width: 640px;"
  },
  {
    token: "label",
    spec: "Space Grotesk 600 · uppercase · 0.08em",
    sample: "Section Eyebrow",
    style: "display: inline-block; border: 3px solid var(--black); background: var(--white); box-shadow: 4px 4px 0 var(--black); padding: 6px 16px; font-family: var(--mono); font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; font-size: 13px;"
  }
];
const rules = {
  do: [
    "4px borders + 8px shadows on primary cards; 3px + 4px on chrome.",
    "Cycle pastel grounds across frames; keep the rhythm.",
    "Inter 800–900 uppercase, negative tracking, for all display.",
    "Open every region with a label-pill eyebrow.",
    "Tilt decorations ±2°–12°; add one to every frame."
  ],
  dont: [
    "No rounded corners (save the stat-deco dot); no blurred shadows.",
    "No colored borders (black only, save the close-frame white).",
    "No sentence-case Inter display; no sixth pastel.",
    "No label rendered as plain text — pill or nothing.",
    "Don't blow a headline edge-to-edge — fit to measure."
  ]
};
const blockTheme = {
  name: "block",
  css: tokensCss,
  frameCss,
  fonts: {
    // Staged from video-assets/themes/block/assets/fonts by the scaffold.
    css: "assets/fonts/theme-fonts.css",
    files: ["inter.woff2", "space-grotesk.woff2", "theme-fonts.css"]
  },
  palette,
  typography,
  rules,
  // The decoration component families block offers (starburst · slab · stripe · badge).
  decorations: [...DECORATION_COMPONENTS]
};
const validate = (schema, data, label) => {
  const r = schema.safeParse(data);
  if (!r.success) throw new Error(`${label} params invalid:
${issuesSummary(r.error)}`);
  return r.data;
};
const composeComponent = (name, params = {}) => {
  const factory = getComponent(name);
  validate(factory.schema, params, `component '${name}'`);
  return factory(params);
};
const composeTreatment = (spec) => {
  const factory = getTreatment(spec.treatment);
  validate(factory.schema, spec.params ?? {}, `treatment '${spec.treatment}'`);
  const inst = factory(spec.params ?? {});
  if (spec.children?.length)
    inst.addChildren(
      ...spec.children.map((c) => {
        const comp = composeComponent(c.name, c.params ?? {});
        if (c.animIn || c.timeIn) comp.withTransition({ animIn: c.animIn, timeIn: c.timeIn });
        return comp;
      })
    );
  if (spec.decorations?.length)
    inst.addDecorations(
      ...spec.decorations.map((d) => {
        const deco = composeComponent(d.name, d.params ?? {});
        if (d.animIn || d.timeIn) deco.withTransition({ animIn: d.animIn, timeIn: d.timeIn });
        return deco;
      })
    );
  if (spec.anim) inst.withAnim(validate(array(AnimDescriptorSchema), spec.anim, "anim"));
  if (spec.transition) inst.withTransition(spec.transition);
  return inst;
};
const composeScene = (spec, compId, opts = {}) => {
  const inst = composeTreatment(spec);
  return renderScene(
    inst,
    rootContext(compId, opts.theme ?? blockTheme, { voIds: opts.voIds }),
    opts.ground ? { ground: opts.ground } : void 0
  );
};
const id = string().regex(/^[a-z][a-z0-9-]*$/, "ids are lowercase kebab-case");
const FRAME_THEME_NAMES = ["block", "capsule", "creative", "professional", "standard", "future"];
const FRAME_TREATMENTS = [
  "cover",
  "feature-cards",
  "stat-grid",
  "closing-plate",
  "quote",
  "timeline",
  "comparison",
  "chart",
  "bar-ranking",
  "agenda"
];
const FRAME_GROUNDS = [
  "offwhite",
  "cream",
  "blue",
  "pink",
  "green",
  "yellow",
  "black"
];
const SceneStoryboardSchema = object({
  /** MUST equal a spec slide id — the builder cross-checks (tolerate-and-warn). */
  sceneId: id,
  treatment: _enum(FRAME_TREATMENTS),
  options: object({
    ground: _enum(FRAME_GROUNDS).optional(),
    transition: TransitionSpecSchema.optional()
  }).optional()
});
object({
  theme: _enum(FRAME_THEME_NAMES),
  scenes: array(SceneStoryboardSchema).min(3)
}).superRefine((sb, ctx) => {
  const seen = /* @__PURE__ */ new Set();
  for (const [i, scene] of sb.scenes.entries()) {
    if (seen.has(scene.sceneId)) {
      ctx.addIssue({
        code: "custom",
        path: ["scenes", i, "sceneId"],
        message: `duplicate sceneId '${scene.sceneId}'`
      });
    }
    seen.add(scene.sceneId);
  }
});
const COMPONENT_NAMES = [
  "stat",
  // → stat-grid
  "card",
  // → feature-cards
  "step",
  // → timeline
  "agenda-item",
  // → agenda
  "bar",
  // → chart (vertical column)
  "rank",
  // → bar-ranking (horizontal ranked row)
  "row",
  // → comparison (ledger row)
  // Chrome / decorative leaf pieces — library + showcase (no treatment child role):
  "caption",
  // VO-transcript pill (root caption rail in render)
  "pill",
  // label / eyebrow pill
  "cta",
  // call-to-action button
  "list-number",
  // numbered index row
  // Decoration families — positioned page-space flourishes any treatment can add.
  // Each has its OWN disjoint shape-variant list (no two render the same shape).
  "starburst",
  // star · burst · triangle · circle
  "slab",
  // square · rectangle · rhombus · hexagon · cross
  "stripe",
  // stripe · bars · grid
  "badge",
  // shield · tag · ticket · capsule
  "icon",
  // inline-SVG icon from the shared set
  "hud"
  // full-frame HUD overlay composite
];
const TREATMENT_NAMES = FRAME_TREATMENTS;
const ChildSpecSchema = object({
  name: string().min(1),
  params: record(string(), unknown()).optional(),
  animIn: _enum(TRANSITION_NAMES).optional(),
  timeIn: _enum(TIMING_PRESETS).optional()
});
const DeckVoLineSchema = object({
  id: string().min(1),
  text: string().min(1).max(220)
});
const DeckSceneSchema = object({
  id: string().min(1),
  treatment: _enum(FRAME_TREATMENTS),
  params: record(string(), unknown()),
  children: array(ChildSpecSchema),
  decorations: array(ChildSpecSchema).optional(),
  ground: _enum(FRAME_GROUNDS).optional(),
  anim: array(AnimDescriptorSchema).optional(),
  transition: TransitionSpecSchema.optional(),
  voIds: array(string()).optional(),
  /** The slide's VO/caption lines (id + editable on-screen text). Surfaced in the
   *  editor's Captions section; the deck POST writes edits back to spec.json. */
  vo: array(DeckVoLineSchema).optional()
}).loose();
const DeckMetaSchema = object({
  title: string().optional(),
  requester: string().optional(),
  width: number().optional(),
  height: number().optional(),
  fps: number().optional()
}).loose();
const DeckDocumentSchema = object({
  version: literal(1),
  theme: _enum(FRAME_THEME_NAMES),
  meta: DeckMetaSchema.optional(),
  scenes: array(DeckSceneSchema)
}).loose();
const applySceneEdit = (original, edit) => {
  const next = { ...original, params: edit.params, children: edit.children };
  if (edit.decorations && edit.decorations.length) next.decorations = edit.decorations;
  else delete next.decorations;
  if (edit.ground) next.ground = edit.ground;
  else delete next.ground;
  if (edit.transition) next.transition = edit.transition;
  else delete next.transition;
  if (edit.vo) next.vo = edit.vo;
  return next;
};
export {
  blockTheme as A,
  DeckDocumentSchema as B,
  COMPONENT_NAMES as C,
  DEFAULT_ENTRANCE as D,
  FRAME_TREATMENTS as E,
  FRAME_GROUNDS as F,
  TIMING_PRESETS as G,
  TIMING_SECONDS as H,
  TRANSITION_NAMES as I,
  TREATMENT_NAMES as J,
  allComponents as K,
  allTreatments as L,
  applySceneEdit as M,
  bootstrapFx as N,
  componentNames as O,
  composeComponent as P,
  composeScene as Q,
  composeTreatment as R,
  getComponent as S,
  THEMES as T,
  getTreatment as U,
  hasComponent as V,
  hasTreatment as W,
  loadTheme as X,
  mountPreview as Y,
  treatmentNames as Z,
  _enum as _,
  sceneEntranceJs as a,
  sceneExitJs as b,
  scopeCss as c,
  serialize as d,
  stampAnims as e,
  fillSlots as f,
  childrenContainer as g,
  styleProps as h,
  stripAnnotations as i,
  collectCss as j,
  object as k,
  string as l,
  mergeStyle as m,
  component as n,
  offsetAnim as o,
  pruneRemoved as p,
  qualifyAnim as q,
  rootElement as r,
  serializeAnims as s,
  toJSONSchema as t,
  boolean as u,
  number as v,
  decorationComponent as w,
  tuple as x,
  registerComponent as y,
  registerTreatment as z
};
