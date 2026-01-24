# HAY-25: Database & Trade Persistence

**Status:** Complete
**Branch:** `feature/hay-25-database-trade-persistence`

## Objective

Configure database infrastructure to store trade history, positions, and P&L data for recovery, auditing, and analysis.

## Done

- [x] Configured Freqtrade to use PostgreSQL instead of SQLite
- [x] Added `db_url` parameter to Freqtrade config template
- [x] Updated environment variables in `.env.example`
- [x] Updated config generation script with default DB URL
- [x] Added database Makefile targets (db-shell, db-backup, db-trades, db-stats)
- [x] Created progress documentation

## Implementation Approach

Used Freqtrade's built-in PostgreSQL support (Option 1 from research). Changed single configuration parameter `db_url` to point to existing PostgreSQL database. No custom code required.

## Database Details

**Connection String**: `postgresql://trading:trading_local@postgres:5432/trading_bot`

**Tables Created by Freqtrade** (on first startup):

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

**Backup Strategy**:

- PostgreSQL data persisted to `.docker/postgres` (Docker volume)
- Regular backups via `pg_dump` recommended for production
- Retention: 30 daily, 12 monthly backups

## Trade Logging

**Automatic Logging** (no code changes needed):

- Every order execution logged to `orders` table
- Position tracking in `trades` table (is_open flag)
- P&L calculation on every trade update
- Fees tracked per order (fee_open, fee_close)

## Bot Recovery

**Recovery Process** (automatic on Freqtrade startup):

1. Connects to PostgreSQL
2. Queries `trades` table for `is_open = true`
3. Loads open positions into memory
4. Syncs wallet balances
5. Resumes trading strategy

## Verification Commands

```bash
# Check database connection
make logs-freqtrade | grep "Using DB"

# View open trades (API)
make trades

# View trades (database)
make db-trades

# Database shell
make db-shell

# Profit summary
make profit

# Database statistics
make db-stats

# Backup database
make db-backup
```

## Files Modified

- `freqtrade/user_data/config.template.json` - Added `db_url` parameter
- `.env.example` - Added `FREQTRADE_DB_URL` documentation
- `scripts/generate-freqtrade-config.sh` - Added default DB URL
- `Makefile` - Added database targets (db-shell, db-backup, db-trades, db-stats)

## Next Steps

Future enhancements (not part of HAY-25):

- [ ] HAY-26: Analytics dashboard with historical trade charts
- [ ] HAY-27: Automated backup script for PostgreSQL
- [ ] HAY-28: Data export to CSV/JSON for external analysis
