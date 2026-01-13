import { exec } from "child_process";
import { spawn } from "node:child_process";
import fs from "fs";
import path from "path";

export function runCommand(
  cmd: string
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        const err: any = new Error(
          `Command failed: ${cmd}\n${stderr || stdout}`
        );
        err.originalError = error;
        return reject(err);
      }
      resolve({ stdout, stderr });
    });
  });
}

export function runCommandArray(
  cmd: string,
  args: string[],
  opts?: { timeoutMs?: number }
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timer =
      opts?.timeoutMs && opts.timeoutMs > 0
        ? setTimeout(() => {
            timedOut = true;
            proc.kill("SIGTERM");
          }, opts.timeoutMs)
        : null;

    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => (stderr += d.toString()));

    proc.on("error", (err) => {
      if (timer) clearTimeout(timer);
      reject(new Error(`Failed to start "${cmd}": ${err.message}`));
    });

    proc.on("close", (code) => {
      if (timer) clearTimeout(timer);
      const exitCode = typeof code === "number" ? code : -1;

      if (exitCode !== 0) {
        const combined = (stderr || stdout || "").trim();
        const snippet =
          combined.length > 2000 ? combined.slice(0, 2000) + "…" : combined;

        const prefix = timedOut
          ? `Command timed out (${opts?.timeoutMs}ms)`
          : `Command failed (${exitCode})`;

        const err = new Error(`${prefix}: ${snippet}`);
        (err as any).exitCode = exitCode;
        (err as any).timedOut = timedOut;
        return reject(err);
      }

      resolve({ stdout, stderr, exitCode });
    });
  });
}

export function safeIso(d: Date = new Date()) {
  return d.toISOString();
}

export function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function ensureDirExists(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function tryReadJson(filePath: string): unknown | null {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function writeJsonAtomic(filePath: string, data: unknown) {
  ensureDirExists(filePath);

  const tmpPath =
    filePath + `.tmp.${process.pid}.${Math.random().toString(16).slice(2)}`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tmpPath, filePath);
}
