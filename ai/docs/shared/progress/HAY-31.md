# HAY-31: Dashboard Freqtrade API Integration

**Status:** Complete (Ready for Review)
**Branch:** `feature/hay-31-freqtrade-api`
**Terminal:** T1 (Dashboard/Frontend)

## Objective

Connect the dashboard to Freqtrade API for real-time trading data.

## Tech Stack

- **HTTP Client:** Fetch API (native)
- **State Management:** Zustand
- **Server State:** React Query (@tanstack/react-query)
- **Real-time:** Polling (WebSocket planned for future)

## Done

- [x] Created feature branch
- [x] Installed dependencies (react-query, zustand)
- [x] Created Freqtrade types (`types/freqtrade.ts`)
- [x] Created API service (`services/freqtrade.ts`)
- [x] Configured Vite proxy for CORS
- [x] Created Zustand store (`stores/botStore.ts`)
- [x] Created React Query hooks (`hooks/useFreqtrade.ts`)
- [x] Updated App.tsx to use real data
- [x] Build verified

## Files Created

```
dashboard/src/
├── services/
│   ├── freqtrade.ts      # API client with all endpoints
│   └── index.ts          # Barrel export
├── hooks/
│   ├── useFreqtrade.ts   # React Query hooks
│   └── index.ts          # Barrel export
├── stores/
│   ├── botStore.ts       # Zustand store
│   └── index.ts          # Barrel export
└── types/
    ├── freqtrade.ts      # TypeScript types
    └── index.ts          # Barrel export
```

## API Hooks Available

| Hook                 | Description                 | Polling |
| -------------------- | --------------------------- | ------- |
| `useOpenTrades()`    | Open trades                 | 5s      |
| `useTradeHistory()`  | Closed trades               | 15s     |
| `useProfit()`        | Profit summary              | 15s     |
| `useBalance()`       | Wallet balance              | 15s     |
| `useBotConfig()`     | Bot configuration           | 60s     |
| `useStartBot()`      | Start trading (mutation)    | -       |
| `useStopBot()`       | Stop trading (mutation)     | -       |
| `useForceSell()`     | Force sell (mutation)       | -       |
| `useDashboardData()` | Combined hook for dashboard | -       |

## Configuration

**Vite Proxy:** `/api/v1` → `http://localhost:8080`
**Auth:** Basic Auth (`freqtrade:freqtrade`)

## Next Steps (Future)

- [ ] WebSocket for real-time updates
- [ ] Trade history page
- [ ] Performance charts
- [ ] Error boundary for API failures

## Testing

```bash
# Ensure Freqtrade is running
docker compose up freqtrade -d

# Start dashboard
cd dashboard && npm run dev

# Dashboard should connect to Freqtrade at localhost:8080
```

## Notes

- Dashboard now shows real data from Freqtrade
- Start/Stop bot buttons control actual bot
- Refresh button manually refetches data
- Data auto-refreshes based on polling intervals
