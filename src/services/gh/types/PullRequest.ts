/**
 * GitHub Search Issue/PR Result
 * From: GET /search/issues (when searching for PRs)
 * https://docs.github.com/en/rest/search#search-issues-and-pull-requests
 *
 * Note: This is NOT the same as a full PR object from pulls.get
 * It's a simplified version returned by search
 */
export interface GitHubSearchPullRequest {
  id: number;
  node_id: string;
  number: number;
  title: string;
  body?: string | null;
  state: string;
  locked: boolean;
  repoFullName: string;

  user: {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    url: string;
    html_url: string;
    type: string;
    site_admin: boolean;
    user_view_type?: string;
  } | null;

  labels: Array<{
    id?: number;
    node_id?: string;
    url?: string;
    name?: string;
    color?: string;
    default?: boolean;
    description?: string | null;
  }>;

  assignee: {
    login: string;
    id: number;
  } | null;

  assignees?: Array<{
    login: string;
    id: number;
  }> | null;

  milestone: {
    id: number;
    number: number;
    title: string;
    description: string | null;
    state: "open" | "closed";
  } | null;

  comments: number;
  created_at: string;
  updated_at: string;
  closed_at: string | null;

  author_association:
    | "COLLABORATOR"
    | "CONTRIBUTOR"
    | "FIRST_TIMER"
    | "FIRST_TIME_CONTRIBUTOR"
    | "MANNEQUIN"
    | "MEMBER"
    | "NONE"
    | "OWNER";

  draft?: boolean;

  // PR-specific fields (only present when type=pr)
  pull_request?: {
    url: string | null;
    html_url: string | null;
    diff_url: string | null;
    patch_url: string | null;
    merged_at?: string | null;
  };

  // URLs
  url: string;
  repository_url: string;
  labels_url: string;
  comments_url: string;
  events_url: string;
  html_url: string;
  timeline_url?: string;

  // Search-specific
  score: number;

  // Reactions
  reactions?: {
    url: string;
    total_count: number;
    "+1": number;
    "-1": number;
    laugh: number;
    hooray: number;
    confused: number;
    heart: number;
    rocket: number;
    eyes: number;
  };

  active_lock_reason?: string | null;
  performed_via_github_app?: any | null;
  state_reason?: string | null;
}
