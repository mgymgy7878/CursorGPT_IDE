import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

const ART_DIR = path.join(process.cwd(), "evidence", "backtest", "artifacts");

export async function GET(_: Request, ctx: { params: { slug: string[] } }) {
  try {
    const safe = ctx.params.slug.filter(s => !s.includes("..")).join(path.sep);
    const filePath = path.join(ART_DIR, safe);
    const buffer = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const type =
      ext === ".csv" ? "text/csv" :
      ext === ".pdf" ? "application/pdf" :
      "application/octet-stream";
    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        "Content-Type": type,
        "Content-Disposition": `inline; filename="${path.basename(filePath)}"`,
      },
    });
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }
}

