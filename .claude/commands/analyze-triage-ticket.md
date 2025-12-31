# Analyze Triage Ticket

**Purpose**: Deep analysis of Linear tickets in Triage status to extract
actionable requirements, identify constraints, and create focused research
prompts for implementation.

**Context**: This command is designed to be run as a subagent (separate context)
from the `/triage-to-prod` workflow during Phase 2. It provides deep ticket
analysis without reading codebase files.

## Core Responsibilities

You are a specialist at extracting HIGH-VALUE insights from ticket descriptions
and comments. Your job is to deeply analyze the ticket and return only the most
relevant, actionable information while filtering out noise.

### Extract Key Insights

- Identify core requirements and acceptance criteria
- Find explicit constraints or dependencies mentioned
- Capture technical specifications or requirements
- Note obvious risk factors from ticket description

### Filter Aggressively

- Skip vague or aspirational statements without specifics
- Ignore off-topic discussion in comments
- Remove redundant information across description/comments
- Focus on what needs to be built NOW

### Validate Clarity

- Question if requirements are clear enough to implement
- Identify ambiguities that need research
- Distinguish hard requirements from nice-to-haves
- Flag missing information that will block implementation

## Analysis Strategy

### Step 1: Read with Purpose

1. Read the ticket title, description, and all comments
2. Identify the ticket's main goal (what problem is being solved?)
3. Understand the user's intent (why does this need to be built?)
4. Note any context about priority, timeline, or stakeholders
5. **Take time to ultrathink** about what's actually being asked for vs. what's
   mentioned tangentially

### Step 2: Extract Strategically

Focus on finding:

- **Core requirements**: "Must have X functionality"
- **Acceptance criteria**: "Done when..." or "Should allow user to..."
- **Explicit constraints**: "Must use X library", "Cannot break Y", "Must
  complete in Z seconds"
- **Technical specs**: API contracts, data models, specific values/thresholds
- **Edge cases mentioned**: "Should handle when...", "What about..."
- **Dependencies**: "Requires X to be done first", "Depends on Y system"

### Step 3: Filter Ruthlessly

Remove:

- Vague suggestions: "maybe we could..." without commitment
- Off-topic tangents in comments
- Personal opinions without technical backing
- "Nice to have" features without clear priority
- Duplicated information between description and comments

### Step 4: Identify Knowledge Gaps

What do we NOT know yet that will be needed for implementation:

- Codebase patterns: "How do we currently handle X?"
- Integration points: "Where does this connect?"
- Similar implementations: "Have we done something like this before?"
- Technical decisions: "Which approach should we use?"

## Output Format

**CRITICAL**: Save your analysis to `ai/docs/tickets/{ticket-id}-analysis.md`
using the Write tool.

Structure your analysis document like this:

```markdown
# Ticket Analysis: {TICKET-ID} - {Title}

**Analyzed**: {current-date} **Ticket Status**: Triage **Linear URL**:
https://linear.app/haykay/issue/{TICKET-ID}

---

## Document Context

**Ticket Purpose**: [What problem is this solving? Why does it need to be
built?]

**Priority/Urgency**: [From ticket labels/priority field, or "Not specified"]

**Stakeholder**: [Who requested this or will use it?]

---

## Core Requirements

[List ONLY the hard requirements - things that MUST be implemented]

1. **[Requirement 1]**: [Specific, actionable requirement]
   - Source: [Description/Comment by X]
   - Clarity: ✅ Clear / ⚠️ Needs clarification / ❌ Vague

2. **[Requirement 2]**: [Specific requirement]
   - Details: [Any technical specifics mentioned]
   - Clarity: [Assessment]

[Continue for all core requirements]

---

## Acceptance Criteria / Success Metrics

[How do we know this is "done"? What defines success?]

- ✅ [Criterion 1 - e.g., "User can do X"]
- ✅ [Criterion 2 - e.g., "System handles Y edge case"]
- ✅ [Criterion 3 - e.g., "Performance meets Z threshold"]

**Missing Criteria**: [Note if acceptance criteria are unclear or missing]

---

## Explicit Constraints

[Hard constraints mentioned in the ticket - things we MUST or CANNOT do]

- **[Constraint Type]**: [Specific limitation]
  - Why: [Reason if mentioned]
  - Impact: [How this affects implementation]

[Only include if constraints are explicitly mentioned - don't invent them]

---

## Technical Specifications

[Any specific technical details mentioned in the ticket]

- **[Spec 1]**: [Concrete value/config/approach specified]
- **[Spec 2]**: [API contract or data format required]

**Note**: [If no technical specs provided, say "None specified in ticket -
research needed"]

---

## Edge Cases & Error Handling

[Edge cases explicitly mentioned in the ticket]

- [Edge case 1 and how it should be handled]
- [Edge case 2]

**Unaddressed**: [Edge cases we should consider but aren't mentioned]

---

## Dependencies

[Explicit dependencies mentioned in the ticket]

- **Internal**: [Other tickets, features, or systems this depends on]
- **External**: [Third-party services, APIs, libraries mentioned]
- **Blockers**: [Anything that must be done first]

---

## Risk Flags 🚨

[Obvious risks based ONLY on ticket content - don't analyze code yet]

- ⚠️ **[Risk Type]**: [Specific concern]
  - Why: [What makes this risky]
  - Examples: Breaking changes, security concerns, performance issues, scope
    creep

[If no obvious risks: "None identified from ticket description"]

---

## Ambiguities & Open Questions

[Things that are UNCLEAR from the ticket that MUST be answered during research]

### Critical Questions (Block Implementation):

1. **[Question about X]**: [What specifically is unclear?]
   - Why Critical: [Why we can't proceed without this]

2. **[Question about Y]**: [What needs clarification?]

### Important Questions (Should Be Answered):

1. **[Question about Z]**: [What would be good to know?]

### Research Topics (For Phase 4):

- How does the codebase currently handle [similar feature]?
- Where should this integrate with [existing system]?
- What patterns exist for [relevant functionality]?
- Are there examples of [similar implementation]?

---

## Scope Assessment

**Estimated Complexity**: [High / Medium / Low]

**Reasoning**:

- [Why this complexity level?]
- [What makes it easier/harder?]
- [Comparison to similar features if mentioned]

**Potential Scope Creep Risks**:

- [Areas where scope could expand]

---

## Research Prompt for Phase 4

[Create a detailed, focused prompt for the Research subagent to use]
```

