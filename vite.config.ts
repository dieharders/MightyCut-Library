import { defineConfig, type Plugin } from "vite";

// The component "trio" elements import their template/CSS with Bun's import
// attribute: `import html from "./template.html" with { type: "text" }`. Vite/
// Rollup don't return file text for that attribute, but they DO for the `?raw`
// suffix. This pre-transform rewrites the attribute form to `?raw` on .ts source
// so the SAME element source builds under both Bun (harness) and Vite (engine).
const textImports = (): Plugin => ({
  name: "mc-text-imports",
  enforce: "pre",
  transform(code, id) {
    if (!id.endsWith(".ts")) return null;
    if (!code.includes("type:")) return null;
    const out = code.replace(
      /from\s*(["'])([^"']+\.(?:html|css))\1\s*(?:with|assert)\s*\{\s*type:\s*(["'])text\3\s*\}/g,
      'from "$2?raw"',
    );
    return out === code ? null : { code: out, map: null };
  },
});

export default defineConfig({
  plugins: [textImports()],
  build: {
    outDir: "dist/engine",
    emptyOutDir: true,
    target: "es2022",
    minify: false, // readable output for inspection; the WebUI re-minifies on its own build
    lib: {
      entry: "src/engine/index.ts",
      formats: ["es"],
      fileName: () => "index.js",
    },
    rollupOptions: {
      output: {
        // Keep the per-theme registration (dynamic import('./register-block'))
        // as its OWN chunk so the WebUI lazy-loads one payload per theme.
        inlineDynamicImports: false,
        chunkFileNames: "[name].js",
      },
    },
  },
});
