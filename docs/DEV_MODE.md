# Dev/Mock Modu

- `NEXT_PUBLIC_ENV=dev`, `NEXT_PUBLIC_MOCK=1` iken Dashboard üstünde banner görünür ve WS rozeti gri (unknown) olur.
- Prod’da (`NEXT_PUBLIC_ENV=prod`, `NEXT_PUBLIC_MOCK=0`) WS down ise kırmızı, up ise yeşil görünür.
- E2E: `apps/web-next/tests/e2e/ws-badge.spec.ts` bu davranışı doğrular. Test, WS rozetinde `data-testid=ws-badge` ve `data-variant` attribute’larını kullanır.

Notlar:
- Kök layout kapsayıcıda `data-env` attribute’u set edilir.
- `StatusDot` component’i `data-variant=success|error|unknown` yayınlar; WS için `data-testid=ws-badge` sağlanır.
