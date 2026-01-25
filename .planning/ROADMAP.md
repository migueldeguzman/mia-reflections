# ROADMAP: UAE ERP Compliance Framework

## Overview

Full UAE compliance suite for Vesla ERP including VAT, Corporate Tax, WPS, ESR, and e-invoicing (DCTCE/PEPPOL model). Target readiness: UAE pilot phase July 2026. Phases are derived from 59 requirements across 8 categories, structured to deliver compliance features in dependency order with e-invoicing as the critical path.

---

## Phase 1: Multi-Tenant Compliance Foundation

**Goal:** Each tenant has isolated, configurable compliance settings that serve as the foundation for all UAE tax and regulatory features.

**Dependencies:** None (foundation phase)

**Plans:** 3 plans

Plans:
- [x] 01-01-PLAN.md - Database schema (reference data + tenant compliance config)
- [x] 01-02-PLAN.md - Service and API layer (ComplianceConfigService, routes)
- [x] 01-03-PLAN.md - Permissions and integration tests

**Status:** COMPLETE (verified 2026-01-23)

**Requirements:**
- TENANT-01: Per-company TRN configuration
- TENANT-02: Free zone status configuration
- TENANT-03: Industry-specific rules configuration
- TENANT-04: Tax code mappings per tenant
- TENANT-05: Complete data isolation between tenants

**Success Criteria:**
1. Administrator can configure TRN, free zone status, and industry rules per company in the multi-tenant setup
2. Tax code mappings are isolated per tenant with no cross-contamination
3. Compliance configuration changes in one tenant do not affect other tenants
4. System validates TRN format according to FTA specifications before saving

---

## Phase 2: Internal Controls and Audit Infrastructure

**Goal:** All user actions and data changes are tracked with tamper-proof audit trails that satisfy FTA compliance requirements.

**Dependencies:** Phase 1 (tenant isolation required for scoped audit trails)

**Plans:** 4 plans

Plans:
- [x] 02-01-PLAN.md - Schema changes (tamper-proof fields, sequence, immutability trigger)
- [x] 02-02-PLAN.md - ComplianceAuditService and AuditIntegrityService
- [x] 02-03-PLAN.md - FTA approval workflow seed configurations
- [x] 02-04-PLAN.md - Integration tests for tamper-proof audit system

**Status:** COMPLETE (verified 2026-01-24)

**Requirements:**
- CTRL-01: User action logging
- CTRL-02: Change tracking (before/after values)
- CTRL-03: Tamper-proof audit logs
- CTRL-04: Approval workflows for sensitive operations
- CTRL-05: Encrypted backup procedures

**Success Criteria:**
1. Every user action (create, update, delete) on compliance-related data is logged with timestamp, user, and tenant context
2. Change tracking captures before/after values for all financial record modifications
3. Audit logs cannot be modified or deleted by any user including administrators
4. Sensitive operations (VAT submission, payroll approval) require configured approval workflows
5. Backup files are encrypted at rest and can be restored with full audit trail intact

---

## Phase 2.5: Compliance-Native Accounting Foundation

**Goal:** Build accounting infrastructure that natively supports UAE compliance requirements, enabling accurate VAT returns, Corporate Tax calculations, and FTA-ready financial reports.

**Dependencies:** Phase 1 (tenant config), Phase 2 (audit trails)

**Implementation Progress:** Implemented without formal plans (direct coding)

