import { runCommand } from "../utils";

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
