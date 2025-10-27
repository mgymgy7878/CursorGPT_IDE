// ESM Import Extension Fixer for NodeNext
// Adds .js extensions to relative imports in TS files
import { globby } from 'globby';
import fs from 'node:fs/promises';

const files = await globby([
  'services/**/*.ts',
  'packages/**/*.ts',
  'apps/**/*.ts'
], { 
  gitignore: true,
  cwd: process.cwd()
});

const REL_RE = /from\s+["'](\.\/[^"']+|\.{2}\/[^"']+)["']/g;
let totalFixed = 0;

for (const f of files) {
  let content = await fs.readFile(f, 'utf8');
  let changed = false;
  
  content = content.replace(REL_RE, (match, importPath) => {
    // Already has extension
    if (importPath.endsWith('.js') || importPath.endsWith('.json')) {
      return match;
    }
    
    // Remove .ts if present
    if (importPath.endsWith('.ts')) {
      importPath = importPath.slice(0, -3);
    }
    
    // Add .js extension
    changed = true;
    return `from "${importPath}.js"`;
  });
  
  if (changed) {
    await fs.writeFile(f, content, 'utf8');
    totalFixed++;
    console.log(`✓ Fixed: ${f}`);
  }
}

console.log(`\n✅ fix-extensions complete: ${totalFixed} files updated`);

