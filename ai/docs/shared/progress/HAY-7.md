# HAY-7: Trading Bot Framework Research

**Status:** In Progress
**Branch:** `feature/hay-7-framework-research`

## Framework Comparison

| Framework      | Language  | Stars | Best For                                        |
| -------------- | --------- | ----- | ----------------------------------------------- |
| **Freqtrade**  | Python    | 30k+  | Algorithmic trading, backtesting, ML strategies |
| **Hummingbot** | Python    | 8k+   | Market making, arbitrage, liquidity mining      |
| **Jesse**      | Python    | 5k+   | Research-focused, backtesting, ML integration   |
| **CCXT**       | JS/Python | 33k+  | Library only - build your own bot               |

## Recommendation: Freqtrade

**Repository:** https://github.com/freqtrade/freqtrade

**Why Freqtrade:**

- [x] Binance support out of the box (spot + futures)
- [x] Built-in backtesting & hyperparameter optimization
- [x] Docker-ready (aligns with HAY-6)
- [x] Web UI for monitoring
- [x] Active community, extensive docs
- [x] Strategy plugins (easy to add custom logic)
- [x] Telegram integration (for kill switch - HAY-21)
- [x] Paper trading mode (HAY-9)

## Done

- [x] Researched major open-source trading bot frameworks
- [x] Compared features against project requirements
- [x] Selected Freqtrade as foundation

## Next (HAY-8: Framework Setup)

- [ ] Clone Freqtrade repository
- [ ] Configure docker-compose for local development
- [ ] Run framework in dry-run mode
- [ ] Access web UI
- [ ] Verify basic functionality

## Blocked

(none)
