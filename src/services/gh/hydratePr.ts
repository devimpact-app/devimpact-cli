import {
  sanitizePR,
  sanitizePRCommit,
  sanitizePRFile,
  sanitizePRReview,
  sanitizePRReviewComment,
  sanitizePRTimelineEvent,
} from "../../sanitize/sanitizers";
import {
  SanitizedPR,
  SanitizedPRCommit,
  SanitizedPRFile,
  SanitizedPRReview,
  SanitizedPRReviewComment,
  SanitizedPRTimelineEvent,
} from "../../sanitize/types";
import {
  getPullCommits,
  getPullFiles,
  getPullReviews,
  getPullReviewComments,
  getPullRequestEvents,
} from "./pulls";
import { GitHubSearchPullRequest } from "./types";

export type HydratedPr = {
  pr: SanitizedPR;
  commits: SanitizedPRCommit[];
  files: SanitizedPRFile[];
  reviews: SanitizedPRReview[];
  reviewComments: SanitizedPRReviewComment[];
  timelineEvents: SanitizedPRTimelineEvent[];
};

const MAX_FILES = 100;

function fileScore(f: SanitizedPRFile) {
  const adds = Number(f.additions ?? 0);
  const dels = Number(f.deletions ?? 0);
  const changes = Number(f.changes ?? adds + dels);
  return changes;
}

function capFiles(files: SanitizedPRFile[], max: number) {
  const sorted = [...files].sort((a, b) => fileScore(b) - fileScore(a));
  return sorted.slice(0, max);
}

export async function hydratePullRequest(
  repo: string,
  pr: GitHubSearchPullRequest
): Promise<HydratedPr> {
  const prNumber = pr.number;

  const [commits, files, reviews, reviewComments, timelineEvents] =
    await Promise.all([
      getPullCommits(repo, prNumber),
      getPullFiles(repo, prNumber),
      getPullReviews(repo, prNumber),
      getPullReviewComments(repo, prNumber),
      getPullRequestEvents(repo, prNumber),
    ]);

  return {
    pr: sanitizePR(pr),
    commits: commits.map((c) => sanitizePRCommit(c)),
    files: capFiles(
      files.map((f) => sanitizePRFile(f)),
      MAX_FILES
    ),
    reviews: reviews.map((r) => sanitizePRReview(r)),
    reviewComments: reviewComments.map((rc) => sanitizePRReviewComment(rc)),
    timelineEvents: timelineEvents.map((t) => sanitizePRTimelineEvent(t)),
  };
}
