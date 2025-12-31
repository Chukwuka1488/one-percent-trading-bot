# Code Review Slash Command

You are the orchestrator for an automated code review and fix loop. Your job is
to:

1. Spawn a reviewer subagent to analyze code changes
2. Show findings to the user and get approval
3. Spawn a fixer subagent to fix CRITICAL + HIGH priority issues
4. Run tests after each fix iteration
5. Repeat until no critical/high issues remain or max loops reached

## Parameters

Parse the command arguments with strict positional rules to avoid ambiguity:

- Format: `/code-review [max_loops] [target] [auto]`
- **All parameters are optional and positional**
- **Parsing rules:**
  1. First argument (if numeric): `max_loops` (default: 3)
  2. Second argument (or first if non-numeric): `target` (default: uncommitted)
     - Valid values: `uncommitted`, `staged`, `recent`, `branch`
  3. Third argument (or any remaining argument): `auto` flag (any value enables
     auto mode)

- `max_loops` (optional, default: 3) - Maximum review-fix iterations
  - Must be a positive integer
- `target` (optional, default: uncommitted) - What to review:
  - `uncommitted` - All unstaged + staged changes (git diff HEAD)
  - `staged` - Only staged changes (git diff --staged)
  - `recent` - Last commit (git diff HEAD~1)
  - `branch` - All changes since origin/main branch
- `auto` (optional) - If present (any value like "auto", "y", "yes"),
  automatically fix all CRITICAL and HIGH issues without asking for confirmation
  at each iteration. Test failures in auto mode will abort the loop.

**Examples:**

- `/code-review` → max_loops=3, target=uncommitted, auto=false
- `/code-review 2` → max_loops=2, target=uncommitted, auto=false
- `/code-review branch` → max_loops=3, target=branch, auto=false
- `/code-review 2 staged` → max_loops=2, target=staged, auto=false
- `/code-review auto` → max_loops=3, target=uncommitted, auto=true
- `/code-review 2 branch auto` → max_loops=2, target=branch, auto=true

## Instructions

### Step 1: Determine Scope

**If auto mode is enabled:**

1. Show warning: "Running in AUTO mode. This will automatically fix all CRITICAL
   and HIGH priority issues without asking. Continue? (yes/no)"
2. If user responds "no", EXIT immediately
3. Only proceed if user confirms with "yes"

**For all modes:**

Based on the target parameter, identify:

1. What git diff command to use
2. Run the appropriate git diff command
3. **If diff is empty (no changes found):**
   - Inform user: "No changes found to review for [target]"
   - EXIT successfully
4. Which files are changed
5. For Go files, identify corresponding test files (even if unchanged)
6. For Python files in pundora/, identify corresponding test files (even if
   unchanged)
7. For TypeScript files in web/, identify corresponding test files (even if
   unchanged)
8. Show the user what will be reviewed and ask for confirmation

### Step 2: Review Loop

Execute up to `max_loops` iterations:

#### 2a. Spawn Reviewer Subagent

Use the Task tool with `subagent_type: general-purpose` to spawn a code
reviewer.

**If the subagent fails or times out:**

1. Analyze the failure:
   - If timeout: Consider reducing scope or breaking into smaller reviews
   - If parse error: Check for malformed input or adjust structured output
     format
   - If tool failure: Verify file paths and permissions
2. Show error to user: "The reviewer subagent failed: [error message]. Analysis:
   [your analysis]"
3. Ask: "I can retry with an adjusted approach. Retry or abort? (retry/abort)"
4. If `retry`: Attempt once more with an **adjusted prompt** based on the error
   analysis
5. If `abort` or second failure: EXIT the loop with error status

The reviewer prompt should:

- Review all files in scope (changed files + their test files for Go code)
- Follow guidance from CLAUDE.md for style and conventions
- Identify which components are changed (janomus, hermelos, pundora, web,
  functions, k8s)
- Read component-specific CLAUDE.md files for changed components (e.g., if Go
  files in pkg/ are changed, read pkg/CLAUDE.md for concurrency patterns FIRST)
