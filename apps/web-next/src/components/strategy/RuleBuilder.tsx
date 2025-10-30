"use client";
import React, { useState } from 'react';
import { Plus, Trash2, Save, Play, Settings, Code, Eye, X } from 'lucide-react';

interface Rule {
  id: string;
  name: string;
  condition: string;
  action: string;
  enabled: boolean;
}

interface RuleBuilderProps {
  onSaveRule: (rule: Rule) => void;
  onTestRule: (rule: Rule) => void;
}

export default function RuleBuilder({ onSaveRule, onTestRule }: RuleBuilderProps) {
  const [rules, setRules] = useState<Rule[]>([
    {
      id: '1',
      name: 'RSI Aşırı Satım Al',
      condition: 'RSI < 30 AND Volume > MA(20) * 1.5',
      action: 'BUY_LIMIT(price * 0.99, quantity)',
      enabled: true
    },
    {
      id: '2',
      name: 'Fiyat Desteği Kırılımı',
      condition: 'Close < Support_Level AND Volume > MA(20) * 2',
      action: 'SELL_MARKET(quantity)',
      enabled: false
    }
  ]);

  const [showEditor, setShowEditor] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [newRule, setNewRule] = useState<Omit<Rule, 'id'>>({
    name: '',
    condition: '',
    action: '',
    enabled: true
  });

  const handleSaveRule = () => {
    if (!newRule.name || !newRule.condition || !newRule.action) return;

    const rule: Rule = {
      ...newRule,
      id: editingRule?.id || Date.now().toString()
    };

    if (editingRule) {
      setRules(rules.map(r => r.id === editingRule.id ? rule : r));
    } else {
      setRules([...rules, rule]);
    }

    onSaveRule(rule);
    setShowEditor(false);
    setEditingRule(null);
    setNewRule({ name: '', condition: '', action: '', enabled: true });
  };

  const handleEditRule = (rule: Rule) => {
    setEditingRule(rule);
    setNewRule({
      name: rule.name,
      condition: rule.condition,
      action: rule.action,
      enabled: rule.enabled
    });
    setShowEditor(true);
  };

  const handleDeleteRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
  };

  const handleToggleRule = (id: string) => {
    setRules(rules.map(r =>
      r.id === id ? { ...r, enabled: !r.enabled } : r
    ));
  };

  const conditionTemplates = [
    'RSI < 30',
    'RSI > 70',
    'MACD > Signal',
    'Close > MA(20)',
    'Volume > MA(20) * 1.5',
    'Close < Support_Level',
    'Close > Resistance_Level'
  ];

  const actionTemplates = [
    'BUY_MARKET(quantity)',
    'SELL_MARKET(quantity)',
    'BUY_LIMIT(price * 0.99, quantity)',
    'SELL_LIMIT(price * 1.01, quantity)',
    'ALERT("Price Alert")',
    'CLOSE_POSITION(symbol)'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">Formül/Rule Builder</h3>
          <p className="text-sm text-neutral-400">
            Koşul → Aksiyon kuralları oluşturun ve test edin
          </p>
        </div>
        <button
          onClick={() => setShowEditor(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          <Plus className="size-4" />
          Yeni Kural
        </button>
      </div>

      {/* Rules List */}
      <div className="space-y-3">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`bg-neutral-800 border rounded-lg p-4 ${
              rule.enabled ? 'border-green-600/30' : 'border-neutral-700'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  rule.enabled ? 'bg-green-500' : 'bg-neutral-500'
                }`} />
                <h4 className="font-medium text-white">{rule.name}</h4>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onTestRule(rule)}
                  className="p-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg"
                  title="Test Et"
                >
                  <Play className="size-4" />
                </button>
                <button
                  onClick={() => handleEditRule(rule)}
                  className="p-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg"
                  title="Düzenle"
                >
                  <Settings className="size-4" />
                </button>
                <button
                  onClick={() => handleDeleteRule(rule.id)}
                  className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg"
                  title="Sil"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-neutral-400 mb-1">Koşul</div>
                <div className="bg-neutral-900/50 rounded p-2 text-sm font-mono text-green-400">
                  {rule.condition}
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-400 mb-1">Aksiyon</div>
                <div className="bg-neutral-900/50 rounded p-2 text-sm font-mono text-blue-400">
                  {rule.action}
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => handleToggleRule(rule.id)}
                className={`px-3 py-1 text-xs rounded ${
                  rule.enabled
                    ? 'bg-green-600/20 text-green-400'
                    : 'bg-neutral-700 text-neutral-400'
                }`}
              >
                {rule.enabled ? 'Aktif' : 'Pasif'}
              </button>
              <span className="text-xs text-neutral-500">
                {rule.enabled ? 'Çalışıyor' : 'Durduruldu'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Rule Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">
                {editingRule ? 'Kural Düzenle' : 'Yeni Kural Oluştur'}
              </h3>
              <button
                onClick={() => {
                  setShowEditor(false);
                  setEditingRule(null);
                  setNewRule({ name: '', condition: '', action: '', enabled: true });
                }}
                className="text-neutral-400 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Rule Name */}
              <div>
                <label className="block text-sm text-neutral-400 mb-2">Kural Adı</label>
                <input
                  type="text"
                  value={newRule.name}
                  onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                  className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded text-white"
                  placeholder="Örn: RSI Aşırı Satım Al"
                />
              </div>

              {/* Condition */}
              <div>
                <label className="block text-sm text-neutral-400 mb-2">Koşul</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <textarea
                      value={newRule.condition}
                      onChange={(e) => setNewRule({...newRule, condition: e.target.value})}
                      className="w-full h-32 px-3 py-2 bg-neutral-900 border border-neutral-600 rounded text-green-400 font-mono text-sm"
                      placeholder="RSI < 30 AND Volume > MA(20) * 1.5"
                    />
                    <div className="text-xs text-neutral-500 mt-1">
                      Desteklenen: RSI, MACD, MA, Volume, Close, Open, High, Low, Support_Level, Resistance_Level
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-400 mb-2">Şablonlar</div>
                    <div className="space-y-1">
                      {conditionTemplates.map((template, index) => (
                        <button
                          key={index}
                          onClick={() => setNewRule({...newRule, condition: template})}
                          className="block w-full text-left px-2 py-1 bg-neutral-700 hover:bg-neutral-600 text-xs text-neutral-300 rounded"
                        >
                          {template}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div>
                <label className="block text-sm text-neutral-400 mb-2">Aksiyon</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <textarea
                      value={newRule.action}
                      onChange={(e) => setNewRule({...newRule, action: e.target.value})}
                      className="w-full h-32 px-3 py-2 bg-neutral-900 border border-neutral-600 rounded text-blue-400 font-mono text-sm"
                      placeholder="BUY_LIMIT(price * 0.99, quantity)"
                    />
                    <div className="text-xs text-neutral-500 mt-1">
                      Desteklenen: BUY_MARKET, SELL_MARKET, BUY_LIMIT, SELL_LIMIT, ALERT, CLOSE_POSITION
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-400 mb-2">Şablonlar</div>
                    <div className="space-y-1">
                      {actionTemplates.map((template, index) => (
                        <button
                          key={index}
                          onClick={() => setNewRule({...newRule, action: template})}
                          className="block w-full text-left px-2 py-1 bg-neutral-700 hover:bg-neutral-600 text-xs text-neutral-300 rounded"
                        >
                          {template}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Enabled */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={newRule.enabled}
                  onChange={(e) => setNewRule({...newRule, enabled: e.target.checked})}
                  className="w-4 h-4 text-blue-600 bg-neutral-700 border-neutral-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="enabled" className="text-sm text-neutral-300">
                  Kuralı aktif et
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveRule}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
              >
                <Save className="size-4" />
                {editingRule ? 'Güncelle' : 'Kaydet'}
              </button>
              <button
                onClick={() => {
                  setShowEditor(false);
                  setEditingRule(null);
                  setNewRule({ name: '', condition: '', action: '', enabled: true });
                }}
                className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white px-4 py-2 rounded-lg"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
