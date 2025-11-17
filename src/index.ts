#!/usr/bin/env node

import { runCommand } from "./utils";
import { DEVIMPACT_API_BASE, linkCliToAccount } from "./api";
import { runBasicSync } from "./sync";
import { loadConfig, saveConfig } from "./config";

const args = process.argv.slice(2);
const [command, ...rest] = args;

async function main() {
  switch (command) {
    case "init":
      await handleInit(rest);
      break;

    case "sync-basic":
      await handleSyncBasic(rest);
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
  devimpact init --link CODE     Link this machine to your DevImpact account
  devimpact sync-basic           Sync recent GitHub activity (stub)

Examples:
  devimpact init --link ALPHA2025
  devimpact sync-basic
`);
}

async function handleInit(args: string[]) {
  const cliTokenIndex = args.indexOf("--cli-token");
  const cliToken = cliTokenIndex >= 0 ? args[cliTokenIndex + 1] : undefined;

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

    console.log(
      "\nNext step: run `devimpact sync-basic` to sync recent GitHub activity."
    );
  } catch (err) {
    console.error("❌ Failed to link with DevImpact backend:");
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
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

  let effectiveRepos: string[] = cliRepos.length ? cliRepos : config.repos;
  if (!effectiveRepos.length) {
    console.error(
      "No repositories configured. Use --repo owner/repo to specify at least one repository.\n" +
        "Example: devimpact sync-basic --repo myorg/service-api\n" +
        "Once you've run that, you can omit --repo next time to use the saved list."
    );
    process.exit(1);
  }

  if (!config.repos.length) {
    config.repos = effectiveRepos;
    saveConfig(config);
  }

  await runBasicSync({
    repos: effectiveRepos,
    githubLogin: config.githubLogin,
  });
}

main().catch((err) => {
  console.error("Unexpected error in DevImpact CLI:", err);
  process.exit(1);
});
