# STATE: UAE ERP Compliance Framework

## Project Reference

**Core Value:** Full UAE tax and regulatory compliance (VAT, CT, WPS, E-Invoicing) enabling Vesla ERP customers to meet FTA requirements and participate in UAE e-invoicing pilot by July 2026.

**Current Focus:** Phase 3 - VAT Compliance Engine. Building centralized VAT calculation with Form 201 box assignments and reverse charge mechanism for UAE FTA compliance.

---

## Current Position

**Phase:** 3 of 10 (VAT Compliance Engine) - IN PROGRESS
**Plan:** 8 of 10 complete (03-01, 03-02, 03-03, 03-04, 03-05, 03-06, 03-07, 03-08)
**Status:** In progress
**Last activity:** 2026-01-24 - Completed 03-08-PLAN.md (Bad Debt Relief Service)

**Progress:**
```
Phase 1    [████████████████] Multi-Tenant Foundation    COMPLETE (5/5 req)
Phase 2    [████████████████] Internal Controls          COMPLETE (5/5 req)
Phase 2.5  [                ] Accounting Foundation      NOT STARTED (0/12 req)
Phase 3    [████████        ] VAT Compliance             8/10 requirements (03-01 to 03-08)
Phase 4    [                ] Corporate Tax              0/9 requirements
Phase 5    [                ] WPS Payroll                0/7 requirements
Phase 6    [                ] E-Invoice Core             0/6 requirements
Phase 7    [                ] E-Invoice Transmission     0/4 requirements
Phase 8    [                ] Verification Portal        0/9 requirements
Phase 9    [                ] Standalone Package         0/4 requirements
           |█████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░|
Overall: 18/71 requirements (~25%)
```

---

## Performance Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| Plans completed | 15 | 01-01 to 02-04, 03-01 to 03-08 |
| Requirements delivered | 18/71 | TENANT-01-05, CTRL-01-04, VAT-01 to VAT-08 |
| Phases completed | 2/10 | Phase 2 complete, Phase 3 in progress |
| Blockers encountered | 0 | - |
| Decisions made | 34 | See Key Decisions table |

---

## Accumulated Context

### Key Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| 9-phase structure | Derived from 8 requirement categories with e-invoicing split for complexity | 2026-01-23 |
| E-invoicing as critical path | July 2026 pilot deadline makes EINV phases time-critical | 2026-01-23 |
| Foundation-first approach | Multi-tenant and audit infrastructure enables all compliance features | 2026-01-23 |
| Cross-database reference pattern | UUID/code lookups for master-to-tenant DB references (no FK across DBs) | 2026-01-23 |
| Singleton compliance config | One tenant_compliance_config per tenant DB (company-wide settings) | 2026-01-23 |
| COMPLIANCE permission module | Groups FTA/regulatory permissions separately from finance CRUD | 2026-01-23 |
| Jest mock with type assertions | Tests run before schema migrations, mocks bypass Prisma type issues | 2026-01-23 |
| Raw SQL for master DB queries | Master Prisma client not separately generated; use masterDatabaseService | 2026-01-23 |
| compliance_config.view/update | Permission codes follow tax_config pattern for consistency | 2026-01-23 |
| Nullable tamper-proof fields | Pre-migration records retain NULL; hash chain starts fresh | 2026-01-24 |
| Database-level immutability | PostgreSQL trigger prevents UPDATE/DELETE as defense-in-depth | 2026-01-24 |
| Partial unique constraint | sequenceNumber unique allows NULL for backward compatibility | 2026-01-24 |
| Standalone hash in tests | Tests verify hash algorithm independently from service implementation | 2026-01-24 |
| Mock Prisma for immutability | Trigger behavior tested via mocked rejection; real trigger at migration | 2026-01-24 |
| Raw SQL for hash chain | Avoids Prisma model name issues, ensures SEQUENCE compatibility | 2026-01-24 |
| Local sanitize method | Parent class sanitize() is private; local method avoids inheritance conflicts | 2026-01-24 |
| Unified ApprovalDocumentType | Standard financial + FTA types in one enum for unified workflow system | 2026-01-24 |
| Role placeholders in seed | Role IDs vary per tenant; placeholders allow workflow creation before roles | 2026-01-24 |
| Idempotent workflow seeding | findFirst check before create; safe to run multiple times | 2026-01-24 |
| Phase 2.5 bridge phase | Accounting infrastructure enables CT-05/06, VAT-07/08, WPS-07 | 2026-01-24 |
| tax_configurations as compliance config | Existing table stores TRN/VAT registration; extend rather than new table | 2026-01-24 |
| Stateless ReverseChargeService | RCM determination is pure calculation logic; no database access needed | 2026-01-24 |
| Paired accounting for reverse charge | DR Input VAT / CR Output VAT per FTA self-accounting requirement | 2026-01-24 |
| FOR UPDATE lock for invoice numbers | Prevents race conditions in concurrent invoice creation with retry logic | 2026-01-24 |
| VatCalculationService via DI injection | Ensures consistent VAT calculation across all invoice types | 2026-01-24 |
| Bilingual template with Noto Sans Arabic | FTA requires Arabic content; fallback fonts for reliable rendering | 2026-01-24 |
| Credit note mandatory original reference | FTA Article 70 requires credit notes to reference original invoice | 2026-01-24 |
| 14-day rule warning not error | Business may have valid reasons for late issuance; log for FTA audit | 2026-01-24 |
| Box 10 mirrors Box 3+6 | Reverse charge input VAT equals output VAT for net-zero effect | 2026-01-24 |
| Credit notes as adjustments | Credit notes reduce Box 1 via adjustmentAmount field | 2026-01-24 |
| Missing emirate defaults Dubai | Common business scenario; logged as warning for review | 2026-01-24 |
| 0.10 AED variance threshold | Reconciliation tolerance for rounding; 1.00 AED for investigation | 2026-01-24 |
| 183 days for 6-month eligibility | FTA Article 64 bad debt relief uses 183 days (average 6 months) | 2026-01-24 |
| Due date not invoice date | Bad debt relief eligibility counts from payment DUE DATE per FTA | 2026-01-24 |
| Proportional relief calculation | VAT relief proportional to outstanding balance for partial payments | 2026-01-24 |

