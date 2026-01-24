# Makefile Command Guide

> How to use each command, what needs to be running, and what to do after.

---

## Quick Reference

```bash
make help    # Show all available commands
```

---

## First-Time Setup

Run these once when setting up the project:

### `make setup`

**What it does:** Installs dashboard dependencies + creates git worktrees.

**Prerequisites:** None

**Run:**

```bash
make setup
```

**After running:**

- Verify no errors in output
- Check worktrees exist: `make worktrees`

---

### `make setup-hooks`

**What it does:** Installs git pre-commit hooks that run lint/typecheck before each commit.

**Prerequisites:** `make setup` completed

**Run:**

```bash
make setup-hooks
```

**After running:**

- Try a test commit - hooks should run automatically
- If commit fails, fix the errors shown

---

## Daily Development

### `make up`

**What it does:** Starts all Docker services (PostgreSQL, n8n, Freqtrade, Grafana, Prometheus, Loki).

**Prerequisites:** Docker running

**Run:**

```bash
make up
```

**After running:**
| Service | URL | Credentials |
|---------|-----|-------------|
| n8n | http://localhost:5678 | (set in .env or first-run setup) |
| Freqtrade | http://localhost:8080 | `freqtrade` / `freqtrade` |
| Grafana | http://localhost:3001 | `admin` / `admin` |
| Prometheus | http://localhost:9090 | None |

**Verify:**

```bash
make ps    # Should show all containers "Up"
```

---

### `make dev`

**What it does:** Starts the React dashboard dev server with hot reload.

**Prerequisites:** `make up` running (for API connections)

**Run:**

```bash
make dev
```

**After running:**
| Service | URL |
|---------|-----|
| Dashboard | http://localhost:3000 |

**Note:** Keep this terminal open. Changes to dashboard code auto-reload.

**To stop:** `Ctrl+C`

---

### `make dev-all`

**What it does:** Runs `make up` + `make dev` together.

**Prerequisites:** Docker running

**Run:**

```bash
make dev-all
```

**After running:**

- All Docker services available (see `make up` URLs above)
- Dashboard at http://localhost:3000

**To stop:** `Ctrl+C` (stops dashboard), then `make down` (stops Docker)

---

## Code Quality

### `make check`

**What it does:** Runs ALL checks: lint + typecheck + format + tests.

**Prerequisites:** `make setup` completed

**Run:**

```bash
make check
```

**After running:**

- ✓ All passed → Code is ready to commit
- ✗ Failed → Fix errors shown, re-run

**When to use:** Before creating a PR or pushing code.

---

### `make check-quick`

**What it does:** Quick checks only (lint + typecheck, no tests).

**Prerequisites:** `make setup` completed

**Run:**

```bash
make check-quick
```

**After running:**

- ✓ Passed → Basic quality OK
- ✗ Failed → Fix errors

**When to use:** Quick sanity check while developing. Also runs automatically on git commit if hooks installed.

---

### `make check-lint`

**What it does:** Runs ESLint on dashboard code.

**Prerequisites:** `make setup` completed

**Run:**

```bash
make check-lint
```

**After running:**

- Shows any linting errors/warnings
- Fix issues in the files mentioned

---

### `make check-types`

**What it does:** Runs TypeScript type checking.

**Prerequisites:** `make setup` completed

**Run:**

```bash
make check-types
```

**After running:**

- Shows any type errors
- Fix type issues in files mentioned

---

### `make format` / `make format-fix`

**What it does:**

- `format` - Checks if markdown files are formatted correctly
- `format-fix` - Auto-fixes formatting issues

**Prerequisites:** None

**Run:**

```bash
make format      # Check only
make format-fix  # Auto-fix
```

---

## Testing

### `make test`

**What it does:** Runs all dashboard tests.

**Prerequisites:** `make setup` completed

**Run:**

```bash
make test
```

**After running:**

- Shows test results (passed/failed)
- Fix any failing tests

---

### `make test-watch`

**What it does:** Runs tests in watch mode - re-runs when files change.

**Prerequisites:** `make setup` completed

**Run:**

```bash
make test-watch
```

**After running:**

- Keep terminal open
- Tests auto-run when you save files
- Press `q` to quit

**When to use:** While writing tests or TDD.

---

### `make test-freqtrade`

**What it does:** Runs Freqtrade strategy tests via Docker.

**Prerequisites:** `make up` running

**Run:**

```bash
make test-freqtrade
```

**After running:**

- Shows pytest results for trading strategies

---

## Building

### `make build`

**What it does:** Builds production-ready dashboard.

**Prerequisites:** `make setup` completed, all checks passing

**Run:**

```bash
make build
```

**After running:**

- Built files in `dashboard/dist/`
- Ready for deployment

---

## Monitoring & Logs

### `make ps`

**What it does:** Shows status of all Docker containers.

**Prerequisites:** `make up` running

**Run:**

```bash
make ps
```

**After running:**

- All should show "Up" status
- If any "Exited", check logs: `make logs`

---

### `make logs`

