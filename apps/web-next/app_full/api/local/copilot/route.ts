import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

function encoder() {
  return new TextEncoder();
}

function sseLine(obj: any) {
  return `data: ${JSON.stringify(obj)}\n\n`;
}

async function streamOpenAI(messages: any[], system?: string) {
  const key = process.env.OPENAI_API_KEY;
  const model = process.env.COPILOT_MODEL || "gpt-4o-mini";
  const url = "https://api.openai.com/v1/chat/completions";

  if (!key) return streamMock("(mock) OpenAI anahtarı bulunamadı; demo akışı…");

  const body = {
    model,
    stream: true,
    messages: [
      ...(system ? [{ role: "system", content: system }] : []),
      ...messages,
    ],
  };

  const r = await fetch(url, {
    method: "POST",
    headers: {
      "authorization": `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!r.ok || !r.body) {
    return new Response(`data: ${JSON.stringify({ error: "upstream_error", status: r.status })}\n\n`, {
      headers: { "content-type": "text/event-stream" },
      status: 502,
    });
  }

  const readable = new ReadableStream({
    async start(controller) {
      const enc = encoder();
      const reader = r.body!.getReader();
      controller.enqueue(enc.encode(sseLine({ ready: true })));

      let buffer = "";
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += new TextDecoder().decode(value);

          // OpenAI stream format: lines starting with "data: ..."
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const payload = trimmed.replace(/^data:\s*/, "");
            if (payload === "[DONE]") {
              controller.enqueue(enc.encode(sseLine({ done: true })));
              controller.close();
              return;
            }
            try {
              const json = JSON.parse(payload);
              const delta = json?.choices?.[0]?.delta?.content ?? "";
              if (delta) {
                controller.enqueue(enc.encode(sseLine({ token: delta })));
              }
            } catch {
              // ignore malformed line
            }
          }
        }
        controller.enqueue(enc.encode(sseLine({ done: true })));
        controller.close();
      } catch (e: any) {
        controller.enqueue(enc.encode(sseLine({ error: "stream_error", reason: e?.message || "unknown" })));
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "content-type": "text/event-stream" },
    status: 200,
  });
}

function streamMock(message: string) {
  const tokens = [
    "AI", " ", "Copilot", " ", "bağlantısı", " ", "için", " ", "mock", " ", "akış.", " ",
    "Gerçek", " ", "stream", " ", "anahtar", " ", "eklenince", " ", "aktif", " ", "olur."
  ];
  const enc = encoder();

  const readable = new ReadableStream({
    start(controller) {
      controller.enqueue(enc.encode(sseLine({ ready: true, note: message })));
      let i = 0;
      const id = setInterval(() => {
        if (i >= tokens.length) {
          clearInterval(id);
          controller.enqueue(enc.encode(sseLine({ done: true })));
          controller.close();
          return;
        }
        controller.enqueue(enc.encode(sseLine({ token: tokens[i++] })));
      }, 60);
    },
  });

  return new Response(readable, {
    headers: { "content-type": "text/event-stream" },
    status: 200,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { messages = [], system } = await req.json().catch(() => ({}));
    const provider = (process.env.COPILOT_PROVIDER || "openai").toLowerCase();

    // İleride buraya anthropic/azure/openrouter gibi ekleriz.
    if (provider === "openai") {
      return await streamOpenAI(messages, system);
    }
    return streamMock("(mock) Desteklenmeyen provider; OPENAI ile deneyin.");
  } catch (e: any) {
    return new Response(sseLine({ error: "bad_request", reason: e?.message || "parse_error" }), {
      headers: { "content-type": "text/event-stream" },
      status: 400,
    });
  }
} 