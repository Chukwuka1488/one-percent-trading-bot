---
date: 2026-01-24T11:58:45-06:00
researcher: harkeybour
git_commit: 5f9f1fb7ed8ebf77cd58bd8f7a5b598c198a3aa3
branch: feature/hay-25-database-trade-persistence
repository: one-percent-trading-bot
topic: "HAY-25 Database & Trade Persistence - Infrastructure Research"
tags: [research, codebase, database, freqtrade, postgresql, persistence, hay-25]
status: complete
last_updated: 2026-01-24
last_updated_by: harkeybour
---

# Research: HAY-25 Database & Trade Persistence

**Date**: 2026-01-24T11:58:45-06:00
**Researcher**: harkeybour
**Git Commit**: 5f9f1fb7ed8ebf77cd58bd8f7a5b598c198a3aa3
**Branch**: feature/hay-25-database-trade-persistence
**Repository**: one-percent-trading-bot

## Research Question

HAY-25 requires implementing database infrastructure to store trade history, positions, and P&L data for recovery, auditing, and analysis. The research focused on:

1. Existing database infrastructure (PostgreSQL on 5434)
2. Freqtrade trade persistence mechanisms
3. Type definitions for trades/orders/positions
4. ORM/query builder usage
5. HAY-8 Trading Bot Framework structure

## Summary

The codebase already has significant database infrastructure in place:

- **PostgreSQL 16** is running on port 5434 (docker-compose.yml) for n8n workflow data
- **Freqtrade** has built-in SQLite database (`tradesv3.dryrun.sqlite`) for trade persistence
- **Comprehensive TypeScript type definitions** exist for trades, orders, positions, balances, and P&L in `dashboard/src/types/freqtrade.ts`
- **No ORM is currently used** - dashboard uses direct REST API calls to Freqtrade
- **HAY-8 (Trading Bot Framework)** is complete - Freqtrade is configured and running in dry-run mode

**Key Finding**: Freqtrade already provides comprehensive trade persistence via SQLite. The ticket should focus on either:

1. Extending Freqtrade's built-in database to PostgreSQL for production
2. Creating a separate analytics/auditing database that syncs from Freqtrade's data
3. Leveraging Freqtrade's existing persistence and building recovery/auditing features on top

## Detailed Findings

### 1. Existing Database Infrastructure (PostgreSQL)

**Location**: `/home/harkeybour/Desktop/Ubuntu/one-percent-trading-meister/WORKTREE-3/docker-compose.yml:28-44`

PostgreSQL 16 is already configured and running:

```yaml
postgres:
  image: postgres:16-alpine
  container_name: trading-postgres
  restart: unless-stopped
  environment:
    POSTGRES_USER: ${POSTGRES_USER:-trading}
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-trading_local}
    POSTGRES_DB: ${POSTGRES_DB:-trading_bot}
  volumes:
    - postgres_data:/var/lib/postgresql/data
  ports:
    - "${POSTGRES_PORT:-5434}:5432"
```

**Current Usage**:

- n8n workflow automation uses this PostgreSQL database (docker-compose.yml:59-64)
- Database name: `trading_bot`
- Port: 5434 (host) → 5432 (container)
- Data persisted to: `.docker/postgres` directory

**Connection String**: `postgresql://trading:trading_local@postgres:5432/trading_bot`

**TimescaleDB**: NOT currently installed. Would require changing from `postgres:16-alpine` to `timescale/timescaledb:latest-pg16` image.

### 2. Freqtrade Trade Persistence Mechanisms

**Location**: Freqtrade container, logs show database usage

Freqtrade has **built-in trade persistence** using SQLite:

**Database File**: `tradesv3.dryrun.sqlite` (from logs: `/home/harkeybour/Desktop/Ubuntu/one-percent-trading-meister/WORKTREE-3/freqtrade/user_data/logs/freqtrade.log:6`)

```
2026-01-12 21:28:37,301 - freqtrade.configuration.configuration - INFO - Using DB: "sqlite:///tradesv3.dryrun.sqlite"
```

**Freqtrade Database Features** (from Freqtrade documentation):

- Stores all trades, orders, positions automatically
- Supports SQLite (default) and PostgreSQL
- Schema managed by SQLAlchemy ORM (Python-side)
- Can be configured via `db_url` in config.json
- Includes migration system for schema changes

**Configuration Location**: `/home/harkeybour/Desktop/Ubuntu/one-percent-trading-meister/WORKTREE-3/freqtrade/user_data/config.template.json`

**Current State**: No `db_url` specified in config.template.json, so Freqtrade uses default SQLite.

