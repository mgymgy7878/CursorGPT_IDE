// Strategy Bot - Future Sprint (v1.9-p1+)
// TODO: Implement strategy generation, optimization bot
// Placeholder for next iteration

export default function StrategyBotPage() {
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">🤖✨</div>
          <h1 className="text-3xl font-bold mb-2">Strategy Bot</h1>
          <p className="text-lg opacity-90">
            AI-powered strategy generation and optimization
          </p>
        </div>

        <div className="mt-8 bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Coming Soon</h2>
          <p className="text-gray-600 mb-4">
            Strategy Bot, gelecek sprint'te (v1.9-p1+) geliştirilecek ayrı bir agent'tır.
          </p>
          
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Doğal dil ile strateji taslağı oluşturma</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Parametre optimizasyonu ve backtest</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Risk-reward analizi ve öneriler</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Canary deployment ve canlı test</span>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-amber-600 text-xl">⚠️</span>
            <div className="text-sm text-amber-800">
              <div className="font-semibold mb-1">Geliştirme Notu</div>
              <div>
                Bu özellik scaffold aşamasındadır. Ana Copilot'tan backtest/optimizasyon 
                istekleri şu an için manuel olarak yönlendirilmelidir.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

