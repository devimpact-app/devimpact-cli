#!/usr/bin/env node

import { handleRepoDiscovery } from "./commands/discoverRepos";
import { handleInit } from "./commands/init";
import { printExplain, printHelp } from "./commands/shared";
import { handleSync } from "./commands/sync";

const pkg = require("../package.json") as { version: string };

const args = process.argv.slice(2);
const [command, ...rest] = args;

async function main() {
  if (command === "--version" || command === "-v") {
    console.log(`devimpact CLI v${pkg.version}`);
    process.exit(0);
  }
  switch (command) {
    case "init":
      await handleInit(rest);
      break;
    case "discover-repos":
      await handleRepoDiscovery();
      break;
    case "sync":
      await handleSync(rest);
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

main().catch((err) => {
  console.error("Unexpected error in DevImpact CLI:", err);
  process.exit(1);
});
