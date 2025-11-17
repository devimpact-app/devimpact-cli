#!/usr/bin/env node

import { runCommand } from "./utils";
import { linkCliToAccount } from "./api";
import { runBasicSync } from "./sync";

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
  const linkFlagIndex = args.indexOf("--link");
  const linkCode = linkFlagIndex >= 0 ? args[linkFlagIndex + 1] : undefined;

  if (!linkCode) {
    console.error("Error: --link CODE is required\n");
    printHelp();
    process.exit(1);
  }

  console.log("🔗 Linking this machine with DevImpact…");
  console.log(`   link code: ${linkCode}`);

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
      linkCode,
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
  const explainOnly = args.includes("--explain") || args.includes("--dry-run");

  const repos: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--repo" && args[i + 1]) {
      repos.push(args[i + 1]);
      i++; // skip next
    }
  }

  if (!repos.length && process.env.DEVIMPACT_REPOS) {
    repos.push(
      ...process.env.DEVIMPACT_REPOS.split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    );
  }

  await runBasicSync({ explainOnly, repos });
}

main().catch((err) => {
  console.error("Unexpected error in DevImpact CLI:", err);
  process.exit(1);
});
