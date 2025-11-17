/**
 * GitHub Timeline Event
 * Timeline includes ALL events on a PR (review requests, assignments, labels, etc.)
 * https://docs.github.com/en/rest/issues/timeline
 */
export interface GitHubTimelineEvent {
  id?: number;
  node_id?: string;
  url?: string;
  html_url?: string;
  user?: {
    login: string;
  };
  actor?: {
    login: string;
    id: number;
    avatar_url: string;
  };
  event?: string; // Type of event (see below)
  created_at?: string;
  submitted_at?: string;

  // Event-specific fields (depends on event type)
  // For review_requested:
  requested_reviewer?: {
    login: string;
    id: number;
  };
  // For review_request_removed:
  // (same structure)
}

/**
 * Common timeline event types we care about:
 * - "review_requested" - Someone requested a review
 * - "review_request_removed" - Review request was removed
 * - "reviewed" - Review was submitted
 * - "assigned" - Someone was assigned
 * - "labeled" - Label was added
 * - "commented" - Issue comment added
 * - "committed" - Commit added
 * - "merged" - PR was merged
 */
export type TimelineEventType =
  | "review_requested"
  | "review_request_removed"
  | "reviewed"
  | "assigned"
  | "labeled"
  | "commented"
  | "committed"
  | "merged"
  | string; // Allow other types
