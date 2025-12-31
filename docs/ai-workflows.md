# AI Workflow Documentation

This document describes all the AI workflow files from the humor-WORKTREE-1 project that can be adapted for this repository. These files configure Claude Code to provide specialized AI assistance.

## Directory Structure

```
.claude/
├── commands/           # Slash commands (/command-name)
│   ├── analyze-triage-ticket.md
│   ├── code-review.md
│   ├── commit.md
│   ├── create-plan.md
│   ├── describe-pr.md
│   ├── implement-plan.md
│   ├── research-codebase.md
│   └── triage-to-prod.md
├── agents/             # Specialized subagents for Task tool
│   ├── codebase-analyzer.md
│   ├── codebase-locator.md
│   ├── codebase-pattern-finder.md
│   ├── thoughts-analyzer.md
│   ├── thoughts-locator.md
│   └── web-search-researcher.md
└── skills/             # Complex multi-step workflows
    └── ci-compliance/
        └── SKILL.md
```

---

## Commands (Slash Commands)

Slash commands are invoked with `/command-name` in Claude Code.

### /commit

**Purpose**: Create conventional commits with proper formatting.

**Features**:
- Enforces Conventional Commits format: `<type>(<scope>): <Summary>`
- Validates header length (max 72 chars, prefer 50)
- Validates body line length (max 72 chars)
- Checks current branch (blocks commits to main/master)
- Offers to stage unstaged files

**Usage**:
```bash
/commit              # Prompts to stage unstaged files
/commit staged-only  # Only commit staged files
/commit so           # Short form
```

**When to improve**: If your project has different commit conventions, scopes, or needs additional validation rules.

---

### /create-plan

**Purpose**: Create detailed implementation plans through interactive research.

**Features**:
- Interactive, iterative planning process
- Spawns research subagents to gather codebase context
- Creates structured plan documents with phases, success criteria
- Separates automated vs manual verification steps
- Plans saved to `ai/docs/shared/plans/YYYY-MM-DD-description.md`

**Workflow**:
1. Read ticket/requirements
2. Spawn parallel research tasks (codebase-locator, codebase-analyzer)
3. Ask clarifying questions
4. Present design options
5. Write detailed plan with phases

**When to improve**: Add project-specific patterns, adjust plan template structure, or modify file paths.

---

### /implement-plan

**Purpose**: Execute approved implementation plans phase-by-phase.

**Features**:
- Reads plan files from `ai/docs/shared/plans/`
- Implements each phase with verification
- Updates checkboxes in plan as sections complete
- Pauses for manual verification between phases
- Handles mismatches between plan and reality

**Workflow**:
1. Read plan completely
2. Check for existing checkmarks (resume support)
3. Implement phase-by-phase
4. Run success criteria checks
5. Pause for human verification

**When to improve**: Adjust verification commands, modify pause behavior, or add project-specific implementation patterns.

---

### /code-review

**Purpose**: AI-powered code review and auto-fix loop.

**Features**:
- Reviews uncommitted, staged, recent commits, or branch changes
- Categorizes issues: CRITICAL, HIGH, MEDIUM, LOW
- Auto-fixes CRITICAL and HIGH issues
- Runs tests after fixes
- Iterates up to max_loops (default 3)
- Supports auto mode for unattended operation

**Usage**:
```bash
/code-review              # Review uncommitted, max 3 loops
/code-review 2 branch     # Review branch changes, max 2 loops
/code-review auto         # Auto-fix without prompts
/code-review 2 staged auto  # Combine options
```

**Issue Categories Checked**:
- Code quality and best practices
- Potential bugs
- Performance considerations
- Security concerns (SQL injection, XSS, etc.)
- Test coverage
- Race conditions (for Go)

**When to improve**: Add project-specific security checks, adjust priority thresholds, or modify auto-fix behavior.

---

### /research-codebase

**Purpose**: Document codebase as-is without evaluation.

**Features**:
- Spawns parallel subagents for comprehensive research
- Creates research documents with metadata
- Includes GitHub permalinks when possible
- Supports follow-up questions
- Research saved to `ai/docs/shared/research/YYYY-MM-DD-description.md`

**Key Principle**: Documents ONLY what exists - no improvements, critiques, or recommendations unless explicitly asked.

