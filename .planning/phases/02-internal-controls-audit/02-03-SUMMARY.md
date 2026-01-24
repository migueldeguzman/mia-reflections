---
phase: 02-internal-controls-audit
plan: 03
subsystem: approval-workflows
tags: [fta-compliance, approval-workflows, vat, payroll, wps, trn, einvoice]
dependency-graph:
  requires: [02-01]
  provides: [approval-workflow-schema, fta-workflow-templates, workflow-seed-script]
  affects: [02-04, phase-03, phase-05, phase-06]
tech-stack:
  added: []
  patterns: [multi-level-approval, role-based-authorization, idempotent-seeding]
key-files:
  created:
    - web-erp-app/backend/prisma/seeds/workflows/fta-approval-workflows.seed.ts
    - web-erp-app/backend/prisma/seeds/workflows/index.ts
  modified:
    - web-erp-app/backend/prisma/tenant-schema.prisma
    - web-erp-app/backend/package.json
decisions:
  - id: D-02-03-001
    decision: "Include standard financial document types in ApprovalDocumentType enum alongside FTA types"
    rationale: "Enables unified approval workflow system for both standard transactions and FTA compliance operations"
  - id: D-02-03-002
    decision: "Use role placeholders instead of actual role IDs in seed script"
    rationale: "Role IDs vary per tenant; placeholders allow workflow creation before roles are seeded"
  - id: D-02-03-003
    decision: "Make seed script idempotent with findFirst check before create"
    rationale: "Safe to run multiple times without creating duplicates; production-ready pattern"
metrics:
  duration: "~5 minutes"
  started: "2026-01-24T04:55:06Z"
  completed: "2026-01-24"
  tasks: 3
  commits: 3
---

# Phase 02 Plan 03: FTA Approval Workflow Seed Summary

**One-liner:** Created ApprovalDocumentType enum with 5 FTA compliance types, approval workflow schema, and idempotent seed script for 5 multi-level approval workflows totaling 12 approval levels.

## Objective Achieved

Created FTA compliance approval workflow seed configurations for VAT submission, payroll approval, and TRN configuration changes, satisfying CTRL-04 (approval workflows for sensitive operations).

## Commits

| Commit | Type | Description |
|--------|------|-------------|
| `aae809f` | feat | Add FTA approval workflow schema (enums and models) |
| `0f8f0f4` | feat | Create FTA approval workflow seed script with 5 templates |
| `a057e11` | feat | Add seed script to package.json and create index export |

## Deliverables

### 1. ApprovalDocumentType Enum

**12 document types for unified workflow system:**

| Category | Type | Description |
|----------|------|-------------|
| Standard Financial | BILL | Vendor bills |
| Standard Financial | CREDIT_NOTE | Credit notes |
| Standard Financial | DEBIT_NOTE | Debit notes |
| Standard Financial | RECEIPT_VOUCHER | Receipt vouchers |
| Standard Financial | PAYMENT_VOUCHER | Payment vouchers |
| Standard Financial | JOURNAL_VOUCHER | Journal entries |
| Standard Financial | INVOICE | Customer invoices |
| FTA Compliance | VAT_RETURN | VAT return submission to FTA |
| FTA Compliance | CT_RETURN | Corporate Tax return |
| FTA Compliance | PAYROLL | WPS payroll processing |
| FTA Compliance | COMPLIANCE_CONFIG | TRN and compliance config changes |
| FTA Compliance | EINVOICE_BATCH | E-invoice batch submission |

### 2. ApproverType Enum

| Type | Description |
|------|-------------|
| ROLE | Any user with specified role |
| SPECIFIC_USER | Specific user ID |
| ANY_APPROVER | Any user with approval permission |

### 3. Approval Workflow Models

**approval_workflows table:**
- `id` (UUID) - Primary key
- `documentType` - ApprovalDocumentType enum (unique per tenant)
- `workflowName` - Display name
- `description` - Workflow purpose
- `isActive` - Enable/disable workflow
- `requireAllLevels` - Sequential vs parallel approval
- `allowSelfApproval` - Self-approval toggle
- `autoPostOnFinalApproval` - Auto-execute after final approval
- `escalationDays` - Days before escalation