**To Use PostgreSQL with Freqtrade**: Add to config.json:

```json
{
  "db_url": "postgresql://trading:trading_local@postgres:5432/trading_bot"
}
```

### 3. Type Definitions for Trades/Orders/Positions

**Location**: `/home/harkeybour/Desktop/Ubuntu/one-percent-trading-meister/WORKTREE-3/dashboard/src/types/freqtrade.ts`

Comprehensive TypeScript types already exist based on Freqtrade REST API v1:

#### Trade Type (Lines 20-67)

```typescript
export interface Trade {
  trade_id: number;
  pair: string;
  base_currency: string;
  quote_currency: string;
  is_open: boolean;
  exchange: string;
  amount: number;
  stake_amount: number;
  strategy: string;
  timeframe: string;
  // Fees
  fee_open: number;
  fee_open_cost: number;
  fee_close: number;
  // Dates
  open_date: string;
  open_timestamp: number;
  close_date: string | null;
  close_timestamp: number | null;
  // Rates
  open_rate: number;
  close_rate: number | null;
  current_rate: number;
  // P&L
  profit_ratio: number;
  profit_pct: number;
  profit_abs: number;
  close_profit: number | null;
  close_profit_pct: number | null;
  close_profit_abs: number | null;
  // Stop Loss
  stop_loss_abs: number;
  stop_loss_pct: number;
  stoploss_order_id: string | null;
  // Min/Max
  min_rate: number;
  max_rate: number;
  // Advanced
  leverage: number;
  is_short: boolean;
  trading_mode: string;
  orders: TradeOrder[];
}
```

#### TradeOrder Type (Lines 69-82)

```typescript
export interface TradeOrder {
  order_id: string;
  status: string;
  amount: number;
  average: number;
  filled: number;
  remaining: number;
  cost: number;
  order_date: string;
  order_timestamp: number;
  order_filled_date: string | null;
  order_type: string;
  side: "buy" | "sell";
}
```

#### Profit Type (Lines 85-113)

```typescript
export interface Profit {
  profit_closed_coin: number;
  profit_closed_percent_mean: number;
  profit_closed_ratio_mean: number;
  profit_closed_percent_sum: number;
  profit_all_coin: number;
  profit_all_percent: number;
  profit_all_fiat: number;
  trade_count: number;
  closed_trade_count: number;
  first_trade_date: string;
  first_trade_timestamp: number;
  latest_trade_date: string;
  latest_trade_timestamp: number;
  avg_duration: string;
  best_pair: string;
  best_rate: number;
  winning_trades: number;
  losing_trades: number;
}
```

#### Balance Type (Lines 116-127)

```typescript
export interface Balance {
  currency: string;
  free: number;
  balance: number;
  used: number;
  est_stake: number;
  stake: string;
  side: string;
  leverage: number;
  is_position: boolean;
  position: number;
}
```

#### BalanceResponse Type (Lines 129-142)

Includes aggregated balance data with starting capital tracking.

**Key Insight**: These types mirror Freqtrade's internal database schema. Any custom database should either reuse these or extend them minimally.

### 4. ORM/Query Builder Usage in Codebase

**Finding**: No ORM currently used in TypeScript/JavaScript codebase.

**Dashboard Package Dependencies** (`/home/harkeybour/Desktop/Ubuntu/one-percent-trading-meister/WORKTREE-3/dashboard/package.json:12-17`):

- `@tanstack/react-query` - Data fetching/caching
- `zustand` - State management
- No Prisma, TypeORM, Drizzle, Sequelize, or Knex

**API Integration Pattern** (`/home/harkeybour/Desktop/Ubuntu/one-percent-trading-meister/WORKTREE-3/dashboard/src/services/freqtrade.ts`):

- Direct REST API calls to Freqtrade
- Uses `fetch()` with Basic Auth
- Type-safe via TypeScript interfaces

**Freqtrade Side** (Python):

- Uses SQLAlchemy ORM (built into Freqtrade)
- Manages its own schema migrations

**Recommendation for HAY-25**:

- If building custom analytics DB: Consider **Prisma** (TypeScript-first, great DX, migration support)
- If extending Freqtrade DB: Work within Freqtrade's SQLAlchemy system
- If read-only analytics: No ORM needed, use direct SQL with type-safe query builder like Kysely

### 5. HAY-8 Trading Bot Framework Structure

**Status**: HAY-8 is **COMPLETE** ✅

**Documentation**: `/home/harkeybour/Desktop/Ubuntu/one-percent-trading-meister/WORKTREE-3/ai/docs/shared/progress/HAY-8.md`

