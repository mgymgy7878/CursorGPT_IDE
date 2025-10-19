import { NextResponse } from "next/server";
import { randomUUID, createHash } from "crypto";
import { mkdir, writeFile, readdir, stat } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  try {
    const { code, params, metrics, notes } = await req.json();
    const draftId = randomUUID();

    const base = path.join(process.cwd(), "apps", "web-next", "evidence", "drafts", draftId);
    await mkdir(base, { recursive: true });

    const files = [
      ["code.ts", code ?? ""],
      ["params.json", JSON.stringify(params ?? {}, null, 2)],
      ["metrics.json", JSON.stringify(metrics ?? {}, null, 2)],
      ["manifest.json", JSON.stringify({ draftId, createdAt: new Date().toISOString(), notes: notes ?? "" }, null, 2)],
    ] as const;

    for (const [name, content] of files) {
      await writeFile(path.join(base, name), content, "utf8");
    }

    const manifestPath = path.join(base, "manifest.json");
    const sha = createHash("sha256");
    const { readFile } = await import("fs/promises");
    const m = await readFile(manifestPath);
    sha.update(m);
    const digest = sha.digest("hex");
    await writeFile(path.join(base, "manifest.sha256"), digest, "utf8");

    return NextResponse.json({ ok: true, draftId });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e?.message ?? "publish-failed" }, { status: 500 });
  }
}

export async function GET() {
  const base = path.join(process.cwd(), "apps", "web-next", "evidence", "drafts");
  try {
    const dir = await readdir(base);
    const items: { id: string; createdAt: string }[] = [];
    for (const id of dir) {
      const p = path.join(base, id, "manifest.json");
      try {
        const s = await stat(p);
        if (s.isFile()) items.push({ id, createdAt: s.mtime.toISOString() });
      } catch {}
    }
    return NextResponse.json({ ok: true, items, count: items.length });
  } catch {
    return NextResponse.json({ ok: true, items: [], count: 0 });
  }
}

