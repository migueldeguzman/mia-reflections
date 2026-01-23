# Multi-Codebase Workspace Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add hub-and-spoke workspace support to GSD so features can be planned centrally and executed across multiple codebases.

**Architecture:** Workspace configuration in hub's `.planning/workspace.json` defines spoke repositories. Requirements and roadmap phases get codebase tags. Execution resolves target paths and operates in the correct repository.

**Tech Stack:** Markdown templates, JSON config, Bash for path resolution, existing GSD workflow structure.

---

## Task 1: Create workspace.json Template

**Files:**
- Create: `~/.claude/get-shit-done/templates/workspace.json`

**Step 1: Write the template file**

```json
{
  "$schema": "workspace-schema",
  "hub": true,
  "name": "workspace-name",
  "spokes": [
    {
      "name": "spoke-name",
      "path": "../relative/path",
      "type": "mobile-app|web-app|backend|library"
    }
  ]
}
```

**Step 2: Verify file created**

Run: `cat ~/.claude/get-shit-done/templates/workspace.json`
Expected: File contents displayed

**Step 3: Commit**

```bash
cd ~/.claude/get-shit-done
git add templates/workspace.json
git commit -m "feat: add workspace.json template for multi-codebase support"
```

---

## Task 2: Update config.json Template with Workspace Section

**Files:**
- Modify: `~/.claude/get-shit-done/templates/config.json`

**Step 1: Read current config template**

Run: `cat ~/.claude/get-shit-done/templates/config.json`

**Step 2: Add workspace section to config template**

Add after the existing sections:

```json
{
  "mode": "interactive",
  "depth": "standard",
  "workflow": { ... },
  "planning": { ... },
  "parallelization": { ... },
  "gates": { ... },
  "safety": { ... },
  "workspace": {
    "enabled": false,
    "config_path": ".planning/workspace.json"
  }
}
```

**Step 3: Verify changes**

Run: `cat ~/.claude/get-shit-done/templates/config.json | grep -A3 workspace`
Expected: workspace section visible

**Step 4: Commit**

```bash
cd ~/.claude/get-shit-done
git add templates/config.json
git commit -m "feat: add workspace section to config template"
```

---

## Task 3: Update Requirements Template with Codebase Tags

**Files:**
- Modify: `~/.claude/get-shit-done/templates/requirements.md`

**Step 1: Read current requirements template**

Run: `cat ~/.claude/get-shit-done/templates/requirements.md`

**Step 2: Update requirement format to include codebase tag**

Change the requirement format from:
```markdown
- [ ] **AUTH-01**: User can sign up with email and password
```

To:
```markdown
- [ ] **AUTH-01** `[hub]`: User can sign up with email and password
```

Add guidelines section explaining:
- `[hub]` — affects hub codebase only
- `[spoke-name]` — affects specific spoke
- `[hub, spoke-name]` — affects multiple codebases
- Tag is optional for single-codebase projects

**Step 3: Add coverage by codebase section to traceability**

```markdown
**Coverage by codebase:**
- hub: X requirements
- spoke-1: Y requirements
- spoke-2: Z requirements
```

**Step 4: Verify changes**

Run: `grep -A5 "Coverage by codebase" ~/.claude/get-shit-done/templates/requirements.md`
Expected: Coverage section visible

**Step 5: Commit**

```bash
cd ~/.claude/get-shit-done
git add templates/requirements.md
git commit -m "feat: add codebase tags to requirements template"
```

---

## Task 4: Update Roadmap Template with Target Field

**Files:**
- Modify: `~/.claude/get-shit-done/templates/roadmap.md`

**Step 1: Read current roadmap template**

Run: `cat ~/.claude/get-shit-done/templates/roadmap.md`

**Step 2: Add Target field to phase details**

Update phase detail template from:
```markdown
### Phase 1: [Name]
**Goal**: [What this phase delivers]
**Depends on**: Nothing (first phase)
**Requirements**: [REQ-01, REQ-02, REQ-03]
```

