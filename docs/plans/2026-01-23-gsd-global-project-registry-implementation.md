# GSD Global Project Registry Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add automatic project registration/deregistration and cross-project context injection to mrm-claude-workflow.

**Architecture:** A global registry file at `~/.claude/gsd-active-projects.md` stores active project metadata. Workflows auto-register on entry (`new-project`, `progress`), auto-prompt for archive on `complete-milestone`, and inject cross-project context during planning workflows.

**Tech Stack:** Markdown files, Bash for git detection, existing GSD command/reference patterns.

---

## Task 1: Create Registry Template

**Files:**
- Create: `/Users/miguelitodeguzman/Projects/mrm-claude-workflow/get-shit-done/templates/active-projects.md`

**Step 1: Write the template file**

```markdown
# Active Projects Registry Template

Template for `~/.claude/gsd-active-projects.md` — global registry of active GSD projects.

---

## File Template

```markdown
# GSD Active Projects Registry

> Auto-managed by mrm-claude-workflow. Do not edit manually.
> Last updated: {{TIMESTAMP}}

<!-- Projects are added/removed automatically by GSD workflows -->
```

---

<purpose>

The active projects registry enables cross-project awareness. When planning in Project A, you can see what Projects B and C are doing, their key decisions, and their current progress.

**Problem it solves:** Each GSD project operates in isolation. Architectural decisions in one project don't inform decisions in related projects. No visibility into what else is actively being developed.

**Solution:** A single global file that:
- Auto-registers projects when GSD workflows start
- Auto-removes projects when explicitly archived
- Provides cross-project context during planning

</purpose>

<entry_format>

Each project entry follows this structure:

```markdown
## {{PROJECT_NAME}}

- **Path:** {{ABSOLUTE_PATH}}
- **Type:** {{PROJECT_TYPE}}
- **Status:** {{active|paused}}
- **Milestone:** {{CURRENT_MILESTONE}}
- **Phase:** {{CURRENT_PHASE}} of {{TOTAL_PHASES}}
- **Branch:** {{GIT_BRANCH}}
- **Worktree:** {{WORKTREE_PATH|none}}
- **Last activity:** {{TIMESTAMP}}

### Key Decisions
{{KEY_DECISIONS_LIST}}

---
```

**Field sources:**
- `PROJECT_NAME`: From `.planning/PROJECT.md` title or directory name
- `ABSOLUTE_PATH`: `pwd` output
- `PROJECT_TYPE`: From `.planning/config.json` project_type field
- `MILESTONE`: From `.planning/ROADMAP.md` current milestone header
- `PHASE`: From `.planning/STATE.md` current position
- `GIT_BRANCH`: `git branch --show-current`
- `WORKTREE_PATH`: Detected via `git rev-parse --git-common-dir`
- `KEY_DECISIONS`: From `.planning/PROJECT.md` Key Decisions table

</entry_format>

<lifecycle>

**Registration triggers:**
- `/mrm:new-project` — After STATE.md created
- `/mrm:progress` — If project not already registered

**Update triggers:**
- Any `/mrm:*` command — Update phase, branch, last activity

**Deregistration triggers:**
- `/mrm:complete-milestone` — When user chooses "Archive project"

</lifecycle>

<consumption>

**Injection points:**
- `/mrm:new-project` — During Phase 3 (questioning), show other active projects
- `/mrm:plan-phase` — Before spawning planner agent, inject context
- `/mrm:discuss-phase` — Include in discussion context

**Compact format for injection:**

```markdown
## Other Active Projects