**Architecture**:

```
┌─────────────────────────────────────────────────────────────┐
│                    One Percent Trading Bot                   │
├─────────────────────────────────────────────────────────────┤
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
└─────────────────────────────────────────────────────────────┘
```

**Freqtrade Configuration**:

- Running in dry-run mode (simulated trading)
- API server accessible at `http://localhost:8080`
- Credentials: `freqtrade` / `freqtrade`
- Max open trades: 3
- Stake: $1,000 USDT (simulated wallet)
- Trading pairs: BTC/USDT, ETH/USDT
- Strategy: RSI-based (SampleStrategy.py)

**Order Execution Flow**:

1. Freqtrade strategy generates entry/exit signals
2. Order placed via exchange (dry-run = simulated)
3. **Trade automatically persisted to SQLite database**
4. Position tracking managed by Freqtrade
5. Dashboard polls REST API for trade data

**Integration Point for HAY-25**:

- Freqtrade already logs every order execution to database
- Freqtrade already tracks open/closed positions
- Freqtrade already calculates P&L (realized and unrealized)
- **No custom logging needed** - data already exists in Freqtrade's DB

## Code References

- `docker-compose.yml:28-44` - PostgreSQL database configuration
- `docker-compose.yml:97-109` - Freqtrade service configuration
- `freqtrade/user_data/config.template.json` - Freqtrade configuration template
- `dashboard/src/types/freqtrade.ts:20-209` - Complete type definitions for trades, orders, positions, balances, P&L
- `dashboard/src/services/freqtrade.ts:56-147` - Freqtrade REST API integration
- `ai/docs/shared/progress/HAY-8.md` - Trading Bot Framework implementation status

## Architecture Documentation

### Current Database Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Database Layer                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────┐    ┌─────────────────────────┐ │
│  │  PostgreSQL (:5434)    │    │  Freqtrade SQLite       │ │
│  │                        │    │  (tradesv3.dryrun)      │ │
│  │  - n8n workflows       │    │  - Trade history        │ │
│  │  - n8n credentials     │    │  - Orders               │ │
│  │  - Workflow executions │    │  - Positions (open/closed)│
│  │                        │    │  - P&L data             │ │
│  │  (Currently empty for  │    │  - Balances             │ │
│  │   trading data)        │    │                         │ │
│  └────────────────────────┘    └─────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Order Execution:
  Freqtrade Strategy → Exchange API → Order Filled →
  SQLite DB (automatic) → REST API → Dashboard

Dashboard Queries:
  React Component → freqtradeApi.getTradeHistory() →
  HTTP GET /api/v1/trades → Freqtrade REST API →
  Freqtrade reads from SQLite → Returns JSON → TypeScript Types
```

## Answers to Critical Research Questions

### Q1: What database infrastructure already exists in the project?

**Answer**:

- PostgreSQL 16 running on port 5434, currently used by n8n
- Freqtrade's built-in SQLite database (`tradesv3.dryrun.sqlite`) storing all trade data
- Data volumes persisted in `.docker/` directory
- No TimescaleDB extension currently installed

### Q2: How does Freqtrade currently persist trade data?

**Answer**:

- Freqtrade uses SQLAlchemy ORM (Python) with SQLite by default
- Database: `sqlite:///tradesv3.dryrun.sqlite`
- **Automatically logs**: trades, orders, positions, balances on every order execution
- Supports PostgreSQL via `db_url` configuration parameter
- Built-in migration system for schema changes
- No additional implementation needed - **trade persistence already works**

### Q3: What type definitions exist for trades/orders/positions?

**Answer**:
Complete TypeScript type definitions exist in `dashboard/src/types/freqtrade.ts`:

- `Trade` (47 fields) - comprehensive trade data including fees, P&L, stop-loss
- `TradeOrder` (13 fields) - order details with fill status
- `Profit` (19 fields) - aggregated P&L metrics
- `Balance` (11 fields) - wallet balances per currency
- `BalanceResponse` (12 fields) - aggregated balance with starting capital

These types mirror Freqtrade's internal schema and REST API.

### Q4: What ORM/query builder is already used?

**Answer**:

- **TypeScript/Dashboard**: None. Uses direct REST API calls via `fetch()`
- **Freqtrade (Python)**: SQLAlchemy ORM (built-in, not modifiable)
- **Recommendation**: If building separate analytics DB, use Prisma for TypeScript type safety and migrations

### Q5: How is HAY-8 (Trading Bot Framework) structured for order execution?

