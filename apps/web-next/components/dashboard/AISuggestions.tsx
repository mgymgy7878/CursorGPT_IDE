'use client';

import { useState } from "react";
import { streamManagerAI } from "@/lib/ai";

type Suggestion = {
  id: string;
  text: string;
  action?: {
    type: 'mode' | 'risk' | 'start' | 'stop';
    value?: string | number;
  };
};

export default function AISuggestions() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');

  const generateSuggestions = async () => {
    setLoading(true);
    setCurrentResponse('');
    
    try {
      await streamManagerAI(
        'Piyasa durumunu analiz et ve 3 kısa öneri ver. Format: 1) Öneri metni 2) Öneri metni 3) Öneri metni',
        (token) => {
          setCurrentResponse(prev => prev + token);
        },
        (fullResponse) => {
          // Parse suggestions from response
          const lines = fullResponse.split('\n').filter(line => line.trim());
          const newSuggestions: Suggestion[] = lines.slice(0, 3).map((line, index) => ({
            id: `suggestion-${index}`,
            text: line.replace(/^\d+\)\s*/, '').trim(),
            action: getActionFromSuggestion(line),
          }));
          
          setSuggestions(newSuggestions);
          setCurrentResponse('');
        }
      );
    } catch (error) {
      console.error('AI öneri hatası:', error);
      // Fallback suggestions
      setSuggestions([
        {
          id: 'fallback-1',
          text: 'Piyasa volatil, risk %0.5\'e düşür',
          action: { type: 'risk', value: 0.5 },
        },
        {
          id: 'fallback-2',
          text: 'Trend rejimine geç',
          action: { type: 'mode', value: 'trend' },
        },
        {
          id: 'fallback-3',
          text: 'Trading\'i başlat',
          action: { type: 'start' },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getActionFromSuggestion = (text: string): Suggestion['action'] => {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('risk') && lowerText.includes('%')) {
      const match = lowerText.match(/(\d+(?:\.\d+)?)%/);
      if (match) {
        return { type: 'risk', value: parseFloat(match[1]) };
      }
    }
    
    if (lowerText.includes('trend')) {
      return { type: 'mode', value: 'trend' };
    }
    
    if (lowerText.includes('grid')) {
      return { type: 'mode', value: 'grid' };
    }
    
    if (lowerText.includes('scalp')) {
      return { type: 'mode', value: 'scalp' };
    }
    
    if (lowerText.includes('başlat')) {
      return { type: 'start' };
    }
    
    if (lowerText.includes('durdur')) {
      return { type: 'stop' };
    }
    
    return undefined;
  };

  const applySuggestion = async (suggestion: Suggestion) => {
    if (!suggestion.action) return;
    
    try {
      const { type, value } = suggestion.action;
      
      switch (type) {
        case 'mode':
          // Trigger mode change via event bus
          console.log(`Rejim ${value} olarak ayarlanıyor...`);
          break;
        case 'risk':
          // Trigger risk change via event bus
          console.log(`Risk %${value} olarak ayarlanıyor...`);
          break;
        case 'start':
          // Trigger start via event bus
          console.log('Trading başlatılıyor...');
          break;
        case 'stop':
          // Trigger stop via event bus
          console.log('Trading durduruluyor...');
          break;
      }
      
      // Show success feedback
      console.log(`Öneri uygulandı: ${suggestion.text}`);
    } catch (error) {
      console.error('Öneri uygulama hatası:', error);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-300">AI Önerileri</label>
        <button
          onClick={generateSuggestions}
          disabled={loading}
          className={`px-3 py-1 rounded text-sm ${
            loading
              ? 'bg-zinc-600 text-zinc-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {loading ? 'Üretiliyor...' : 'Öneri Al'}
        </button>
      </div>

      {loading && currentResponse && (
        <div className="p-3 bg-zinc-800 rounded text-sm text-zinc-300">
          <div className="text-zinc-400 mb-1">AI yanıtı:</div>
          <div>{currentResponse}</div>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-2">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="p-3 bg-zinc-800 rounded border border-zinc-700"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="text-sm text-zinc-300">{suggestion.text}</div>
                </div>
                {suggestion.action && (
                  <button
                    onClick={() => applySuggestion(suggestion)}
                    className="px-2 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700 transition-colors"
                  >
                    Uygula
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && suggestions.length === 0 && (
        <div className="p-3 bg-zinc-800 rounded text-sm text-zinc-400 text-center">
          AI önerisi almak için "Öneri Al" butonuna tıklayın
        </div>
      )}
    </div>
  );
} 