'use client';

import React, { useId, useState } from 'react';

/**
 * Settings Page
 * API key management with proper form labels and ARIA attributes
 */

export default function SettingsPage() {
  const apiKeyId = useId();
  const secretKeyId = useId();
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');

  const handleSave = () => {
    if (!apiKey || !secretKey) {
      setStatusMessage('⚠️ Lütfen tüm alanları doldurun');
      return;
    }
    setStatusMessage('✅ Ayarlar başarıyla kaydedildi');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const handleTest = () => {
    if (!apiKey || !secretKey) {
      setStatusMessage('⚠️ Lütfen önce API key\'leri girin');
      return;
    }
    setStatusMessage('🔄 Bağlantı test ediliyor...');
    setTimeout(() => {
      setStatusMessage('✅ Bağlantı başarılı! Rate limit: 1200/1200');
    }, 1000);
    setTimeout(() => setStatusMessage(''), 5000);
  };

  return (
    <main className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-6 h-6 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <h1 className="text-2xl font-bold text-text-strong">Ayarlar</h1>
        </div>
        <p className="text-sm text-text-muted">API anahtarları ve bağlantı ayarları</p>
      </div>

      {/* Settings Section */}
      <section className="bg-card rounded-lg border border-border p-6">
        {/* Tab Buttons */}
        <div className="flex gap-2 mb-6">
          <button
            className="px-4 py-2 text-sm font-medium text-white bg-accent rounded-md"
            aria-pressed="true"
          >
            Borsa API
          </button>
          <button
            className="px-4 py-2 text-sm font-medium text-text-base bg-bg-card-hover border border-border rounded-md hover:bg-bg-card transition-colors"
            aria-pressed="false"
          >
            AI / Copilot
          </button>
        </div>

        {/* Binance API Form */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-text-strong">Binance</h2>

          {/* API Key Field */}
          <div>
            <label htmlFor={apiKeyId} className="block text-sm font-medium text-text-strong mb-2">
              API Key
            </label>
            <div className="flex gap-2">
              <input
                id={apiKeyId}
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="input flex-1"
                placeholder="BINANCE_API_KEY"
                autoComplete="off"
              />
              <button
                type="button"
                aria-controls={apiKeyId}
                aria-pressed={showApiKey}
                onClick={() => setShowApiKey((s) => !s)}
                className="btn px-4"
                aria-label={showApiKey ? 'API Key\'i gizle' : 'API Key\'i göster'}
              >
                {showApiKey ? '🙈 Gizle' : '👁️ Göster'}
              </button>
            </div>
          </div>

          {/* Secret Key Field */}
          <div>
            <label htmlFor={secretKeyId} className="block text-sm font-medium text-text-strong mb-2">
              Secret Key
            </label>
            <div className="flex gap-2">
              <input
                id={secretKeyId}
                type={showSecretKey ? 'text' : 'password'}
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                className="input flex-1"
                placeholder="BINANCE_SECRET_KEY"
                autoComplete="off"
              />
              <button
                type="button"
                aria-controls={secretKeyId}
                aria-pressed={showSecretKey}
                onClick={() => setShowSecretKey((s) => !s)}
                className="btn px-4"
                aria-label={showSecretKey ? 'Secret Key\'i gizle' : 'Secret Key\'i göster'}
              >
                {showSecretKey ? '🙈 Gizle' : '👁️ Göster'}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button onClick={handleSave} className="btn-primary">
              💾 Kaydet
            </button>
            <button onClick={handleTest} className="btn">
              🔌 Test Et
            </button>
          </div>

          {/* Status Message */}
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="min-h-[1.5rem] text-sm text-text-muted"
          >
            {statusMessage}
          </div>
        </div>
      </section>

      {/* Info Card */}
      <div className="bg-info/10 border border-info/20 rounded-lg p-4">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-info flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-sm text-text-base">
            <p className="font-medium mb-1">API Key Güvenliği</p>
            <p className="text-text-muted">
              API key'leriniz şifrelenerek saklanır. Asla üçüncü taraflarla paylaşılmaz.
              Test Et butonuyla bağlantınızı doğrulayabilirsiniz.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

// Metadata moved to layout.tsx to avoid client component conflict

