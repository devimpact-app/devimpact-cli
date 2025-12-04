export interface SanitizedPR {
  id: number;
  number: number;
  title: string;
  body?: string | null;
  state: string;
  repoFullName: string;
  user: {
    login: string;
  } | null;
  labels: Array<{
    name?: string;
    color?: string;
    description?: string | null;
  }>;
  assignee: {
    login: string;
  } | null;
  assignees?: Array<{
    login: string;
    id: number;
  }> | null;
  milestone: {
    title: string;
    state: "open" | "closed";
  } | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  draft?: boolean;
  pull_request?: {
    html_url: string | null;
    merged_at?: string | null;
  };
  html_url: string;
}
