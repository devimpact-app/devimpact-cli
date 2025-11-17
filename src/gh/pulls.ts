import { ghJson } from "./client";
import {
  GitHubPRCommit,
  GitHubPRFile,
  GitHubReview,
  GitHubReviewComment,
  GitHubTimelineEvent,
} from "./types";

export async function getPullCommits(
  repo: string,
  prNumber: number
): Promise<GitHubPRCommit[]> {
  return ghJson(
    [
      `repos/${repo}/pulls/${prNumber}/commits`,
      "-X",
      "GET",
      "-f",
      "per_page=100",
    ],
    {
      paginate: true,
    }
  );
}

export async function getPullFiles(
  repo: string,
  prNumber: number
): Promise<GitHubPRFile[]> {
  return ghJson(
    [
      `repos/${repo}/pulls/${prNumber}/files`,
      "-X",
      "GET",
      "-f",
      "per_page=100",
    ],
    {
      paginate: true,
    }
  );
}

export async function getPullReviews(
  repo: string,
  prNumber: number
): Promise<GitHubReview[]> {
  return ghJson(
    [
      `repos/${repo}/pulls/${prNumber}/reviews`,
      "-X",
      "GET",
      "-f",
      "per_page=100",
    ],
    {
      paginate: true,
    }
  );
}

export async function getPullReviewComments(
  repo: string,
  prNumber: number
): Promise<GitHubReviewComment[]> {
  return ghJson(
    [
      `repos/${repo}/pulls/${prNumber}/comments`,
      "-X",
      "GET",
      "-f",
      "per_page=100",
    ],
    {
      paginate: true,
    }
  );
}

export async function getPullRequestEvents(
  repo: string,
  prNumber: number
): Promise<GitHubTimelineEvent[]> {
  return ghJson(
    [
      `repos/${repo}/issues/${prNumber}/events`,
      "-X",
      "GET",
      "-f",
      "per_page=100",
    ],
    { paginate: true }
  );
}
