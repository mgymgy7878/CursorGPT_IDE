'use client';
import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { StrategySchema } from "@/lib/strategySchema";

export default function StrategyEditor({
  lang = 'pine',
  value,
  onChange,
  onValidate,
}: { 
  lang?: 'pine' | 'python' | 'json', 
  value?: string, 
  onChange?: (v: string) => void,
  onValidate?: (isValid: boolean, errors: string[]) => void
}) {
  const [code, setCode] = useState(value ?? defaultSnippet(lang));
  const [errors, setErrors] = useState<string[]>([]);
  const [isValid, setIsValid] = useState(false);
  
  useEffect(() => {
    onChange?.(code);
    validateCode(code);
  }, [code, onChange]);

  const validateCode = (code: string) => {
    const newErrors: string[] = [];
    let valid = true;

    if (lang === 'json') {
      try {
        const parsed = JSON.parse(code);
        const result = StrategySchema.safeParse(parsed);
        if (!result.success) {
          result.error.errors.forEach(err => {
            newErrors.push(`${err.path.join('.')}: ${err.message}`);
          });
          valid = false;
        }
      } catch (e) {
        newErrors.push('Geçersiz JSON formatı');
        valid = false;
      }
    }

    setErrors(newErrors);
    setIsValid(valid);
    onValidate?.(valid, newErrors);
  };

  const handleEditorChange = (value: string | undefined) => {
    setCode(value ?? '');
  };

  return (
    <div className="card">
      <div className="card-head">
        <div className="h2">AI Strateji Editörü ({lang})</div>
        <div className="chips">
          <span className="chip info">{lang}</span>
          <span className={`chip ${isValid ? 'success' : 'error'}`}>
            {isValid ? '✓ Geçerli' : '✗ Hata'}
          </span>
        </div>
      </div>
      <div className="card-pad">
        <Editor 
          height="400px" 
          defaultLanguage={getLanguage(lang)}
          value={code} 
          onChange={handleEditorChange}
          options={{
            fontLigatures: true, 
            minimap: { enabled: false },
            fontSize: 14,
            theme: 'vs-dark',
            wordWrap: 'on',
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            suggest: {
              showKeywords: true,
              showSnippets: true,
              showFunctions: true,
              showConstructors: true,
              showFields: true,
              showVariables: true,
              showClasses: true,
              showStructs: true,
              showInterfaces: true,
              showModules: true,
              showProperties: true,
              showEvents: true,
              showOperators: true,
              showUnits: true,
              showValues: true,
              showConstants: true,
              showEnums: true,
              showEnumMembers: true,
              showColors: true,
              showFiles: true,
              showReferences: true,
              showFolders: true,
              showTypeParameters: true,
              showIssues: true,
              showUsers: true,
              showWords: true
            },
            quickSuggestions: true,
            parameterHints: { enabled: true },
            hover: { enabled: true },
            formatOnPaste: true,
            formatOnType: true
          }}
        />
        {errors.length > 0 && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
            <h4 className="text-sm font-medium text-red-800 mb-2">Hatalar:</h4>
            <ul className="text-sm text-red-700 space-y-1">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function getLanguage(lang: string): string {
  switch (lang) {
    case 'pine': return 'typescript';
    case 'python': return 'python';
    case 'json': return 'json';
    default: return 'typescript';
  }
}

function defaultSnippet(lang: 'pine' | 'python' | 'json') {
  switch (lang) {
    case 'pine':
      return `// Pine Script v5 - RSI + MACD Stratejisi
//@version=5
strategy("RSI + MACD Strategy", overlay=true)

// Parametreler
rsiLength = input(14, "RSI Periyodu")
rsiOverbought = input(70, "RSI Aşırı Alım")
rsiOversold = input(30, "RSI Aşırı Satım")

// RSI Hesaplama
rsi = ta.rsi(close, rsiLength)

// MACD Hesaplama
[macdLine, signalLine, histLine] = ta.macd(close, 12, 26, 9)

// Alım Sinyali: RSI aşırı satım + MACD yukarı kesişim
longCondition = rsi < rsiOversold and ta.crossover(macdLine, signalLine)

// Satım Sinyali: RSI aşırı alım + MACD aşağı kesişim
shortCondition = rsi > rsiOverbought and ta.crossunder(macdLine, signalLine)

// Strateji Girişleri
if longCondition
    strategy.entry("Long", strategy.long)

if shortCondition
    strategy.entry("Short", strategy.short)

// Plot
plot(rsi, "RSI", color=color.blue)
hline(rsiOverbought, "Aşırı Alım", color=color.red)
hline(rsiOversold, "Aşırı Satım", color=color.green)`;

    case 'python':
      return `# Python - RSI + MACD Stratejisi
import pandas as pd
import numpy as np
import talib

def calculate_rsi(prices, period=14):
    """RSI hesaplama"""
    delta = prices.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    return rsi

def calculate_macd(prices, fast=12, slow=26, signal=9):
    """MACD hesaplama"""
    exp1 = prices.ewm(span=fast).mean()
    exp2 = prices.ewm(span=slow).mean()
    macd = exp1 - exp2
    signal_line = macd.ewm(span=signal).mean()
    histogram = macd - signal_line
    return macd, signal_line, histogram

def generate_signals(df):
    """Alım/satım sinyalleri üret"""
    # RSI hesapla
    df['rsi'] = calculate_rsi(df['close'])
    
    # MACD hesapla
    df['macd'], df['signal'], df['histogram'] = calculate_macd(df['close'])
    
    # Sinyal koşulları
    df['long_signal'] = (df['rsi'] < 30) & (df['macd'] > df['signal'])
    df['short_signal'] = (df['rsi'] > 70) & (df['macd'] < df['signal'])
    
    return df

# TODO: Backtest fonksiyonu eklenecek
# TODO: Risk yönetimi parametreleri
# TODO: Pozisyon boyutlandırma`;

    case 'json':
      return `{
  "version": "v1",
  "name": "RSI + MACD Strategy",
  "params": {
    "rsiLength": 14,
    "rsiOverbought": 70,
    "rsiOversold": 30,
    "macdFast": 12,
    "macdSlow": 26,
    "macdSignal": 9
  },
  "risk": {
    "maxDrawdown": 0.1,
    "maxNotional": 1000,
    "leverage": 3,
    "notionalPct": 0.2
  },
  "entries": [
    {
      "when": "rsi < rsiOversold && macd > signal",
      "side": "BUY",
      "confidence": 0.8
    }
  ],
  "exits": {
    "tpPct": 0.02,
    "slPct": 0.01,
    "trailingStop": true
  },
  "filters": [
    {
      "type": "volume",
      "minVolume": 1000000
    }
  ]
}`;

    default:
      return '';
  }
} 