#!/usr/bin/env node
/*
  IA Proposal Generator
  - Reads docs/reports/UX_INVENTORY.md
  - Emits docs/reports/UX_IA_PROPOSAL.md with suggested IA and nav.json draft
*/
import { promises as fs } from 'fs';
import path from 'path';

const repoRoot = process.cwd();
const reportDir = path.join(repoRoot, 'docs', 'reports');
const invPath = path.join(reportDir, 'UX_INVENTORY.md');
const outPath = path.join(reportDir, 'UX_IA_PROPOSAL.md');

function buildIA() {
  return {
    Ana: ['/dashboard', '/portfolio', '/copilot-home'].filter(Boolean),
    Analiz: ['/correlation', '/signals', '/macro', '/news'].filter(Boolean),
    Strateji: ['/strategy-lab-copilot', '/backtest', '/strategies'].filter(Boolean),
    Sistem: ['/audit', '/settings'].filter(Boolean),
  };
}

function navDraft(ia) {
  const entries = [];
  for (const [group, paths] of Object.entries(ia)) {
    entries.push({ group, items: paths.map((p) => ({ label: p.replace(/\//g, '').toUpperCase() || 'HOME', href: p })) });
  }
  return { version: 1, nav: entries };
}

async function main() {
  const inv = await fs.readFile(invPath, 'utf8').catch(() => '');
  const ia = buildIA();
  const nav = navDraft(ia);

  const md = [];
  md.push('# IA Proposal');
  md.push('');
  md.push('## Suggested IA');
  for (const [k, v] of Object.entries(ia)) {
    md.push(`- ${k}: ${v.join(', ') || '-'}`);
  }
  md.push('');
  md.push('## nav.json (draft)');
  md.push('```json');
  md.push(JSON.stringify(nav, null, 2));
  md.push('```');
  md.push('');
  md.push('## Redirects');
  md.push('- /backtest-lab -> /backtest (308)');
  md.push('- /home -> /dashboard (308)');
  md.push('');
  md.push('## Notes');
  md.push('- Align labels with i18n keys: nav.*');

  await fs.writeFile(outPath, md.join('\n'), 'utf8');
  console.log('Wrote', outPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