To:
```markdown
### Phase 1: [Name]
**Target**: `[hub]` or `[spoke-name]` or `[all]`
**Goal**: [What this phase delivers]
**Depends on**: Nothing (first phase)
**Blocks**: [Phase numbers this blocks, if any]
**Requirements**: [REQ-01, REQ-02, REQ-03]
```

**Step 3: Add guidelines for Target field**

Add to guidelines section:
```markdown
**Target field (workspace mode):**
- `[hub]` — Phase executes in hub codebase
- `[spoke-name]` — Phase executes in named spoke
- `[all]` — Phase involves all codebases (e.g., integration testing)
- Omit Target for single-codebase projects

**Blocks/Blocked by (workspace mode):**
- Use for cross-codebase dependencies
- API phases typically block consumer phases
- Integration phases blocked by all component phases
```

**Step 4: Verify changes**

Run: `grep -B2 -A2 "Target" ~/.claude/get-shit-done/templates/roadmap.md | head -20`
Expected: Target field visible in template

**Step 5: Commit**

```bash
cd ~/.claude/get-shit-done
git add templates/roadmap.md
git commit -m "feat: add target and blocks fields to roadmap template"
```

---

## Task 5: Update State Template with Workspace Status

**Files:**
- Modify: `~/.claude/get-shit-done/templates/state.md`

**Step 1: Read current state template**

Run: `cat ~/.claude/get-shit-done/templates/state.md`

**Step 2: Add workspace status section**

Add after Current Position section:
```markdown
## Workspace Status

<!-- Only present in workspace mode -->

| Codebase | Current Phase | Status | Progress |
|----------|---------------|--------|----------|
| hub | Phase 1 | Complete | 100% |
| spoke-1 | Phase 2 | In Progress | 33% |
| spoke-2 | Phase 3 | Pending | 0% |

**Overall:** Phase 2-3 of 4 | 45% complete
```

**Step 3: Add guidelines for workspace status**

Add to guidelines:
```markdown
### Workspace Status (workspace mode only)
- Shows progress per codebase
- Current phase indicates what's active in each repo
- Overall progress aggregates all codebase progress
- Updated after each phase completes
```

**Step 4: Verify changes**

Run: `grep -A10 "Workspace Status" ~/.claude/get-shit-done/templates/state.md`
Expected: Workspace status section visible

**Step 5: Commit**

```bash
cd ~/.claude/get-shit-done
git add templates/state.md
git commit -m "feat: add workspace status section to state template"
```

---

## Task 6: Create Spoke Codebase Directory Structure

**Files:**
- Create: `~/.claude/get-shit-done/templates/codebase-spoke/` directory
- Create: `~/.claude/get-shit-done/templates/codebase-spoke/README.md`

**Step 1: Create spoke templates directory**

```bash
mkdir -p ~/.claude/get-shit-done/templates/codebase-spoke
```

**Step 2: Create README explaining spoke structure**

```markdown
# Spoke Codebase Templates

When mapping spoke codebases in workspace mode, analysis is stored at:
`.planning/spokes/{spoke-name}/`

Each spoke gets the same documents as the hub:
- STACK.md
- ARCHITECTURE.md
- STRUCTURE.md
- CONVENTIONS.md
- TESTING.md
- INTEGRATIONS.md
- CONCERNS.md

These use the same templates as `.planning/codebase/` but are scoped to the spoke.
```

**Step 3: Verify structure created**

Run: `ls -la ~/.claude/get-shit-done/templates/codebase-spoke/`
Expected: README.md visible

**Step 4: Commit**

```bash
cd ~/.claude/get-shit-done
git add templates/codebase-spoke/
git commit -m "feat: add spoke codebase template directory"
```

---

## Task 7: Update map-codebase Workflow for Workspace Support

**Files:**
- Modify: `~/.claude/get-shit-done/workflows/map-codebase.md`

**Step 1: Read current workflow**

Run: `cat ~/.claude/get-shit-done/workflows/map-codebase.md`

**Step 2: Add workspace detection step after check_existing**

Add new step:
```markdown
<step name="detect_workspace">
Check if workspace mode is enabled:

```bash
# Check for workspace config
WORKSPACE_ENABLED=$(cat .planning/config.json 2>/dev/null | grep -o '"workspace"' | head -1)
WORKSPACE_FILE=$(cat .planning/workspace.json 2>/dev/null)

