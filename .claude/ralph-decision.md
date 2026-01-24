# Ralph Wiggum Decision Matrix

> **Purpose:** Objective criteria for deciding between autonomous (Ralph Wiggum)
> and interactive (standard Claude Code) execution modes.

> **IMPORTANT:** Research and Planning are ALWAYS required before implementation,
> regardless of score. The score only determines execution mode, not whether to skip phases.

---

## Scoring Criteria

**For each ticket, check all that apply (YES = 1 point):**

| #   | Criteria               | How to Verify                                            |
| --- | ---------------------- | -------------------------------------------------------- |
| 1   | Test command exists    | `npm test`, `pytest`, or equivalent in target directory  |
| 2   | Typecheck/lint exists  | `npm run typecheck` or `npm run lint` available          |
| 3   | Single directory scope | All changes in ONE of: `dashboard/`, `freqtrade/`, `ai/` |
| 4   | No new dependencies    | Ticket does not require `npm install` or `pip install`   |
| 5   | No secrets/env changes | Does not touch `.env`, API keys, or credentials          |
| 6   | No schema changes      | Does not modify database or `types.ts`                   |
| 7   | Pattern exists         | Similar implementation already in codebase to copy       |
| 8   | Files ≤ 10             | Estimated file modifications is 10 or fewer              |

---

## Decision Thresholds

**Note:** ALL scores require Research → Plan → Implement workflow per LAW 11.
The score determines the IMPLEMENTATION mode only (after research and planning).

| Score   | Decision    | Action                                                      |
| ------- | ----------- | ----------------------------------------------------------- |
| **8/8** | Auto-Ralph  | Research → Plan → Auto-execute via `/ralph-loop`            |
| **6-7** | Ask User    | Research → Plan → "Run autonomous or stay interactive?"     |
| **4-5** | Interactive | Research → Plan → Standard Claude Code execution            |
| **0-3** | Deep Plan   | Research → Detailed `/create-plan` → User approval required |

---

## Hard Blockers

**If ANY of these are TRUE → Force Interactive Mode (ignore score):**

```
□ Ticket contains: "design", "architect", "decide", "choose"
□ Ticket contains: "production", "deploy", "migrate", "rollback"
□ Ticket requires new external API integration
□ Ticket needs user decisions mid-execution
□ No verification command exists for target directory
□ Ticket is labeled "spike", "research", or "investigation"
```

---

## Verification Commands by Directory

| Directory           | Commands                                           |
| ------------------- | -------------------------------------------------- |
| `dashboard/`        | `npm run typecheck && npm run lint && npm test`    |
| `freqtrade/`        | `pytest`                                           |
| `ai/tools/`         | `npm run typecheck` (if TS) or manual verification |
| `ai/workflows/n8n/` | Manual - no automated tests                        |

---

## Ralph Invocation Template

When score ≥ 8 OR user approves at 6-7:

```bash
/ralph-loop "
Ticket: HAY-XX - [title]

Requirements:
[ticket description]

Verification:
- [verification commands from table above]

Done when:
- All verification commands exit 0
- Changes on feature/hay-XX-description branch
- ai/docs/shared/progress/HAY-XX.md updated

Output <promise>COMPLETE</promise> when finished.
" --max-iterations 20 --completion-promise "COMPLETE"
```

---

## Decision Log Format

When evaluating a ticket, output:

```
## Ralph Decision: HAY-XX

| Criteria | Result |
|----------|--------|
| 1. Test command | YES/NO |
| 2. Typecheck/lint | YES/NO |
| 3. Single directory | YES/NO |
| 4. No new deps | YES/NO |
| 5. No secrets | YES/NO |
| 6. No schema | YES/NO |
| 7. Pattern exists | YES/NO |
| 8. Files ≤ 10 | YES/NO |

**Score: X/8**
**Hard blockers: NONE / [list]**
**Decision: [Auto-Ralph / Ask User / Interactive / Plan First]**
```

---

## Examples

### Example 1: Score 8/8 → Auto-Ralph

```
Ticket: HAY-30 - Add loading spinner to StatCard component

| Criteria | Result |
|----------|--------|
| 1. Test command | YES - npm test exists |
| 2. Typecheck/lint | YES - npm run typecheck exists |
| 3. Single directory | YES - dashboard/ only |
| 4. No new deps | YES - use existing Spinner atom |
| 5. No secrets | YES |
| 6. No schema | YES |
| 7. Pattern exists | YES - Spinner used in other components |
| 8. Files ≤ 10 | YES - ~3 files |

Score: 8/8
Hard blockers: NONE
Decision: Auto-Ralph
```

### Example 2: Score 4/8 → Interactive

```
Ticket: HAY-31 - Integrate Freqtrade with AI signals

| Criteria | Result |
|----------|--------|
| 1. Test command | YES - pytest exists |
| 2. Typecheck/lint | NO - Python, no strict typing |
| 3. Single directory | NO - freqtrade/ + ai/ + dashboard/ |
| 4. No new deps | NO - may need new Python packages |
| 5. No secrets | YES |
| 6. No schema | NO - may need new signal columns |
| 7. Pattern exists | NO - first integration |
| 8. Files ≤ 10 | NO - ~15 files estimated |

Score: 4/8
Hard blockers: NONE
Decision: Interactive
```

### Example 3: Hard Blocker → Force Interactive

```
Ticket: HAY-32 - Design authentication architecture

Score: 7/8
Hard blockers: Contains "design" and "architecture"
Decision: Interactive (hard blocker override)
```
