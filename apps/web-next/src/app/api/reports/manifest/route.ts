export const runtime = "nodejs";
const EXEC = process.env.EXECUTOR_URL ?? "http://localhost:4001";

type Manifest = {
  jobId: string;
  createdAt: string;
  sha256: string;
  size?: number;
  note?: string;
};

function makeManifest(jobId: string, sha256?: string): Manifest {
  return {
    jobId,
    createdAt: new Date().toISOString(),
    sha256: sha256 ?? "deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
    size: 123456,
    note: "mock-manifest (local profile)",
  };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const jobId = url.searchParams.get("jobId") || "demo-job-local";
  try {
    const r = await fetch(`${EXEC}/reports/manifest?jobId=${encodeURIComponent(jobId)}`).catch(() => null);
    if (r && r.ok) {
      return new Response(await r.text(), {
        status: r.status,
        headers: { "content-type": r.headers.get("content-type") ?? "application/json" },
      });
    }
  } catch {}
  // Fallback: local mock
  return new Response(JSON.stringify(makeManifest(jobId)), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

export async function POST(req: Request) {
  const body = await req.text();
  const r = await fetch(`${EXEC}/reports/manifest`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body
  }).catch(() => null);
  if (r && r.ok) {
    return new Response(await r.text(), {
      status: r.status,
      headers: { "content-type": "application/json" }
    });
  }
  // Fallback: parse input and return mock
  let jobId = "demo-job-local";
  let sha256: string | undefined = undefined;
  try {
    const j = JSON.parse(body || "{}");
    jobId = j?.jobId || j?.params?.jobId || jobId;
    sha256 = j?.sha256 || j?.params?.sha256;
  } catch {}
  return new Response(JSON.stringify(makeManifest(String(jobId), sha256 ? String(sha256) : undefined)), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
}


