# Claude Code — Standing Instructions

## Workflow Orchestration

### 1. Plan Node Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately — don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes — don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests — then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

---

## Task Management
1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

---

## Core Principles
- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.

---

## Project-Specific Lessons

### 2026-03-10 — Over-engineering
- User asked for a "Visit Project button" → built a full-viewport iframe takeover with sticky bar, collapsible panel, loading spinner, and blocked-site fallback
- Rule: **When the user asks for a button, build a button.** Re-read the request before starting.

### 2026-03-10 — Silent error swallowing
- CMS `loadBlogPosts` / `loadProjects` used `if (!error)` pattern, making RLS failures invisible
- Rule: **Always surface errors explicitly.** Silent fallbacks mask root causes.

### 2026-03-10 — Quill lazy init timing
- Initialised Quill editors in `onMount` before their DOM containers existed (tab/form conditional rendering)
- Rule: **Never initialise a library against a conditionally-rendered element in onMount.** Use `$effect` + `tick()` instead.

### 2026-03-10 — Pending content race condition
- `editBlogPost` set `blogEditor.root.innerHTML` immediately; editor was null on first open
- Rule: **When editor init is async, store pending content and apply it inside the init callback.**

### 2026-03-11 — Fallback text truncation
- Hardcoded `FALLBACK_ABOUT.bio` was cut short during migration — user noticed
- Rule: **When migrating hardcoded content, verify against the original source file character-for-character.**
