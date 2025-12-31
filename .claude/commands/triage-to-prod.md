# Triage to Production

Fully automated ticket development workflow that takes tickets from Triage
status through research, planning, implementation, and review until ready for
production.

## Workflow Overview

This command orchestrates the complete development lifecycle:

1. **Discovery**: Find tickets in Triage status using Linear CLI
2. **Analysis**: Lightweight ticket analysis to extract requirements and create
   research prompt
3. **Transition**: Move ticket to "Research Needed" status
4. **Research**: Execute /research-codebase to gather requirements and analyze
   codebase
5. **Planning**: Execute /create-plan to create implementation plan
6. **Implementation**: Execute /implement-plan to build the feature
7. **Review Loop**: Run local pre-push checks repeatedly until all issues fixed
8. **Push & CI**: Push to GitHub and monitor CI checks
9. **PR Creation**: Create PR and update Linear ticket to "Code Review" status

## Prerequisites

- Linear CLI must be available at `ai/tools/linear/linear-cli.ts` (✅ vendored
  in this repository)
- `LINEAR_API_KEY` environment variable must be set
- The following slash commands are required (✅ all included in
  `.claude/commands/`):
  - `/research-codebase` - For codebase research without artifacts directory
  - `/create-plan` - For implementation planning without artifacts directory
  - `/implement-plan` - For feature implementation from plan
  - `/describe-pr` - For PR description generation
  - `/commit` - For creating commits

**Note**: The slash commands used by this workflow (`/research-codebase`,
`/create-plan`, `/implement-plan`) are adapted from the humanlayer project but
run as a single orchestrated workflow using the Linear CLI and standard Claude
Code tools.

## Context Management Architecture

**Critical Design Principles**:

1. Keep main orchestrator context lean by delegating heavy work to subagents
2. **Spawn subagents SEQUENTIALLY, never in parallel** - each phase depends on
   previous phase's output

### Context Budget Allocation

```
Main Orchestrator Context (~50k tokens max):
├─ Workflow state & progress tracking (5k)
├─ Linear ticket metadata (2k)
├─ Phase summaries from subagents (15k)
├─ Review loop iterations (10k)
├─ GitHub/PR metadata (5k)
└─ Working buffer (13k)

Subagent Contexts (separate, disposable):
├─ Analysis Subagent: /analyze-triage-ticket (up to 100k)
├─ Research Subagent: /research-codebase_nt (up to 300k)
├─ Planning Subagent: /create-plan (up to 400k)
└─ Implementation Subagent: /implement-plan (up to 500k)
```

### Why Subagents are Critical

**Without subagents (❌ BAD)**:

- Research phase: Reads 50+ files into main context
- Planning phase: Analyzes patterns across codebase, loads more files
- Implementation: Reads, modifies, tests dozens of files
- **Result**: Context exhausted by Phase 5, workflow fails

**With subagents (✅ GOOD)**:

- Each subagent has its own 1M token budget
- Subagent does heavy lifting (file reads, analysis, code generation)
- Subagent returns only concise summary to main orchestrator
- Main orchestrator stays lean and coordinates workflow
- **Result**: All phases complete successfully

### Subagent Communication Protocol

**Critical**: Subagents communicate via **filesystem, not memory**!

Each subagent:

1. Does heavy work in its own context (read files, analyze, generate code)
2. Saves complete results to files (e.g., `ai/docs/research/clm-123.md`)
3. Returns only a summary to main orchestrator
4. Its context is discarded (garbage collected)

The next subagent:

1. Receives only the summary from main context
2. **Reads the previous subagent's output file** to get full context
3. Now has complete information to continue work

**Example flow**:

```
Research Subagent:
  - Reads 50 codebase files (100k tokens in subagent context)
  - Writes: ai/docs/research/clm-123.md (complete findings)
  - Returns: "Research complete. See ai/docs/research/clm-123.md"
  - Context discarded ✓

Main Orchestrator:
  - Stores: "Research complete. See ai/docs/research/clm-123.md" (50 tokens)

Planning Subagent:
  - Receives summary: "Research complete. See ai/docs/research/clm-123.md"
  - First action: Read ai/docs/research/clm-123.md ← Gets FULL research!
  - Analyzes codebase patterns
  - Writes: ai/docs/shared/plans/clm-123.md (complete plan)
  - Returns: "Plan complete. See ai/docs/shared/plans/clm-123.md"
  - Context discarded ✓

Implementation Subagent:
  - Receives summary: "Plan complete. See ai/docs/shared/plans/clm-123.md"
  - First action: Read ai/docs/shared/plans/clm-123.md ← Gets FULL plan!
  - Implements feature
  - Returns: "Implementation complete on branch jeff/clm-123"
```

**Structured Summary Format**:

```json
{
  "phase": "research",
  "ticket_id": "HAY-123",
  "status": "success",
  "artifacts": {
    "document_path": "ai/docs/research/clm-123.md",
    "key_findings": ["Finding 1", "Finding 2", "Finding 3"]
  },
  "summary": "3-5 sentence summary of work completed",
  "next_steps": "Next subagent should read ai/docs/research/clm-123.md for full context",
  "warnings": ["Any issues or concerns"]
}
```

Main orchestrator only stores this summary (< 1k tokens per phase).

### When to Use vs. Not Use Subagents

**Use Subagents For** (separate context):

- ✅ Ticket analysis (Phase 2) - deep ticket parsing, can handle complex tickets
  with many comments
