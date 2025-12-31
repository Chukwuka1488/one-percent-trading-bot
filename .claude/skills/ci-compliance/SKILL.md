---
name: ci-compliance
description:
  Validate code changes against CI/CD requirements (lint, test, build, commit
  messages) for Go, Web, and Python subsystems before pushing
---

# CI Compliance Skill

## Purpose

This skill ensures all code changes meet the One Percent Trading Bot platform's CI/CD
requirements before pushing to remote. It encapsulates our comprehensive
linting, testing, and build standards to prevent CI failures.

## When to Use This Skill

**CRITICAL: Run this skill BEFORE every git push, BEFORE creating PRs, and AFTER
making significant code changes.**

This skill should be invoked:

- Before pushing code to remote (`git push`)
- Before creating or updating pull requests
- After implementing features or fixes that touch multiple subsystems
- When the user explicitly asks to "check CI", "validate changes", or "run
  pre-push checks"
- When working on code that has historically caused lint failures
- As a final validation step before considering work "done"

**DO NOT** run this skill:

- For trivial documentation-only changes (e.g., editing README without code
  changes)
- When the user explicitly bypasses it (though warn them of the risks)

## Subsystem Detection

The codebase is a monorepo with multiple subsystems. Detect which subsystems
have changed and run appropriate checks:

### Go Services

**Trigger when changed:**

- Any `**/*.go` files
- `go.mod`, `go.sum`
- `hermelos/Dockerfile`, `janomus/Dockerfile`
- `.golangci.yml`

**Checks to run:**

1. **golangci-lint** - Linter with auto-fix where possible
2. **go test -race ./...** - Tests with race detection
3. **Build validation** - Both `janomus` and `hermelos`

**golangci-lint configuration** (`.golangci.yml`):

```yaml
version: "2"
run:
  timeout: 5m
  go: "1.25.2"
formatters:
  enable:
    - goimports
  settings:
    goimports:
      local-prefixes:
        - "github.com/haykay/one-percent-trading-bot"
linters:
  enable:
    - errcheck
    - govet
    - ineffassign
    - staticcheck
    - unused
    - forcetypeassert
```

**Common Go lint failures:**

- Missing error checks (`errcheck`)
- Force type assertions without ok check (`forcetypeassert`)
- Unused variables/imports (`unused`)
- Incorrect import grouping (goimports - should have local imports last)

### Web Console

**Trigger when changed:**

- Any files in `web/**`

**Checks to run (from `web/` directory):**

1. **ESLint** - `npm run lint`
2. **Prettier format check** - `npm run format:check`
3. **TypeScript type check** - `npm run typecheck`
4. **Vitest tests** - `npm run test`
5. **Production build** - `npm run build`

**Common Web lint failures:**

- ESLint errors (unused imports, react-hooks violations)
- Formatting issues (Prettier - use `npm run format:fix` to auto-fix)
- TypeScript type errors
- Test failures
- Build failures (usually TypeScript errors)

### Python (Pundora)

**Trigger when changed:**

- Any files in `pundora/**/*.py`
- `pundora/requirements*.txt`

**Checks to run:**

1. **Ruff check --fix** - Lint with auto-fix
2. **Ruff format** - Format code
3. **pytest pundora/server** - Run tests
4. **pip-audit** (security) - `pip-audit -r pundora/requirements.txt --strict`

**Common Python lint failures:**

- Import order violations (Ruff auto-fixes most)
- Line length violations (Ruff auto-fixes)
- Unused imports (Ruff auto-fixes)
- Security vulnerabilities in dependencies (requires manual dependency updates)

### Commit Messages

**Always check commit messages for ALL commits being pushed.**

**Format requirements:**

```
<type>(<scope>): <Summary in sentence case>

Optional body with line length ≤ 72 characters. Body should provide
additional context when the summary alone isn't sufficient.
```

**Valid types:** feat, fix, docs, style, refactor, test, chore, ci, perf, build

**Valid scopes:** api, auth, matrix, pundora, web, infra, k8s, ci, deps, config

**Validation rules:**

- Header max length: 72 chars (prefer 50 chars)
- Body line max length: 72 chars
- Subject must be sentence-case (capitalize first word only)
- Type and scope must be lowercase

**Common commit message failures:**

- Header too long (>72 chars) - MOST COMMON ISSUE
- Body lines too long (>72 chars) - wrap text
- Wrong case (e.g., "Fix" instead of "fix", "API" instead of "api")
- Invalid type/scope
- Subject not sentence-case

**Examples:**

```
✅ feat(api): Add bridge activation (31 chars)
✅ fix(matrix): Handle rate limiting in sync loop (47 chars)
❌ feat(api): Add comprehensive error handling for bridge activation failures (75 chars) - TOO LONG
❌ Fix(api): Add auth (wrong case - "Fix" should be "fix")
❌ feat(API): Add endpoint (wrong case - "API" should be "api")
```

