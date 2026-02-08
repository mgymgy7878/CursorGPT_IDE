#!/usr/bin/env node
/**
 * Next.js Bundle Health Check
 * Fetches dashboard HTML, extracts _next/static URLs, and verifies they return 200 with correct MIME types.
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '../..');
const EVIDENCE_DIR = join(ROOT, 'evidence', 'ui');
const PORT = process.env.PORT || '3003';
const HOST = process.env.HOST || '127.0.0.1';
const BASE_URL = `http://${HOST}:${PORT}`;

async function fetchText(url) {
  try {
    const res = await fetch(url);
    return { ok: res.ok, status: res.status, text: await res.text(), contentType: res.headers.get('content-type') || '' };
  } catch (err) {
    return { ok: false, status: 0, text: '', contentType: '', error: err.message };
  }
}

async function fetchHead(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return { ok: res.ok, status: res.status, contentType: res.headers.get('content-type') || '' };
  } catch (err) {
    return { ok: false, status: 0, contentType: '', error: err.message };
  }
}

function extractNextUrls(html) {
  const urls = new Set();
  // <script src="/_next/static/...">
  const scriptRegex = /<script[^>]+src=["']([^"']*\/_next\/static[^"']+)["']/gi;
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    urls.add(match[1]);
  }
  // <link rel="stylesheet" href="/_next/static/...">
  const linkRegex = /<link[^>]+href=["']([^"']*\/_next\/static[^"']+)["']/gi;
  while ((match = linkRegex.exec(html)) !== null) {
    urls.add(match[1]);
  }
  return Array.from(urls);
}

async function main() {
  console.log(`[check-next-bundles] Fetching ${BASE_URL}/dashboard...`);
  const htmlRes = await fetchText(`${BASE_URL}/dashboard`);
  if (!htmlRes.ok) {
    console.error(`❌ Failed to fetch dashboard: ${htmlRes.status} ${htmlRes.error || ''}`);
    process.exit(1);
  }

  const urls = extractNextUrls(htmlRes.text);
  console.log(`[check-next-bundles] Found ${urls.length} _next/static URLs`);

  const results = [];
  let passCount = 0;
  let failCount = 0;

  for (const url of urls) {
    const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
    console.log(`  Checking: ${url}`);
    const headRes = await fetchHead(fullUrl);
    const expectedType = url.endsWith('.js') ? 'javascript' : url.endsWith('.css') ? 'css' : '';
    const hasCorrectType = !expectedType || headRes.contentType.includes(expectedType);
    const isOk = headRes.ok && headRes.status === 200 && hasCorrectType;

    results.push({
      url,
      fullUrl,
      status: headRes.status,
      contentType: headRes.contentType,
      ok: isOk,
      error: headRes.error || (isOk ? null : `Expected 200 + ${expectedType || 'any'}, got ${headRes.status} + ${headRes.contentType}`)
    });

    if (isOk) {
      passCount++;
      console.log(`    ✅ ${headRes.status} ${headRes.contentType}`);
    } else {
      failCount++;
      console.log(`    ❌ ${headRes.status} ${headRes.contentType} ${headRes.error || ''}`);
    }
  }

  const summary = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    totalUrls: urls.length,
    passCount,
    failCount,
    passRate: urls.length > 0 ? ((passCount / urls.length) * 100).toFixed(1) + '%' : '0%',
    results
  };

  mkdirSync(EVIDENCE_DIR, { recursive: true });
  const jsonPath = join(EVIDENCE_DIR, 'next_bundle_health.json');
  writeFileSync(jsonPath, JSON.stringify(summary, null, 2));
  console.log(`\n[check-next-bundles] Results written to ${jsonPath}`);

  const mdPath = join(EVIDENCE_DIR, 'next_bundle_health.md');
  const md = `# Next.js Bundle Health Check

**Timestamp:** ${summary.timestamp}
**Base URL:** ${summary.baseUrl}
**Total URLs:** ${summary.totalUrls}
**Pass:** ${summary.passCount} | **Fail:** ${summary.failCount} | **Rate:** ${summary.passRate}

## Results

${results.map(r => `- ${r.ok ? '✅' : '❌'} \`${r.url}\` - ${r.status} ${r.contentType}${r.error ? ` (${r.error})` : ''}`).join('\n')}
`;
  writeFileSync(mdPath, md);
  console.log(`[check-next-bundles] Summary written to ${mdPath}`);

  if (failCount > 0) {
    console.error(`\n❌ ${failCount} bundle(s) failed health check`);
    process.exit(1);
  } else {
    console.log(`\n✅ All ${passCount} bundles passed health check`);
    process.exit(0);
  }
}

main().catch(err => {
  console.error('[check-next-bundles] Fatal error:', err);
  process.exit(1);
});