- ✅ Research phase (Phase 4) - reads many files
- ✅ Planning phase (Phase 5) - analyzes codebase
- ✅ Implementation (Phase 6) - heavy code generation

**Main Context For** (no subagent needed):

- ✅ Discovery (Phase 1) - just Linear CLI calls, minimal context
- ✅ Status transitions (Phase 3) - simple Linear CLI operations
- ✅ Review loop (Phase 7) - needs to iterate quickly, minimal file reads
- ✅ GitHub/PR operations (Phase 8-9) - simple CLI calls

The rule: **If a phase needs to read/write >10 files or do complex analysis, use
a subagent.**

### Sequential Execution (Critical!)

**⚠️ IMPORTANT: Subagents MUST be spawned sequentially, one at a time.**

```python
# ❌ WRONG - Spawning all subagents in parallel
response = [
    Task(subagent="general-purpose", prompt="Do research..."),
    Task(subagent="general-purpose", prompt="Do planning..."),  # ERROR: Needs research output!
    Task(subagent="general-purpose", prompt="Do implementation...")  # ERROR: Needs plan output!
]

# ✅ CORRECT - Spawning subagents sequentially
# Phase 4: Research
research_result = Task(subagent="general-purpose", prompt="Do research for HAY-123...")
# Wait for completion, receive: "Research at ai/docs/research/clm-123.md"

# Phase 5: Planning (only after research completes)
planning_result = Task(
    subagent="general-purpose",
    prompt="Read ai/docs/research/clm-123.md, then create plan for HAY-123..."
)
# Wait for completion, receive: "Plan at ai/docs/plans/clm-123.md"

# Phase 6: Implementation (only after planning completes)
impl_result = Task(
    subagent="general-purpose",
    prompt="Read ai/docs/plans/clm-123.md, then implement HAY-123..."
)
# Wait for completion, receive: "Implementation on branch jeff/clm-123"
```

**Why Sequential Execution is Required:**

| Phase          | Needs Input From   | File Path Dependency                        |
| -------------- | ------------------ | ------------------------------------------- |
| Analysis       | Linear ticket data | -                                           |
| Research       | Analysis document  | `ai/docs/tickets/clm-123-analysis.md`       |
| Planning       | Research output    | `ai/docs/research/clm-123.md` ← Must exist! |
| Implementation | Plan output        | `ai/docs/plans/clm-123.md` ← Must exist!    |

**Execution Pattern:**

1. Main orchestrator spawns Research subagent
2. **Wait for Research to complete and return**
3. Extract file path from Research summary
4. Main orchestrator spawns Planning subagent with Research file path
5. **Wait for Planning to complete and return**
6. Extract file path from Planning summary
7. Main orchestrator spawns Implementation subagent with Plan file path
8. **Wait for Implementation to complete and return**
9. Continue with review/PR phases

**Each phase MUST complete before the next begins** - this is a pipeline, not
parallel execution.

### Execution Timeline Visualization

```
Time ──────────────────────────────────────────────────────────────────▶

Phase 1: Discovery (main context)
├──────┤ Complete ✓
        │
        │ Extract ticket metadata
        ▼
Phase 2: Analysis Subagent
        ├──────────┤ Complete ✓
                   │
                   │ Returns summary + analysis path
                   ▼
Phase 3: Transition (main context)
                          ├────┤ Complete ✓
                                │
                                │ Update Linear ticket
                                ▼
Phase 4: Research Subagent
                                ├──────────────────────────┤ Complete ✓
                                                            │
                                                            │ Returns summary + file path
                                                            ▼
Phase 5: Planning Subagent (waits for Phase 4)
                                                            ├────────────────────────────┤ Complete ✓
                                                                                          │
                                                                                          │ Returns summary + file path
                                                                                          ▼
Phase 6: Implementation Subagent (waits for Phase 5)
                                                                                          ├──────────────────────────────────────┤ Complete ✓
                                                                                                                                  │
                                                                                                                                  │ Returns summary + branch
                                                                                                                                  ▼
Phase 7-9: Review, Push, PR (main context)
                                                                                                                                  ├──────────────┤ Complete ✓
```

**Key Points:**

- ⏳ Each subagent **blocks** the main orchestrator until it completes
- 📊 No parallel execution of dependent phases
- 🔗 Each phase passes data to the next via file paths
- ✅ Main orchestrator verifies completion before proceeding

### Sequential Execution Guarantees

To ensure the main orchestrator executes phases sequentially:

**DO:**

- ✅ Make ONE Task call per phase
- ✅ Wait for task completion before proceeding
- ✅ Extract file paths from returned summary
- ✅ Verify artifacts exist before next phase
- ✅ Pass file paths as inputs to subsequent phases

**DON'T:**

- ❌ Make multiple Task calls in a single response (for these phases)
- ❌ Spawn next phase before receiving previous phase's summary
- ❌ Assume file paths without receiving them from previous phase
- ❌ Skip verification steps

**Example of Correct Flow in Main Orchestrator:**

```
1. Send message with Task call for Research
2. Receive response from Research subagent
3. Parse response, extract: "ai/docs/research/clm-123.md"
4. Verify file exists using Bash or Read tool
5. Send message with Task call for Planning (include research file path)
6. Receive response from Planning subagent
7. Parse response, extract: "ai/docs/plans/clm-123.md"
8. Verify file exists
9. Send message with Task call for Implementation (include plan file path)
10. Receive response from Implementation subagent
11. Continue with review phases...
```

The main orchestrator effectively does a **synchronous await** on each subagent
before proceeding.

## Usage