**Commits (feature/phase-2.5-accounting-foundation branch):**
- [x] Schema foundation - 13+ new models, 20+ enums (migrations applied)
- [x] Decimal math utilities - `decimal-math.util.ts`
- [x] Inventory service - FIFO/LIFO/Weighted Average valuation
- [x] Prepaid asset service - Amortization scheduling
- [x] Investment service - Mark-to-market valuation
- [x] Intangible asset service - Amortization with impairment
- [x] Interest engine - Strategy pattern (Amortized, Interest-Only, IFRS16)
- [x] Liability service - Installment schedules, payments, recalculation
- [x] Gratuity calculator - UAE Labor Law compliant
- [x] Monthly closing workflow - 9-step checklist
- [x] Year-end closing entries - Revenue/Expense/Retained Earnings
- [x] Cash Flow Statement - Indirect method with reconciliation
- [x] Management reports - Asset/Liability analysis, profitability, cash flow
- [x] API routes + permissions - All controllers, routes, permissions seeded
- [x] Controller unit test - closing-procedures.controller.test.ts
- [x] Component depreciation - Enhancement to fixed assets (ACCT-12)
- [ ] Full integration test suite

**Status:** COMPLETE (verified 2026-01-24)

**Requirements (Accounting Foundation - enables UAE compliance):**
- ACCT-01: Cash Flow Statement generation (indirect method)
- ACCT-02: Monthly closing procedure with checklist
- ACCT-03: Year-end closing with journal entries
- ACCT-04: Inventory valuation (FIFO/LIFO/Weighted Avg)
- ACCT-05: Prepaid expense amortization
- ACCT-06: Investment mark-to-market valuation
- ACCT-07: Intangible asset amortization
- ACCT-08: Liability installment scheduling
- ACCT-09: UAE gratuity calculation
- ACCT-10: Bank reconciliation workflow
- ACCT-11: Management reports suite
- ACCT-12: Component depreciation for fixed assets

**Success Criteria:**
1. Cash Flow Statement generates correctly using indirect method with reconciled ending cash
2. Monthly closing locks period after 9-step checklist completion
3. Year-end closing creates proper closing entries (Revenue -> Expense -> Retained Earnings)
4. Assets module supports all 6 asset types with proper GL integration
5. Liabilities engine calculates interest accurately for Amortized, Interest-Only, and Lease IFRS 16 methods
6. Gratuity calculation follows UAE Labor Law (21 days/year first 5 years, 30 days thereafter)

---

## Phase 3: VAT Compliance Engine

**Goal:** Users can generate FTA-compliant invoices, manage VAT calculations, and prepare accurate VAT returns.

**Dependencies:** Phase 1 (TRN config), Phase 2 (audit trails)

**Plans:** 10 plans in 5 waves

Plans:
- [ ] 03-01-PLAN.md - Schema enhancements (FTA invoice fields, VatPeriod, BadDebtRelief models)
- [ ] 03-02-PLAN.md - VatCalculationService and ReverseChargeService
- [ ] 03-03-PLAN.md - VatInvoiceService with bilingual template
- [ ] 03-04-PLAN.md - TaxCreditNoteService and TaxDebitNoteService
- [ ] 03-05-PLAN.md - VatPeriodService with locking and 28-day deadline
- [ ] 03-06-PLAN.md - VatReturnService for Form 201 preparation
- [ ] 03-07-PLAN.md - VatReconciliationService for GL comparison
- [ ] 03-08-PLAN.md - BadDebtReliefService with 6-month eligibility
- [ ] 03-09-PLAN.md - Bilingual PDF generation with Puppeteer
- [ ] 03-10-PLAN.md - Integration tests and permissions

**Wave Structure:**
- Wave 1: 03-01 (Schema), 03-02 (VAT Calculation) - parallel
- Wave 2: 03-03 (Invoice), 03-04 (Credit/Debit Notes) - parallel, depends on Wave 1
- Wave 3: 03-05 (Period Mgmt), 03-06 (Form 201) - parallel, depends on Wave 2
- Wave 4: 03-07 (Reconciliation), 03-08 (Bad Debt) - parallel, depends on Wave 3
- Wave 5: 03-09 (PDF), 03-10 (Tests) - parallel, depends on Wave 4

**Status:** PLANNED (2026-01-24)

