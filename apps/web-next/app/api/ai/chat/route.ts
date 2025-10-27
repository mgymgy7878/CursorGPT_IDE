import { NextRequest } from "next/server";

// Güvenlik notu: Prod'da anahtar sunucu ENV'den okunmalı.
// Geçici/dev amaçlı: Eğer body'de provider info yoksa OPENAI api'sini ve
// process.env.OPENAI_API_KEY'i kullanacağız.
const OPENAI_URL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1/chat/completions";
const OPENAI_KEY = process.env.OPENAI_API_KEY || "";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const messages = body?.messages || [];
  const provider = body?.provider || "openai";
  const baseUrl = body?.baseUrl || OPENAI_URL;
  const apiKey = body?.apiKey || OPENAI_KEY;

  if (!apiKey) {
    // Anahtar yoksa "mock" yanıt dönelim ki UI testi mümkün olsun.
    const last = messages[messages.length - 1]?.content ?? "";
    return Response.json({
      reply:
`(MOCK) İstek alındı. Bunu gerçek çağrıya çevirmek için Settings sayfasından API anahtarını kaydet.
Önerilen strateji kodu:

\`\`\`ts
// mock strategy file
export default { name: "MockStrategy", run(){ /* ... */ } }
\`\`\`
Son isteğin: ${last.substring(0, 400)}`
    });
  }

  const payload = {
    model: body?.model || "gpt-4o-mini",
    messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
    temperature: 0.2
  };

  const r = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!r.ok) {
    const err = await r.text();
    return new Response(err || "AI provider error", { status: r.status });
  }
  const data = await r.json();
  const reply = data?.choices?.[0]?.message?.content ?? "(boş yanıt)";
  return Response.json({ reply });
}
