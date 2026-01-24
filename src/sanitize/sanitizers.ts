import {
  GitHubPRCommit,
  GitHubPRFile,
  GitHubReview,
  GitHubReviewComment,
  GitHubSearchPullRequest,
  GitHubTimelineEvent,
} from "../services/gh/types";
import { sanitizeText } from "./text";
import {
  SanitizedPR,
  SanitizedPRCommit,
  SanitizedPRFile,
  SanitizedPRReview,
  SanitizedPRReviewComment,
  SanitizedPRTimelineEvent,
} from "./types";

function pick<T extends Object, K extends keyof T>(
  obj: T,
  keys: readonly K[]
): Pick<T, K> {
  const out = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      out[key] = obj[key];
    }
  }
  return out;
}

export function sanitizePR(pr: GitHubSearchPullRequest): SanitizedPR {
  const base = pick(pr, [
    "id",
    "number",
    "title",
    "body",
    "state",
    "repoFullName",
    "created_at",
    "updated_at",
    "closed_at",
    "draft",
    "html_url",
  ] as const);

  return {
    ...base,
    title:
      sanitizeText(pr.title, { maxLength: 200, stripNewlines: true }) ?? "",
    body: sanitizeText(pr.body, { maxLength: 2000 }),
    user: pr.user ? { login: pr.user.login } : null,
    labels: pr.labels.map((label) =>
      pick(label, ["name", "color", "description"] as const)
    ),
    assignee: pr.assignee ? { login: pr.assignee.login } : null,
    assignees: pr.assignees?.map((a) => pick(a, ["login", "id"] as const)),
    milestone: pr.milestone
      ? pick(pr.milestone, ["title", "state"] as const)
      : null,
    pull_request: pr.pull_request
      ? pick(pr.pull_request, ["html_url", "merged_at"] as const)
      : undefined,
  };
}

export function sanitizePRFile(file: GitHubPRFile): SanitizedPRFile {
  const base = pick(file, [
    "filename",
    "previous_filename",
    "status",
    "additions",
    "deletions",
    "changes",
  ] as const);
  return base;
}

export function sanitizePRCommit(commit: GitHubPRCommit): SanitizedPRCommit {
  const base = pick(commit, ["sha", "html_url"] as const);
  return {
    ...base,
    commit: {
      author: commit.commit.author
        ? pick(commit.commit.author, ["date"])
        : null,
      committer: commit.commit.committer
        ? pick(commit.commit.committer, ["date"])
        : null,
    },
    author: commit.author ? pick(commit.author, ["login"]) : null,
    committer: commit.committer ? pick(commit.committer, ["login"]) : null,
  };
}

export function sanitizePRReview(review: GitHubReview): SanitizedPRReview {
  const base = pick(review, [
    "id",
    "body",
    "state",
    "pull_request_url",
    "submitted_at",
    "html_url",
  ] as const);
  return {
    ...base,
    body: sanitizeText(review.body, { maxLength: 2000 }),
    user: review.user ? pick(review.user, ["login"]) : null,
  };
}

export function sanitizePRReviewComment(
  comment: GitHubReviewComment
): SanitizedPRReviewComment {
  const base = pick(comment, [
    "id",
    "body",
    "pull_request_url",
    "pull_request_review_id",
    "created_at",
    "updated_at",
    "path",
    "in_reply_to_id",
    "html_url",
  ] as const);
  return {
    ...base,
    body: sanitizeText(comment.body, { maxLength: 2000 })!,
    user: pick(comment.user, ["login"]),
  };
}

export function sanitizePRTimelineEvent(
  event: GitHubTimelineEvent
): SanitizedPRTimelineEvent {
  const base = pick(event, [
    "id",
    "url",
    "created_at",
    "submitted_at",
    "html_url",
    "event",
  ] as const);
  let requestedTeam;
  if (event.requested_team) {
    requestedTeam = {
      slug: event.requested_team.slug,
      org: event.requested_team.organization?.login,
    };
  }
  return {
    ...base,
    user: event.user ? pick(event.user, ["login"]) : undefined,
    actor: event.actor ? pick(event.actor, ["login"]) : undefined,
    requested_reviewer: event.requested_reviewer
      ? pick(event.requested_reviewer, ["login"])
      : undefined,
    requested_team: requestedTeam,
  };
}
