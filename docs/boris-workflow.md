# Boris Cherny Workflow Guide

> The high-velocity multi-terminal setup for 100% AI-generated code.
> Treat Claude like a team of junior engineers, not a chatbot.

---

## Quick Start

```bash
# Open 5 terminals, each running claude
cd ~/one-percent-trading-bot && claude  # T1
cd ~/one-percent-trading-bot && claude  # T2
cd ~/one-percent-trading-bot && claude  # T3
cd ~/one-percent-trading-bot && claude  # T4
cd ~/one-percent-trading-bot && claude  # T5
```

---

## The Mental Shift

| Old Way                    | Boris Way                   |
| -------------------------- | --------------------------- |
| You write code             | Claude writes code          |
| You debug                  | Claude debugs               |
| You review every file edit | You review final result     |
| You are the coder          | You are the product manager |
| One task at a time         | 5 tasks in parallel         |

---

## Terminal Assignment

Assign each terminal a domain to prevent file collisions:

| Terminal | Focus Area         | Tell Claude                                          |
| -------- | ------------------ | ---------------------------------------------------- |
| **T1**   | Dashboard/Frontend | "You own dashboard/. Build UI components."           |
| **T2**   | n8n Workflows      | "You own ai/workflows/n8n/. Build signal pipelines." |
| **T3**   | Trading Logic      | "You own freqtrade/. Configure trading strategies."  |
| **T4**   | AI Tools           | "You own ai/tools/. Build API integrations."         |
| **T5**   | Tests/Verification | "Run tests. Fix failures. Review code."              |

**Example assignment prompt:**

```
You're Terminal 2, focused on n8n workflows only.
Don't touch files outside ai/workflows/n8n/ unless necessary.
Check ai/docs/shared/progress/ before starting to see what's done.
```

---

## The Mode Cycle

### Step 1: Plan Mode (Shift+Tab × 2)

Never let Claude code immediately on complex tasks. Plan first.

```
You: "I need to add a trade history table with pagination and sorting"

Claude: [Generates detailed plan]
  1. Create TradeHistory component
  2. Add useTrades hook for data fetching
  3. Implement pagination logic
  4. Add sort controls
  5. Write tests

You: "Step 2 - use React Query instead of custom hook"

Claude: [Revises plan]

You: "Good. Execute it."
```

### Step 2: Auto-Accept Mode (Shift+Tab × 1)

Once plan is locked, let Claude run without permission prompts.

```
Claude: [Writes TradeHistory.tsx]
Claude: [Writes useTrades.ts]
Claude: [Updates types.ts]
Claude: [Writes tests]
Claude: "Done. Created 4 files."
```

What took 20 minutes of back-and-forth now takes 2 minutes.

### Step 3: Verify

Always end with verification:

```
You: "Run the tests and fix any errors you created"

Claude: [Runs npm test]
Claude: [Finds 2 failures]
Claude: [Fixes them]
Claude: "All tests passing."
```

### Step 4: Commit

```
You: /commit

Claude: [Creates conventional commit with proper message]
```

---

## Key Commands

| Command           | Purpose                    | When to Use            |
| ----------------- | -------------------------- | ---------------------- |
| `Shift+Tab × 2`   | Enter Plan Mode            | Complex features       |
| `Shift+Tab × 1`   | Enter Auto-Accept Mode     | After plan approval    |
| `/create-plan`    | Formal implementation plan | Large features         |
| `/implement-plan` | Execute a saved plan       | After plan is approved |
| `/code-review`    | AI reviews the code        | Before pushing         |
| `/commit`         | Conventional commit        | After verification     |
| `/describe-pr`    | Generate PR description    | Before creating PR     |

---

## Magic Phrases

These prompts unlock autonomous behavior:

| Phrase                            | Effect                                         |
| --------------------------------- | ---------------------------------------------- |
| "Execute the plan"                | Claude runs through all steps without stopping |
| "Fix any errors you created"      | Claude runs tests and self-corrects            |
| "Before finishing, run tests"     | Builds verification into the task              |
| "Spawn a sub-agent to review"     | Creates a reviewer for the code                |
| "Check CLAUDE.md for style rules" | Forces Claude to re-read conventions           |

---

## Parallel Work Pattern

**Example: Building a new feature across the stack**

```
T1: "Build the TradeHistory UI component with Tailwind"
    [Claude works 3 min]

T2: "Create n8n workflow to fetch trade data from exchange API"
    [Claude works 3 min]

T3: "Add trade history endpoint to Freqtrade REST API"
    [Claude works 3 min]

T4: "Write integration tests for trade history feature"
    [Claude works 2 min]

You: [Check all 4 terminals, review results]
You: [5 minutes elapsed, feature complete across full stack]
```

---

## The Meta-Rule: Compound Learning

When Claude makes the same mistake twice:

1. **Correct it** in chat
2. **Add a LAW** to `CLAUDE.md`
3. **It never happens again** (across all terminals)

```markdown
# Example: Claude kept using inline styles

# Before

Claude: <div style={{color: 'red'}}>

# You add to CLAUDE.md:

LAW 9: NEVER use inline styles. Always use Tailwind classes.

# After (forever)

Claude: <div className="text-red-500">
```

This is how you train the system. Your `CLAUDE.md` gets smarter every day.

---

## Pre-Flight Checklist

Before starting a session:

- [ ] Check `ai/docs/shared/progress/` for in-progress work
- [ ] Read relevant ticket in Linear (`./ai/tools/linear/linear get-issue HAY-XX`)
- [ ] Open multiple terminals
- [ ] Assign domains to each terminal
- [ ] Set model to Opus (if budget allows): `/model`

---

## Troubleshooting

| Problem                               | Solution                                         |
| ------------------------------------- | ------------------------------------------------ |
| Claude asks permission for everything | Restart claude to load new settings.json         |
| Terminals editing same file           | Assign clearer domains, check progress files     |
| Claude ignores style rules            | Say "Check CLAUDE.md for conventions"            |
| Too many errors in generated code     | Use Plan Mode more, verify before moving on      |
| Claude forgets context                | Summarize what's been done, or start new session |

---

## Cost vs Speed Tradeoff

| Model      | Speed   | Quality | Cost | Use When                            |
| ---------- | ------- | ------- | ---- | ----------------------------------- |
| Opus 4.5   | Slow    | Best    | $$$  | Complex architecture, critical code |
| Sonnet 3.5 | Fast    | Good    | $$   | Most development work               |
| Haiku      | Fastest | Basic   | $    | Simple edits, formatting, tests     |

Boris uses Opus because one correct slow answer beats five fast wrong ones.

---

## Daily Workflow

```
Morning:
  1. Check progress files
  2. Review Linear tickets
  3. Plan the day's work

Working:
  1. Open 3-5 terminals
  2. Assign domains
  3. Work in parallel
  4. Verify frequently

End of day:
  1. Update progress files
  2. Commit all changes
  3. Push to remote
```

---

## Notes & Improvements

<!-- Add your own learnings here -->

### Things I've Learned

-

### Custom LAWs I've Added

-

### Workflow Tweaks That Worked

-
