'use client';

import { useRef, useEffect, useState } from 'react';
import { Play, Save, RotateCcw, Loader2 } from 'lucide-react';

interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
  isRunning?: boolean;
}

export function MonacoEditor({ value, onChange, onRun, isRunning = false }: MonacoEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(true);

  useEffect(() => {
    // Monaco dinamik yükleme
    let mounted = true;

    async function loadMonaco() {
      try {
        // Monaco'yu CDN'den yükle
        if (typeof window !== 'undefined' && !window.monaco) {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js';
          document.head.appendChild(script);

          await new Promise((resolve) => {
            script.onload = resolve;
          });

          // @ts-ignore
          window.require.config({ 
            paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' }
          });

          await new Promise((resolve) => {
            // @ts-ignore
            window.require(['vs/editor/editor.main'], resolve);
          });
        }

        if (!mounted) return;

        // Editor oluştur
        if (editorRef.current && window.monaco) {
          const editor = window.monaco.editor.create(editorRef.current, {
            value,
            language: 'python',
            theme: 'vs-dark',
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            minimap: { enabled: true },
            automaticLayout: true,
            tabSize: 4,
          });

          monacoRef.current = editor;

          // onChange listener
          editor.onDidChangeModelContent(() => {
            const newValue = editor.getValue();
            onChange(newValue);
            setIsSaved(false);
          });

          // Klavye kısayolları
          editor.addCommand(window.monaco.KeyMod.CtrlCmd | window.monaco.KeyCode.Enter, () => {
            onRun();
          });

          editor.addCommand(window.monaco.KeyMod.CtrlCmd | window.monaco.KeyCode.KeyS, () => {
            handleSave();
          });

          setIsLoading(false);
        }
      } catch (error) {
        console.error('Monaco yükleme hatası:', error);
        setIsLoading(false);
      }
    }

    loadMonaco();

    return () => {
      mounted = false;
      if (monacoRef.current) {
        monacoRef.current.dispose();
      }
    };
  }, []);

  // Value prop değiştiğinde editor'ü güncelle
  useEffect(() => {
    if (monacoRef.current && value !== monacoRef.current.getValue()) {
      monacoRef.current.setValue(value);
    }
  }, [value]);

  const handleSave = () => {
    // LocalStorage'a kaydet
    if (monacoRef.current) {
      const code = monacoRef.current.getValue();
      localStorage.setItem('strategy-lab-code', code);
      setIsSaved(true);
      
      // 2 saniye sonra saved durumunu kaldır
      setTimeout(() => setIsSaved(true), 2000);
    }
  };

  const handleReset = () => {
    if (confirm('Kodu sıfırlamak istediğinize emin misiniz?')) {
      const defaultCode = `# Spark Strategy Lab
# Python benzeri strateji kodu yazın

def strategy(data):
    """
    Args:
        data: OHLCV dataframe
    Returns:
        signals: Buy/Sell signals
    """
    # Örnek: Basit moving average crossover
    short_ma = data['close'].rolling(10).mean()
    long_ma = data['close'].rolling(30).mean()
    
    signals = []
    for i in range(len(data)):
        if short_ma[i] > long_ma[i]:
            signals.append('BUY')
        elif short_ma[i] < long_ma[i]:
            signals.append('SELL')
        else:
            signals.append('HOLD')
    
    return signals
`;
      onChange(defaultCode);
      if (monacoRef.current) {
        monacoRef.current.setValue(defaultCode);
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Toolbar */}
      <div className="h-12 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-300">strategy.py</span>
          {!isSaved && (
            <span className="text-xs text-yellow-500">● Kaydedilmedi</span>
          )}
          {isSaved && (
            <span className="text-xs text-green-500">✓ Kaydedildi</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={isSaved}
            className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded flex items-center gap-2 transition-colors"
            title="Kaydet (Ctrl+S)"
          >
            <Save className="h-4 w-4" />
            Kaydet
          </button>

          <button
            onClick={handleReset}
            className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded flex items-center gap-2 transition-colors"
            title="Sıfırla"
          >
            <RotateCcw className="h-4 w-4" />
            Sıfırla
          </button>

          <button
            onClick={onRun}
            disabled={isRunning}
            className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded flex items-center gap-2 font-medium transition-colors"
            title="Çalıştır (Ctrl+Enter)"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Çalışıyor...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Çalıştır
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Container */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
              <p className="mt-2 text-sm text-gray-400">Editor yükleniyor...</p>
            </div>
          </div>
        )}
        <div ref={editorRef} className="w-full h-full" />
      </div>
    </div>
  );
}

// Global type declaration
declare global {
  interface Window {
    monaco: any;
    require: any;
  }
}

