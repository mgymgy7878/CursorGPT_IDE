'use client';
import { useState } from 'react';
import { Card, Text, TextInput, Button, Grid } from '@tremor/react';

async function save(payload: any) {
  const r = await fetch('/api/settings/ai/set', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return r.json();
}

export default function AISettings() {
  const [openaiKey, setOpenaiKey] = useState('');
  const [openaiModel, setOpenaiModel] = useState('gpt-4o-mini');
  const [anthKey, setAnthKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('https://api.openai.com');
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="p-6 space-y-4">
      <div>
        <Text className="text-2xl font-semibold">AI Providers</Text>
        <Text className="text-sm text-gray-600 mt-1">
          OpenAI, Anthropic ve custom provider ayarları. Kaydetme ADMIN_TOKEN gerektirir.
        </Text>
      </div>

      <Card>
        <Grid numItemsSm={2} className="gap-4">
          <div>
            <Text className="mb-1">OpenAI API Key</Text>
            <TextInput
              type="password"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder="sk-..."
            />
          </div>
          <div>
            <Text className="mb-1">OpenAI Model</Text>
            <TextInput
              value={openaiModel}
              onChange={(e) => setOpenaiModel(e.target.value)}
              placeholder="gpt-4o-mini"
            />
          </div>
          <div>
            <Text className="mb-1">Anthropic API Key</Text>
            <TextInput
              type="password"
              value={anthKey}
              onChange={(e) => setAnthKey(e.target.value)}
              placeholder="anthropic-key"
            />
          </div>
          <div>
            <Text className="mb-1">Custom Base URL</Text>
            <TextInput
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.openai.com"
            />
          </div>
        </Grid>

        <div className="mt-4 flex items-center gap-3">
          <Button
            onClick={async () => {
              setMsg('⏳ Kaydediliyor...');
              const res = await save({
                openai: { key: openaiKey, model: openaiModel, baseUrl },
                anthropic: { key: anthKey },
              });
              setMsg(res?.ok ? '✅ Kaydedildi' : `⚠️ Hata: ${res?.error || 'unknown'}`);
            }}
          >
            Kaydet (ADMIN)
          </Button>
          {msg && (
            <Text className="text-sm">{msg}</Text>
          )}
        </div>
      </Card>
    </div>
  );
}

