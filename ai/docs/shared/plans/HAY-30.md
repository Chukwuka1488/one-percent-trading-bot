# Implementation Plan: HAY-30 Layout Templates

**Ticket:** HAY-30
**Status:** Ready for Implementation
**Research:** `ai/docs/shared/research/2026-01-24-HAY-30-layout-templates.md`

---

## Summary

Based on research, AuthLayout already exists but is not exported from the barrel file. This plan addresses completing the templates module.

## Scope

**Original Understanding:** Create AuthLayout template
**Actual Scope:** Export existing AuthLayout from index.ts

## Files to Modify

| File                                          | Action | Description           |
| --------------------------------------------- | ------ | --------------------- |
| `dashboard/src/components/templates/index.ts` | EDIT   | Add AuthLayout export |

## Implementation Steps

### Step 1: Export AuthLayout

**File:** `dashboard/src/components/templates/index.ts`

**Current:**

```typescript
export { DashboardLayout } from "./DashboardLayout";
```

**After:**

```typescript
export { AuthLayout } from "./AuthLayout";
export { DashboardLayout } from "./DashboardLayout";
```

### Step 2: Verify TypeScript Compilation

Run type checking to ensure no errors:

```bash
cd dashboard && npx tsc --noEmit
```

### Step 3: Run Linting

```bash
cd dashboard && npm run lint
```

### Step 4: Run Tests (if available)

```bash
cd dashboard && npm test
```

## Acceptance Criteria

- [ ] AuthLayout is exported from `templates/index.ts`
- [ ] TypeScript compiles without errors
- [ ] Linting passes
- [ ] Both templates can be imported: `import { AuthLayout, DashboardLayout } from './components/templates'`

## Dependencies

None - this is a standalone change.

## Risks

None - minimal change, existing code.

## Estimated Changes

- 1 line addition to `index.ts`

---

**Ready for user approval.**