```bash
# Process the highest priority ticket in Triage (with approval prompts)
/triage-to-prod

# Process a specific ticket by ID (with approval prompts)
/triage-to-prod HAY-123

# Fully autonomous mode - no approval prompts, runs to completion
/triage-to-prod --autonomous

# Fully autonomous with specific ticket
/triage-to-prod HAY-123 --autonomous

# Dry run - show what would be done without executing
/triage-to-prod --dry-run
```

### Autonomous Mode

When `--autonomous` flag is provided:

- ✅ Skips all user approval prompts
- ✅ Auto-approves ticket selection (uses first Triage ticket if none specified)
- ✅ Auto-approves plan and proceeds to implementation
- ✅ Auto-fixes all Critical/High review issues (up to max iterations)
- ✅ Auto-pushes to GitHub after local review passes
- ✅ Auto-fixes CI failures (up to max attempts)
- ✅ Creates PR automatically
- ⏹️ Only stops if unrecoverable error occurs

**Use autonomous mode when:**

- Running in CI/CD
- Processing tickets overnight
- Fully trusting the automated workflow

**Don't use autonomous mode when:**

- Tickets are complex/risky
- You want to review plan before implementation
- You want control over pushing to GitHub

## Execution Steps

### Phase 1: Discovery and Selection

1. Check if `LINEAR_API_KEY` environment variable is set
2. Check if `--autonomous` flag is provided
3. Use Linear CLI:
   `npx tsx ai/tools/linear/linear-cli.ts list-issues --status Triage --output-format json`
4. Parse JSON output to get list of Triage tickets
5. If no ticket ID provided, select highest priority ticket (first in list)
6. Use Linear CLI:
   `npx tsx ai/tools/linear/linear-cli.ts get-issue-v2 <id> --output-format json --fields identifier,title,description,assignee,comments`
7. Display ticket information
8. **If `--autonomous` mode**: Auto-proceed to Phase 2 **Else**: Ask for user
   confirmation to proceed

### Phase 2: Ticket Analysis (Subagent)

**Goal**: Deep analysis of ticket content to extract actionable requirements and
create focused research prompt. NO codebase exploration at this stage.

**Context Management**: Use Task tool to spawn subagent (separate context for
deep ticket analysis).

**⚠️ Sequential Execution**: This phase MUST complete before Phase 3 begins.

1. Spawn ticket analysis subagent using Task tool (single call, not parallel):

   ```
   Task(
     subagent_type: "general-purpose",
     prompt: "Analyze ticket <ticket-id>: <ticket-title> using /analyze-triage-ticket

             TICKET ID: <ticket-id>
             TITLE: <ticket-title>

             DESCRIPTION:
             <paste full ticket description>

             COMMENTS:
             <paste all ticket comments>

             INSTRUCTIONS:
             1. Execute /analyze-triage-ticket slash command
             2. Perform deep analysis of ticket requirements WITHOUT reading codebase
             3. Extract: requirements, success criteria, constraints, open questions
             4. Create focused research prompt for Phase 4
             5. Save analysis to: ai/docs/tickets/<ticket-id>-analysis.md
             6. Attach FULL analysis document to Linear ticket as comment
             7. Add summary comment to Linear ticket

             IMPORTANT - DO NOT read codebase files:
             - ❌ DO NOT use Read/Grep/Glob tools on codebase
             - ❌ DO NOT analyze code patterns (that's Phase 4)
             - ✅ ONLY analyze ticket text content
             - ✅ Extract what's explicitly stated
             - ✅ Flag ambiguities and create research questions

             Return a summary including:
             - Analysis document path (REQUIRED for Phase 4)
             - Core requirements count (clear vs needs clarification)
             - Top 3-5 research questions for Phase 4
             - Scope estimate (High/Medium/Low)
             - Risk level (High/Medium/Low)
             - Ready for research? (Yes/No/Partially)"
   )
   ```

2. **WAIT for subagent to complete** (do not proceed to Phase 3)
3. Subagent executes `/analyze-triage-ticket` in its own context window
4. Subagent creates comprehensive analysis document
5. Subagent attaches full analysis to Linear ticket (for stakeholder visibility)
6. Subagent returns concise summary (not full analysis content)
7. Main agent receives summary and extracts analysis file path
8. Verify analysis document created (file exists)
9. Main context stays clean (only summary stored, not full analysis)

**Why use a subagent?**

- Allows deep ticket analysis without cluttering main context
- Can use full context window for complex tickets with many comments
- Subagent context is discarded after analysis (main stays lean)
- Still faster than codebase research (< 2 minutes, no file I/O)

### Phase 3: Status Transition

1. Use Linear CLI:
   `npx tsx ai/tools/linear/linear-cli.ts update-status <id> "research needed"`
2. Verify status update was successful
3. Confirm transition completed successfully

**Note**: Phase 2 already attached the full analysis document to the Linear
ticket, so no additional comment is needed here.

### Phase 4: Research Phase (Subagent)

**Context Management**: Use Task tool to spawn subagent to keep main context
clean.

**⚠️ Sequential Execution**: This phase MUST complete before Phase 5 begins.

