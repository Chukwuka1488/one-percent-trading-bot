# HAY-37: Exchange Migration (Binance → Kraken)

**Status:** In Progress
**Branch:** `feature/hay-37-exchange-migration-kraken`
**Worktree:** WORKTREE-2

## Objective

Migrate from Binance to Kraken for US trading compliance.

## Why

Binance is restricted in the US. Kraken is officially supported by Freqtrade and US-legal.

## Acceptance Criteria

- [ ] Update config.template.json for Kraken-compatible settings
- [ ] Change stake_currency from USDT to USD
- [ ] Update trading pair format (BTC/USD instead of BTC/USDT)
- [ ] Update .env.example with Kraken environment variables
- [ ] Update generate-freqtrade-config.sh for Kraken
- [ ] Document Kraken-specific configuration requirements

## Workflow Checklist

- [x] Step 1: Fetch ticket details
- [x] Step 2: Claim ticket (update SPRINT.md, commit, PUSH, CREATE DRAFT PR)
- [ ] Step 3: /research-codebase
- [ ] Step 4: Review research (no gaps)
- [ ] Step 5: /create-plan
- [ ] Step 6: Review plan (user approved)
- [ ] Step 7: /implement-plan
- [ ] Step 8: /code-review (all issues fixed)
- [ ] Step 9: /commit
- [ ] Step 10: Update progress files and PUSH

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
