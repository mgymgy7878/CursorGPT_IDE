# CI Gate Configuration

## PR Job: Lint + Build

### Required Job
```yaml
name: web-next-quality-gate
on:
  pull_request:
    paths:
      - 'apps/web-next/**'

jobs:
  lint-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm -C apps/web-next lint
      - run: pnpm -C apps/web-next build
```

### ESLint Rules (apps/web-next/.eslintrc.json)
```json
{
  "extends": ["next/core-web-vitals"],
  "plugins": ["react-hooks"],
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "import/no-named-default": "error",
    "import/no-unresolved": "error"
  },
  "settings": {
    "import/resolver": {
      "typescript": {
        "project": "./tsconfig.json"
      }
    }
  }
}
```

### shadcn/ui Import Standard
- **Always direct:** `import { Button, Card } from "@/components/ui/button"`
- **Never barrel:** No re-export from `index.ts`
- **Curly braces:** Named imports only

### must() Guard (dev-only)
```typescript
// apps/web-next/src/components/layout/AppShell.tsx
function must<T>(x: T, name: string): T {
  if (x == null) {
    throw new Error(`[Import HatasÄ±] \ = \ (muhtemelen yanlÄ±ÅŸ import/export)`);
  }
  return x;
}

// Usage
const SafeThemeToggle = must(ThemeToggle, "ThemeToggle@AppShell");
```

### Recurrence Prevention
1. ESLint catches import mismatches in PR
2. must() catches undefined at runtime (dev-only)
3. CI fails PR if lint/build fails
4. No shadcn re-exports through barrels
