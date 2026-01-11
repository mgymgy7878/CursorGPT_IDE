"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SecretInput } from "./SecretInput";
import { cn } from "@/lib/utils";

type Environment = 'mainnet' | 'testnet';

type BinanceApiFormProps = {
  onSave: (env: Environment, values: Record<string, string>) => void;
  onTest: (env: Environment, values: Record<string, string>) => void;
};

export function BinanceApiForm({ onSave, onTest }: BinanceApiFormProps) {
  const [environment, setEnvironment] = useState<Environment>('mainnet');
  const [mainnetValues, setMainnetValues] = useState<Record<string, string>>({});
  const [testnetValues, setTestnetValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; timestamp: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ env: Environment; status: 'connected' | 'disconnected' | null }>({ env: 'mainnet', status: null });

  const currentValues = environment === 'mainnet' ? mainnetValues : testnetValues;
  const setCurrentValues = environment === 'mainnet' ? setMainnetValues : setTestnetValues;

  const handleSave = async () => {
    await onSave(environment, currentValues);
    setSaved(true);

    // Mask values after save
    const masked = Object.keys(currentValues).reduce((acc, key) => {
      acc[key] = currentValues[key] ? "••••••••" : "";
      return acc;
    }, {} as Record<string, string>);
    setCurrentValues(masked);

    setTimeout(() => setSaved(false), 2000);
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      await onTest(environment, currentValues);
      setTestResult({
        success: true,
        message: 'Bağlantı başarılı',
        timestamp: new Date().toLocaleString('tr-TR'),
      });
      setConnectionStatus({ env: environment, status: 'connected' });
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error?.message || 'Bağlantı başarısız',
        timestamp: new Date().toLocaleString('tr-TR'),
      });
      setConnectionStatus({ env: environment, status: 'disconnected' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="border border-neutral-800 rounded-lg p-4 bg-neutral-900/50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold">Binance</h3>
        {connectionStatus.status && (
          <span className={cn(
            "text-xs px-2 py-0.5 rounded",
            connectionStatus.status === 'connected'
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          )}>
            {connectionStatus.status === 'connected' ? 'Bağlı' : 'Bağlantı Yok'}
          </span>
        )}
      </div>

      {/* Environment Selector */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-neutral-300 mb-2">Ortam (Environment)</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEnvironment('mainnet')}
            className={cn(
              'flex-1 px-3 py-1.5 text-sm rounded-lg border transition-colors',
              environment === 'mainnet'
                ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                : 'border-neutral-700 text-neutral-400 hover:text-neutral-300'
            )}
          >
            Mainnet
          </button>
          <button
            type="button"
            onClick={() => setEnvironment('testnet')}
            className={cn(
              'flex-1 px-3 py-1.5 text-sm rounded-lg border transition-colors',
              environment === 'testnet'
                ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                : 'border-neutral-700 text-neutral-400 hover:text-neutral-300'
            )}
          >
            Testnet
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {/* API Key + Secret Key */}
        <div className="grid grid-cols-2 gap-3">
          <SecretInput
            label="API Key"
            placeholder={`BINANCE_${environment.toUpperCase()}_API_KEY`}
            value={currentValues.apiKey}
            onChange={(value) => setCurrentValues({ ...currentValues, apiKey: value })}
          />
          <SecretInput
            label="Secret Key"
            placeholder={`BINANCE_${environment.toUpperCase()}_SECRET_KEY`}
            value={currentValues.secretKey}
            onChange={(value) => setCurrentValues({ ...currentValues, secretKey: value })}
          />
        </div>

        {/* Base URL (Advanced, collapsible) */}
        <details className="text-xs">
          <summary className="cursor-pointer text-neutral-400 hover:text-neutral-300 mb-2">
            Gelişmiş Ayarlar (Base URL)
          </summary>
          <SecretInput
            label="Base URL"
            placeholder={environment === 'mainnet' ? 'https://api.binance.com' : 'https://testnet.binance.vision'}
            value={currentValues.baseUrl || (environment === 'mainnet' ? 'https://api.binance.com' : 'https://testnet.binance.vision')}
            onChange={(value) => setCurrentValues({ ...currentValues, baseUrl: value })}
          />
        </details>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <Button
            onClick={handleSave}
            variant={saved ? "success" : "primary"}
            className="text-sm px-3 py-1.5"
          >
            {saved ? "✓ Kaydedildi" : "Kaydet"}
          </Button>
          <Button
            onClick={handleTest}
            variant="secondary"
            disabled={testing}
            className="text-sm px-3 py-1.5"
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

