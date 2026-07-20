import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

// Lint config for the library. This package is consumed as a git SUBMODULE by the
// WebUI, whose own eslint ignores `packages/library` — a vendored checkout of another
// repo is not that repo's responsibility. That ignore is only honest if the library
// lints ITSELF, which is what this file is for.
//
// Note this is a VANILLA TS library: no React, no JSX, no framework plugins. The
// source runs in the browser (DOM-heavy runtime + engine), while scripts/ and the
// vite config run under Node, so globals are set per file group rather than as one
// permissive blanket union.
//
// Where that per-group split actually BITES differs by group, and the difference is the
// reason this file is shaped the way it is. typescript-eslint's recommended preset turns
// `no-undef` off wherever it applies, because tsc already reports unknown identifiers and
// running both just duplicates the message. That is correct for the TYPE-CHECKED groups
// (src/**/*.ts, *.config.ts) and wrong for plain JS, which tsc never looks at — so the JS
// groups below deliberately do NOT extend the TS preset, leaving `no-undef` live. Without
// that, `scripts/` would have no undefined-identifier checking from any tool at all.
const unusedVars = [
  "error",
  // Honour the underscore convention. The trio elements keep a uniform factory signature
  // even when a given element ignores its params — e.g. row/anim.ts's
  // `rowAnim = (_p: RowParams) => [...]` — so `_`-prefixed bindings are declared unused ON
  // PURPOSE and must not be reported. Shared across every group below so the one
  // convention really does hold everywhere, rather than only in src/.
  { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
];

export default tseslint.config(
  {
    // `dist` is build output (gitignored) and `src/engine/block-fonts.generated.ts` is
    // emitted by scripts/gen-inline-fonts.mjs before every build — a single ~95KB line
    // of base64 woff2. Linting generated output is pure noise: nobody can act on a
    // finding in a file that is overwritten on the next `pnpm gen:fonts`.
    // `assets/fx/gsap.min.js` is vendored, minified third-party — not ours to fix.
    ignores: [
      "dist",
      "node_modules",
      "src/engine/block-fonts.generated.ts",
      "assets/fx/gsap.min.js",
    ],
  },

  // --- library source: browser runtime -------------------------------------------
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["src/**/*.ts"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": unusedVars,
    },
  },
  // Tests import `describe`/`test`/`expect` explicitly from "bun:test" rather than relying
  // on injected globals, so they need no block of their own. (An earlier draft carried one
  // that switched `@typescript-eslint/no-non-null-assertion` off for tests — a no-op, since
  // that rule lives in typescript-eslint's `stylistic` preset, which this config does not
  // extend, so it was never on. Removed rather than left to read as a considered trade-off.)

  // --- the shipped window.MC runtime ------------------------------------------------
  {
    // assets/fx/mc.js is FIRST-PARTY browser runtime (the `window.MC` helpers every
    // composition script calls), shipped as a plain script — not built, not imported by
    // src. It is deliberately ES5-flavoured (`var`, IIFE) because it is injected into
    // rendered compositions verbatim, so it is linted as script-not-module sourceType
    // and without the TS rules. It gets linted rather than ignored: it is our code, and
    // leaving it rule-free is exactly the kind of gap this config exists to close.
    extends: [js.configs.recommended],
    files: ["assets/fx/mc.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: { ...globals.browser, gsap: "readonly" },
    },
    rules: {
      // Base `no-unused-vars` here, not the TS one — this group has no TS plugin.
      "no-unused-vars": unusedVars,
    },
  },

  // --- node-side tooling: plain JS ------------------------------------------------------
  {
    // scripts/ never runs in a browser: it reads the filesystem and uses `process`. Node
    // globals only, no DOM. Deliberately NOT extending the typescript-eslint preset — see
    // the header note: it would switch `no-undef` off, and tsc does not type-check .mjs, so
    // these files would end up with no undefined-identifier checking from anything.
    extends: [js.configs.recommended],
    files: ["scripts/**/*.{js,mjs}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: globals.node,
    },
    rules: {
      "no-undef": "error",
      "no-unused-vars": unusedVars,
    },
  },

  // --- node-side tooling: TypeScript ----------------------------------------------------
  {
    // vite.config.ts / tsconfig-adjacent TS tooling. tsc DOES cover these, so the TS preset
    // (and its `no-undef` opt-out) is the right call here.
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["*.config.ts"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": unusedVars,
    },
  },
);