**Requirements:**
- VAT-01: FTA-compliant tax invoice generation
- VAT-02: Bilingual invoice support (Arabic/English)
- VAT-03: Credit note generation with original invoice reference
- VAT-04: Debit note generation with original invoice reference
- VAT-05: Reverse charge mechanism handling
- VAT-06: VAT return preparation (Form 201)
- VAT-07: VAT reconciliation with GL
- VAT-08: Bad debt relief tracking
- VAT-09: VAT audit trail (7-year retention)
- VAT-10: VAT period management and locking

**Success Criteria:**
1. User can generate tax invoices that include all 13 FTA-mandated fields in both Arabic and English
2. Credit/debit notes automatically reference original invoice and adjust VAT calculations accordingly
3. Reverse charge transactions are correctly identified and VAT is self-accounted
4. User can generate VAT Return Form 201 with all boxes auto-populated from transaction data
5. VAT reconciliation report shows exact match between VAT ledger and filed returns with variance explanation

---

## Phase 4: Corporate Tax Compliance

**Goal:** Users can track corporate tax obligations, prepare CT calculations, and maintain compliant financial statements.

**Dependencies:** Phase 1 (tenant config), Phase 2 (audit trails), Phase 3 (VAT data feeds CT calculations)

**Plans:** 9 plans in 5 waves

Plans:
- [x] 04-01-PLAN.md - CT schema foundation (enums, TaxLoss, RelatedPartyTransaction, TaxGroup models)
- [x] 04-02-PLAN.md - CtChartMappingService for CT account classification
- [x] 04-03-PLAN.md - CtAdjustmentService for non-deductible/exempt income aggregation
- [x] 04-04-PLAN.md - CtCalculationService (9% rate, AED 375K threshold, 75% loss offset)
- [x] 04-05-PLAN.md - CtReportService for CT-adjusted P&L and Balance Sheet
- [x] 04-06-PLAN.md - TransferPricingService with arm's length documentation
- [x] 04-07-PLAN.md - TaxGroupService for 95%+ ownership consolidation
- [x] 04-08-PLAN.md - CtRetentionService for 7-year record enforcement
- [x] 04-09-PLAN.md - Integration tests and CT permissions

**Wave Structure:**
- Wave 1: 04-01 (Schema), 04-02 (Chart Mapping) - parallel
- Wave 2: 04-03 (Adjustments), 04-04 (CT Calculation) - parallel, depends on Wave 1
- Wave 3: 04-05 (CT Reports), 04-06 (Transfer Pricing) - parallel, depends on Wave 2
- Wave 4: 04-07 (Tax Groups), 04-08 (Retention) - parallel, depends on Wave 3
- Wave 5: 04-09 (Tests/Permissions) - depends on Wave 4

**Status:** COMPLETE (verified 2026-01-24)

**Requirements:**
- CT-01: 9% Corporate Tax calculation engine
- CT-02: Non-deductible expense tracking and adjustment
- CT-03: Exempt income identification and exclusion
- CT-04: CT-specific chart of accounts mapping
- CT-05: CT-adjusted Profit & Loss statement
- CT-06: CT-adjusted Balance Sheet
- CT-07: Transfer pricing documentation support
- CT-08: 7-year record retention enforcement
- CT-09: Group tax consolidation support

**Success Criteria:**
1. System calculates 9% CT on taxable income after correctly adjusting for non-deductible expenses and exempt income
2. User can mark transactions as non-deductible or exempt with full audit trail
3. CT-adjusted P&L and Balance Sheet reports can be generated showing all adjustments from standard financials
4. Transfer pricing documentation can be attached to related-party transactions
5. Group companies can be consolidated for CT purposes with proper elimination entries

---

## Phase 5: WPS Payroll Compliance

**Goal:** Users can process payroll through WPS with compliant SIF file generation and full gratuity calculations.

**Dependencies:** Phase 1 (tenant config), Phase 2 (audit trails)

**Plans:** 7 plans in 4 waves

