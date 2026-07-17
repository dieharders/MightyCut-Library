// Text imports for component trio assets. Bun (harness) and `bun build`
// (showcase bundle) both resolve `import x from "./t.html" with { type: "text" }`
// to the file's contents as a string; these ambient declarations make tsc agree.
declare module "*.html" {
  const content: string;
  export default content;
}
declare module "*.css" {
  const content: string;
  export default content;
}
