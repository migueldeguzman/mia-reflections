# Requirements: UAE ERP Compliance Framework

## v1 Requirements

### VAT Compliance

- [ ] **VAT-01**: User can generate FTA-approved tax invoices with all required fields (TRN, sequential number, dates, line items, VAT breakdown)
- [ ] **VAT-02**: User can generate bilingual invoices (Arabic/English) meeting FTA audit requirements
- [ ] **VAT-03**: System enforces non-editable sequential invoice numbering per FTA requirements
- [ ] **VAT-04**: User can create tax credit notes with proper linkage to original invoices
- [ ] **VAT-05**: User can create tax debit notes with proper linkage to original invoices
- [ ] **VAT-06**: System applies reverse charge mechanism for imports and designated zone transactions
- [ ] **VAT-07**: User can generate VAT return reports with input/output VAT summary
- [ ] **VAT-08**: User can run VAT reconciliation reports with complete audit trails
- [ ] **VAT-09**: User can apply bad debt relief adjustments for VAT recovery on unpaid invoices
- [ ] **VAT-10**: System maintains complete tamper-proof audit trail for all VAT transactions

### Corporate Tax

- [ ] **CT-01**: System calculates taxable income with 9% CT rate on profits exceeding AED 375,000
- [ ] **CT-02**: User can classify and track non-deductible expenses (entertainment, fines, penalties)
- [ ] **CT-03**: User can classify and track exempt income (dividends, qualifying capital gains)
- [ ] **CT-04**: System provides CT-mapped chart of accounts aligned with FTA reporting categories
- [ ] **CT-05**: User can generate CT-ready Profit & Loss statement
- [ ] **CT-06**: User can generate CT-ready Balance Sheet
- [ ] **CT-07**: User can maintain transfer pricing documentation for intercompany transactions
- [ ] **CT-08**: System retains all financial records for 7 years per FTA requirement
- [ ] **CT-09**: System supports group tax framework for multi-company CT consolidation

### WPS Payroll

- [ ] **WPS-01**: User can generate SIF (Salary Information File) in UAE-compliant format
- [ ] **WPS-02**: System validates bank routing codes per UAE banking guidelines
- [ ] **WPS-03**: System validates employee IBAN format and structure
- [ ] **WPS-04**: User can configure salary cycles (monthly, weekly, bi-weekly)
- [ ] **WPS-05**: System tracks WPS file submission errors and resolution status
- [ ] **WPS-06**: User can generate payroll audit reports with complete transaction history
- [ ] **WPS-07**: System calculates employee gratuity (end of service benefits) per UAE labor law

### E-Invoicing Engine

- [ ] **EINV-01**: System generates invoices in PINT AE format (XML structure)
- [ ] **EINV-02**: System generates invoices in UBL format as alternative
- [ ] **EINV-03**: System generates QR codes on invoices for machine-readable verification
- [ ] **EINV-04**: System validates invoices against FTA compliance rules before submission
- [ ] **EINV-05**: System archives all invoices digitally for minimum 5 years
- [ ] **EINV-06**: System provides APIs for integration with Accredited Service Providers (ASPs)
- [ ] **EINV-07**: System builds Tax Data Documents (TDD) for FTA reporting
- [ ] **EINV-08**: System handles Message Level Status (MLS) responses from ASPs and FTA
- [ ] **EINV-09**: System supports real-time secure transmission of invoices
- [ ] **EINV-10**: User can export invoices as XML and JSON files for external processing

### Internal Controls & Audit Trail

- [ ] **CTRL-01**: System logs all user actions with who/when/what details
- [ ] **CTRL-02**: System tracks previous vs new values for all data changes
- [ ] **CTRL-03**: System maintains non-editable transaction history (tamper-proof logs)
- [ ] **CTRL-04**: System enforces approval workflows for key financial transactions
- [ ] **CTRL-05**: System provides cloud backup with encrypted storage

### Compliance Verification Portal

- [ ] **VERIFY-01**: Accounts team can access compliance verification dashboard
- [ ] **VERIFY-02**: Dashboard displays VAT compliance checklist with pass/fail indicators
- [ ] **VERIFY-03**: Dashboard displays Corporate Tax compliance checklist with pass/fail indicators
- [ ] **VERIFY-04**: Dashboard displays WPS compliance checklist with pass/fail indicators
- [ ] **VERIFY-05**: Dashboard displays E-Invoicing compliance checklist with pass/fail indicators
- [ ] **VERIFY-06**: User can generate test transactions in sandbox mode
- [ ] **VERIFY-07**: User can preview and validate FTA format before submission
- [ ] **VERIFY-08**: Accounts team can sign off on compliance checkpoints
- [ ] **VERIFY-09**: System maintains compliance approval history

### Multi-Tenant Compliance Configuration

- [ ] **TENANT-01**: Each company can configure its own VAT registration number (TRN)
- [ ] **TENANT-02**: Each company can configure its free zone status (affects VAT treatment)
- [ ] **TENANT-03**: Each company can select industry-specific compliance rule sets
- [ ] **TENANT-04**: Each company can configure custom tax code mappings
- [ ] **TENANT-05**: System enforces company-scoped compliance data isolation

### Standalone E-Invoicing Package

- [ ] **STANDALONE-01**: E-invoicing engine exposed via REST API for external ERP integration
- [ ] **STANDALONE-02**: Package can be deployed as standalone product (separate from Vesla ERP)
- [ ] **STANDALONE-03**: External customers can self-onboard without developer support
- [ ] **STANDALONE-04**: API documentation and SDK provided for integrators

---

## v2 Requirements (Deferred)

### ESR & UBO
- Economic Substance Regulations tracking
- Ultimate Beneficial Ownership documentation
- Activity-based income reporting

### Customs & Free Zone
- Import/export code management
- Customs documentation generation
- Duty exemption tracking
- Free zone billing structure support
- Direct customs portal integration

### Advanced Features
- AI-powered anomaly detection
- Predictive compliance alerts
- Healthcare-specific compliance
- Insurance integration

---

## Out of Scope

| Exclusion | Reason |
|-----------|--------|
| ASP accreditation process | Depends on FTA opening applications; architecture supports it |
| Direct customs portal integration | Requires government partnership |
| Healthcare compliance (HIPAA-like) | Industry-specific, future milestone |
| Insurance system integration | Industry-specific, future milestone |
| Real-time FTA portal integration | Awaiting FTA sandbox availability |

---

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| VAT-01 to VAT-10 | TBD | Pending |
| CT-01 to CT-09 | TBD | Pending |
| WPS-01 to WPS-07 | TBD | Pending |
| EINV-01 to EINV-10 | TBD | Pending |
| CTRL-01 to CTRL-05 | TBD | Pending |
| VERIFY-01 to VERIFY-09 | TBD | Pending |
| TENANT-01 to TENANT-05 | TBD | Pending |
| STANDALONE-01 to STANDALONE-04 | TBD | Pending |

---

## Summary

| Category | Count |
|----------|-------|
| VAT Compliance | 10 |
| Corporate Tax | 9 |
| WPS Payroll | 7 |
| E-Invoicing Engine | 10 |
| Internal Controls | 5 |
| Compliance Verification | 9 |
| Multi-Tenant Config | 5 |
| Standalone Package | 4 |
| **Total v1 Requirements** | **59** |

---
*Requirements defined: 2026-01-23*
