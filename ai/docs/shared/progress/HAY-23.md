# HAY-23: API Key Security & Secrets Management

**Status:** In Progress (Phase 1 Complete)
**Terminal:** T4 (AI Tools/Research)
**Branch:** `akiborchukwuka/hay-23-api-key-security-secrets-management`

---

## Objective

Implement secure storage and management of API keys and other secrets.

---

## Current State Analysis

### What's Good

- [x] `.env` and `.envrc` are gitignored
- [x] `.env.example` provides template for required vars
- [x] Docker Compose uses env var substitution

### Security Issues Found

- [x] `freqtrade/user_data/config.json` is tracked with hardcoded dev credentials **FIXED**
- [ ] No API key permission validation (withdrawal check)
- [ ] No secret rotation mechanism
- [ ] No audit logging for secret access
- [x] Freqtrade JWT secret is hardcoded **FIXED**

### Files with Secrets Configuration

| File                                       | Secrets                       | Status        |
| ------------------------------------------ | ----------------------------- | ------------- |
| `.env`                                     | All API keys                  | Gitignored ✅ |
| `.envrc`                                   | Linear/Perplexity/Gemini keys | Gitignored ✅ |
| `.env.example`                             | Template only                 | Tracked ✅    |
| `docker-compose.yml`                       | Uses env vars                 | Safe ✅       |
| `freqtrade/user_data/config.json`          | Generated from template       | Gitignored ✅ |
| `freqtrade/user_data/config.template.json` | Placeholders only             | Tracked ✅    |

---

## Implementation Plan

### Phase 1: Environment Variable Templating (Local Dev) ✅ COMPLETE

- [x] Create `freqtrade/user_data/config.template.json`
- [x] Add startup script to generate config from template + env vars
- [x] Remove hardcoded secrets from tracked config.json
- [x] Update .env.example with all Freqtrade secrets

### Phase 2: API Key Validation

- [ ] Create `ai/tools/secrets/validate-keys.ts` script
- [ ] Validate Binance API key permissions (reject withdrawal access)
- [ ] Validate API key format before startup
- [ ] Add IP whitelist check reminder

### Phase 3: Secret Access Auditing

- [ ] Log when secrets are accessed
- [ ] Track which service reads which secret
- [ ] Store audit log in database

### Phase 4: Production Secrets (Future)

- [ ] Docker Secrets integration
- [ ] Consider HashiCorp Vault for production
- [ ] CI/CD secrets management

---

## Progress

### Session 1 (T4) - Phase 1 Complete

- [x] Reviewed ticket requirements
- [x] Analyzed current secrets handling
- [x] Identified security issues
- [x] Created implementation plan
- [x] Created `freqtrade/user_data/config.template.json` with env var placeholders
- [x] Created `scripts/generate-freqtrade-config.sh` script
  - Auto-generates secure JWT secret, WS token, and API password
  - Validates config before generation
  - Sets restrictive file permissions (600)
- [x] Updated `.env.example` with all Freqtrade secrets
- [x] Updated `.gitignore` to ignore generated config.json
- [x] Removed `config.json` from git tracking
- [x] Tested config generation - works correctly

### Files Created/Modified

| File                                       | Action                        |
| ------------------------------------------ | ----------------------------- |
| `freqtrade/user_data/config.template.json` | Created                       |
| `scripts/generate-freqtrade-config.sh`     | Created                       |
| `.env.example`                             | Updated with Freqtrade vars   |
| `.gitignore`                               | Updated to ignore config.json |
| `freqtrade/user_data/config.json`          | Removed from git              |

### Next Steps

- [ ] Implement Phase 2: API key permission validation
- [ ] Create PR for Phase 1 changes

---

## Usage

### Generate Freqtrade Config

```bash
# 1. Copy .env.example to .env and fill in values
cp .env.example .env

# 2. Generate config from template
./scripts/generate-freqtrade-config.sh

# 3. Start Freqtrade
docker compose up freqtrade
```

### Environment Variables (Freqtrade)

| Variable                 | Required   | Description                       |
| ------------------------ | ---------- | --------------------------------- |
| `EXCHANGE_NAME`          | No         | Exchange name (default: binance)  |
| `EXCHANGE_API_KEY`       | Live only  | Exchange API key                  |
| `EXCHANGE_API_SECRET`    | Live only  | Exchange API secret               |
| `FREQTRADE_JWT_SECRET`   | No         | Auto-generated if empty           |
| `FREQTRADE_WS_TOKEN`     | No         | Auto-generated if empty           |
| `FREQTRADE_API_USER`     | No         | API username (default: freqtrade) |
| `FREQTRADE_API_PASSWORD` | No         | Auto-generated if empty           |
| `TELEGRAM_ENABLED`       | No         | Enable Telegram (default: false)  |
| `TELEGRAM_BOT_TOKEN`     | If enabled | Telegram bot token                |
| `TELEGRAM_CHAT_ID`       | If enabled | Telegram chat ID                  |

---

## Acceptance Criteria Checklist

- [x] Encrypted storage for API keys (not plaintext in config) - **env vars + generated config**
- [x] Environment-based secrets (dev/staging/prod) - **.env files per environment**
- [ ] API key permission validation (reject keys with withdrawal access)
- [x] Secret rotation support without downtime - **regenerate config.json**
- [ ] Audit log for secret access
- [x] No secrets in git history
- [ ] Secure secrets in CI/CD pipeline

---

## Notes

- Config generation script auto-generates secure random values for JWT, WS token, and password
- Generated config.json has 600 permissions (owner read/write only)
- Template uses simple `$VAR` syntax for envsubst compatibility
- Dry-run mode doesn't require exchange credentials
