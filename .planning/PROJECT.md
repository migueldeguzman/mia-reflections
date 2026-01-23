# PROJECT: UAE ERP Compliance Framework

## What This Is

A comprehensive UAE regulatory compliance layer for Vesla ERP, enabling full compliance with Federal Tax Authority (FTA) requirements including VAT, Corporate Tax, WPS Payroll, ESR, and the upcoming mandatory e-invoicing system (DCTCE/PEPPOL model). The compliance engine is designed as a modular core that serves both the integrated ERP and as a standalone e-invoicing package for external systems.

## Why It Matters

**Regulatory Imperative:** UAE has been rapidly tightening financial regulations since 2023. Non-compliant ERP systems expose businesses to:
- FTA penalties (up to AED 50,000 per VAT violation)
- Failed audits and operational disruptions
- Inability to participate in UAE's mandatory e-invoicing pilot (July 2026) and mandatory phase (January 2027)

**Business Opportunity:** First-mover advantage in UAE e-invoicing readiness positions Vesla ERP as the compliance-ready choice for UAE businesses across all major industries.

## Core Value

**Primary:** Enable UAE businesses to be fully compliant with FTA regulations through a single, integrated ERP platform.

**Secondary:** Provide a standalone e-invoicing solution for businesses with existing ERPs who need to meet UAE's DCTCE/PEPPOL e-invoicing requirements.

## Success Criteria

1. **VAT Compliance:** FTA-approved invoice generation with Arabic support, reverse charge mechanism, automated VAT returns, complete audit trails
2. **Corporate Tax:** 9% CT calculations, taxable income engine, exempt income classification, 7-year record retention
3. **WPS Payroll:** SIF file generation in compliant format, bank routing codes, IBAN validation
4. **E-Invoicing:** PINT AE format (XML/UBL), ASP integration APIs, Tax Data Document (TDD) generation, Message Level Status (MLS) handling
5. **Multi-Tenant Config:** Per-company compliance settings (VAT registration, free zone status, industry rules)
6. **Audit Trail:** Tamper-proof transaction logs, who/what/when tracking, non-editable invoice history

## Target Industries

- **Trading & Distribution:** Import/export, customs codes, duty tracking, multi-warehouse
- **Services & Consulting:** Project billing, time tracking, professional services
- **Retail & F&B:** POS integration, inventory, multi-branch
- **Construction:** Job costing, retention, milestone billing, subcontractor compliance
- **Real Estate:** Property transactions, lease management
- **Investments:** Portfolio tracking, regulatory reporting
- **Rent-a-Car:** Existing business domain in Vesla ERP
- **Leasing:** Asset management, depreciation, lease accounting

## Constraints

- **Timeline:** Ready for UAE e-invoicing pilot (July 2026)
- **Existing Stack:** Must integrate with Express.js backend, Prisma ORM, PostgreSQL (Neon), React frontend
- **Multi-Tenant:** All compliance features must respect existing company-scoped data isolation
- **Arabic:** Leverage existing Arabic support in the ERP
- **Dual Product Strategy:** Compliance core must work both integrated (Vesla ERP) and standalone (external ERPs)
- **ASP Path:** Architecture must support future FTA accreditation as Accredited Service Provider

## Technical Context

### Existing System (Validated)

The `web-erp-app` provides:
- **Architecture:** Express.js backend + React frontend + Prisma ORM + PostgreSQL
- **Multi-Tenant:** Company-scoped data isolation with pack-role permissions
- **Authentication:** Dual auth (customers vs employees), JWT tokens
- **Storage:** AWS S3 for documents, Neon PostgreSQL for data
- **Payments:** CC Avenue integration
- **Notifications:** Nodemailer for email, Expo for push
- **Monitoring:** Sentry, Winston logging
- **Arabic:** Full Arabic/RTL support already implemented

### What Needs Building

1. **Compliance Configuration Module**
   - Per-tenant settings (VAT registration, TRN, free zone status)
   - Industry-specific rules engine
   - Tax code mappings

2. **VAT Engine**
   - FTA-compliant invoice generation
   - Reverse charge mechanism for imports/designated zones
   - VAT return preparation and reconciliation
   - Tax credit/debit note management
   - Invoice sequencing per FTA requirements

3. **Corporate Tax Engine**
   - Taxable income calculation with adjustments
   - Exempt income classification
   - CT-mapped chart of accounts
   - Transfer pricing documentation
   - 7-year record retention

4. **WPS Payroll Module**
   - SIF (Salary Information File) generation
   - Bank routing code compliance
   - Employee IBAN validation
   - WPS error tracking and resolution

5. **E-Invoicing Engine (DCTCE/PEPPOL)**
   - PINT AE format generator (XML/UBL)
   - QR code generation for invoices
   - ASP integration APIs (Corner 2/Corner 3)
   - Tax Data Document (TDD) builder
   - Message Level Status (MLS) handler
   - Real-time validation and reporting
   - Secure transmission infrastructure

6. **Audit Trail System**
   - Tamper-proof transaction logging
   - User action tracking (who/when/what)
   - Previous vs new value recording
   - Non-editable invoice history
   - Cloud backup and encrypted storage

7. **Standalone E-Invoicing Package**
   - Configurable build for external ERPs
   - API-first design for integration
   - Self-service onboarding

