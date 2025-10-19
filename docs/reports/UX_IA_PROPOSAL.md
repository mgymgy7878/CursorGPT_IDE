# IA Proposal

## Suggested IA
- Ana: /dashboard, /portfolio, /copilot-home
- Analiz: /correlation, /signals, /macro, /news
- Strateji: /strategy-lab-copilot, /backtest, /strategies
- Sistem: /audit, /settings

## nav.json (draft)
```json
{
  "version": 1,
  "nav": [
    {
      "group": "Ana",
      "items": [
        {
          "label": "DASHBOARD",
          "href": "/dashboard"
        },
        {
          "label": "PORTFOLIO",
          "href": "/portfolio"
        },
        {
          "label": "COPILOT-HOME",
          "href": "/copilot-home"
        }
      ]
    },
    {
      "group": "Analiz",
      "items": [
        {
          "label": "CORRELATION",
          "href": "/correlation"
        },
        {
          "label": "SIGNALS",
          "href": "/signals"
        },
        {
          "label": "MACRO",
          "href": "/macro"
        },
        {
          "label": "NEWS",
          "href": "/news"
        }
      ]
    },
    {
      "group": "Strateji",
      "items": [
        {
          "label": "STRATEGY-LAB-COPILOT",
          "href": "/strategy-lab-copilot"
        },
        {
          "label": "BACKTEST",
          "href": "/backtest"
        },
        {
          "label": "STRATEGIES",
          "href": "/strategies"
        }
      ]
    },
    {
      "group": "Sistem",
      "items": [
        {
          "label": "AUDIT",
          "href": "/audit"
        },
        {
          "label": "SETTINGS",
          "href": "/settings"
        }
      ]
    }
  ]
}
```

## Redirects
- /backtest-lab -> /backtest (308)
- /home -> /dashboard (308)

## Notes
- Align labels with i18n keys: nav.*