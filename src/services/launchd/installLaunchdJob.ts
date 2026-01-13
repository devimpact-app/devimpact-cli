import path from "path";
import os from "os";
import fs from "fs";
import { buildLaunchdPlistXml } from "./plist";
import { runCommandArray, writeAtomic } from "../../utils";

export async function tryLaunchctl(args: string[]) {
  try {
    await runCommandArray("launchctl", args);
    return true;
  } catch {
    return false;
  }
}

/**
 * Installs a launchd job that periodically runs
 * `devimpact autosync:tick`.
 */
export async function installLaunchdAutosyncJob(opts: {
  intervalMinutes: number;
  installId: string;
  cliEntryPath: string;
  nodePath: string;
}) {
  // launchd identity
  const label = `com.devimpact.autosync.${opts.installId}`;

  // ~/Library/LaunchAgents/com.devimpact.autosync.<installId>.plist
  const homeDir = os.homedir();
  const plistPath = path.join(
    homeDir,
    "Library",
    "LaunchAgents",
    `${label}.plist`
  );

  const logDir = path.join(homeDir, ".devimpact", "logs");
  fs.mkdirSync(logDir, { recursive: true });
  const logOutPath = path.join(logDir, `autosync.${opts.installId}.out.log`);
  const logErrPath = path.join(logDir, `autosync.${opts.installId}.err.log`);

  const tickSeconds = Math.max(
    60,
    Math.min(60 * 60, opts.intervalMinutes * 60)
  );
  const xml = buildLaunchdPlistXml({
    label,
    startIntervalSeconds: tickSeconds,
    nodePath: opts.nodePath,
    cliEntryPath: opts.cliEntryPath,
    logOutPath,
    logErrPath,
  });

  writeAtomic(plistPath, xml);
  console.log(`Wrote launchd plist: ${plistPath}`);

  // remove other process w/ same name
  const uid = process.getuid?.() ?? undefined;
  const domain = uid != null ? `gui/${uid}` : null;
  if (domain) {
    await tryLaunchctl(["bootout", domain, plistPath]);
  } else {
    await tryLaunchctl(["unload", plistPath]);
  }

  // Load the job
  if (domain) {
    const ok = await tryLaunchctl(["bootstrap", domain, plistPath]);
    if (!ok) {
      await tryLaunchctl(["load", plistPath]);
    }
  } else {
    await tryLaunchctl(["load", plistPath]);
  }

  // Kick it off once to test
  const ok = await tryLaunchctl(["kickstart", "-k", `${domain}/${label}`]);
  if (!ok) {
    await tryLaunchctl(["start", label]);
  }

  return {
    label,
    plistPath,
    lastInstalledAt: new Date().toISOString(),
    logOutPath,
    logErrPath,
  };
}
