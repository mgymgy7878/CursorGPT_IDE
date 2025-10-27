export async function GET() {
  return new Response(JSON.stringify({ ok: true, message: "Pure endpoint works" }), {
    headers: { 'content-type': 'application/json' }
  });
}
