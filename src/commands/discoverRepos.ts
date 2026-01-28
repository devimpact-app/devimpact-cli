import {
  DEVIMPACT_API_BASE,
  postAvailableRepos,
} from "../services/api/endpoints";
import { getRepositories } from "../services/gh/repos";
import { openInBrowser } from "./shared";
import readline from "node:readline";

const REPO_SELECTION_URL = `${DEVIMPACT_API_BASE}/onboarding/repos`;

function promptToOpenRepoSelection() {
  console.log(
    `\nNext step: choose which repos DevImpact should use.\n` +
      `You can do this in the web app here:\n\n  ${REPO_SELECTION_URL}\n`
  );

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question(
    "Press Enter to open this link in your browser now, or Ctrl+C to skip and do it later.\n",
    async () => {
      try {
        await openInBrowser(REPO_SELECTION_URL);
      } catch (err) {
        console.error(
          "\n⚠️ Failed to open browser automatically. You can still visit the link manually:"
        );
        console.error(`   ${REPO_SELECTION_URL}`);
      } finally {
        rl.close();
      }
    }
  );
}

export async function handleRepoDiscovery() {
  console.log(
    "\n🔍 Looking up your GitHub repos so you can pick which ones to sync.\n" +
      "This step only uses repo names and basic metadata.\n"
  );

  try {
    const repos = await getRepositories();

    if (!repos.length) {
      console.log(
        "⚠️ No repositories were found via gh. You can still pass --repo when running `devimpact sync`."
      );
    } else {
      console.log(`✓ Found ${repos.length} repos where you have access.`);

      await postAvailableRepos(repos);

      console.log("✓ Repo list ready");

      promptToOpenRepoSelection();
    }
  } catch (err) {
    console.error(
      "⚠️ Could not check repo metadata. This is optional — you can still configure repos manually with devimpact sync --repo <repo-name>."
    );
    console.error(err instanceof Error ? err.message : String(err));
  }
}
