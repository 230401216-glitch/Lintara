#!/usr/bin/env node
// NOSONAR: S7772 - node: prefix is already used
const fs = require("node:fs");
// NOSONAR: S7772 - node: prefix is already used
const path = require("node:path");

const root = process.cwd();
const pkgPath = path.join(root, "package.json");

if (!fs.existsSync(pkgPath)) {
  process.exit(0);
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
// NOSONAR: S6582 - optional chaining already used
const hasBin = pkg.bin?.expo;

if (!hasBin) {
  // NOSONAR: S7744 - not an empty object, spreading pkg.bin
  pkg.bin = { ...pkg.bin, expo: "./scripts/expo-cli.js" };
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
}
