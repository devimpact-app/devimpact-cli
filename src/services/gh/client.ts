import { runCommandArray } from "../../utils";

export async function ghJson(
  args: string[],
  opts?: { paginate?: boolean; timeoutMs?: number }
): Promise<any> {
  const base = ["api", ...args];
  const full = opts?.paginate ? [...base, "--paginate"] : base;

  const { stdout } = await runCommandArray("gh", full, {
    timeoutMs: opts?.timeoutMs ?? (opts?.paginate ? 120_000 : 45_000),
  });

  try {
    return JSON.parse(stdout);
  } catch (e) {
    const snippet = stdout.length > 2000 ? stdout.slice(0, 2000) + "…" : stdout;
    throw new Error(
      `ghJson: expected JSON but failed to parse. Output snippet:\n${snippet}`
    );
  }
}
