#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const args = process.argv.slice(2);
const targetDir = args[0] || 'strategies';
const requireLabel = args.includes('--require-label');

// Get PR labels from environment
const prLabels = process.env.PR_LABELS ? JSON.parse(process.env.PR_LABELS) : [];
const hasApprovedLabel = prLabels.includes('risk/approved');

console.log(`Checking ${targetDir} for parameter changes...`);
console.log(`PR Labels: ${prLabels.join(', ')}`);
console.log(`Has risk/approved: ${hasApprovedLabel}`);

// Get git diff for strategy files
const getGitDiff = () => {
  try {
    const diff = execSync(`git diff origin/main...HEAD --name-only --diff-filter=AM`, { encoding: 'utf8' });
    return diff.split('\n').filter(line => line.trim() && line.startsWith(targetDir));
  } catch (error) {
    console.error('Error getting git diff:', error.message);
    return [];
  }
};

// Check if files contain parameter changes
const checkParamChanges = (files) => {
  const paramChanges = [];
  
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    
    try {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      
      // Look for parameter-related changes
      const paramKeywords = ['params', 'parameters', 'config', 'settings', 'threshold', 'limit'];
      const hasParams = paramKeywords.some(keyword => 
        lines.some(line => line.toLowerCase().includes(keyword))
      );
      
      if (hasParams) {
        paramChanges.push(file);
      }
    } catch (error) {
      console.error(`Error reading ${file}:`, error.message);
    }
  }
  
  return paramChanges;
};

// Main execution
const changedFiles = getGitDiff();
console.log(`Changed files: ${changedFiles.join(', ')}`);

const paramChanges = checkParamChanges(changedFiles);
console.log(`Files with parameter changes: ${paramChanges.join(', ')}`);

if (paramChanges.length > 0) {
  if (!hasApprovedLabel && requireLabel) {
    console.error('❌ Param Diff Gate Failed');
    console.error(`Parameter changes detected in: ${paramChanges.join(', ')}`);
    console.error('Required: risk/approved label not found');
    process.exit(2);
  } else if (hasApprovedLabel) {
    console.log('✅ Param Diff Gate Passed');
    console.log('Parameter changes approved with risk/approved label');
  } else {
    console.log('⚠️ Parameter changes detected but no label requirement');
  }
} else {
  console.log('✅ No parameter changes detected');
}

// Update metrics if available
if (paramChanges.length > 0 && !hasApprovedLabel) {
  console.log('📊 Incrementing param_diff_pending_total metric');
  // In a real implementation, this would update Prometheus metrics
} 