# CLAUDE.md

> **Multi-Terminal Workflow:** This file is optimized for running 5+ Claude Code
> instances in parallel. Each instance reads these rules. Keep it scannable.

---

## LAWS (Read First, Every Time)

These are non-negotiable. If you violate these, update this file so it never happens again.

```
LAW 1: NEVER commit to main/master. Always use feature branches.
LAW 2: NEVER commit API keys, secrets, or .env files.
LAW 3: ALWAYS read existing files before creating new ones.
LAW 4: ALWAYS run tests before marking work complete.
LAW 5: ALWAYS update progress files in ai/docs/shared/progress/
LAW 6: If you change DB schema, update types.ts immediately.
LAW 7: Use conventional commits: <type>(<scope>): <summary>
LAW 8: Max 72 chars for commit headers, all lowercase.
```

---

## Tech Stack (Memorize This)

| Service       | Tech                      | Port | Directory              |
| ------------- | ------------------------- | ---- | ---------------------- |
| Dashboard     | Vite + React + TypeScript | 3000 | `dashboard/`           |
| Orchestration | n8n (workflow automation) | 5678 | `ai/workflows/n8n/`    |
| Trading Bot   | Freqtrade (Python)        | 8080 | `freqtrade/`           |
| Database      | PostgreSQL 16             | 5434 | Docker                 |
| AI Research   | Perplexity API            | -    | `ai/tools/perplexity/` |
| AI Analysis   | Gemini API                | -    | `ai/tools/gemini/`     |

---

## Terminal Assignment Guide

When running multiple instances, assign each to a domain:

| Terminal | Focus Area         | Primary Directory   | Key Commands               |
| -------- | ------------------ | ------------------- | -------------------------- |
| **T1**   | Dashboard/Frontend | `dashboard/`        | `npm run dev`, `npm test`  |
| **T2**   | n8n Workflows      | `ai/workflows/n8n/` | `docker compose up n8n`    |
| **T3**   | Trading Logic      | `freqtrade/`        | `freqtrade test-pairlist`  |
| **T4**   | AI Tools/Research  | `ai/tools/`         | API integrations           |
| **T5**   | Tests/Verification | Project root        | `npm test`, `/code-review` |

**Collision Prevention:**

- Before editing a file, check if another terminal might be working on it
- Use atomic commits per feature/fix
- Update progress files so other instances know what's done

---

## Style Rules (Strict)

### React/TypeScript (dashboard/)

```typescript
// ✅ ALWAYS: Functional components, strict TypeScript, Tailwind
const TradeCard: React.FC<TradeCardProps> = ({ trade }) => {
  const isProfit = trade.pnl > 0;
  return <div className={isProfit ? 'text-green-500' : 'text-red-500'}>...</div>;
};

// ❌ NEVER: Class components, inline styles, any types
class TradeCard extends React.Component { ... }  // NO
style={{ color: 'green' }}  // NO
const data: any = ...  // NO
```

### Naming Conventions

| Type            | Convention      | Example               |
| --------------- | --------------- | --------------------- |
| Components      | PascalCase      | `StatCard.tsx`        |
| Hooks           | camelCase       | `useWebSocket.ts`     |
| Utilities       | camelCase       | `formatCurrency.ts`   |
| Types           | PascalCase      | `Trade`, `Signal`     |
| Constants       | SCREAMING_SNAKE | `API_BASE_URL`        |
| Files (general) | kebab-case      | `trading-strategy.py` |

### Atomic Design (dashboard/src/components/)

```
atoms/        → Button, Input, Icon, Badge, Spinner
molecules/    → StatCard, NavItem, FormField
organisms/    → Sidebar, Header, TradeTable, Chart
templates/    → DashboardLayout, AuthLayout
```

---

## Verification Hooks

Before completing ANY task, run these checks:

```bash
# Frontend (dashboard/)
cd dashboard && npm run lint && npm run typecheck && npm test

# Python (freqtrade/)
cd freqtrade && pytest

# Full project
/code-review  # Run before pushing
```

**Auto-Verify Prompt:** After writing code, tell Claude:

> "Before finishing, run the relevant tests and fix any errors you created."

---

## Slash Commands (Use These)

