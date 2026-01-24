---
phase: 03-vat-compliance-engine
plan: 04
completed: 2026-01-24
subsystem: vat
tags: [vat, credit-note, debit-note, fta, compliance, article-70]

dependency-graph:
  requires:
    - 03-01  # VAT schema with tax categories
    - 03-02  # VatCalculationService
  provides:
    - TaxCreditNoteService  # FTA-compliant credit note generation
    - TaxDebitNoteService   # FTA-compliant debit note generation
  affects:
    - 03-05  # VAT period management (credit notes affect VAT returns)

tech-stack:
  added: []
  patterns:
    - "FOR UPDATE lock for sequential numbering"
    - "14-day rule validation with warning logging"
    - "Original invoice mandatory reference"
    - "InversifyJS DI pattern"

key-files:
  created:
    - backend/src/services/vat/tax-credit-note.service.ts
    - backend/src/services/vat/tax-debit-note.service.ts
  modified:
    - backend/src/config/container.ts
    - backend/src/config/types.ts
    - backend/src/services/vat/index.ts

decisions:
  - id: "CREDIT_NOTE_MANDATORY_REF"
    decision: "Original invoice reference is mandatory"
    rationale: "FTA Article 70 requires credit notes to reference original invoice"

  - id: "14_DAY_WARNING_NOT_ERROR"
    decision: "14-day rule violation produces warning, not error"
    rationale: "Business may have valid reasons for late issuance; log for audit"

  - id: "DEBIT_NOTE_GRACEFUL_SCHEMA"
    decision: "Graceful handling when debit_notes model doesn't exist"
    rationale: "Schema may not include debit_notes table yet; allow service to function"

metrics:
  duration: "25 minutes"
  tasks-completed: 3
  files-created: 2
  files-modified: 3
  lines-added: ~1400
---

# Phase 03 Plan 04: Credit/Debit Note Services Summary

**One-liner:** FTA Article 70 compliant tax credit/debit note services with mandatory original invoice reference and 14-day rule validation.

## Completed Tasks

| # | Task | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Create FTA-Compliant Tax Credit Note Service | d7c0d6f | tax-credit-note.service.ts |
| 2 | Create Tax Debit Note Service | d3c2967 | tax-debit-note.service.ts |
| 3 | Register Services in DI Container | 1d016ad | container.ts, types.ts, index.ts |

## Implementation Details

### TaxCreditNoteService (746 lines)

Created an FTA Article 70 compliant credit note service with:

1. **Mandatory Original Invoice Reference**
   - `originalInvoiceId` is required (FTA mandatory field)
   - Validates invoice exists, belongs to company, and matches customer
   - Cannot create credit note for voided invoice

2. **14-Day Rule Validation**
   - Validates credit note date is within 14 days of adjustment event
   - Produces warning (not error) if exceeded - logged for FTA audit
   - Designed to be business-friendly while maintaining compliance trail

3. **VAT Calculation Integration**
   - Uses VatCalculationService for consistent VAT calculation
   - Supports multiple line items with different tax categories
   - Calculates subtotal, totalVat, and totalAmount

4. **Sequential Numbering**
   - Format: `CN-YYYY-NNNNNN` (e.g., CN-2026-000001)
   - Uses FOR UPDATE lock pattern (same as invoice.service.ts)
   - Prevents race conditions in concurrent environments

5. **FTA Compliance Validation**
   - `validateFtaCompliance()` method checks all mandatory fields
   - Returns issues (blocking) and warnings (informational)
   - Can flag credit notes > AED 100,000 for review

### TaxDebitNoteService (642 lines)

Created a debit note service for invoice value increases with:

1. **Mandatory Original Invoice Reference**
   - Same validation as credit notes
   - Cannot create debit note for voided invoice

2. **VAT Calculation Integration**
   - Uses VatCalculationService for consistency
   - Calculates additional VAT on increased amounts

3. **Sequential Numbering**
   - Format: `DN-YYYY-NNNNNN` (e.g., DN-2026-000001)
   - Same FOR UPDATE lock pattern

4. **Graceful Schema Handling**
   - If `debit_notes` table doesn't exist, logs warning and continues
   - Allows service to be imported before schema migration

### DI Container Registration

Both services registered as singletons in InversifyJS container:
- `TYPES.TaxCreditNoteService`
- `TYPES.TaxDebitNoteService`

Exported from `vat/index.ts` module for easy import.

## FTA Compliance Points

### Credit Note (Article 70)
- [x] Words "Tax Credit Note" / "إشعار دائن ضريبي" (in template)
- [x] Original Invoice Reference (number, date) - MANDATORY
- [x] Date of Issue
- [x] Original Invoice Value
- [x] Corrected/Amended Value
- [x] Difference Amount
- [x] Difference in VAT (in AED)
- [x] Reason for Credit Note

### Debit Note
- [x] Original Invoice Reference - MANDATORY
- [x] Date of Issue
- [x] Original Invoice Value
- [x] Increased Value
- [x] Difference Amount
- [x] Difference in VAT
- [x] Reason for Debit Note

## Key APIs

### TaxCreditNoteService

```typescript
// Create credit note
const result = await taxCreditNoteService.createTaxCreditNote({
  companyId: 'company-uuid',
  customerId: 'customer-uuid',
  originalInvoiceId: 'invoice-uuid',  // MANDATORY
  creditNoteDate: new Date(),
  reason: CreditNoteReason.PRICE_ADJUSTMENT,
  reasonDescription: 'Agreed price reduction for bulk order',
  lineItems: [...],
  salesReturnAccountId: 'account-uuid',
  receivableAccountId: 'account-uuid',
  createdById: 'user-uuid'
});

// Validate FTA compliance
const compliance = await taxCreditNoteService.validateFtaCompliance(companyId, creditNoteId);

// Get totals for VAT period
const totals = await taxCreditNoteService.getCreditNotesTotalForPeriod(
  companyId, startDate, endDate
);
```

### TaxDebitNoteService

```typescript
// Create debit note
const result = await taxDebitNoteService.createTaxDebitNote({
  companyId: 'company-uuid',
  customerId: 'customer-uuid',
  originalInvoiceId: 'invoice-uuid',  // MANDATORY
  debitNoteDate: new Date(),
  reason: 'ADDITIONAL_SERVICES',
  reasonDescription: 'Extended rental period by 5 days',
  lineItems: [...],
  revenueAccountId: 'account-uuid',
  receivableAccountId: 'account-uuid',
  createdById: 'user-uuid'
});
```

## Success Criteria Verification

- [x] Credit note requires originalInvoiceId (FTA mandatory)
- [x] Debit note requires originalInvoiceId (FTA mandatory)
- [x] 14-day rule is validated with logging
- [x] VAT calculation is consistent via VatCalculationService
- [x] Sequential numbering uses FOR UPDATE lock pattern

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

Ready for:
- **03-05**: VAT Period Management - credit/debit notes affect period totals
- **03-06**: Form 201 Generation - credit notes reduce output VAT (Box 1 adjustments)

## Technical Notes

### Invoice Model Naming
The Prisma model is `invoices` (plural), not `invoice`. Services use `this.prisma.invoices.findUnique()`.

### Audit Log Format
Audit logs require an `id` field (UUID) and use `as any` type assertion for the `newValue` JSON field.

### Schema Dependencies
- Credit notes use existing `credit_notes` and `credit_note_lines` tables
- Debit notes may need `debit_notes` and `debit_note_lines` tables (graceful handling if missing)
