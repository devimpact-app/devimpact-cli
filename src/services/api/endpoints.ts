import { loadConfig } from "../../config/config";
import { CliStatus } from "../../types";
import { HydratedPr } from "../gh/hydratePr";
import { RepoMetadata } from "../gh/repos";
import { fetchJson } from "./client";

export const DEVIMPACT_API_BASE =
  process.env.DEVIMPACT_API_BASE || "https://devimpact.app";

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
  return await fetchJson<LinkCliResponse>(
    `${DEVIMPACT_API_BASE}/api/cli/link`,
    {
      method: "POST",
      body: payload,
      timeoutMs: 20_000,
    }
  );
}

export async function getCliStatus(): Promise<CliStatus> {
  const cfg = loadConfig();
  if (!cfg)
    throw new Error(
      "No DevImpact CLI config found. Run `devimpact init` first."
    );

  try {
    const resp = await fetchJson<{ data: CliStatus }>(
      `${cfg.apiBaseUrl}/api/cli/status?includeRepoNames=true`,
      {
        headers: { "x-devimpact-cli-token": cfg.cliToken },
        timeoutMs: 20_000,
      }
    );
    return resp.data;
  } catch (e: any) {
    if (e?.status === 401) {
      throw new Error(
        "CLI token was rejected by the server. Try regenerating a token in DevImpact and re-running `devimpact init`."
      );
    }
    throw e;
  }
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
  if (!cfg)
    throw new Error(
      "No DevImpact CLI config found. Run `devimpact init` first."
    );

  return await fetchJson(`${cfg.apiBaseUrl}/api/cli/sync`, {
    method: "POST",
    headers: { "x-devimpact-cli-token": cfg.cliToken },
    body: { githubLogin: cfg.githubLogin, ...payload },
    timeoutMs: 60_000,
  });
}

export async function postAvailableRepos(repos: RepoMetadata[]) {
  const cfg = loadConfig();
  if (!cfg)
    throw new Error(
      "No DevImpact CLI config found. Run `devimpact init` first."
    );

  return await fetchJson(`${cfg.apiBaseUrl}/api/cli/repos`, {
    method: "POST",
    headers: { "x-devimpact-cli-token": cfg.cliToken },
    body: { githubLogin: cfg.githubLogin, repos },
    timeoutMs: 60_000,
  });
}