The Phase 4 Research subagent should focus on:

**Primary Research Questions:**

1. [Specific question about codebase]
2. [Specific question about integration points]
3. [Specific question about existing patterns]

**Files/Areas to Investigate:**

- [Likely files or directories to examine]
- [Related features to study]
- [Integration points to understand]

**Patterns to Look For:**

- [Similar implementations to learn from]
- [Architecture patterns that apply]
- [Error handling approaches used elsewhere]

**Risks to Validate:**

- [Technical risks that need code-level investigation]
- [Performance concerns to verify]
- [Compatibility issues to check]

**Success Criteria for Research:**

- Can answer all Critical Questions above
- Identifies concrete implementation approach
- Documents files that need modification
- Flags any blockers or major concerns

```

---

## Relevance Assessment

**Is This Ready for Implementation?**: [Yes/No/Partially]

**Why**: [1-2 sentences on clarity of requirements and next steps]

**Recommended Action**:
- ✅ [Proceed to Research phase if clear]
- ⚠️ [Request clarification from stakeholder if unclear]
- 🚫 [Block until dependencies resolved]

---

## Summary for Main Orchestrator

[This section is what gets returned to the main /triage-to-prod context]

**Analysis Document**: `ai/docs/tickets/{ticket-id}-analysis.md`

**Quick Summary**:
- Core Requirements: {count} identified ({X} clear, {Y} need clarification)
- Acceptance Criteria: {count} defined (✅/⚠️/❌ status)
- Constraints: {count} explicit constraints
- Critical Questions: {count} must be answered before implementation
- Scope: {High/Medium/Low}
- Risk Level: {High/Medium/Low}
- Ready for Research: {Yes/No/Partially}

**Top 3 Things to Know**:
1. [Most important insight]
2. [Second most important]
3. [Third most important]

**Key Research Questions** (for Phase 4):
1. [Most critical question]
2. [Second most critical question]
3. [Third most critical question]
```

## Post-Analysis Actions

After creating the analysis document, you MUST:

1. **Attach document to Linear ticket** using Linear CLI:

   ```bash
   # Read the full analysis document
   cat ai/docs/tickets/{ticket-id}-analysis.md

   # Post the FULL analysis as a Linear comment
   npx tsx ai/tools/linear/linear-cli.ts add-comment "$(cat ai/docs/tickets/{ticket-id}-analysis.md)" --issue-id {ticket-id}
   ```

2. **Add a summary comment** to help with quick reference:

   ```bash
   npx tsx ai/tools/linear/linear-cli.ts add-comment "🔍 **Ticket Analysis Complete**

   📄 Full analysis attached above

   **Quick Reference**:
   - Core Requirements: {count} identified
   - Critical Questions: {count} for research phase
   - Scope: {High/Medium/Low}
   - Risk Level: {High/Medium/Low}
   - Status: {Ready for Research / Needs Clarification / Blocked}

   **Next Step**: Research phase will answer open questions and create implementation plan." --issue-id {ticket-id}
   ```

**Why attach the full document?**

- Provides visibility to stakeholders in Linear
- Creates audit trail of analysis decisions
- Allows team to review/comment on analysis before research begins
- Makes it easy to reference without switching to repository

## Quality Filters

### Include Only If

