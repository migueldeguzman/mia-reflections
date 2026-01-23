# Multi-Codebase Workspace Design for GSD

**Date:** 2026-01-23
**Status:** Approved
**Affects:** mrm-claude-workflow (GSD)

## Problem

GSD currently assumes one `.planning/` directory per codebase. Real-world projects often require coordinated feature development across multiple repositories:

- Backend API + Mobile apps + Web apps
- Changes need to be brainstormed, planned, and executed together
- Dependencies between codebases (API must ship before consumers)

## Solution: Hub-and-Spoke Workspace Model

One codebase acts as the "hub" where all planning lives. Other codebases are "spokes" that receive distributed work.

```
web-erp-app/                    <- Hub (planning lives here)
├── .planning/
│   ├── PROJECT.md
│   ├── workspace.json          <- NEW: defines spokes
│   ├── REQUIREMENTS.md         <- Tags indicate target codebase(s)
│   ├── ROADMAP.md              <- Phases target specific codebases
│   ├── codebase/               <- Hub's codebase analysis
│   └── spokes/                 <- NEW: spoke codebase analyses
│       ├── rent-a-car-mobile/
│       └── service-center-mobile/
└── src/

rent-a-car-mobile/              <- Spoke (receives work)
└── src/

service-center-mobile/          <- Spoke (receives work)
└── src/
```

## Design Details

### 1. Workspace Configuration

File: `.planning/workspace.json`

```json
{
  "hub": true,
  "spokes": [
    {
      "name": "rent-a-car-mobile",
      "path": "../rent-a-car-mobile",
      "type": "mobile-app"
    },
    {
      "name": "service-center-mobile",
      "path": "../service-center-mobile",
      "type": "mobile-app"
    },
    {
      "name": "showroom-mobile",
      "path": "../showroom-mobile",
      "type": "mobile-app"
    }
  ]
}
```

- `hub: true` marks this as the planning hub
- `path` is relative (portable when repos move together)
- `type` informs planning context (mobile vs web vs backend)

### 2. Requirements with Codebase Tags

Each requirement indicates which codebase(s) it affects:

```markdown
## v1 Requirements

### Booking
- [ ] **BOOK-01** `[web-erp]`: Admin can create booking slots
- [ ] **BOOK-02** `[web-erp]`: API endpoint for available slots
- [ ] **BOOK-03** `[rent-a-car-mobile]`: Customer can view available slots
- [ ] **BOOK-04** `[rent-a-car-mobile]`: Customer can book a slot
- [ ] **BOOK-05** `[service-center-mobile]`: Technician sees their bookings

### Notifications
- [ ] **NOTF-01** `[web-erp]`: Backend sends push notification
- [ ] **NOTF-02** `[rent-a-car-mobile, service-center-mobile]`: Apps receive notifications
```

Tag formats:
- `[web-erp]` — single codebase
- `[rent-a-car-mobile, service-center-mobile]` — multiple codebases

Traceability tracks coverage per codebase:
```markdown
**Coverage by codebase:**
- web-erp: 8 requirements
- rent-a-car-mobile: 5 requirements
- service-center-mobile: 3 requirements
```

### 3. Roadmap with Cross-Codebase Phases

Phases specify their target codebase and dependencies:

```markdown
## Phase 1: Backend API
**Target:** `web-erp`
**Goal:** Booking API endpoints ready for consumption
**Requirements:** BOOK-01, BOOK-02, NOTF-01
**Blocks:** Phase 2, Phase 3

## Phase 2: Customer Mobile
**Target:** `rent-a-car-mobile`
**Goal:** Customers can book vehicles
**Requirements:** BOOK-03, BOOK-04, NOTF-02 (partial)
**Blocked by:** Phase 1

## Phase 3: Technician Mobile
**Target:** `service-center-mobile`
**Goal:** Technicians see their schedule
**Requirements:** BOOK-05, NOTF-02 (partial)
**Blocked by:** Phase 1

## Phase 4: Integration Testing
**Target:** `[all]`
**Goal:** End-to-end flow works across all apps
**Blocked by:** Phase 2, Phase 3
```