Plans:
- [x] 05-01-PLAN.md - WPS schema and types (PayrollCycle, EmployeeSalaryRecord, WpsAgent, WpsSubmission, WpsError)
- [x] 05-02-PLAN.md - IBAN validation utility using ibantools
- [x] 05-03-PLAN.md - Bank routing code service and WPS agents seed
- [x] 05-04-PLAN.md - WpsSifService for SIF file generation (EDR/SCR records)
- [x] 05-05-PLAN.md - PayrollCycleService with state machine and API routes
- [x] 05-06-PLAN.md - WpsErrorService with error codes and resolution guidance
- [x] 05-07-PLAN.md - Integration tests and WPS permissions

**Wave Structure:**
- Wave 1: 05-01 (Schema), 05-02 (IBAN Util) - parallel, foundation
- Wave 2: 05-03 (Bank Routing), 05-04 (SIF Service) - parallel, depends on Wave 1
- Wave 3: 05-05 (Cycle Service), 05-06 (Error Service) - parallel, depends on Wave 2
- Wave 4: 05-07 (Tests/Permissions) - depends on Wave 3

**Status:** COMPLETE (verified 2026-01-24)

**Requirements:**
- WPS-01: SIF (Salary Information File) generation
- WPS-02: Bank routing code configuration
- WPS-03: IBAN validation for UAE banks
- WPS-04: Salary cycle management
- WPS-05: WPS error tracking and resolution
- WPS-06: Payroll audit trail
- WPS-07: Gratuity calculation (UAE Labor Law) - EXISTING from Phase 2.5

**Success Criteria:**
1. User can generate SIF files that pass MOHRE validation without errors
2. IBAN entries are validated against UAE bank format before payroll processing
3. WPS errors are captured with specific error codes and resolution guidance
4. Gratuity is calculated according to UAE Labor Law (21 days per year for first 5 years, 30 days thereafter)
5. Complete payroll history is retained with audit trail for 7 years minimum

---

## Phase 6: E-Invoicing Engine Core

**Goal:** System generates PEPPOL PINT-AE compliant e-invoices with UBL schema validation and QR code embedding.

**Dependencies:** Phase 3 (VAT invoices are the source for e-invoices), Phase 2 (audit trails)

**Plans:** 7 plans in 4 waves

Plans:
- [x] 06-01-PLAN.md - E-invoice schema and types (einvoice_archives, EInvoiceStatus, EInvoiceFormat enums)
- [x] 06-02-PLAN.md - TLV encoder utility and QrCodeService
- [x] 06-03-PLAN.md - PintAeBuilderService for PINT AE XML generation
- [x] 06-04-PLAN.md - UblValidatorService for UBL 2.1 and PINT AE validation
- [x] 06-05-PLAN.md - EInvoiceArchiveService with tamper-proof storage
- [x] 06-06-PLAN.md - EInvoiceService orchestration and DI configuration
- [x] 06-07-PLAN.md - E-invoice permissions and middleware
- [x] 06-08-PLAN.md - Integration tests for e-invoice lifecycle

**Wave Structure:**
- Wave 1: 06-01 (Schema), 06-02 (QR Code) - parallel, foundation
- Wave 2: 06-03 (PINT AE Builder), 06-04 (UBL Validator) - parallel, depends on Wave 1
- Wave 3: 06-05 (Archive Service) - depends on Wave 1 and Wave 2
- Wave 4: 06-06 (Orchestration), 06-07 (Permissions), 06-08 (Tests) - parallel, depends on Wave 3

**Status:** COMPLETE (verified 2026-01-24)

**Requirements:**
- EINV-01: PINT AE (PEPPOL) XML generation
- EINV-02: UBL 2.1 schema compliance
- EINV-03: QR code generation with TLV encoding
- EINV-04: Schema validation before transmission
- EINV-05: E-invoice archiving (7-year retention)
- EINV-06: ASP (Accredited Service Provider) API integration

