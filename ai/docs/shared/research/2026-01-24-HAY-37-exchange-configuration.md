---
date: 2026-01-24T11:36:00-06:00
researcher: Chukwuka Akibor
git_commit: 9b850ba9dcf52d1866a9e2b4a920c818294f710b
branch: feature/hay-37-exchange-migration-kraken
repository: Chukwuka1488/one-percent-trading-bot
topic: "Freqtrade Exchange Configuration Implementation"
tags: [research, codebase, freqtrade, exchange, configuration, hay-37]
status: complete
last_updated: 2026-01-24
last_updated_by: Chukwuka Akibor
---

# Research: Freqtrade Exchange Configuration Implementation

**Date**: 2026-01-24T11:36:00-06:00
**Researcher**: Chukwuka Akibor
**Git Commit**: 9b850ba9dcf52d1866a9e2b4a920c818294f710b
**Branch**: feature/hay-37-exchange-migration-kraken
**Repository**: Chukwuka1488/one-percent-trading-bot

## Research Question

Document the current Freqtrade exchange configuration implementation. Find config.template.json, .env.example, generate-freqtrade-config.sh, and any other files related to exchange setup. Identify patterns for HAY-37: Exchange Migration (Binance → Kraken).

## Summary

The Freqtrade exchange configuration system uses a template-based approach with environment variable substitution. The system consists of three core files that work together:

1. **config.template.json** - JSON template with `$VARIABLE` placeholders
2. **.env.example** - Environment variable documentation and defaults
3. **generate-freqtrade-config.sh** - Bash script that combines template + environment variables → config.json

The current implementation is configured for **Binance** with **USDT** as the stake currency and trading pairs formatted as `BTC/USDT`, `ETH/USDT`. For HAY-37 (migration to Kraken), the key changes needed are:

- Exchange name: `binance` → `kraken`
- Stake currency: `USDT` → `USD`
- Trading pairs: `BTC/USDT` → `BTC/USD`
- Environment variables: `EXCHANGE_NAME` default value

## Detailed Findings

### Configuration Template (config.template.json)

**Location**: `freqtrade/user_data/config.template.json`

The template defines the complete Freqtrade configuration structure with environment variable placeholders using `$VARIABLE_NAME` syntax (compatible with `envsubst`).

**Exchange Configuration Block** (config.template.json:33-45):

```json
"exchange": {
  "name": "$EXCHANGE_NAME",
  "key": "$EXCHANGE_API_KEY",
  "secret": "$EXCHANGE_API_SECRET",
  "ccxt_config": {},
  "ccxt_sync_config": {},
  "ccxt_async_config": {},
  "pair_whitelist": [
    "BTC/USDT",
    "ETH/USDT"
  ],
  "pair_blacklist": []
}
```

**Current Settings**:

- `stake_currency`: `"USDT"` (line 3)
- `stake_amount`: `"unlimited"` (line 4)
- `trading_mode`: `"spot"` (line 10)
- `dry_run`: `true` (line 7)
- `dry_run_wallet`: `1000` (line 8)

**API Server Configuration** (config.template.json:56-67):

```json
"api_server": {
  "enabled": true,
  "listen_ip_address": "0.0.0.0",
  "listen_port": 8080,
  "verbosity": "error",
  "enable_openapi": true,
  "jwt_secret_key": "$FREQTRADE_JWT_SECRET",
  "ws_token": "$FREQTRADE_WS_TOKEN",
  "CORS_origins": [],
  "username": "$FREQTRADE_API_USER",
  "password": "$FREQTRADE_API_PASSWORD"
}
```

### Environment Variables (.env.example)

**Location**: `.env.example`

Documents all environment variables with examples and defaults. Secrets are left empty (never commit actual values).

**Exchange Variables** (.env.example:37-40):

```bash
# Exchange Configuration
EXCHANGE_NAME=binance
EXCHANGE_API_KEY=
EXCHANGE_API_SECRET=
```

**Freqtrade API Variables** (.env.example:42-52):

