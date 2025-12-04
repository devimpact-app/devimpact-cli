import { loadConfig } from "./config";
import { HydratedPr } from "./gh/hydratePr";
import { RepoMetadata } from "./gh/repos";
import { CliStatus } from "./types";

export const DEVIMPACT_API_BASE =
  process.env.DEVIMPACT_API_BASE ?? "http://localhost:3000";

export type LinkCliRequest = {
  cliToken: string;
  githubLogin: string;
};

export type LinkCliResponse = {
  ok: boolean;
  tenantId?: string;
  message?: string;
};

export async function linkCliToAccount(
  payload: LinkCliRequest
): Promise<LinkCliResponse> {
  const res = await fetch(`${DEVIMPACT_API_BASE}/api/cli/link`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Link failed with status ${res.status}: ${text || res.statusText}`
    );
  }

  return (await res.json()) as LinkCliResponse;
}

export async function getCliStatus(): Promise<CliStatus> {
  const cfg = loadConfig();
  if (!cfg) {
    console.error(
      "❌ No DevImpact CLI config found. Run `devimpact init` first."
    );
    process.exit(1);
  }

  const res = await fetch(`${DEVIMPACT_API_BASE}/api/cli/status`, {
    headers: {
      "x-devimpact-cli-token": cfg.cliToken,
      "content-type": "application/json",
    },
  });

  if (res.status === 401) {
    throw new Error(
      "CLI token was rejected by the server. Try regenerating a token in DevImpact and re-running `devimpact init`."
    );
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to fetch CLI status (${res.status}). ${text || ""}`.trim()
    );
  }

  const { data } = await res.json();
  return data as CliStatus;
}

export type RepoSyncPayload = {
  repo: RepoMetadata;
  pulls: HydratedPr[];
  syncWindow: {
    startISO: string;
    endISO: string;
  };
  isLastBatch: boolean;
};

export async function postCliSync(payload: RepoSyncPayload) {
  const cfg = loadConfig();
  if (!cfg) {
    console.error(
      "❌ No DevImpact CLI config found. Run `devimpact init` first."
    );
    process.exit(1);
  }

  const res = await fetch(`${cfg.apiBaseUrl}/api/cli/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-DevImpact-CLI-Token": cfg.cliToken,
    },
    body: JSON.stringify({
      githubLogin: cfg.githubLogin,
      ...payload,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("❌ Sync failed:", res.status, text);
    process.exit(1);
  }

  return res.json();
}
