import os from "os";
import path from "path";

export type LaunchdPlistOptions = {
  label: string;
  nodePath: string;
  cliEntryPath: string;
  startIntervalSeconds: number;
  logOutPath?: string;
  logErrPath?: string;
  env?: Record<string, string>;
};

function xmlEscape(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function plistStringArray(items: string[]) {
  return items.map((s) => `      <string>${xmlEscape(s)}</string>`).join("\n");
}

function plistDictEntries(obj: Record<string, string>) {
  const keys = Object.keys(obj).sort();
  return keys
    .map(
      (k) =>
        `      <key>${xmlEscape(k)}</key>\n      <string>${xmlEscape(
          obj[k] ?? ""
        )}</string>`
    )
    .join("\n");
}

export function buildLaunchdPlistXml(opts: LaunchdPlistOptions): string {
  const homeDir = os.homedir();

  const logOutPath =
    opts.logOutPath ??
    path.join(homeDir, ".devimpact", "logs", "autosync.out.log");
  const logErrPath =
    opts.logErrPath ??
    path.join(homeDir, ".devimpact", "logs", "autosync.err.log");

  const programArgs = [opts.nodePath, opts.cliEntryPath, "autosync:tick"];

  const env: Record<string, string> = {
    HOME: homeDir,
    PATH: "/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin",
    ...(opts.env ?? {}),
  };

  return `<?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
      <dict>
        <key>Label</key>
        <string>${xmlEscape(opts.label)}</string>

        <key>ProgramArguments</key>
        <array>
          ${plistStringArray(programArgs)}
        </array>

        <key>RunAtLoad</key>
        <true/>

        <key>StartInterval</key>
        <integer>${Math.max(
          60,
          Math.floor(opts.startIntervalSeconds)
        )}</integer>

        <key>EnvironmentVariables</key>
        <dict>
          ${plistDictEntries(env)}
        </dict>

        <key>StandardOutPath</key>
        <string>${xmlEscape(logOutPath)}</string>

        <key>StandardErrorPath</key>
        <string>${xmlEscape(logErrPath)}</string>

        <key>ThrottleInterval</key>
        <integer>30</integer>
      </dict>
    </plist>
`;
}
