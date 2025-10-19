import { NextResponse } from "next/server";
import { readdir, stat } from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const base = path.join(process.cwd(), "apps", "web-next", "evidence", "drafts");
    const dirs = await readdir(base);
    let count = 0;
    for (const d of dirs) {
      try {
        const s = await stat(path.join(base, d, "manifest.json"));
        if (s.isFile()) count++;
      } catch {}
    }
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
