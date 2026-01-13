export type HttpError = Error & {
  status?: number;
  url?: string;
  bodyText?: string;
};

function makeHttpError(
  message: string,
  info: { status?: number; url?: string; bodyText?: string }
): HttpError {
  const e = new Error(message) as HttpError;
  e.name = "HttpError";
  e.status = info.status;
  e.url = info.url;
  e.bodyText = info.bodyText;
  return e;
}

export async function fetchJson<T>(
  url: string,
  opts: {
    method?: "GET" | "POST";
    headers?: Record<string, string>;
    body?: unknown;
    timeoutMs?: number;
  } = {}
): Promise<T> {
  const method = opts.method ?? "GET";
  const timeoutMs = opts.timeoutMs ?? 30_000;

  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method,
      headers: {
        ...(opts.body !== undefined
          ? { "content-type": "application/json" }
          : {}),
        ...(opts.headers ?? {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: ac.signal,
    });

    const text = await res.text().catch(() => "");
    const json = (() => {
      try {
        return text ? JSON.parse(text) : null;
      } catch {
        return null;
      }
    })();

    if (!res.ok) {
      const msg =
        (json && (json.error || json.message)) ||
        text ||
        res.statusText ||
        `HTTP ${res.status}`;
      throw makeHttpError(msg, { status: res.status, url, bodyText: text });
    }

    return (json ?? ({} as any)) as T;
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw makeHttpError(`Request timed out after ${timeoutMs}ms`, { url });
    }
    throw err;
  } finally {
    clearTimeout(t);
  }
}
