# Memory System Setup

**Date**: 2025-10-05  
**Category**: `[ARCHITECTURE]`  
**Participants**: Developer + AI Agent

---

## Context

The budget app project had grown complex with multiple features built over time:
- Auth system (JWT + refresh tokens)
- Plaid integration (link, sync, webhooks)
- Budget engine with rollover modes
- AI Assistant with SSE streaming
- Alerts engine, goals, export jobs, etc.

**Problem**: Without persistent memory across sessions:
- AI agents would suggest rebuilding existing features
- Context lost between development sessions
- Duplicate discussions of already-solved problems
- Inconsistent approaches to similar problems
- No record of why certain architectural decisions were made

**Goal**: Create a lightweight system for AI agents to understand project history, what's built, and what remains to be done.

---

## Decisions Made

### 1. Memory System Structure

Created `.memory/` folder with:
```
.memory/
├── README.md                           # System documentation
├── index.md                            # Quick reference & current state
└── YYYY-MM-DD_session-topic.md         # Individual session memories
```

### 2. File Format
- **Markdown** - Easy to read/write for humans and AI
- **Date-prefixed filenames** - Natural chronological ordering
- **Category tags** - Quick filtering (`[FEATURE]`, `[BUGFIX]`, `[EXPERIMENT]`, etc.)
- **Structured template** - Consistent sections across all memory files

### 3. Git Integration Strategy
**Decision**: Commit memory files to git (not gitignored)
- **Reasoning**: 
  - Acts as project documentation
  - Searchable history for the team
  - Preserves institutional knowledge
  - Small file size (markdown text)
  
### 4. Retention Policy
**Decision**: Keep all memory files indefinitely (no archiving)
- **Reasoning**:
  - Files are small (1-2 KB each)
  - Old context can be valuable years later
  - No complexity of archive management
  - Searchable with grep/git if needed

### 5. Track Failed Experiments
**Decision**: Include `[EXPERIMENT]` category for failed attempts
- **Reasoning**:
  - Learn from what didn't work
  - Avoid repeating failed approaches
  - Document why certain paths were abandoned
  - Valuable for onboarding and decision-making

### 6. No Additional Metadata (For Now)
**Decision**: Skip YAML frontmatter, PR links, time tracking, etc.
- **Reasoning**:
  - Start simple, add complexity only if needed
  - Markdown headers sufficient for now
  - Can always add metadata later if usage patterns demand it

### 7. Automation
**Decision**: Implement two automations:
1. **Git hook** to remind creating memory file after commits
2. **Auto-update** index.md when new memory files added

**Reasoning**: Reduce friction, ensure consistency, automate tedious tasks

---

## Features Built

### 1. Core Memory Files
- `.memory/README.md` - Complete system documentation
- `.memory/index.md` - Quick reference index with current state
- `.memory/2025-10-05_memory-system-setup.md` - This file!

### 2. Memory File Template Structure
Each memory file contains:
- Date & Category header
- Context section (problem being solved)
- Decisions Made (key choices and reasoning)
- Features Built (what was completed)
- Next Steps (incomplete work)
- Open Questions (unresolved issues)

### 3. Index.md Structure
- Recent Sessions (chronological)
- By Category (filtered views)
- Quick Reference: Current State
  - ✅ Completed Features (comprehensive list)
  - 🚧 In Progress
  - 📋 Planned / Not Yet Built
  - 🐛 Known Issues
  - 🤔 Open Questions
- Architecture Decisions log

### 4. Category System
Defined tags for easy filtering:
- `[FEATURE]` - New feature implementation
- `[REFACTOR]` - Code restructuring
- `[BUGFIX]` - Bug resolution
- `[ARCHITECTURE]` - System design decisions
- `[INTEGRATION]` - Third-party service integration
- `[PLANNING]` - Feature planning and requirements
- `[EXPERIMENT]` - Failed experiments and learnings

### 5. Copilot Instructions Update
Updated `.github/copilot-instructions.md` to include:
- **Before starting work**: Read `.memory/index.md`
- **After completing work**: Create memory file
- Link to memory system in main instructions

### 6. Git Hooks (In Progress)
Created hooks to:
- Remind developer to create memory file after significant commits
- Auto-update index.md when new memory files added

---

## Next Steps

### Immediate
- [x] Create memory folder structure
- [x] Write README.md and index.md
- [x] Create first memory file (this one!)
- [x] Update copilot instructions
- [ ] Implement post-commit git hook
- [ ] Test workflow with next development session

### Future
- [ ] Create memory file after each significant development session
- [ ] Refine index.md categories based on actual usage
- [ ] Consider adding search script if memory files grow large (e.g., `./scripts/search-memory.sh "plaid"`)
- [ ] Evaluate if YAML frontmatter becomes useful after 3-6 months

---

## Open Questions

None at this time. System is intentionally simple to start.

---

## Implementation Details

### Agent Workflow

**At session start**:
1. Read `.memory/index.md` for current state
2. Check "Quick Reference: Current State" section
3. Scan 2-3 most recent memory files for context
4. Verify if planned work relates to existing feature

**During session**:
- Make notes of key decisions
- Track what works and what doesn't
- Document reasoning behind choices

**At session end**:
1. Create `YYYY-MM-DD_topic.md` file
2. Use standard template structure
3. Add entry to `index.md` in "Recent Sessions"
4. Update "Current State" sections as needed
5. Commit both files together

### Git Hook Strategy

**post-commit hook** (`.git/hooks/post-commit`):
- Check if commit has significant changes (not just docs)
- Remind developer to create/update memory file
- Provide template command to create file

**pre-commit hook** (optional, future):
- Check if new memory file exists in `.memory/`
- Auto-update index.md "Last Updated" timestamp
- Validate memory file format (has required sections)

---

## Related Files
- `.memory/README.md`
- `.memory/index.md`
- `.github/copilot-instructions.md`
- `.git/hooks/post-commit` (to be created)

---

## Notes

This is a living system - expect refinements based on actual usage. The goal is to make it easy enough that it gets used consistently, but structured enough that it provides real value.

Key principle: **Better to have imperfect memory files than no memory at all.**
