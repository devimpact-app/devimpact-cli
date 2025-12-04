/**
 * Sanitized PR commit metadata sent to the server.
 * No commit messages, no emails, no names, no URLs.
 */
export interface SanitizedPRCommit {
  sha: string;

  commit: {
    author: {
      date?: string;
    } | null;
    committer: {
      date?: string;
    } | null;
  };

  author:
    | {
        login: string;
      }
    | null
    | Record<string, never>;

  committer:
    | {
        login: string;
      }
    | null
    | Record<string, never>;

  html_url: string;
}