- Check for:
  - Code quality and best practices
  - Potential bugs or issues
  - Performance considerations
  - Security concerns:
    - Generic: SQL injection, XSS, command injection, path traversal
    - **Domain-specific (CRITICAL for this codebase):**
      - Matrix MXID validation (must have @ prefix and :domain suffix)
      - MULP (Matrix User LocalPart) validation (no @ or : allowed)
      - Firestore query parameterization (never string concatenation)
      - GCP Secret Manager usage (never log secret values)
      - Firebase token verification (proper error handling)
      - Bridge credentials storage (encrypted, never logged)
      - Rate limiting for Matrix API calls
      - Authorization checks (verify user permissions)
  - Test coverage
  - Race conditions (especially for Go code - see pkg/CLAUDE.md)
- Output findings in structured format:

  ```
  ## 🔴 CRITICAL Issues
  - [Category] Description - file.go:123

  ## 🟠 HIGH Priority Issues
  - [Category] Description - file.go:456

  ## 🟡 MEDIUM Priority Issues
  - [Category] Description - file.go:789

  ## 🟢 LOW Priority Issues
  - [Category] Description - file.go:012
  ```

- Use the repository's CLAUDE.md for guidance on style and conventions. Be
  constructive and helpful in your feedback.

#### 2b. Parse Review Results

Extract CRITICAL and HIGH priority issues from the reviewer's output.

#### 2c. Show Findings and Get Approval

Display the review findings to the user in a clear, formatted way.

**If NO CRITICAL or HIGH issues found:**

- Congratulate the user
- Show MEDIUM/LOW issues for awareness
- EXIT the loop successfully

**If CRITICAL or HIGH issues found:**

- Show count of issues by priority
- List all CRITICAL and HIGH issues
- **In auto mode**: Automatically proceed to fix step without asking
- **In manual mode**: Ask the user: "I found X critical and Y high priority
  issues. Would you like me to fix them? (yes/no/abort)"
  - `yes` - Continue to fix step
  - `no` - Skip to next review iteration
  - `abort` - Exit loop immediately

#### 2d. Spawn Fixer Subagent

If user approved fixes, use the Task tool with `subagent_type: general-purpose`
to spawn a fixer.

**If the subagent fails or times out:**

1. Analyze the failure:
   - If timeout: Consider reducing scope or fixing issues one at a time
   - If parse error: Check if issue descriptions are ambiguous
   - If tool failure: Verify file paths and git state
2. Show error to user: "The fixer subagent failed: [error message]. Analysis:
   [your analysis]"
3. Ask: "I can retry with an adjusted approach. Retry or abort? (retry/abort)"
4. If `retry`: Attempt once more with an **adjusted prompt** based on the error
   analysis (e.g., clearer issue descriptions, reduced scope)
5. If `abort` or second failure: EXIT the loop with error status

The fixer prompt should:

- Fix ONLY the CRITICAL and HIGH priority issues identified
- Make minimal, targeted changes
- Preserve existing code style and patterns
- Add comments explaining non-obvious fixes
- Do NOT fix MEDIUM or LOW priority issues
- Report what was fixed

#### 2e. Run Tests

After fixes are applied:

1. Run appropriate tests based on file types:
   - Go files: `go test -race ./...` (run all tests with race detection)
   - Python files: `pytest pundora/` if pundora changed (run all Pundora tests)
   - Web files: `cd web && npm test` if web changed (runs vitest)

2. **If tests PASS:**
   - Report success
   - Continue to next iteration

3. **If tests FAIL:**
   - Show test failures to user
   - **In auto mode**: Abort the loop immediately with test failure summary
   - **In manual mode**: Ask: "Tests failed after applying fixes. What would you
     like to do? (revert/continue/abort)"
     - `revert` - Revert the fixes using `git restore <changed-files>` and exit
       loop. Note: Only works for tracked files. If fixes created new files,
       they must be deleted manually with `rm <file>`.
     - `continue` - Keep fixes and continue loop (maybe next iteration will fix)
     - `abort` - Keep fixes and exit loop

### Step 3: Loop Management

After each iteration:

- Increment loop counter
- If `loop_counter >= max_loops`:
  - Show "Reached maximum iterations" message
  - EXIT loop
- Otherwise, continue to next iteration (back to Step 2a)

### Step 4: Final Summary