### Technical Notes

- Express.js backend, React frontend, Prisma ORM, PostgreSQL (Neon)
- Multi-tenant with company-scoped isolation already exists
- Arabic support already exists (useful for bilingual invoices)
- Basic VAT calculations exist but need FTA upgrade
- PEPPOL PINT-AE is the UAE e-invoicing standard (not ZATCA/FATOORA)

**Phase 1 Deliverables:**
- `free_zones` table (master DB): 27 UAE free zones with designation status
- `industry_codes` table (master DB): 38 ISIC-aligned industry codes
- `tenant_compliance_config` table (tenant DB): Per-tenant TRN, free zone, industry config
- `tax_code_mappings` table (tenant DB): Tenant-specific tax code configurations
- `TrnStatus`, `FreeZoneStatus`, `FilingFrequency` enums
- 4 compliance permissions (config.view, config.edit, trn.verify, taxcode.manage)
- ComplianceConfigService with TRN validation (15-digit pattern)
- ComplianceConfigController with permission middleware
- Routes at `/api/finance/compliance-config`
- 40 integration tests (all passing)

**Phase 2 Deliverables:**
- Tamper-proof audit schema (sequenceNumber, previousHash, recordHash)
- 13 FTA audit action types in AuditAction enum
- PostgreSQL immutability trigger (audit_logs_immutable)
- TypeScript types for hash chain (audit.types.ts)
- ComplianceAuditService with logWithHashChain() for FTA compliance
- AuditIntegrityService with verifyIntegrity() and verifyRecentRecords()
- DI container integration (TYPES.ComplianceAuditService, TYPES.AuditIntegrityService)
- ApprovalDocumentType enum (12 types: 7 standard + 5 FTA)
- ApproverType enum (ROLE, SPECIFIC_USER, ANY_APPROVER)
- approval_workflows and approval_workflow_levels models
- 5 FTA workflow templates with 12 approval levels total
- seedFtaApprovalWorkflows() idempotent seed function
- 59 integration tests for compliance audit (all passing)

### Todos

- [x] Begin Phase 1 planning when ready
- [x] Create schema foundation (01-01)
- [x] Create compliance permissions seed (01-03)
- [x] Create integration tests (01-03)
- [x] Build compliance config service (01-02)
- [x] Create tamper-proof audit schema (02-01)
- [x] Implement ComplianceAuditService (02-02)
- [x] Implement AuditIntegrityService (02-02)
- [x] Create compliance audit integration tests (02-04)
- [x] Create FTA approval workflow seeds (02-03)
- [ ] Run database migrations for new schema
- [ ] Seed free zones and industry codes reference data
- [ ] Seed compliance permissions
- [ ] Research PEPPOL PINT-AE specification details
- [ ] Research DCTCE API integration requirements
- [ ] Identify existing VAT code that needs FTA upgrade

