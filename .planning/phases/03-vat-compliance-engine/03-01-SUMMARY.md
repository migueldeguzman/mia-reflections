---
phase: 03-vat-compliance-engine
plan: 01
subsystem: VAT Compliance
tags: [fta, vat, invoice, prisma, typescript]
completed: 2026-01-24
duration: 7m
dependency-graph:
  requires: []
  provides: [fta-invoice-schema, vat-types, vat-period-model, bad-debt-relief-model, debit-note-model]
  affects: [03-02-PLAN, 03-03-PLAN, 03-04-PLAN]
tech-stack:
  added: []
  patterns: [fta-compliance, form-201-mapping]
key-files:
  created:
    - backend/src/types/vat.types.ts
    - backend/prisma/migrations/20260124144027_fta_invoice_fields/migration.sql
  modified:
    - backend/prisma/schema.prisma
decisions:
  - key: vat-transaction-type-enum
    choice: 6-value enum matching FTA Form 201 boxes
    rationale: Direct mapping to FTA return simplifies compliance
  - key: reverse-charge-scenarios
    choice: 4 scenarios per FTA regulations
    rationale: Covers imports, designated zones, and precious metals
  - key: vat-period-caching
    choice: Optional cached totals on VatPeriod model
    rationale: Avoids recalculation on demand while allowing refresh
metrics:
  tasks-completed: 3
  tasks-total: 3
  files-created: 2
  files-modified: 1
---

# Phase 03 Plan 01: FTA Invoice Schema and VAT Types Summary

Enhanced invoice schema with FTA-mandatory fields and created comprehensive VAT infrastructure.

## What Was Built

### 1. Invoice FTA Enhancements

Extended the `invoices` model with all 13 FTA-mandatory fields per Article 59:

**Supplier Details (Fields 2-4):**
- `supplierNameArabic` - Arabic name for bilingual requirement
- `supplierAddress` - Full supplier address
- `supplierTrn` - Tax Registration Number (15 digits)

**Recipient Details (Fields 5-7):**
- `recipientNameArabic` - Arabic name for bilingual requirement
- `recipientAddress` - Full recipient address
- `recipientTrn` - Recipient TRN if VAT-registered

**Invoice Details (Fields 8-10):**
- `supplyDate` - Date of supply if different from invoice date
- `isTaxInvoice` - Whether this is a full tax invoice
- `isSimplified` - Whether simplified invoice (under AED 10,000)

**VAT Classification:**
- `vatTransactionType` - Maps to Form 201 boxes
- `isReverseCharge` - Flag for self-accounting
- `reverseChargeReason` - Scenario for reverse charge
- `form201Box` - Explicit box number reference
- `emirateCode` - For emirate-level reporting

**Foreign Currency:**
- `originalCurrency` - Original transaction currency
- `exchangeRate` - Exchange rate to AED
- `originalAmount` - Amount in original currency

### 2. VAT Enums

Created 5 new enums matching FTA terminology:

- **VatTransactionType:** STANDARD_RATED, ZERO_RATED, EXEMPT, OUT_OF_SCOPE, REVERSE_CHARGE, IMPORTS
- **ReverseChargeReason:** IMPORT_GOODS, IMPORT_SERVICES, DESIGNATED_ZONE, PRECIOUS_METALS
- **VatPeriodStatus:** OPEN, CLOSED, FILED, AMENDED
- **BadDebtReliefStatus:** PENDING, ELIGIBLE, CLAIMED, RECOVERED, REVERSED
- **FilingFrequency:** MONTHLY, QUARTERLY

### 3. VatPeriod Model

For VAT return preparation and filing:

```prisma
model VatPeriod {
  id              String
  companyId       String
  periodNumber    String          // "2026-Q1"
  startDate       DateTime
  endDate         DateTime
  filingFrequency FilingFrequency
  dueDate         DateTime
  status          VatPeriodStatus

  // Cached totals
  totalOutputVat  Decimal?
  totalInputVat   Decimal?
  netVatPayable   Decimal?

  // Filing info
  filedAt         DateTime?
  ftaReferenceNumber String?
}
```

### 4. BadDebtRelief Model

Tracks the 6-month requirement for VAT relief:

- Links to original invoice
- Tracks due date and 6-month eligibility window
- Monitors written-off and notification status (FTA requirements)
- Tracks recovery for relief reversal

### 5. DebitNote Model

For invoice value increases:

- References original invoice (FTA mandatory)
- Separate line items table
- Full workflow status tracking
- Journal entry integration ready

### 6. TypeScript Types

Comprehensive types in `vat.types.ts`:

- **TaxInvoiceData:** All 13 FTA fields with line items
- **Form201Data:** Boxes 1-14 with emirate breakdown
- **VatCalculationResult:** Breakdown by category
- **EMIRATES_CODES:** Constants for all 7 emirates
- **FTA_FORM_201_BOXES:** Constants for box numbers

## Technical Details

### Schema Changes

```
+400 lines added to schema.prisma
- 5 new enums
- 17 new fields on Invoice model
- 3 new models (VatPeriod, BadDebtRelief, DebitNote)
- 1 new model (DebitNoteLine)
- Updated Company, User, Customer relations
```

### Migration File

Created `20260124144027_fta_invoice_fields/migration.sql`:
- Creates all new enums
- Alters invoices table with FTA fields
- Creates new tables with proper indexes
- Sets up foreign key constraints

### TypeScript Exports

The `vat.types.ts` file exports:
- 12 interfaces/types for VAT operations
- 2 constant objects (EMIRATES_CODES, FTA_FORM_201_BOXES)
- 1 VAT_RATES constant

## Verification Results

| Check | Result |
|-------|--------|
| `npx prisma validate` | Schema valid |
| `npx prisma format` | Formatted in 88ms |
| `npx prisma generate` | Client generated |
| TypeScript exports | 31 exports verified |

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Hash | Message |
|------|---------|
| c11fbe2 | feat(03-01): add FTA-mandatory invoice fields and VAT models |
| c4540e6 | feat(03-01): add comprehensive VAT TypeScript types |
| c08b88f | chore(03-01): add FTA invoice fields migration |

## Next Phase Readiness

The foundation is set for:

- **03-02:** VatCalculationService can use `VatTransactionType` and `ReverseChargeReason`
- **03-03:** Form201Service can use `Form201Data` interface and box mapping
- **03-04:** BadDebtReliefService can use `BadDebtRelief` model and status enum
- **03-05:** DebitNoteService can use `DebitNote` model with line items

All types are exported and ready for import by subsequent services.
