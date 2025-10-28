/**
 * Basic smoke tests for PR automation tool
 * Tests configuration parsing and validation without requiring GitHub access
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('PR Automation Tool - Smoke Tests', () => {
  const configPath = resolve(__dirname, '../../tools/pr/pr-25-config.json');

  test('PR #25 configuration file exists and is valid JSON', () => {
    const configContent = readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configContent);
    
    expect(config).toBeDefined();
    expect(config.action).toBe('cursor.requestReviewAndPrepareMerge');
  });

  test('PR #25 configuration has required parameters', () => {
    const configContent = readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configContent);
    
    expect(config.params).toBeDefined();
    expect(config.params.pr_number).toBe(25);
    expect(config.params.reviewers).toEqual(['mgymgy7878']);
    expect(config.params.merge_method).toBe('squash');
  });

  test('PR #25 configuration has valid merge method', () => {
    const configContent = readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configContent);
    
    const validMethods = ['merge', 'squash', 'rebase'];
    expect(validMethods).toContain(config.params.merge_method);
  });

  test('PR #25 configuration includes status comment', () => {
    const configContent = readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configContent);
    
    expect(config.params.pr_comment).toBeDefined();
    expect(config.params.pr_comment.length).toBeGreaterThan(0);
    expect(config.params.pr_comment).toContain('PR Smoke PASS');
  });

  test('Dry-run configuration exists and has dryRun flag set', () => {
    const dryRunConfigPath = resolve(__dirname, '../../tools/pr/pr-25-dry-run-config.json');
    const configContent = readFileSync(dryRunConfigPath, 'utf-8');
    const config = JSON.parse(configContent);
    
    expect(config.dryRun).toBe(true);
  });
});
