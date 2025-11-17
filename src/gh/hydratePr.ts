import {
  getPullCommits,
  getPullFiles,
  getPullReviews,
  getPullReviewComments,
  getPullRequestEvents,
} from "../gh/pulls";
import {
  GitHubPRCommit,
  GitHubPRFile,
  GitHubReview,
  GitHubReviewComment,
  GitHubSearchPullRequest,
  GitHubTimelineEvent,
} from "./types";

export type HydratedPr = {
  core: GitHubSearchPullRequest;
  repo: string;
  commits: GitHubPRCommit[];
  files: GitHubPRFile[];
  reviews: GitHubReview[];
  reviewComments: GitHubReviewComment[];
  timelineEvents: GitHubTimelineEvent[];
};

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
    core: pr,
    repo,
    commits,
    files,
    reviews,
    reviewComments,
    timelineEvents,
  };
}
