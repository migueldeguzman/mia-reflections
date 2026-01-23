# GSD Global Project Registry Design

**Date:** 2026-01-23
**Status:** Approved
**Affects:** mrm-claude-workflow (GSD)

## Problem

GSD currently has no awareness of other ongoing projects. Each project operates in isolation, even when multiple related projects are being developed simultaneously. This leads to:

- Inconsistent architectural decisions across projects
- No visibility into what other work is active
- Missed opportunities for pattern reuse
- Potential conflicts when projects share APIs or schemas

## Solution: Global Project Registry

A lightweight synchronization layer that maintains awareness of all active GSD-managed projects, automatically managed through the existing workflow lifecycle.

## Design Details

### 1. Registry Location

**Primary Registry:** `~/.claude/gsd-active-projects.md`
**Archive File:** `~/.claude/gsd-archive.md`

Location rationale:
- `~/.claude/` is already used by Claude Code for settings
- Always accessible regardless of current working directory
- Single source of truth across all projects

### 2. Registry Format

```markdown
# GSD Active Projects Registry

> Auto-managed by mrm-claude-workflow. Do not edit manually.
> Last updated: 2026-01-23T14:32:00Z

## vesla-erp-workspace

- **Path:** /Users/miguelitodeguzman/Projects/tech-project/web-erp-app
- **Type:** web-erp-backend
- **Status:** active
- **Milestone:** v1.0 - Core ERP Features
- **Phase:** 3 of 8
- **Branch:** feature/booking-api
- **Worktree:** /Users/miguelitodeguzman/Projects/worktrees/booking-api

### Key Decisions
- Authentication: JWT with httpOnly cookies
- Database: PostgreSQL with Prisma ORM
- API Style: REST at `/api/v1/*`
- Multi-tenancy: companyId isolation on all queries

---

## client-portal-project

- **Path:** /Users/miguelitodeguzman/Projects/client-portal
- **Type:** nextjs-frontend
- **Status:** active
- **Milestone:** v1.0 - Customer Dashboard
- **Phase:** 1 of 4
- **Branch:** main
- **Worktree:** none

### Key Decisions
- Framework: Next.js 14 with App Router
- State: Zustand + React Query
- Styling: TailwindCSS
- Consumes: vesla-erp-workspace API

---
```

**Content Level:** Identity + Key Decisions + Branch/Worktree
- Project name, path, type
- Current milestone and phase
- Git branch and worktree status
- Key architectural decisions

### 3. Registration Workflow

**Trigger Points:**
- `/mrm:new-project` — Registers immediately after PROJECT.md creation
- `/mrm:progress` — Checks if registered; adds if missing (catches existing projects)

**Registration Process:**

```
┌─────────────────────────────────────────────────────────┐
│  User runs /mrm:new-project or /mrm:progress            │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│  Read ~/.claude/gsd-active-projects.md                  │
│  (Create if doesn't exist)                              │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│  Is current project already registered?                 │
│  (Match by absolute path)                               │
└──────────┬──────────────────────────────┬───────────────┘
           │ NO                           │ YES
           ▼                              ▼
┌─────────────────────┐    ┌──────────────────────────────┐
│  Extract from:      │    │  Update existing entry:      │
│  - PROJECT.md       │    │  - Current phase/milestone   │
│  - .planning/config │    │  - Branch/worktree           │
│  - git status       │    │  - Last activity timestamp   │
└─────────┬───────────┘    └──────────────┬───────────────┘
          │                               │
          ▼                               ▼
┌─────────────────────────────────────────────────────────┐
│  Write updated registry back to file                    │
└─────────────────────────────────────────────────────────┘
```

**Key Decisions Extraction:**

The workflow scans PROJECT.md for the "Key Decisions" table and extracts entries. If no table exists, it prompts for key architectural decisions.

**Git Detection:**

```bash
# Detect current branch
git branch --show-current

# Detect if in a worktree (different from .git means worktree)
git rev-parse --git-common-dir
```

### 4. Deregistration (Archive) Workflow

**Trigger Point:**
- `/mrm:complete-milestone` — After successful milestone completion

**Archive Flow:**

```
┌─────────────────────────────────────────────────────────┐
│  User runs /mrm:complete-milestone                      │
│  (Milestone verified complete, all phases done)         │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│  Prompt: "What's next for this project?"                │
│                                                         │
│  1. Start next milestone (v2, v1.1, etc.)               │
│  2. Archive project - it's complete                     │
│  3. Pause indefinitely - keep registered but inactive   │
└─────────┬───────────────────┬───────────────────────────┘
          │                   │
          │ Option 1          │ Option 2
          ▼                   ▼
┌─────────────────┐  ┌────────────────────────────────────┐
│ Stay registered │  │ Archive process:                   │
│ Update milestone│  │ 1. Set status: archived in PROJECT │
│ info in registry│  │ 2. Remove from gsd-active-projects │
└─────────────────┘  │ 3. Log to ~/.claude/gsd-archive.md │
                     └────────────────────────────────────┘
```

**Archive File Format:**

```markdown
# GSD Archived Projects

## vesla-erp-workspace (archived 2026-03-15)

- **Final Milestone:** v1.0 - Core ERP Features
- **Duration:** 2026-01-10 to 2026-03-15 (64 days)
- **Path:** /Users/miguelitodeguzman/Projects/tech-project/web-erp-app

### Key Decisions (preserved for reference)
- Authentication: JWT with httpOnly cookies
- Database: PostgreSQL with Prisma ORM
...
```

**Pause Option:**

Sets `status: paused` in registry. Project stays visible but marked as inactive. Useful for projects on hold that might resume.

### 5. Context Injection During Planning

**Trigger Points:**
- `/mrm:new-project` — See existing projects before making architectural decisions
- `/mrm:plan-phase` — Understand what other projects are doing/expecting
- `/mrm:discuss-phase` — Inform discussion with broader context

**Injection Process:**

```
┌─────────────────────────────────────────────────────────┐
│  User runs /mrm:plan-phase (or similar)                 │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│  Load ~/.claude/gsd-active-projects.md                  │
│  Filter out current project (don't show self)           │
│  Filter out status: paused (unless explicitly asked)    │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│  Format as compact context block (2-3 lines/project):   │
│                                                         │
│  ## Other Active Projects                               │
│                                                         │
│  **vesla-erp-workspace** (Phase 3/8, v1.0)              │
│  → JWT auth, PostgreSQL/Prisma, REST /api/v1/*          │
│  → Branch: feature/booking-api                          │
│                                                         │
│  **client-portal** (Phase 1/4, v1.0)                    │
│  → Next.js 14, Zustand, consumes vesla-erp API          │
│  → Branch: main                                         │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│  Inject into planner/researcher agent context           │
└─────────────────────────────────────────────────────────┘
```

**Compact Format Rationale:**

To save context space, injection uses ~2-3 lines per project. Full details remain in registry file if deeper inspection needed.

## Implementation

### New Files

| File | Purpose |
|------|---------|
| `get-shit-done/lib/registry.md` | Shared instructions for reading/writing the global registry |
| `get-shit-done/templates/active-projects.md` | Template for `~/.claude/gsd-active-projects.md` |
| `get-shit-done/templates/archive.md` | Template for `~/.claude/gsd-archive.md` |

### Modified Workflows

| File | Changes |
|------|---------|
| `workflows/new-project.md` | Add registration step after PROJECT.md creation |
| `workflows/progress.md` | Add registration check on entry (catch unregistered projects) |
| `workflows/complete-milestone.md` | Add archive prompt and deregistration logic |
| `workflows/plan-phase.md` | Add registry loading and context injection |
| `workflows/discuss-phase.md` | Add registry loading for discussion context |
| `workflows/research-phase.md` | Add registry loading for research awareness |

### Modified Templates

| File | Changes |
|------|---------|
| `templates/project.md` | Add `status: active` field to frontmatter |
| `templates/state.md` | Add optional "Global Context" section |

### Shared Library (lib/registry.md)

Reusable instructions that workflows import:

```markdown
## Registry Operations

### Read Registry
1. Check if ~/.claude/gsd-active-projects.md exists
2. If not, create with empty template
3. Parse markdown sections into project list
4. Return filtered list (exclude current project)

### Write Project Entry
1. Extract: name, path, type, milestone, phase, branch, worktree
2. Extract Key Decisions from PROJECT.md
3. Upsert section in registry file
4. Update "Last updated" timestamp

### Archive Project
1. Move section from active to archive file
2. Add archive date and duration
3. Remove from active registry
```

## Success Criteria

- [ ] Projects auto-register on `/mrm:new-project`
- [ ] Existing projects register on `/mrm:progress` if missing
- [ ] Registry shows branch/worktree status for git repositories
- [ ] Key decisions are captured from PROJECT.md
- [ ] Planning workflows see other active projects in context
- [ ] Archive prompt appears on `/mrm:complete-milestone`
- [ ] Archived projects leave active registry, move to archive
- [ ] Paused projects stay registered but marked inactive
- [ ] No manual register/unregister commands needed

## Workflow Lifecycle

```
  New Project ──► Register ──► Active Development ──► Milestone Complete
                     │                │                      │
                     │                │            ┌─────────┴─────────┐
                     │                │            ▼                   ▼
                     │                │      Next Milestone      Archive Project
                     │                │            │                   │
                     │                ▼            │                   ▼
                     └──────► Update Registry ◄────┘          Remove from Registry
                              (phase, branch)                  (move to archive)
```

## Migration

Existing projects work unchanged:
- No registry file = projects work in isolation (current behavior)
- Registry is created on first `/mrm:new-project` or `/mrm:progress` run
- Existing projects picked up automatically when any GSD command runs

## Future Enhancements

1. **Smart Relevance Filtering** — During planning, prioritize showing projects by type relationship (backend shown when planning frontend that might consume it)

2. **Dependency Detection** — Scan for API endpoint overlaps, shared schema names, potential conflicts

3. **Cross-Project Notifications** — When Project A changes an API, flag Project B that consumes it
