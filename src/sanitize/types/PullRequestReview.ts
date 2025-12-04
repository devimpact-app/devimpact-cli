/**
 * Sanitized GitHub Pull Request Review
 */
export interface SanitizedPRReview {
  id: number;
  user: {
    login: string;
  } | null;
  body: string | null; // Overall review comment (can be empty for COMMENTED state)
  state: string;
  html_url: string;
  pull_request_url: string;
  submitted_at?: string | null;
}
