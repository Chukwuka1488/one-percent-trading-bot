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

**Output:** Document ticket requirements in progress file.

---

### Step 2: Research Codebase (`/research-codebase`)

Invoke the research command to understand the codebase:

```
/research-codebase

Research query: "Document the current implementation related to [ticket scope].
Find existing patterns, components, and architecture that will be relevant
for implementing HAY-XX: [ticket title]"
```

**Output:** Research document at `ai/docs/shared/research/YYYY-MM-DD-HAY-XX-description.md`

---

### Step 3: Review Research

Before planning, verify research is complete:

- [ ] All relevant files identified
- [ ] Existing patterns documented
- [ ] Dependencies mapped
- [ ] No gaps in understanding

If gaps exist, run additional research queries.

---

### Step 4: Create Plan (`/create-plan`)

Invoke the planning command:

```
/create-plan

Context: Based on research in ai/docs/shared/research/YYYY-MM-DD-HAY-XX-description.md,
create an implementation plan for HAY-XX: [ticket title]
```

**Output:** Plan document at `ai/docs/shared/plans/HAY-XX.md`

---

### Step 5: Review Plan

Before implementation, verify plan is complete:

- [ ] All files to modify/create listed
- [ ] Acceptance criteria defined
- [ ] Follows patterns from research
- [ ] No architectural concerns

Get user approval before proceeding.

---

### Step 6: Implement Plan (`/implement-plan`)

Execute the approved plan:

```
/implement-plan HAY-XX
```

**Output:** Code changes following the plan.

---

### Step 7: Code Review (`/code-review`)

Run code review before committing:

```
/code-review
```

Fix any issues identified.

---

### Step 8: Commit (`/commit`)

Create conventional commit:

```
/commit
```

---

### Step 9: Update Progress

Update tracking files:

1. `ai/docs/shared/progress/HAY-XX.md` - Mark completed items
2. `ai/docs/shared/SPRINT.md` - Update status if complete
3. Clear "Files Being Edited" section

---

## Checklist Template

Copy this for each ticket:

```markdown
## HAY-XX Workflow Checklist

- [ ] Step 1: Fetch ticket details
- [ ] Step 2: /research-codebase
- [ ] Step 3: Review research (no gaps)
- [ ] Step 4: /create-plan
- [ ] Step 5: Review plan (user approved)
- [ ] Step 6: /implement-plan
- [ ] Step 7: /code-review (all issues fixed)
- [ ] Step 8: /commit
- [ ] Step 9: Update progress files
```

---

## Quick Reference

| Step | Command              | Output Location            |
| ---- | -------------------- | -------------------------- |
| 1    | `linear get-issue`   | Progress file              |
| 2    | `/research-codebase` | `ai/docs/shared/research/` |
| 3    | Manual review        | -                          |
| 4    | `/create-plan`       | `ai/docs/shared/plans/`    |
| 5    | Manual review        | -                          |
| 6    | `/implement-plan`    | Source code                |
| 7    | `/code-review`       | -                          |
| 8    | `/commit`            | Git commit                 |
| 9    | Manual update        | Progress files             |
