#!/usr/bin/env tsx
/**
 * GitHub PR Review Request and Merge Preparation Tool
 * 
 * This tool automates the process of:
 * 1. Requesting reviews on a PR
 * 2. Adding status comments to the PR
 * 3. Preparing the PR for merge with specified method
 * 
 * Usage:
 *   tsx tools/pr/request-review-and-prepare-merge.ts <config.json>
 * 
 * Or with inline JSON:
 *   tsx tools/pr/request-review-and-prepare-merge.ts --json '<json-config>'
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { resolve } from 'path';

interface ActionConfig {
  action: string;
  params: {
    pr_number: number;
    reviewers: string[];
    pr_comment: string;
    merge_method: 'merge' | 'squash' | 'rebase';
  };
  dryRun?: boolean;
  confirm_required?: boolean;
  reason?: string;
}

/**
 * Execute a shell command and return its output
 */
function exec(command: string, dryRun = false): string {
  if (dryRun) {
    console.log(`[DRY RUN] Would execute: ${command}`);
    return '';
  }
  
  try {
    return execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
  } catch (error: any) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    throw error;
  }
}

/**
 * Request reviews on a PR
 */
function requestReviews(prNumber: number, reviewers: string[], dryRun = false): void {
  console.log(`\n📝 Requesting reviews on PR #${prNumber}...`);
  
  const reviewersArg = reviewers.join(',');
  const command = `gh pr edit ${prNumber} --add-reviewer ${reviewersArg}`;
  
  try {
    const output = exec(command, dryRun);
    if (!dryRun) {
      console.log(`✅ Successfully requested reviews from: ${reviewersArg}`);
    }
  } catch (error) {
    console.error(`❌ Failed to request reviews`);
    throw error;
  }
}

/**
 * Add a comment to a PR
 */
function addPRComment(prNumber: number, comment: string, dryRun = false): void {
  console.log(`\n💬 Adding comment to PR #${prNumber}...`);
  
  // Escape single quotes in the comment
  const escapedComment = comment.replace(/'/g, "'\\''");
  const command = `gh pr comment ${prNumber} --body '${escapedComment}'`;
  
  try {
    const output = exec(command, dryRun);
    if (!dryRun) {
      console.log(`✅ Comment added successfully`);
      console.log(`\nComment preview:\n${'-'.repeat(60)}`);
      console.log(comment);
      console.log('-'.repeat(60));
    }
  } catch (error) {
    console.error(`❌ Failed to add comment`);
    throw error;
  }
}

/**
 * Get PR information
 */
function getPRInfo(prNumber: number): any {
  const command = `gh pr view ${prNumber} --json number,title,state,isDraft,mergeable,reviewDecision,labels`;
  const output = exec(command);
  return JSON.parse(output);
}

/**
 * Display PR status summary
 */
function displayPRStatus(prInfo: any, mergeMethod: string): void {
  console.log('\n' + '='.repeat(70));
  console.log('📊 PR STATUS SUMMARY');
  console.log('='.repeat(70));
  console.log(`PR #${prInfo.number}: ${prInfo.title}`);
  console.log(`State: ${prInfo.state}`);
  console.log(`Draft: ${prInfo.isDraft ? 'Yes' : 'No'}`);
  console.log(`Mergeable: ${prInfo.mergeable}`);
  console.log(`Review Decision: ${prInfo.reviewDecision || 'Pending'}`);
  console.log(`Labels: ${prInfo.labels?.map((l: any) => l.name).join(', ') || 'None'}`);
  console.log(`Proposed Merge Method: ${mergeMethod}`);
  console.log('='.repeat(70));
}

/**
 * Main execution function
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: tsx tools/pr/request-review-and-prepare-merge.ts <config.json>');
    console.error('   or: tsx tools/pr/request-review-and-prepare-merge.ts --json \'<json-config>\'');
    process.exit(1);
  }
  
  let config: ActionConfig;
  
  // Parse config from file or JSON string
  if (args[0] === '--json' && args[1]) {
    config = JSON.parse(args[1]);
  } else {
    const configPath = resolve(args[0]);
    const configContent = readFileSync(configPath, 'utf-8');
    config = JSON.parse(configContent);
  }
  
  // Validate config
  if (!config.params || !config.params.pr_number) {
    console.error('❌ Error: Configuration must include params.pr_number');
    process.exit(1);
  }
  
  const { pr_number, reviewers, pr_comment, merge_method } = config.params;
  const dryRun = config.dryRun ?? false;
  
  console.log('\n🚀 PR Review Request and Merge Preparation Tool');
  console.log('='.repeat(70));
  
  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No actual changes will be made');
    console.log('='.repeat(70));
  }
  
  if (config.reason) {
    console.log(`\n📋 Reason: ${config.reason}`);
  }
  
  try {
    // Get current PR info
    const prInfo = getPRInfo(pr_number);
    displayPRStatus(prInfo, merge_method);
    
    // Validate PR is ready
    if (prInfo.state !== 'OPEN') {
      console.warn(`\n⚠️  Warning: PR is in ${prInfo.state} state`);
    }
    
    if (prInfo.mergeable === 'CONFLICTING') {
      console.error('\n❌ Error: PR has merge conflicts');
      process.exit(1);
    }
    
    // Request reviews
    if (reviewers && reviewers.length > 0) {
      requestReviews(pr_number, reviewers, dryRun);
    } else {
      console.log('\n⏭️  Skipping review request (no reviewers specified)');
    }
    
    // Add PR comment
    if (pr_comment) {
      addPRComment(pr_number, pr_comment, dryRun);
    } else {
      console.log('\n⏭️  Skipping comment (no comment specified)');
    }
    
    // Display merge preparation info
    console.log('\n' + '='.repeat(70));
    console.log('📦 MERGE PREPARATION');
    console.log('='.repeat(70));
    console.log(`Merge Method: ${merge_method}`);
    console.log(`\nWhen ready to merge, use:`);
    console.log(`  gh pr merge ${pr_number} --${merge_method}`);
    console.log('='.repeat(70));
    
    // Summary
    console.log('\n✅ SUCCESS: PR review request and preparation complete');
    console.log('\n📝 Next Steps:');
    console.log('  1. Wait for reviewer approval');
    console.log('  2. Ensure all checks pass');
    console.log(`  3. Merge using: gh pr merge ${pr_number} --${merge_method}`);
    
    if (dryRun) {
      console.log('\n⚠️  This was a DRY RUN - no changes were made');
    }
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