**Subagents Used**:
- `codebase-locator`: Find WHERE files are
- `codebase-analyzer`: Understand HOW code works
- `codebase-pattern-finder`: Find existing patterns
- `web-search-researcher`: External documentation (if requested)

**When to improve**: Adjust document structure, add project-specific research patterns, or modify output format.

---

### /describe-pr

**Purpose**: Generate comprehensive PR descriptions.

**Features**:
- Reads PR template from `ai/docs/shared/pr_description.md`
- Analyzes full PR diff and commit history
- Runs verification commands and marks checkboxes
- Validates with commitlint
- Updates PR directly via GitHub CLI

**Workflow**:
1. Find/select PR to describe
2. Gather PR diff, commits, metadata
3. Analyze changes thoroughly
4. Run verification commands
5. Generate and validate description
6. Save and update PR

**When to improve**: Create your own PR template, adjust verification steps, or modify validation rules.

---

### /triage-to-prod

**Purpose**: Fully automated ticket-to-production workflow.

**Features**:
- Complete development lifecycle automation
- Uses Linear CLI for ticket management
- Supports `--autonomous` mode for unattended operation
- Context-efficient via subagent architecture
- State management for resumability

**Phases**:
1. **Discovery**: Find tickets in Triage status
2. **Analysis**: Deep ticket analysis (subagent)
3. **Transition**: Move to "Research Needed" status
4. **Research**: Execute /research-codebase (subagent)
5. **Planning**: Execute /create-plan (subagent)
6. **Implementation**: Execute /implement-plan (subagent)
7. **Review**: AI code review loop (subagent)
8. **Push & CI**: Push to GitHub, monitor CI
9. **PR Creation**: Create PR, update ticket

**Usage**:
```bash
/triage-to-prod              # Interactive mode
/triage-to-prod CLM-123      # Specific ticket
/triage-to-prod --autonomous # Fully automated
```

**When to improve**: Adapt for your ticket system (Jira, GitHub Issues), modify phases, or adjust automation behavior.

---

### /analyze-triage-ticket

**Purpose**: Deep analysis of tickets to extract actionable requirements.

**Features**:
- Extracts core requirements, acceptance criteria, constraints
- Filters noise from ticket discussions
- Creates focused research prompts for next phase
- Attaches full analysis to Linear ticket
- Used as subagent from /triage-to-prod

**Output Structure**:
- Document Context (purpose, priority, stakeholder)
- Core Requirements (with clarity assessment)
- Acceptance Criteria
- Explicit Constraints
- Technical Specifications
- Edge Cases
- Dependencies
- Risk Flags
- Ambiguities & Open Questions
- Research Prompt for Phase 4

**When to improve**: Adjust analysis template, add domain-specific extraction rules, or modify quality filters.

---

## Agents (Subagents)

Agents are specialized subagents invoked via the Task tool with `subagent_type: "agent-name"`.

### codebase-locator

**Purpose**: Find WHERE code lives in the codebase.

**Tools**: Grep, Glob, LS

**Responsibilities**:
- Search for files by topic/feature
- Categorize by type (implementation, tests, config, docs)
- Return organized results with full paths

**Key Principle**: Locates files only - does NOT analyze contents.

**When to improve**: Add project-specific directory patterns or file naming conventions.

---

### codebase-analyzer

**Purpose**: Analyze HOW code works.

**Tools**: Read, Grep, Glob, LS

**Responsibilities**:
- Read and understand implementation details
- Trace data flow
- Identify architectural patterns
- Provide file:line references

**Key Principle**: Documents what exists without suggesting improvements.

**When to improve**: Add domain-specific analysis patterns or output templates.

---

### codebase-pattern-finder

**Purpose**: Find similar implementations and usage examples.

**Tools**: Grep, Glob, Read, LS

**Responsibilities**:
- Search for comparable features
- Extract reusable patterns
- Provide concrete code examples
- Include test patterns

**Output**: Code snippets with file:line references, key aspects highlighted.

**When to improve**: Add project-specific pattern categories or search strategies.

---

### thoughts-analyzer

**Purpose**: Extract high-value insights from documentation.

**Tools**: Read, Grep, Glob, LS

**Responsibilities**:
- Extract key decisions and conclusions
- Filter out noise and tangential content
- Validate relevance to current context
- Distinguish decisions from explorations

