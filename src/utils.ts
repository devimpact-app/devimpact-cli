import { exec } from "child_process";

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
