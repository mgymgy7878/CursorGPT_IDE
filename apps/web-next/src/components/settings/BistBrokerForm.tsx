"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SecretInput } from "./SecretInput";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";

type BrokerStatus = 'active' | 'beta' | 'coming-soon';
type ConnectionType = 'fix' | 'api' | 'oauth' | 'terminal-bridge';

interface Broker {
  id: string;
  name: string;
  status: BrokerStatus;
  supportedTypes: ConnectionType[];
}

const BROKERS: Broker[] = [
  { id: 'demo', name: 'Demo / Paper (Mock Broker)', status: 'active', supportedTypes: ['api'] },
  { id: 'akbank', name: 'Akbank Yatırım', status: 'beta', supportedTypes: ['fix', 'api'] },
  { id: 'garanti', name: 'Garanti Yatırım', status: 'coming-soon', supportedTypes: ['fix'] },
  { id: 'isbank', name: 'İş Yatırım', status: 'coming-soon', supportedTypes: ['fix', 'api'] },
];

type BistBrokerFormProps = {
  onSave: (brokerId: string, connectionType: ConnectionType, values: Record<string, string>) => void;
  onTest: (brokerId: string, connectionType: ConnectionType, values: Record<string, string>) => void;
};

export function BistBrokerForm({ onSave, onTest }: BistBrokerFormProps) {
  const [selectedBroker, setSelectedBroker] = useState<string>('demo');
  const [connectionType, setConnectionType] = useState<ConnectionType>('api');
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; timestamp: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [lastConnectionTime, setLastConnectionTime] = useState<string | null>(null);

  const currentBroker = BROKERS.find(b => b.id === selectedBroker) || BROKERS[0];
  const isConnectionTypeSupported = currentBroker.supportedTypes.includes(connectionType);

  const handleSave = async () => {
    await onSave(selectedBroker, connectionType, values);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      await onTest(selectedBroker, connectionType, values);
      setTestResult({
        success: true,
        message: 'Bağlantı başarılı',
        timestamp: new Date().toLocaleString('tr-TR'),
      });
      setLastConnectionTime(new Date().toLocaleString('tr-TR'));
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

  const renderConnectionForm = () => {
    if (connectionType === 'fix') {
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <SecretInput
              label="Host"
              placeholder="fix.example.com"
              value={values.host}
              onChange={(value) => setValues({ ...values, host: value })}
            />
            <SecretInput
              label="Port"
              placeholder="9876"
              value={values.port}
              onChange={(value) => setValues({ ...values, port: value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <SecretInput
              label="Sender Comp ID"
              placeholder="SENDER_ID"
              value={values.senderCompID}
              onChange={(value) => setValues({ ...values, senderCompID: value })}
            />
            <SecretInput
              label="Target Comp ID"
              placeholder="TARGET_ID"
              value={values.targetCompID}
              onChange={(value) => setValues({ ...values, targetCompID: value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <SecretInput
              label="Username"
              placeholder="username"
              value={values.username}
              onChange={(value) => setValues({ ...values, username: value })}
            />
            <SecretInput
              label="Password"
              placeholder="password"
              value={values.password}
              onChange={(value) => setValues({ ...values, password: value })}
            />
          </div>
          <details className="text-xs">
            <summary className="cursor-pointer text-neutral-400 hover:text-neutral-300 mb-2">
              TLS / Gelişmiş Ayarlar
            </summary>
            <div className="space-y-2 mt-2">
              <SecretInput
                label="TLS Certificate Path"
                placeholder="/path/to/cert.pem"
                value={values.tlsCert}
                onChange={(value) => setValues({ ...values, tlsCert: value })}
              />
              <SecretInput
                label="Heartbeat Interval (s)"
                placeholder="30"
                value={values.heartbeat}
                onChange={(value) => setValues({ ...values, heartbeat: value })}
              />
            </div>
          </details>
        </div>
      );
    } else if (connectionType === 'api') {
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <SecretInput
              label="API Key"
              placeholder="API_KEY"
              value={values.apiKey}
              onChange={(value) => setValues({ ...values, apiKey: value })}
            />
            <SecretInput
              label="Secret Key"
              placeholder="SECRET_KEY"
              value={values.secretKey}
              onChange={(value) => setValues({ ...values, secretKey: value })}
            />
          </div>
          <SecretInput
            label="Passphrase (opsiyonel)"
            placeholder="passphrase"
            value={values.passphrase}
            onChange={(value) => setValues({ ...values, passphrase: value })}
          />
          <SecretInput
            label="Base URL"
            placeholder="https://api.example.com"
            value={values.baseUrl}
            onChange={(value) => setValues({ ...values, baseUrl: value })}
          />
        </div>
      );
    } else if (connectionType === 'oauth') {
      return (
        <div className="space-y-3">
          <div className="text-sm text-amber-400 bg-amber-950/30 px-3 py-2 rounded border border-amber-800/50">
            ⚠️ OAuth yetkilendirmesi henüz desteklenmiyor. Backend entegrasyonu tamamlandığında aktif olacak.
          </div>
          <Button
            disabled
            variant="secondary"
            className="w-full text-sm"
          >
            Yetkilendir (Yakında)
          </Button>
        </div>
      );
    } else if (connectionType === 'terminal-bridge') {
      return (
        <div className="space-y-3">
          <div className="text-sm text-amber-400 bg-amber-950/30 px-3 py-2 rounded border border-amber-800/50">
            ⚠️ Terminal Bridge (Matriks/Foreks) entegrasyonu planlama aşamasında.
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="border border-neutral-800 rounded-lg p-4 bg-neutral-900/50">
      <h3 className="text-base font-semibold mb-3">BIST / Aracı Kurum</h3>

      <div className="space-y-4">
        {/* Broker Selection */}
        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-2">Aracı Kurum Seç</label>
          <select
            value={selectedBroker}
            onChange={(e) => {
              setSelectedBroker(e.target.value);
              setValues({}); // Reset form on broker change
            }}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none"
          >
            {BROKERS.map((broker) => (
              <option key={broker.id} value={broker.id}>
                {broker.name} {broker.status === 'active' ? '✓' : broker.status === 'beta' ? '(Beta)' : '(Yakında)'}
              </option>
            ))}
          </select>
          <div className="mt-1 text-xs text-neutral-500">
            Durum: {
              currentBroker.status === 'active' ? 'Aktif' :
              currentBroker.status === 'beta' ? 'Beta' : 'Yakında'
            }
          </div>
        </div>

        {/* Connection Type */}
        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-2">Bağlantı Türü</label>
          <div className="grid grid-cols-2 gap-2">
            {(['fix', 'api', 'oauth', 'terminal-bridge'] as ConnectionType[]).map((type) => {
              const isSupported = currentBroker.supportedTypes.includes(type);
              const labels: Record<ConnectionType, string> = {
                fix: 'FIX',
                api: 'Özel API',
                oauth: 'OAuth',
                'terminal-bridge': 'Terminal Bridge',
              };
              const comingSoonTooltips: Record<ConnectionType, string> = {
                fix: 'FIX protokolü yakında eklenecek',
                api: '',
                oauth: 'OAuth yetkilendirmesi backend entegrasyonu tamamlandığında aktif olacak',
                'terminal-bridge': 'Terminal Bridge (Matriks/Foreks) entegrasyonu planlama aşamasında',
              };
              const button = (
                <button
                  key={type}
                  type="button"
                  onClick={() => isSupported && setConnectionType(type)}
                  disabled={!isSupported}
                  className={cn(
                    'px-3 py-1.5 text-xs rounded-lg border transition-colors relative',
                    connectionType === type && isSupported
                      ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                      : isSupported
                      ? 'border-neutral-700 text-neutral-400 hover:text-neutral-300'
                      : 'border-neutral-800 text-neutral-600 cursor-not-allowed opacity-50'
                  )}
                >
                  {labels[type]}
                  {/* PATCH W.1 Polish: "(Yok)" yerine "Yakında" rozeti */}
                  {!isSupported && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      Yakında
                    </span>
                  )}
                </button>
              );

              // PATCH W.1 Polish: Disabled butonlara tooltip
              return !isSupported && comingSoonTooltips[type] ? (
                <Tooltip key={type} content={comingSoonTooltips[type]} side="top">
                  {button}
                </Tooltip>
              ) : (
                button
              );
            })}
          </div>
        </div>

        {/* Dynamic Form */}
        {isConnectionTypeSupported && (
          <div className="space-y-3">
            {renderConnectionForm()}
          </div>
        )}

        {/* Buttons */}
        {isConnectionTypeSupported && (
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
        )}

        {saved && (
          <div className="text-sm text-green-400 bg-green-950/30 px-3 py-2 rounded border border-green-800/50">
            ✓ Ayarlar kaydedildi.
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
        {lastConnectionTime && (
          <div className="text-xs text-neutral-500">
            Son başarılı bağlantı: {lastConnectionTime}
          </div>
        )}
      </div>
    </div>
  );
}

