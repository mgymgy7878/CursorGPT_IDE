# Dev/Mock Modu — WS Rozeti

- Env: `NEXT_PUBLIC_ENV=dev`, `NEXT_PUBLIC_MOCK=1`
- UI: Üst şeritte **amber banner** ve WS rozeti **gri** (`data-variant="unknown"`), tooltip: "Dev/Mock aktif — gerçek tick akışı yok".
- Prod: `NEXT_PUBLIC_ENV=prod` ve real feed yoksa WS **kırmızı**.
- E2E: `tests/e2e/ws-badge.spec.ts` — `body[data-env]` değeri ile dallanır; `data-testid="ws-badge"` ve `data-variant` ile asser edilir.
