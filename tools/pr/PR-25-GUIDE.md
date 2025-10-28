# PR #25 - Review Request and Merge Preparation

This document describes the specific automation setup for PR #25 as per the requirements.

## Background

**PR #25 Status:**
- ✅ OPEN & MERGEABLE
- ✅ Labels: `UX-ACK`, `documentation`, `ready-for-review`
- ✅ PR Smoke: PASS (docs-only)
- ✅ Tests: Axe, Guard, Docs, LHCI, UI-D2 all PASS
- ❌ Guard Validate & route-200: Out of scope (tracked in #26)

## Configuration

The configuration for PR #25 is stored in `tools/pr/pr-25-config.json`:

```json
{
  "action": "cursor.requestReviewAndPrepareMerge",
  "params": {
    "pr_number": 25,
    "reviewers": ["mgymgy7878"],
    "pr_comment": "Final durum: ✅ PR Smoke PASS (docs-only). Axe/Guard/Docs/LHCI/UI-D2 PASS. ❌ Guard Validate & ❌ route-200 kapsam dışı; #26 ile takip. Onay sonrası **squash merge** önerilir.\nÖnerilen mesaj: `docs: add UI/UX plan & analysis report + ci: pr-smoke docs-only filter`",
    "merge_method": "squash"
  },
  "reason": "Branch policy gereği review akışını netleştirip onay sonrası hızlı kapanış"
}
```

## Recommended Merge Message

When merging PR #25, use:

```
docs: add UI/UX plan & analysis report + ci: pr-smoke docs-only filter
```

## Usage

### Option 1: Using the Tool Locally

If you have GitHub CLI authenticated:

```bash
# Dry-run first to preview
./tools/pr/run.sh 25 true

# Execute the actual request
./tools/pr/run.sh 25
```

### Option 2: Using GitHub Actions

Trigger the example workflow:

1. Go to Actions tab in GitHub
2. Select "PR Automation Example" workflow
3. Click "Run workflow"
4. Enter PR number: 25
5. Choose dry-run mode or actual execution

### Option 3: Direct Command

```bash
# With GitHub CLI authenticated
npx tsx tools/pr/request-review-and-prepare-merge.ts tools/pr/pr-25-config.json
```

## Next Steps After Running the Tool

1. ✅ Tool requests review from @mgymgy7878
2. ✅ Tool adds status comment to PR
3. ⏳ Wait for reviewer approval
4. ⏳ Ensure all CI checks pass
5. ✅ Ready to merge with squash method

## Manual Merge Command

Once approved and all checks pass:

```bash
gh pr merge 25 --squash --body "docs: add UI/UX plan & analysis report + ci: pr-smoke docs-only filter"
```

Or merge via GitHub UI with squash merge method.

## Tracking

- Known out-of-scope issues are tracked in #26
- This PR focuses on documentation and CI workflow updates
- No production code changes, so limited scope testing is appropriate