## Execution Steps

Follow this systematic approach:

### 0. Validate Current Branch (CRITICAL - Run First!)

**🚨 NEVER allow commits or work to proceed on main/master branch!**

```bash
# Check current branch
git branch --show-current
```

**If on main or master:**

- **STOP IMMEDIATELY** - Do not proceed with any checks
- **Alert the user** - Explain the branch protection policy
- **Guide recovery:**

  ```bash
  # If no commits yet - just switch branches
  git checkout -b feature/my-feature

  # If already committed to main (CRITICAL ERROR)
  git branch feature/my-feature      # Save commits
  git reset --hard origin/main       # Reset main
  git checkout feature/my-feature    # Switch to feature branch
  ```

- **Branch protection policy:**
  - ALL development must occur on feature branches
  - Commits to main cannot be pushed to remote
  - Pre-commit hook blocks commits to main/master
  - This is enforced to prevent dead-end commits

**Branch naming conventions:**

- Feature: `feature/description` or `name/description`
- Fix: `fix/description`
- Example: `ethan/fix-auth`, `feature/add-bridge`

### 1. Detect Changed Files

```bash
# Get the main branch name
MAIN_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' || echo "main")

# Get changed files since main
git diff --name-only "$MAIN_BRANCH"...HEAD
```

### 2. Validate Commit Messages

For ALL commits being pushed (not just the latest commit):

```bash
# Get commits being pushed (commits in current branch not in main)
git rev-list "$MAIN_BRANCH"..HEAD

# For each commit, validate with commitlint
git log -1 --format=%B <commit-sha> | npx commitlint
```

**IMPORTANT:** Validate the FULL commit message (title + body), not just the
title. Many failures come from body line length violations.

**🚨 CRITICAL: Check PR Body Line Length Before Pushing**

GitHub Actions validates the **PR body** separately from commits. This is a
common source of CI failures:

**The problem:**

1. Commit message validated by pre-push hook ✅
2. Push creates PR with auto-populated body from commit
3. **GitHub Actions validates PR body** - may fail even if commit passed!

**Prevention:**

- Count line lengths BEFORE creating the commit
- Use Python to verify:
  `echo "text" | python3 -c "import sys; print(max(len(line.rstrip()) for line in sys.stdin))"`
- ALL body lines must be ≤72 chars (no exceptions!)

**If you must amend after pushing:**

1. Amend the commit with wrapped lines
2. Force push: `git push --force-with-lease`
3. **Update PR body immediately:**
   `gh api repos/haykay/one-percent-trading-bot/pulls/NNN --method PATCH --field body="$(git log -1 --format=%B)"`

**Why this happens:**

- Pre-push hook validates commits
- GitHub Actions validates PR body (`.github/workflows/commitlint.yml`)
- Amending commit updates the commit but NOT the PR body
- Must manually update PR body after amending

### 3. Run Subsystem Checks

Based on changed files detected in step 1, run the appropriate checks:

#### Go Services (if Go files changed)

```bash
# Lint entire codebase
golangci-lint run

# Auto-fix where possible
golangci-lint run --fix

# Run tests with race detection
go test -race -cover ./...

# Build both services
go build -v -o hermelos/hermelos ./hermelos
go build -v -o janomus/janomus ./janomus

# Clean up build artifacts
rm -f hermelos/hermelos janomus/janomus
```

#### Web Console (if web/ files changed)

```bash
cd web

# Ensure dependencies installed
npm ci

# ESLint
npm run lint

# Prettier format check
npm run format:check

# TypeScript type check
npm run typecheck

# Tests
npm run test

# Production build
npm run build

cd ..
```

#### Python (if pundora/ files changed)

```bash
# Prefer .venv if exists, otherwise use system ruff
RUFF=".venv/bin/ruff"
if ! [ -x "$RUFF" ]; then
  RUFF="ruff"
fi

PY_BIN=".venv/bin/python"
if ! [ -x "$PY_BIN" ]; then
  PY_BIN="python"
fi

# Lint and auto-fix
$RUFF check --fix pundora/

# Format
$RUFF format pundora/

# Tests
$PY_BIN -m pytest pundora/server

# Security audit (optional but recommended)
pip-audit -r pundora/requirements.txt --strict
```

### 4. Report Results

Provide a clear summary:

**Success format:**

```
✅ CI Compliance Check PASSED

Checked subsystems:
  ✅ Go services: lint, test, build
  ✅ Commit messages: 3 commits validated

All checks passed! Safe to push.
```

**Failure format:**

```
❌ CI Compliance Check FAILED

Issues found:
  ❌ Go services (golangci-lint):
    - api/handlers/bridges.go:123: Error not checked (errcheck)
    - common/synapse/client.go:45: Force type assertion (forcetypeassert)

  ❌ Commit messages:
    - Commit abc1234: Header too long (75 chars, max 72)
      "feat(api): Add comprehensive error handling for bridge activation failures"

  ✅ Web console: All checks passed

Fix these issues before pushing. Some issues may be auto-fixable:
  - Run: golangci-lint run --fix
  - Rewrite commit message: git rebase -i main (edit the commit)
```

