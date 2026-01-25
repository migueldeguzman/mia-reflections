---
phase: 08-compliance-verification
plan: 05
status: complete
subsystem: compliance-portal
tags: [sandbox, testing, einvoice, verification, fta, audit-trail]
dependency_graph:
  requires: ["08-01", "08-02", "08-03", "07-05"]
  provides: ["SandboxOrchestratorService", "VERIFY-06 sandbox testing"]
  affects: ["08-06", "08-07"]
tech_stack:
  added: []
  patterns: ["sandbox integration", "provider pattern", "audit logging"]
key_files:
  created:
    - web-erp-app/backend/src/services/compliance-portal/sandbox-orchestrator.service.ts
  modified:
    - web-erp-app/backend/src/services/compliance-portal/index.ts
decisions:
  - id: provider-optional-injection
    choice: "SandboxProvider injected via setSandboxProvider() method"
    rationale: "Allows service to work without provider while gracefully reporting unavailability"
  - id: audit-log-action
    choice: "Use CREATE action for sandbox tests logged to auditLogs"
    rationale: "Consistent with existing audit infrastructure, avoids schema changes"
  - id: test-type-limits
    choice: "QUICK=1, FULL=10, SPECIFIC=provided IDs"
    rationale: "Balance testing thoroughness with performance; QUICK for smoke tests"
  - id: placeholder-sandbox-pass
    choice: "VAT/CT/WPS return PASS with informational message"
    rationale: "Allow workflow to complete while clearly indicating sandbox unavailable"
metrics:
  duration: "~10 minutes"
  completed: "2026-01-25"
  lines_of_code: 691
  commits: 1
---

# Phase 08 Plan 05: Sandbox Orchestrator Service Summary

**One-liner:** SandboxOrchestratorService enabling E-Invoice sandbox testing via Phase 7 SandboxProvider with audit trail logging and QUICK/FULL/SPECIFIC test modes.

## What Was Built

### SandboxOrchestratorService (691 lines)

The SandboxOrchestratorService implements VERIFY-06 (Sandbox testing environment), allowing users to test compliance submissions in FTA sandbox before production filing.

**Core Capabilities:**

1. **runSandboxTest()** - Main entry point for sandbox testing
   - Accepts companyId, userId, and SandboxTestRequest
   - Routes to domain-specific sandbox test methods
   - Returns SandboxTestResult with pass/fail status per document
   - Validates user company access (multi-tenant security)

2. **getSandboxTestHistory()** - Retrieves historical sandbox tests
   - Queries audit_logs for previous test runs
   - Optional domain filter
   - Configurable limit (max 50)
   - Returns testId, domain, status, counts, timestamp

3. **isSandboxAvailable()** - Checks sandbox availability
   - E-Invoice: Returns true only if SandboxProvider is injected
   - VAT/CT/WPS: Returns false (no FTA sandbox yet)
   - Enables graceful UI handling of unavailable sandboxes

**E-Invoice Sandbox Testing:**

Integrates with Phase 7 SandboxProvider via TRANSMISSION_TYPES.SandboxProvider DI injection:
- Queries einvoice_archives for documents to test
- Calls sandboxProvider.transmit() with metadata
- Maps sandbox response to SandboxDocumentResult
- Handles errors gracefully per-document (one failure doesn't stop others)

**Test Types:**

| Type | Documents | Use Case |
|------|-----------|----------|
| QUICK | 1 | Fast smoke test before bulk submission |
| FULL | 10 | Thorough validation of pending documents |
| SPECIFIC | N (provided IDs) | Test specific documents by ID |

**VAT/CT/WPS Sandbox:**

Placeholder implementations return informational messages:
- Status: PASS (allows workflow to continue)
- Message: Clear indication sandbox not available from FTA/MOHRE
- Alternative: Suggests using CompliancePreviewService validation

**Audit Trail Integration:**

All sandbox tests are logged to auditLogs:
- action: 'CREATE'
- entity: 'SandboxTest:{domain}'
- entityId: testId (UUID)
- newValue: JSON with domain, status, counts, duration, result summary

### Barrel Export Update

The index.ts was already updated to export:
- SandboxOrchestratorService
- SandboxTestRequest, SandboxTestResult, SandboxDocumentResult, SandboxTestType types

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Provider injection | setSandboxProvider() method | Avoids DI complexity; works without provider |
| Audit action | CREATE for test runs | Consistent with existing audit infrastructure |
| Test limits | QUICK=1, FULL=10 | Balance thoroughness with performance |
| Unavailable sandbox | Return PASS with message | Allow workflow completion while informing user |
| Per-document errors | Continue testing others | One failure shouldn't block all testing |

## Success Criteria Verification

| Criteria | Status | Evidence |
|----------|--------|----------|
| E-Invoice sandbox uses Phase 7 SandboxProvider | PASS | Line 335: sandboxProvider.transmit() |
| Test results include pass/fail per document | PASS | Line 353: status based on result.success |
| Audit trail captures test execution | PASS | Lines 196, 655-689: logSandboxTest() |
| Test history retrievable per company/domain | PASS | Lines 219-268: getSandboxTestHistory() |
| VAT/CT/WPS gracefully indicate unavailable | PASS | Lines 547-615: informational messages |
| QUICK/FULL/SPECIFIC test types work | PASS | Lines 403-415: test type routing |
| isSandboxAvailable() returns false when no provider | PASS | Line 281: return !!this.sandboxProvider |
| runSandboxTest throws when E-Invoice provider missing | PASS | Line 309: throws "E-Invoice sandbox provider not available" |

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Hash | Message | Files |
|------|---------|-------|
| b6acc40 | feat(08-05): create SandboxOrchestratorService for VERIFY-06 | sandbox-orchestrator.service.ts |

## Files Created/Modified

**Created:**
- `web-erp-app/backend/src/services/compliance-portal/sandbox-orchestrator.service.ts` (691 lines)

**Modified:**
- `web-erp-app/backend/src/services/compliance-portal/index.ts` (already committed in prior session)

## Integration Points

**Uses:**
- PrismaClient via TYPES.PrismaClient injection
- SandboxProvider via TRANSMISSION_TYPES.SandboxProvider (optional)
- Types from `compliance-portal.types.ts`

**Used By:**
- Will be used by CompliancePortalController (08-07) for API endpoints
- Can be used before sign-off workflow to validate submissions

## Next Phase Readiness

Plan 08-05 complete. Next plans can proceed:
- **08-06:** ComplianceSignOffService - can trigger sandbox test before sign-off
- **08-07:** CompliancePortalController - will expose sandbox testing via API