**vesla-erp-workspace** (Phase 3/8, v1.0)
→ JWT auth, PostgreSQL/Prisma, REST /api/v1/*
→ Branch: feature/booking-api

**client-portal** (Phase 1/4, v1.0)
→ Next.js 14, Zustand, consumes vesla-erp API
→ Branch: main
```

</consumption>
```

**Step 2: Commit**

```bash
git add get-shit-done/templates/active-projects.md
git commit -m "feat(templates): add active-projects registry template"
```

---

## Task 2: Create Archive Template

**Files:**
- Create: `/Users/miguelitodeguzman/Projects/mrm-claude-workflow/get-shit-done/templates/archive.md`

**Step 1: Write the archive template file**

```markdown
# Archive Template

Template for `~/.claude/gsd-archive.md` — historical record of completed GSD projects.

---

## File Template

```markdown
# GSD Archived Projects

> Historical record of completed projects. Read-only reference.
> For active projects, see ~/.claude/gsd-active-projects.md

<!-- Archived projects are added when /mrm:complete-milestone archives a project -->
```

---

<purpose>

Preserves project history without bloating active context. When a project is archived:
1. Entry moves from active registry to archive
2. Completion date and duration recorded
3. Key decisions preserved for future reference

</purpose>

<entry_format>

```markdown
## {{PROJECT_NAME}} (archived {{DATE}})

- **Final Milestone:** {{LAST_MILESTONE}}
- **Duration:** {{START_DATE}} to {{END_DATE}} ({{DAYS}} days)
- **Path:** {{ABSOLUTE_PATH}}
- **Type:** {{PROJECT_TYPE}}

### Key Decisions (preserved)
{{KEY_DECISIONS_LIST}}

---
```

</entry_format>
```

**Step 2: Commit**

```bash
git add get-shit-done/templates/archive.md
git commit -m "feat(templates): add archive template for completed projects"
```

---

## Task 3: Create Registry Library Reference

**Files:**
- Create: `/Users/miguelitodeguzman/Projects/mrm-claude-workflow/get-shit-done/references/registry.md`

**Step 1: Write the shared registry operations reference**

```markdown
# Global Project Registry Operations

Shared reference for reading, writing, and managing the global project registry.

---

## Registry Location

- **Active:** `~/.claude/gsd-active-projects.md`
- **Archive:** `~/.claude/gsd-archive.md`

---

## Read Registry

**Purpose:** Load all active projects except current one.

**Steps:**

1. Check if registry exists:
   ```bash
   REGISTRY_FILE="$HOME/.claude/gsd-active-projects.md"
   test -f "$REGISTRY_FILE" && echo "exists" || echo "missing"
   ```

2. If missing, create with empty template (read templates/active-projects.md for format).

3. Get current project path for filtering:
   ```bash
   CURRENT_PATH=$(pwd)
   ```

4. Parse registry: Each `## ` header starts a project entry. Extract until next `---` separator.

5. Filter out current project (match by Path field).

6. Return list of other active projects.

---

## Write Project Entry

**Purpose:** Register or update current project in registry.

**Steps:**

1. Gather project metadata:
   ```bash
   # Project path
   PROJECT_PATH=$(pwd)

   # Project name (from directory or PROJECT.md)
   PROJECT_NAME=$(basename "$PROJECT_PATH")
   if [ -f .planning/PROJECT.md ]; then
     EXTRACTED_NAME=$(head -1 .planning/PROJECT.md | sed 's/^# //')
     [ -n "$EXTRACTED_NAME" ] && PROJECT_NAME="$EXTRACTED_NAME"
   fi

   # Project type
   PROJECT_TYPE=$(cat .planning/config.json 2>/dev/null | grep -o '"project_type"[[:space:]]*:[[:space:]]*"[^"]*"' | grep -o '"[^"]*"$' | tr -d '"' || echo "unknown")

   # Git branch
   GIT_BRANCH=$(git branch --show-current 2>/dev/null || echo "none")

   # Worktree detection
   GIT_COMMON=$(git rev-parse --git-common-dir 2>/dev/null)
   GIT_DIR=$(git rev-parse --git-dir 2>/dev/null)
   if [ "$GIT_COMMON" != "$GIT_DIR" ] && [ "$GIT_COMMON" != ".git" ]; then
     WORKTREE_PATH="$PROJECT_PATH"
   else
     WORKTREE_PATH="none"
   fi

   # Timestamp
   TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
   ```

2. Extract current position from STATE.md:
   - Parse "Phase: X of Y" line
   - Parse milestone from ROADMAP.md header

3. Extract key decisions from PROJECT.md:
   - Find "## Key Decisions" or "### Key Decisions" section
   - Extract decision rows (skip header row)
   - Format as bullet list (decision + outcome only)

4. Check if project already in registry (match by path).

5. If exists: Replace existing entry with updated data.

6. If new: Append entry to registry.

7. Update "Last updated" timestamp in registry header.

---

## Archive Project

**Purpose:** Move project from active registry to archive.

**Steps:**

1. Read current project entry from active registry.

2. Calculate duration:
   ```bash
   # Find earliest commit in .planning/
   START_DATE=$(git log --format=%ai --diff-filter=A -- .planning/ | tail -1 | cut -d' ' -f1)
   END_DATE=$(date +%Y-%m-%d)
   ```

3. Format archive entry (see templates/archive.md).

4. Append to archive file (`~/.claude/gsd-archive.md`).

5. Remove entry from active registry.

6. Update timestamps in both files.

---

## Format for Context Injection

**Purpose:** Compact format for injecting into planning context.

**Format:**

```markdown
## Other Active Projects

**{name}** (Phase {X}/{Y}, {milestone})
→ {key decisions as comma-separated list, max 4}
→ Branch: {branch}

**{name2}** (Phase {X}/{Y}, {milestone})
→ {key decisions}
→ Branch: {branch}
```

**Guidelines:**
- Max 3 lines per project
- Key decisions: pick most relevant 3-4, comma-separated
- Skip projects with status: paused (unless explicitly requested)
- If no other projects, omit section entirely

---

## Error Handling

- **Registry file locked:** Wait 1 second, retry once
- **Malformed entry:** Log warning, skip entry, continue
- **Missing .planning/:** Skip registration (not a GSD project)
- **No git repo:** Set branch to "none", worktree to "none"
```

**Step 2: Commit**

```bash
git add get-shit-done/references/registry.md
git commit -m "feat(references): add registry operations reference"
```

---

## Task 4: Update new-project.md — Add Registration

**Files:**
- Modify: `/Users/miguelitodeguzman/Projects/mrm-claude-workflow/commands/mrm/new-project.md`

**Step 1: Read current file to understand structure**

Use Read tool to get full file content.

**Step 2: Add registry reference to execution_context**

Find the `<execution_context>` block and add:

```markdown
@~/.claude/get-shit-done/references/registry.md
```

**Step 3: Add registration step after STATE.md creation**

Find where STATE.md is created (end of roadmap phase). Add new step after it:

```markdown
## Phase 7: Register Project

**Register project in global registry:**

Follow the "Write Project Entry" process from registry.md reference:

1. Gather metadata (path, name, type, branch, worktree)
2. Extract current position (Phase 1 of N, milestone name)
3. Extract key decisions from PROJECT.md
4. Write entry to `~/.claude/gsd-active-projects.md`

This enables other GSD projects to see this project during their planning.
```

**Step 4: Add cross-project context display in questioning phase**

Find Phase 3 (Deep Questioning). Before the first question, add:

```markdown
**Check for other active projects:**

Follow "Read Registry" from registry.md reference. If other active projects exist, display:

```
## Context: Other Active Projects

{Formatted list from registry - see "Format for Context Injection"}

These projects may inform architectural decisions for this new project.
```

If no other projects, skip this display.
```

**Step 5: Commit**

```bash
git add commands/mrm/new-project.md
git commit -m "feat(new-project): add global registry registration and cross-project context"
```

---

## Task 5: Update progress.md — Add Registration Check

**Files:**
- Modify: `/Users/miguelitodeguzman/Projects/mrm-claude-workflow/commands/mrm/progress.md`

**Step 1: Read current file**

Use Read tool to get full content.

**Step 2: Add registry reference to execution_context**

Add after the YAML frontmatter, create execution_context if not present:

```markdown
<execution_context>
@~/.claude/get-shit-done/references/registry.md
</execution_context>
```

**Step 3: Add registration check in load step**

Find `<step name="load">`. Add at the end of the step:

```markdown
**Check global registry registration:**

```bash
REGISTRY_FILE="$HOME/.claude/gsd-active-projects.md"
CURRENT_PATH=$(pwd)

if [ -f "$REGISTRY_FILE" ]; then
  grep -q "Path:.*$CURRENT_PATH" "$REGISTRY_FILE" && echo "registered" || echo "not_registered"
else
  echo "no_registry"
fi
```

If "not_registered" or "no_registry":
- Follow "Write Project Entry" from registry.md reference
- Silently register project (no user notification needed)

If "registered":
- Follow "Write Project Entry" to update phase/branch/timestamp
```

**Step 4: Commit**

```bash
git add commands/mrm/progress.md
git commit -m "feat(progress): add automatic registry registration on project entry"
```

---

## Task 6: Update complete-milestone.md — Add Archive Prompt

**Files:**
- Modify: `/Users/miguelitodeguzman/Projects/mrm-claude-workflow/commands/mrm/complete-milestone.md`

**Step 1: Read current file**

Use Read tool.

**Step 2: Add registry reference**

Add to execution_context:

```markdown
@~/.claude/get-shit-done/references/registry.md
```

**Step 3: Add archive prompt after step 7 (commit and tag)**

Find step 7 or 8 (the final steps). Add new step before "Offer next steps":

```markdown
## Step 8: Project Status Decision

**Prompt user about project future:**

Use AskUserQuestion:
- header: "Project Status"
- question: "What's next for this project?"
- options:
  - "Start next milestone" — Continue development with new milestone (stay registered)
  - "Archive project" — Project is complete, remove from active registry
  - "Pause indefinitely" — Keep registered but mark as paused

**If "Start next milestone":**
- Update registry entry with new milestone info
- Proceed to offer `/mrm:new-milestone`

**If "Archive project":**
- Follow "Archive Project" from registry.md reference
- Move entry from active to archive file
- Update PROJECT.md status to "archived"
- Inform user: "Project archived. It will no longer appear in cross-project context."

**If "Pause indefinitely":**
- Update registry entry: set status to "paused"
- Paused projects won't appear in planning context but remain registered
- Inform user: "Project paused. Run `/mrm:progress` to resume."
```

**Step 4: Update success_criteria**

Add:

```markdown
- Project status decided (continue/archive/pause)
- Registry updated appropriately
```

**Step 5: Commit**

```bash
git add commands/mrm/complete-milestone.md
git commit -m "feat(complete-milestone): add project archive/pause decision and registry update"
```

---

## Task 7: Update plan-phase.md — Add Context Injection

**Files:**
- Modify: `/Users/miguelitodeguzman/Projects/mrm-claude-workflow/commands/mrm/plan-phase.md`

**Step 1: Read current file**

Use Read tool.

**Step 2: Add registry reference**

Add to execution_context:

```markdown
@~/.claude/get-shit-done/references/registry.md
```

**Step 3: Add context injection before planner agent spawn**

Find where mrm-planner agent is spawned (likely in a Task call). Before spawning, add:

```markdown
## 4.5: Load Cross-Project Context

**Before spawning planner, gather cross-project awareness:**

Follow "Read Registry" from registry.md reference:
1. Load `~/.claude/gsd-active-projects.md`
2. Filter out current project
3. Filter out paused projects
4. Format using "Format for Context Injection"

**If other active projects exist:**

Include in planner agent prompt:

```markdown
## Cross-Project Context

The following projects are actively being developed. Consider consistency with their architectural decisions where relevant.

{Formatted project list}
```

**If no other active projects:**

Skip this section in planner prompt.
```

**Step 4: Commit**

```bash
git add commands/mrm/plan-phase.md
git commit -m "feat(plan-phase): inject cross-project context into planner agent"
```

---

## Task 8: Update discuss-phase.md — Add Context Injection

**Files:**
- Modify: `/Users/miguelitodeguzman/Projects/mrm-claude-workflow/commands/mrm/discuss-phase.md`

**Step 1: Read current file**

Use Read tool.

**Step 2: Add registry reference**

Add to execution_context:

```markdown
@~/.claude/get-shit-done/references/registry.md
```

**Step 3: Add context display at discussion start**

Find the beginning of the discussion process. Add:

```markdown
## 1.5: Display Cross-Project Context

**Show other active projects to inform discussion:**

Follow "Read Registry" from registry.md reference.

**If other active projects exist:**

Display before starting questions:

```
## Active Projects Context

{Formatted project list - see "Format for Context Injection"}

Consider how this phase relates to or depends on these projects.
```

**If no other projects:** Skip this display.
```

**Step 4: Commit**

```bash
git add commands/mrm/discuss-phase.md
git commit -m "feat(discuss-phase): show cross-project context during phase discussion"
```

---

## Task 9: Update state.md Template — Add Optional Global Context Section

**Files:**
- Modify: `/Users/miguelitodeguzman/Projects/mrm-claude-workflow/get-shit-done/templates/state.md`

**Step 1: Read current file**

Use Read tool.

**Step 2: Add optional section to template**

Find the `## File Template` section. Add after "Session Continuity":

```markdown
## Global Context (Optional)

*This section is auto-populated when other GSD projects are active.*

See: ~/.claude/gsd-active-projects.md

Active sibling projects: [count]
- [Project 1]: Phase X/Y, [key focus]
- [Project 2]: Phase X/Y, [key focus]

*Updated on /mrm:progress*
```

**Step 3: Add guidelines for this section**

Add to the `<sections>` block:

```markdown
### Global Context (Optional)
Shows other active GSD projects for awareness:
- Only present if other projects exist
- Updated on /mrm:progress
- Provides at-a-glance cross-project visibility
- Full details in ~/.claude/gsd-active-projects.md
```

**Step 4: Commit**

```bash
git add get-shit-done/templates/state.md
git commit -m "feat(templates): add optional global context section to state template"
```

---

## Task 10: Add project_type to config.json Template

**Files:**
- Modify: `/Users/miguelitodeguzman/Projects/mrm-claude-workflow/get-shit-done/templates/config.json`

**Step 1: Read current file**

Use Read tool.

**Step 2: Add project_type field**

Find the config structure. Add field:

```json
{
  "project_type": "unknown",
  ...
}
```

**Step 3: Add comment/documentation**

If the template has documentation, add:

```markdown
- `project_type`: Type of project (e.g., "web-erp-backend", "mobile-app", "nextjs-frontend"). Used for cross-project context in global registry.
```

**Step 4: Commit**

```bash
git add get-shit-done/templates/config.json
git commit -m "feat(templates): add project_type field to config for registry"
```

---

## Task 11: Integration Test — Manual Verification

**Files:**
- Test in: A test project directory

**Step 1: Create test scenario**

```bash
# Create two test projects
mkdir -p ~/test-gsd-registry/project-a
mkdir -p ~/test-gsd-registry/project-b
```

**Step 2: Initialize first project**

```bash
cd ~/test-gsd-registry/project-a
# Run /mrm:new-project
# Verify ~/.claude/gsd-active-projects.md is created
# Verify project-a entry exists
```

**Step 3: Initialize second project**

```bash
cd ~/test-gsd-registry/project-b
# Run /mrm:new-project
# Verify project-a appears in "Other Active Projects" during questioning
# Verify project-b entry added to registry
```

**Step 4: Test progress registration**

```bash
cd ~/test-gsd-registry/project-a
# Run /mrm:progress
# Verify entry is updated (timestamp, phase if changed)
```

**Step 5: Test planning context injection**

```bash
cd ~/test-gsd-registry/project-a
# Run /mrm:plan-phase 1
# Verify project-b context is shown to planner
```

**Step 6: Test archive flow**

```bash
# Complete project-b milestone
# Choose "Archive project"
# Verify project-b removed from active registry
# Verify project-b added to archive file
```

**Step 7: Cleanup**

```bash
rm -rf ~/test-gsd-registry
```

**Step 8: Document results**

Note any issues found during testing for follow-up fixes.

---

## Summary

| Task | Files | Purpose |
|------|-------|---------|
| 1 | templates/active-projects.md | Registry file template |
| 2 | templates/archive.md | Archive file template |
| 3 | references/registry.md | Shared registry operations |
| 4 | commands/mrm/new-project.md | Registration + context display |
| 5 | commands/mrm/progress.md | Auto-registration check |
| 6 | commands/mrm/complete-milestone.md | Archive prompt |
| 7 | commands/mrm/plan-phase.md | Context injection |
| 8 | commands/mrm/discuss-phase.md | Context display |
| 9 | templates/state.md | Optional global context section |
| 10 | templates/config.json | project_type field |
| 11 | Manual testing | Integration verification |

**Total commits:** 10 feature commits + any test fixes
