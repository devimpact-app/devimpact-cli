import { hydratePullRequest } from "./gh/hydratePr";
import { searchAuthoredPrs, searchReviewedPrs } from "./gh/search";
import { runCommand } from "./utils";

export type SyncMode = "basic";

export type GhEndpointTemplate = {
  id: string;
  description: string;
  example: string;
};

// Central registry of gh api endpoints we use.
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

export async function syncRepoBasic(params: {
  repo: string;
  githubLogin: string;
  sinceISO: string;
}) {
  const { repo, githubLogin, sinceISO } = params;

  const [authored, reviewed] = await Promise.all([
    searchAuthoredPrs({ repo, author: githubLogin, sinceISO }),
    searchReviewedPrs({ repo, reviewer: githubLogin, sinceISO }),
  ]);

  const byNumber = new Map<number, (typeof authored)[number]>();
  for (const pr of [...authored, ...reviewed]) {
    byNumber.set(pr.number, pr);
  }

  const uniquePrs = Array.from(byNumber.values());

  const hydrated = await Promise.all(
    uniquePrs.map((pr) => hydratePullRequest(repo, pr))
  );

  return hydrated;
}

export type BasicSyncOptions = {
  explainOnly?: boolean;
  repos: string[];
};

export async function runBasicSync(options: BasicSyncOptions) {
  const { explainOnly = false, repos } = options;

  console.log("DevImpact sync-basic");

  if (!repos.length) {
    console.error(
      "❌ No repos specified.\n\n" +
        "Currently, DevImpact only syncs repos you explicitly list.\n" +
        "Try:\n" +
        "  devimpact sync-basic --repo myorg/service-api\n" +
        "or:\n" +
        "  devimpact sync-basic --repo myorg/service-api --repo myorg/frontend\n\n" +
        "If you want to keep repos in your config, you can export in your config (.bashrc/.zshrc or similar).\n" +
        "  export DEVIMPACT_REPOS='myorg/service-api,myorg/frontend'\n"
    );
    process.exit(1);
  }

  console.log(
    explainOnly
      ? "Running in explain-only mode. No GitHub API calls will be made.\n"
      : "This will use GitHub CLI (gh) to call a small set of REST endpoints.\n"
  );

  console.log("Planned GitHub API usage via `gh api`:\n");
  for (const endpoint of GH_ENDPOINTS) {
    console.log(`• ${endpoint.description}`);
    console.log(`  Example: ${endpoint.example}\n`);
  }

  if (explainOnly) {
    console.log(
      "No data was fetched or sent to DevImpact. This is just a preview of the integration."
    );
    return;
  }

  // TODO: get since ISO and github login

  // const allHydrated: any[] = [];

  // for (const repo of repos) {
  //   console.log(`▶ Syncing repo: ${repo}`);

  //   const hydratedPrs = await syncRepoBasic({
  //     repo,
  //     githubLogin,
  //     sinceISO,
  //   });

  //   console.log(`  ✓ Hydrated ${hydratedPrs.length} PRs from ${repo}\n`);

  //   allHydrated.push(...hydratedPrs);
  // }

  // console.log(
  //   `✅ Sync-basic complete. Total hydrated PRs: ${allHydrated.length}`
  // );

  // TODO: send to backend
}
