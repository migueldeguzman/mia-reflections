---
phase: 06-e-invoicing-engine-core
plan: 03
subsystem: e-invoicing
tags: [ubl-21, pint-ae, xml-builder, qr-code, fast-xml-parser]

# Dependency graph
requires: [06-01, 06-02]
provides: [PINT AE XML generation, Credit note XML, QR code embedding]
affects: [06-04, 06-05, 06-06, 06-07, 06-08]

# Tech tracking
tech-stack:
  added: []
  patterns: [UBL 2.1 namespace handling, XML builder pattern, Tax category mapping]

# File tracking
key-files:
  created:
    - backend/src/services/einvoice/pint-ae-builder.service.ts
    - backend/src/services/einvoice/__tests__/pint-ae-builder.service.test.ts
  modified:
    - backend/src/services/einvoice/index.ts

# Decisions
decisions:
  - id: fast-xml-parser-builder
    choice: Use XMLBuilder from fast-xml-parser for XML generation
    rationale: Already available from AWS SDK dependency, performant

# Metrics
metrics:
  duration: ~8 minutes
  completed: 2026-01-24
---

# Phase 06 Plan 03: PINT AE XML Builder Service Summary

**One-liner:** PintAeBuilderService transforms TaxInvoiceData into PEPPOL PINT-AE compliant UBL 2.1 XML with QR code embedding in cac:AdditionalDocumentReference.

## What Was Built

### PintAeBuilderService

Core service for generating UAE FTA-compliant e-invoice XML documents:

**Invoice XML Generation:**
- `buildInvoiceXml(invoice, qrCodeBase64?)` - Generates standard invoice XML
- Complete UBL 2.1 namespace declarations (Invoice, CAC, CBC)
- PINT AE CustomizationID: `urn:peppol:pint:billing-1@ae-1.0.1`
- ProfileID: `urn:peppol:bis:billing`

**Credit Note XML Generation:**
- `buildCreditNoteXml(creditNote, originalInvoiceNumber, qrCodeBase64?)` - Generates credit note XML
- CreditNote namespace instead of Invoice namespace
- BillingReference with InvoiceDocumentReference to original invoice
- Uses CreditedQuantity instead of InvoicedQuantity

**QR Code Embedding:**
- Embedded in `cac:AdditionalDocumentReference` element
- DocumentTypeCode = "QR" per UBL 2.1 spec
- Base64 PNG in `cbc:EmbeddedDocumentBinaryObject`
- mimeCode = "image/png", filename = "qrcode.png"

**PINT AE Mandatory Fields Mapped:**
- IBT-001: Invoice number (cbc:ID)
- IBT-002: Issue date (cbc:IssueDate - YYYY-MM-DD format)
- IBT-003: Invoice type code (380 for invoice, 381 for credit note)
- IBT-005: Document currency code (always AED for UAE)
- IBT-023: Profile ID
- IBT-024: Customization ID
- IBT-027: Seller name
- IBT-029: Seller identifier (TRN with AEUAE-TRN scheme)
- IBT-031: Seller VAT identifier
- IBT-034: Seller electronic address (AEUAE scheme)
- IBG-04: AccountingSupplierParty (complete party structure)
- IBG-07: AccountingCustomerParty (complete party structure)
- IBG-22: TaxTotal with TaxSubtotal
- IBG-23: LegalMonetaryTotal
- IBG-25: InvoiceLine with complete item details

**Tax Categories Supported:**
- S (Standard rate - 5%)
- Z (Zero rate)
- AE (Reverse charge - VAT due by buyer)
- E (Exempt - available in constants)

## Technical Implementation

### XML Builder Configuration
```typescript
const xmlBuilder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  format: true,
  indentBy: '  ',
  suppressEmptyNode: true,
  suppressBooleanAttributes: false,
});
```

### Key Constants
```typescript
const UBL_NAMESPACES = {
  INVOICE: 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
  CREDIT_NOTE: 'urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2',
  CAC: 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
  CBC: 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
};
```

## Files Created/Modified

| File | Action | Purpose |
|------|--------|---------|
| `backend/src/services/einvoice/pint-ae-builder.service.ts` | Created | PINT AE XML builder service |
| `backend/src/services/einvoice/__tests__/pint-ae-builder.service.test.ts` | Created | 45 unit tests |
| `backend/src/services/einvoice/index.ts` | Modified | Export new service |

## Test Coverage

| Category | Tests | Status |
|----------|-------|--------|
| Invoice XML Generation | 22 | PASS |
| QR Code Embedding | 6 | PASS |
| Credit Note XML | 5 | PASS |
| XML Validation Patterns | 8 | PASS |
| Line Numbering | 2 | PASS |
| Item Classification | 2 | PASS |
| **Total** | **45** | **ALL PASS** |

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 9774d20 | feat | Implement PINT AE XML builder service |
| 577c7ed | test | Add PINT AE Builder unit tests |

## Verification Results

| Criterion | Status |
|-----------|--------|
| XML output includes correct UBL 2.1 namespace declarations | PASS |
| CustomizationID contains PINT AE specification identifier | PASS |
| DocumentCurrencyCode is always AED for UAE invoices | PASS |
| Supplier TRN uses AEUAE-TRN scheme identifier | PASS |
| Invoice line items are correctly numbered and calculated | PASS |
| QR code data is embedded in cac:AdditionalDocumentReference element | PASS |

## Deviations from Plan

None - plan executed exactly as written.

## Integration Points

**Depends on (from Phase 6):**
- `einvoice.types.ts` - TaxInvoiceData, PINT_AE_CONSTANTS
- `qr-code.service.ts` - QR code generation (Base64 output for embedding)

**Provides to (future plans):**
- Plan 06-04: E-invoice archive service will use this for XML generation
- Plan 06-05: Validation service will validate generated XML
- Plan 06-06: E-invoice generation controller orchestrates this service

## Next Phase Readiness

**Ready for:** Plan 06-04 (E-Invoice Archive Service)

**Prerequisites met:**
- PintAeBuilderService available for XML generation
- QrCodeService available for QR generation
- Both services can be composed for complete e-invoice generation

## Usage Example

```typescript
import { PintAeBuilderService } from './pint-ae-builder.service';
import { QrCodeService } from './qr-code.service';

const pintAeBuilder = new PintAeBuilderService();
const qrCodeService = new QrCodeService();

// Generate QR code
const qrResult = await qrCodeService.generateQrCodeForXml({
  sellerName: taxInvoice.supplierName,
  sellerTrn: taxInvoice.supplierTrn,
  timestamp: taxInvoice.invoiceDate,
  invoiceTotal: taxInvoice.totalAmount.toFixed(2),
  vatTotal: taxInvoice.vatAmount.toFixed(2),
});

// Build XML with embedded QR
const xml = pintAeBuilder.buildInvoiceXml(taxInvoice, qrResult.data);
```
