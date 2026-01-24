# Sprint Priority

> **Source of truth** for ticket priority. Check this before starting work.

**Maintenance:** When creating new tickets, add them to the table below with correct Blocker column.

---

## Exchange Decision (2026-01-24)

**Binance is restricted in the US.** We are switching to **Kraken** as primary exchange.

| Exchange   | US Legal | Freqtrade Support | Fees (Maker/Taker) | Decision    |
| ---------- | -------- | ----------------- | ------------------ | ----------- |
| Kraken     | Yes      | Official          | 0.25% / 0.40%      | **PRIMARY** |
| Binance.US | Yes      | Official          | 0.10% / 0.60%      | Backup      |
| Coinbase   | Yes      | CCXT only         | 0.40% / 0.60%      | Not tested  |
| Polymarket | Yes      | Not compatible    | N/A                | Wrong type  |

**Polymarket Note:** Polymarket is a prediction market for event outcomes (politics, sports), NOT a crypto exchange. It cannot be used with Freqtrade.

---

## Critical Path to First Trade ($50-100)

```
HAY-37 (Exchange Migration) ─┬─→ HAY-38 (Kraken API Setup)
                             │
HAY-12 (Strategy) ───────────┼─→ HAY-13 (Risk Management) ─┬─→ HAY-24 (Live Trading)
                             │                              │
                             └─→ HAY-21 (Kill Switch) ──────┘
```

---

## Current Sprint (Priority Order)

| #   | Ticket | Title                            | Status   | Blocker               | Critical Path |
| --- | ------ | -------------------------------- | -------- | --------------------- | ------------- |
| 1   | HAY-30 | Layout Templates                 | Complete | None                  | -             |
| 2   | HAY-37 | Exchange Migration (→ Kraken)    | Active   | None                  | Yes           |
| 3   | HAY-12 | Basic Trading Strategy           | Active   | None                  | Yes           |
| 4   | HAY-38 | Kraken API Setup & Validation    | Pending  | HAY-37                | Yes           |
| 5   | HAY-39 | Kraken Trading Pairs Research    | Pending  | HAY-37                | Yes           |
| 6   | HAY-13 | Risk Management: Position Sizing | Pending  | HAY-12                | Yes           |
| 7   | HAY-21 | Emergency Kill Switch            | Pending  | HAY-12                | Yes           |
| 8   | HAY-14 | Backtesting Pipeline             | Pending  | HAY-12, HAY-39        | Yes           |
| 9   | HAY-9  | Exchange Paper Trading Setup     | Pending  | HAY-12, HAY-38        | Yes           |
| 10  | HAY-24 | Live Trading Activation          | Pending  | HAY-9, HAY-13, HAY-21 | Yes           |
| 11  | HAY-22 | Error Recovery & Reconnection    | Pending  | HAY-21                | No            |
| 12  | HAY-25 | Database & Trade Persistence     | Pending  | None                  | No            |
| 13  | HAY-15 | VPS Infrastructure Setup         | Pending  | None                  | No            |
| 14  | HAY-16 | Production Deployment            | Pending  | HAY-15, HAY-24        | No            |

---

## Completed (This Sprint)

| Ticket | Title                     | Merged   |
| ------ | ------------------------- | -------- |
| HAY-31 | Freqtrade API Integration | PR ready |
| HAY-29 | Organism Components       | Complete |
| HAY-28 | Molecule Components       | Complete |
| HAY-27 | Atom Components           | Complete |
| HAY-26 | Dashboard UI Setup        | Merged   |

---

## Worktree Assignment

| Worktree      | Purpose                  | Current Ticket | Branch                                     |
| ------------- | ------------------------ | -------------- | ------------------------------------------ |
| WORKTREE-MAIN | Reconciliation & testing | -              | `main` (always)                            |
| `WORKTREE-1/` | Worker                   | -              | -                                          |
| `WORKTREE-2/` | Worker                   | HAY-37         | `feature/hay-37-exchange-migration-kraken` |
| `WORKTREE-3/` | Worker                   | -              | -                                          |
| `WORKTREE-4/` | Worker                   | -              | -                                          |

**Update this table when starting a ticket** to prevent duplicate work.

---

## Files Being Edited

> **Check before editing any file to avoid conflicts!**

| File                                     | Worktree   | Action                  |
| ---------------------------------------- | ---------- | ----------------------- |
| freqtrade/user_data/config.template.json | WORKTREE-2 | Modify (Kraken config)  |
| .env.example                             | WORKTREE-2 | Modify (Kraken vars)    |
| scripts/generate-freqtrade-config.sh     | WORKTREE-2 | Modify (Kraken support) |

**Rules:**

- Add your file here before starting edits
- Remove when done (committed)
- If file is listed, coordinate with that worktree first

---

## How to Pick Next Ticket

```
1. Check Worktree Assignment table - find your worktree (dev-1, dev-2, etc.)
2. If your worktree has a ticket, continue that work
3. If empty, pick highest priority from table with Status: Pending
4. Check Blocker column - skip if blocker not complete
5. Update BOTH tables:
   - Sprint Priority: Status → "Active"
   - Worktree Assignment: Your ticket + branch
6. Run Ralph decision matrix (.claude/ralph-decision.md)
7. Create feature branch and start work
```

### When Finishing a Ticket

```
1. Commit and push to remote
2. Create PR (or merge if approved)
3. Update Sprint Priority: Status → "Complete"
4. Clear Worktree Assignment row (set ticket + branch to "-")
5. Pull main, pick next ticket
```

---

## Status Legend

| Status   | Meaning                      |
| -------- | ---------------------------- |
| Active   | Currently being worked on    |
| Pending  | Ready to start (no blockers) |
| Blocked  | Waiting on another ticket    |
| Partial  | Started but incomplete       |
| Complete | Done, PR ready or merged     |
