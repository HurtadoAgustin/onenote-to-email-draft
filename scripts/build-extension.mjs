import { build } from "esbuild";

const sharedConfig = {
  bundle: true,
  minify: false,
  sourcemap: true,
  target: "chrome114",
  format: "iife",
  platform: "browser"
};

await Promise.all([
  build({
    ...sharedConfig,
    entryPoints: ["src/background/index.ts"],
    outfile: "dist/background/index.js",
    format: "esm"
  }),
  build({
    ...sharedConfig,
    entryPoints: ["src/content/onenote.ts"],
    outfile: "dist/content/onenote.js"
  }),
  build({
    ...sharedConfig,
    entryPoints: ["src/content/gmail.ts"],
    outfile: "dist/content/gmail.js"
  })
]);
