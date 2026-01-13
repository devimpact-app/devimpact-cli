import fs from "fs";
import os from "os";
import path from "path";
import { isObject, safeIso, tryReadJson, writeJsonAtomic } from "./utils";

const STATE_PATH = path.join(os.homedir(), ".devimpact", "state.json");

export type DevImpactState = {
  lastAttemptAt?: string;
  lastSuccessAt?: string;
  lastErrorAt?: string;
  lastError?: string;
  lastExitCode?: number;
  backoffUntil?: string;
  consecutiveFailures?: number;
};

function nowSuffix() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function coerceState(raw: unknown): DevImpactState {
  if (!isObject(raw)) return {};

  const s: DevImpactState = {};

  if (typeof raw.lastAttemptAt === "string")
    s.lastAttemptAt = raw.lastAttemptAt;
  if (typeof raw.lastSuccessAt === "string")
    s.lastSuccessAt = raw.lastSuccessAt;
  if (typeof raw.lastErrorAt === "string") s.lastErrorAt = raw.lastErrorAt;
  if (typeof raw.lastError === "string") s.lastError = raw.lastError;
  if (typeof raw.backoffUntil === "string") s.backoffUntil = raw.backoffUntil;

  if (
    typeof raw.lastExitCode === "number" &&
    Number.isFinite(raw.lastExitCode)
  ) {
    s.lastExitCode = raw.lastExitCode;
  }
  if (
    typeof raw.consecutiveFailures === "number" &&
    Number.isFinite(raw.consecutiveFailures)
  ) {
    s.consecutiveFailures = raw.consecutiveFailures;
  }

  return s;
}

export function loadState(): DevImpactState {
  if (!fs.existsSync(STATE_PATH)) return {};

  try {
    const parsed = tryReadJson(STATE_PATH);
    if (parsed === null) throw new Error("parse_failed");
    return coerceState(parsed);
  } catch {
    try {
      const corruptPath = path.join(
        path.dirname(STATE_PATH),
        `state.corrupt.${nowSuffix()}.json`
      );
      fs.renameSync(STATE_PATH, corruptPath);
    } catch {
      // Ignore for now
    }
    return {};
  }
}

// Update whole state
export function saveState(next: DevImpactState) {
  writeJsonAtomic(STATE_PATH, next);
}

// Patch state
export function updateState(patch: Partial<DevImpactState>) {
  const current = loadState();
  const merged: DevImpactState = { ...current, ...patch };
  writeJsonAtomic(STATE_PATH, merged);
  return merged;
}

export function markAttemptStarted() {
  return updateState({
    lastAttemptAt: safeIso(),
  });
}

export function markAttemptSucceeded() {
  const current = loadState();
  return updateState({
    lastSuccessAt: safeIso(),
    lastExitCode: 0,
    lastError: undefined,
    lastErrorAt: undefined,
    backoffUntil: undefined,
    consecutiveFailures: 0,
    // keep lastAttemptAt as-is
    lastAttemptAt: current.lastAttemptAt ?? safeIso(),
  });
}

export function markAttemptFailed(opts: {
  error: string;
  exitCode?: number;
  backoffUntil?: string;
}) {
  const current = loadState();
  const nextFailures = (current.consecutiveFailures ?? 0) + 1;

  return updateState({
    lastErrorAt: safeIso(),
    lastError: opts.error,
    lastExitCode: typeof opts.exitCode === "number" ? opts.exitCode : 1,
    backoffUntil: opts.backoffUntil ?? current.backoffUntil,
    consecutiveFailures: nextFailures,
    lastAttemptAt: current.lastAttemptAt ?? safeIso(),
  });
}

export function resetState() {
  writeJsonAtomic(STATE_PATH, {});
}
