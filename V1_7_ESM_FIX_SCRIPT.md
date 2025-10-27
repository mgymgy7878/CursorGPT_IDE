# v1.7 Export@Scale - ESM Fix Script

## Purpose
Automatically add `.js` extensions to relative imports in TypeScript files for NodeNext compatibility.

## Installation
```bash
cd CursorGPT_IDE
pnpm add -w globby
```

## Usage
```bash
node tools/fix-extensions.mjs
```

## What It Does
- Scans all `.ts` files in `services/`, `packages/`, `apps/`
- Finds relative imports: `from './module'` or `from '../utils/helper'`
- Adds `.js` extension: `from './module.js'`
- Skips imports already ending with `.js` or `.json`
- Reports number of files fixed

## Example
**Before**:
```typescript
import { OptimizerQueue } from './optimizerQueue';
import { metrics } from './metrics';
```

**After**:
```typescript
import { OptimizerQueue } from './optimizerQueue.js';
import { metrics } from './metrics.js';
```

## Then Build
```bash
pnpm -w build
```

---

**Status**: Ready to run  
**Expected**: Fix ESM import errors (TS2835)

