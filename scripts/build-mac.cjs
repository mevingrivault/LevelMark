const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const tempOutputDir = fs.mkdtempSync(path.join(os.tmpdir(), "levelmark-mac-"));
const releaseDir = path.join(projectRoot, "release");

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    env: process.env,
    stdio: "inherit"
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run("npx", ["electron-builder", "--mac", "--arm64", "--config.directories.output", tempOutputDir, ...process.argv.slice(2)]);

fs.mkdirSync(releaseDir, { recursive: true });

for (const entry of fs.readdirSync(tempOutputDir)) {
  const source = path.join(tempOutputDir, entry);
  const destination = path.join(releaseDir, entry);
  fs.rmSync(destination, { recursive: true, force: true });
  fs.cpSync(source, destination, { recursive: true });
}

console.log(`macOS artifacts copied to ${releaseDir}`);
