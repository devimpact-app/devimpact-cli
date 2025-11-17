/**
 * GitHub Pull Request File
 * Files changed in a PR with line-level stats
 * https://docs.github.com/en/rest/pulls/pulls#list-pull-requests-files
 */
export interface GitHubPRFile {
  sha: string | null;
  filename: string; // Full path like "src/components/Button.tsx"
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
  blob_url: string;
  raw_url: string;
  contents_url: string;
  patch?: string; // Code diff (we don't need this, but it's available)
  previous_filename?: string; // If renamed, what was the old name
}
