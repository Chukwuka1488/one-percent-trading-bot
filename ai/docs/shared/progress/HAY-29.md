# HAY-29: Dashboard Organism Components

**Status:** Complete
**Branch:** `feature/hay-29-chart-signals`
**Terminal:** T1 (Dashboard/Frontend)

## Objective

Build complex organism components for the dashboard UI.

## Done

- [x] Sidebar (navigation with logo, nav items, user info)
- [x] Header (sticky with P&L display, emergency stop, status)
- [x] TradeTable (list of open/closed trades with sorting)
- [x] CandlestickChart (TradingView-style chart using Lightweight Charts)
- [x] SignalList (recent signals from n8n pipeline)

## Components Created

### CandlestickChart

- Uses `lightweight-charts` library
- Dark theme matching design system
- Responsive width with window resize handling
- Loading and empty states
- OHLC data format support

### SignalList

- Displays signals from n8n sentiment pipeline
- Shows direction (bullish/bearish/neutral), confidence, summary
- Key points badges
- Source and timestamp
- Clickable items with hover states

## Files Modified

```
dashboard/src/components/organisms/
├── CandlestickChart.tsx    # NEW - TradingView-style chart
├── SignalList.tsx          # NEW - Signal list from n8n
└── index.ts                # Updated exports
```

## Usage

```tsx
import { CandlestickChart, SignalList } from './components';

// CandlestickChart
<CandlestickChart
  data={ohlcData}
  pair="BTC/USDT"
  height={400}
/>

// SignalList
<SignalList
  signals={signals}
  maxItems={5}
  onSignalClick={(signal) => console.log(signal)}
/>
```

## Notes

- Lightweight Charts v5 requires `CandlestickSeries` import
- Chart uses `any` types for refs due to complex generics
- SignalList designed to work with n8n pipeline output format
