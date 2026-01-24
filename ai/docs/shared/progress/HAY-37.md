# HAY-37: Exchange Migration (Binance → Kraken)

**Status:** Complete (PR Ready)
**Branch:** `feature/hay-37-exchange-migration-kraken`
**Worktree:** WORKTREE-2

## Objective

Migrate from Binance to Kraken for US trading compliance.

## Why

Binance is restricted in the US. Kraken is officially supported by Freqtrade and US-legal.

## Acceptance Criteria

- [x] Update config.template.json for Kraken-compatible settings
- [x] Change stake_currency from USDT to USD
- [x] Update trading pair format (BTC/USD instead of BTC/USDT)
- [x] Update .env.example with Kraken environment variables
- [x] Update generate-freqtrade-config.sh for Kraken
- [x] Document Kraken-specific configuration requirements

## Workflow Checklist

- [x] Step 1: Fetch ticket details
- [x] Step 2: Claim ticket (update SPRINT.md, commit, PUSH, CREATE DRAFT PR)
- [x] Step 3: /research-codebase
- [x] Step 4: Review research (no gaps)
- [x] Step 5: /create-plan
- [x] Step 6: Review plan (user approved)
- [x] Step 7: /implement-plan
- [x] Step 8: /code-review (all issues fixed)
- [x] Step 9: /commit
- [x] Step 10: Update progress files and PUSH

## Files to Modify

| File                                       | Change                              |
| ------------------------------------------ | ----------------------------------- |
| `freqtrade/user_data/config.template.json` | Update exchange settings for Kraken |
| `.env.example`                             | Add Kraken environment variables    |
| `scripts/generate-freqtrade-config.sh`     | Support Kraken configuration        |

## Notes

- Kraken uses USD (not USDT) as stake currency
- Trading pairs format: BTC/USD, ETH/USD (not BTC/USDT)
- Kraken has official Freqtrade support with stoploss_on_exchange
- Fees: 0.25% maker / 0.40% taker
