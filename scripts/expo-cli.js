#!/usr/bin/env node
// NOSONAR: S7772 - node: prefix is already used
const { spawn } = require("node:child_process");
// NOSONAR: S7772 - node: prefix is already used
const path = require("node:path");
// NOSONAR: S7772 - node: prefix is already used
const fs = require("node:fs");

const args = process.argv.slice(2);
const root = process.cwd();
const modeArg = args.find((arg) => arg === "--user" || arg === "--mitra");
const webArg = args.includes("--web");

let mode = "user";
if (modeArg === "--mitra") {
  mode = "mitra";
// NOSONAR: S4165 - assignment is not redundant, overrides default
} else if (process.env.EXPO_PUBLIC_APP_MODE) {
  mode = process.env.EXPO_PUBLIC_APP_MODE;
}

const envFile = path.join(root, mode === "mitra" ? ".env.mitra" : ".env.user");
const envContent = fs.existsSync(envFile) ? fs.readFileSync(envFile, "utf8") : "";
const env = { ...process.env };

const parseEnv = (source) => {
  const result = {};
  const lines = source.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex > -1) {
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim().replace(/^['"]|['"]$/g, "");
      result[key] = value;
    }
  }

  return result;
};

const selectedEnv = parseEnv(envContent);
for (const [key, value] of Object.entries(selectedEnv)) {
  env[key] = value;
}
env.EXPO_PUBLIC_APP_MODE = mode;

const expoArgs = [...args.filter((arg) => arg !== "--user" && arg !== "--mitra")];
if (webArg) {
  expoArgs.push("--web");
}

if (!expoArgs.some((arg) => ["start", "run:android", "run:ios", "install", "login", "logout", "whoami", "register", "export", "config", "customize", "prebuild", "serve"].includes(arg)) && !args.includes("--help") && !args.includes("--version")) {
  expoArgs.unshift("start");
}

if (expoArgs.includes("start")) {
  expoArgs.push("--clear");
}

const targetEnvFile = path.join(root, ".env");
const finalEnvContent = Object.entries({ ...parseEnv(fs.existsSync(targetEnvFile) ? fs.readFileSync(targetEnvFile, "utf8") : ""), ...selectedEnv, EXPO_PUBLIC_APP_MODE: mode })
  .map(([key, value]) => `${key}=${value}`)
  .join("\n");
fs.writeFileSync(targetEnvFile, `${finalEnvContent}\n`);

const expoCliPath = path.join(root, "node_modules", "expo", "bin", "cli");
const child = spawn(process.execPath, [expoCliPath, ...expoArgs], {
  cwd: root,
  env,
  stdio: "inherit",
  shell: false,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
