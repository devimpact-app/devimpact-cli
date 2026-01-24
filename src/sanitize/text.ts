export function sanitizeText(
  raw: string | null | undefined,
  opts?: {
    maxLength?: number;
    stripNewlines?: boolean;
  }
): string | null {
  if (!raw) return null;

  let text = raw;

  // Normalize newlines
  text = text.replace(/\r\n/g, "\n");

  // Strip ANSI escape codes
  text = text.replace(/\x1B\[[0-9;]*[A-Za-z]/g, "");

  // Strip control characters (except newline + tab)
  text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");

  // Turn newlines into spaces
  if (opts?.stripNewlines) {
    text = text.replace(/\n/g, " ");
  }

  // Truncate length
  const max = opts?.maxLength ?? 2000;
  if (text.length > max) {
    text = text.slice(0, max) + "…";
  }

  return text;
}