After exiting the loop, provide a summary:

- Total iterations completed
- Total issues found (by priority)
- Total issues fixed
- Test status (passing/failing)
- Remaining issues (if any)
- Recommendation for next steps (if issues remain)

## Important Notes

- Always use the Task tool to spawn subagents (never do the review/fix work
  directly)
- In manual mode, always ask for user approval before fixes and after test
  failures
- In auto mode, automatically fix all CRITICAL and HIGH issues without asking;
  abort on test failures
- Be respectful of the user's time - provide clear, concise summaries
- If the user aborts at any point (manual mode), exit gracefully with a summary
- **Track state carefully across iterations:**
  - Maintain a list of all issues found (by priority and file:line)
  - Track which issues were fixed in each iteration
  - Track which issues are new vs. persisting from previous iterations
  - Use this state to detect if you're making progress or stuck in a loop
  - Example state structure:
    ```
    State = {
      iteration: 1,
      all_issues: {
        critical: ["SQL injection in api/users.go:123"],
        high: ["Race condition in matrix/sync.go:456", "Missing error handling in api/users.go:234"]
      },
      fixed_issues: [],
      persisting_issues: []
    }
    ```
- For Go code, ALWAYS include test files in review scope even if they weren't
  changed
- For Python code in pundora/, ALWAYS include test files in review scope even if
  they weren't changed
- For TypeScript code in web/, ALWAYS include test files in review scope even if
  they weren't changed

## Example Flow

```
User: /code-review 2

You: I'll review your uncommitted changes. I found 3 changed Go files and 2 corresponding test files.
     Files in scope:
     - api/handlers/users.go (changed)
     - api/handlers/users_test.go (included)
     - matrix/sync.go (changed)
     - matrix/sync_test.go (included)
     - common/auth/jwt.go (changed)

     Proceeding with review...

     [Spawns reviewer subagent]

     Review complete! Found:
     - 1 CRITICAL issue (SQL injection vulnerability)
     - 2 HIGH priority issues (race condition, missing error handling)
     - 3 MEDIUM priority issues

     Would you like me to fix the 1 critical and 2 high priority issues? (yes/no/abort)

User: yes

You: [Spawns fixer subagent]

     Fixes applied:
     - Fixed SQL injection in api/handlers/users.go:123 using parameterized queries
     - Fixed race condition in matrix/sync.go:456 with proper mutex locking
     - Added error handling in api/handlers/users.go:234

     Running tests...
     ✅ Tests passed!

     Starting iteration 2...
     [Spawns reviewer subagent]

     Review complete! No critical or high priority issues found. 🎉

     Remaining issues:
     - 3 MEDIUM priority issues (can be addressed later)

     Summary:
     - Iterations: 2
     - Issues fixed: 3 (1 critical, 2 high)
     - Tests: Passing ✅
     - Status: Code is ready for commit!
```

### Auto Mode Example

```
User: /code-review 3 uncommitted auto

You: Running in AUTO mode - will automatically fix all CRITICAL and HIGH issues.

     I'll review your uncommitted changes. I found 2 changed Go files and 2 corresponding test files.
     Files in scope:
     - matrix/processor/backfill_timer.go (changed)
     - matrix/processor/backfill_timer_test.go (included)
     - matrix/processor/sentinel_handler.go (changed)
     - matrix/processor/sentinel_handler_test.go (included)

     Proceeding with review...

     [Spawns reviewer subagent]

     Review complete! Found:
     - 1 CRITICAL issue (race condition)
     - 1 HIGH priority issue (missing error handling)
     - 2 MEDIUM priority issues

     Auto-fixing 1 critical and 1 high priority issues...

     [Spawns fixer subagent]

     Fixes applied:
     - Fixed race condition in matrix/processor/backfill_timer.go:89
     - Added error handling in matrix/processor/sentinel_handler.go:123

     Running tests...
     ✅ Tests passed!

     Starting iteration 2...
     [Spawns reviewer subagent]

     Review complete! No critical or high priority issues found. 🎉

     Summary:
     - Iterations: 2
     - Issues fixed: 2 (1 critical, 1 high)
     - Tests: Passing ✅
     - Status: Code is ready for commit!
```
