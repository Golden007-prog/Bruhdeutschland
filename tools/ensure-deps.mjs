#!/usr/bin/env node
/**
 * Owner-Mode dependency self-heal (installer fix #1).
 *
 * `npm run owner` runs this FIRST so a fresh clone — where `frontend/`'s dependencies were never installed
 * — builds instead of failing with `'tsc' is not recognized`. This is NOT an npm-workspaces monorepo, so a
 * single root `npm install` does not hoist frontend deps; each package is installed in its own directory.
 * Idempotent and fast: it only installs a package when its deps are actually missing.
 */
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

/**
 * Packages to ensure, each with a "deps present?" probe. The frontend is the one that matters: `tsc` and
 * `vite` live only in `frontend/node_modules`. (tools/claude-bridge declares no deps, so it's skipped.)
 */
const PACKAGES = [
  { name: "root", dir: ROOT, present: (d) => existsSync(join(d, "node_modules")) },
  {
    name: "frontend",
    dir: join(ROOT, "frontend"),
    present: (d) =>
      existsSync(join(d, "node_modules", "vite")) && existsSync(join(d, "node_modules", "typescript")),
  },
];

function install(dir) {
  const useCi = existsSync(join(dir, "package-lock.json"));
  console.log(`[ensure-deps] installing dependencies in ${dir} (${useCi ? "npm ci" : "npm install"})…`);
  execFileSync(npm, [useCi ? "ci" : "install"], { cwd: dir, stdio: "inherit" });
}

let installedAny = false;
for (const pkg of PACKAGES) {
  if (!existsSync(join(pkg.dir, "package.json"))) continue;
  if (pkg.present(pkg.dir)) continue;
  try {
    install(pkg.dir);
    installedAny = true;
  } catch (err) {
    console.error(`[ensure-deps] failed to install ${pkg.name} deps: ${err.message}`);
    console.error(`[ensure-deps] try manually: cd "${pkg.dir}" && npm install`);
    process.exit(1);
  }
}

if (installedAny) {
  console.log("[ensure-deps] dependencies ready. Building the app (first run can take a minute)…");
}
