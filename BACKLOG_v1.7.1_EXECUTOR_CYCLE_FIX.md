# v1.7.1 - Executor Bootstrap Cycle Fix

**Ticket**: SPARK-EXEC-317  
**Priority**: High (Technical Debt)  
**Story Points**: 2  
**Sprint**: v1.7.1 (Post-v1.7 GREEN)

---

## Problem Statement

Executor bootstrap contains circular dependencies preventing local development without Docker:

```
madge analysis results:
1) ai/providers/index.ts ↔ ai/providers/anthropic.ts
2) ai/providers/index.ts ↔ ai/providers/mock.ts
3) ai/providers/index.ts ↔ ai/providers/openai.ts
```

**Impact**:
- Cannot run executor locally without Docker
- ts-node fails with ERR_REQUIRE_CYCLE_MODULE
- Development friction for local testing

**Note**: Does NOT affect v1.7 Export@Scale code quality or functionality.

---

## Acceptance Criteria

**Definition of Done**:
- [ ] `npx madge services/executor/src --extensions ts --circular` returns empty (no cycles)
- [ ] Executor boots successfully with `node services/executor/run-dev.cjs`
- [ ] All existing tests pass
- [ ] CI includes madge cycle check (fails on any circular deps)
- [ ] Documentation updated with cycle-free patterns

---

## Implementation Plan

### Phase 1: Refactor ai/providers (1-2 hours)

**Create**:
1. `services/executor/src/ai/providers/contracts.ts`
   - Type-only file (no imports)
   - Provider interface, init config types

2. `services/executor/src/ai/providers/registry.ts`
   - Lazy loader with dynamic imports
   - No direct provider imports
   - Factory pattern

**Modify**:
1. `services/executor/src/ai/providers/openai.ts`
   - Remove barrel imports
   - Import only from contracts.ts
   - Export factory function

2. `services/executor/src/ai/providers/anthropic.ts`
   - Same pattern as openai.ts

3. `services/executor/src/ai/providers/mock.ts`
   - Same pattern as openai.ts

4. `services/executor/src/ai/providers/index.ts`
   - Remove all `export * from` statements
   - Export only contracts and registry
   - No re-exports of providers

### Phase 2: Bootstrap Simplification (1 hour)

**Create**:
1. `services/executor/src/boot/app.ts`
   - Fastify app factory
   - No plugin imports

2. `services/executor/src/boot/register-plugins.ts`
   - Dynamic plugin loading with await import
   - No static imports

**Modify**:
1. `services/executor/src/index.ts`
   - Use boot modules
   - Lazy plugin loading
   - No circular imports

### Phase 3: CI Guard (30 minutes)

**Add to package.json**:
```json
"scripts": {
  "check:cycles": "madge services/executor/src --extensions ts --circular"
}
```

**Add to .github/workflows/ci.yml**:
```yaml
- name: Check Circular Dependencies
  run: |
    pnpm run check:cycles
    if [ $? -ne 0 ]; then
      echo "Circular dependencies detected!"
      exit 1
    fi
```

---

## Code Snippets

### contracts.ts
```typescript
// services/executor/src/ai/providers/contracts.ts
export type ModelName = 'gpt4o' | 'sonnet' | 'mock';
export interface Provider {
  name: string;
  complete(prompt: string, opts?: Record<string, unknown>): Promise<string>;
}
export interface ProviderInit {
  apiKey?: string;
  endpoint?: string;
}
```

### registry.ts
```typescript
// services/executor/src/ai/providers/registry.ts
import type { Provider, ProviderInit } from './contracts.js';

export async function loadProvider(name: string, init: ProviderInit = {}): Promise<Provider> {
  switch (name) {
    case 'openai': {
      const m = await import('./openai.js');
      return m.default(init);
    }
    case 'anthropic': {
      const m = await import('./anthropic.js');
      return m.default(init);
    }
    case 'mock': {
      const m = await import('./mock.js');
      return m.default(init);
    }
    default:
      throw new Error(`Unknown provider: ${name}`);
  }
}
```

### openai.ts (pattern)
```typescript
// services/executor/src/ai/providers/openai.ts
import type { Provider, ProviderInit } from './contracts.js';

export default function init(init: ProviderInit = {}): Provider {
  const apiKey = init.apiKey ?? process.env.OPENAI_API_KEY ?? '';
  return {
    name: 'openai',
    async complete(prompt) {
      // Implementation
      return `[openai] result`;
    }
  };
}
```

### index.ts (no barrel)
```typescript
// services/executor/src/ai/providers/index.ts
export * from './contracts.js';
export { loadProvider } from './registry.js';
// NO export * from './openai' or similar!
```

---

## Validation

### Before Fix
```bash
npx madge services/executor/src --extensions ts --circular
# Output: Found 3 circular dependencies!
```

### After Fix
```bash
npx madge services/executor/src --extensions ts --circular
# Output: (empty) - No circular dependencies found
```

### Integration Test
```bash
# Should now work without Docker
node services/executor/run-dev.cjs
# Expected: [BOOT] listened { port: 4001 }

curl http://127.0.0.1:4001/health
# Expected: 200 OK
```

---

## Rollout Plan

**v1.7.1 Release**:
1. Create feature branch: `feature/v1.7.1-cycle-fix`
2. Implement refactor (Phases 1-3)
3. Run madge validation
4. Test executor boot locally
5. Merge to main
6. Tag: v1.7.1-cycle-fix
7. Update documentation

**CI Integration**:
- Add madge check to all PRs
- Block merge if cycles detected
- Document cycle-free patterns

---

## Impact Assessment

**Benefits**:
- ✅ Local development without Docker
- ✅ Faster iteration cycles
- ✅ CI cycle prevention
- ✅ Cleaner architecture

**Risks**:
- ⚠️ Low - Isolated refactor
- ⚠️ Provider loading changes (dynamic vs static)
- ⚠️ Requires thorough testing

**Mitigation**:
- Comprehensive testing before merge
- Gradual rollout with feature flags
- Rollback plan documented

---

## Timeline

**Estimated Effort**: 4-5 hours
- Phase 1: 2 hours (refactor ai/providers)
- Phase 2: 1 hour (bootstrap simplification)
- Phase 3: 30 minutes (CI guard)
- Testing: 30 minutes
- Documentation: 30 minutes

**Target Completion**: v1.7.1 (after v1.7 GREEN)

---

## Dependencies

**Blocked By**:
- None (can start after v1.7 accepted as GREEN)

**Blocks**:
- Local executor development
- Non-Docker integration testing
- Some developer productivity improvements

**Related**:
- v1.8 Analytics + ML (can proceed without this fix using Docker)

---

## Success Criteria

**Definition of Done**:
- [ ] madge reports zero cycles
- [ ] Executor boots locally (no Docker)
- [ ] All existing tests pass
- [ ] CI blocks future cycles
- [ ] Documentation updated

**Outcome**: Cleaner, more maintainable executor architecture

---

**Created**: 2025-10-08  
**Status**: Backlog (High Priority - 2 Story Points)  
**Timeline**: v1.7.1 (Post-v1.7 GREEN)  
**Owner**: TBD (Next developer session)