Dependency graph:
```
Phase 1 (web-erp)
    ├──> Phase 2 (rent-a-car-mobile)  ──┐
    │                                    ├──> Phase 4 (all)
    └──> Phase 3 (service-center-mobile)─┘
```

Phases 2 & 3 can execute in parallel once Phase 1 completes.

### 4. Plans with Target Codebase

Plan frontmatter includes target:

```yaml
---
phase: 2
wave: 1
target: rent-a-car-mobile
files_modified:
  - src/screens/BookingScreen.tsx
  - src/api/bookings.ts
---
```

Plans are stored in the hub but specify which spoke they modify.

### 5. Cross-Codebase Execution

When executing a phase:

1. Read roadmap → get target codebase
2. Resolve path from workspace.json
3. Read plans from hub's `.planning/phases/`
4. Change to spoke directory
5. Execute plans, create/modify files
6. Run tests in spoke
7. Commit in spoke repository
8. Return to hub, update STATE.md

State tracking shows workspace-wide progress:
```markdown
## Workspace Status

| Codebase | Current Phase | Progress |
|----------|---------------|----------|
| web-erp (hub) | Phase 1 | 100% |
| rent-a-car-mobile | Phase 2 | 33% |
| service-center-mobile | Phase 3 | 0% |
```

## Command Changes

### `/mrm:new-project`

After PROJECT.md creation, ask:
```
Is this a hub for multiple codebases?
- Yes, configure spokes → creates workspace.json
- No, single codebase → current behavior
```

### `/mrm:map-codebase`

New flags for workspace support:
```
/mrm:map-codebase              → Map hub only
/mrm:map-codebase --all        → Map hub + all spokes
/mrm:map-codebase --spoke NAME → Map specific spoke
```

Spoke analyses stored in `.planning/spokes/{name}/`.

### `/mrm:plan-phase`

- Read spoke's codebase map for context when planning spoke phases
- Plans include `target:` in frontmatter
- Planner aware of cross-codebase dependencies

### `/mrm:execute-phase`

- Resolve target codebase from roadmap
- Change to spoke directory before execution
- Commit in spoke repository
- Return to hub, update central state

### `/mrm:progress`

Shows workspace-wide status:
```
## Workspace: Vehicle Management System

| Codebase | Phase | Status | Progress |
|----------|-------|--------|----------|
| web-erp (hub) | 1 | Complete | 100% |
| rent-a-car-mobile | 2 | In Progress | 33% |
| service-center-mobile | 3 | Pending | 0% |

Overall: Phase 2-3 of 4 | 45% complete
```

## Files to Modify

1. **workflows/map-codebase.md** — Add `--all` and `--spoke` flags, spoke directory structure
2. **templates/workspace.json** — New template for workspace configuration
3. **templates/requirements.md** — Add codebase tag syntax and coverage tracking
4. **templates/roadmap.md** — Add target and dependency fields
5. **templates/plan.md** — Add target field to frontmatter
6. **templates/state.md** — Add workspace status section
7. **workflows/new-project.md** — Add workspace setup flow (mrm:new-project skill)
8. **workflows/execute-phase.md** — Add cross-codebase execution logic

## Migration

Existing single-codebase projects continue to work unchanged:
- No `workspace.json` = single codebase mode
- All current behavior preserved
- Workspace features are additive

## Success Criteria

- [ ] Single-codebase projects work exactly as before
- [ ] Hub can register multiple spokes via workspace.json
- [ ] Requirements can be tagged with target codebase(s)
- [ ] Roadmap phases can target specific codebases
- [ ] Cross-phase dependencies across codebases are respected
- [ ] Execution happens in the correct repository
- [ ] Commits land in the target repository
- [ ] State tracking shows workspace-wide progress
- [ ] Codebase mapping works for hub and spokes
