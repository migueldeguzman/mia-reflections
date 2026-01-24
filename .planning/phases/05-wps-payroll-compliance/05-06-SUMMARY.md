---
phase: 05-wps-payroll-compliance
plan: 06
subsystem: wps-error-tracking
tags: [wps, errors, mohre, resolution, payroll, tracking]
dependency-graph:
  requires:
    - 05-01 (WPS Schema Foundation)
    - 05-04 (SIF Generation)
    - 05-05 (WPS Submission Workflow)
  provides:
    - WPS error tracking and resolution service
    - MOHRE error code reference with 32 codes
    - Resolution guidance for common errors
    - Error statistics for company-level reporting
  affects:
    - 05-07 (Payroll cycle management)
    - WPS dashboard and reporting
tech-stack:
  added: []
  patterns:
    - injectable service pattern
    - error enrichment pattern
    - resolution workflow tracking
key-files:
  created:
    - web-erp-app/backend/src/types/payroll/wps-error-codes.ts
    - web-erp-app/backend/src/services/payroll/wps-error.service.ts
  modified:
    - web-erp-app/backend/src/config/types.ts
    - web-erp-app/backend/src/config/container.ts
decisions:
  - id: ERR-01
    title: Error code format follows MOHRE convention
    choice: Use XX-NNN format (2-letter category + 3-digit number)
    rationale: Matches MOHRE/WPS error codes; easy to parse and categorize
  - id: ERR-02
    title: Resolution stored in suggestion field
    choice: Reuse existing suggestion field for resolution text
    rationale: Schema already has suggestion field; avoid migration for new column
  - id: ERR-03
    title: isResolved computed from resolvedAt
    choice: Derive isResolved boolean from resolvedAt !== null
    rationale: Schema uses resolvedAt date; no need for separate boolean column
  - id: ERR-04
    title: 32 error codes covering 9 categories
    choice: Comprehensive error code database with resolution steps
    rationale: Cover all common WPS submission failure scenarios
metrics:
  duration: ~10 minutes
  completed: 2026-01-24
---

# Phase 05 Plan 06: WPS Error Tracking and Resolution Summary

**One-liner:** WPS error tracking service with 32 MOHRE error codes, resolution workflow with user/timestamp tracking, company-level statistics, and searchable error code reference.

## What Was Built

### 1. WPS Error Codes Reference (Task 1)

Created comprehensive error code database at `web-erp-app/backend/src/types/payroll/wps-error-codes.ts` (606 lines):

**Error Categories (9 total):**

| Category | Code Prefix | Count | Description |
|----------|-------------|-------|-------------|
| FILE_FORMAT | FF-xxx | 5 | SIF file structure errors |
| EMPLOYER | EM-xxx | 4 | Employer/establishment errors |
| EMPLOYEE | EE-xxx | 5 | Employee record errors |
| BANK | BK-xxx | 5 | Banking/IBAN errors |
| AMOUNT | AM-xxx | 5 | Salary amount errors |
| DATE | DT-xxx | 4 | Date/period errors |
| CONTRACT | (via EE) | - | Contract/visa errors |
| DUPLICATE | (via DT) | - | Duplicate record errors |
| SYSTEM | SY-xxx | 4 | WPS system errors |

**Error Code Structure:**

```typescript
interface WpsErrorCodeInfo {
  code: string;           // e.g., 'BK-001'
  description: string;    // Human-readable description
  category: WpsErrorCategory;
  severity: WpsErrorSeverity;  // ERROR, WARNING, INFO
  resolutionSteps: string[];   // Step-by-step fix instructions
  commonCauses: string[];      // Why this error occurs
  affectsField?: string;       // Which field caused the error
}
```

**Helper Functions:**

| Function | Purpose |
|----------|---------|
| `getErrorCodeInfo(code)` | Get error info or default for unknown codes |
| `getErrorCodesByCategory(category)` | Filter by category |
| `searchErrorCodes(keyword)` | Search codes, descriptions, steps |
| `getErrorCodesBySeverity(severity)` | Filter by severity |
| `getErrorCodeCategoryCounts()` | Get counts per category |

### 2. WpsErrorService (Task 2)

Created error tracking service at `web-erp-app/backend/src/services/payroll/wps-error.service.ts` (554 lines):

**Core Methods:**

| Method | Purpose |
|--------|---------|
| `recordError(context, input)` | Record single error with enrichment |
| `recordErrors(context, submissionId, errors[])` | Batch record multiple errors |
| `resolveError(context, errorId, input)` | Mark error resolved with user/timestamp |
| `getSubmissionErrors(context, submissionId, options)` | Query errors with filtering |
| `getEmployeeErrors(context, personCode)` | Get unresolved errors by person code |
| `getErrorStatistics(context)` | Company-level error reporting |
| `getResolutionGuidance(errorCode)` | Get resolution steps |
| `searchErrorCodes(keyword)` | Search error codes |
| `getErrorsByCategory(category)` | Filter by category |
| `getErrorHistory(context, submissionId)` | Full history for audit |

**Interfaces:**

```typescript
interface WpsErrorContext {
  companyId: string;
  userId: string;
}

interface RecordErrorInput {
  submissionId: string;
  errorCode: string;
  errorMessage: string;
  field?: string;
  personCode?: string;
  employeeName?: string;
  recordIndex?: number;
  severity?: WpsErrorSeverity;
  suggestion?: string;
}

interface ResolveErrorInput {
  resolution: string;
}

interface WpsErrorStatistics {
  total: number;
  unresolved: number;
  bySeverity: Record<string, number>;
  byCategory: Record<string, number>;
  topErrorCodes: Array<{ code: string; count: number; description: string }>;
}
```