if [ -n "$WORKSPACE_FILE" ]; then
  echo "Workspace mode detected"
  # Extract spoke names
  SPOKES=$(echo "$WORKSPACE_FILE" | grep '"name"' | cut -d'"' -f4)
fi
```

**If workspace.json exists:**
```
Workspace detected with spokes:
[List spoke names]

What to map?
1. Hub only — Map this codebase
2. All — Map hub + all spokes
3. Specific spoke — Map one spoke
```

Wait for user response and set MAP_TARGET accordingly.

**If no workspace:** Continue with single-codebase behavior.
</step>
```

**Step 3: Add spoke mapping step**

Add new step for spoke mapping:
```markdown
<step name="map_spoke">
When mapping a spoke:

1. Resolve spoke path from workspace.json
2. Verify path exists and contains code
3. Create .planning/spokes/{spoke-name}/ directory
4. Spawn mapper agents with spoke context
5. Agents write to .planning/spokes/{spoke-name}/ instead of .planning/codebase/

```bash
# Resolve spoke path
SPOKE_PATH=$(cat .planning/workspace.json | grep -A2 "\"name\": \"$SPOKE_NAME\"" | grep "path" | cut -d'"' -f4)
RESOLVED_PATH=$(cd "$SPOKE_PATH" && pwd)

# Verify spoke exists
if [ ! -d "$RESOLVED_PATH" ]; then
  echo "ERROR: Spoke path not found: $SPOKE_PATH"
  exit 1
fi

# Create spoke analysis directory
mkdir -p ".planning/spokes/$SPOKE_NAME"
```

Mapper agents receive additional context:
- `spoke_name`: Name of the spoke being mapped
- `spoke_path`: Resolved absolute path
- `output_dir`: `.planning/spokes/{spoke-name}/`
</step>
```

**Step 4: Update spawn_agents step to handle spoke context**

Modify agent prompts to include:
```markdown
**For spoke mapping, add to each agent prompt:**

```
Mapping: {hub | spoke: {spoke_name}}
Working directory: {resolved_path}
Output directory: {output_dir}

If mapping a spoke, analyze code at the working directory.
Write documents to the output directory.
```
```

**Step 5: Update offer_next for workspace context**

```markdown
**If workspace mode and mapped spoke:**
```
Spoke '{spoke-name}' mapping complete.

Created .planning/spokes/{spoke-name}/:
[list files]

---

## ▶ Next Up

**Map another spoke** or **Continue with planning**

`/mrm:map-codebase --spoke {next-spoke}`
`/mrm:new-project` (if all spokes mapped)
```
```

**Step 6: Verify changes**

Run: `grep -c "workspace" ~/.claude/get-shit-done/workflows/map-codebase.md`
Expected: Multiple matches

**Step 7: Commit**

```bash
cd ~/.claude/get-shit-done
git add workflows/map-codebase.md
git commit -m "feat: add workspace and spoke mapping support to map-codebase"
```

---

## Task 8: Update execute-phase Workflow for Cross-Codebase Execution

**Files:**
- Modify: `~/.claude/get-shit-done/workflows/execute-phase.md`

**Step 1: Read current workflow**

Run: `cat ~/.claude/get-shit-done/workflows/execute-phase.md`

**Step 2: Add workspace resolution step after load_project_state**

Add new step:
```markdown
<step name="resolve_workspace">
If workspace mode is enabled, resolve target codebase for this phase.

```bash
# Check for workspace
if [ -f .planning/workspace.json ]; then
  WORKSPACE_MODE=true

  # Get phase target from ROADMAP.md
  PHASE_TARGET=$(grep -A5 "### Phase ${PHASE}:" .planning/ROADMAP.md | grep "Target:" | sed 's/.*`\[\(.*\)\]`.*/\1/')

  if [ -z "$PHASE_TARGET" ]; then
    PHASE_TARGET="hub"
  fi

  # Resolve path for spoke targets
  if [ "$PHASE_TARGET" != "hub" ] && [ "$PHASE_TARGET" != "all" ]; then
    SPOKE_PATH=$(cat .planning/workspace.json | grep -A2 "\"name\": \"$PHASE_TARGET\"" | grep "path" | cut -d'"' -f4)
    TARGET_DIR=$(cd "$SPOKE_PATH" 2>/dev/null && pwd)

    if [ -z "$TARGET_DIR" ]; then
      echo "ERROR: Cannot resolve spoke path for target: $PHASE_TARGET"
      exit 1
    fi
  else
    TARGET_DIR=$(pwd)
  fi
