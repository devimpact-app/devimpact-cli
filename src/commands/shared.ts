import { runCommand } from "../utils";
import readline from "node:readline";

export async function openInBrowser(url: string) {
  const platform = process.platform;

  if (platform === "darwin") {
    await runCommand(`open "${url}"`);
  } else if (platform === "win32") {
    await runCommand(`cmd /c start "" "${url}"`);
  } else {
    await runCommand(`xdg-open "${url}"`);
  }
}

export function printHelp() {
  console.log(`
    DevImpact CLI

    Usage:
      devimpact init --cli_token <YOUR_CLI_TOKEN>     Link this machine to your DevImpact account
      devimpact sync                                  Sync recent GitHub activity
      devimpact discover-repos                        Discover repos you have access to, so you can select in your DevImpact account
      devimpact explain                               See what data DevImpact accesses
      devimpact --version

    Examples:
      devimpact init --cli_token TEST_TOKEN
      devimpact sync --repo myorg/service-api
`);
}

export function printExplain() {
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

export function promptSelectAutosyncInterval(): Promise<null | number> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      [
        "",
        "Enable autosync on this Mac? (recommended)",
        "DevImpact will sync in the background when your computer is awake.",
        "",
        "  1) Every 2 hours (recommended)",
        "  2) Every 1 hour",
        "  3) Every 4 hours",
        "  4) Manual (no autosync)",
        "",
        "Choice [1-4]: ",
      ].join("\n"),
      (answer) => {
        rl.close();
        const a = String(answer || "").trim();
        if (a === "1") return resolve(120);
        if (a === "2") return resolve(60);
        if (a === "3") return resolve(240);
        return resolve(null);
      }
    );
  });
}