**Standalone Functions (for direct import):**

```typescript
export async function recordWpsError(prisma, context, input): Promise<WpsErrorRecord>
export async function resolveError(prisma, context, errorId, input): Promise<WpsErrorRecord>
export { getErrorCodeInfo as getResolutionGuidance }
```

### 3. DI Container Registration (Task 3)

Added WpsErrorService to dependency injection:
- Symbol: `TYPES.WpsErrorService`
- Scope: Singleton
- Dependency: `TYPES.PrismaClient` (auto-injected)

## Sample Error Codes

### File Format Errors

| Code | Description | Severity |
|------|-------------|----------|
| FF-001 | Invalid SIF file name format | ERROR |
| FF-002 | Missing or invalid SCR record | ERROR |
| FF-003 | EDR record count mismatch | ERROR |
| FF-004 | Total amount mismatch | ERROR |
| FF-005 | Invalid file encoding | ERROR |

### Bank Errors

| Code | Description | Severity |
|------|-------------|----------|
| BK-001 | Invalid IBAN format | ERROR |
| BK-002 | IBAN account not found or closed | ERROR |
| BK-003 | Invalid bank routing code | ERROR |
| BK-004 | Bank not registered as WPS agent | ERROR |
| BK-005 | Account holder name mismatch | WARNING |

### Employee Errors

| Code | Description | Severity |
|------|-------------|----------|
| EE-001 | Invalid person code | ERROR |
| EE-002 | Employee not found in MOHRE database | ERROR |
| EE-003 | Employee contract expired | ERROR |
| EE-004 | Employee visa expired or cancelled | ERROR |
| EE-005 | Employee name mismatch | WARNING |

## Verification Results

| Check | Status |
|-------|--------|
| Error codes defined (20+ requirement) | PASS (32 codes) |
| Resolution steps on all codes | PASS |
| Service exports WpsErrorService class | PASS |
| recordError creates with enrichment | PASS |
| resolveError marks resolved with timestamp | PASS |
| getErrorCodeInfo with default for unknown | PASS |
| getErrorStatistics returns counts | PASS |

## Success Criteria Verification

| Criterion | Status |
|-----------|--------|
| WPS error codes with MOHRE format (XX-NNN) | PASS |
| Each code has description, category, severity, steps, causes | PASS |
| recordError captures errors linked to submission/employee | PASS |
| resolveError tracks who resolved and how | PASS |
| Resolution guidance via getResolutionGuidance | PASS |
| Error statistics for company-level reporting | PASS |
| Search functionality for error codes | PASS |

## Files Changed

| File | Change |
|------|--------|
| `web-erp-app/backend/src/types/payroll/wps-error-codes.ts` | Created (606 lines) |
| `web-erp-app/backend/src/services/payroll/wps-error.service.ts` | Created (554 lines) |
| `web-erp-app/backend/src/config/types.ts` | Added WpsErrorService symbol |
| `web-erp-app/backend/src/config/container.ts` | Registered WpsErrorService binding |

## Commits

| Hash | Message |
|------|---------|
| 36ca6a6 | feat(05-06): add WPS error codes reference with resolution guidance |
| 2d21eaa | feat(05-06): implement WpsErrorService for error tracking and resolution |
| 8454b68 | chore(05-06): register WpsErrorService in DI container |

## Deviations from Plan

None - plan executed exactly as written.

## Integration Points

### Upstream Dependencies
- **05-01 (WPS Schema):** Uses `wps_errors`, `wps_submissions` models
- **05-04 (SIF Generation):** Errors captured during SIF validation
- **05-05 (WPS Submission):** Errors recorded from WPS agent responses

### Downstream Consumers
- **05-07 (Payroll Cycle):** Display errors in cycle management UI
- **WPS Dashboard:** Show error statistics and trends
- **API Controllers:** Expose error tracking endpoints

### Usage Example

```typescript
import { container } from '@/config/container';
import { TYPES } from '@/config/types';
import { WpsErrorService } from '@/services/payroll/wps-error.service';

// Get service from DI container
const errorService = container.get<WpsErrorService>(TYPES.WpsErrorService);

// Record error from WPS submission response
const error = await errorService.recordError(
  { companyId: 'company-uuid', userId: 'user-uuid' },
  {
    submissionId: 'submission-uuid',
    errorCode: 'BK-001',
    errorMessage: 'Invalid IBAN format',
    personCode: '00000012345678',
    employeeName: 'John Smith',
  }
);

// Get resolution guidance
const guidance = errorService.getResolutionGuidance('BK-001');
console.log('Steps:', guidance.resolutionSteps);
// ['Verify IBAN is 23 characters', 'Check IBAN starts with AE', 'Validate IBAN checksum']

// Resolve error after fix
const resolved = await errorService.resolveError(
  { companyId: 'company-uuid', userId: 'user-uuid' },
  error.id,
  { resolution: 'Updated IBAN to correct format' }
);

// Get company statistics
const stats = await errorService.getErrorStatistics(
  { companyId: 'company-uuid', userId: 'user-uuid' }
);
console.log('Total errors:', stats.total);
console.log('Unresolved:', stats.unresolved);
console.log('Top codes:', stats.topErrorCodes);
```

## Next Phase Readiness

This plan provides the foundation for:
- **05-07:** Payroll cycle management (display errors in workflow)
- **WPS Dashboard:** Error trends and statistics visualization
- **API Controller:** Expose error management endpoints
- **Notification System:** Alert on critical errors (future)
