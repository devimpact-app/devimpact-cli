import { saveConfig } from "../config/config";
import {
  DEVIMPACT_API_BASE,
  linkCliToAccount,
} from "../services/api/endpoints";
import { runCommand } from "../utils";
import { handleRepoDiscovery } from "./discoverRepos";
import { printHelp } from "./shared";

export async function handleInit(args: string[]) {
  const cliTokenIndex = args.indexOf("--cli-token");
  const cliToken = cliTokenIndex >= 0 ? args[cliTokenIndex + 1] : undefined;
  const noRepoScan = args.includes("--no-repo-scan");

  if (!cliToken) {
    console.error("Error: --cli-token CODE is required\n");
    printHelp();
    process.exit(1);
  }

  console.log("🔗 Linking this machine with DevImpact…");

  try {
    const { stdout } = await runCommand("gh --version");
    const firstLine = stdout.split("\n")[0];
    console.log(`✓ GitHub CLI detected: ${firstLine}`);
  } catch (err) {
    console.error(
      "❌ GitHub CLI (gh) not found. Install it first: https://cli.github.com/"
    );
    process.exit(1);
  }

  try {
    const { stdout } = await runCommand("gh auth status");
    console.log("✓ gh is authenticated");
  } catch (err) {
    console.error(
      "❌ gh is not authenticated. Run `gh auth login` first, then re-run `devimpact init`."
    );
    process.exit(1);
  }

  let githubLogin: string;
  try {
    const { stdout } = await runCommand('gh api /user --jq ".login"');
    githubLogin = stdout.trim();

    if (!githubLogin) {
      console.error(
        "❌ Could not determine GitHub username from gh. Is your auth configured correctly?"
      );
      process.exit(1);
    }

    console.log(`✓ Authenticated as GitHub user: ${githubLogin}`);
  } catch (err) {
    console.error("❌ Failed to read GitHub user via `gh api /user`:");
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  console.log("\n→ Linking with DevImpact…");

  try {
    const resp = await linkCliToAccount({
      cliToken,
      githubLogin,
    });

    if (!resp.ok) {
      console.error("❌ Backend responded with ok=false");
      if (resp.message) console.error("   ", resp.message);
      process.exit(1);
    }

    console.log("✅ Linked to DevImpact successfully.");
    if (resp.tenantId) {
      console.log(`   Tenant: ${resp.tenantId}`);
    }

    saveConfig({
      apiBaseUrl: DEVIMPACT_API_BASE,
      cliToken,
      githubLogin,
    });
  } catch (err) {
    console.error("❌ Failed to link with DevImpact backend:");
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  if (noRepoScan) {
    console.log(
      "\n⚙️  Skipping repo discovery because --no-repo-scan was provided.\n" +
        "You can configure repos manually later with:\n" +
        "  devimpact sync --repo owner/repo"
    );

    process.exit(0);
  }

  await handleRepoDiscovery();
}
