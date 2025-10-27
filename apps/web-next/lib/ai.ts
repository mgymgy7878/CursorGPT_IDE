export type ChatMsg = { role:'system'|'user'|'assistant', content:string };

async function postJSON(url:string, body:any, timeoutMs=15000) {
  const ctrl = new AbortController();
  const t = setTimeout(()=>ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { method:'POST', body:JSON.stringify(body), headers:{'content-type':'application/json'}, cache:'no-store', signal:ctrl.signal });
    return await r.json();
  } finally { clearTimeout(t); }
}

export async function askManager(messages:ChatMsg[]) {
  return postJSON('/api/ai/manager', { messages });
}

export async function askStrategy(messages:ChatMsg[]) {
  return postJSON('/api/ai/strategy', { messages });
}

// Streaming AI hook'u
export async function streamAI(
  url: string, 
  prompt: string, 
  onToken: (token: string) => void,
  onComplete?: (fullResponse: string) => void
) {
  try {
    const response = await fetch(url, { 
      method: 'POST', 
      body: JSON.stringify({ prompt }),
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      
      // SSE satırlarını ayıkla
      for (const line of chunk.split('\n')) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') {
            if (onComplete) onComplete(fullResponse);
            return fullResponse;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.delta) {
              onToken(parsed.delta);
              fullResponse += parsed.delta;
            }
          } catch (e) {
            // JSON parse hatası - devam et
          }
        }
      }
    }

    if (onComplete) onComplete(fullResponse);
    return fullResponse;
  } catch (error) {
    console.error('Stream AI error:', error);
    throw error;
  }
}

// Manager AI için streaming
export async function streamManagerAI(
  prompt: string, 
  onToken: (token: string) => void,
  onComplete?: (fullResponse: string) => void
) {
  return streamAI('/api/ai/manager', prompt, onToken, onComplete);
}

// Strategy AI için streaming
export async function streamStrategyAI(
  prompt: string,
  onToken: (token: string) => void,
  code?: string,
  onComplete?: (fullResponse: string) => void
) {
  const body = code ? { prompt, code } : { prompt };
  return streamAI('/api/ai/strategy', JSON.stringify(body), onToken, onComplete);
} 