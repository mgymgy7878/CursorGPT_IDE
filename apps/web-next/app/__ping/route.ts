export async function GET() {
  return new Response('pong', { 
    headers: { 'x-build-id': 'v1.4-web' } 
  });
}