**What it does:** Tails logs from ALL Docker services.

**Prerequisites:** `make up` running

**Run:**

```bash
make logs
```

**After running:**

- Live log output from all services
- `Ctrl+C` to stop

---

### `make logs-n8n`

**What it does:** Tails n8n workflow logs only.

**Prerequisites:** `make up` running

**Run:**

```bash
make logs-n8n
```

**When to use:** Debugging n8n workflows.

---

### `make logs-freqtrade`

**What it does:** Tails Freqtrade trading bot logs only.

**Prerequisites:** `make up` running

**Run:**

```bash
make logs-freqtrade
```

**When to use:** Watching trades, debugging strategies.

---

### `make logs-grafana`

**What it does:** Tails Grafana logs only.

**Prerequisites:** `make up` running

**Run:**

```bash
make logs-grafana
```

---

## Freqtrade Commands

### `make trades`

**What it does:** Shows currently open trades.

**Prerequisites:** `make up` running, Freqtrade healthy

**Run:**

```bash
make trades
```

**Output example:**

```
Open Trades: 2
------------------------------------------------------------
BTC/USDT     | Entry: $42,150.00 | P/L: 1.25%
ETH/USDT     | Entry: $2,280.00  | P/L: -0.50%
```

---

### `make balance`

**What it does:** Shows wallet balance in Freqtrade.

**Prerequisites:** `make up` running, Freqtrade healthy

**Run:**

```bash
make balance
```

---

### `make profit`

**What it does:** Shows profit summary.

**Prerequisites:** `make up` running, Freqtrade healthy

**Run:**

```bash
make profit
```

---

## Security

### `make security`

**What it does:** Audits npm packages for known vulnerabilities.

**Prerequisites:** `make setup` completed

**Run:**

```bash
make security
```

**After running:**

- Shows any CVEs found in dependencies
- If critical issues, run `make security-fix`

**When to use:** Weekly, or before deployments.

---

### `make security-fix`

**What it does:** Auto-fixes security vulnerabilities where possible.

**Prerequisites:** `make setup` completed

**Run:**

```bash
make security-fix
```

**After running:**

- Re-run `make security` to verify fixes
- Some issues may need manual package updates

---

## Cleanup

### `make clean`

**What it does:** Removes build artifacts and caches.

**Prerequisites:** None

**Run:**

```bash
make clean
```

**When to use:** Build issues, freeing disk space.

---

### `make clean-all`

**What it does:** Removes node_modules too (full clean).

**Prerequisites:** None

**Run:**

```bash
make clean-all
```

**After running:**

- Run `make setup` to reinstall dependencies

---

### `make clean-docker`

**What it does:** Stops Docker services AND removes volumes (data).

**Prerequisites:** None

**Run:**

```bash
make clean-docker
```

**⚠️ WARNING:** Deletes all Docker data (database, n8n workflows, etc.)

**When to use:** Fresh start, or persistent issues.

---

### `make down`

**What it does:** Stops all Docker services (keeps data).

**Prerequisites:** None

**Run:**

```bash
make down
```

**After running:**

- All services stopped
- Data preserved in `.docker/` directory

---

### `make restart`

**What it does:** Restarts all Docker services.

**Prerequisites:** None

**Run:**

```bash
make restart
```

**When to use:** After config changes, or if services are misbehaving.

---

## Worktrees

### `make worktrees`

**What it does:** Lists all git worktrees.

**Prerequisites:** None

**Run:**

```bash
make worktrees
```

**Output example:**

```
/home/user/one-percent-trading-bot     30514cb [main]
/home/user/worktrees/dev-1             30514cb (detached HEAD)
/home/user/worktrees/dev-2             30514cb (detached HEAD)
```

---

### `make worktree-prune`

**What it does:** Removes stale worktree references.

**Prerequisites:** None

**Run:**

```bash
make worktree-prune
```

**When to use:** After manually deleting worktree directories.

---

## CI Pipeline

### `make ci`

**What it does:** Runs full CI pipeline (setup + check + build).

**Prerequisites:** None (installs everything)

**Run:**

```bash
make ci
```

**When to use:** Simulating what GitHub Actions will run.

---

## Common Workflows

### Starting a Development Session

```bash
# Terminal 1: Start services
make up
make ps          # Verify all running

# Terminal 2: Start dashboard
make dev

# Open browser:
# - Dashboard: http://localhost:3000
# - n8n: http://localhost:5678
# - Grafana: http://localhost:3001
```

### Before Committing Code

```bash
make check       # Run all quality checks
# Fix any issues
git add .
git commit -m "feat(scope): description"
```

### Before Creating a PR

```bash
make check       # Full quality check
make build       # Verify build works
make security    # Check for vulnerabilities
```

### Ending a Development Session

```bash
# Ctrl+C in dashboard terminal
make down        # Stop Docker services
```

### Fresh Start (Nuclear Option)

```bash
make clean-docker  # ⚠️ Deletes all data
make clean-all     # Remove node_modules
make setup         # Reinstall everything
make up            # Start fresh
```
