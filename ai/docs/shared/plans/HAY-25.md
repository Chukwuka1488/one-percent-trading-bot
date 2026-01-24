# HAY-25: Database & Trade Persistence Implementation Plan

**Date**: 2026-01-24
**Ticket**: HAY-25
**Status**: Ready for Implementation
**Approach**: Configure Freqtrade to use PostgreSQL (Option 1 - RECOMMENDED)

## Overview

Configure Freqtrade's built-in trade persistence to use the existing PostgreSQL database instead of SQLite. Freqtrade already provides comprehensive trade logging, position tracking, P&L calculation, and bot recovery - this is purely a configuration change to use a production-ready database backend.

## Current State Analysis

### What Already Exists

1. **PostgreSQL 16** running on port 5434 (currently used by n8n)
2. **Freqtrade** with built-in SQLAlchemy ORM using SQLite (`tradesv3.dryrun.sqlite`)
3. **Complete TypeScript types** in `dashboard/src/types/freqtrade.ts` for trades, orders, positions, balances, P&L
4. **Dashboard integration** via Freqtrade REST API
5. **Freqtrade configuration template** at `freqtrade/user_data/config.template.json`
6. **Config generation script** at `scripts/generate-freqtrade-config.sh`

### What's Missing

- `db_url` parameter in Freqtrade configuration
- PostgreSQL connection environment variables in `.env.example`
- Database initialization/migration verification
- Updated documentation
- Validation that recovery works with PostgreSQL

### Key Discoveries

From research document `/home/harkeybour/Desktop/Ubuntu/one-percent-trading-meister/WORKTREE-3/ai/docs/research/HAY-25-database-trade-persistence.md`:

- Freqtrade supports PostgreSQL via `db_url` configuration parameter (line 106-112)
- Freqtrade automatically logs trades, orders, positions, balances on every order execution (line 371-379)
- Built-in migration system for schema changes (line 100)
- Bot recovery works out-of-box - Freqtrade loads open positions from DB on startup (line 436)
- Current SQLite DB: `sqlite:///tradesv3.dryrun.sqlite` (line 91)
- Target PostgreSQL connection: `postgresql://trading:trading_local@postgres:5432/trading_bot` (line 78)

## Desired End State

After implementation:

1. Freqtrade stores all trade data in PostgreSQL instead of SQLite
2. Docker container can connect to PostgreSQL using internal DNS (`postgres:5432`)
3. Schema migrations run automatically on Freqtrade startup
4. Bot recovery from database works after restart
5. Dashboard continues to work without changes (already using REST API)
6. Data retention policy documented (archival strategy)

### Verification Criteria

- Freqtrade logs show: `Using DB: "postgresql://trading:***@postgres:5432/trading_bot"`
- PostgreSQL tables created: `trades`, `orders`, `pairlock`, `pairlockhistory`
- Trades persist across Freqtrade restarts
- Open positions recovered after container restart
- Dashboard displays trade history from PostgreSQL

## What We're NOT Doing

- NOT building a custom database layer (Freqtrade already has one)
- NOT creating custom migration scripts (Freqtrade handles migrations)
- NOT implementing custom P&L calculation (Freqtrade does this)
- NOT modifying Freqtrade's database schema (use as-is)
- NOT installing TimescaleDB (not needed for current scale)
- NOT creating separate analytics database (future enhancement if needed)
- NOT changing dashboard code (already works via REST API)

## Implementation Approach

Use Freqtrade's native PostgreSQL support by adding a single `db_url` configuration parameter. Freqtrade will automatically:

1. Connect to PostgreSQL on startup
2. Create tables if they don't exist
3. Run migrations to ensure schema is up-to-date
4. Start logging trades to PostgreSQL
5. Load open positions on restart (recovery)

This is the simplest, most maintainable approach with minimal custom code.

## Phase 1: Configuration Updates

### Overview

Add PostgreSQL connection configuration to Freqtrade config template and environment files.

### Changes Required

#### 1. Update Freqtrade Configuration Template