```bash
# Freqtrade API Server (auto-generated if empty)
# Generate secure values: openssl rand -hex 32
FREQTRADE_JWT_SECRET=
FREQTRADE_WS_TOKEN=
FREQTRADE_API_USER=freqtrade
FREQTRADE_API_PASSWORD=

# Telegram Notifications (optional)
TELEGRAM_ENABLED=false
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

**Current Default**: `EXCHANGE_NAME=binance`

### Configuration Generator Script (generate-freqtrade-config.sh)

**Location**: `scripts/generate-freqtrade-config.sh`

Bash script that loads environment variables, sets secure defaults, validates configuration, and generates the final config.json file.

**Environment Loading** (generate-freqtrade-config.sh:40-49):

```bash
load_env() {
    if [[ -f "$ENV_FILE" ]]; then
        log_info "Loading environment from .env"
        set -a
        source "$ENV_FILE"
        set +a
    else
        log_warn ".env file not found, using existing environment variables"
    fi
}
```

**Default Value Setting** (generate-freqtrade-config.sh:61-89):

```bash
set_defaults() {
    # Generate JWT secret if not set
    if [[ -z "$FREQTRADE_JWT_SECRET" ]]; then
        export FREQTRADE_JWT_SECRET=$(generate_secret)
        log_info "Generated random FREQTRADE_JWT_SECRET"
    fi

    # Generate WebSocket token if not set
    if [[ -z "$FREQTRADE_WS_TOKEN" ]]; then
        export FREQTRADE_WS_TOKEN=$(generate_secret)
        log_info "Generated random FREQTRADE_WS_TOKEN"
    fi

    # Generate API password if not set
    if [[ -z "$FREQTRADE_API_PASSWORD" ]]; then
        export FREQTRADE_API_PASSWORD=$(generate_secret | head -c 16)
        log_warn "Generated random FREQTRADE_API_PASSWORD: $FREQTRADE_API_PASSWORD"
        log_warn "Save this password to access the Freqtrade API!"
    fi

    # Set defaults for optional vars
    export EXCHANGE_NAME="${EXCHANGE_NAME:-binance}"
    export EXCHANGE_API_KEY="${EXCHANGE_API_KEY:-}"
    export EXCHANGE_API_SECRET="${EXCHANGE_API_SECRET:-}"
    export TELEGRAM_ENABLED="${TELEGRAM_ENABLED:-false}"
    export TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
    export TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-}"
    export FREQTRADE_API_USER="${FREQTRADE_API_USER:-freqtrade}"
}
```

**Key Default**: Line 82 sets `EXCHANGE_NAME` to `binance` if not provided.

**Validation Logic** (generate-freqtrade-config.sh:94-140):

```bash
validate_config() {
    local errors=0

    log_info "Validating configuration..."

    # Check template exists
    if [[ ! -f "$TEMPLATE_FILE" ]]; then
        log_error "Template file not found: $TEMPLATE_FILE"
        return 1
    fi

    # Check if running in dry_run mode (check template for default)
    local dry_run=$(grep -o '"dry_run": *[^,]*' "$TEMPLATE_FILE" | grep -o 'true\|false')

    if [[ "$dry_run" == "false" ]]; then
        # Live trading requires exchange credentials
        if [[ -z "$EXCHANGE_API_KEY" ]]; then
            log_error "EXCHANGE_API_KEY is required for live trading"
            ((errors++))
        fi
        if [[ -z "$EXCHANGE_API_SECRET" ]]; then
            log_error "EXCHANGE_API_SECRET is required for live trading"
            ((errors++))
        fi
    else
        log_info "Dry-run mode: Exchange credentials optional"
    fi

    # Warn about default credentials
    if [[ "$FREQTRADE_API_USER" == "freqtrade" ]]; then
        log_warn "Using default API username 'freqtrade' - consider changing for production"
    fi

    # Check JWT secret strength
    if [[ ${#FREQTRADE_JWT_SECRET} -lt 32 ]]; then
        log_error "FREQTRADE_JWT_SECRET should be at least 32 characters"
        ((errors++))
    fi

    if [[ $errors -gt 0 ]]; then
        log_error "Validation failed with $errors error(s)"
        return 1
    fi

    log_info "Configuration validated successfully"
    return 0
}
```

**Context-aware validation**: Exchange API credentials only required when `dry_run: false` (line 108-117).

**Config Generation** (generate-freqtrade-config.sh:145-168):

```bash
generate_config() {
    log_info "Generating config from template..."

    # Use envsubst to replace environment variables
    # We need to handle the special case where values might be empty
    envsubst < "$TEMPLATE_FILE" > "$OUTPUT_FILE"

    # Validate the generated JSON
    if command -v jq &> /dev/null; then
        if ! jq empty "$OUTPUT_FILE" 2>/dev/null; then
            log_error "Generated config is not valid JSON"
            return 1
        fi
        log_info "Generated config is valid JSON"
    else
        log_warn "jq not installed, skipping JSON validation"
    fi

    log_info "Config generated: $OUTPUT_FILE"

    # Set restrictive permissions
    chmod 600 "$OUTPUT_FILE"
    log_info "Set file permissions to 600 (owner read/write only)"
}
```

**Security**: Generated config gets `chmod 600` (line 166) - only owner can read/write.

### Docker Compose Configuration

**Location**: `docker-compose.yml`

**Freqtrade Service** (docker-compose.yml:101-119):

```yaml
freqtrade:
  image: freqtradeorg/freqtrade:stable
  container_name: freqtrade
  restart: unless-stopped
  volumes:
    - ./freqtrade/user_data:/freqtrade/user_data
  ports:
    - "8080:8080"
  networks:
    - trading_network
  command: >
    trade
    --config /freqtrade/user_data/config.json
    --strategy SampleStrategy
  logging:
    driver: "json-file"
    options:
      max-size: "10m"
      max-file: "3"
```

**Key aspects**:

- Mounts `./freqtrade/user_data` directory (contains config.json after generation)
- Exposes port 8080 for API server
- Uses `SampleStrategy` as trading strategy
- Config file path: `/freqtrade/user_data/config.json` (inside container)

### Related Files

**Trading Strategy** (`freqtrade/user_data/strategies/SampleStrategy.py`):

- Implements RSI-based trading strategy
- Uses indicators: RSI, Bollinger Bands, MACD, Stochastic, SAR, TEMA
- Entry: RSI < 30
- Exit: RSI > 70
- Stoploss: -10%
- Does not directly reference exchange configuration (handled by Freqtrade core)

**Progress Tracking** (`ai/docs/shared/progress/HAY-37.md`):

- Documents HAY-37 migration task
- Lists files to modify for Kraken migration
- Notes: Kraken uses USD (not USDT), different pair format

**Security Documentation** (`ai/docs/shared/progress/HAY-23.md`):

- Documents secrets management implementation
- Shows environment variable patterns
- Security best practices for API credentials

## Code References

- `freqtrade/user_data/config.template.json:3` - stake_currency: "USDT"
- `freqtrade/user_data/config.template.json:34` - exchange.name: "$EXCHANGE_NAME"
- `freqtrade/user_data/config.template.json:40-43` - pair_whitelist with USDT pairs
- `.env.example:38` - EXCHANGE_NAME=binance (default)
- `scripts/generate-freqtrade-config.sh:82` - Default exchange name set to binance
- `scripts/generate-freqtrade-config.sh:150` - envsubst command for variable substitution
- `scripts/generate-freqtrade-config.sh:166` - chmod 600 for generated config
- `docker-compose.yml:113` - Freqtrade command with config path

## Architecture Documentation

### Configuration Flow

```
1. User creates .env file (from .env.example)
   ├─ Sets EXCHANGE_NAME=binance (or leaves default)
   ├─ Sets EXCHANGE_API_KEY and EXCHANGE_API_SECRET
   └─ Optionally sets FREQTRADE_* variables

2. User runs ./scripts/generate-freqtrade-config.sh
   ├─ Loads .env file
   ├─ Sets defaults for missing variables
   ├─ Generates secure tokens (JWT, WS, API password)
   ├─ Validates configuration (checks API keys if live trading)
   └─ Runs envsubst on config.template.json → config.json

3. Docker Compose starts Freqtrade service
   ├─ Mounts freqtrade/user_data directory
   ├─ Freqtrade reads config.json
   └─ Connects to exchange using credentials from config
```

### File Tracking and Security

**Tracked in Git**:

- `freqtrade/user_data/config.template.json` - Template with placeholders
- `.env.example` - Example/documentation (no secrets)
- `scripts/generate-freqtrade-config.sh` - Generation script

**Gitignored** (in `.gitignore`):

- `freqtrade/user_data/config.json` - Generated file with secrets
- `.env` - Actual environment variables with secrets

### Environment Variable Pattern

The codebase uses consistent patterns for environment variable handling:

**TypeScript/Node.js Pattern**:

```typescript
const key = apiKey || process.env.API_KEY;
if (!key)
  throw new Error("API_KEY is required. Set it in .envrc or pass directly.");
```

**Bash Pattern**:

```bash
export VARIABLE="${VARIABLE:-default_value}"
```

**Docker Compose Pattern**:

```yaml
environment:
  VARIABLE: ${VARIABLE:-default}
```

**Template Pattern**:

```json
{
  "setting": "$VARIABLE_NAME"
}
```

## HAY-37 Migration Requirements

Based on the current implementation, migrating from Binance to Kraken requires changes in **3 files**:

### 1. config.template.json

- Change `stake_currency` from `"USDT"` to `"USD"` (line 3)
- Update `pair_whitelist` to use USD format: `["BTC/USD", "ETH/USD"]` (lines 41-42)

### 2. .env.example

- Change `EXCHANGE_NAME=binance` to `EXCHANGE_NAME=kraken` (line 38)
- Update documentation to reflect Kraken as default

### 3. generate-freqtrade-config.sh

- Change default in line 82 from `binance` to `kraken`:
  ```bash
  export EXCHANGE_NAME="${EXCHANGE_NAME:-kraken}"
  ```

### Additional Considerations

**No changes needed**:

- Docker Compose configuration (exchange-agnostic)
- API server configuration (unchanged)
- Validation logic (works for any exchange)
- Security patterns (same for all exchanges)

**User action required after migration**:

- User must obtain Kraken API keys
- User must update their local `.env` file with Kraken credentials
- User must regenerate config.json: `./scripts/generate-freqtrade-config.sh`

## Related Research

- HAY-23: Secrets Management Implementation
- HAY-38: Kraken API Setup & Validation (pending)
- HAY-39: Kraken Trading Pairs Research (pending)

## Open Questions

None - the current implementation is well-documented and the migration path is clear.
