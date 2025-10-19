export const runtime="nodejs";

const EXEC = process.env.EXECUTOR_URL ?? process.env.EXECUTOR_BASE_URL ?? "http://localhost:4001";

export async function POST(req:Request){
  const body = await req.json();
  const r = await fetch(`${EXEC}/backtest/portfolio`, { 
    method:"POST", 
    headers:{ "content-type":"application/json" }, 
    body: JSON.stringify(body) 
  });
  return new Response(await r.text(),{ 
    status:r.status, 
    headers:{ "content-type":"application/json" }
  });
}

