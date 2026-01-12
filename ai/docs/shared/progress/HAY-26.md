# HAY-26: Trading Bot Dashboard UI

**Status:** In Progress
**Branch:** `feature/hay-26-dashboard-ui`

## Objective

Build a sophisticated trading bot dashboard with "Institutional Minimal" design aesthetic using Vite + React + Atomic Design.

## Tech Stack

- **Framework:** Vite + React + TypeScript
- **Styling:** Tailwind CSS v3 (glassmorphism theme)
- **State:** Zustand + React Query (to install)
- **Charts:** Lightweight Charts (to install)
- **Animations:** Framer Motion (to install)

## Design System

### Color Palette

- **Charcoal:** #0D0D0D (primary bg)
- **Surface:** #1A1A1A (cards)
- **Profit:** #00FF88 (green)
- **Loss:** #FF4D4D (red)
- **Border:** rgba(255, 255, 255, 0.1)

### Typography

- **Sans:** Inter, Atkinson Hyperlegible
- **Mono:** JetBrains Mono

## Done

- [x] Created feature branch
- [x] Initialized Vite + React + TypeScript project
- [x] Installed Tailwind CSS v3
- [x] Configured custom theme (colors, fonts, glassmorphism)
- [x] Set up global CSS with component utilities
- [x] Created Atomic Design folder structure
- [x] Updated CLAUDE.md with architecture and conventions
- [x] Built atom components (Button, Input, Badge, Icon, Text, Spinner)
- [x] Built molecule components (StatCard, NavItem, FormField, TradeRow)
- [x] Built organism components (Sidebar, Header, TradeTable)
- [x] Created DashboardLayout template
- [x] Updated App.tsx with demo dashboard

## In Progress

- [ ] Add to Docker setup

## Next

- [ ] Connect to Freqtrade API (HAY-31)
- [ ] Install state management (Zustand, React Query)
- [ ] Add Lightweight Charts for price visualization
- [ ] Implement real-time updates

## Components Created

### Atoms (`src/components/atoms/`)

- `Button.tsx` - Primary, secondary, ghost, danger variants
- `Input.tsx` - Form input with label, error, hint support
- `Badge.tsx` - Status badges (default, profit, loss, warning, info)
- `Icon.tsx` - SVG icon component with trading icons
- `Text.tsx` - Typography component (h1-h4, body, caption, mono)
- `Spinner.tsx` - Loading spinner

### Molecules (`src/components/molecules/`)

- `StatCard.tsx` - Metric cards with trend indicators
- `NavItem.tsx` - Sidebar navigation items
- `FormField.tsx` - Form field wrapper
- `TradeRow.tsx` - Trade list row component

### Organisms (`src/components/organisms/`)

- `Sidebar.tsx` - Main navigation sidebar with bot status
- `Header.tsx` - Page header with actions
- `TradeTable.tsx` - Trade list table

### Templates (`src/components/templates/`)

- `DashboardLayout.tsx` - Main dashboard layout

## Folder Structure

```
dashboard/
├── src/
│   ├── components/
│   │   ├── atoms/        # ✅ Button, Input, Badge, Icon, Text, Spinner
│   │   ├── molecules/    # ✅ StatCard, NavItem, FormField, TradeRow
│   │   ├── organisms/    # ✅ Sidebar, Header, TradeTable
│   │   └── templates/    # ✅ DashboardLayout
│   ├── hooks/            # ✅ Created
│   ├── services/         # ✅ Created
│   ├── stores/           # ✅ Created
│   ├── types/            # ✅ Created
│   ├── utils/            # ✅ Created
│   ├── App.tsx           # ✅ Demo dashboard
│   └── index.css         # ✅ Tailwind configured
├── tailwind.config.js    # ✅ Custom theme
├── vite.config.ts
└── package.json
```

## Commands

```bash
# Start dev server
cd dashboard && npm run dev

# Build
cd dashboard && npm run build
```

## Notes

- Using Tailwind v3 (not v4) for better compatibility
- Glassmorphism: `glass-card` and `glass-card-sm` utilities
- Profit/Loss: Always use icon + color (accessibility)
- TypeScript strict mode with verbatimModuleSyntax enabled