### Blockers

None currently.

---

## Session Continuity

### Last Session

**Date:** 2026-01-24
**Completed:** Plan 03-08 Bad Debt Relief Service
**Activity:**
- Created BadDebtReliefService for FTA Article 64 VAT recovery (893 lines)
- 6-month eligibility from payment DUE DATE (not invoice date)
- ELIGIBILITY_DAYS = 183 (6 months average)
- Write-off tracking (debtWrittenOff, writtenOffDate)
- Customer notification tracking (customerNotified, notificationDate)
- Relief claiming with VAT period integration (Box 1 adjustment)
- Reversal handling when customer subsequently pays
- Registered BadDebtReliefService in DI container

### Context for Next Session

1. **Bad Debt Relief Ready** - BadDebtReliefService tracks relief lifecycle
2. **FTA Article 64 Compliance** - All five requirements implemented
3. **VAT Return Integration** - Relief claimed/reversed in VAT periods
4. **Proportional Calculation** - Relief based on outstanding balance ratio
5. **Next Plan** - 03-09 Input VAT Recovery Service

### Files Modified This Session

**Created (Phase 3 Plan 08):**
- `backend/src/services/vat/bad-debt-relief.service.ts` - Bad debt relief service (893 lines)
- `.planning/phases/03-vat-compliance-engine/03-08-SUMMARY.md` - Plan summary

**Modified:**
- `backend/src/config/container.ts` - Added BadDebtReliefService binding
- `backend/src/services/vat/index.ts` - Added BadDebtReliefService export

---

## Quick Reference

**Current Phase:** 3 - VAT Compliance Engine (IN PROGRESS)
**Next Action:** Execute 03-09 Input VAT Recovery Service
**Critical Deadline:** July 2026 (e-invoicing pilot)
**Total Scope:** 71 requirements, 10 phases

### Phase 2 Test Coverage

| Test Category | Tests | Status |
|---------------|-------|--------|
| FTA Audit Action Types | 5 | PASS |
| Hash Chain Algorithm | 8 | PASS |
| Hash Chain Verification | 7 | PASS |
| Sequence Number Guarantees | 4 | PASS |
| Immutability Constraints | 5 | PASS |
| Data Sanitization | 10 | PASS |
| FTA Compliance Requirements | 9 | PASS |
| Integrity Statistics | 5 | PASS |
| Success Criteria Verification | 7 | PASS |
| **Total** | **59** | **ALL PASS** |

### Phase 1 Test Coverage

| Test Category | Tests | Status |
|---------------|-------|--------|
| TRN Validation | 10 | PASS |
| Free Zone Config | 4 | PASS |
| Industry Codes | 4 | PASS |
| Tax Code Mappings | 5 | PASS |
| Data Isolation | 4 | PASS |
| Success Criteria | 4 | PASS |
| API Endpoints | 7 | PASS |
| Permissions | 2 | PASS |
| **Total** | **40** | **ALL PASS** |

### Verification Summary

**Phase 1 Verification:** PASSED (26/26 must-haves)
- Schema foundation: All tables and enums created
- Reference data: 27 free zones, 38 industry codes seeded
- Service layer: ComplianceConfigService with TRN validation
- API layer: Routes with permission middleware
- Tests: 40 tests covering all requirements
- Data isolation: Tenant-scoped configuration verified

**Phase 2 Verification:** PASSED (COMPLETE)
- Tamper-proof schema: sequenceNumber, previousHash, recordHash added
- FTA audit actions: 13 action types in enum
- Immutability trigger: audit_logs_immutable created
- ComplianceAuditService: logWithHashChain, logSmart implemented
- AuditIntegrityService: verifyIntegrity, verifyRecentRecords, getIntegrityStats
- DI integration: Services bound in container
- Approval workflows: 5 FTA templates with 12 approval levels
- Seed script: npm run seed:fta-workflows
- Integration tests: 59 tests all passing
- CTRL requirements: CTRL-01, CTRL-02, CTRL-03, CTRL-04 complete

### FTA Approval Workflows Created

| Workflow | Levels | Approval Chain |
|----------|--------|----------------|
| VAT_RETURN | 3 | Accountant -> Finance Manager -> CFO |
| CT_RETURN | 3 | Accountant -> Finance Manager -> CFO |
| PAYROLL | 2 | HR Manager -> Finance Manager |
| COMPLIANCE_CONFIG | 2 | Compliance Officer -> CEO |
| EINVOICE_BATCH | 2 | Accountant -> Finance Manager |
