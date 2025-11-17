import { runCommand, runCommandArray } from "../utils";

export async function ghJson(
  args: string[],
  opts?: { paginate?: boolean }
): Promise<any> {
  const base = ["api", ...args];

  const full = opts?.paginate ? [...base, "--paginate"] : base;

  const { stdout } = await runCommandArray("gh", full);
  return JSON.parse(stdout);
}