1. Spawn research subagent using Task tool (single call, not parallel):

   ```
   Task(
     subagent_type: "general-purpose",
     prompt: "Research the codebase for implementing ticket <ticket-id>: <ticket-title>

             CRITICAL - READ ANALYSIS FIRST:
             Before doing ANY research, read the FULL analysis document:
             ai/docs/tickets/<ticket-id>-analysis.md

             This document contains:
             - Core requirements extracted from ticket
             - Open questions that MUST be answered
             - Focused research prompt with specific questions
             - Constraints and risk flags to investigate
             - Success criteria for the research phase

             TICKET DETAILS (for reference):
             <paste ticket description and comments>

             INSTRUCTIONS:
             1. **FIRST**: Read ai/docs/tickets/<ticket-id>-analysis.md in full
             2. Review the 'Research Prompt for Phase 4' section
             3. Review the 'Ambiguities & Open Questions' section
             4. Execute the /research-codebase slash command
             5. Focus on answering ALL critical questions from the analysis
             6. Look for: relevant code patterns, similar implementations, architectural considerations
             7. Create a research document at: ai/docs/research/<ticket-id>-<description>.md
             8. Document:
                - Answers to each research question from analysis
                - Key files and implementation approaches
                - Constraints discovered during research
                - Risks validated or identified
                - Recommended implementation approach

             IMPORTANT - AUTONOMOUS OPERATION:
             If the /research-codebase command or any tool asks for user feedback or clarification:
             - Do your best given your understanding of the project and codebase
             - Try to be as efficient as possible
             - Make reasonable decisions autonomously
             - Do NOT pause for user input
             - Document any assumptions you make in the research document

             Return a summary including:
             - Research document path (REQUIRED for next phase)
             - Answers to critical questions from analysis (explicitly list each)
             - Key technical findings (3-5 bullets)
             - Files identified for modification
             - Identified blockers or risks
             - Recommended implementation approach"
   )
   ```

2. **WAIT for subagent to complete** (do not proceed to Phase 5)
3. Subagent executes `/research-codebase` in its own context window
4. Subagent analyzes codebase and creates research document
5. Subagent returns concise summary (not full research content)
6. Main agent receives summary and extracts research file path
7. Verify research artifacts created (file exists)
8. Store research file path for Phase 5
9. Main context stays clean (only summary stored, not full research)
10. **Add Linear comment with research summary**:

    ```bash
    npx tsx ai/tools/linear/linear-cli.ts add-comment "📋 Research Document Created

    **Location**: \`<research-file-path>\`

    **Key Findings**:
    - <finding-1-from-subagent-summary>
    - <finding-2-from-subagent-summary>
    - <finding-3-from-subagent-summary>

    **Files to Modify**:
    - <file-1> - <brief-description>
    - <file-2> - <brief-description>
    - <file-3> - <brief-description>

    **Implementation Approach**: <one-line-summary>

    Full research document available in repository." --issue-id <ticket-id>
    ```

11. **Now ready to proceed to Phase 5**

### Phase 5: Planning Phase (Subagent)

**Context Management**: Use Task tool to spawn subagent to keep main context
clean.

**⚠️ Sequential Execution**: Phase 4 MUST be completed before this phase begins.
Phase 5 MUST complete before Phase 6 begins.

**Prerequisites**: Research file path from Phase 4 must be available.

1. Spawn planning subagent using Task tool (single call, not parallel):

   ```
   Task(
     subagent_type: "general-purpose",
     prompt: "Create implementation plan for ticket <ticket-id>: <ticket-title>

             RESEARCH DOCUMENT: First read <research_file_path_from_phase_4_summary>
             to get full context from research phase.

             TICKET DETAILS:
             <paste ticket description>

             INSTRUCTIONS:
             1. Execute the /create-plan slash command
             2. Create detailed implementation plan
             3. Save to: ai/docs/shared/plans/<ticket-id>-<description>.md
             4. Include: phases, file changes, test strategy, success criteria

             IMPORTANT - AUTONOMOUS OPERATION:
             If the /create-plan command or any tool asks for user feedback or clarification:
             - Do your best given your understanding of the project and codebase
             - Try to be as efficient as possible
             - Make reasonable decisions autonomously
             - Do NOT pause for user input
             - Document any assumptions you make in the plan document

             Return a summary including:
             - Plan document path (REQUIRED for next phase)
             - High-level implementation phases (3-5 bullets)
             - Key technical decisions
             - Success criteria
             - Estimated complexity
             - Any concerns or risks"
   )
   ```

2. **WAIT for subagent to complete** (do not proceed to Phase 6)
3. Subagent executes `/create-plan` in its own context window
4. Subagent's first action: Read research document to get full context
5. Subagent creates implementation plan with full research context available
6. Subagent returns concise plan summary to main orchestrator
7. Main agent receives summary and extracts plan file path
8. Present plan summary to user
9. **Add Linear comment with plan summary**:

   ```bash
   npx tsx ai/tools/linear/linear-cli.ts add-comment "📝 Implementation Plan Created

   **Location**: \`<plan-file-path>\`

   **Implementation Phases**:
   1. <phase-1-from-subagent-summary>
   2. <phase-2-from-subagent-summary>
   3. <phase-3-from-subagent-summary>
   4. <phase-4-from-subagent-summary>

   **Key Technical Decisions**:
   - <decision-1>
   - <decision-2>

   **Success Criteria**:
   - <criteria-1>
   - <criteria-2>

   **Estimated Complexity**: <complexity-rating>
   **Risk Level**: <risk-level>

   Full implementation plan available in repository." --issue-id <ticket-id>
   ```

10. **If `--autonomous` mode**: Auto-approve and proceed to implementation
    **Else**: Ask user for approval to proceed with implementation
11. Store plan file path for Phase 6
12. Main context stays clean (only summary stored, not full plan)
13. **Now ready to proceed to Phase 6**

