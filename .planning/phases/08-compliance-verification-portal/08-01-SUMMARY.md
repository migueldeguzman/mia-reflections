---
phase: "08"
plan: "01"
subsystem: "compliance-verification-portal"
tags: ["prisma", "schema", "typescript", "types", "compliance", "sign-off", "check-runs"]
dependency_graph:
  requires: ["07-10"]
  provides: ["Database schema for compliance portal", "TypeScript types for portal services"]
  affects: ["08-02", "08-03", "08-04", "08-05", "08-06", "08-07", "08-08", "08-09"]
tech_stack:
  added: []
  patterns: ["Immutable snapshots (JSON)", "Historical tracking", "Domain-based status aggregation"]
key_files:
  created:
    - "web-erp-app/backend/prisma/migrations/20260125100000_add_compliance_portal/migration.sql"
    - "web-erp-app/backend/src/types/compliance-portal.types.ts"
  modified:
    - "web-erp-app/backend/prisma/schema.prisma"
decisions:
  - id: "text-id-type"
    choice: "Use TEXT type for id and companyId instead of UUID"
    rationale: "Match existing companies and users table schema which use TEXT IDs"
  - id: "json-snapshots"
    choice: "Store checklist and preview data as immutable JSON snapshots"
    rationale: "Preserve exact state at sign-off time for audit purposes"
  - id: "domain-string-type"
    choice: "Use String type for domain field instead of enum"
    rationale: "Flexibility for future domains; existing pattern in codebase"
metrics:
  duration: "7 minutes"
  completed: "2026-01-25"
  tasks_completed: 3
  lines_added: 580
---

# Phase 08 Plan 01: Database Schema and TypeScript Types Summary

**One-liner:** Database tables (compliance_sign_offs, compliance_check_runs) and comprehensive TypeScript types for compliance verification portal services.

## What Was Built

This plan established the data foundation for the compliance verification portal, including database schema for storing sign-off records with immutable snapshots and TypeScript type definitions for all portal services.

### 1. Prisma Schema Models

Added two new models to the Prisma schema:

**compliance_sign_offs** - Stores compliance sign-off records with immutable snapshots:
```prisma
model compliance_sign_offs {
  id              String    @id @default(uuid())
  companyId       String    @map("company_id")
  domain          String    // VAT, CT, WPS, EINVOICE
  periodId        String    @map("period_id")
  status          String    @default("PENDING_APPROVAL")
  submittedById   String    @map("submitted_by_id")
  submittedAt     DateTime  @map("submitted_at")
  approvedAt      DateTime? @map("approved_at")
  rejectedAt      DateTime? @map("rejected_at")
  rejectedReason  String?   @map("rejected_reason")
  checklistSnapshot Json    @map("checklist_snapshot")
  previewSnapshot   Json    @map("preview_snapshot")
  approvalRecord  Json?     @map("approval_record")
  // Relations to companies and users
}
```

**compliance_check_runs** - Stores historical compliance check execution records:
```prisma
model compliance_check_runs {
  id            String   @id @default(uuid())
  companyId     String   @map("company_id")
  domain        String   // VAT, CT, WPS, EINVOICE
  periodId      String?  @map("period_id")
  status        String   // PASS, WARNING, FAIL
  checksPassed  Int      @map("checks_passed")
  checksTotal   Int      @map("checks_total")
  resultsJson   Json     @map("results_json")
  triggeredBy   String   @map("triggered_by")
  triggerType   String   @map("trigger_type")
  runDurationMs Int      @map("run_duration_ms")
  createdAt     DateTime @default(now()) @map("created_at")
  // Relation to companies
}
```

**Relations added:**
- `companies.complianceSignOffs` - One-to-many relation
- `companies.complianceCheckRuns` - One-to-many relation
- `users.submittedSignOffs` - One-to-many relation for sign-off submitter

### 2. Database Migration

Created migration `20260125100000_add_compliance_portal` with:
- `compliance_sign_offs` table with all columns
- `compliance_check_runs` table with all columns
- Indexes for efficient queries:
  - `(company_id, domain, status)` - For status-based filtering
  - `(period_id)` - For period-based lookups
  - `(submitted_by_id)` - For user's sign-offs
  - `(company_id, domain, created_at)` - For historical check runs
- Foreign key constraints to companies and users tables

### 3. TypeScript Types (`compliance-portal.types.ts`)

Created comprehensive type definitions (440 lines):

