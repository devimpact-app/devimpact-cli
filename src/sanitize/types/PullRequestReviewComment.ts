export interface SanitizedPRReviewComment {
  id: number;
  pull_request_review_id: number | null;
  path: string;
  in_reply_to_id?: number;
  user: {
    login: string;
  };
  body: string;
  created_at: string;
  updated_at: string;
  html_url: string;
  pull_request_url: string;
}
