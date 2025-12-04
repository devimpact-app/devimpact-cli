export function sanitizeText(
  raw: string | null | undefined,
  opts?: {
    maxLength?: number;
    stripNewlines?: boolean;
  }
): string | null {
  if (!raw) return null;

  let text = raw;

  if (opts?.stripNewlines) {
    text = text.replace(/\r?\n/g, " ");
  }

  const max = opts?.maxLength ?? 2000;
  if (text.length > max) {
    text = text.slice(0, max) + "…";
  }

  return text;
}
