# Memory System Quick Start

## For Developers

### Creating a Memory File

**Easy way** (using the helper script):
```bash
./scripts/create-memory.sh your-topic-name
```

This will:
1. Create `.memory/YYYY-MM-DD_your-topic-name.md` with template
2. Auto-fill the date
3. Open in your editor

**Manual way**:
1. Copy `.memory/TEMPLATE.md` to `.memory/YYYY-MM-DD_topic.md`
2. Fill in all sections
3. Update `.memory/index.md`:
   - Add entry under "Recent Sessions"
   - Update "Current State" sections as needed

### After Committing Code

The git hook will remind you if you forget to create a memory file after significant commits.

Skip the reminder by including `memory:` in your commit message:
```bash
git commit -m "memory: add new feature docs"
```

### Commit Convention

When committing memory files, use the `memory:` prefix:
```bash
git commit -m "memory: document plaid webhook refactor"
```

---

## For AI Agents

### At Session Start

1. **ALWAYS** read `.memory/index.md` first
2. Check "Quick Reference: Current State" section
3. Scan 2-3 most recent memory files for context
4. Verify if your task relates to existing features

### During Session

- Note key decisions and reasoning
- Track what works and what doesn't
- Document architectural choices

### At Session End

1. Run: `./scripts/create-memory.sh topic-name`
2. Fill in template with session details
3. Add summary to `.memory/index.md` under "Recent Sessions"
4. Update "Current State" sections (✅ Completed, 🚧 In Progress, etc.)
5. Commit with: `git add .memory/ && git commit -m "memory: topic-name"`

### Memory File Categories

Tag your memory file with appropriate category:

- `[FEATURE]` - New feature implementation
- `[REFACTOR]` - Code restructuring
- `[BUGFIX]` - Bug resolution
- `[ARCHITECTURE]` - System design decisions
- `[INTEGRATION]` - Third-party service integration
- `[PLANNING]` - Feature planning and requirements
- `[EXPERIMENT]` - Failed experiments and learnings

---

## Tips

- Keep memory files **1-2 pages max**
- Focus on **"why"** not just "what"
- **Include failures** - they're valuable learning
- **Link related files** and other memory docs
- Update `index.md` for easy reference

---

## Examples

**Good memory file name**:
- `2025-10-05_plaid-sync-optimization.md`
- `2025-10-07_budget-rollover-refactor.md`
- `2025-10-10_failed-redis-clustering-experiment.md`

**Bad memory file name**:
- `changes.md` (not dated)
- `stuff-i-did.md` (too vague)
- `2025-10-05.md` (no topic)