**Answer**:

- HAY-8 is complete - Freqtrade configured and running
- Order flow: Strategy signals → Freqtrade execution engine → Exchange API → Database logging (automatic)
- REST API at `http://localhost:8080` provides access to all trade data
- Dashboard already integrated with Freqtrade API
- **Integration point**: Freqtrade's database is the authoritative source - sync/mirror it rather than duplicate logging

## Related Research

- HAY-8 Trading Bot Framework Setup: `/home/harkeybour/Desktop/Ubuntu/one-percent-trading-meister/WORKTREE-3/ai/docs/shared/progress/HAY-8.md`
- HAY-25 Analysis Document: `/home/harkeybour/Desktop/Ubuntu/one-percent-trading-meister/WORKTREE-3/ai/docs/tickets/HAY-25-analysis.md`

## Implementation Recommendations

Based on research findings, there are **three viable approaches** for HAY-25:

### Option 1: Use Freqtrade's PostgreSQL Support (RECOMMENDED)

**Approach**: Configure Freqtrade to use existing PostgreSQL instead of SQLite.

**Pros**:

- Minimal code changes - just configuration
- Production-ready database (PostgreSQL > SQLite for concurrent access)
- Freqtrade handles all persistence, migrations, recovery automatically
- Dashboard already has complete types and API integration
- Single source of truth

**Implementation**:

1. Add `db_url` to Freqtrade config: `postgresql://trading:trading_local@postgres:5432/trading_bot`
2. Restart Freqtrade (auto-runs migrations)
3. Bot recovery works out-of-box (Freqtrade loads open positions from DB on startup)
4. Archive old trades via Freqtrade's built-in retention commands

**Effort**: Low (1-2 hours)

### Option 2: Build Analytics/Auditing Layer on Top

**Approach**: Keep Freqtrade's SQLite, build separate PostgreSQL analytics DB that syncs periodically.

**Pros**:

- Separates operational DB (Freqtrade) from analytics DB
- Can add custom metrics, aggregations, reports
- Doesn't affect Freqtrade performance

**Cons**:

- More complex - need sync mechanism
- Data duplication
- Eventual consistency (not real-time)

**Implementation**:

1. Create PostgreSQL schema for analytics (trades, positions, pnl_history)
2. Build sync service (cron job or n8n workflow) that:
   - Polls Freqtrade REST API
   - Writes to PostgreSQL analytics tables
3. Use Prisma ORM for type-safe schema management
4. Dashboard can query either source depending on use case

**Effort**: Medium (3-5 days)

### Option 3: Extend Freqtrade Database with Custom Tables

**Approach**: Use PostgreSQL for Freqtrade, add custom tables for additional auditing/analytics.

**Pros**:

- Single database
- Can add custom business logic (tags, notes, manual adjustments)
- Full control over additional data

**Cons**:

- Need to coordinate with Freqtrade's schema migrations
- Risk of conflicts with Freqtrade updates

**Implementation**:

1. Configure Freqtrade to use PostgreSQL (like Option 1)
2. Use Prisma to manage custom tables (e.g., `trade_tags`, `manual_adjustments`, `audit_log`)
3. Freqtrade tables managed by SQLAlchemy, custom tables managed by Prisma
4. Build API layer for custom data

**Effort**: Medium-High (5-7 days)

## Open Questions

1. **Data Retention Policy**: How long to keep trade history? When to archive? (Not specified in ticket - needs stakeholder input)

2. **P&L Calculation Method**: Freqtrade calculates P&L. Is custom calculation needed? If yes, which accounting method (FIFO/LIFO/average)? (Ticket ambiguous - likely use Freqtrade's calculation)

3. **Recovery Scope**: What exactly needs recovery on restart? (Freqtrade already recovers open positions - additional recovery logic needed?)

4. **Performance Requirements**: Expected trade volume? Query latency requirements? (Not specified - affects indexing strategy)

5. **TimescaleDB**: Is time-series optimization needed for this use case? (Current volume likely doesn't justify complexity)

## Risk Flags

### Low Risk (Option 1)

- Freqtrade's PostgreSQL support is well-tested and documented
- Dashboard types already align with Freqtrade schema
- Minimal custom code = fewer bugs

### Medium Risk (Option 2, 3)

- Sync lag could cause data inconsistency issues
- ORM choice affects long-term maintainability
- Schema evolution complexity (managing two systems)

### General Risks

- No migration rollback strategy discussed
- Backup/disaster recovery not mentioned in ticket
- Concurrent write conflicts if multiple services write to same tables
