---
phase: 08-compliance-verification
plan: 04
status: complete
subsystem: compliance-portal
tags: [preview, form-201, vat, ct, wps, einvoice, verification]
dependency_graph:
  requires: ["08-01", "08-02"]
  provides: ["CompliancePreviewService", "FTA submission preview"]
  affects: ["08-05", "08-06", "08-07"]
tech_stack:
  added: []
  patterns: ["preview generation", "HTML rendering", "validation messages"]
key_files:
  created:
    - web-erp-app/backend/src/services/compliance-portal/compliance-preview.service.ts
  modified:
    - web-erp-app/backend/src/services/compliance-portal/index.ts
decisions:
  - id: preview-html-rendering
    choice: "Inline HTML generation with inline styles"
    rationale: "Portable preview that works in any context without CSS dependencies"
  - id: iban-masking
    choice: "Show only last 4 digits of IBAN"
    rationale: "Security best practice while still allowing employee identification"
  - id: xml-truncation
    choice: "Truncate XML display to 5000 characters"
    rationale: "Balance between showing content and performance/readability"
  - id: validation-severity
    choice: "Three levels: ERROR, WARNING, INFO"
    rationale: "Matches FTA reporting patterns and allows actionable guidance"
metrics:
  duration: "~15 minutes"
  completed: "2026-01-25"
  lines_of_code: 1006
  commits: 2
---

# Phase 08 Plan 04: Compliance Preview Service Summary

**One-liner:** CompliancePreviewService generating FTA submission previews for VAT Form 201, CT Return, WPS SIF, and PINT-AE XML with validation status.

## What Was Built

### CompliancePreviewService (1006 lines)

The CompliancePreviewService implements VERIFY-07 (FTA submission preview), allowing users to see exactly what will be submitted to FTA before final sign-off.

**Core Capabilities:**

1. **generatePreview()** - Main entry point accepting domain (VAT/CT/WPS/EINVOICE), periodId, and returns SubmissionPreviewData

2. **VAT Form 201 Preview:**
   - All 14 boxes per FTA Form 201 structure
   - Box 1-5: Output tax (standard rated, zero rated, exempt, reverse charge, adjustments)
   - Box 6: Total output tax due
   - Box 7-10: Input tax (expenses, zero rated, recoverable reverse charge, adjustments)
   - Box 11: Total input tax recoverable
   - Box 12-14: Net VAT calculation
   - TRN validation (15 digits starting with 100)
   - Filing deadline calculation (28 days after period end)

3. **Corporate Tax Return Preview:**
   - Accounting income from journal entries
   - Non-deductible adjustments placeholder
   - Exempt income placeholder
   - Small business threshold (AED 375,000)
   - 9% tax rate on income above threshold
   - Filing deadline (9 months after period end)

4. **WPS SIF File Preview:**
   - Employee list with Person Codes (14-digit MOHRE identifier)
   - IBANs (masked for security - last 4 digits only)
   - Salary breakdown (basic, allowances, deductions, net)
   - Total salary and employee count
   - First 20 employees shown with "more" indicator

5. **E-Invoice PINT-AE Preview:**
   - Invoice number and document type
   - Supplier/Recipient TRN
   - Total amount and VAT
   - Expandable XML content (truncated to 5000 chars)
   - PINT_AE_XML format identifier

**Validation System:**

Each preview includes validation with three severity levels:
- **ERROR:** Blocks submission (invalid TRN, missing XML, invalid Person Codes)
- **WARNING:** Submission possible but review needed (deadline passed, missing config)
- **INFO:** Informational (nil returns, no recipient TRN for B2C)

**Preview Summary:**

Every preview includes a summary with:
- Total records count
- Total amount
- Total tax
- Filing deadline

### Barrel Export Update

Updated `index.ts` to export:
- CompliancePreviewService
- CHECK_DEFINITIONS and TOTAL_CHECKS (from 08-03)
- Preview-related types from central types file

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| HTML rendering | Inline styles | Portable preview works without CSS dependencies |
| IBAN display | Mask to last 4 digits | Security while allowing identification |
| XML truncation | 5000 characters | Balance content visibility and performance |
| Validation levels | ERROR/WARNING/INFO | Matches FTA patterns, enables actionable guidance |
| Date calculations | Manual arithmetic | Avoid moment.js dependency, simple calculations |

## Success Criteria Verification

| Criteria | Status | Evidence |
|----------|--------|----------|
| VAT Form 201 shows all 14 boxes | PASS | Lines 49-62, 238-255 define all boxes |
| CT Return shows accounting to tax calculation | PASS | Lines 447-471 implement full calculation |
| WPS SIF shows Person Codes and IBANs | PASS | Lines 629-642, 699-700 handle codes/IBANs |
| E-Invoice shows PINT-AE with XML option | PASS | Lines 899-902 provide expandable XML |
| Validation status and messages | PASS | Lines 268-283 etc. in each domain |
| Summary with counts and deadline | PASS | Lines 277-280, 485-488, 672-675, 860-863 |

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Hash | Message | Files |
|------|---------|-------|
| adb44e0 | feat(08-04): create CompliancePreviewService | compliance-preview.service.ts, check-definitions/* |
| c23ae52 | chore(08-04): update barrel export | index.ts |

## Files Created/Modified

**Created:**
- `web-erp-app/backend/src/services/compliance-portal/compliance-preview.service.ts` (1006 lines)

**Modified:**
- `web-erp-app/backend/src/services/compliance-portal/index.ts`

## Integration Points

**Uses:**
- PrismaClient via TYPES.PrismaClient injection
- Types from `compliance-portal.types.ts` (SubmissionPreviewData, ValidationMessage, etc.)

**Used By:**
- Will be used by ComplianceSignOffService (08-06) for preview snapshots
- Will be used by CompliancePortalController (08-07) for API endpoints

## Next Phase Readiness

Plan 08-04 complete. Next plans can proceed:
- **08-05:** ComplianceSandboxService - can use preview data for sandbox testing
- **08-06:** ComplianceSignOffService - will snapshot previews for sign-off records
- **08-07:** CompliancePortalController - will expose preview generation via API
