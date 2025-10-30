module.exports = {
  ci: {
    collect: {
      url: [
        'http://127.0.0.1:3003/dashboard',
        'http://127.0.0.1:3003/market',
        'http://127.0.0.1:3003/alerts',
        'http://127.0.0.1:3003/portfolio',
        'http://127.0.0.1:3003/strategy-lab',
      ],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.8 }],
        'categories:best-practices': ['error', { minScore: 0.8 }],
        'categories:seo': ['error', { minScore: 0.8 }],
        // PWA skorları opsiyonel (henüz PWA implementasyonu yok)
        // 'categories:pwa': ['warn', { minScore: 0.6 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
