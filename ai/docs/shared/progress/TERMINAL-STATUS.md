# Terminal Status (Multi-Instance Coordination)

> **Check this file first** when starting a new Claude Code terminal.
> Update your terminal's status when you start/finish work.

---

## Active Terminals

| Terminal | Focus Area         | Current Ticket | Status       | Working On                           |
| -------- | ------------------ | -------------- | ------------ | ------------------------------------ |
| **T1**   | Dashboard/Frontend | HAY-31         | ✅ Complete  | Freqtrade API integration (PR ready) |
| **T2**   | n8n Workflows      | HAY-17         | 🟢 Active    | Monitoring & Alerting                |
| **T3**   | Trading Logic      | HAY-12         | 🟢 Active    | Basic Trading Strategy               |
| **T4**   | AI Tools/Research  | -              | ⚪ Available | -                                    |
| **T5**   | Tests/Verification | -              | ⚪ Available | -                                    |

---

## Terminal Assignments (from CLAUDE.md)

| Terminal | Focus Area         | Primary Directory   | Key Commands               |
| -------- | ------------------ | ------------------- | -------------------------- |
| **T1**   | Dashboard/Frontend | `dashboard/`        | `npm run dev`, `npm test`  |
| **T2**   | n8n Workflows      | `ai/workflows/n8n/` | `docker compose up n8n`    |
| **T3**   | Trading Logic      | `freqtrade/`        | `freqtrade test-pairlist`  |
| **T4**   | AI Tools/Research  | `ai/tools/`         | API integrations           |
| **T5**   | Tests/Verification | Project root        | `npm test`, `/code-review` |

---

## Files Currently Being Edited

> **IMPORTANT:** Check this before editing any file to avoid conflicts!

| File                               | Terminal | Action   |
| ---------------------------------- | -------- | -------- |
| `freqtrade/user_data/strategies/*` | T3       | Creating |

---

## Suggested Next Tickets by Terminal

| Terminal | Suggested Ticket | Description                           |
| -------- | ---------------- | ------------------------------------- |
| **T2**   | HAY-17           | Monitoring & Alerting (n8n workflows) |
| **T3**   | HAY-12           | Basic Trading Strategy (Freqtrade)    |
| **T4**   | HAY-23           | API Key Security & Secrets Management |
| **T5**   | -                | Run tests on T1's work when complete  |

---

## How to Use This File

### When Starting a New Terminal:

```bash
# 1. Read this file first
cat ai/docs/shared/progress/TERMINAL-STATUS.md

# 2. Check which terminal number you are (T1-T5)
# 3. Update the "Active Terminals" table with your status
# 4. Check "Files Currently Being Edited" to avoid conflicts
```

### When Finishing Work:

```bash
# 1. Update your terminal status to "⚪ Available" or "✅ Complete"
# 2. Remove your files from "Files Currently Being Edited"
# 3. Update the relevant HAY-XX.md progress file
```

---

## Recent Completions

- **HAY-31**: Freqtrade API integration (T1 - PR ready)
- **HAY-26**: Dashboard UI setup (merged PR #8)
- **HAY-27**: Atom components (completed as part of HAY-26)
- **HAY-28**: Molecule components (completed as part of HAY-26)
- **HAY-29**: Organism components - partial (Sidebar, Header, TradeTable done)
- **HAY-30**: Templates - partial (DashboardLayout done)
