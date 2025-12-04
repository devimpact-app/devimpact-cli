export interface SanitizedPRTimelineEvent {
  id?: number;
  url?: string;
  html_url?: string;
  user?: {
    login: string;
  };
  actor?: {
    login: string;
  };
  event?: string; // Type of event (see below)
  created_at?: string;
  submitted_at?: string;

  requested_reviewer?: {
    login: string;
  };
  requested_team?: {
    slug: string;
    org?: string;
  };
}
