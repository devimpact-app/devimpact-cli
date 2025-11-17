import fs from "fs";
import os from "os";
import path from "path";

export type DevImpactConfig = {
  apiBaseUrl: string;
  cliToken: string;
  githubLogin: string;
};

const CONFIG_PATH = path.join(os.homedir(), ".devimpact", "config.json");

export function loadConfig(): DevImpactConfig | null {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveConfig(config: DevImpactConfig) {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf8");
}
