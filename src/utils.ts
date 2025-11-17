import { exec } from "child_process";
import { spawn } from "node:child_process";

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
  args: string[]
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => (stderr += d.toString()));

    proc.on("close", (code) => {
      if (code !== 0) {
        return reject(
          new Error(`Command failed (${code}): ${stderr || stdout}`)
        );
      }
      resolve({ stdout, stderr });
    });
  });
}
