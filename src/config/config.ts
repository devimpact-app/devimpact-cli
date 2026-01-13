import os from "os";
import fs from "fs";
import path from "path";
import { tryReadJson, writeJsonAtomic } from "../utils";

export type DevImpactConfig = {
  apiBaseUrl: string;
  cliToken: string;
  githubLogin: string;
  autosync?: {
    enabled: boolean;
    intervalMinutes: number;
    launchd?: {
      label: string;
      plistPath: string;
      installId: string;
      lastInstalledAt?: string;
    };
  };
};

const CONFIG_PATH = path.join(os.homedir(), ".devimpact", "config.json");

function isValidConfig(v: any): v is DevImpactConfig {
  return (
    v &&
    typeof v === "object" &&
    typeof v.apiBaseUrl === "string" &&
    typeof v.cliToken === "string" &&
    typeof v.githubLogin === "string" &&
    (v.autosync === undefined ||
      (typeof v.autosync === "object" &&
        typeof v.autosync.enabled === "boolean" &&
        typeof v.autosync.intervalMinutes === "number" &&
        (v.autosync.launchd === undefined ||
          (typeof v.autosync.launchd === "object" &&
            typeof v.autosync.launchd.label === "string" &&
            typeof v.autosync.launchd.plistPath === "string" &&
            typeof v.autosync.launchd.installId === "string"))))
  );
}

export function loadConfig(): DevImpactConfig | null {
  const json = tryReadJson(CONFIG_PATH);
  if (!json) return null;
  if (!isValidConfig(json)) return null;
  return json;
}

export function saveConfig(config: DevImpactConfig) {
  writeJsonAtomic(CONFIG_PATH, config);
  try {
    fs.chmodSync(CONFIG_PATH, 0o600);
  } catch {
    // Ignore
  }
}
