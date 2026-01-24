import fs from "fs";

import { loadConfig, saveConfig } from "../../config/config";
import { tryLaunchctl } from "../../services/launchd/installLaunchdJob";
import { isMac } from "../../utils";

export async function handleAutosyncDisable() {
  const config = loadConfig();
  if (!config) {
    console.error("Need to run `devimpact init` first to set up the CLI.");
    process.exit(1);
  }

  if (!isMac()) {
    console.log(
      "Autosync disabled (note: autosync is only supported on macOS for beta)."
    );
    return;
  }

  const launchd = config.autosync?.launchd;
  const plistPath = launchd?.plistPath;
  const nextConfig = {
    ...config,
    autosync: config.autosync
      ? { ...config.autosync, enabled: false }
      : { enabled: false, intervalMinutes: 120 },
  };

  if (!plistPath) {
    saveConfig(nextConfig);
    console.log(
      "Autosync was not installed on this machine (no plistPath found). Disabled in config."
    );
    return;
  }

  console.log("Disabling autosync (launchd)…");

  const uid = process.getuid?.() ?? undefined;
  const domain = uid != null ? `gui/${uid}` : null;
  if (domain) {
    await tryLaunchctl(["bootout", domain, plistPath]);
  } else {
    await tryLaunchctl(["unload", plistPath]);
  }

  try {
    if (fs.existsSync(plistPath)) fs.unlinkSync(plistPath);
  } catch (e) {
    console.warn(`⚠️ Could not delete plist: ${plistPath}`);
  }

  saveConfig(nextConfig);

  console.log("✅ Autosync disabled.");
}