**File**: `/home/harkeybour/Desktop/Ubuntu/one-percent-trading-meister/WORKTREE-3/freqtrade/user_data/config.template.json`

**Changes**: Add `db_url` parameter after line 73 (before closing brace)

```json
{
  "max_open_trades": 3,
  "stake_currency": "USDT",
  ...
  "bot_name": "one-percent-bot",
  "initial_state": "running",
  "force_entry_enable": false,
  "internals": {
    "process_throttle_secs": 5
  },
  "db_url": "$FREQTRADE_DB_URL"
}
```

**Reasoning**: Uses environment variable substitution pattern consistent with existing config (e.g., `$EXCHANGE_NAME`, `$TELEGRAM_ENABLED`)

#### 2. Update Environment Example File

**File**: `/home/harkeybour/Desktop/Ubuntu/one-percent-trading-meister/WORKTREE-3/.env.example`

**Changes**: Add to Freqtrade section (after line 47)

```bash
# Freqtrade Database (PostgreSQL)
# Default: sqlite:///tradesv3.dryrun.sqlite
# For production: postgresql://trading:trading_local@postgres:5432/trading_bot
FREQTRADE_DB_URL=postgresql://trading:trading_local@postgres:5432/trading_bot
```

**Reasoning**: Documents the PostgreSQL connection string using Docker internal DNS (`postgres` hostname)

#### 3. Update Config Generation Script (Optional Enhancement)

**File**: `/home/harkeybour/Desktop/Ubuntu/one-percent-trading-meister/WORKTREE-3/scripts/generate-freqtrade-config.sh`

**Changes**: Add default value for `FREQTRADE_DB_URL` in `set_defaults()` function (after line 88)

```bash
set_defaults() {
    # ... existing code ...
    export FREQTRADE_API_USER="${FREQTRADE_API_USER:-freqtrade}"

    # Database URL (PostgreSQL by default)
    export FREQTRADE_DB_URL="${FREQTRADE_DB_URL:-postgresql://trading:trading_local@postgres:5432/trading_bot}"
}
```

**Reasoning**: Provides sensible default if user doesn't set environment variable

### Success Criteria

#### Automated Verification

- [x] Config template is valid JSON: `make -C /home/harkeybour/Desktop/Ubuntu/one-percent-trading-meister/WORKTREE-3 check`
- [x] Environment file has FREQTRADE_DB_URL documented
- [x] Config generation script runs without errors: `/home/harkeybour/Desktop/Ubuntu/one-percent-trading-meister/WORKTREE-3/scripts/generate-freqtrade-config.sh --validate`

#### Manual Verification

- [ ] Review config.template.json syntax is correct
- [ ] Verify connection string uses `postgres` hostname (Docker internal DNS)
- [ ] Check that existing config template variables still work

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: Database Initialization & Migration

### Overview

Generate Freqtrade config, restart container to trigger automatic schema creation and migration.

### Changes Required

#### 1. Generate Freqtrade Configuration

**Command**: Run config generation script

```bash
cd /home/harkeybour/Desktop/Ubuntu/one-percent-trading-meister/WORKTREE-3
./scripts/generate-freqtrade-config.sh
```

**Expected Output**: Creates `freqtrade/user_data/config.json` with PostgreSQL `db_url`

#### 2. Restart Freqtrade Container

**Command**: Restart to apply new configuration

```bash
cd /home/harkeybour/Desktop/Ubuntu/one-percent-trading-meister/WORKTREE-3
make down
make up
```

**Expected Behavior**:

- Freqtrade connects to PostgreSQL
- Auto-creates tables: `trades`, `orders`, `pairlock`, `pairlockhistory`
- Runs migrations if needed
- Logs show: `Using DB: "postgresql://trading:***@postgres:5432/trading_bot"`

#### 3. Verify Database Schema

**Command**: Check tables created in PostgreSQL

```bash
docker exec trading-postgres psql -U trading -d trading_bot -c "\dt"
```

**Expected Tables**:

- `trades` - Trade history (open and closed)
- `orders` - Order details
- `pairlock` - Active pair locks
- `pairlockhistory` - Historical pair locks (if migrations ran)