else
  WORKSPACE_MODE=false
  TARGET_DIR=$(pwd)
fi
```

Store:
- `WORKSPACE_MODE`: true/false
- `PHASE_TARGET`: hub, spoke-name, or all
- `TARGET_DIR`: Absolute path to execute in

Report if workspace mode:
```
Phase {X} targets: {PHASE_TARGET}
Execution directory: {TARGET_DIR}
```
</step>
```

**Step 3: Update execute_waves step to change directory**

Modify the agent spawning to include target directory:
```markdown
Before spawning agents, change to target directory:

```bash
# Save hub directory
HUB_DIR=$(pwd)

# Change to target for execution
cd "$TARGET_DIR"

# Spawn agents (they execute in target dir)
# ...

# Return to hub after wave completes
cd "$HUB_DIR"
```

Agent prompt additions for workspace mode:
```
Workspace mode: {WORKSPACE_MODE}
Target codebase: {PHASE_TARGET}
Execution directory: {TARGET_DIR}
Hub directory: {HUB_DIR}

Execute all file operations in {TARGET_DIR}.
Commit in the target repository.
State updates go to {HUB_DIR}/.planning/STATE.md
```
```

**Step 4: Update commit handling for spoke repos**

```markdown
**Git commits in workspace mode:**

When executing in a spoke:
1. Code commits happen in spoke repo (TARGET_DIR)
2. Planning doc updates happen in hub repo (HUB_DIR)

```bash
# After task completion in spoke
cd "$TARGET_DIR"
git add [changed files]
git commit -m "feat: ..."

# After all tasks, update planning state in hub
cd "$HUB_DIR"
git add .planning/STATE.md
git commit -m "docs: update state after phase {X} execution"
```
```

**Step 5: Update aggregate_results for workspace context**

```markdown
## Phase {X}: {Name} Execution Complete

**Target:** {PHASE_TARGET}
**Repository:** {TARGET_DIR}
**Waves executed:** {N}
**Plans completed:** {M} of {total}
```

**Step 6: Verify changes**

Run: `grep -c "TARGET_DIR\|WORKSPACE_MODE\|SPOKE" ~/.claude/get-shit-done/workflows/execute-phase.md`
Expected: Multiple matches

**Step 7: Commit**

```bash
cd ~/.claude/get-shit-done
git add workflows/execute-phase.md
git commit -m "feat: add cross-codebase execution support to execute-phase"
```

---

## Task 9: Update Plan Template with Target Field

**Files:**
- Modify: `~/.claude/get-shit-done/templates/phase-prompt.md`

**Step 1: Read current template**

Run: `cat ~/.claude/get-shit-done/templates/phase-prompt.md | head -100`

**Step 2: Add target field to plan frontmatter**

Update frontmatter section to include:
```yaml
---
phase: 2
plan: 1
wave: 1
target: spoke-name  # NEW: which codebase this plan modifies
depends_on: []
files_modified:
  - src/screens/BookingScreen.tsx
autonomous: true
---
```

**Step 3: Add target field guidelines**

```markdown
**target field (workspace mode):**
- Specifies which codebase this plan modifies
- Inherited from phase target by default
- Can be overridden for specific plans
- Execution uses this to resolve working directory
```

**Step 4: Verify changes**

Run: `grep -A10 "frontmatter" ~/.claude/get-shit-done/templates/phase-prompt.md | head -15`
Expected: target field visible

**Step 5: Commit**

```bash
cd ~/.claude/get-shit-done
git add templates/phase-prompt.md
git commit -m "feat: add target field to plan frontmatter"
```

---

## Task 10: Create Workspace Setup Questions for new-project

