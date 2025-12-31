# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## First Things First

**At the start of each session:**

1. Check `ai/docs/shared/progress/` for any in-progress tickets
2. Read the relevant progress file (e.g., `HAY-5.md`) to see what's done and what's next
3. Continue from the **Next** section, or ask the user what to work on

**Before ending a session or clearing context:**

1. Update the progress file with completed items and next steps
2. Commit changes if appropriate

## Project Overview

One Percent Trading Bot - An AI-powered trading bot project focused on
consistent, sustainable returns. This project uses AI-assisted development
workflows with Linear integration for ticket management.

## Documentation Index

```
CLAUDE.md (root) ← You are here
├── docs/ai-workflows.md ......... AI workflow documentation
└── ai/docs/ ..................... Generated documents (research, plans, etc.)
```

## Directory Structure

```
one-percent-trading-bot/
├── .claude/                      # AI workflow configuration
│   ├── commands/                 # Slash commands (/commit, /create-plan, etc.)
│   ├── agents/                   # Specialized subagents for research/analysis
│   ├── skills/                   # Complex multi-step workflows
│   ├── settings.json             # Claude Code settings
│   └── settings.local.json       # Local permissions
├── ai/
│   ├── docs/                     # Generated documents
│   │   ├── research/             # Research docs from /research-codebase
│   │   ├── shared/
│   │   │   ├── plans/            # Implementation plans from /create-plan
│   │   │   ├── tickets/          # Ticket analysis from /analyze-triage-ticket
│   │   │   ├── prs/              # PR descriptions from /describe-pr
│   │   │   └── progress/         # Session progress (check first!)
│   │   └── triage-to-prod-reports/  # Workflow reports
│   └── tools/
│       └── linear/               # Linear CLI for ticket management
├── docs/
│   └── ai-workflows.md           # AI workflow documentation
├── CLAUDE.md                     # This file - project context
├── Makefile                      # Build/dev commands (templates)
├── .envrc                        # Environment variables (direnv)
└── .gitignore
```

## Linear Integration

| Setting       | Value                           |
| ------------- | ------------------------------- |
| Team Key      | `HAY`                           |
| Ticket Format | `HAY-XXX`                       |
| Workspace     | `haykay`                        |
| API Key       | Loaded via direnv from `.envrc` |

### Linear CLI Usage

**Important:** Always use the wrapper script `./ai/tools/linear/linear` instead of
running `npx tsx` directly. The wrapper automatically loads environment variables
from `.envrc` via direnv, which doesn't happen automatically in Claude Code sessions.

```bash
# List your assigned issues
./ai/tools/linear/linear list-issues

# Get issue details
./ai/tools/linear/linear get-issue HAY-5

# Create a new issue
./ai/tools/linear/linear create-issue --team HAY --title "Title" --description "Description"

# Add a comment
./ai/tools/linear/linear add-comment "Comment text" --issue-id HAY-5
```

## AI Workflow Commands

| Command                  | Purpose                      | Output Location           |
| ------------------------ | ---------------------------- | ------------------------- |
| `/commit`                | Create conventional commits  | Git history               |
| `/create-plan`           | Design implementation plans  | `ai/docs/shared/plans/`   |
| `/implement-plan`        | Execute approved plans       | Code changes              |
| `/code-review`           | AI-powered code review       | Console output            |
| `/research-codebase`     | Document existing code       | `ai/docs/research/`       |
| `/describe-pr`           | Generate PR descriptions     | `ai/docs/shared/prs/`     |
| `/triage-to-prod`        | Full ticket-to-PR automation | Multiple locations        |
| `/analyze-triage-ticket` | Deep ticket analysis         | `ai/docs/shared/tickets/` |

## Development Workflow

### Standard Feature Development

1. **Create/Select Linear Ticket**: Use Linear or `/triage-to-prod` to find work
2. **Research**: Run `/research-codebase` to understand the codebase
3. **Plan**: Run `/create-plan` to design implementation
4. **Implement**: Run `/implement-plan` to execute the plan
5. **Review**: Run `/code-review` before pushing
6. **Commit**: Run `/commit` for conventional commits
7. **PR**: Run `/describe-pr` to generate PR description