#### 4. Verify Freqtrade Logs

**Command**: Check Freqtrade startup logs

```bash
make logs-freqtrade
```

**Expected Log Lines**:

```
freqtrade.configuration.configuration - INFO - Using DB: "postgresql://trading:***@postgres:5432/trading_bot"
freqtrade.persistence.models - INFO - Running database migration
```

### Success Criteria

#### Automated Verification

- [ ] PostgreSQL container is healthy: `docker compose ps postgres | grep healthy`
- [ ] Freqtrade container is running: `docker compose ps freqtrade | grep Up`
- [ ] Tables exist in database: `docker exec trading-postgres psql -U trading -d trading_bot -c "\dt" | grep trades`
- [ ] Freqtrade API is responsive: `curl -s -u freqtrade:freqtrade http://localhost:8080/api/v1/ping | grep pong`

#### Manual Verification

- [ ] Check Freqtrade logs show PostgreSQL connection (not SQLite)
- [ ] Verify no database connection errors in logs
- [ ] Confirm 4+ tables created (trades, orders, pairlock, pairlockhistory)
- [ ] Dashboard still loads at http://localhost:3000 (if running)

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 3: Trade Persistence Validation

### Overview

Verify that trades are being persisted to PostgreSQL and can be retrieved via API and direct database queries.

### Changes Required

#### 1. Force a Test Trade (Dry-Run)

**Command**: Trigger a manual trade entry (dry-run simulated)

```bash
# Option A: Wait for strategy to generate signals naturally (may take time)
make logs-freqtrade

# Option B: Force entry via API (requires force_entry_enable: true in config)
# Not recommended for initial testing - use Option A
```

**Expected Behavior**: Freqtrade creates a simulated trade in dry-run mode

#### 2. Query Trades via API

**Command**: Fetch trades using Freqtrade REST API

```bash
# Open trades
curl -s -u freqtrade:freqtrade http://localhost:8080/api/v1/status | python3 -m json.tool

# Trade history (all trades)
curl -s -u freqtrade:freqtrade http://localhost:8080/api/v1/trades | python3 -m json.tool

# Profit summary
curl -s -u freqtrade:freqtrade http://localhost:8080/api/v1/profit | python3 -m json.tool
```

**Expected Output**: JSON response with trade data (may be empty initially)

#### 3. Query Database Directly

**Command**: Verify data in PostgreSQL

```bash
# Count trades
docker exec trading-postgres psql -U trading -d trading_bot -c "SELECT COUNT(*) FROM trades;"

# View recent trades
docker exec trading-postgres psql -U trading -d trading_bot -c "SELECT id, pair, is_open, stake_amount, open_rate, profit_pct FROM trades ORDER BY id DESC LIMIT 5;"

# View orders
docker exec trading-postgres psql -U trading -d trading_bot -c "SELECT COUNT(*) FROM orders;"
```

**Expected Output**: Trade records if trades have been executed

#### 4. Verify Dashboard Integration

**Command**: Check dashboard displays trades (if dev server running)

```bash
# Start dashboard if not running
cd /home/harkeybour/Desktop/Ubuntu/one-percent-trading-meister/WORKTREE-3
make dev
# Visit http://localhost:3000 in browser
```

**Expected Behavior**: Dashboard fetches trades via API, displays in UI (uses existing integration)

### Success Criteria

#### Automated Verification

- [ ] API returns valid JSON: `curl -s -u freqtrade:freqtrade http://localhost:8080/api/v1/trades | python3 -m json.tool`
- [ ] Database connection works: `docker exec trading-postgres psql -U trading -d trading_bot -c "SELECT 1;"`
- [ ] Trades table accessible: `docker exec trading-postgres psql -U trading -d trading_bot -c "SELECT COUNT(*) FROM trades;"`

#### Manual Verification

- [ ] Wait for or create at least one test trade (dry-run)
- [ ] Verify trade appears in API response (`/api/v1/status` or `/api/v1/trades`)
- [ ] Verify trade record exists in PostgreSQL `trades` table
- [ ] Confirm trade data includes: pair, stake_amount, open_rate, profit_pct
- [ ] Check dashboard displays trade if UI is running

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 4: Bot Recovery Testing

