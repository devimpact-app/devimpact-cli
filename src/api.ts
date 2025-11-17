const DEVIMPACT_API_BASE =
  process.env.DEVIMPACT_API_BASE ?? "http://localhost:3000";

export type LinkCliRequest = {
  linkCode: string;
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