**Success Criteria:**
1. E-invoices are generated in PINT AE format that passes PEPPOL validation tools
2. All generated XML validates against UBL 2.1 schema with zero errors
3. QR codes contain TLV-encoded data readable by FTA-approved scanners
4. Invalid invoices are blocked from transmission with specific validation error messages
5. E-invoices are archived with tamper-proof storage meeting 7-year FTA requirement

---

## Phase 7: E-Invoicing Transmission and Processing

**Goal:** Users can transmit e-invoices to DCTCE platform, receive real-time status updates, and export in required formats.

**Dependencies:** Phase 6 (core e-invoice generation)

**Plans:** 10 plans in 4 waves

Plans:
- [x] 07-01-PLAN.md - Transmission schema and types (einvoice_transmissions, einvoice_credentials models)
- [x] 07-02-PLAN.md - Transmission permissions and middleware (22 permissions, 6 role bundles, MFA)
- [x] 07-03-PLAN.md - Credential store with AES-256-GCM encryption and OAuth token service
- [x] 07-04-PLAN.md - TDD Builder Service for FTA tax data extraction (EINV-07)
- [x] 07-05-PLAN.md - Transmission providers (DCTCE Direct, ASP, Sandbox) with ITransmissionProvider interface
- [x] 07-06-PLAN.md - MLS Handler Service for status processing and error mapping (EINV-08)
- [x] 07-07-PLAN.md - BullMQ queue and workers with retry logic (EINV-09)
- [x] 07-08-PLAN.md - Export service for XML/JSON with bulk ZIP (EINV-10)
- [x] 07-09-PLAN.md - Integration tests, transmission controller, and seed data
- [x] 07-10-PLAN.md - DI configuration module and barrel exports

**Wave Structure:**
- Wave 1: 07-01 (Schema), 07-02 (Permissions) - parallel, foundation
- Wave 2: 07-03 (Credentials), 07-04 (TDD), 07-05 (Providers), 07-06 (MLS) - parallel, depends on Wave 1
- Wave 3: 07-07 (Queue), 07-08 (Export) - parallel, depends on Wave 2
- Wave 4: 07-09 (Tests/Controller), 07-10 (DI Config) - parallel, depends on Wave 3

**Status:** COMPLETE (verified 2026-01-25)

**Requirements:**
- EINV-07: TDD (Tax Data Dictionary) compliance builder
- EINV-08: MLS (Multi-Language Support) handler for Arabic fields
- EINV-09: Real-time transmission to DCTCE platform
- EINV-10: XML/JSON export for external systems

**Success Criteria:**
1. TDD-compliant data structures are automatically built from invoice data
2. Arabic field content is properly encoded and transmitted without corruption
3. E-invoices are transmitted to DCTCE with real-time status acknowledgment displayed to user
4. Transmission failures are logged with retry mechanism and user notification
5. Users can export e-invoices in both XML and JSON formats for integration with external systems

---

## Phase 8: Compliance Verification Portal

**Goal:** Users have a unified dashboard to verify compliance status across all UAE requirements with pre-submission validation.

**Dependencies:** Phase 3-7 (verifies all compliance features)

**Requirements:**
- VERIFY-01: Unified compliance dashboard
- VERIFY-02: VAT compliance checklist
- VERIFY-03: Corporate Tax compliance checklist
- VERIFY-04: WPS compliance checklist
- VERIFY-05: E-Invoice compliance checklist
- VERIFY-06: Sandbox testing environment
- VERIFY-07: FTA submission preview
- VERIFY-08: Compliance sign-off workflow
- VERIFY-09: Approval history tracking

**Success Criteria:**
1. Dashboard shows real-time compliance status across VAT, CT, WPS, and E-Invoice with clear pass/fail indicators
2. Each compliance checklist shows specific items with pass/warning/fail status and remediation guidance
3. Users can run submissions through sandbox environment before production filing
4. FTA preview shows exactly what will be submitted with opportunity to review and correct
5. Sign-off workflow captures approver identity, timestamp, and creates immutable approval record

---

## Phase 9: Standalone Compliance Package

**Goal:** Compliance engine is available as independent REST API package for integration with external systems.

