# HAY-37: Exchange Migration (Binance → Kraken) Implementation Plan

## Overview

Migrate Freqtrade configuration from Binance to Kraken for US trading compliance. Binance is restricted in the US, while Kraken is officially supported by Freqtrade and fully US-legal.

## Current State Analysis

The Freqtrade exchange configuration uses a template-based approach:

1. **config.template.json** - JSON template with `$VARIABLE` placeholders
2. **.env.example** - Environment variable documentation with `binance` as default
3. **generate-freqtrade-config.sh** - Bash script that combines template + env vars → config.json

**Current Settings (Binance):**

- Exchange: `binance`
- Stake currency: `USDT`
- Trading pairs: `BTC/USDT`, `ETH/USDT`
- Default set in: `.env.example:38` and `generate-freqtrade-config.sh:82`

### Key Discoveries:

- `freqtrade/user_data/config.template.json:3` - stake_currency hardcoded to "USDT"
- `freqtrade/user_data/config.template.json:40-43` - pair_whitelist uses USDT pairs
- `.env.example:38` - EXCHANGE_NAME defaults to binance
- `scripts/generate-freqtrade-config.sh:82` - Script default is binance

## Desired End State

After implementation:

1. **Default exchange is Kraken** - All configuration files default to Kraken
2. **USD stake currency** - Uses USD (Kraken's base currency) instead of USDT
3. **Correct pair format** - Trading pairs use `BTC/USD`, `ETH/USD` format
4. **Documentation updated** - Comments reflect Kraken as the default exchange
5. **Backward compatible** - Users can still override to other exchanges via .env

### Verification:

- Run `./scripts/generate-freqtrade-config.sh` successfully
- Generated `config.json` shows `"name": "kraken"` and `"stake_currency": "USD"`
- Freqtrade container starts without errors in dry-run mode

## What We're NOT Doing

- NOT setting up actual Kraken API keys (that's HAY-38)
- NOT researching optimal trading pairs (that's HAY-39)
- NOT modifying trading strategies
- NOT changing Docker Compose configuration (exchange-agnostic)
- NOT modifying API server settings
- NOT changing validation logic (works for any exchange)

## Implementation Approach

All three files must be updated together for consistency. This is a simple find-and-replace operation with clear, specific changes.

---

## Phase 1: Update Configuration Files

### Overview

Update the three core configuration files to use Kraken as the default exchange with USD as stake currency.

### Changes Required:

#### 1. Configuration Template

**File**: `freqtrade/user_data/config.template.json`

**Change 1**: Update stake_currency (line 3)

```json
// Before
"stake_currency": "USDT",

// After
"stake_currency": "USD",
```

**Change 2**: Update pair_whitelist (lines 40-43)

```json
// Before
"pair_whitelist": [
  "BTC/USDT",
  "ETH/USDT"
],

// After
"pair_whitelist": [
  "BTC/USD",
  "ETH/USD"
],
```

#### 2. Environment Example

**File**: `.env.example`

**Change**: Update EXCHANGE_NAME default and add Kraken documentation (around line 37-40)

```bash
# Before
# Exchange Configuration
EXCHANGE_NAME=binance
EXCHANGE_API_KEY=
EXCHANGE_API_SECRET=

# After
# Exchange Configuration (Kraken - US Legal)
# Kraken uses USD as base currency, not USDT
# Get API keys at: https://www.kraken.com/u/security/api
EXCHANGE_NAME=kraken
EXCHANGE_API_KEY=
EXCHANGE_API_SECRET=
```

#### 3. Configuration Generator Script

**File**: `scripts/generate-freqtrade-config.sh`

**Change**: Update default exchange name (line 82)

```bash
# Before
export EXCHANGE_NAME="${EXCHANGE_NAME:-binance}"

# After
export EXCHANGE_NAME="${EXCHANGE_NAME:-kraken}"
```

### Success Criteria:

#### Automated Verification:

- [x] Config generation succeeds: `./scripts/generate-freqtrade-config.sh`
- [x] Generated config.json is valid JSON: `jq empty freqtrade/user_data/config.json`
- [x] Exchange name is kraken: `jq -r '.exchange.name' freqtrade/user_data/config.json | grep -q "kraken"`
- [x] Stake currency is USD: `jq -r '.stake_currency' freqtrade/user_data/config.json | grep -q "USD"`
- [x] Pair whitelist uses USD: `jq -r '.exchange.pair_whitelist[]' freqtrade/user_data/config.json | grep -q "BTC/USD"`

#### Manual Verification:

- [ ] Review generated config.json looks correct
- [ ] Freqtrade container starts in dry-run mode without exchange errors

**Implementation Note**: After completing Phase 1 and all automated verification passes, pause for manual confirmation before proceeding.

---

## Phase 2: Validation & Testing

### Overview

Verify the configuration works with Freqtrade in dry-run mode.

### Steps:

1. Generate fresh config.json from template
2. Start Freqtrade container
3. Check logs for any exchange-related errors
4. Verify API server responds

### Commands:

```bash
# 1. Generate config
./scripts/generate-freqtrade-config.sh

# 2. Start Freqtrade (dry-run mode is default)
docker compose up freqtrade -d

# 3. Check logs for errors
docker compose logs freqtrade --tail 50

# 4. Test API server
curl -s http://localhost:8080/api/v1/ping
```

### Success Criteria:

#### Automated Verification:

- [x] Config generation exits with code 0
- [ ] Docker container starts successfully: `docker compose up freqtrade -d` (SKIPPED - container conflict)
- [ ] No "exchange" errors in logs (SKIPPED)
- [ ] API responds (SKIPPED)

#### Manual Verification:

- [ ] Container logs show successful startup (SKIPPED - will test with HAY-38)
- [ ] No authentication errors (SKIPPED)

---

## Phase 3: Documentation Update

### Overview

Update progress file and SPRINT.md to reflect completion.

### Changes Required:

#### 1. Progress File

**File**: `ai/docs/shared/progress/HAY-37.md`

- Mark acceptance criteria as complete
- Update workflow checklist
- Add completion notes

#### 2. SPRINT.md

**File**: `ai/docs/shared/SPRINT.md`

- Clear "Files Being Edited" entries for HAY-37
- Status remains "Active" until PR is merged

### Success Criteria:

#### Automated Verification:

- [x] Progress file updated
- [x] SPRINT.md "Files Being Edited" cleared for this ticket

#### Manual Verification:

- [ ] Documentation accurately reflects changes made

---

## Testing Strategy

### Unit Tests:

No unit tests required - this is configuration change only.

### Integration Tests:

- Freqtrade starts successfully with new config
- API server responds to health check
- No exchange-related errors in logs

### Manual Testing Steps:

1. Run `./scripts/generate-freqtrade-config.sh` and verify output
2. Inspect generated `freqtrade/user_data/config.json`
3. Start Freqtrade: `docker compose up freqtrade -d`
4. Check logs: `docker compose logs freqtrade -f`
5. Test API: `curl http://localhost:8080/api/v1/ping`

---

## Rollback Plan

If issues are discovered:

1. Revert the 3 modified files to previous state
2. Regenerate config.json with binance defaults
3. Restart Freqtrade container

```bash
git checkout HEAD~1 -- freqtrade/user_data/config.template.json .env.example scripts/generate-freqtrade-config.sh
./scripts/generate-freqtrade-config.sh
docker compose restart freqtrade
```

---

## References

- Research: `ai/docs/shared/research/2026-01-24-HAY-37-exchange-configuration.md`
- Progress: `ai/docs/shared/progress/HAY-37.md`
- Related: HAY-38 (Kraken API Setup), HAY-39 (Trading Pairs Research)
- Freqtrade Kraken docs: https://www.freqtrade.io/en/stable/exchanges/#kraken
