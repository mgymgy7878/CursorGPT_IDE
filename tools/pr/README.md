# PR Review Request and Merge Preparation Tool

## Overview

This tool automates the GitHub pull request review workflow by:

1. **Requesting reviews** from specified reviewers
2. **Adding status comments** to the PR with test results and next steps
3. **Preparing the PR for merge** with the specified merge method (squash, merge, or rebase)

## Prerequisites

- GitHub CLI (`gh`) must be installed and authenticated
- Node.js with TypeScript execution support (`tsx` or `npx tsx`)
- `GH_TOKEN` environment variable set (for GitHub Actions) or `gh auth login` (for local use)

## Usage

### From Configuration File

```bash
# Local usage (after gh auth login)
npx tsx tools/pr/request-review-and-prepare-merge.ts tools/pr/pr-25-config.json

# In GitHub Actions (with GH_TOKEN)
env GH_TOKEN=${{ github.token }} npx tsx tools/pr/request-review-and-prepare-merge.ts tools/pr/pr-25-config.json
```

### With Inline JSON

```bash
# Local usage
npx tsx tools/pr/request-review-and-prepare-merge.ts --json '{
  "action": "cursor.requestReviewAndPrepareMerge",
  "params": {
    "pr_number": 25,
    "reviewers": ["mgymgy7878"],
    "pr_comment": "Status update...",
    "merge_method": "squash"
  },
  "dryRun": false,
  "reason": "Automated workflow"
}'
```

### Dry Run Mode

To preview what the tool would do without making actual changes:

```bash
# Edit the config file to set "dryRun": true
# Or use inline JSON with dryRun flag
npx tsx tools/pr/request-review-and-prepare-merge.ts --json '{
  "params": {
    "pr_number": 25,
    "reviewers": ["mgymgy7878"],
    "pr_comment": "Test comment",
    "merge_method": "squash"
  },
  "dryRun": true
}'
```

## Configuration Schema

```json
{
  "action": "cursor.requestReviewAndPrepareMerge",
  "params": {
    "pr_number": 25,              // Required: PR number
    "reviewers": ["username"],     // Optional: List of GitHub usernames
    "pr_comment": "Comment text",  // Optional: Comment to add to PR
    "merge_method": "squash"       // Required: "merge", "squash", or "rebase"
  },
  "dryRun": false,                 // Optional: Preview mode (default: false)
  "confirm_required": false,       // Optional: Reserved for future use
  "reason": "Description"          // Optional: Reason for the action
}
```

## Merge Methods

- **`squash`**: Squash all commits into one and merge (recommended for feature branches)
- **`merge`**: Standard merge commit (preserves full history)
- **`rebase`**: Rebase and merge (linear history)

## Example: PR #25 Configuration

See `tools/pr/pr-25-config.json` for a complete example with:
- Review request for @mgymgy7878
- Status comment with test results
- Squash merge preparation
- Suggested merge message

## Workflow

1. **Review Request**: Adds specified users as reviewers on the PR
2. **Status Comment**: Posts a comment with test results and merge recommendations
3. **Merge Info**: Displays the command to use when ready to merge

After running this tool:
1. Wait for reviewer approval
2. Ensure all CI checks pass
3. Manually merge using: `gh pr merge <PR#> --squash` (or other method)

## Error Handling

The tool will fail if:
- PR number is invalid or not found
- PR has merge conflicts (`CONFLICTING` state)
- GitHub CLI is not authenticated
- Invalid merge method specified

## Security

- This tool does NOT automatically merge PRs
- It only requests reviews and adds comments
- Actual merge must be done manually or through other approved workflows
- All actions are logged to stdout for audit purposes

## Running in GitHub Actions

To use this tool in a GitHub Actions workflow, you need to set the `GH_TOKEN` environment variable:

```yaml
- name: Request PR Review
  env:
    GH_TOKEN: ${{ github.token }}
  run: |
    npx tsx tools/pr/request-review-and-prepare-merge.ts tools/pr/pr-25-config.json
```

See `.github/workflows/pr-automation-example.yml` for a complete example.

