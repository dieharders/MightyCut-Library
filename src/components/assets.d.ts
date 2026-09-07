// Text imports for component trio assets: `import x from "./t.html" with { type: "text" }`
// resolves to the file's contents as a string, under both the harness and `bun build`. These
// ambient declarations make tsc agree.
//
// `export =`, NOT `export default`, and that is load-bearing rather than style. bun-types
// declares the SAME wildcard — `declare module "*.html" { var contents: import("bun").HTMLBundle;
// export = contents }` — for Bun's HTML BUNDLER, a different feature reached by importing an
// .html file WITHOUT the text attribute. TypeScript resolves ambient wildcards per program and
// cannot see import attributes, so only one of the two declarations can win.
//
// With `export default` here, bun's won: all 33 templates and every css import typed as
// `HTMLBundle`, giving 37 errors in a package that is correct at runtime. Matching bun's
// `export =` shape is what makes this one take precedence. Specificity does NOT help — a longer
// `*template.html` pattern was tried first and changed nothing.
//
// A CONSUMER THAT ALSO USES BUN'S HTML BUNDLER has to assert at that call site, because this
// declaration wins program-wide. MotionBuff's worker.ts serves its frontend that way and carries
// the cast, with the reasoning recorded there.
declare module "*.html" {
  const content: string;
  export = content;
}
declare module "*.css" {
  const content: string;
  export = content;
}
