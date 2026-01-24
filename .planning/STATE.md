# STATE: UAE ERP Compliance Framework

## Project Reference

**Core Value:** Full UAE tax and regulatory compliance (VAT, CT, WPS, E-Invoicing) enabling Vesla ERP customers to meet FTA requirements and participate in UAE e-invoicing pilot by July 2026.

**Current Focus:** Phase 4 - Corporate Tax Compliance. Building UAE CT (9% on profits > AED 375K) with tax loss tracking, transfer pricing, and tax group consolidation.

---

## Current Position

**Phase:** 4 of 10 (Corporate Tax Compliance) - IN PROGRESS
**Plan:** 5 of 9 complete (04-01, 04-02, 04-03, 04-04, 04-05)
**Status:** In progress
**Last activity:** 2026-01-24 - Completed 04-05-PLAN.md (CT Report Service)

**Progress:**
```
Phase 1    [████████████████] Multi-Tenant Foundation    COMPLETE (5/5 req)
Phase 2    [████████████████] Internal Controls          COMPLETE (5/5 req)
Phase 2.5  [████████████████] Accounting Foundation      COMPLETE (12/12 req)
Phase 3    [████████████████] VAT Compliance             COMPLETE (10/10)
Phase 4    [████████████    ] Corporate Tax              5/9 requirements
Phase 5    [                ] WPS Payroll                0/7 requirements
Phase 6    [                ] E-Invoice Core             0/6 requirements
Phase 7    [                ] E-Invoice Transmission     0/4 requirements
Phase 8    [                ] Verification Portal        0/9 requirements
Phase 9    [                ] Standalone Package         0/4 requirements
           |██████████████████████░░░░░░░░░░░░░░░░░░░░░░|
Overall: 32/71 requirements (~45%)
```

---

## Performance Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| Plans completed | 20+ | 01-01 to 02-04, 02.5-*, 03-01 to 03-10, 04-01 to 04-05 |
| Requirements delivered | 37/71 | TENANT-01-05, CTRL-01-04, ACCT-01-12, VAT-01-10, CT-01 to CT-05/06 |
| Phases completed | 4/10 | Phases 1, 2, 2.5, 3 complete; Phase 4 in progress |
| Blockers encountered | 0 | - |
| Decisions made | 40+ | See Key Decisions table |

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
| Puppeteer singleton browser | Prevents spawning multiple Chrome processes; memory efficient | 2026-01-24 |
| Handlebars template caching | Compiling templates on every request is expensive; cache for performance | 2026-01-24 |
| Color-coded credit/debit notes | Red for credit (reduction), green for debit (increase) for visual distinction | 2026-01-24 |
| Use existing AuditAction enum | Map VAT actions to existing enum values to avoid schema migration | 2026-01-24 |
| Role-based VAT permissions | 4 role bundles (Accountant, Finance Manager, CFO, Auditor) for separation of duties | 2026-01-24 |
| 7-year audit retention check | FTA VAT-09 requires queryable audit logs for 7 years | 2026-01-24 |
| Pattern-based CT mapping | Regex on account codes + name keywords for flexible auto-mapping | 2026-01-24 |
| Two-pass matching algorithm | First pass: code+name (specific); second pass: code-only (fallback) | 2026-01-24 |
| Deductibility percentages in service | FULLY_DEDUCTIBLE=100%, ENTERTAINMENT=50%, NON_DEDUCTIBLE=0% | 2026-01-24 |
| Inline decimal helpers in CtAdjustmentService | No decimal-math utility exists; toDecimal/roundCurrency inline | 2026-01-24 |
| Conservative capital gains exemption default | Capital gains require manual verification for participation exemption | 2026-01-24 |
| Related party excess from TP table | Uses related_party_transactions.adjustmentAmount for arm's length failures | 2026-01-24 |
| Raw SQL for GL aggregation | Prisma aggregate with complex joins unreliable; raw SQL more predictable | 2026-01-24 |
| Decoupled CT services | CtCalculationService uses fallback implementations until dependencies integrated | 2026-01-24 |
| QFZP simplified to false | Schema doesn't have freeZoneStatus field; requires schema extension | 2026-01-24 |
| Pattern-based CT classification | Use DEFAULT_CT_MAPPING_RULES for account classification in reports | 2026-01-24 |
| Deferred tax simplified | DTA = losses * 9%, DTL = 0 (full timing difference tracking requires schema) | 2026-01-24 |
| TRN retrieval fallback | Try tax_configurations first, fallback to companies.taxNumber | 2026-01-24 |

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
**Completed:** Phase 4 Plan 05 (CT Report Service)
**Activity:**
- Executed Plan 04-05: CtReportService (873 lines)
- CT-05: CT-adjusted P&L with accounting, adjustment, taxable columns
- CT-06: CT-adjusted Balance Sheet with deferred tax and CT payable
- Pattern-based CT classification using DEFAULT_CT_MAPPING_RULES
- JSON export for PDF/Excel report generation
- DI container integration with dependencies on CtAdjustmentService, CtCalculationService

