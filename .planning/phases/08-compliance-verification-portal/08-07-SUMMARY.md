---
phase: 08-compliance-verification
plan: 07
subsystem: compliance-portal-api
tags: [rest-api, di-configuration, express-routes, typescript]
completed: 2026-01-25
duration: ~30 minutes

dependency_graph:
  requires:
    - 08-01 (Database schema and types)
    - 08-02 (CompliancePortalService)
    - 08-03 (ComplianceChecklistService)
    - 08-04 (CompliancePreviewService)
    - 08-05 (SandboxOrchestratorService)
    - 08-06 (ComplianceSignOffService)
  provides:
    - REST API controller with 15+ endpoints
    - Route definitions with JWT protection
    - DI configuration for all Phase 8 services
  affects:
    - 08-08 (Unit tests will test controller methods)
    - 08-09 (Integration tests will test API endpoints)
    - 08-10 (Frontend will consume these endpoints)

tech_stack:
  added: []
  patterns:
    - "InversifyJS controller injection"
    - "Express RequestHandler pattern for async routes"
    - "Arrow function class properties for method binding"
    - "Lazy container.get() to avoid circular dependencies"

key_files:
  created:
    - web-erp-app/backend/src/controllers/compliance-portal.controller.ts
    - web-erp-app/backend/src/routes/compliance-portal.routes.ts
  modified:
    - web-erp-app/backend/src/config/types.ts
    - web-erp-app/backend/src/config/container.ts
    - web-erp-app/backend/src/setup/routes.setup.ts

decisions:
  - id: API-07-01
    title: "Arrow function properties for controller methods"
    context: "TypeScript class methods lose `this` context when passed as callbacks"
    decision: "Use arrow function class properties (getStatus = async () => {})"
    rationale: "Ensures `this` binding is correct without explicit .bind() calls"
  - id: API-07-02
    title: "Lazy controller resolution"
    context: "Routes imported before container fully initialized"
    decision: "Use getController() function instead of direct container.get() at module level"
    rationale: "Defers DI resolution until request time, avoiding module load order issues"
  - id: API-07-03
    title: "Centralized user context extraction"
    context: "Multiple endpoints need user.id and user.companyId with null checks"
    decision: "Created getUserContext() helper method in controller"
    rationale: "Single place for null checks and type narrowing"

metrics:
  files_created: 2
  files_modified: 3
  lines_added: ~905
  endpoints_created: 16
---

# Phase 8 Plan 7: REST API Controller and Routes Summary

REST API controller and routes for compliance verification portal with DI configuration.

## One-liner

CompliancePortalController with 16 endpoints (691 lines) + routes (214 lines) + DI bindings for all Phase 8 services.

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add DI type symbols | 6e83913 | types.ts |
| 2 | Create CompliancePortalController | 362b167 | compliance-portal.controller.ts |
| 3 | Create routes and DI configuration | 735c0ef | routes, container, setup |

## Implementation Details

### 1. DI Type Symbols (types.ts)

Added symbols for all Phase 8 services:

```typescript
export const COMPLIANCE_PORTAL_TYPES = {
  CompliancePortalService: Symbol.for('CompliancePortalService'),
  ComplianceChecklistService: Symbol.for('ComplianceChecklistService'),
  CompliancePreviewService: Symbol.for('CompliancePreviewService'),
  SandboxOrchestratorService: Symbol.for('SandboxOrchestratorService'),
  ComplianceSignOffService: Symbol.for('ComplianceSignOffService'),
  CompliancePortalController: Symbol.for('CompliancePortalController'),
} as const;
```

### 2. Controller Implementation

16 endpoint methods organized by feature area:

**Dashboard (2 endpoints)**
- `getComplianceStatus()` - GET /status
- `getDashboardSummary()` - GET /dashboard

**Checklists (3 endpoints)**
- `getChecklist()` - GET /checklists/:domain
- `runChecklist()` - POST /checklists/:domain/run
- `getChecklistHistory()` - GET /checklists/history