### Automated Workflow

```bash
# Full automation from ticket to PR
/triage-to-prod HAY-5

# Or fully autonomous (no prompts)
/triage-to-prod HAY-5 --autonomous
```

## Commit Message Standards

All commits must follow conventional commit format:

```
<type>(<scope>): <Summary in sentence case>

Optional body with line length ≤ 72 characters.
```

**Format Rules:**

- Header max: 72 chars (prefer 50)
- Body wrap: 72 chars
- Type and scope: lowercase
- Summary: sentence case

**Types:** feat, fix, docs, style, refactor, test, chore, ci, perf, build

**Scopes:** TBD as project grows (e.g., api, trading, data, ui)

**Examples:**

```
✅ feat(api): Add Perplexity integration (35 chars)
✅ fix(trading): Handle rate limit errors (40 chars)
❌ feat(api): Add comprehensive Perplexity API integration with error handling (76 chars) - TOO LONG
```

## Git Branch Protection

**Never commit directly to `main` or `master`!**

All development MUST occur on feature branches.

**Branch Naming:**

- Feature: `feature/description` or `yourname/hay-XX-description`
- Bug fix: `fix/description`

**Workflow:**

```bash
git checkout -b feature/hay-5-perplexity
# ... make changes ...
git push -u origin feature/hay-5-perplexity
# Create PR via GitHub or /describe-pr
```

## Environment Variables

```bash
# Required (loaded via direnv)
LINEAR_API_KEY=           # Linear API key (personal account)

# Future - add as needed
PERPLEXITY_API_KEY=       # Perplexity AI for research (HAY-5)
# Trading API keys
# Database credentials
```

## Technical Stack

> Update this section as you choose your tech stack

| Component   | Technology                       |
| ----------- | -------------------------------- |
| Language    | TBD                              |
| Framework   | TBD                              |
| Database    | TBD                              |
| AI Research | Perplexity API (planned - HAY-5) |
| Trading API | TBD                              |

## File Naming Conventions

| Type      | Convention               | Example               |
| --------- | ------------------------ | --------------------- |
| General   | lowercase with hyphens   | `trading-strategy.py` |
| Classes   | PascalCase               | `TradingStrategy`     |
| Functions | camelCase or snake_case  | `calculateProfit`     |
| Tests     | `*_test.*` or `*.test.*` | `strategy_test.py`    |
| Markdown  | kebab-case               | `api-design.md`       |

## Coding Standards

### General Principles

- Write clean, readable code with meaningful names
- Keep functions small and focused (single responsibility)
- Handle errors explicitly - don't swallow exceptions
- Write tests for critical functionality
- Document complex logic with comments

### Security

- Never commit API keys or secrets
- Use environment variables for sensitive data
- Validate all external inputs
- Follow OWASP guidelines for web interfaces

## Dos and Don'ts

### Do

- ✅ Create Linear tickets before starting work
- ✅ Use `/create-plan` before implementing complex features
- ✅ Run `/code-review` before pushing significant changes
- ✅ Keep commits atomic and well-described
- ✅ Update documentation when adding features

### Don't

- ❌ Commit directly to main/master
- ❌ Commit API keys or secrets
- ❌ Skip code review for significant changes
- ❌ Use `--no-verify` to bypass git hooks
- ❌ Mix unrelated changes in one commit

## Quick Reference

**Need help with...**

- AI workflow commands? → `docs/ai-workflows.md`
- Linear CLI? → `ai/tools/linear/README.md`
- Research documents? → `ai/docs/research/`
- Implementation plans? → `ai/docs/shared/plans/`
- Ticket analysis? → `ai/docs/shared/tickets/`

**Common Commands:**

```bash
# Check Linear connection
./ai/tools/linear/linear list-issues

# Start work on a ticket
/triage-to-prod HAY-5

# Or manual workflow
/research-codebase
/create-plan
/implement-plan
/code-review
/commit
```