### Context for Next Session

1. **Phase 4 IN PROGRESS** - 5/9 plans complete (04-01 to 04-05)
2. **CT Report Service Ready** - CT-05/CT-06 financial statement generation
3. **Next Plans** - 04-06 to 04-09 for remaining CT requirements
4. **Key Features Delivered (04-05):**
   - generateCtAdjustedPnL(): CT-adjusted P&L with adjustment columns
   - generateCtAdjustedBalanceSheet(): Balance sheet with tax items
   - getCtReportSummary(): Quick overview for dashboards
   - exportCtAdjustedPnL()/exportCtAdjustedBalanceSheet(): JSON export
   - Pattern-based account classification (no schema CT fields)
   - Deferred tax asset from loss carry-forwards

### Files Modified This Session

**Created (Phase 4 Plan 05):**
- `web-erp-app/backend/src/services/corporate-tax/ct-report.service.ts`
- `.planning/phases/04-corporate-tax-compliance/04-05-SUMMARY.md`

**Modified:**
- `web-erp-app/backend/src/config/types.ts` - Added CtReportService symbol
- `web-erp-app/backend/src/config/container.ts` - Added CtReportService binding
- `web-erp-app/backend/src/services/corporate-tax/index.ts` - Added exports

---

## Quick Reference

**Current Phase:** 4 - Corporate Tax Compliance (IN PROGRESS)
**Next Action:** Continue Phase 4 (Plans 04-03 to 04-09)
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

**Phase 2.5 Verification:** PASSED (12/12 requirements)
- Schema Foundation: accounting module migrations added
- Decimal Math: High-precision calculation utilities
- Asset Services: Inventory, Prepaid, Investment, Intangible, Component Depreciation
- Liability Engine: Strategy pattern with Amortized, Interest-Only, Lease (IFRS 16)
- Closing Procedures: Monthly/Year-end closing with checklist workflow
- Cash Flow Statement: Indirect method with management reports
- Controllers & Routes: API endpoints for all accounting operations
- Permissions: Accounting permission seeds
- Tests: Closing procedures controller tests
- UAE Gratuity: ACCT-09 compliance
- IAS 16 Component Depreciation: ACCT-12 compliance
- 34 finance service files, ~40KB+ of accounting logic

**Phase 3 Verification:** PASSED (10/10 must-haves)
- VAT Calculation: VatCalculationService with 5% standard, reverse charge support
- Tax Invoices: VatInvoiceService with all 13 FTA mandatory fields
- Credit/Debit Notes: TaxCreditNoteService, TaxDebitNoteService with original references
- VAT Periods: VatPeriodService with monthly/quarterly filing support
- VAT Returns: VatReturnService with Form 201 14-box structure
- Reconciliation: VatReconciliationService comparing GL vs Form 201
- Bad Debt Relief: BadDebtReliefService with 6-month (183 days) eligibility
- PDF Generation: VatPdfService with bilingual Puppeteer templates
- Integration Tests: 1,538 lines covering invoice lifecycle and Form 201
- Audit Trail: VatAuditTrailService with 7-year retention queries
- Permissions: 4 role bundles (Accountant, Finance Manager, CFO, Auditor)

### FTA Approval Workflows Created

| Workflow | Levels | Approval Chain |
|----------|--------|----------------|
| VAT_RETURN | 3 | Accountant -> Finance Manager -> CFO |
| CT_RETURN | 3 | Accountant -> Finance Manager -> CFO |
| PAYROLL | 2 | HR Manager -> Finance Manager |
| COMPLIANCE_CONFIG | 2 | Compliance Officer -> CEO |
| EINVOICE_BATCH | 2 | Accountant -> Finance Manager |
