---
date: 2026-01-24T16:00:00Z
researcher: Claude Code
git_commit: dd16e79cafa336f6d891b83ea0653be287db8662
branch: feature/hay-30-layout-templates
repository: one-percent-trading-meister
topic: "Layout Templates Implementation for HAY-30"
tags: [research, codebase, templates, atomic-design, dashboard]
status: complete
last_updated: 2026-01-24
last_updated_by: Claude Code
---

# Research: Layout Templates Implementation for HAY-30

**Date**: 2026-01-24T16:00:00Z
**Researcher**: Claude Code
**Git Commit**: dd16e79cafa336f6d891b83ea0653be287db8662
**Branch**: feature/hay-30-layout-templates
**Repository**: one-percent-trading-meister

## Research Question

Document the current implementation of layout templates in the dashboard to understand what exists and what needs to be completed for HAY-30.

## Summary

The dashboard follows Atomic Design principles with a `templates/` directory containing layout components. Two templates exist:

1. **DashboardLayout** - Complete and exported, provides main app shell with sidebar/header
2. **AuthLayout** - File exists but is NOT exported from index.ts

**Key Finding:** The AuthLayout component already exists (`AuthLayout.tsx`) but is not exported from the barrel file (`index.ts`). HAY-30 completion requires exporting the existing AuthLayout.

## Detailed Findings

### Templates Directory Structure

```
dashboard/src/components/templates/
├── AuthLayout.tsx      # EXISTS but NOT exported
├── DashboardLayout.tsx # Complete and exported
└── index.ts            # Only exports DashboardLayout
```

### DashboardLayout (`DashboardLayout.tsx:1-82`)

Full-featured app shell with:

**Props Interface:**

```typescript
interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  balance?: string;
  currentPath: string;
  botStatus?: "running" | "stopped" | "error";
  onNavClick?: (href: string) => void;
  onRefresh?: () => void;
  onStartBot?: () => void;
  onStopBot?: () => void;
  isLoading?: boolean;
}
```

**Structure:**

- Root: `flex min-h-screen bg-charcoal`
- Left: `<Sidebar>` organism (280px width)
- Right: Flex column with `<Header>` and `<main>`

### AuthLayout (`AuthLayout.tsx:1-53`)

Centered card layout for authentication pages:

**Props Interface:**

```typescript
interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}
```

**Structure:**

- Root: `min-h-screen bg-charcoal flex flex-col items-center justify-center p-6`
- Brand header with "One Percent" title
- Card: `w-full max-w-md bg-surface rounded-xl border border-border p-8 shadow-glass`
- Footer: "Secure trading automation"

**Dependencies:** Uses only `Text` atom

### Index Barrel Export (`index.ts:1-2`)

```typescript
export { DashboardLayout } from "./DashboardLayout";
// AuthLayout is NOT exported
```

### Available Components for Templates

#### Atoms

| Component | Variants                                    |
| --------- | ------------------------------------------- |
| Button    | primary, secondary, ghost, danger           |
| Input     | label, error, hint                          |
| Badge     | default, profit, loss, warning, info        |
| Icon      | 13 icons including trendUp, chart, settings |
| Text      | h1-h4, body, caption, mono variants         |
| Spinner   | sm, md, lg                                  |

#### Molecules

- StatCard, NavItem, FormField, TradeRow

#### Organisms

- Sidebar, Header, TradeTable, CandlestickChart, SignalList

### Design Tokens (tailwind.config.js)

**Colors:**

- `charcoal`: Primary background (#0D0D0D)
- `profit`: Green accent (#00FF88)
- `loss`: Red accent (#FF4D4D)
- `surface`: Card background (#1A1A1A)
- `border`: Subtle borders (rgba(255,255,255,0.1))

**Shadows:**

- `shadow-glass`: Glassmorphism effect
- `shadow-glass-sm`: Smaller glass effect

**Spacing:**

- `sidebar`: 280px
- `header`: 64px

## Code References

- `dashboard/src/components/templates/DashboardLayout.tsx:1-82` - Main layout
- `dashboard/src/components/templates/AuthLayout.tsx:1-53` - Auth layout (not exported)
- `dashboard/src/components/templates/index.ts:1-2` - Barrel export (missing AuthLayout)
- `dashboard/tailwind.config.js:1-86` - Design tokens
- `dashboard/src/index.css:39-84` - Global utility classes

## Architecture Documentation

**Atomic Design Pattern:**

```
atoms/      → Basic UI elements (Button, Input, Icon, Text, Badge, Spinner)
molecules/  → Composed elements (StatCard, NavItem, FormField, TradeRow)
organisms/  → Complex components (Sidebar, Header, TradeTable)
templates/  → Page layouts (DashboardLayout, AuthLayout)
```

**Styling Patterns:**

- Tailwind CSS with custom design tokens
- Glassmorphism via `glass-card` utility class
- Consistent border radius (`rounded-xl`, `rounded-lg`)
- Color scheme: Dark charcoal background, green profit, red loss

## Open Questions

None - the implementation path is clear:

1. Export AuthLayout from index.ts
2. Verify TypeScript compilation
3. Run tests
