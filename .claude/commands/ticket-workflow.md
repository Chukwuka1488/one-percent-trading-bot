---
description: Complete ticket workflow from fetch to code review
---

# Ticket Workflow

Complete end-to-end workflow for implementing any HAY ticket.

## Usage

```bash
/ticket-workflow HAY-XX
```

## Workflow Steps

### Step 1: Fetch Ticket

Get ticket details from Linear:

```bash
./ai/tools/linear/linear get-issue $ARGUMENTS
```

If Linear CLI unavailable, check:

- `ai/docs/shared/SPRINT.md` for ticket context
- `ai/docs/shared/progress/HAY-XX.md` for existing progress

**Output:** Document ticket requirements.

---

### Step 2: Claim Ticket (CRITICAL - Do This Immediately!)

**Other worktrees need to know what you're working on BEFORE you start.**

1. Create feature branch:

   ```bash
   git checkout -b feature/hay-XX-description
   ```

2. Update `ai/docs/shared/SPRINT.md`:
   - Set ticket status to "Active"
   - Add worktree assignment (your worktree + ticket + branch)
   - Add files you'll edit to "Files Being Edited" table

3. Create progress file `ai/docs/shared/progress/HAY-XX.md`

4. **COMMIT AND PUSH IMMEDIATELY:**
   ```bash
   git add ai/docs/shared/SPRINT.md ai/docs/shared/progress/HAY-XX.md
   git commit -m "chore(sprint): claim hay-XX for worktree-N"
   git push -u origin feature/hay-XX-description
   ```

**WHY:** Other worktrees fetch/pull to see claimed tickets. If you don't push, they can't see your claim and may duplicate work.

---

### Step 3: Research Codebase (`/research-codebase`)

Invoke the research command to understand the codebase:

```
/research-codebase

Research query: "Document the current implementation related to [ticket scope].
Find existing patterns, components, and architecture that will be relevant
for implementing HAY-XX: [ticket title]"
```

**Output:** Research document at `ai/docs/shared/research/YYYY-MM-DD-HAY-XX-description.md`

---

### Step 4: Review Research

Before planning, verify research is complete:

- [ ] All relevant files identified
- [ ] Existing patterns documented
- [ ] Dependencies mapped
- [ ] No gaps in understanding

If gaps exist, run additional research queries.

---

### Step 5: Create Plan (`/create-plan`)

Invoke the planning command:

```
/create-plan

Context: Based on research in ai/docs/shared/research/YYYY-MM-DD-HAY-XX-description.md,
create an implementation plan for HAY-XX: [ticket title]
```

**Output:** Plan document at `ai/docs/shared/plans/HAY-XX.md`

---

### Step 6: Review Plan

Before implementation, verify plan is complete:

- [ ] All files to modify/create listed
- [ ] Acceptance criteria defined
- [ ] Follows patterns from research
- [ ] No architectural concerns

Get user approval before proceeding.

---

### Step 7: Implement Plan (`/implement-plan`)

Execute the approved plan:

```
/implement-plan HAY-XX
```

**Output:** Code changes following the plan.

---

### Step 8: Code Review (`/code-review`)

Run code review before committing:

```
/code-review
```

Fix any issues identified.

---

### Step 9: Commit (`/commit`)

Create conventional commit:

```
/commit
```

---

### Step 10: Update Progress & Push

Update tracking files:

1. `ai/docs/shared/progress/HAY-XX.md` - Mark completed items
2. `ai/docs/shared/SPRINT.md`:
   - Update status to "Complete"
   - Clear worktree assignment (set to "-")
   - Clear "Files Being Edited" entries

3. **Commit and push:**
   ```bash
   git add ai/docs/shared/
   git commit -m "docs(progress): complete hay-XX"
   git push
   ```

---

## Checklist Template

Copy this for each ticket:

```markdown
## HAY-XX Workflow Checklist

- [ ] Step 1: Fetch ticket details
- [ ] Step 2: Claim ticket (update SPRINT.md, commit, PUSH)
- [ ] Step 3: /research-codebase
- [ ] Step 4: Review research (no gaps)
- [ ] Step 5: /create-plan
- [ ] Step 6: Review plan (user approved)
- [ ] Step 7: /implement-plan
- [ ] Step 8: /code-review (all issues fixed)
- [ ] Step 9: /commit
- [ ] Step 10: Update progress files and PUSH
```

---

## Quick Reference

| Step | Command              | Output Location            | Push?   |
| ---- | -------------------- | -------------------------- | ------- |
| 1    | `linear get-issue`   | -                          | No      |
| 2    | Manual + git         | SPRINT.md, progress/       | **YES** |
| 3    | `/research-codebase` | `ai/docs/shared/research/` | No      |
| 4    | Manual review        | -                          | No      |
| 5    | `/create-plan`       | `ai/docs/shared/plans/`    | No      |
| 6    | Manual review        | -                          | No      |
| 7    | `/implement-plan`    | Source code                | No      |
| 8    | `/code-review`       | -                          | No      |
| 9    | `/commit`            | Git commit                 | No      |
| 10   | Manual + git         | Progress files             | **YES** |

---

## Critical Rules

1. **ALWAYS push after claiming** - Other worktrees can't see unpushed commits
2. **Check SPRINT.md before claiming** - Ensure ticket isn't already claimed
3. **Update "Files Being Edited"** - Prevents merge conflicts
4. **Clear tracking on completion** - Free up the ticket for others to verify
