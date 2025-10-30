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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
  };

  return (
    <div>
      <label className="block text-xs font-medium text-neutral-400 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type={showSecret ? "text" : "password"}
          placeholder={placeholder}
          value={inputValue}
          onChange={handleChange}
          className="w-full h-9 px-3 pr-20 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none font-mono text-sm"
        />
        <button
          type="button"
          onClick={() => setShowSecret(!showSecret)}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 text-xs text-neutral-400 hover:text-white transition-colors"
        >
          {showSecret ? "Gizle" : "Göster"}
        </button>
      </div>
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

  const [testState, setTestState] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const handleTest = async () => {
    setTestState('testing');
    try {
      await onTest(values);
      setTestState('success');
      setTimeout(() => setTestState('idle'), 2000);
    } catch (error) {
      setTestState('error');
      setTimeout(() => setTestState('idle'), 3000);
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
          >
            Test Et
          </Button>
        </div>

        {saved && (
          <div className="text-sm text-green-400 bg-green-950/30 px-3 py-2 rounded border border-green-800/50">
            ✓ Ayarlar kaydedildi. Değerler maskelendi.
          </div>
        )}
      </div>
    </div>
  );
}

