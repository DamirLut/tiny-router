import { $ } from "bun";
import { mkdir, cp, rm, readdir, stat, rename } from "fs/promises";
import { join } from "path";

async function cleanDir(path: string) {
  await rm(path, { recursive: true, force: true });
}

async function ensureDir(path: string) {
  await mkdir(path, { recursive: true });
}

async function run() {
  const dist = "dist";
  const temp = "dist-bundle";
  console.log("• Cleaning dist");
  await cleanDir(dist);
  await cleanDir(temp);

  console.log("• Emitting type declarations");
  // tsc will output declarations to dist (configured in tsconfig.lib.json)
  await $`tsc -p tsconfig.lib.json --emitDeclarationOnly`;

  console.log("• Bundling single JS file with Bun.build");
  const result = await Bun.build({
    entrypoints: ["./src/lib/index.ts"],
    outdir: temp,
    format: "esm",
    minify: true,
    tsconfig: "./tsconfig.lib.json",
    external: ["react", "react-dom", "tslib", "react/jsx-runtime"],
  });
  if (!result.success) {
    for (const m of result.logs) console.error(m);
    throw new Error("Bundling failed");
  }

  await ensureDir(dist);
  // Move produced index.js into dist (keep name stable)
  const produced = join(temp, "index.js");
  await rename(produced, join(dist, "index.js"));

  console.log("• Copying CSS");
  await cp("src/lib/router.module.css", join(dist, "router.module.css"));

  // Remove temp dir
  await cleanDir(temp);

  // Simple size report
  const files = await readdir(dist);
  const sizes: Record<string, number> = {};
  for (const f of files) {
    const s = await stat(join(dist, f));
    if (s.isFile()) sizes[f] = s.size;
  }
  console.log("• Build complete:");
  for (const [f, sz] of Object.entries(sizes)) {
    console.log(`  - ${f} ${(sz / 1024).toFixed(2)}kb`);
  }
}

run().catch((e) => {
  console.error("Build failed:", e);
  process.exit(1);
});