| Command           | Purpose                    | When to Use                  |
| ----------------- | -------------------------- | ---------------------------- |
| `/create-plan`    | Design before implementing | Complex features (Plan Mode) |
| `/implement-plan` | Execute approved plan      | After plan approval          |
| `/code-review`    | AI code review             | Before every push            |
| `/commit`         | Conventional commit        | After verified changes       |
| `/describe-pr`    | Generate PR description    | Before creating PR           |
| `/triage-to-prod` | Full automation            | When you want hands-off      |

### Workflow Sequence

```
1. Shift+Tab x2 → PLAN MODE (design first)
2. Critique the plan, refine it
3. Shift+Tab x1 → AUTO-ACCEPT MODE (execute)
4. Verify → /code-review
5. Commit → /commit
```

---

## Progress Tracking

**CRITICAL:** Check and update these files every session.

```
ai/docs/shared/progress/HAY-XX.md  ← Current ticket progress
ai/docs/shared/plans/              ← Implementation plans
ai/docs/research/                  ← Codebase research
```

**Session Start:**

1. Read `ai/docs/shared/progress/` for in-progress tickets
2. Continue from the **Next** section

**Session End:**

1. Update progress file with completed items
2. Add next steps for the next session/terminal

---

## Project Structure

```
one-percent-trading-bot/
├── .claude/                      # AI workflow config
│   ├── commands/                 # Slash commands
│   ├── settings.json             # Claude settings
│   └── settings.local.json       # Local permissions
├── ai/
│   ├── docs/shared/progress/     # ⭐ CHECK THIS FIRST
│   ├── docs/shared/plans/        # Implementation plans
│   ├── docs/research/            # Codebase research
│   ├── tools/linear/             # Linear CLI
│   ├── tools/gemini/             # Gemini API client
│   └── workflows/n8n/            # n8n workflows + Docker
├── dashboard/                    # React frontend
│   └── src/components/           # Atomic Design
├── freqtrade/                    # Trading bot config
├── docker-compose.yml            # Service orchestration
└── CLAUDE.md                     # ⭐ YOU ARE HERE
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 One Percent Trading Bot                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Dashboard  │  │     n8n      │  │  Freqtrade   │       │
│  │   (React)    │  │  (Signals)   │  │  (Trading)   │       │
│  │   :3000      │  │   :5678      │  │   :8080      │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                 │                 │                │
│         └─────────────────┼─────────────────┘                │
│                           ▼                                  │
│              ┌──────────────────────┐                       │
│              │     PostgreSQL       │                       │
│              │       :5434          │                       │
│              └──────────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Linear Integration

| Setting       | Value     |
| ------------- | --------- |
| Team Key      | `HAY`     |
| Ticket Format | `HAY-XXX` |
| Workspace     | `haykay`  |

```bash
# Always use the wrapper (loads .envrc automatically)
./ai/tools/linear/linear list-issues
./ai/tools/linear/linear get-issue HAY-5
```

---

## Git Rules

```bash
# Branch naming
feature/hay-XX-description
fix/hay-XX-description

# Commit format (STRICT)
<type>(<scope>): <lowercase summary>  # max 72 chars

# Types: feat, fix, docs, style, refactor, test, chore, ci, perf, build

# Examples
git commit -m "feat(dashboard): add trade history table"
git commit -m "fix(n8n): handle rate limit in sentiment workflow"
```

**NEVER:**

- `git push --force` to main
- `--no-verify` to skip hooks
- Commit multiple unrelated changes together

---

## Environment Variables

```bash
# Required (loaded via direnv)
LINEAR_API_KEY=           # Linear API
GEMINI_API_KEY=           # Gemini AI
PERPLEXITY_API_KEY=       # Perplexity research

# Services (in docker-compose)
POSTGRES_*                # Database
N8N_*                     # n8n config
```

---

## Quick Fixes (When Claude Messes Up)

| Problem                       | Fix                                       |
| ----------------------------- | ----------------------------------------- |
| Created duplicate component   | Delete it, reuse existing from atoms/     |
| Wrong import path             | Check actual file structure with `ls`     |
| Committed to main             | `git reset --soft HEAD~1`, create branch  |
| Forgot to run tests           | Run now, fix failures before continuing   |
| Types out of sync with schema | Update `types.ts` to match current schema |

**Meta-Fix:** If a mistake keeps happening, add a new LAW to this file.

---

## Coding Principles (Brief)

- **KISS:** Simple > Clever
- **DRY:** Extract repeated code
- **YAGNI:** Don't build what you don't need yet
- **Test:** Write tests for critical paths
- **Security:** Never expose secrets, validate inputs