### Phase 6: Implementation Phase (Subagent)

**Context Management**: Use Task tool to spawn subagent to keep main context
clean.

**⚠️ Sequential Execution**: Phase 5 MUST be completed before this phase begins.
Phase 6 MUST complete before Phase 7 begins.

**Prerequisites**:

- Plan file path from Phase 5 must be available
- Research file path from Phase 4 available (optional reference)
- User approval from Phase 5 must be obtained

1. Spawn implementation subagent using Task tool (single call, not parallel):

   ```
   Task(
     subagent_type: "general-purpose",
     prompt: "Implement feature for ticket <ticket-id>: <ticket-title>

             IMPLEMENTATION PLAN: First read <plan_file_path_from_phase_5_summary>
             to get the detailed implementation plan.

             RESEARCH DOCUMENT: <research_file_path_from_phase_4_summary>
             (Optional reference if needed)

             INSTRUCTIONS:
             1. Create feature branch: <username>/<ticket-id>-<description>
             2. Execute the /implement-plan slash command
             3. Implement according to the plan
             4. Write tests for all new functionality
             5. Run tests to ensure they pass
             6. Create commit(s) using /commit command
             7. Follow conventional commit format

             IMPORTANT - AUTONOMOUS OPERATION:
             If the /implement-plan command or any tool asks for user feedback or clarification:
             - Do your best given your understanding of the project and codebase
             - Try to be as efficient as possible
             - Make reasonable decisions autonomously
             - Do NOT pause for user input
             - Document any assumptions you make in commit messages or code comments

             Return a summary including:
             - Branch name created (REQUIRED for next phase)
             - Files modified (list with paths)
             - Commits created (count and messages)
             - Tests added (count and brief description)
             - Any implementation notes or warnings"
   )
   ```

2. **WAIT for subagent to complete** (do not proceed to Phase 7)
3. Subagent executes `/implement-plan` in its own context window
4. Subagent's first action: Read plan document (and optionally research) to get
   full context
5. Subagent creates feature branch and performs full implementation (could be
   200k+ tokens)
6. Subagent writes tests and commits using `/commit` command
7. Subagent returns concise implementation summary to main orchestrator
8. Main agent receives summary and extracts branch name
9. Verify artifacts created (branch exists, files changed, commits present,
   tests pass)
10. Store branch name for Phase 7 (review) and Phase 8 (push)
11. Main context stays clean (only summary stored, not all implementation
    details)
12. **Now ready to proceed to Phase 7**

### Phase 7: AI-Powered Code Review Loop (Subagent)

**Context Management**: Use Task tool to spawn subagent to keep main context
clean.

