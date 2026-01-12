# HAY-8: Trading Bot Framework Local Setup

**Status:** Complete ✅
**Branch:** `feature/hay-8-freqtrade-setup`

## Objective

Set up Freqtrade (selected in HAY-7) locally with Docker.

## Done

- [x] Added Freqtrade to docker-compose.yml
- [x] Created user_data directory structure
- [x] Created dry-run config (config.json)
- [x] Created sample RSI-based strategy (SampleStrategy.py)
- [x] Verified Freqtrade runs in dry-run mode
- [x] Confirmed API server accessible on http://localhost:8080
- [x] Verified simulated trades are being created
- [x] Added Makefile targets (trades, balance, logs-freqtrade)

## Configuration

**Dry-Run Settings:**

- Wallet: $1,000 USDT (simulated)
- Max Open Trades: 3
- Exchange: Binance (spot)
- Pairs: BTC/USDT, ETH/USDT

**API Server:**

- URL: http://localhost:8080
- Username: `freqtrade`
- Password: `freqtrade`

## Commands

```bash
# Start all services (including Freqtrade)
make up

# View Freqtrade logs
make logs-freqtrade

# View open trades
make trades

# View wallet balance
make balance

# API access
curl -u freqtrade:freqtrade http://localhost:8080/api/v1/status
```

## Files Created

```
freqtrade/
└── user_data/
    ├── config.json           # Bot configuration (dry-run mode)
    ├── strategies/
    │   └── SampleStrategy.py # RSI-based sample strategy
    ├── data/                  # Downloaded price data
    ├── logs/                  # Trading logs
    └── backtest_results/      # Backtest outputs
```

## Architecture Update

```
┌─────────────────────────────────────────────────────────────┐
│                    One Percent Trading Bot                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │     n8n      │───▶│   Signals    │───▶│  Freqtrade   │  │
│  │  (research)  │    │   (DB)       │    │  (trading)   │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                   │                   │           │
│         │                   │                   │           │
│         ▼                   ▼                   ▼           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    PostgreSQL                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Next Steps (HAY-9: Paper Trading)

- [ ] Connect Freqtrade to Binance testnet
- [ ] Configure real API keys (paper trading)
- [ ] Test order execution in sandbox mode

## Notes

- Using Freqtrade 2025.12 (stable)
- Strategy uses RSI indicator for entry/exit signals
- Dry-run mode uses simulated wallet (no real trades)
- API password should be changed for production