## UAE E-Invoicing Model Reference

### DCTCE (Decentralized Continuous Transaction Control and Exchange)

The UAE's e-invoicing model follows a 5-Corner PEPPOL architecture:

```
Corner 1 (C1): Supplier → submits invoice to their ASP
Corner 2 (C2): Supplier's ASP → validates, converts to XML, transmits
Corner 3 (C3): Buyer's ASP → receives, validates, forwards
Corner 4 (C4): Buyer → receives invoice
Corner 5 (C5): FTA → receives Tax Data Documents (TDD) from C2 and C3
```

### Process Flow

1. Supplier submits e-invoice data (PINT AE) to their ASP (C2)
2. C2 validates and converts to UAE standard XML format
3. C2 transmits to Buyer's ASP (C3)
4. C2 reports Tax Data Document (TDD) to FTA (C5)
5. C3 validates and sends Message Level Status (MLS) to C2
6. C3 submits invoice to Buyer (C4)
7. C3 reports TDD to FTA (C5)
8. C5 sends MLS confirmations to both C2 and C3

### Timeline

- **July 2026:** Pilot phase begins
- **January 2027:** Mandatory phase begins for applicable businesses

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Modular compliance core | Enables both integrated ERP and standalone product | Pending |
| PEPPOL-aligned architecture | Future-proofs for UAE's expected e-invoicing model | Pending |
| ASP integration + accreditation path | Start with ASP integration, architect for becoming ASP | Pending |
| Per-tenant compliance config | Different companies have different VAT registrations, free zone status | Pending |
| XML/UBL dual format support | PINT AE standard requires XML, JSON optional | Pending |

## Requirements

### Validated

- ✓ Multi-tenant architecture with company-scoped isolation — existing
- ✓ JWT authentication (dual auth customers/employees) — existing
- ✓ Pack-role permission system — existing
- ✓ Basic VAT calculations — existing (needs upgrade to FTA compliance)
- ✓ Arabic/RTL support — existing
- ✓ Document storage (AWS S3) — existing
- ✓ PostgreSQL database with Prisma ORM — existing
- ✓ Email notifications — existing
- ✓ Error tracking and logging — existing

### Active

**VAT Compliance**
- [ ] FTA-approved tax invoice format
- [ ] Arabic/English bilingual invoice generation
- [ ] Correct invoice sequencing (non-editable)
- [ ] Tax credit/debit note functionality
- [ ] Reverse charge mechanism support
- [ ] VAT return report generation
- [ ] Bad debt relief adjustments
- [ ] Complete audit trail for VAT transactions

**Corporate Tax**
- [ ] Taxable income calculation engine
- [ ] Non-deductible expense tracking
- [ ] Exempt income classification
- [ ] CT-mapped chart of accounts
- [ ] CT-ready P&L and balance sheet
- [ ] Transfer pricing documentation
- [ ] 7-year record retention capability

**WPS Payroll**
- [ ] SIF file generation
- [ ] Bank routing code compliance
- [ ] Employee IBAN validation
- [ ] Salary cycle mapping
- [ ] WPS error tracking and resolution

**E-Invoicing Engine**
- [ ] PINT AE format (XML/UBL) generation
- [ ] QR code generation on invoices
- [ ] ASP integration APIs
- [ ] Tax Data Document (TDD) builder
- [ ] Message Level Status (MLS) handler
- [ ] Real-time validation
- [ ] Secure transmission infrastructure
- [ ] Invoice archiving (5+ year retention)

**Internal Controls**
- [ ] User action logging (who/when/what)
- [ ] Previous vs new value tracking
- [ ] Approval workflow enforcement
- [ ] Non-editable transaction history
- [ ] Tamper-proof invoice logs

**Compliance Verification Portal (UAT)**
- [ ] Accounts team verification dashboard
- [ ] VAT compliance checklist with pass/fail indicators
- [ ] E-invoicing compliance checklist
- [ ] Corporate Tax compliance checklist
- [ ] WPS compliance checklist
- [ ] Test transaction capability (sandbox mode)
- [ ] Sample invoice generation and validation
- [ ] Audit trail verification tests
- [ ] FTA format validation preview
- [ ] Checkpoint-based review workflow
- [ ] Sign-off mechanism for compliance approval

**Multi-Tenant Compliance Config**
- [ ] Per-company VAT registration and TRN
- [ ] Free zone status configuration
- [ ] Industry-specific rule sets
- [ ] Tax code mappings per tenant

**Standalone E-Invoicing Package**
- [ ] Configurable build for external ERPs
- [ ] API-first integration design
- [ ] Self-service onboarding flow
- [ ] Documentation and SDK

### Out of Scope

- Healthcare-specific compliance (HIPAA-like requirements) — future milestone
- Insurance integration — future milestone
- Customs portal direct integration — requires government partnership
- ASP accreditation process itself — depends on FTA opening applications

## Open Questions

1. Which ASPs should we prioritize for integration? (SAP, Zoho, others available in UAE?)
2. What's the exact PINT AE schema version UAE will mandate?
3. Will there be a sandbox/testing environment from FTA before pilot?
4. What's the penalty structure for e-invoicing non-compliance?

---
*Last updated: 2026-01-23 after initialization*
