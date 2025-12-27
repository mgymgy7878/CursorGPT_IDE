"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  label: string;
  placeholder: string;
  value?: string;
  onChange: (value: string) => void;
};

export function SecretInput({ label, placeholder, value, onChange }: Props) {
  const [showSecret, setShowSecret] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");
  const [revealTimeout, setRevealTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
  };

  const handleReveal = () => {
    if (revealTimeout) {
      clearTimeout(revealTimeout);
    }
    setShowSecret(true);
    const timeout = setTimeout(() => {
      setShowSecret(false);
      setRevealTimeout(null);
    }, 10000); // 10 seconds
    setRevealTimeout(timeout);
  };

  const handleCopy = async () => {
    if (inputValue) {
      await navigator.clipboard.writeText(inputValue);
      // TODO: Show toast notification
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-neutral-300 mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          type={showSecret ? "text" : "password"}
          placeholder={placeholder}
          value={inputValue}
          onChange={handleChange}
          className="w-full px-3 py-2 pr-32 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none font-mono text-sm"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {inputValue && (
            <button
              type="button"
              onClick={handleCopy}
              className="px-2 py-1 text-xs text-neutral-400 hover:text-white transition-colors"
              title="Kopyala"
            >
              📋
            </button>
          )}
          <button
            type="button"
            onClick={handleReveal}
            className="px-2 py-1 text-xs text-neutral-400 hover:text-white transition-colors"
          >
            {showSecret ? "Gizle" : "Göster"}
          </button>
        </div>
      </div>
      {showSecret && (
        <div className="mt-1 text-xs text-amber-400">
          ⏱️ 10 saniye sonra otomatik gizlenecek
        </div>
      )}
    </div>
  );
}

type ApiFormProps = {
  title: string;
  fields: Array<{ name: string; envKey: string }>;
  onSave: (values: Record<string, string>) => void;
  onTest: (values: Record<string, string>) => void;
};

export function ApiForm({ title, fields, onSave, onTest }: ApiFormProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; timestamp: string } | null>(null);
  const [testing, setTesting] = useState(false);

  const handleSave = async () => {
    await onSave(values);
    setSaved(true);

    // Mask values after save
    const masked = Object.keys(values).reduce((acc, key) => {
      acc[key] = values[key] ? "••••••••" : "";
      return acc;
    }, {} as Record<string, string>);
    setValues(masked);

    setTimeout(() => setSaved(false), 2000);
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      await onTest(values);
      setTestResult({
        success: true,
        message: 'Bağlantı başarılı',
        timestamp: new Date().toLocaleString('tr-TR'),
      });
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error?.message || 'Bağlantı başarısız',
        timestamp: new Date().toLocaleString('tr-TR'),
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="border border-neutral-800 rounded-2xl p-6 bg-neutral-900/50">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="space-y-4">
        {fields.map((field) => (
          <SecretInput
            key={field.envKey}
            label={field.name}
            placeholder={field.envKey}
            value={values[field.envKey]}
            onChange={(value) => setValues({ ...values, [field.envKey]: value })}
          />
        ))}

        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleSave}
            variant={saved ? "success" : "primary"}
          >
            {saved ? "✓ Kaydedildi" : "Kaydet"}
          </Button>
          <Button
            onClick={handleTest}
            variant="secondary"
            disabled={testing}
          >
            {testing ? 'Test Ediliyor...' : 'Test Et'}
          </Button>
        </div>

        {saved && (
          <div className="text-sm text-green-400 bg-green-950/30 px-3 py-2 rounded border border-green-800/50">
            ✓ Ayarlar kaydedildi. Değerler maskelendi.
          </div>
        )}
        {testResult && (
          <div className={`text-sm px-3 py-2 rounded border ${
            testResult.success
              ? 'text-green-400 bg-green-950/30 border-green-800/50'
              : 'text-red-400 bg-red-950/30 border-red-800/50'
          }`}>
            <div className="flex items-center justify-between">
              <span>{testResult.success ? '✓' : '✗'} {testResult.message}</span>
              <span className="text-xs text-neutral-500 ml-2">{testResult.timestamp}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

