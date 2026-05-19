import { build } from "esbuild";

const commonOptions = {
  bundle: true,
  platform: "browser",
  target: ["chrome114", "edge114"],
  sourcemap: true,
  minify: false,
  logLevel: "info"
};

await Promise.all([
  build({
    ...commonOptions,
    entryPoints: ["src/background/index.ts"],
    outfile: "dist/background/index.js",
    format: "iife"
  }),
  build({
    ...commonOptions,
    entryPoints: ["src/content/onenote.ts"],
    outfile: "dist/content/onenote.js",
    format: "iife"
  }),
  build({
    ...commonOptions,
    entryPoints: ["src/content/outlook.ts"],
    outfile: "dist/content/outlook.js",
    format: "iife"
  })
]);
