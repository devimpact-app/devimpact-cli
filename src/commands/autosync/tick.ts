import fs from "fs";
import os from "os";
import path from "path";
import { loadConfig, saveConfig } from "../../config/config";
import { ensureDirExists } from "../../utils";
import { loadState, saveState } from "../../config/state";
import { runSync } from "../../services/sync/runSync";

type TickResult =
  | { action: "skipped"; reason: string }
  | { action: "ran"; ok: true; startedAt: string; finishedAt: string }
  | {
      action: "ran";
      ok: false;
      startedAt: string;
      finishedAt: string;
      error: string;
    };

const LOCK_PATH = path.join(
  os.homedir(),
  ".devimpact",
  "locks",
  "autosync.lock"
);

const DEFAULT_INTERVAL_MINUTES = 120;
const LOCK_STALE_MS = 1000 * 60 * 30; // 30 mins
const MAX_BACKOFF_MINUTES = 60 * 6; // 6 hours

function nowIso() {
  return new Date().toISOString();
}

function isLockStale(lockPath: string, staleMs: number) {
  try {
    const st = fs.statSync(lockPath);
    const age = Date.now() - st.mtimeMs;
    return age > staleMs;
  } catch {
    return false;
  }
}

function releaseLock(p: string = LOCK_PATH) {
  try {
    fs.unlinkSync(p);
  } catch {
    // ignore
  }
}

function computeBackoffUntil(consecutiveFailures: number): string {
  const minutes = Math.min(
    MAX_BACKOFF_MINUTES,
    Math.pow(2, Math.max(1, consecutiveFailures))
  );
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

function shouldDebounceByInterval(params: {
  lastSuccessAt?: string;
  intervalMinutes: number;
  nowMs: number;
}) {
  const { lastSuccessAt, intervalMinutes, nowMs } = params;
  if (!lastSuccessAt) return { debounce: false, remainingMs: 0 };

  const last = new Date(lastSuccessAt).getTime();
  if (Number.isNaN(last)) return { debounce: false, remainingMs: 0 };

  const nextAllowed = last + intervalMinutes * 60 * 1000;
  if (nowMs < nextAllowed) {
    return { debounce: true, remainingMs: nextAllowed - nowMs };
  }
  return { debounce: false, remainingMs: 0 };
}

function acquireLockOrSkip(): { ok: true } | { ok: false; reason: string } {
  ensureDirExists(LOCK_PATH);

  // If lock exists and is stale, clear it.
  if (fs.existsSync(LOCK_PATH) && isLockStale(LOCK_PATH, LOCK_STALE_MS)) {
    console.log(`[autosync] stale lock detected; removing ${LOCK_PATH}`);
    releaseLock();
  }

  try {
    // atomic create, fails if exists
    const fd = fs.openSync(LOCK_PATH, "wx");
    const payload = {
      pid: process.pid,
      createdAt: nowIso(),
      node: process.version,
    };
    fs.writeFileSync(fd, JSON.stringify(payload, null, 2), "utf8");
    fs.closeSync(fd);
    return { ok: true };
  } catch (e: any) {
    return { ok: false, reason: "lock_exists" };
  }
}

export async function autosyncTick(): Promise<TickResult> {
  const startedAt = nowIso();

  const cfg = loadConfig();
  if (!cfg) {
    return { action: "skipped", reason: "no_config" };
  }

  const autosync = cfg.autosync;
  if (!autosync || autosync.enabled !== true) {
    return { action: "skipped", reason: "autosync_disabled" };
  }

  if (!autosync.intervalMinutes || autosync.intervalMinutes < 15) {
    autosync.intervalMinutes = DEFAULT_INTERVAL_MINUTES;
    cfg.autosync = autosync;
    try {
      saveConfig(cfg);
    } catch {
      // best-effort
    }
  }

  const lock = acquireLockOrSkip();
  if (!lock.ok) {
    return { action: "skipped", reason: lock.reason };
  }

  try {
    const state = loadState() ?? {};
    const nowMs = Date.now();

    if (state.backoffUntil) {
      const untilMs = new Date(state.backoffUntil).getTime();
      if (!Number.isNaN(untilMs) && nowMs < untilMs) {
        console.log(`[autosync] backoff active until ${state.backoffUntil}`);
        return { action: "skipped", reason: "backoff_active" };
      }
    }
    const d = shouldDebounceByInterval({
      lastSuccessAt: state.lastSuccessAt,
      intervalMinutes: autosync.intervalMinutes,
      nowMs,
    });
    if (d.debounce) {
      console.log(
        `[autosync] debounced; next in ${(d.remainingMs / 60000).toFixed(1)}m`
      );
      return { action: "skipped", reason: "debounced_interval" };
    }

    // Update last attempt
    state.lastAttemptAt = startedAt;
    saveState(state);

    // run sync
    await runSync({
      githubLogin: cfg.githubLogin,
    });
    state.lastSuccessAt = nowIso();
    state.lastExitCode = 0;
    state.lastErrorAt = undefined;
    state.lastError = undefined;
    state.backoffUntil = undefined;
    state.consecutiveFailures = 0;
    saveState(state);

    return {
      action: "ran",
      ok: true,
      startedAt,
      finishedAt: state.lastSuccessAt,
    };
  } catch (err: any) {
    const finishedAt = nowIso();
    const state = loadState() ?? {};
    state.lastErrorAt = finishedAt;
    state.lastError = err?.message ? String(err.message) : String(err);
    state.lastExitCode = 1;
    state.consecutiveFailures = (state.consecutiveFailures ?? 0) + 1;
    state.backoffUntil = computeBackoffUntil(state.consecutiveFailures);
    saveState(state);
    return {
      action: "ran",
      ok: false,
      startedAt,
      finishedAt,
      error: state.lastError ?? "unknown_error",
    };
  } finally {
    releaseLock();
  }
}
