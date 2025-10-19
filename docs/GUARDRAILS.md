# Guardrails — Param Diff & Risk Skoru

- UI: GuardrailsPanel — baseline↔candidate diff, risk hesapla, eşik üstünde deploy kilidi.
- API:
  - `POST /api/guardrails/evaluate` → Executor `/guardrails/evaluate` (dry-run)
  - `POST /api/guardrails/approve` → Executor `/guardrails/approve` (**confirm_required=true** önerilir)
  - `GET  /api/model/baseline` → Executor `/model/baseline`
- Eşik: varsayılan 0.7; UI deploy butonunu bu eşikle kilitler. RBAC & audit backend’de zorunlu.


