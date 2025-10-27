#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PATCHES = {
  'services/executor/package.json': {
    type: 'json',
    patches: [
      { path: 'type', value: 'module' },
      { path: 'scripts.dev', value: 'tsx watch src/index.ts' },
      { path: 'scripts.build', value: 'tsc -p tsconfig.build.json' },
      { path: 'scripts.start', value: 'node dist/index.js' },
      { path: 'devDependencies.tsx', value: '^4.19.2' }
    ]
  },
  'services/executor/tsconfig.json': {
    type: 'json',
    patches: [
      { path: 'compilerOptions.target', value: 'ES2022' },
      { path: 'compilerOptions.module', value: 'NodeNext' },
      { path: 'compilerOptions.moduleResolution', value: 'NodeNext' },
      { path: 'compilerOptions.allowSyntheticDefaultImports', value: true },
      { path: 'compilerOptions.esModuleInterop', value: true },
      { path: 'compilerOptions.resolveJsonModule', value: true },
      { path: 'compilerOptions.strict', value: true },
      { path: 'compilerOptions.skipLibCheck', value: true },
      { path: 'compilerOptions.noEmit', value: true },
      { path: 'include', value: ['src/**/*'] }
    ]
  },
  'services/executor/tsconfig.build.json': {
    type: 'json',
    patches: [
      { path: 'extends', value: './tsconfig.json' },
      { path: 'compilerOptions.noEmit', value: false },
      { path: 'compilerOptions.outDir', value: 'dist' },
      { path: 'include', value: ['src/**/*'] }
    ]
  },
  'services/executor/src/index.ts': {
    type: 'text',
    patches: [
      {
        pattern: /^(?!import "dotenv\/config";)/m,
        replacement: 'import "dotenv/config";\n'
      },
      {
        pattern: /console\.log\(`\[EXECUTOR\] READY on port \${PORT}`\);/,
        replacement: 'console.log(`[EXECUTOR] READY on ${process.env.PORT ?? 4001}`);'
      }
    ]
  },
  'package.json': {
    type: 'json',
    patches: [
      { path: 'scripts.dev:executor', value: 'pnpm --filter services/executor dev' },
      { path: 'scripts.dev:web', value: 'pnpm --filter web-next dev' },
      { path: 'scripts.dev', value: 'pnpm run dev:executor' }
    ]
  }
};

// Helper functions
function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current)) {
      current[key] = {};
    }
    current = current[key];
  }
  
  const lastKey = keys[keys.length - 1];
  current[lastKey] = value;
}

function getNestedValue(obj, path) {
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }
  
  return current;
}

async function applyJsonPatch(filePath, patches, dryRun = false) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(content);
    const originalData = JSON.parse(content);
    
    for (const patch of patches) {
      if (patch.path === 'devDependencies.tsx') {
        // Special handling for adding tsx to devDependencies
        if (!data.devDependencies) {
          data.devDependencies = {};
        }
        data.devDependencies.tsx = patch.value;
      } else {
        setNestedValue(data, patch.path, patch.value);
      }
    }
    
    const newContent = JSON.stringify(data, null, 2);
    
    if (dryRun) {
      console.log(`\n📄 ${filePath} (DRY RUN):`);
      console.log('--- Original ---');
      console.log(content);
      console.log('\n--- Patched ---');
      console.log(newContent);
    } else {
      await fs.writeFile(filePath, newContent, 'utf8');
      console.log(`✅ ${filePath} - PATCHED`);
    }
    
    return { success: true, changed: content !== newContent };
  } catch (error) {
    console.error(`❌ ${filePath} - ERROR: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function applyTextPatch(filePath, patches, dryRun = false) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    let newContent = content;
    
    for (const patch of patches) {
      if (patch.pattern.test(newContent)) {
        newContent = newContent.replace(patch.pattern, patch.replacement);
      }
    }
    
    if (dryRun) {
      console.log(`\n📄 ${filePath} (DRY RUN):`);
      console.log('--- Original ---');
      console.log(content);
      console.log('\n--- Patched ---');
      console.log(newContent);
    } else {
      await fs.writeFile(filePath, newContent, 'utf8');
      console.log(`✅ ${filePath} - PATCHED`);
    }
    
    return { success: true, changed: content !== newContent };
  } catch (error) {
    console.error(`❌ ${filePath} - ERROR: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function findExecutorPath() {
  const possiblePaths = [
    'services/executor',
    'apps/executor'
  ];
  
  for (const basePath of possiblePaths) {
    try {
      await fs.access(path.join(process.cwd(), basePath));
      return basePath;
    } catch {
      continue;
    }
  }
  
  throw new Error('Executor directory not found. Expected: services/executor or apps/executor');
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const write = args.includes('--write');
  
  if (!dryRun && !write) {
    console.log('Usage: node tools/apply-executor-tsx-patch.mjs [--dry-run] [--write]');
    console.log('  --dry-run: Show diffs without applying');
    console.log('  --write: Apply patches to files');
    process.exit(1);
  }
  
  console.log('🚀 SPARK Executor TSX Patch Script');
  console.log('=====================================');
  
  try {
    const executorPath = await findExecutorPath();
    console.log(`📍 Found executor at: ${executorPath}`);
    
    const results = [];
    
    for (const [filePath, config] of Object.entries(PATCHES)) {
      const fullPath = filePath.startsWith('services/executor') || filePath.startsWith('apps/executor') 
        ? filePath.replace(/^(services|apps)\/executor/, executorPath)
        : filePath;
      
      try {
        let result;
        
        if (config.type === 'json') {
          result = await applyJsonPatch(fullPath, config.patches, dryRun);
        } else if (config.type === 'text') {
          result = await applyTextPatch(fullPath, config.patches, dryRun);
        }
        
        results.push({ file: fullPath, ...result });
      } catch (error) {
        console.error(`❌ ${fullPath} - NOT FOUND or ERROR: ${error.message}`);
        results.push({ file: fullPath, success: false, error: error.message });
      }
    }
    
    console.log('\n📊 PATCH SUMMARY:');
    console.log('==================');
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const changed = results.filter(r => r.success && r.changed);
    
    console.log(`✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    console.log(`🔄 Changed: ${changed.length}`);
    
    if (failed.length > 0) {
      console.log('\n❌ Failed files:');
      failed.forEach(r => console.log(`  - ${r.file}: ${r.error}`));
    }
    
    if (changed.length > 0) {
      console.log('\n🔄 Changed files:');
      changed.forEach(r => console.log(`  - ${r.file}`));
    }
    
    if (dryRun) {
      console.log('\n💡 Run with --write to apply changes');
    } else {
      console.log('\n🎯 PATCHES APPLIED - Ready for executor start');
      console.log('\nNext steps:');
      console.log('1. pnpm -w run db:generate');
      console.log('2. pnpm -w run db:migrate');
      console.log('3. pnpm run dev:executor');
      console.log('4. pnpm run dev:web');
    }
    
  } catch (error) {
    console.error(`❌ FATAL ERROR: ${error.message}`);
    process.exit(1);
  }
}

main().catch(console.error); 