**Preview (1 endpoint)**
- `getPreview()` - GET /preview/:domain/:periodId

**Sandbox (3 endpoints)**
- `runSandboxTest()` - POST /sandbox/test
- `getSandboxHistory()` - GET /sandbox/history
- `checkSandboxAvailable()` - GET /sandbox/available/:domain

**Sign-Off (6 endpoints)**
- `submitForSignOff()` - POST /signoff
- `approveSignOff()` - POST /signoff/:id/approve
- `rejectSignOff()` - POST /signoff/:id/reject
- `getSignOff()` - GET /signoff/:id
- `getApprovalHistory()` - GET /signoff/history
- `getPendingSignOffs()` - GET /signoff/pending

### 3. Route Configuration

Routes registered at `/api/compliance-portal`:

```typescript
// Lazy getter pattern
function getController(): CompliancePortalController {
  return container.get<CompliancePortalController>(
    TYPES.CompliancePortalController
  );
}

// Async error handling
router.get('/status', authenticate as RequestHandler,
  (req, res, next) => {
    getController().getComplianceStatus(req, res).catch(next);
  }
);
```

### 4. DI Container Bindings

All services bound as singletons with `isBound()` checks for hot reload safety:

```typescript
if (!container.isBound(TYPES.CompliancePortalService)) {
  container.bind<CompliancePortalService>(TYPES.CompliancePortalService)
    .to(CompliancePortalService)
    .inSingletonScope();
}
```

## Type Safety Improvements

Created `getUserContext()` helper for type-safe user extraction:

```typescript
private getUserContext(req: AuthRequest): UserContext {
  const user = req.user;
  if (!user) {
    throw new Error('User not authenticated');
  }
  if (!user.companyId) {
    throw new Error('User not assigned to any company');
  }
  return { userId: user.id, companyId: user.companyId };
}
```

## Verification Results

All success criteria met:

- [x] 16 endpoints defined and protected by JWT auth
- [x] DI container binds all 5 services and controller
- [x] Routes organized by feature area
- [x] Error handling returns consistent response format
- [x] Type symbols exported for external use
- [x] Controller min 200 lines (actual: 691)
- [x] Routes min 50 lines (actual: 214)
- [x] TypeScript compiles without errors

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /status | Overall compliance status |
| GET | /dashboard | Dashboard summary |
| GET | /checklists/history | Check run history |
| GET | /checklists/:domain | Domain check definitions |
| POST | /checklists/:domain/run | Run domain checks |
| GET | /preview/:domain/:periodId | FTA submission preview |
| POST | /sandbox/test | Run sandbox test |
| GET | /sandbox/history | Sandbox test history |
| GET | /sandbox/available/:domain | Check sandbox availability |
| POST | /signoff | Submit for sign-off |
| POST | /signoff/:id/approve | Approve sign-off |
| POST | /signoff/:id/reject | Reject sign-off |
| GET | /signoff/:id | Get sign-off details |
| GET | /signoff/history | Approval history |
| GET | /signoff/pending | Pending approvals |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] AuthRequest type compatibility**
- **Found during:** Task 2
- **Issue:** Controller defined local AuthRequest interface that conflicted with existing AuthRequest from auth.middleware.ts
- **Fix:** Import AuthRequest from middleware instead of redefining
- **Files modified:** compliance-portal.controller.ts

**2. [Rule 3 - Blocking] TypeScript compilation errors**
- **Found during:** Task 3
- **Issue:** `user.companyId` could be null, causing TypeScript errors
- **Fix:** Created `getUserContext()` helper with proper null checks
- **Files modified:** compliance-portal.controller.ts

## Next Phase Readiness

- [x] API endpoints ready for integration tests (08-09)
- [x] Controller methods ready for unit tests (08-08)
- [x] Routes mounted at /api/compliance-portal
- [x] All services bound in DI container