### Overview

Verify that Freqtrade can recover its state from PostgreSQL after a restart, specifically testing open position recovery.

### Changes Required

#### 1. Create Open Position for Recovery Test

**Command**: Ensure at least one open trade exists

```bash
# Check for open trades
curl -s -u freqtrade:freqtrade http://localhost:8080/api/v1/status | python3 -c "import json, sys; print('Open trades:', len(json.load(sys.stdin)))"

# If no open trades, wait for strategy to enter a position
make logs-freqtrade  # Watch for "New trade created" log
```

**Expected Behavior**: At least 1 open trade in the system

#### 2. Record Pre-Restart State

**Command**: Save current state for comparison

```bash
# Save open trades to file
curl -s -u freqtrade:freqtrade http://localhost:8080/api/v1/status > /tmp/trades_before_restart.json

# Note the trade IDs
cat /tmp/trades_before_restart.json | python3 -c "import json, sys; [print(f\"Trade {t['trade_id']}: {t['pair']} - {t['profit_pct']}%\") for t in json.load(sys.stdin)]"
```

**Expected Output**: List of open trades with IDs

#### 3. Restart Freqtrade Container

**Command**: Simulate bot restart

```bash
docker compose restart freqtrade
```

**Expected Behavior**: Container stops and starts cleanly

#### 4. Verify Recovery After Restart

**Command**: Check that open positions were recovered

```bash
# Wait for Freqtrade to fully start (5-10 seconds)
sleep 10

# Fetch open trades after restart
curl -s -u freqtrade:freqtrade http://localhost:8080/api/v1/status > /tmp/trades_after_restart.json

# Compare trade IDs
echo "Before restart:"
cat /tmp/trades_before_restart.json | python3 -c "import json, sys; [print(f\"Trade {t['trade_id']}: {t['pair']}\") for t in json.load(sys.stdin)]"
echo "After restart:"
cat /tmp/trades_after_restart.json | python3 -c "import json, sys; [print(f\"Trade {t['trade_id']}: {t['pair']}\") for t in json.load(sys.stdin)]"
```

**Expected Outcome**: Same trade IDs present before and after restart

#### 5. Check Recovery Logs

**Command**: Verify Freqtrade logged position recovery

```bash
make logs-freqtrade | grep -i "loading\|recovering\|database"
```

**Expected Log Lines**:

```
freqtrade.persistence - INFO - Found X open trades in database
freqtrade.wallets - INFO - Wallets synced
```

### Success Criteria

#### Automated Verification

- [ ] Freqtrade restarts without errors: `docker compose restart freqtrade && sleep 10 && docker compose ps freqtrade | grep Up`
- [ ] API responds after restart: `curl -s -u freqtrade:freqtrade http://localhost:8080/api/v1/ping | grep pong`
- [ ] Database contains open trades: `docker exec trading-postgres psql -U trading -d trading_bot -c "SELECT COUNT(*) FROM trades WHERE is_open = true;"`

#### Manual Verification

- [ ] Create at least one open trade before restart
- [ ] Record trade IDs and pairs before restart
- [ ] Restart container and wait for full startup
- [ ] Verify same trade IDs present after restart
- [ ] Check logs show "Found X open trades" message
- [ ] Confirm P&L values maintained across restart

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 5: Documentation & Archival Policy

### Overview

Document the PostgreSQL persistence setup and establish a data retention/archival policy.

### Changes Required

#### 1. Update HAY-25 Progress File

**File**: `/home/harkeybour/Desktop/Ubuntu/one-percent-trading-meister/WORKTREE-3/ai/docs/shared/progress/HAY-25.md`

**Content**: Create new progress file

````markdown
# HAY-25: Database & Trade Persistence

**Status:** Complete ✅
**Branch:** `feature/hay-25-database-trade-persistence`

## Objective

Configure database infrastructure to store trade history, positions, and P&L data for recovery, auditing, and analysis.