**Key Filter**: Include only if it answers a question, documents a decision, reveals a constraint, or provides concrete details.

**When to improve**: Adjust quality filters or output format for your documentation style.

---

### thoughts-locator

**Purpose**: Find documents in `ai/docs/` directory.

**Tools**: Grep, Glob, LS

**Responsibilities**:
- Search ai/docs/ structure (shared/, personal/, global/)
- Categorize by type (tickets, research, plans, PRs)
- Handle searchable/ path correction

**Key Principle**: Finds documents only - does NOT analyze contents deeply.

**When to improve**: Adjust directory structure or add project-specific document categories.

---

### web-search-researcher

**Purpose**: Research external web sources.

**Tools**: WebSearch, WebFetch, TodoWrite, Read, Grep, Glob, LS

**Responsibilities**:
- Analyze queries for search strategy
- Execute strategic searches
- Fetch and analyze content
- Synthesize findings with citations

**Search Strategies**:
- API/Library documentation
- Best practices (recent articles)
- Technical solutions (Stack Overflow, GitHub)
- Comparisons (X vs Y)

**When to improve**: Add domain-specific search strategies or preferred sources.

---

## Skills

Skills are complex, multi-step workflows that encapsulate domain knowledge.

### ci-compliance

**Purpose**: Validate code against CI/CD requirements before pushing.

**When to Run**:
- Before every `git push`
- Before creating/updating PRs
- After significant code changes

**Subsystem Detection**:

| Subsystem | Trigger Files | Checks |
|-----------|---------------|--------|
| Go | `**/*.go`, `go.mod` | golangci-lint, go test -race, build |
| Web | `web/**` | ESLint, Prettier, TypeScript, Vitest, build |
| Python | `pundora/**/*.py` | Ruff check/format, pytest, pip-audit |

**Commit Message Validation**:
- Format: `<type>(<scope>): <Summary>`
- Header max: 72 chars (prefer 50)
- Body lines max: 72 chars
- Types: feat, fix, docs, style, refactor, test, chore, ci, perf, build

**Branch Protection**:
- Blocks commits to main/master
- Requires feature branches
- Validates branch naming conventions

**When to improve**: Adapt subsystem detection, add/remove linters, modify commit conventions.

---

## Configuration Files

### CLAUDE.md

**Purpose**: Root-level project context and guidance for Claude Code.

**Contains**:
- Project overview
- Directory structure
- Working with subsystems links
- File naming conventions
- Development workflow
- Commit message standards
- CI/CD pipelines
- Dos and Don'ts

**Location**: Project root (`CLAUDE.md`)

**When to improve**: Add project-specific conventions, update directory structure, or modify development workflow.

---

## Customization Guide

### Adding a New Command

1. Create `.claude/commands/your-command.md`
2. Add YAML frontmatter:
   ```yaml
   ---
   description: Brief description
   model: claude-sonnet-4-5-20250929  # Optional
   ---
   ```
3. Write instructions in markdown

### Adding a New Agent

1. Create `.claude/agents/your-agent.md`
2. Add YAML frontmatter:
   ```yaml
   ---
   name: your-agent
   description: What it does
   tools: Read, Grep, Glob, LS  # Allowed tools
   ---
   ```
3. Write agent instructions

### Adding a New Skill

1. Create `.claude/skills/your-skill/SKILL.md`
2. Add YAML frontmatter:
   ```yaml
   ---
   name: your-skill
   description: What it does
   ---
   ```
3. Write skill instructions with steps

---

## Best Practices

1. **Commands**: Keep focused on user-invocable actions
2. **Agents**: Design for single responsibility
3. **Skills**: Encapsulate complex, multi-step processes
4. **CLAUDE.md**: Keep updated with project conventions
5. **Documentation**: Include "When to improve" sections
6. **Testing**: Verify workflows before committing

---

## Migration Checklist

To use these workflows in your project:

- [ ] Copy `.claude/` directory structure
- [ ] Adapt CLAUDE.md for your project
- [ ] Update file paths in commands (e.g., `ai/docs/` paths)
- [ ] Adjust commit scopes for your project
- [ ] Configure CI checks for your language/framework
- [ ] Test each command individually
- [ ] Remove unused agents/commands