**Goal**: Run comprehensive AI code review (like GitHub's claude-code-action)
locally and fix all Critical issues before pushing.

**⚠️ Sequential Execution**: Phase 6 MUST be completed before this phase begins.
Phase 7 MUST complete before Phase 8 begins.

**Prerequisites**:

- Branch name from Phase 6 must be available
- All code changes committed to the branch

1. Spawn code review loop subagent using Task tool (single call, not parallel):

   ```
   Task(
     subagent_type: "general-purpose",
     prompt: "Run AI-powered code review loop for branch <branch-name>.

             Execute: /local_review_loop <branch-name> --autonomous

             This will:
             - Run comprehensive code review (CLAUDE.md conventions, security, bugs, performance, tests)
             - Fix all Critical issues automatically
             - Commit fixes using /commit command
             - Iterate up to 5 times until ready or max iterations
             - Return structured summary

             IMPORTANT - AUTONOMOUS OPERATION:
             The /local_review_loop command runs fully autonomously:
             - No user approval prompts
             - Automatically fixes all Critical issues
             - Makes reasonable decisions without input
             - Documents assumptions in commit messages

             Return a summary including:
             - status: 'ready' | 'needs_manual' | 'failed'
             - iterations_completed: <number>
             - critical_issues_fixed: <count>
             - critical_issues_remaining: [list of unresolved issues]
             - important_issues_remaining: <count>
             - commits_created: [list of commit hashes]
             - final_recommendation: 'READY TO PUSH' | 'NEEDS MANUAL REVIEW'
             - review_reports: [list of report file paths]"
   )
   ```

2. **WAIT for subagent to complete** (do not proceed to Phase 8)

3. Subagent executes `/local_review_loop` in its own context window:
   - Full AI code review → Fix Critical issues → Commit → Re-review
   - Repeats up to 5 iterations
   - Context consumed by subagent (100k+ tokens for thorough reviews), not main
     orchestrator

4. Subagent returns concise summary to main orchestrator

5. Main agent receives summary and checks status:

   **If status = 'ready'**:
   - Display: "✅ Code review passed - all Critical issues resolved"
   - Show: iterations, issues fixed, remaining Important/Suggestions
   - **If `--autonomous` mode**: Auto-proceed to Phase 8
   - **Else**: Ask user: "Push to GitHub for final CI review? [Y/n]"

   **If status = 'needs_manual' or 'failed'**:
   - Display: "❌ Code review incomplete - manual intervention needed"
   - Show: unresolved Critical issues with file locations
   - **If `--autonomous` mode**: Log error, exit workflow with failure
   - **Else**: Display unresolved issues, ask user for manual intervention

6. Main context stays clean (only summary stored, not full review iterations)

7. **Now ready to proceed to Phase 8**

### Phase 8: Push to GitHub and Final CI Review

1. User confirms ready to push (from Phase 7 prompt)

2. Push branch to GitHub:

   ```bash
   git push -u origin <branch-name>
   ```

3. Wait for GitHub Actions CI to start (typically 5-10 seconds)

4. Monitor GitHub Actions workflow:

   ```bash
   gh run list --branch <branch-name> --limit 1
   gh run watch <run-id>
   ```

5. Parse CI results:
   - **All checks pass**: Continue to Phase 9
   - **Checks fail**:
     - Display CI failure details
     - Extract error logs: `gh run view <run-id> --log-failed`
     - **If `--autonomous` mode**: Automatically attempt fixes (up to 3 times)
     - **Else**: Ask user: "Attempt to fix CI failures? [Y/n]"
     - If attempting fixes (auto or user-approved):
       - Analyze CI logs
       - Apply fixes locally
       - Commit and push fixes
       - Wait for new CI run
       - Monitor again (repeat up to 3 times)
     - If declined or max retries:
       - Mark workflow as "needs manual intervention"
       - Add comment to Linear ticket about CI failures
       - Exit workflow

6. Once all CI checks pass:
   - Display: "✅ All GitHub CI checks passed"
   - Show CI run URL for reference
   - Continue to Phase 9

### Phase 9: Create Pull Request and Finalize

1. Execute `/describe-pr` to generate PR description based on commits and Linear
   ticket

2. Create PR using GitHub CLI:

   ```bash
   gh pr create --title "<title>" --body "<description>" --base main
   ```

3. Extract PR URL from GitHub response

4. Update Linear ticket:
   - Add PR link:
     `npx tsx ai/tools/linear/linear-cli.ts add-link <id> <pr-url> --title "Pull Request"`
   - Update status to "Code Review":
     `npx tsx ai/tools/linear/linear-cli.ts update-status <id> "code review"`
   - Add completion comment:

     ```bash
     npx tsx ai/tools/linear/linear-cli.ts add-comment \
       "✅ Implementation Complete

       **Pull Request**: <pr-url>
       **Branch**: <branch-name>
       **Commits**: <count>
       **CI Status**: ✅ All checks passed

       Ready for code review!" \
       --issue-id <id>
     ```

5. Display final success summary:

   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ✨ Workflow Complete!
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   📋 Ticket: HAY-123 "Feature Title"
   🌿 Branch: jeff/clm-123-feature-name
   📝 Commits: 4
   🔗 PR: https://github.com/haykay/one-percent-trading-bot/pull/234
   ✅ CI: All checks passed
   ⏱️  Duration: 2h 15m

   🎯 Linear: https://linear.app/haykay/issue/HAY-123

   Next steps:
   - PR is ready for code review
   - Ticket moved to "Code Review" status
   - All CI checks passed
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ```

## Error Handling

- **No Triage Tickets**: Notify user and exit gracefully
- **Analysis Failure**: Skip analysis, proceed with warning
- **Status Transition Failure**: Log warning, continue workflow
- **Research/Plan Failure**: Stop workflow, report error to user
- **Implementation Failure**: Stop workflow, preserve partial work
- **Review Loop Timeout**: After 5 iterations, ask user for manual fix
- **Any Critical Failure**: Save state to `ai/docs/triage-to-prod-state.json`
  for resume

## State Management

Create `ai/docs/triage-to-prod-state.json` to track progress:

```json
{
  "ticket_id": "HAY-123",
  "current_phase": "review_loop",
  "started_at": "2025-11-05T10:30:00Z",
  "phases_completed": [
    "discovery",
    "analysis",
    "transition",
    "research",
    "plan",
    "implementation"
  ],
  "branch_name": "jeff/clm-123-feature-name",
  "commits": ["abc123", "def456"],
  "review_iterations": 2,
  "errors": []
}
```

## Linear CLI Reference

The command uses the Linear CLI tool from humanlayer. Key commands:

```bash
# List triage tickets
npx tsx ai/tools/linear/linear-cli.ts list-issues \
  --status Triage \
  --output-format json \
  --max-issues 50

# Get ticket details
npx tsx ai/tools/linear/linear-cli.ts get-issue-v2 HAY-123 \
  --output-format json \
  --fields identifier,title,description,assignee,comments

# Update ticket status
npx tsx ai/tools/linear/linear-cli.ts update-status HAY-123 "research needed"

# Add comment
npx tsx ai/tools/linear/linear-cli.ts add-comment "My comment" --issue-id HAY-123

# Add link/attachment
npx tsx ai/tools/linear/linear-cli.ts add-link HAY-123 https://github.com/org/repo/pull/123 --title "Pull Request"

# Assign to current user
npx tsx ai/tools/linear/linear-cli.ts assign-to-me HAY-123
```

### Linear CLI Setup

The Linear CLI requires `LINEAR_API_KEY` environment variable:

```bash
export LINEAR_API_KEY="lin_api_xxxxxxxxxxxxx"
```

**Note**: See "Security Best Practices" section at the end for secure API key
management.

## Configuration

### Command-Line Flags

- `--autonomous`: Run in fully autonomous mode (no approval prompts, auto-fixes
  everything)
- `--dry-run`: Show what would be done without executing
- `<ticket-id>`: Optional specific ticket ID (e.g., `HAY-123`)

### Environment Variables

- `LINEAR_API_KEY`: Required for Linear CLI authentication
- `MAX_REVIEW_ITERATIONS`: Maximum review loop attempts (default: 5)
- `MAX_CI_FIX_ATTEMPTS`: Maximum CI failure fix attempts (default: 3)

### Behavior in Autonomous vs Interactive Mode

| Feature             | Interactive Mode    | Autonomous Mode (`--autonomous`) |
| ------------------- | ------------------- | -------------------------------- |
| Ticket selection    | Ask user to confirm | Auto-select first Triage ticket  |
| Plan approval       | Ask user to approve | Auto-approve and proceed         |
| Review failures     | Ask to auto-fix     | Always auto-fix                  |
| Manual intervention | Pause and wait      | Exit with error                  |
| Push to GitHub      | Ask user            | Auto-push                        |
| CI failures         | Ask to fix          | Auto-fix (up to max attempts)    |
| PR creation         | After user approval | Automatic                        |

**When to use `--autonomous`:**

- ✅ Running unattended (CI/CD, cron job)
- ✅ Processing simple/low-risk tickets
- ✅ Overnight batch processing
- ✅ High confidence in automated workflow

**When to use interactive mode (default):**

- ✅ Complex or high-risk tickets
- ✅ Want to review plan before implementation
- ✅ Want control over GitHub push timing
- ✅ First time using the workflow

### About `--dangerously-skip-permissions`

**Important**: The Claude CLI flag `--dangerously-skip-permissions` and the
workflow's `--autonomous` flag are **different**:

| Flag                             | What It Does                                                     | What It Doesn't Do                           |
| -------------------------------- | ---------------------------------------------------------------- | -------------------------------------------- |
| `--dangerously-skip-permissions` | Skips tool permission prompts (Bash, Write, Edit, etc.)          | Does NOT skip workflow logic approval points |
| `--autonomous`                   | Skips workflow approval prompts (plan review, push confirmation) | Does NOT skip tool permissions               |

**To run fully unattended:**

```bash
# Run Claude CLI with both flags
claude code --dangerously-skip-permissions

# Then in the session:
/triage-to-prod --autonomous
```

This combination:

- ✅ Skips tool permissions (via CLI flag)
- ✅ Skips workflow approvals (via command flag)
- ✅ Runs completely unattended from start to finish

**Security consideration**: Only use `--dangerously-skip-permissions` if you
fully trust the workflow and are running in a sandboxed environment.

## Reporting

Generate comprehensive report at
`ai/docs/triage-to-prod-reports/{ticket-id}-report.md`:

```markdown
# Triage to Production Report: HAY-123

## Ticket Details

- **ID**: HAY-123
- **Title**: Add user authentication
- **Priority**: High
- **Original Status**: Triage
- **Final Status**: In Review

## Timeline

- Started: 2025-11-05 10:30:00
- Completed: 2025-11-05 12:45:00
- Duration: 2h 15m

## Phases

- ✅ Discovery (2m)
- ✅ Analysis (< 2m - deep ticket analysis subagent)
- ✅ Transition (1m)
- ✅ Research (15m)
- ✅ Planning (10m)
- ✅ Implementation (45m)
- ✅ Review (3 iterations, 27m)

## Artifacts Created

- Research: ai/docs/research/clm-123-authentication.md
- Plan: ai/docs/shared/plans/clm-123-auth-implementation.md
- Branch: jeff/clm-123-user-authentication
- Commits: 4 commits
- PR: #234

## Issues Encountered

- Review iteration 1: golangci-lint failures (auto-fixed)
- Review iteration 2: test failures (auto-fixed)

## Statistics

- Files Changed: 12
- Lines Added: 456
- Lines Removed: 23
- Tests Added: 8
```

## Best Practices

1. **Always review the analysis** before proceeding to implementation
2. **Monitor each phase** for errors or unexpected behavior
3. **Keep tickets focused** - split large features into smaller tickets
4. **Validate review failures** before auto-fixing
5. **Maintain state file** for resumability
6. **Document decisions** in ticket comments
7. **Test thoroughly** in review loop

## Safety Measures

- ❌ Never force-push or rewrite history
- ✅ Always create feature branches
- ✅ Preserve all intermediate artifacts
- ✅ Save state before each phase transition
- ✅ Ask for confirmation on destructive operations
- ✅ Limit automatic retry attempts
- ✅ Provide clear error messages with recovery steps

## Integration with Existing Commands

This command orchestrates the following slash commands in a single workflow:

- `/research-codebase`: Codebase research without thoughts directory (Phase 4)
- `/create-plan`: Implementation planning without thoughts directory (Phase 5)
- `/implement-plan`: Feature implementation from plan (Phase 6)
- `/commit`: Commit with proper conventional commit formatting (used by
  implementation)
- `/describe-pr`: PR description generation (Phase 9)

All commands are executed within a single Claude Code session using the Linear
CLI and standard tooling.

## Example Output

```
🎫 Triage to Production Workflow
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Phase 1: Discovery
  → Found 3 tickets in Triage
  → Selected: HAY-123 "Add user authentication"
  → Priority: High | Estimate: 5 points
  ✓ User confirmed

🔍 Phase 2: Ticket Analysis (Subagent)
  → Executing /analyze-triage-ticket...
  → Extracted 3 core requirements (3 clear, 0 need clarification)
  → Identified 2 success criteria
  → Created 4 critical research questions for Phase 4
  → Scope estimate: Medium | Risk level: Low
  → Analysis saved: ai/docs/tickets/clm-123-analysis.md
  → Full analysis attached to Linear ticket
  ✓ Analysis complete (< 2 min)

🔄 Phase 3: Transition
  → Moving HAY-123 to "Research Needed"
  ✓ Status updated

🔬 Phase 4: Research
  → Executing /research-codebase...
  → Research document: ai/docs/research/clm-123-authentication.md
  ✓ Research complete

📝 Phase 5: Planning
  → Executing /create-plan...
  → Implementation plan: ai/docs/shared/plans/clm-123-auth-implementation.md
  → Review plan? [Y/n]

⚙️ Phase 6: Implementation
  → Executing /implement-plan...
  → Branch: jeff/clm-123-user-authentication
  → Files changed: 12 | Tests added: 8
  ✓ Implementation complete

✅ Phase 7: Review Loop
  → Iteration 1: Running /local_review...
    ❌ golangci-lint: 3 issues
    → Auto-fixing...
    ✓ Fixed and committed
  → Iteration 2: Running /local_review...
    ✓ All checks passed

🎉 Phase 8: Finalization
  → Creating PR description...
  → PR #234 created
  → Updated ticket status to "In Review"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ Workflow Complete!
   Ticket: HAY-123
   Branch: jeff/clm-123-user-authentication
   PR: https://github.com/haykay/one-percent-trading-bot/pull/234
   Duration: 2h 15m
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Notes

- This workflow is designed for tickets that can be fully automated
- Complex features may require manual intervention between phases
- Always review generated code before pushing to remote
- The workflow preserves all artifacts for auditability
- State file enables resuming after interruptions
- Max review iterations prevents infinite loops
- User approval points ensure control over automation

## Future Enhancements

- Parallel processing of multiple tickets
- ML-based complexity estimation
- Automatic ticket dependency resolution
- Integration with monitoring for production deployment
- Rollback capability for failed implementations
- Metrics dashboard for workflow performance

---

## Security Best Practices for LINEAR_API_KEY

### How to Get Your Linear API Key

1. Go to Linear → Settings → API → Personal API keys
2. Click "Create key"
3. Give it a descriptive name (e.g., "Automation - Triage to Prod")
4. Copy the key (starts with `lin_api_`)

### Secure Storage Options

#### Option 1: direnv (Recommended for Local Development)

Store API key in project-specific `.envrc` file:

```bash
# .envrc
export LINEAR_API_KEY="lin_api_xxxxxxxxxxxxx"
```

Then:

```bash
# Allow direnv for this directory
direnv allow .

# Add to .gitignore (CRITICAL!)
echo ".envrc" >> .gitignore
```

**Pros**: Automatic loading when entering directory, project-specific **Cons**:
Easy to accidentally commit if not in .gitignore

#### Option 2: Shell Profile (Simple but Global)

Add to your shell profile (`~/.zshrc` or `~/.bashrc`):

```bash
export LINEAR_API_KEY="lin_api_xxxxxxxxxxxxx"
```

**Pros**: Simple, always available **Cons**: Global to all projects, stored in
plain text

#### Option 3: 1Password CLI (Most Secure)

Store in 1Password and load dynamically:

```bash
# Store in 1Password first (use 1Password app)

# Then in .envrc or shell profile:
export LINEAR_API_KEY="$(op read op://Private/Linear/api_key)"
```

**Pros**: Encrypted storage, audit trail, can rotate easily **Cons**: Requires
1Password CLI setup

#### Option 4: macOS Keychain (macOS Only)

```bash
# Store key (one time)
security add-generic-password \
  -s "linear-api-key" \
  -a "$USER" \
  -w "lin_api_xxxxxxxxxxxxx"

# Load in shell profile:
export LINEAR_API_KEY=$(security find-generic-password \
  -s "linear-api-key" \
  -a "$USER" \
  -w)
```

**Pros**: Encrypted by OS, secure **Cons**: macOS only, slightly slower to
access

### What NOT to Do

❌ **Never commit API keys to git** ❌ **Never share API keys in
Slack/Discord/email** ❌ **Never use the same key across multiple projects**
(create separate keys) ❌ **Never use personal keys for team automation** (use
bot accounts if available)

### Key Rotation Best Practices

1. **Create keys with descriptive names** so you know what they're for
2. **Rotate keys every 90 days** (set a calendar reminder)
3. **Immediately revoke keys if:**
   - You accidentally commit one to git
   - You paste it in a public channel
   - A team member with access leaves
   - You suspect compromise

### Checking if Key is Exposed

If you accidentally commit a key:

```bash
# Immediately revoke in Linear Settings → API

# Check git history
git log --all --full-history --source --all -- '*' | grep -i "lin_api"

# If found, you must rewrite history (dangerous!)
# Better: Rotate the key and move forward
```

### CI/CD Best Practices

For GitHub Actions (if you extend this to CI):

```yaml
# .github/workflows/triage-automation.yml
env:
  LINEAR_API_KEY: ${{ secrets.LINEAR_API_KEY }}
```

Store the key in GitHub Secrets (Settings → Secrets → Actions).

### Quick Security Checklist

- [ ] API key stored securely (not in plain text files in repo)
- [ ] `.envrc` or equivalent is in `.gitignore`
- [ ] Key has a descriptive name in Linear
- [ ] Calendar reminder set for key rotation (90 days)
- [ ] Know how to revoke key if compromised
- [ ] Never shared key via insecure channels

### Recommended: Use 1Password CLI

For maximum security and convenience:

```bash
# Install 1Password CLI
brew install --cask 1password-cli

# Sign in
op signin

# Use in .envrc
export LINEAR_API_KEY="$(op read op://Private/Linear/api_key)"
```

This way:

- Key is encrypted at rest
- You get audit logs of access
- Easy to rotate without changing code
- Can share access with team securely
