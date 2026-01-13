/**
 * GitHub Pull Request Review Comment
 * Line-specific code feedback, can be:
 * - Part of a formal review (has pull_request_review_id)
 * - Standalone quick comment (pull_request_review_id exists but review is auto-created)
 *
 * https://docs.github.com/en/rest/pulls/comments
 */
export interface GitHubReviewComment {
  id: number;
  node_id: string;
  pull_request_review_id: number | null; // Links to parent review
  diff_hunk: string; // Snippet of code being commented on
  path: string; // File path like "src/components/Button.tsx"
  position?: number; // Position in diff
  original_position?: number;
  commit_id: string;
  original_commit_id: string;
  in_reply_to_id?: number; // If replying to another comment

  user: {
    login: string;
    id: number;
    avatar_url: string;
  };

  body: string; // The actual comment text
  created_at: string;
  updated_at: string;
  html_url: string;
  pull_request_url: string;
  author_association:
    | "COLLABORATOR"
    | "CONTRIBUTOR"
    | "FIRST_TIMER"
    | "FIRST_TIME_CONTRIBUTOR"
    | "MANNEQUIN"
    | "MEMBER"
    | "NONE"
    | "OWNER";

  // Line information (where in the file)
  line?: number; // Current line number
  original_line?: number; // Original line number
  start_line?: number | null; // For multi-line comments
  original_start_line?: number | null;
  side?: "LEFT" | "RIGHT"; // Which side of diff (old vs new file)
  start_side?: "LEFT" | "RIGHT" | null;
}