## Auto-Fix Capabilities

When failures are detected, attempt auto-fixes where possible:

### Go

- **goimports** - Auto-fixes import order and grouping
- **golangci-lint --fix** - Auto-fixes some linters (unused imports, formatting)
- **Manual required** - Error checks, type assertions

### Web

- **Prettier** - `npm run format:fix` (auto-fixes formatting)
- **ESLint** - Some rules auto-fixable with `npm run lint -- --fix`
- **Manual required** - Type errors, logic errors, test failures

### Python

- **Ruff check --fix** - Auto-fixes most linting issues (imports, formatting)
- **Ruff format** - Auto-formats code
- **Manual required** - Logic errors, test failures, security vulnerabilities

### Commit Messages

- **No auto-fix** - User must rewrite commits
- **Suggest solution:** `git rebase -i main` to edit commit messages

## Error Recovery

When checks fail:

1. **Identify root cause** - Read error messages carefully
2. **Attempt auto-fix** - Run auto-fix commands for the subsystem
3. **Re-run checks** - Verify fixes worked
4. **Report remaining issues** - If manual fixes needed, provide clear guidance
5. **Never bypass** - Do NOT suggest `--no-verify` unless user explicitly
   requests

## Performance Optimization

- **Run checks in parallel** when possible (Go lint + test + build can run
  concurrently)
- **Skip subsystems** that haven't changed (don't run Web checks if only Go
  changed)
- **Cache-friendly** - Use `go test -cover` (not `-coverprofile`) to avoid file
  I/O overhead
- **Smart commit validation** - Only validate commits being pushed, not entire
  branch history

## Integration with Git Hooks

This skill mirrors the `.husky/pre-push` hook but provides:

- **Better reporting** - Clearer error messages and guidance
- **Interactive fixes** - Can apply auto-fixes and re-run checks
- **Context awareness** - Understands the codebase and common failure patterns
- **Educational** - Explains WHY checks failed and HOW to fix them

## Common Failure Patterns

### Pattern 1: Golangci-lint Import Order

**Symptom:**
`File is not goimports-ed with -local github.com/haykay/one-percent-trading-bot`

**Cause:** Imports not grouped correctly (stdlib, external, local)

**Fix:** Run `golangci-lint run --fix` or manually reorder imports:

```go
import (
    // Standard library
    "context"
    "fmt"

    // External packages
    "github.com/stretchr/testify/assert"

    // Local packages
    "github.com/haykay/one-percent-trading-bot/models"
)
```

### Pattern 2: Commit Header Too Long

**Symptom:** `header-max-length: Header exceeds 72 characters`

**Cause:** Summary too verbose

**Fix:** Make summary concise, move details to body:

```
❌ feat(api): Add comprehensive error handling for bridge activation failures

✅ feat(api): Add bridge activation error handling

Add comprehensive error handling for bridge activation failures including
timeout handling, credential validation, and graceful degradation.
```

### Pattern 3: Unchecked Errors

**Symptom:** `Error return value is not checked (errcheck)`

**Cause:** Function returns error but caller ignores it

**Fix:** Check and handle the error:

```go
❌ client.SendMessage(roomID, text)

✅ if err := client.SendMessage(roomID, text); err != nil {
    return fmt.Errorf("failed to send message: %w", err)
}
```

### Pattern 4: Force Type Assertion

**Symptom:** `type assertion must be checked (forcetypeassert)`

**Cause:** Type assertion without ok check

**Fix:** Use two-value form:

```go
❌ user := value.(*User)

✅ user, ok := value.(*User)
if !ok {
    return fmt.Errorf("expected *User, got %T", value)
}
```

## Success Metrics

After running this skill, the user should:

- Have zero CI failures when pushing to GitHub
- Understand WHY their code failed checks
- Know HOW to fix failures (with auto-fix commands provided)
- Have increased confidence in code quality
- Spend less time fixing CI failures in PRs

## Skill Invocation Examples

User: "Check if my code is ready to push" → Run full CI compliance check

User: "I'm getting golangci-lint failures" → Run Go-specific checks with
detailed error reporting

User: "Fix my commit messages" → Validate commits and suggest rewrites for
failures

User: "Run pre-push checks" → Run full CI compliance check

## Final Reminders

- **ALWAYS validate branch first** - Never proceed if on main/master branch
- **Never suggest `--no-verify`** - Bypassing checks leads to CI failures
- **Auto-fix when possible** - Run auto-fix commands before reporting failures
- **Be educational** - Explain errors, don't just report them
- **Check ALL commits** - Not just the latest one
- **Mirror CI exactly** - Use same commands as GitHub Actions workflows
- **Enforce branch protection** - Block any attempt to commit to main/master
