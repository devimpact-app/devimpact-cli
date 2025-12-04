/**
 * Sanitized PR file metadata sent to the server.
 * No file contents, no raw URLs, no patch/diff.
 */
export interface SanitizedPRFile {
  filename: string; // e.g. "src/app/page.tsx"
  status:
    | "added"
    | "removed"
    | "modified"
    | "renamed"
    | "copied"
    | "changed"
    | "unchanged";
  additions: number;
  deletions: number;
  changes: number;
  previous_filename?: string;
}
