import { NextResponse } from "next/server";
import { readdir, stat } from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const base = path.join(process.cwd(), "apps", "web-next", "evidence", "drafts");
    const dirs = await readdir(base);
    const items: { id: string; createdAt: string }[] = [];
    for (const d of dirs) {
      try {
        const s = await stat(path.join(base, d, "manifest.json"));
        if (s.isFile()) items.push({ id: d, createdAt: s.mtime.toISOString() });
      } catch {}
    }
    items.sort((a,b)=>a.createdAt<b.createdAt?1:-1);
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
