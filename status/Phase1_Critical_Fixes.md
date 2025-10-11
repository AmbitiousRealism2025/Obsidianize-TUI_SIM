# Phase 1 Critical Fixes Required
**Immediate TypeScript Compilation Issues**

## Priority 1: Export/Import Fixes

### 1. AI Service Export Issue
**File**: `src/core/ai/index.ts:54`
```typescript
// CURRENT (MISSING):
// ProcessedGeminiGem declared but not exported

// FIX: Add export declaration
export { ProcessedGeminiGem } from './ai-service';
```

### 2. Enum Import Issues
**File**: `src/core/index.ts` (Multiple locations)
```typescript
// CURRENT (INCORRECT):
import type { ContentType, ProcessingStatus, AnalysisMode, ErrorCategory, OutputFormat } from './types/index.js';

// FIX: Use value imports for enums
import { ContentType, ProcessingStatus, AnalysisMode, ErrorCategory, OutputFormat, SectionType, EntityType, SafetyThreshold } from './types/index.js';
```

### 3. Missing ValidatorFactory Export
**File**: `src/core/validators/index.ts`
```typescript
// CURRENT (MISSING):
// ValidatorFactory referenced but not exported

// FIX: Add the missing class or remove reference
export class ValidatorFactory {
  static create<T>(type: string): any {
    // Implementation
  }
}
```

### 4. PDF Parse Import Name
**File**: `src/core/processor.ts:12`
```typescript
// CURRENT (INCORRECT):
import { pdfParse } from 'pdf-parse';

// FIX: Correct import name
import { PDFParse } from 'pdf-parse';
```

## Priority 2: Type Compatibility Fixes

### 1. Uint8Array Type Issues
**File**: `src/core/cache/cache.ts:135, 156`
```typescript
// CURRENT (TYPE MISMATCH):
Bun.gzipSync(data) // Returns Uint8Array<ArrayBufferLike>

// FIX: Add type assertion
const compressed = Bun.gzipSync(data) as Uint8Array<ArrayBuffer>;
return Bun.gunzipSync(data) as Uint8Array<ArrayBuffer>;
```

### 2. Zod Schema Type Conflicts
**File**: `src/core/validators/index.ts`

#### Date vs String Type Issue
```typescript
// CURRENT (CONFLICT):
processed: z.string() // Schema expects string, interface expects Date

// FIX: Add transformation
processed: z.string().transform(val => new Date(val))
```

#### Record Type Issues
```typescript
// CURRENT (CONFLICT):
customPrompts: z.record(z.string(), z.unknown()) // Schema expects unknown, interface expects string

// FIX: Specify correct type
customPrompts: z.record(z.string(), z.string())
```

### 3. YAML Document Options Issue
**File**: `src/core/formatters/index.ts:71, 465`
```typescript
// CURRENT (PROPERTY NOT EXISTS):
{ indent: 2 } // indent not in DocumentOptions

// FIX: Use correct options
{ indent: 2, lineWidth: 120 } // Remove if not supported
```

## Priority 3: Interface Export Issues

### 1. ProcessorConfig Missing Export
**File**: `src/core/types/index.ts`
```typescript
// CURRENT (NOT EXPORTED):
interface ProcessorConfig { ... }

// FIX: Add to exports
export interface ProcessorConfig { ... }
```

### 2. Boolean Type Assignment
**File**: `src/core/formatters/index.ts:209`
```typescript
// CURRENT (TYPE ERROR):
// Type 'string | boolean' is not assignable to type 'boolean'

// FIX: Add type assertion or proper conversion
{ skipInvalid: true } // Ensure boolean value
```

## Priority 4: Vitest Configuration Issue
**File**: `vitest.config.ts:71`
```typescript
// CURRENT (PROPERTY NOT EXISTS):
reporter: ['default']

// FIX: Use correct property name
reporters: ['default']
```

## Quick Fix Script

Create a script to apply these fixes automatically:

```bash
#!/bin/bash
# fix-phase1-issues.sh

echo "Fixing Phase 1 TypeScript issues..."

# Fix enum imports in core/index.ts
sed -i '' 's/import type { ContentType, ProcessingStatus, AnalysisMode, ErrorCategory, OutputFormat }/import { ContentType, ProcessingStatus, AnalysisMode, ErrorCategory, OutputFormat, SectionType, EntityType, SafetyThreshold }/' src/core/index.ts

# Add missing export in ai/index.ts
if ! grep -q "export { ProcessedGeminiGem }" src/core/ai/index.ts; then
  echo "export { ProcessedGeminiGem } from './ai-service';" >> src/core/ai/index.ts
fi

# Fix PDF parse import
sed -i '' 's/import { pdfParse }/import { PDFParse }/' src/core/processor.ts

# Fix Vitest config
sed -i '' 's/reporter:/reporters:/' vitest.config.ts

echo "Fixes applied. Run 'bun tsc --noEmit' to verify."
```

## Verification Steps

After applying fixes:

1. **Type Validation**
```bash
bun tsc --noEmit --strict
# Should exit with code 0 (no errors)
```

2. **Test Execution**
```bash
bun test
# All tests should pass
```

3. **Coverage Analysis**
```bash
bun test --coverage
# Should show ≥85% coverage
```

4. **Build Verification**
```bash
bun build ./index.ts --outdir ./build --target bun --minify
# Should build without errors
```

## Estimated Fix Times

| Fix Category | Estimated Time | Complexity |
|--------------|----------------|------------|
| Export/Import Issues | 30-60 minutes | Low |
| Type Compatibility | 60-120 minutes | Medium |
| Interface Exports | 15-30 minutes | Low |
| Vitest Config | 5 minutes | Low |
| **Total** | **1.5-3.5 hours** | |

## Testing After Fixes

1. Run TypeScript compilation check
2. Execute full test suite
3. Generate coverage report
4. Performance benchmarking
5. Integration testing
6. Update Phase 1 testing report

Once these fixes are applied, the Phase 1 gate should pass successfully.