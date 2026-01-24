# Data & Security – DevImpact CLI

## How DevImpact CLI talks to GitHub

All GitHub access happens **on your machine**, using the official `gh` CLI under your account. We never see your PAT or password.

The CLI runs commands equivalent to:

- `gh api /search/issues` – to find PRs you authored or reviewed or are requested on
- `gh api /repos/{owner}/{repo}/pulls/{number}/commits` – to list commits
- `gh api /repos/{owner}/{repo}/pulls/{number}/files` – to list files & sizes
- `gh api /repos/{owner}/{repo}/pulls/{number}/reviews` – to list reviews
- `gh api /repos/{owner}/{repo}/pulls/{number}/comments` – to list review comments
- `gh api /repos/{owner}/{repo}/issues/{number}/timeline` – to get PR timeline events

## What data leaves your machine

When `devimpact sync` sends data to the DevImpact backend, it includes
**No code contents or diffs**:

### Pull requests

We send:

- PR number
- title
- body
- state (open/closed/merged)
- timestamps (created/updated/merged)
- author login
- repo name / owner

We do **not** send:

- raw diff / patch
- full code contents

### Commits

We send:

- SHA
- author login
- commit timestamp
- GitHub HTML URL

We do **not** send:

- commit messages
- diff / patch
- file contents

### Files in the PR

We send:

- filename (e.g. `src/app/page.tsx`)
- additions / deletions / total changes
- status (added/modified/deleted)

We do **not** send:

- file contents
- patch hunks

### Reviews & review comments

We send:

- reviewer login
- state (approved, commented, changes_requested)
- timestamps
- review/comment body with max length constraint

### Repo metadata

We send:

- repo `id`, `owner`, `name`, `full_name`
- visibility (public/private/internal)
- `default_branch`
- primary language
- created / last pushed timestamps

We do **not** send:

- any code or file contents from the repo.

## How to stop DevImpact from accessing anything

- Run `gh auth logout` or remove the token used by `gh`.
- Stop running `devimpact sync`.
- Optionally, email us at ian@devimpact.app to delete your synced data.

## Vulnerabilities

Report vulnerabilities to: ian@devimpact.app
Do not open public issues with security concerns.
