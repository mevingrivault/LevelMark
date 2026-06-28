const { execFileSync } = require("node:child_process");
const path = require("node:path");

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== "darwin") {
    return;
  }

  const appPath = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);
  const hasAppleSigningConfig = Boolean(process.env.CSC_LINK || process.env.CSC_NAME || process.env.CSC_KEYCHAIN);

  try {
    execFileSync("xattr", ["-cr", appPath], { stdio: "inherit" });
  } catch {
    // Best effort: codesign will report any remaining metadata that blocks signing.
  }

  if (hasAppleSigningConfig) {
    return;
  }

  execFileSync("codesign", ["--force", "--deep", "--sign", "-", appPath], {
    stdio: "inherit"
  });
  execFileSync("codesign", ["--verify", "--deep", "--strict", appPath], { stdio: "inherit" });
};
