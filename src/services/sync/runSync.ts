import { getCliStatus, postCliSync } from "../api/endpoints";
import { HydratedPr, hydratePullRequest } from "../gh/hydratePr";
import { getRepository, RepoMetadata } from "../gh/repos";
import {
  searchAuthoredPrs,
  searchReviewedPrs,
  searchReviewRequestedPrs,
} from "../gh/search";

const MAX_PRS_PER_BATCH = 25;

export type Batch = {
  repo: RepoMetadata;
  pulls: HydratedPr[];
};

function chunkHydratedPrs(hydratedPrs: HydratedPr[]): HydratedPr[][] {
  const chunks: HydratedPr[][] = [];
  for (let i = 0; i < hydratedPrs.length; i += MAX_PRS_PER_BATCH) {
    chunks.push(hydratedPrs.slice(i, i + MAX_PRS_PER_BATCH));
  }
  return chunks;
}

export async function syncRepo(params: {
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

  const [authored, reviewed, requested] = await Promise.all([
    searchAuthoredPrs({ repo: repoName, author: githubLogin, startISO }),
    searchReviewedPrs({ repo: repoName, reviewer: githubLogin, startISO }),
    searchReviewRequestedPrs({
      repo: repoName,
      reviewer: githubLogin,
      startISO,
    }),
  ]);

  const byNumber = new Map<number, (typeof authored)[number]>();
  for (const pr of [...authored, ...reviewed, ...requested]) {
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

export type SyncOptions = {
  repoOverrides?: string[];
  githubLogin: string;
};

export async function runSync(options: SyncOptions) {
  const { repoOverrides, githubLogin } = options;

  console.log("DevImpact sync");

  try {
    const status = await getCliStatus();
    if (!status.recommendedStartISO) {
      console.error("Server did not provide a recommended start time.");
      throw new Error("Server did not provide a recommended start time.");
    }

    const startISO = status.recommendedStartISO!;
    const endISO = new Date().toISOString();

    // Decide on repos to sync
    let repos: string[] = [];
    if (repoOverrides) {
      repos = repoOverrides;
    } else {
      repos = status.selectedRepoNames ?? [];
    }

    if (!repos.length) {
      console.error(
        "No repositories have been selected yet.\n" +
          "\n" +
          "→ First, visit your DevImpact repo selection page:\n" +
          "     https://devimpact.app/onboarding/repos\n" +
          "   Choose the repos where you do most of your work, then try syncing again.\n" +
          "\n" +
          "If you prefer to sync a specific repo directly, you can bypass selection with:\n" +
          "   devimpact sync --repo owner/repo\n" +
          "\n" +
          "Example:\n" +
          "   devimpact sync --repo myorg/service-api\n"
      );
      process.exit(1);
    }

    console.log(
      `Syncing DevImpact data from ${startISO} to ${endISO} for repos: ${repos.join(
        ", "
      )}`
    );

    let pendingBatch: Batch | null = null;
    for (const repoName of repos) {
      console.log(`Syncing repo: ${repoName}`);

      const { hydratedPrs, repo } = await syncRepo({
        repoName: repoName,
        githubLogin,
        startISO,
      });

      console.log(`Hydrated ${hydratedPrs.length} PRs from ${repoName}\n`);
      if (hydratedPrs.length > 0) {
        console.log(
          `Pushing metadata from ${repoName} to DevImpact backend...`
        );

        const batches = chunkHydratedPrs(hydratedPrs);

        for (let i = 0; i < batches.length; i++) {
          const pullsBatch = batches[i];
          if (!pendingBatch) {
            // first batch overall
            pendingBatch = { repo, pulls: pullsBatch };
          } else {
            // we already have a pending batch: flush it *without* last flag,
            // then replace it with the current one
            await postCliSync({
              syncWindow: { startISO, endISO },
              repo: pendingBatch.repo,
              pulls: pendingBatch.pulls,
              isLastBatch: false,
            });

            pendingBatch = { repo, pulls: pullsBatch };
          }
        }
      }
    }

    if (pendingBatch) {
      await postCliSync({
        syncWindow: { startISO, endISO },
        repo: pendingBatch.repo,
        pulls: pendingBatch.pulls,
        isLastBatch: true,
      });
    } else {
      console.log(
        "No PR activity found in the selected repos for this window; nothing to sync."
      );
    }
  } catch (e) {
    console.error("Error occurred running sync", e);
    throw e;
  }
}
