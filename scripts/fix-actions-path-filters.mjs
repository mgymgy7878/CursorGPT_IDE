#!/usr/bin/env node
/**
 * Fix GitHub Actions workflow files: remove paths-ignore when paths exists in same event
 * Policy: Keep paths, remove paths-ignore (paths is more specific)
 */

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, '..');

async function main() {
  const workflowFiles = await glob('.github/workflows/**/*.yml', {
    cwd: repoRoot,
    absolute: true,
  });

  let fixedCount = 0;

  for (const file of workflowFiles) {
    const content = readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    const newLines = [];
    let inEventBlock = false;
    let currentEvent = null;
    let hasPaths = false;
    let hasPathsIgnore = false;
    let pathsIgnoreStart = -1;
    let pathsIgnoreEnd = -1;
    let indentLevel = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Detect event block start (on: or event name)
      if (trimmed.startsWith('on:') || (trimmed.endsWith(':') && !trimmed.includes(' ') && i > 0 && lines[i - 1].trim() === 'on:')) {
        inEventBlock = true;
        if (trimmed !== 'on:') {
          currentEvent = trimmed.replace(':', '');
        }
        newLines.push(line);
        continue;
      }

      // Detect event name (push:, pull_request:, etc.)
      if (inEventBlock && trimmed.endsWith(':') && !trimmed.startsWith('paths') && !trimmed.startsWith('#') && trimmed.length < 30) {
        // Reset for new event
        if (hasPaths && hasPathsIgnore) {
          // Remove paths-ignore block
          for (let j = pathsIgnoreStart; j <= pathsIgnoreEnd; j++) {
            // Skip this line
          }
          pathsIgnoreStart = -1;
          pathsIgnoreEnd = -1;
          hasPathsIgnore = false;
        }
        hasPaths = false;
        hasPathsIgnore = false;
        currentEvent = trimmed.replace(':', '');
        newLines.push(line);
        continue;
      }

      // Detect paths:
      if (inEventBlock && trimmed.startsWith('paths:')) {
        hasPaths = true;
        newLines.push(line);
        continue;
      }

      // Detect paths-ignore:
      if (inEventBlock && trimmed.startsWith('paths-ignore:')) {
        hasPathsIgnore = true;
        pathsIgnoreStart = i;
        pathsIgnoreEnd = i;
        // Find end of paths-ignore block
        const currentIndent = line.match(/^(\s*)/)[1].length;
        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j];
          if (nextLine.trim() === '') {
            pathsIgnoreEnd = j;
            continue;
          }
          const nextIndent = nextLine.match(/^(\s*)/)?.[1]?.length || 0;
          if (nextIndent <= currentIndent && nextLine.trim() !== '') {
            pathsIgnoreEnd = j - 1;
            break;
          }
          pathsIgnoreEnd = j;
        }
        // Skip paths-ignore block if paths exists
        if (hasPaths) {
          i = pathsIgnoreEnd;
          continue;
        }
        newLines.push(line);
        continue;
      }

      // Check if we're leaving event block
      if (inEventBlock && trimmed && !line.match(/^\s{2,}/) && !trimmed.startsWith('#') && trimmed !== '') {
        // Reset state when leaving event block
        if (hasPaths && hasPathsIgnore) {
          // Already handled above
        }
        inEventBlock = false;
        hasPaths = false;
        hasPathsIgnore = false;
        currentEvent = null;
      }

      newLines.push(line);
    }

    // Final check: if we ended with both, remove paths-ignore
    if (hasPaths && hasPathsIgnore && pathsIgnoreStart >= 0) {
      const filtered = newLines.filter((_, idx) => {
        const originalIdx = newLines.indexOf(newLines[idx]);
        return originalIdx < pathsIgnoreStart || originalIdx > pathsIgnoreEnd;
      });
      newLines.length = 0;
      newLines.push(...filtered);
    }

    const newContent = newLines.join('\n');
    if (newContent !== content) {
      writeFileSync(file, newContent, 'utf-8');
      console.log(`✅ Fixed: ${file.replace(repoRoot, '.')}`);
      fixedCount++;
    }
  }

  if (fixedCount === 0) {
    console.log('✅ No workflow files needed fixing');
  } else {
    console.log(`\n✅ Fixed ${fixedCount} workflow file(s)`);
  }
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