**approval_workflow_levels table:**
- `id` (UUID) - Primary key
- `workflowId` - FK to approval_workflows
- `levelNumber` - Order of approval (1, 2, 3...)
- `levelName` - Display name
- `approverType` - How approver is determined
- `roleId` - Role ID for ROLE type
- `specificUserId` - User ID for SPECIFIC_USER type
- `minAmount` / `maxAmount` - Amount thresholds

### 4. FTA Workflow Templates (5)

| Workflow | Levels | Approval Chain | Auto-Post | Escalation |
|----------|--------|----------------|-----------|------------|
| VAT_RETURN | 3 | Accountant -> Finance Manager -> CFO | No | 3 days |
| CT_RETURN | 3 | Accountant -> Finance Manager -> CFO | No | 5 days |
| PAYROLL | 2 | HR Manager -> Finance Manager | Yes (SIF) | 2 days |
| COMPLIANCE_CONFIG | 2 | Compliance Officer -> CEO | No | 5 days |
| EINVOICE_BATCH | 2 | Accountant -> Finance Manager | Yes (ASP) | 1 day |

**Total:** 12 approval levels across 5 workflows

### 5. Seed Script

**File:** `prisma/seeds/workflows/fta-approval-workflows.seed.ts`

**Exports:**
| Export | Type | Purpose |
|--------|------|---------|
| `seedFtaApprovalWorkflows()` | Function | Main seeding function (idempotent) |
| `getFtaWorkflowTemplates()` | Function | Get workflow templates for config UI |
| `getRolePlaceholders()` | Function | Get role placeholder mapping |
| `SeedResult` | Interface | Result type with counts |

**Usage:** `npm run seed:fta-workflows`

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

| Check | Status | Details |
|-------|--------|---------|
| Schema validation | PASS | `npx prisma validate` succeeded |
| Schema format | PASS | `npx prisma format` succeeded |
| TypeScript compilation | PASS | Seed script compiles without errors |
| ApprovalDocumentType has 12 values | PASS | 7 standard + 5 FTA types |
| ApproverType has 3 values | PASS | ROLE, SPECIFIC_USER, ANY_APPROVER |
| Seed script exports | PASS | seedFtaApprovalWorkflows, getFtaWorkflowTemplates |
| Package.json script | PASS | seed:fta-workflows added |
| 5 workflow templates | PASS | VAT_RETURN, CT_RETURN, PAYROLL, COMPLIANCE_CONFIG, EINVOICE_BATCH |

## Files Summary

| File | Action | Lines |
|------|--------|-------|
| tenant-schema.prisma | Modified | +78 net |
| fta-approval-workflows.seed.ts | Created | 364 |
| workflows/index.ts | Created | 13 |
| package.json | Modified | +2 |

## Must-Haves Validation

| Requirement | Status | Evidence |
|-------------|--------|----------|
| VAT submission requires multi-level approval | PASS | VAT_RETURN: 3 levels (Accountant -> FM -> CFO) |
| Payroll follows HR then Finance workflow | PASS | PAYROLL: 2 levels (HR_MANAGER -> FINANCE_MANAGER) |
| TRN changes require compliance + CEO | PASS | COMPLIANCE_CONFIG: 2 levels (Compliance Officer -> CEO) |
| Workflows configurable per tenant | PASS | documentType unique constraint allows one workflow per type per tenant DB |

## Next Steps

1. **Plan 02-04:** Create AuditIntegrityService for verification
2. **Phase 03 (VAT):** Implement VAT return submission using VAT_RETURN workflow
3. **Phase 05 (WPS):** Implement payroll approval using PAYROLL workflow
4. **Phase 06 (E-Invoice):** Implement batch submission using EINVOICE_BATCH workflow

## Technical Notes

- Role placeholders used in seed script; update with actual role IDs after roles are seeded
- Unique constraint on documentType prevents duplicate workflows per tenant
- autoPostOnFinalApproval=true for PAYROLL (generates SIF) and EINVOICE_BATCH (submits to ASP)
- Escalation days vary by urgency: 1 day (e-invoicing) to 5 days (compliance changes)
- Seed script is idempotent - checks for existing workflows before creating

## Requirements Addressed

- **CTRL-04:** Approval workflows for key financial transactions (schema and templates)
- Enables future CTRL requirements for approval workflow execution