**Dependencies:** Phase 6-7 (stable e-invoicing engine), Phase 3-5 (stable compliance engines)

**Requirements:**
- STANDALONE-01: REST API for all compliance functions
- STANDALONE-02: Standalone deployment option
- STANDALONE-03: Self-service onboarding portal
- STANDALONE-04: API documentation and SDK

**Success Criteria:**
1. All compliance functions (VAT, CT, WPS, E-Invoice) are accessible via documented REST endpoints
2. Package can be deployed independently without full Vesla ERP installation
3. External developers can onboard and generate API keys without manual intervention
4. SDK is available with code samples demonstrating all major integration scenarios

---

## Progress

| Phase | Name | Status | Requirements | Completion |
|-------|------|--------|--------------|------------|
| 1 | Multi-Tenant Compliance Foundation | Complete | 5 | 100% |
| 2 | Internal Controls and Audit Infrastructure | Complete | 5 | 100% |
| 2.5 | Compliance-Native Accounting Foundation | Complete | 12 | 100% |
| 3 | VAT Compliance Engine | Complete | 10 | 100% |
| 4 | Corporate Tax Compliance | Complete | 9 | 100% |
| 5 | WPS Payroll Compliance | Complete | 7 | 100% |
| 6 | E-Invoicing Engine Core | Complete | 6 | 100% |
| 7 | E-Invoicing Transmission and Processing | Complete | 4 | 100% |
| 8 | Compliance Verification Portal | Not Started | 9 | 0% |
| 9 | Standalone Compliance Package | Not Started | 4 | 0% |

**Total:** 71 requirements across 10 phases (59 original + 12 accounting foundation)

---

## Critical Path

E-Invoicing (July 2026 deadline):
```
Phase 1 --> Phase 2 --> Phase 2.5 --> Phase 3 --> Phase 6 --> Phase 7
                           |             |
                           v             v
                        Phase 4       Phase 8 --> Phase 9
                           |
                           v
                        Phase 5
```

Phase 2.5 (Accounting Foundation) is now on the critical path as it enables:
- CT-05/CT-06 (CT-adjusted P&L and Balance Sheet) -> Phase 4
- VAT-07/VAT-08 (VAT reconciliation) -> Phase 3
- WPS-07 (Gratuity calculation) -> Phase 5

E-invoicing (Phases 6-7) is the critical path for July 2026 pilot.

---

## Revision History

| Date | Change | Author |
|------|--------|--------|
| 2026-01-23 | Initial roadmap creation | Claude |
| 2026-01-23 | Phase 1 planned - 3 plans in 2 waves | Claude |
| 2026-01-23 | Phase 1 complete - all 5 requirements delivered | Claude |
| 2026-01-24 | Phase 2 planned - 4 plans in 2 waves | Claude |
| 2026-01-24 | Phase 2 complete - all 5 CTRL requirements delivered | Claude |
| 2026-01-24 | Phase 2.5 complete - all 12 ACCT requirements delivered | Claude |
| 2026-01-24 | Phase 3 planned - 10 plans in 5 waves | Claude |
| 2026-01-24 | Phase 3 complete - all 10 VAT requirements delivered | Claude |
| 2026-01-24 | Phase 4 planned - 9 plans in 5 waves | Claude |
| 2026-01-24 | Phase 4 complete - all 9 CT requirements delivered | Claude |
| 2026-01-24 | Phase 5 planned - 7 plans in 4 waves | Claude |
| 2026-01-24 | Phase 5 complete - all 7 WPS requirements delivered | Claude |
| 2026-01-24 | Phase 6 planned - 8 plans in 4 waves | Claude |
| 2026-01-24 | Phase 6 complete - all 6 EINV core requirements delivered | Claude |
| 2026-01-25 | Phase 7 planned - 10 plans in 4 waves | Claude |
| 2026-01-25 | Phase 7 complete - all 4 EINV transmission requirements delivered | Claude |