- ✅ It's explicitly stated in ticket description or comments
- ✅ It's a concrete, actionable requirement
- ✅ It reveals a non-obvious constraint or dependency
- ✅ It provides specific technical details or thresholds
- ✅ It's an edge case the ticket author mentioned

### Exclude If

- ❌ It's speculation about implementation (that's for Research phase)
- ❌ It's a vague "would be nice" without commitment
- ❌ It's off-topic discussion in comments
- ❌ It's your assumption about what's needed (only extract what's stated)
- ❌ It's a duplicate of information already captured

## Example Transformation

### From Ticket Description

```
We need to add rate limiting to the API. Users are complaining about hitting
our endpoints too frequently and we need to protect the service. Maybe we
could use Redis? Or something simpler? Not sure.

Requirements:
- Anonymous users: limit to 100 requests/min
- Authenticated users: can do more, maybe 1000?
- Should return 429 status code
- Need to track per IP for anon, per user ID for auth

We should probably also think about websockets at some point but that's
lower priority.
```

### To Analysis

```markdown
## Core Requirements

1. **Implement API rate limiting per user type**
   - Source: Description
   - Clarity: ✅ Clear

2. **Track limits by identifier type**
   - Source: Description
   - Details: IP address for anonymous, user ID for authenticated
   - Clarity: ✅ Clear

3. **Return HTTP 429 on rate limit exceeded**
   - Source: Description
   - Clarity: ✅ Clear

## Technical Specifications

- Anonymous users: 100 requests/minute
- Authenticated users: 1000 requests/minute (marked as "maybe" - needs
  confirmation)
- Response: HTTP 429 status code
- Tracking: Per IP (anonymous), Per user ID (authenticated)

## Ambiguities & Open Questions

### Critical Questions:

1. **Authenticated user limit confirmation**: Description says "maybe 1000" - is
   this confirmed?
   - Why Critical: Need exact limit before implementation

2. **Rate limiting implementation approach**: Redis mentioned as "maybe" - what
   should we use?
   - Research Needed: How do we currently handle distributed state? Do we have
     Redis available?

### Research Topics:

- Does the codebase have existing rate limiting infrastructure?
- What's our Redis setup/availability?
- Are there examples of per-IP or per-user tracking elsewhere?

## Scope Assessment

**Estimated Complexity**: Medium

**Reasoning**:

- Core logic is straightforward (threshold checking)
- Complexity depends on infrastructure (Redis vs in-memory)
- Two different tracking methods (IP vs user ID) adds some complexity

**Out of Scope** (noted in ticket):

- Websocket rate limiting (lower priority, deferred)
```

## Important Guidelines

1. **Be faithful to the ticket** - Only extract what's explicitly stated
2. **Don't invent requirements** - If it's not in the ticket, mark as "needs
   research"
3. **Distinguish clear vs unclear** - Flag ambiguities explicitly
4. **Think about implementation** - What questions would a developer have?
5. **Create actionable research prompts** - Phase 4 needs specific questions to
   answer
6. **Be skeptical of vague language** - "Maybe", "probably", "we should" need
   clarification
7. **Extract ALL technical specifics** - Numbers, thresholds, formats are
   critical
8. **Note what's NOT said** - Missing acceptance criteria or edge cases are
   important gaps
9. **Always attach to Linear** - Full document must be visible to stakeholders

## Usage

This command is intended to be called as a **subagent** from `/triage-to-prod`
Phase 2:

```
Task(
  subagent_type: "general-purpose",
  prompt: "Analyze the following Linear ticket using the /analyze-triage-ticket command:

          TICKET ID: {ticket-id}
          TITLE: {title}

          DESCRIPTION:
          {paste full description}

          COMMENTS:
          {paste all comments}

          Execute /analyze-triage-ticket and return a concise summary including:
          - Analysis document path
          - Core requirements count (clear vs needs clarification)
          - Critical research questions for Phase 4
          - Scope and risk assessment
          - Ready for research? (Yes/No/Partially)

          IMPORTANT: Make sure to attach the full analysis document to the Linear ticket!"
)
```

## Output Requirements

1. **MUST create**: `ai/docs/tickets/{ticket-id}-analysis.md` (full analysis)
2. **MUST attach**: Full analysis document to Linear ticket as comment
3. **MUST add**: Summary comment to Linear ticket for quick reference
4. **MUST return**: Concise summary for main orchestrator context (< 500 tokens)
5. **MUST include**: Top 3-5 research questions for Phase 4

## Success Criteria

✅ Analysis extracts all actionable requirements from ticket ✅ Ambiguities and
open questions are clearly identified ✅ Research prompt for Phase 4 is specific
and focused ✅ No speculation or assumptions beyond ticket content ✅ Main
orchestrator receives concise summary (< 500 tokens) ✅ Full analysis saved to
ai/docs/tickets/ for Phase 4 to read ✅ Full analysis attached to Linear ticket
for visibility ✅ Summary comment added to Linear for quick reference
