---
phase: 03-vat-compliance-engine
plan: 03
subsystem: vat-invoice
tags: [fta, vat, invoice, handlebars, di-container, article-59]
dependency-graph:
  requires:
    - 03-01 (FTA Invoice Schema and VAT Types)
    - 03-02 (VAT Calculation Engine)
  provides:
    - VatInvoiceService
    - Bilingual tax invoice template
    - FTA Article 59 compliance
  affects:
    - 03-04 (VAT Return Generation)
    - 03-05 (Form 201 Report)
tech-stack:
  added:
    - Handlebars templates
  patterns:
    - DI injection for service dependencies
    - FOR UPDATE lock for sequential numbering
    - Serializable transaction isolation
key-files:
  created:
    - backend/src/services/vat/vat-invoice.service.ts
    - backend/src/templates/invoice/tax-invoice.hbs
  modified:
    - backend/src/config/container.ts
    - backend/src/config/types.ts
    - backend/src/services/vat/index.ts
decisions:
  - id: VIS-01
    description: Use FOR UPDATE lock with retry logic for invoice number generation
    rationale: Prevents race conditions in concurrent invoice creation while handling deadlocks gracefully
  - id: VIS-02
    description: Integrate with VatCalculationService via DI injection
    rationale: Ensures consistent VAT calculation across all invoice types
  - id: VIS-03
    description: Bilingual template with Arabic fallback fonts
    rationale: FTA requires Arabic content; Noto Sans Arabic provides reliable rendering
metrics:
  duration: 6m 35s
  completed: 2026-01-24
---

# Phase 03 Plan 03: FTA-Compliant Tax Invoice Service Summary

**One-liner:** FTA-compliant tax invoice generation with all 13 mandatory fields, sequential numbering using FOR UPDATE lock, VatCalculationService integration, and bilingual Handlebars template.

## What Was Built

### VatInvoiceService (1085 lines)

FTA Article 59 compliant tax invoice generation service:

- **All 13 FTA Mandatory Fields:**
  1. Tax Invoice / فاتورة ضريبية designation
  2. Supplier Name (with optional Arabic)
  3. Supplier Address
  4. Supplier TRN (validated 15 digits starting with 100)
  5. Recipient Name (with optional Arabic)
  6. Recipient Address
  7. Recipient TRN (if VAT-registered)
  8. Sequential Invoice Number (TI-YYYY-NNNNNN format)
  9. Date of Issue
  10. Date of Supply (if different)
  11. Description of Goods/Services (line items)
  12. VAT Amount (per line and total)
  13. Total Amount Payable

- **Key Methods:**
  - `createTaxInvoice()` - Creates invoice with all FTA fields
  - `getTaxInvoice()` - Retrieves invoice with structured data
  - `validateFtaCompliance()` - Validates against all 13 requirements

- **Race Condition Protection:**
  - FOR UPDATE lock on invoice count query
  - Serializable transaction isolation
  - Exponential backoff retry logic (5 attempts)
  - Uniqueness double-check within transaction

- **VatCalculationService Integration:**
  - VAT calculation delegated via DI injection
  - Form 201 box assignment from calculation result
  - Reverse charge determination and statement

### Bilingual Invoice Template (592 lines)

Handlebars template for rendering FTA-compliant tax invoices:

- **Bilingual Content:**
  - Header: "TAX INVOICE" / "فاتورة ضريبية"
  - Section titles in English/Arabic
  - TRN labels in both languages
  - Footer with legal references

- **FTA Compliance Sections:**
  - Supplier details box with TRN display
  - Recipient details box with optional TRN
  - Invoice metadata (number, dates, currency)
  - Line items table with VAT breakdown
  - Totals section with subtotal/VAT/total
  - Reverse charge notice (when applicable)

- **Design Features:**
  - Print-optimized CSS
  - Responsive layout
  - Noto Sans Arabic font for Arabic text
  - Professional styling matching invoice standards

### DI Container Integration

- `TYPES.VatInvoiceService` symbol added
- Service bound as singleton
- Exports added to `vat/index.ts`

## Technical Details

### Invoice Number Format

```
TI-2026-000001
 │   │     │
 │   │     └── 6-digit sequence (per company/year)
 │   └──────── Year (from getCurrentYear())
 └──────────── Tax Invoice prefix
```

### Reverse Charge Statements

Included when `isReverseCharge: true`:

| Reason | Statement |
|--------|-----------|
| IMPORT_GOODS | Pursuant to Article 48 - Import of Goods |
| IMPORT_SERVICES | Pursuant to Article 48 - Import of Services |
| DESIGNATED_ZONE | Pursuant to Article 51 - Designated Zone Transfer |
| PRECIOUS_METALS | Pursuant to Cabinet Decision No. 25 of 2018 |

### FTA Compliance Validation

The `validateFtaCompliance()` method checks:

| Field | Check |
|-------|-------|
| Field 1 | `isTaxInvoice` flag set |
| Field 2 | Supplier name present |
| Field 3 | Supplier address present |
| Field 4 | Supplier TRN valid (15 digits, starts 100) |
| Field 5 | Recipient name present |
| Field 6 | Recipient address present |
| Field 7 | Recipient TRN format if provided |
| Field 8 | Invoice number present |
| Field 9 | Invoice date present |
| Field 11 | Line items with descriptions |
| Field 12 | VAT amount present |
| Field 13 | Total amount present |

## Files Changed

| File | Lines | Description |
|------|-------|-------------|
| `src/services/vat/vat-invoice.service.ts` | 1085 | Tax invoice service |
| `src/templates/invoice/tax-invoice.hbs` | 592 | Bilingual template |
| `src/config/types.ts` | +1 | DI type symbol |
| `src/config/container.ts` | +2 | Service binding |
| `src/services/vat/index.ts` | +13 | Module exports |

## Verification Results

All success criteria verified:

- [x] Tax invoice includes all 13 FTA-mandatory fields
- [x] Invoice number is sequential with race condition protection (FOR UPDATE)
- [x] VAT calculation delegates to VatCalculationService
- [x] Bilingual template with proper Arabic rendering
- [x] Reverse charge statement included when applicable
- [x] Service registered in DI container
- [x] vat-invoice.service.ts: 1085 lines (min: 300)
- [x] Template contains "فاتورة ضريبية" (Arabic for Tax Invoice)

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Hash | Message |
|------|---------|
| 1935e20 | feat(03-03): create VatInvoiceService for FTA-compliant tax invoices |
| 602f49e | feat(03-03): add bilingual tax invoice Handlebars template |
| 1d016ad | feat(03-03): register VatInvoiceService in DI container |

## Next Phase Readiness

Ready for subsequent plans:
- **03-04 VAT Return:** VatInvoiceService provides Form 201 box assignments
- **03-05 Form 201:** Invoice data can be aggregated for return generation
- **Credit/Debit Notes:** Pattern established for similar document services

No blockers identified.
