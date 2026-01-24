# Phase 5 Plan 01: WPS Schema Foundation Summary

**One-liner:** WPS payroll schema with PayrollCycleStatus state machine, MOHRE personCode tracking, UAE IBAN validation, and SIF file submission infrastructure.

## Execution Details

| Metric | Value |
|--------|-------|
| Plan | 05-01-PLAN.md |
| Status | COMPLETE |
| Tasks | 3/3 |
| Duration | ~8 minutes |
| Date | 2026-01-24 |

## Commits

| Hash | Type | Description |
|------|------|-------------|
| `8dcedfa` | feat | Add WPS TypeScript types for payroll compliance |
| `c48b2cf` | feat | Add WPS schema models to Prisma |
| `e34e13c` | feat | Create WPS schema migration and apply to database |

## What Was Built

### TypeScript Types (`src/types/payroll/wps.types.ts`)

**Enums:**
- `PayrollCycleStatus`: 8 states (DRAFT, PROCESSING, READY, SUBMITTED, ACCEPTED, REJECTED, COMPLETED, CANCELLED)
- `SalaryRecordStatus`: 6 states (PENDING, VALIDATED, INCLUDED, PAID, FAILED, EXCLUDED)
- `WpsSubmissionStatus`: 6 states (PENDING, UPLOADED, PROCESSING, ACCEPTED, PARTIAL, REJECTED)
- `WpsErrorSeverity`: ERROR, WARNING, INFO

**Constants:**
- `SIF_CONSTANTS`: UAE Central Bank field lengths (EMPLOYER_ID=13, PERSON_CODE=14, ROUTING_CODE=9, UAE_IBAN=23)

**State Machine:**
- `PAYROLL_CYCLE_TRANSITIONS`: Valid state transitions map with enforcement utilities
- `isValidTransition()`, `canEditCycle()`, `canSubmitCycle()` helper functions

**Interfaces:**
- `EdrRecord`: Employee Detail Record for SIF file (personCode, agentId, IBAN, salary breakdown)
- `ScrRecord`: Salary Control Record (file summary with totals)
- `EmployeeSalaryInput`: Service input for salary calculations
- `SifGenerationResult`: SIF file generation output
- `WpsValidationError`: Error structure with field, code, severity

**Validation Utilities:**
- `validatePersonCode()`: 14-digit MOHRE Person Code validation
- `validateUaeIban()`: 23-character UAE IBAN format validation
- `validateEmployerId()`: 13-digit Employer Unique ID validation
- `formatSifAmount()`, `formatSalaryMonth()`: SIF formatting helpers

### Prisma Schema Models

**payroll_cycles:**
- Status state machine (PayrollCycleStatus enum)
- Salary month (YYYYMM format), payment date, period dates
- WPS agent reference
- Cached totals (employees, basicSalary, allowances, deductions, netSalary)
- Approval workflow (approvedAt, approvedById)

**employee_salary_records:**
- MOHRE personCode (14-digit VARCHAR)
- UAE IBAN (23-character VARCHAR)
- Salary breakdown (basic, housing, transport, other allowances)
- Deductions and net salary calculation
- Days worked, leave days, overtime tracking
- Payment confirmation (paidAt, bankReferenceNo, failureReason)

**wps_agents:**
- Agent ID (9-digit), bank code (3-digit), routing code (9-digit)
- SWIFT/BIC code
- Primary agent flag per company
- Supported file formats (default: SIF)
- Submission endpoint configuration

**wps_submissions:**
- SIF file tracking (fileName, fileUrl, checksum)
- Submission status and agent response
- Accepted/rejected record counts
- Processing timestamps

**wps_errors:**
- Error code, field, message, severity
- Person code and employee name for record-level errors
- Resolution tracking (resolvedAt, resolvedBy)

### Database Migration

Applied migration `20260124150000_add_wps_payroll_schema`:
- Created 4 new enums (PayrollCycleStatus, SalaryRecordStatus, WpsSubmissionStatus, WpsErrorSeverity)
- Created 5 new tables (wps_agents, payroll_cycles, employee_salary_records, wps_submissions, wps_errors)
- Created 11 indexes for query performance
- Created 14 foreign keys with proper cascade behavior

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Staff table not migrated**
- **Found during:** Task 3 migration apply
- **Issue:** The `staff` table exists in Prisma schema but not in database
- **Fix:** Changed employee_salary_records.employeeId FK to reference `users` table instead
- **Files modified:** schema.prisma, migration.sql
- **Impact:** When staff table is migrated, FK can be updated to reference staff

## Key Files

### Created
- `web-erp-app/backend/src/types/payroll/wps.types.ts` (689 lines)
- `web-erp-app/backend/prisma/migrations/20260124150000_add_wps_payroll_schema/migration.sql` (283 lines)

### Modified
- `web-erp-app/backend/prisma/schema.prisma` (+283 lines for WPS models and relations)

## Verification

| Check | Status |
|-------|--------|
| TypeScript types compile | PASS |
| Prisma schema validates | PASS |
| Prisma client generates | PASS |
| Migration applies | PASS |
| PayrollCycle model exists | PASS |
| EmployeeSalaryRecord model exists | PASS |
| WpsAgent model exists | PASS |
| WpsSubmission model exists | PASS |
| WpsError model exists | PASS |

## Technical Decisions

| Decision | Rationale |
|----------|-----------|
| State machine as enum + transitions map | Prisma doesn't support state machines natively; TypeScript enforces transitions |
| Cached totals on payroll_cycles | Avoid N+1 queries; recalculate on record changes |
| VARCHAR for personCode/IBAN | Fixed-length validation at application layer; DB stores as-is |
| employee_id references users | Staff table not migrated; temporary until HR module complete |
| Cascade delete on cycle records | Deleting cycle should remove all associated records |

## Success Criteria Verification

| Criteria | Status |
|----------|--------|
| PayrollCycle, EmployeeSalaryRecord, WpsAgent, WpsSubmission, WpsError models exist | PASS |
| TypeScript interfaces match Prisma models for type safety | PASS |
| State machine transitions defined for PayrollCycleStatus | PASS |
| SIF format constants defined (field lengths, formats) | PASS |
| Database migration applied successfully | PASS |

## Next Phase Readiness

**Provides for 05-02:**
- Prisma models ready for service implementation
- TypeScript types for type-safe service layer
- SIF constants for file generation
- State machine transitions for cycle management

**Dependencies unblocked:**
- WPS SIF generation service can be built
- Payroll cycle management APIs can be implemented
- WPS agent configuration UI can be developed
