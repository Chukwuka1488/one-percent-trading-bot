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

## In Progress

- [ ] Build atom components (Button, Input, Badge, Icon, Text)

## Next

- [ ] Build molecule components (StatCard, NavItem, FormField)
- [ ] Build organism components (Sidebar, Header, TradeTable)
- [ ] Create DashboardLayout template
- [ ] Add to Docker setup
- [ ] Connect to Freqtrade API

## Folder Structure

```
dashboard/
├── src/
│   ├── components/
│   │   ├── atoms/        # ✅ Created
│   │   ├── molecules/    # ✅ Created
│   │   ├── organisms/    # ✅ Created
│   │   └── templates/    # ✅ Created
│   ├── hooks/            # ✅ Created
│   ├── services/         # ✅ Created
│   ├── stores/           # ✅ Created
│   ├── types/            # ✅ Created
│   ├── utils/            # ✅ Created
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