**Domain Types:**
- `ComplianceDomain` - VAT, CT, WPS, EINVOICE
- `OverallComplianceStatus` - COMPLIANT, WARNING, NON_COMPLIANT, UNKNOWN
- `DomainStatus` - PASS, WARNING, FAIL, PENDING
- `CheckSeverity` - CRITICAL, WARNING, INFO
- `SignOffStatus` - PENDING_APPROVAL, APPROVED, REJECTED
- `TriggerType` - MANUAL, SCHEDULED, ON_CHANGE

**Status Types:**
- `ComplianceIssue` - Individual compliance issue
- `DomainComplianceStatus` - Status for a single domain
- `ComplianceStatus` - Aggregated status across all domains

**Check Types:**
- `CheckContext` - Context for check execution
- `CheckResult` - Result from a single check
- `CheckDefinition` - Check definition with function
- `CheckResultWithMeta` - Result with metadata

**Preview Types:**
- `PreviewFormat` - FORM_201, CT_RETURN, SIF_FILE, PINT_AE_XML
- `ValidationMessage` - Validation result message
- `PreviewSummary` - Summary statistics
- `SubmissionPreviewData` - Complete preview data

**Sandbox Types:**
- `SandboxTestRequest` - Request for sandbox testing
- `SandboxDocumentResult` - Result for single document
- `SandboxTestResult` - Complete test result

**Sign-Off Types:**
- `ComplianceSignOffRequest` - Create sign-off request
- `PendingApprover` - Pending approver info
- `SignOffResult` - Sign-off creation result
- `ApprovalResult` - Approval action result

**History Types:**
- `ApprovalHistoryEntry` - Historical sign-off entry
- `ApprovalHistoryFilter` - Filter criteria

**Check Run Types:**
- `CheckRunRecord` - Database record
- `CreateCheckRunInput` - Creation input

**Constants:**
- `COMPLIANCE_DOMAINS` - Array of all domains
- `DOMAIN_DISPLAY_NAMES` - Display names for UI
- `STATUS_SEVERITY` - Severity ordering

## Files Modified

| File | Lines | Change Type |
|------|-------|-------------|
| `prisma/schema.prisma` | +70 | Added models and relations |
| `prisma/migrations/20260125100000.../migration.sql` | +63 | Created migration |
| `src/types/compliance-portal.types.ts` | +440 | Created comprehensive types |

## Commits

| Hash | Description |
|------|-------------|
| `cab91b7` | feat(08-01): add compliance portal Prisma models |
| `9133f5a` | chore(08-01): apply compliance portal database migration |
| `4c59a88` | feat(08-01): add compliance portal TypeScript types |

## Verification Results

| Check | Result |
|-------|--------|
| Prisma validate | Schema valid |
| Tables exist in DB | compliance_sign_offs, compliance_check_runs |
| Migration file exists | 20260125100000_add_compliance_portal/migration.sql |
| TypeScript compilation | No errors (with skipLibCheck) |
| Foreign key constraints | companies, users relations working |
| Indexes created | 5 indexes for efficient queries |

## Decisions Made

### 1. TEXT ID Type

**Decision:** Use TEXT type for id and companyId fields instead of UUID

**Rationale:** The existing companies and users tables use TEXT IDs (not UUID). Using TEXT ensures foreign key constraints work correctly without type conversion issues.

### 2. JSON Snapshots for Immutability

**Decision:** Store checklistSnapshot and previewSnapshot as JSON fields

**Rationale:**
- Preserves exact state at sign-off time for audit purposes
- No need to version or migrate snapshot schema
- FTA compliance requires immutable records of what was approved

### 3. String Domain Field

**Decision:** Use String type for domain field instead of Prisma enum

**Rationale:**
- Flexibility to add new domains in future without migration
- Consistent with existing patterns in codebase
- TypeScript types provide compile-time safety

## Deviations from Plan

**Type Adjustment for ID Fields:**
- Plan specified `@db.Uuid` for id fields
- Changed to plain `String @id @default(uuid())` to match existing schema patterns
- Foreign keys to companies and users require TEXT type (not UUID)

This was a necessary deviation to ensure database compatibility.

## Success Criteria Verification

| Criterion | Status |
|-----------|--------|
| compliance_sign_offs table exists with all columns and indexes | PASS |
| compliance_check_runs table exists with all columns and indexes | PASS |
| Foreign key constraints to companies and users tables work | PASS |
| TypeScript types export all interfaces needed by portal services | PASS |
| Prisma client regenerated with new models | PASS |

## Next Phase Readiness

**Phase 8 Plan 01 Status:** Complete (3/3 tasks)

**Ready for:**
- 08-02: Compliance Status Aggregation Service
- 08-03: Domain Checklist Services

**Dependencies provided:**
- Database tables for sign-offs and check runs
- TypeScript types for all portal services
- Prisma client with new models generated
