export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  return Response.json({
    app: 'web-next',
    tag: process.env.APP_TAG ?? 'dev',
    sha: process.env.APP_SHA ?? 'local',
    ts: Date.now(),
    version: 'v1.2-ramp'
  });
}
