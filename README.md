# DevImpact CLI

The DevImpact CLI securely connects your local GitHub activity to the DevImpact dashboard.
It uses your local GitHub authentication (via the GitHub CLI) and only accesses the repositories you explicitly provide.

# Prerequisites

Before installing, make sure you have:
• Node 18+
• GitHub CLI (gh) installed and authenticated
`gh auth status`

# Installation

Install globally from npm

```sh
npm install -g @devimpact/cli
```

Verify installation

```sh
devimpact --version
```

# Getting Started

1. Go to your DevImpact account and generate a CLI token.
2. Run:

```sh
devimpact init --cli-token <YOUR_CLI_TOKEN>
```

This securely links your CLI to your DevImpact account.
The token is hashed locally and never stored in plain text.

# Syncing Activity

Use the sync command to fetch GitHub pull request data and push it to your DevImpact account:

```sh
devimpact sync --repo owner/repo
```

You can provide multiple repositories

```sh
devimpact sync --repo org/frontend --repo org/api --repo org/mobile
```

If you use the same repos regularly, the CLI will remember them.

# Permissions and privacy

The CLI uses your local GitHub CLI authentication, so DevImpact never sees your PAT or OAuth token.

The CLI only accesses:
• The repositories you explicitly pass via --repo.
• Pull requests you authored or reviewed.
• Standard PR metadata: commits, file metadata (no code contents), reviews, review comments, and timeline events.

No other GitHub data is accessed.

You can inspect or delete your local DevImpact config at:

```sh
~/.config/devimpact/config.json
```

# Uninstall

To remove the CLI:

```sh
npm uninstall -g @devimpact/cli
```

# License

MIT
