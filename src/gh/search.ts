import { ghJson } from "./client";
import { GitHubSearchPullRequest } from "./types";

export async function searchAuthoredPrs(params: {
  repo: string;
  author: string;
  startISO: string;
}): Promise<GitHubSearchPullRequest[]> {
  const q = `is:pr author:${params.author} repo:${params.repo} updated:>=${params.startISO}`;

  const res = await ghJson([
    "/search/issues",
    "-X",
    "GET",
    "-f",
    `q=${q}`,
    "-f",
    "sort=updated",
    "-f",
    "order=desc",
    "-f",
    "per_page=100",
  ]);

  return res.items as GitHubSearchPullRequest[];
}

export async function searchReviewedPrs(params: {
  repo: string;
  reviewer: string;
  startISO: string;
}): Promise<GitHubSearchPullRequest[]> {
  const q = `is:pr -author:${params.reviewer} reviewed-by:${params.reviewer} repo:${params.repo} updated:>=${params.startISO}`;

  const res = await ghJson([
    "/search/issues",
    "-X",
    "GET",
    "-f",
    `q=${q}`,
    "-f",
    "sort=updated",
    "-f",
    "order=desc",
    "-f",
    "per_page=100",
  ]);

  return res.items as GitHubSearchPullRequest[];
}
