#!/usr/bin/env node
/** Pin GitHub Actions to commit SHA.
 * Usage:
 *   node scripts/ci/pin-actions.mjs ".github/workflows/docs-linkcheck.yml"
 * Env:
 *   GITHUB_TOKEN or GH_TOKEN (repo-read ok)
 */
import fs from "fs";
import path from "path";

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
if (!token) console.warn("[pin-actions] Warning: no GITHUB_TOKEN set; may hit rate limits.");

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/ci/pin-actions.mjs <workflow.yml>");
  process.exit(2);
}
const text = fs.readFileSync(file, "utf8");

// find `uses: owner/repo@vN` patterns
const usesRe = /uses:\s*([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)@v([0-9]+)\b/g;
const seen = new Map();

async function derefTag(owner, repo, tag) {
  const base = `https://api.github.com/repos/${owner}/${repo}`;
  // 1) get tag ref
  let res = await fetch(`${base}/git/refs/tags/${tag}`, {
    headers: { Authorization: token ? `Bearer ${token}` : undefined }
  });
  if (res.status === 404) {
    // fallback: tags list
    res = await fetch(`${base}/tags`, {
      headers: { Authorization: token ? `Bearer ${token}` : undefined }
    });
    const arr = await res.json();
    const hit = Array.isArray(arr) && arr.find(x => x.name === tag);
    if (!hit) throw new Error(`Tag not found: ${owner}/${repo}@${tag}`);
    return hit.commit.sha;
  }
  if (!res.ok) throw new Error(`refs/tags failed ${res.status}`);
  const ref = await res.json();
  // annotated tags need one more hop
  if (ref.object && ref.object.type === "tag") {
    const res2 = await fetch(`${base}/git/tags/${ref.object.sha}`, {
      headers: { Authorization: token ? `Bearer ${token}` : undefined }
    });
    if (!res2.ok) throw new Error(`git/tags failed ${res2.status}`);
    const tagObj = await res2.json();
    return tagObj.object.sha;
  }
  return ref.object.sha;
}

async function main() {
  let out = text;
  let match;
  while ((match = usesRe.exec(text))) {
    const [, owner, repo, major] = match;
    const key = `${owner}/${repo}@v${major}`;
    if (seen.has(key)) continue;
    try {
      const sha = await derefTag(owner, repo, `v${major}`);
      seen.set(key, sha);
      // replace all occurrences of this uses:
      const reAll = new RegExp(`uses:\\s*${owner}\\/${repo}@v${major}\\b`, "g");
      out = out.replace(reAll, `uses: ${owner}/${repo}@${sha}  # v${major}`);
      console.log(`[pin-actions] ${key} → ${sha}`);
    } catch (e) {
      console.error(`[pin-actions] ${key} failed: ${e.message}`);
    }
  }
  if (out !== text) {
    const bkp = `${file}.bak`;
    fs.writeFileSync(bkp, text, "utf8");
    fs.writeFileSync(file, out, "utf8");
    console.log(`[pin-actions] Updated ${path.basename(file)} (backup: ${path.basename(bkp)})`);
  } else {
    console.log("[pin-actions] No @v* references found or already pinned.");
  }
}
main().catch(err => { console.error(err); process.exit(1); });


