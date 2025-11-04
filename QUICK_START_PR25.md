# Quick Start: Execute PR #25 Review Request

This guide provides the quickest path to execute the PR review request and merge preparation for PR #25 as specified in the problem statement.

## Prerequisites

Ensure GitHub CLI is authenticated:
```bash
gh auth status
# If not authenticated:
gh auth login
```

## Execute the Action (Recommended Approach)

### Step 1: Dry Run (Preview)

First, run in dry-run mode to preview what will happen:

```bash
cd /home/runner/work/CursorGPT_IDE/CursorGPT_IDE
npx tsx tools/pr/request-review-and-prepare-merge.ts tools/pr/pr-25-dry-run-config.json
```

Expected output:
- Shows PR #25 status
- Preview of review request to @mgymgy7878
- Preview of status comment
- Merge preparation info

### Step 2: Actual Execution

If dry-run looks good, execute for real:

```bash
cd /home/runner/work/CursorGPT_IDE/CursorGPT_IDE
npx tsx tools/pr/request-review-and-prepare-merge.ts tools/pr/pr-25-config.json
```

This will:
1. ✅ Request review from @mgymgy7878
2. ✅ Add this comment to PR #25:
   ```
   Final durum: ✅ PR Smoke PASS (docs-only). Axe/Guard/Docs/LHCI/UI-D2 PASS. 
   ❌ Guard Validate & ❌ route-200 kapsam dışı; #26 ile takip. 
   Onay sonrası **squash merge** önerilir.
   Önerilen mesaj: `docs: add UI/UX plan & analysis report + ci: pr-smoke docs-only filter`
   ```
3. ✅ Display merge preparation info

### Step 3: After Review Approval

Once @mgymgy7878 approves the PR and all checks pass:

```bash
gh pr merge 25 --squash --body "docs: add UI/UX plan & analysis report + ci: pr-smoke docs-only filter"
```

## Alternative: Using Shell Wrapper

```bash
# Dry run
./tools/pr/run.sh 25 true

# Actual execution
./tools/pr/run.sh 25
```

## Alternative: GitHub Actions

Trigger the workflow manually:
1. Go to Actions tab
2. Select "PR Automation Example"
3. Click "Run workflow"
4. Enter: PR number = 25, Dry run = false
5. Click "Run workflow"

## Troubleshooting

### Error: "GH_TOKEN not set"
In GitHub Actions environment, ensure:
```yaml
env:
  GH_TOKEN: ${{ github.token }}
```

### Error: "gh: command not found"
GitHub CLI is not installed. Install from: https://cli.github.com/

### Error: "PR has merge conflicts"
Resolve conflicts first before running the tool.

## Configuration Details

The action configuration being executed:
```json
{
  "action": "cursor.requestReviewAndPrepareMerge",
  "params": {
    "pr_number": 25,
    "reviewers": ["mgymgy7878"],
    "pr_comment": "Final durum: ✅ PR Smoke PASS (docs-only). Axe/Guard/Docs/LHCI/UI-D2 PASS. ❌ Guard Validate & ❌ route-200 kapsam dışı; #26 ile takip. Onay sonrası **squash merge** önerilir.\nÖnerilen mesaj: `docs: add UI/UX plan & analysis report + ci: pr-smoke docs-only filter`",
    "merge_method": "squash"
  },
  "dryRun": false,
  "reason": "Branch policy gereği review akışını netleştirip onay sonrası hızlı kapanış"
}
```

## Expected Timeline

1. **Now**: Execute tool → Review requested + Comment added (< 1 min)
2. **Next**: @mgymgy7878 reviews PR (depends on reviewer)
3. **Then**: CI checks complete (automatic)
4. **Finally**: Manual merge with squash method (< 1 min)

## Success Criteria

After running the tool, verify:
- [ ] @mgymgy7878 appears in the reviewers list
- [ ] Status comment is visible on PR #25
- [ ] PR shows "ready for review" status
- [ ] No errors in tool output

## Support

For detailed documentation:
- Tool documentation: `tools/pr/README.md`
- PR #25 guide: `tools/pr/PR-25-GUIDE.md`
- Implementation details: `IMPLEMENTATION_SUMMARY.md`
