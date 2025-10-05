# Project Memory System

This folder contains chronological memory files documenting development decisions, features built, and architectural discussions for the Budget App project.

## Purpose

- Track what has been built and what remains to be done
- Document architectural decisions and their rationale
- Preserve context across development sessions
- Help AI agents understand project history and current state
- Learn from failed experiments and avoid repeating mistakes

## File Naming Convention

Memory files follow the pattern: `YYYY-MM-DD_session-topic.md`

Example: `2025-10-05_plaid-webhook-refactor.md`

## File Structure

Each memory file should contain:

1. **Date & Session Info** - When the work happened
2. **Context** - What problem was being solved
3. **Decisions Made** - Key architectural/technical choices
4. **Features Built** - What was completed (or what failed)
5. **Next Steps** - What was left incomplete or planned
6. **Open Questions** - Unresolved issues to revisit

## Integration with AI Agents

**IMPORTANT**: When starting a new session, agents should:
1. **ALWAYS** check `.memory/index.md` first for current project state
2. Read 2-3 most recent memory files for context
3. Check if your task relates to existing features/decisions
4. Create new memory file at session end documenting work done
5. Let git hook auto-update index.md

## Categories

Memory files are tagged with categories:
- `[FEATURE]` - New feature implementation
- `[REFACTOR]` - Code restructuring
- `[BUGFIX]` - Bug resolution
- `[ARCHITECTURE]` - System design decisions
- `[INTEGRATION]` - Third-party service integration
- `[PLANNING]` - Feature planning and requirements
- `[EXPERIMENT]` - Failed experiments and learnings

## Git Integration

- Memory files are committed to the repository
- Git hook reminds to create memory file after commits
- index.md is automatically updated when new memory files are added
- All files are kept indefinitely (no archiving)

## Tips for Writing Memory Files

- **Be concise**: 1-2 pages max
- **Focus on "why"**: Document reasoning behind decisions
- **Include failures**: Failed experiments are valuable learning
- **Link related work**: Reference files, commits, or other memory files
- **Update index.md**: Add summary entry for quick reference