**Files:**
- Create: `~/.claude/get-shit-done/templates/workspace-setup.md`

**Step 1: Create workspace setup template**

```markdown
# Workspace Setup Template

Questions to ask during /mrm:new-project when setting up a workspace.

## Detection

If existing code detected in sibling directories, offer workspace setup:

```
I notice there are multiple project directories here:
- web-erp-app/ (current)
- rent-a-car-mobile/
- service-center-mobile/
- showroom-mobile/

Is this a workspace where features span multiple codebases?
```

## Configuration Questions

**Question 1: Hub confirmation**
```
Is this codebase ({current_dir}) the planning hub?
- Yes, planning lives here
- No, planning should live elsewhere
```

**Question 2: Spoke identification**
```
Which directories are part of this workspace?
[Multi-select from detected directories]
```

**Question 3: Spoke types**
For each selected spoke:
```
What type of codebase is {spoke_name}?
- mobile-app
- web-app
- backend
- library
- other
```

## Generated workspace.json

After questions, generate:
```json
{
  "hub": true,
  "name": "{project_name}",
  "spokes": [
    {
      "name": "rent-a-car-mobile",
      "path": "../rent-a-car-mobile",
      "type": "mobile-app"
    }
  ]
}
```

## Offer Spoke Mapping

After workspace.json created:
```
Workspace configured with {N} spokes.

Map spoke codebases now? This helps planning understand each codebase.
- Yes, map all spokes
- Yes, map specific spokes
- No, skip for now (can run /mrm:map-codebase --all later)
```
```

**Step 2: Verify file created**

Run: `cat ~/.claude/get-shit-done/templates/workspace-setup.md | head -30`
Expected: Template content visible

**Step 3: Commit**

```bash
cd ~/.claude/get-shit-done
git add templates/workspace-setup.md
git commit -m "feat: add workspace setup template for new-project"
```

---

## Task 11: Integration Test - Verify All Templates Parse

**Files:**
- None (verification only)

**Step 1: Verify all modified templates are valid**

```bash
cd ~/.claude/get-shit-done

# Check JSON templates are valid
cat templates/config.json | python3 -m json.tool > /dev/null && echo "config.json: valid"
cat templates/workspace.json | python3 -m json.tool > /dev/null && echo "workspace.json: valid"

# Check markdown templates exist and have content
for f in templates/requirements.md templates/roadmap.md templates/state.md; do
  [ -s "$f" ] && echo "$f: has content" || echo "$f: EMPTY"
done

# Check workflows exist
for f in workflows/map-codebase.md workflows/execute-phase.md; do
  [ -s "$f" ] && echo "$f: has content" || echo "$f: EMPTY"
done
```

Expected: All files valid and have content

**Step 2: Verify new workspace keywords present**

```bash
cd ~/.claude/get-shit-done

echo "=== Workspace keywords in templates ==="
grep -l "workspace\|spoke\|hub\|Target:" templates/*.md templates/*.json 2>/dev/null

echo "=== Workspace keywords in workflows ==="
grep -l "WORKSPACE_MODE\|TARGET_DIR\|spoke" workflows/*.md 2>/dev/null
```

Expected: Multiple files listed

**Step 3: Create final summary commit**

```bash
cd ~/.claude/get-shit-done
git log --oneline -10
```

Verify all commits from this implementation are present.

---

## Summary

**Templates modified:**
- `templates/config.json` — Added workspace section
- `templates/requirements.md` — Added codebase tags
- `templates/roadmap.md` — Added Target and Blocks fields
- `templates/state.md` — Added workspace status section
- `templates/phase-prompt.md` — Added target to frontmatter

**Templates created:**
- `templates/workspace.json` — Workspace configuration
- `templates/workspace-setup.md` — Setup questions
- `templates/codebase-spoke/README.md` — Spoke structure docs

**Workflows modified:**
- `workflows/map-codebase.md` — Spoke mapping support
- `workflows/execute-phase.md` — Cross-codebase execution

**Not modified (future work):**
- `workflows/new-project.md` — Needs workspace setup flow integration (skill file, not in templates)
- `workflows/verify-phase.md` — May need workspace awareness
- Progress display commands — Need workspace status display
