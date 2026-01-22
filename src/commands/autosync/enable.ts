import crypto from "crypto";
import fs from "fs";

import { DevImpactConfig, loadConfig, saveConfig } from "../../config/config";
import { isMac } from "../../utils";
import { installLaunchdAutosyncJob } from "../../services/launchd/installLaunchdJob";
import { promptSelectAutosyncInterval } from "../shared";

const TICK_INTERVAL_MINS = 10;

function realpathSafe(p: string) {
  try {
    return fs.realpathSync(p);
  } catch {
    return p;
  }
}

function ensureInstallId(existing?: string) {
  return existing ?? crypto.randomUUID();
}

export async function handleAutosyncEnable(): Promise<DevImpactConfig> {
  const config = loadConfig();
  if (!config) {
    console.error("Need to run `devimpact init` first to set up the CLI.");
    process.exit(1);
  }

  if (!isMac()) {
    console.log("Autosync is only supported on macOS for beta.");
    console.log("You can still run: devimpact sync");
    return config;
  }

  const intervalMinutes = await promptSelectAutosyncInterval();
  if (intervalMinutes == null) {
    console.log("Cancelled.");
    return config;
  }

  const nodePath = realpathSafe(process.execPath);
  const cliEntryPath = realpathSafe(process.argv[1]);
  const existingInstallId = config.autosync?.launchd?.installId;
  const installId = ensureInstallId(existingInstallId);

  console.log("Installing launchd job for DevImpact autosync…");
  const meta = await installLaunchdAutosyncJob({
    // Tick is more often to catch periods of asleep
    // It still debounces to user setting when called
    intervalMinutes: TICK_INTERVAL_MINS,
    installId,
    cliEntryPath,
    nodePath,
  });

  const next = {
    ...config,
    autosync: {
      enabled: true,
      intervalMinutes,
      launchd: {
        label: meta.label,
        plistPath: meta.plistPath,
        installId,
        lastInstalledAt: meta.lastInstalledAt,
      },
    },
  };

  saveConfig(next);

  console.log("✅ Autosync enabled.");
  console.log(`   Sync interval: ${intervalMinutes} minutes`);
  console.log(`   Runs in the background when your Mac is awake`);

  return next;
}