## Done

- [x] Configured Freqtrade to use PostgreSQL instead of SQLite
- [x] Added `db_url` parameter to Freqtrade config template
- [x] Updated environment variables in `.env.example`
- [x] Verified PostgreSQL schema creation and migrations
- [x] Validated trade persistence to database
- [x] Tested bot recovery after restart (open positions recovered)
- [x] Documented data retention policy

## Implementation Approach

Used Freqtrade's built-in PostgreSQL support (Option 1 from research). Changed single configuration parameter `db_url` to point to existing PostgreSQL database. No custom code required.

## Database Details

**Connection String**: `postgresql://trading:trading_local@postgres:5432/trading_bot`

**Tables Created by Freqtrade**:

- `trades` - All trades (open and closed)
- `orders` - Order execution history
- `pairlock` - Active trading pair locks
- `pairlockhistory` - Historical pair locks

**Schema Management**: Handled automatically by Freqtrade's SQLAlchemy migrations

## Data Retention Policy

**Active Data** (in PostgreSQL):

- All trades: Kept indefinitely
- Open positions: Until closed
- Order history: Last 90 days recommended (configurable)

**Archival Strategy**:

```bash
# Future: Archive old closed trades (>90 days) to separate table or file
# Run monthly via cron or n8n workflow
# Freqtrade command: freqtrade download-data --trades --export-filename archive_YYYY_MM.json
```
````

**Backup Strategy**:

- PostgreSQL data persisted to `.docker/postgres` (Docker volume)
- Regular backups via `pg_dump` recommended for production
- Retention: 30 daily, 12 monthly backups

## Trade Logging

**Automatic Logging** (no code changes needed):

- ✅ Every order execution logged to `orders` table
- ✅ Position tracking in `trades` table (is_open flag)
- ✅ P&L calculation on every trade update
- ✅ Fees tracked per order (fee_open, fee_close)

## Bot Recovery

**Recovery Process** (automatic on Freqtrade startup):

1. Connects to PostgreSQL
2. Queries `trades` table for `is_open = true`
3. Loads open positions into memory
4. Syncs wallet balances
5. Resumes trading strategy

**Tested Scenarios**:

- [x] Container restart with open positions
- [x] Database migration on startup
- [x] Recovery with multiple open trades

## Verification Commands

```bash
# Check database connection
make logs-freqtrade | grep "Using DB"

# View open trades (API)
make trades

# View trades (database)
docker exec trading-postgres psql -U trading -d trading_bot -c "SELECT id, pair, is_open, profit_pct FROM trades;"

# Profit summary
make profit
```

## Files Modified

- `freqtrade/user_data/config.template.json` - Added `db_url` parameter
- `.env.example` - Added `FREQTRADE_DB_URL` documentation
- `scripts/generate-freqtrade-config.sh` - Added default DB URL

## Next Steps

Future enhancements (not part of HAY-25):

- [ ] HAY-26: Analytics dashboard with historical trade charts
- [ ] HAY-27: Automated backup script for PostgreSQL
- [ ] HAY-28: Data export to CSV/JSON for external analysis

````

#### 2. Add Database Maintenance Section to README

**File**: `/home/harkeybour/Desktop/Ubuntu/one-percent-trading-meister/WORKTREE-3/README.md` (if exists) or create operations guide

**Changes**: Add to "Database" or "Operations" section

```markdown
## Database Maintenance

### Trade Data Retention

Freqtrade stores all trade history in PostgreSQL (`trading_bot` database).

**Current Policy**:
- **Active trades**: Kept until closed
- **Closed trades**: Retained indefinitely (future: archive after 90 days)
- **Orders**: Full history maintained

### Manual Archival (Future)

To archive old trades:

```bash
# Export trades to JSON
docker exec trading-freqtrade freqtrade download-data \
  --trades \
  --export-filename /freqtrade/user_data/archive_$(date +%Y_%m).json

# Delete archived trades from database (optional, careful!)
docker exec trading-postgres psql -U trading -d trading_bot -c \
  "DELETE FROM trades WHERE close_date < NOW() - INTERVAL '90 days' AND is_open = false;"
