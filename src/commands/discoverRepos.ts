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
    "\n🔍 Scanning your GitHub repos via gh to help you choose what to sync…\n" +
      "For this step, we only collect lightweight metadata (org/repo name, visibility, last pushed time).\n"
  );

  try {
    const repos = await getRepositories();

    if (!repos.length) {
      console.log(
        "⚠️ No writable repositories were found via gh. You can still pass --repo when running `devimpact sync`."
      );
    } else {
      console.log(`✓ Found ${repos.length} repos where you have access.`);

      await postAvailableRepos(repos);

      console.log("✓ Sent repo metadata to DevImpact");

      promptToOpenRepoSelection();
    }
  } catch (err) {
    console.error(
      "⚠️ Could not scan or upload repo metadata. This is optional — you can still configure repos manually with --repo."
    );
    console.error(err instanceof Error ? err.message : String(err));
  }
}
