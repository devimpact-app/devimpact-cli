import { getCliStatus, postCliSync } from "./api";
import { HydratedPr, hydratePullRequest } from "./gh/hydratePr";
import { getRepository, RepoMetadata } from "./gh/repos";
import { searchAuthoredPrs, searchReviewedPrs } from "./gh/search";

const MAX_PRS_PER_BATCH = 25;

export type GhEndpointTemplate = {
  id: string;
  description: string;
  example: string;
};

export const GH_ENDPOINTS: GhEndpointTemplate[] = [
  {
    id: "search_issues_prs",
    description: "Search for authored PRs in a given repo over a time window",
    example:
      'gh api /search/issues -X GET -f q="is:pr author:YOUR_LOGIN repo:OWNER/REPO updated:>=ISO_DATE"',
  },
  {
    id: "pulls_list_commits",
    description: "List commits for a PR",
    example:
      "gh api repos/OWNER/REPO/pulls/PR_NUMBER/commits -X GET --paginate",
  },
  {
    id: "pulls_list_files",
    description: "List files touched in a PR",
    example: "gh api repos/OWNER/REPO/pulls/PR_NUMBER/files -X GET --paginate",
  },
  {
    id: "pulls_list_reviews",
    description: "List code review submissions on a PR",
    example:
      "gh api repos/OWNER/REPO/pulls/PR_NUMBER/reviews -X GET --paginate",
  },
  {
    id: "pulls_list_review_comments",
    description: "List review comments (inline code comments) on a PR",
    example:
      "gh api repos/OWNER/REPO/pulls/PR_NUMBER/comments -X GET --paginate",
  },
  {
    id: "issues_list_events",
    description:
      "List timeline-style events for a PR (requested reviewers, label changes, etc.)",
    example:
      "gh api repos/OWNER/REPO/issues/PR_NUMBER/events -X GET --paginate",
  },
];

function chunkHydratedPrs(hydratedPrs: HydratedPr[]): HydratedPr[][] {
  const chunks: HydratedPr[][] = [];
  for (let i = 0; i < hydratedPrs.length; i += MAX_PRS_PER_BATCH) {
    chunks.push(hydratedPrs.slice(i, i + MAX_PRS_PER_BATCH));
  }
  return chunks;
}

export async function syncRepoBasic(params: {
  repoName: string;
  githubLogin: string;
  startISO: string;
}): Promise<{
  hydratedPrs: HydratedPr[];
  repo: RepoMetadata;
}> {
  const { repoName, githubLogin, startISO } = params;

  let repoMeta: RepoMetadata;
  try {
    repoMeta = await getRepository(repoName);
  } catch (err) {
    console.error(
      `There was an issue fetching repository metadata for ${repoName}: ${err}.\n` +
        "Are you sure you have access?"
    );
    process.exit(1);
  }

  const [authored, reviewed] = await Promise.all([
    searchAuthoredPrs({ repo: repoName, author: githubLogin, startISO }),
    searchReviewedPrs({ repo: repoName, reviewer: githubLogin, startISO }),
  ]);

  const byNumber = new Map<number, (typeof authored)[number]>();
  for (const pr of [...authored, ...reviewed]) {
    byNumber.set(pr.number, pr);
  }

  const uniquePrs = Array.from(byNumber.values());

  const hydrated = await Promise.all(
    uniquePrs.map((pr) => hydratePullRequest(repoName, pr))
  );

  return {
    hydratedPrs: hydrated,
    repo: repoMeta,
  };
}

export type BasicSyncOptions = {
  repos: string[];
  githubLogin: string;
};

export async function runBasicSync(options: BasicSyncOptions) {
  const { repos, githubLogin } = options;

  console.log("DevImpact sync");

  const status = await getCliStatus();
  if (!status.recommendedStartISO) {
    throw new Error("Server did not provide a recommended start time.");
  }

  const startISO = status.recommendedStartISO!;
  const endISO = new Date().toISOString();

  console.log(
    `Syncing DevImpact data from ${startISO} to ${endISO} for repos: ${repos.join(
      ", "
    )}`
  );

  for (const repoName of repos) {
    console.log(`Syncing repo: ${repoName}`);

    const { hydratedPrs, repo } = await syncRepoBasic({
      repoName: repoName,
      githubLogin,
      startISO,
    });

    console.log(`Hydrated ${hydratedPrs.length} PRs from ${repoName}\n`);
    if (hydratedPrs.length > 0) {
      console.log(`Pushing metadata from ${repoName} to DevImpact backend...`);

      const batches = chunkHydratedPrs(hydratedPrs);

      for (let i = 0; i < batches.length; i++) {
        const pullsBatch = batches[i];
        const isLastBatch = i === batches.length - 1;

        await postCliSync({
          syncWindow: { startISO, endISO },
          repo,
          pulls: pullsBatch,
          isLastBatch,
        });
      }
    }
  }
}