````

### Database Backup

```bash
# Backup PostgreSQL database
docker exec trading-postgres pg_dump -U trading trading_bot > backup_$(date +%Y%m%d).sql

# Restore from backup
docker exec -i trading-postgres psql -U trading trading_bot < backup_YYYYMMDD.sql
```

### Database Schema Inspection

```bash
# List all tables
docker exec trading-postgres psql -U trading -d trading_bot -c "\dt"

# View trades schema
docker exec trading-postgres psql -U trading -d trading_bot -c "\d trades"

# Count trades by status
docker exec trading-postgres psql -U trading -d trading_bot -c \
  "SELECT is_open, COUNT(*) FROM trades GROUP BY is_open;"
```

````

#### 3. Update Makefile with Database Commands

**File**: `/home/harkeybour/Desktop/Ubuntu/one-percent-trading-meister/WORKTREE-3/Makefile`

**Changes**: Add new section after Freqtrade targets (after line 173)

```makefile
# -----------------------------------------------------------------------------
# DATABASE TARGETS
# -----------------------------------------------------------------------------
.PHONY: db-shell
db-shell: ## Open PostgreSQL shell
	docker exec -it trading-postgres psql -U trading -d trading_bot

.PHONY: db-backup
db-backup: ## Backup PostgreSQL database
	@mkdir -p .backups
	docker exec trading-postgres pg_dump -U trading trading_bot > .backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "✓ Backup saved to .backups/"

.PHONY: db-trades
db-trades: ## Show recent trades from database
	docker exec trading-postgres psql -U trading -d trading_bot -c "SELECT id, pair, is_open, stake_amount, open_rate, profit_pct, open_date FROM trades ORDER BY open_date DESC LIMIT 10;"

.PHONY: db-stats
db-stats: ## Show database statistics
	@echo "Trade Statistics:"
	@docker exec trading-postgres psql -U trading -d trading_bot -c "SELECT is_open, COUNT(*) as count, ROUND(AVG(profit_pct)::numeric, 2) as avg_profit_pct FROM trades GROUP BY is_open;"
````

### Success Criteria

#### Automated Verification

- [x] Progress file is valid markdown: `make format-fix`
- [x] Makefile targets work: `make help | grep db-`
- [x] Documentation builds without errors

#### Manual Verification

- [ ] Review HAY-25.md progress file for completeness
- [ ] Verify README database section is clear and accurate
- [ ] Test new Makefile commands (db-shell, db-trades, db-stats)
- [ ] Confirm backup command creates `.backups/` directory
- [ ] Run `make db-stats` and verify output format

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful.

---

## Testing Strategy

### Unit Tests

**Not applicable** - This is a configuration change, not custom code. Freqtrade's internal tests cover database persistence.

### Integration Tests

Manual integration testing (described in Phase success criteria):

1. **Config Generation**: Script generates valid config.json
2. **Database Connection**: Freqtrade connects to PostgreSQL on startup
3. **Schema Creation**: Tables created automatically via migrations
4. **Trade Persistence**: Trades written to database
5. **API Integration**: REST API retrieves data from PostgreSQL
6. **Recovery**: Open positions recovered after restart

### Manual Testing Steps

#### Scenario 1: Fresh Setup

1. Stop existing Freqtrade: `make down`
2. Delete old SQLite database: `rm freqtrade/user_data/*.sqlite`
3. Generate new config: `./scripts/generate-freqtrade-config.sh`
4. Start services: `make up`
5. Verify PostgreSQL connection in logs: `make logs-freqtrade | grep "Using DB"`
6. Wait for a trade to be created (or force one in dry-run)
7. Query trade via API: `make trades`
8. Query trade via database: `make db-trades`

#### Scenario 2: Recovery Testing

1. Ensure at least one open trade exists: `make trades`
2. Record open trade IDs
3. Restart Freqtrade: `docker compose restart freqtrade`
4. Wait 10 seconds for startup
5. Check trades recovered: `make trades`
6. Verify same trade IDs present
7. Check logs for "Found X open trades" message

#### Scenario 3: Migration Testing

1. Simulate schema change by downgrading Freqtrade version (optional, advanced)
2. Start Freqtrade (older version)
3. Upgrade to latest version
4. Check logs for migration messages
5. Verify database schema updated

## Performance Considerations

### Expected Performance

- **Database writes**: ~1 write per order execution (low frequency in dry-run)
- **Database reads**: On API requests from dashboard (occasional)
- **Migration time**: <1 second for empty database, <5 seconds for populated
- **Recovery time**: <2 seconds for <100 open positions

### Optimization (Not Needed Yet)

Future optimizations if performance degrades:

- Add indexes on frequently queried columns (`pair`, `is_open`, `open_date`)
- Connection pooling (Freqtrade handles this via SQLAlchemy)
- Read replicas for analytics queries (not needed at current scale)

### Resource Usage

- **Disk space**: ~1KB per trade, ~10MB for 10,000 trades (negligible)
- **Memory**: SQLAlchemy connection pool ~10MB
- **Network**: Local Docker network (minimal latency)

## Migration Notes

### Data Migration from SQLite (If Needed)

If preserving existing SQLite data:

```bash
# Export from SQLite
sqlite3 freqtrade/user_data/tradesv3.dryrun.sqlite .dump > sqlite_dump.sql

# Convert to PostgreSQL format (manual editing required)
# Or use pgloader tool

# Import to PostgreSQL
docker exec -i trading-postgres psql -U trading -d trading_bot < postgres_dump.sql
```

**Recommendation**: For this implementation, start fresh with PostgreSQL. Historical dry-run data is not critical.

### Rollback Plan

If PostgreSQL causes issues:

1. Stop Freqtrade: `docker compose stop freqtrade`
2. Remove `db_url` from config.template.json
3. Regenerate config: `./scripts/generate-freqtrade-config.sh`
4. Restart Freqtrade: `docker compose up freqtrade`
5. Freqtrade will revert to SQLite (`tradesv3.dryrun.sqlite`)

### Docker Volume Persistence

PostgreSQL data stored in: `.docker/postgres/` (bind mount)

**Backup before major changes**:

```bash
make db-backup
```

**Complete reset** (destroys all data):

```bash
make clean-docker  # Removes volumes
make up            # Recreates empty database
```

## References

- **Original ticket**: HAY-25 Database & Trade Persistence
- **Research document**: `/home/harkeybour/Desktop/Ubuntu/one-percent-trading-meister/WORKTREE-3/ai/docs/research/HAY-25-database-trade-persistence.md`
- **Freqtrade database docs**: https://www.freqtrade.io/en/stable/configuration/#database
- **Current config template**: `/home/harkeybour/Desktop/Ubuntu/one-percent-trading-meister/WORKTREE-3/freqtrade/user_data/config.template.json`
- **Docker setup**: `/home/harkeybour/Desktop/Ubuntu/one-percent-trading-meister/WORKTREE-3/docker-compose.yml`
- **HAY-8 (Trading Bot Setup)**: `/home/harkeybour/Desktop/Ubuntu/one-percent-trading-meister/WORKTREE-3/ai/docs/shared/progress/HAY-8.md`

## Risk Assessment

### Low Risk

- Using Freqtrade's native PostgreSQL support (well-tested)
- No custom database code
- Minimal configuration changes
- Easy rollback to SQLite if needed

### Mitigation Strategies

- **Database connection failure**: Freqtrade will log error and exit; check PostgreSQL health
- **Migration errors**: Freqtrade logs detailed migration errors; consult Freqtrade docs
- **Data loss**: PostgreSQL data persisted to disk; backup before major changes
- **Performance degradation**: Monitor logs; add indexes if needed (unlikely at current scale)

### Pre-Implementation Checklist

- [ ] PostgreSQL container running and healthy
- [ ] .env file contains database credentials
- [ ] Backup existing SQLite database (if preserving data)
- [ ] Review config.template.json syntax
- [ ] Test config generation script in dry-run mode
