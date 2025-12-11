#!/usr/bin/env node

import { runCommand } from "./utils";
import {
  DEVIMPACT_API_BASE,
  linkCliToAccount,
  postAvailableRepos,
} from "./api";
import { runBasicSync } from "./sync";
import { loadConfig, saveConfig } from "./config";
import { getRepositories } from "./gh/repos";
import readline from "node:readline";

const pkg = require("../package.json") as { version: string };

const args = process.argv.slice(2);
const [command, ...rest] = args;

const REPO_SELECTION_URL = `${DEVIMPACT_API_BASE}/onboarding/repos`;

async function main() {
  if (command === "--version" || command === "-v") {
    console.log(`devimpact CLI v${pkg.version}`);
    process.exit(0);
  }
  switch (command) {
    case "init":
      await handleInit(rest);
      break;
    case "update-repos":
      await handleRepoDiscovery();
      break;
    case "sync":
      await handleSyncBasic(rest);
      break;
    case "explain":
      printExplain();
      break;

    case "help":
    case undefined:
      printHelp();
      break;

    default:
      console.error(`Unknown command: ${command}\n`);
      printHelp();
      process.exit(1);
  }
}

function printHelp() {
  console.log(`
DevImpact CLI

Usage:
  devimpact init --cli_token <YOUR_CLI_TOKEN>     Link this machine to your DevImpact account
  devimpact sync                                  Sync recent GitHub activity
  devimpact explain                               See what data DevImpact accesses
  devimpact --version

Examples:
  devimpact init --cli_token TEST_TOKEN
  devimpact sync --repo myorg/service-api
`);
}

function printExplain() {
  console.log(`
    DevImpact CLI

    When you run 'devimpact sync':

    - Calls: gh api /search/issues … (list authored/reviewed PRs)
    - Calls: gh api /repos/{owner}/{repo}/pulls/{number}/commits
    - Calls: gh api /repos/{owner}/{repo}/pulls/{number}/files
    - Calls: gh api /repos/{owner}/{repo}/pulls/{number}/reviews
    - Calls: gh api /repos/{owner}/{repo}/pulls/{number}/comments
    - Calls: gh api /repos/{owner}/{repo}/issues/{number}/timeline

    We send to DevImpact backend:

    - PR metadata (number, title, sanitized body, timestamps, author login)
    - File metadata (filename, additions/deletions)
    - Commit metadata (sha, author login, timestamp, html_url)
    - Review & comment bodies after sanitization

    We never send:
    - code or diff contents
    - commit messages
    - your GitHub PAT (we use gh auth only)
  `);
}

async function openInBrowser(url: string) {
  const platform = process.platform;

  if (platform === "darwin") {
    await runCommand(`open "${url}"`);
  } else if (platform === "win32") {
    await runCommand(`cmd /c start "" "${url}"`);
  } else {
    await runCommand(`xdg-open "${url}"`);
  }
}

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

async function handleInit(args: string[]) {
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
      repos: [],
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

async function handleRepoDiscovery() {
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
      console.log(`✓ Found ${repos.length} repos where you have write access.`);

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

async function handleSyncBasic(_args: string[]) {
  const cliRepos: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--repo" && args[i + 1]) {
      cliRepos.push(args[i + 1]);
      i++;
    }
  }

  let config = loadConfig();
  if (!config) {
    console.error("Need to run `devimpact init` first to set up the CLI.");
    process.exit(1);
  }

  await runBasicSync({
    repoOverrides: cliRepos.length > 0 ? cliRepos : undefined,
    githubLogin: config.githubLogin,
  });
}

main().catch((err) => {
  console.error("Unexpected error in DevImpact CLI:", err);
  process.exit(1);
});
