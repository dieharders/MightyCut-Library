// Vite `?raw` imports resolve to the file's text content. The engine build's
// text-import plugin also rewrites the trio's `with { type: "text" }` html/css
// imports to this `?raw` form; tsc needs the ambient declaration either way.
declare module "*?raw" {
  const content: string;
  export default content;
}
