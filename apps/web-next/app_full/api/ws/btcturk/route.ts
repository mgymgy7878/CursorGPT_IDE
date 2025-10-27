// WS mock feed (Edge runtime). 1s'de bir bid/ask/last yayınlar.
export const runtime = 'edge';

function mkTicker() {
  const base = 1_000_000 + Math.floor(Math.random() * 400);
  const bid = base;
  const ask = bid + 150;
  const last = bid + Math.floor(Math.random() * 150);
  return { bid, ask, last, ts: Date.now(), mode: 'ws-mock' };
}

export async function GET(req: Request) {
  const { 0: client, 1: server } = new (globalThis as any).WebSocketPair();
  server.accept();

  const send = () => server.send(JSON.stringify(mkTicker()));
  const iv = setInterval(send, 1000);
  send();

  server.addEventListener('message', (e: MessageEvent) => {
    // örn: {type:"subscribe", symbol:"BTCTRY"} gelirse no-op
    // console.log('client says:', e.data);
  });
  server.addEventListener('close', () => clearInterval(iv));

  return new Response(null, { status: 101, webSocket: client });
}
