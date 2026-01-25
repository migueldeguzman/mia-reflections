---
phase: 07-e-invoicing-transmission
plan: 04
subsystem: einvoice-tdd
tags: [tdd, tax-data-document, einvoice, fta, pint-ae, xml-parsing]
status: complete

dependency-graph:
  requires:
    - 07-01  # E-invoice transmission schema (EInvoiceArchiveRecord)
  provides:
    - TddBuilderService for extracting TDD from PINT-AE XML
    - TaxDataDocument type structure for FTA reporting
    - TDD validation with error codes (TDD-001 to TDD-999)
    - TRN validation (100\d{12} regex)
  affects:
    - 07-05  # MLS Handler (will use TDD for status tracking)
    - 07-06  # Transmission Queue (will include TDD in transmission)
    - 07-08  # Export Service (may export TDD for auditing)

tech-stack:
  added:
    - fast-xml-parser (XMLParser with removeNSPrefix for PINT-AE)
  patterns:
    - Service with @injectable() for DI
    - Result object pattern (TddBuildResult with success/tdd/errors/warnings)
    - XPath-like nested value extraction
    - SHA-256 hash calculation for invoice integrity

file-tracking:
  created:
    - web-erp-app/backend/src/services/einvoice/tdd/tdd.types.ts (403 lines)
    - web-erp-app/backend/src/services/einvoice/tdd/tdd-builder.service.ts (777 lines)
    - web-erp-app/backend/src/services/einvoice/tdd/index.ts (38 lines)
    - web-erp-app/backend/src/services/einvoice/tdd/__tests__/tdd-builder.service.test.ts (830 lines)
  modified: []

decisions:
  - id: tdd-xpath-extraction
    decision: Use fast-xml-parser with removeNSPrefix for PINT-AE parsing
    rationale: Removes namespace prefixes for easier field access without XPath queries
  - id: tdd-result-pattern
    decision: Return TddBuildResult with success/tdd/errors/warnings
    rationale: Allows graceful handling of partial success with warnings
  - id: tdd-trn-validation
    decision: Validate TRN with regex /^100\d{12}$/
    rationale: UAE TRNs must be 15 digits starting with 100

metrics:
  duration: "35 minutes"
  completed: 2026-01-25
---

# Phase 7 Plan 04: TDD Builder Service Summary

TDD Builder Service created for extracting tax-relevant data from PINT-AE e-invoices for FTA reporting per EINV-07 requirement.

## One-liner

TDD Builder Service extracts FTA-mandatory tax fields from PINT-AE XML using fast-xml-parser with TRN validation and SHA-256 hashing.

## What Was Built

### Task 1: TDD Type Definitions (tdd.types.ts)

Created comprehensive type definitions for Tax Data Documents:

**Enums:**
- `TddDocumentType`: INVOICE, CREDIT_NOTE, DEBIT_NOTE
- `TddTransactionType`: STANDARD, REVERSE_CHARGE, EXEMPT, ZERO_RATED, OUT_OF_SCOPE
- `TddTaxCategoryCode`: S (Standard), Z (Zero), E (Exempt), O (Out of scope), AE (Reverse charge)

**Interfaces:**
- `TddSupplier`: TRN (mandatory), name, address, country code
- `TddBuyer`: TRN (optional for B2C), name, country code
- `TddAmounts`: Currency, tax exclusive/inclusive, payable amounts
- `TddTaxSubtotal`: Category code, taxable amount, tax amount, percent
- `TddClassification`: Transaction type, reverse charge, free zone, export flags
- `TaxDataDocument`: Main TDD structure with all FTA-mandatory fields
- `TddBuildResult`: Result pattern with success/tdd/errors/warnings

**Constants:**
- `TDD_XPATH_MAPPINGS`: XPath-like mappings for PINT-AE field extraction
- `TDD_ERROR_CODES`: Error codes TDD-001 through TDD-999
- `UAE_TRN_REGEX`: `/^100\d{12}$/` for TRN validation
- `INVOICE_TYPE_CODES`: 380, 381, 383, 384, 389

### Task 2: TDD Builder Service (tdd-builder.service.ts)

Created `TddBuilderService` with @injectable() decorator:

**Public Methods:**
- `buildFromArchive(archive, options)`: Builds TDD from EInvoiceArchiveRecord
- `buildFromXml(xml, metadata, options)`: Builds TDD from raw XML with metadata

**Private Extraction Methods:**
- `extractSupplier()`: Extracts TRN, name, address with validation
- `extractBuyer()`: Extracts buyer info, warns if TRN missing for B2B
- `extractAmounts()`: Extracts tax exclusive/inclusive, payable amounts
- `extractTaxBreakdown()`: Extracts tax subtotals with category codes
- `determineClassification()`: Detects reverse charge, exempt, zero-rated
- `extractBillingReferences()`: Extracts original invoice references

**Utility Methods:**
- `extractTrn()`: Gets TRN from PartyTaxScheme
- `extractLegalName()`: Gets name from PartyLegalEntity or PartyName
- `extractAddress()`: Gets street, city, postal code, emirate
- `mapTaxCategory()`: Maps category ID to TddTaxCategoryCode
- `calculateHash()`: SHA-256 hex hash of content
- `getNestedValue()`: Dot notation path extraction
- `getString()`, `getNumber()`, `extractAmount()`: Type-safe value extraction

**Error Handling:**
- TDD-001: Invalid XML (no Invoice/CreditNote root)
- TDD-010: Missing AccountingSupplierParty
- TDD-011: Missing supplier TRN
- TDD-012: Invalid TRN format
- TDD-020: Missing AccountingCustomerParty
- TDD-021: Missing buyer TRN (warning for B2C)
- TDD-030: Missing TaxExclusiveAmount
- TDD-040: Missing TaxTotal (warning)
- TDD-999: Unexpected error

### Task 3: Unit Tests (tdd-builder.service.test.ts)

Created 34 comprehensive unit tests:

**Test Categories:**
- Happy Path (12 tests): Invoice extraction, supplier/buyer, amounts, tax breakdown
- Credit Notes (4 tests): Document type detection, billing references
- Validation Errors (5 tests): Missing TRN, invalid format, invalid XML
- Tax Categories (4 tests): S, Z, E, O, AE detection
- buildFromXml (3 tests): Raw XML processing, options
- Serialization (3 tests): JSON stringify/parse, date format
- Edge Cases (3 tests): Missing TaxTotal, unique ID, timestamp

**Test Helpers:**
- `createValidInvoiceXml(overrides)`: Generates PINT-AE Invoice XML
- `createValidCreditNoteXml(originalInvoice, overrides)`: Generates Credit Note XML
- `createMockArchive(xml, overrides)`: Creates mock EInvoiceArchiveRecord

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 52c8271 | feat | Create TDD type definitions |
| cae8047 | feat | Create TDD builder service |
| 6c9853d | test | Add TDD builder unit tests |

## Test Results

```
PASS src/services/einvoice/tdd/__tests__/tdd-builder.service.test.ts
  TddBuilderService
    buildFromArchive - Happy Path (12 tests)
    buildFromArchive - Credit Notes (4 tests)
    buildFromArchive - Validation Errors (5 tests)
    buildFromArchive - Tax Categories (4 tests)
    buildFromXml (3 tests)
    TDD serialization (3 tests)
    Edge cases (3 tests)

Test Suites: 1 passed, 1 total
Tests:       34 passed, 34 total
Time:        0.419 s
```

## Success Criteria Verification

| Criterion | Status | Evidence |
|-----------|--------|----------|
| TddBuilderService.buildFromArchive() parses PINT-AE XML | PASS | 34 passing tests |
| Supplier TRN extracted and validated | PASS | TDD-011/TDD-012 error tests |
| Tax breakdown includes category codes | PASS | Tax category tests |
| Classification detects transaction types | PASS | S, Z, E, O, AE detection tests |
| Credit notes extract billing references | PASS | Credit note tests with BillingReference |
| Invoice hash (SHA-256) included | PASS | Hash calculation test (64 chars hex) |
| TDD serializable to JSON | PASS | Serialization tests |
| Unit tests cover extraction/validation | PASS | 34 tests across all scenarios |

## Key Files

```
web-erp-app/backend/src/services/einvoice/tdd/
  tdd.types.ts              # 403 lines - Type definitions
  tdd-builder.service.ts    # 777 lines - Builder service
  index.ts                  # 38 lines - Module exports
  __tests__/
    tdd-builder.service.test.ts  # 830 lines - Unit tests
```

## Usage Example

```typescript
import { TddBuilderService } from './tdd';

const tddBuilder = new TddBuilderService();

// From archive
const result = tddBuilder.buildFromArchive(archive, {
  reportedBy: 'SENDER_ASP',
});

if (result.success) {
  console.log('TDD:', result.tdd);
  console.log('Supplier TRN:', result.tdd.supplier.trn);
  console.log('Tax Amount:', result.tdd.amounts.taxAmount);
} else {
  console.error('Errors:', result.errors);
}

// From raw XML
const xmlResult = tddBuilder.buildFromXml(xmlContent, {
  archiveId: 'archive-001',
  einvoiceNumber: 'EI-INV-001',
  companyId: 'company-001',
});
```

## Next Phase Readiness

Ready for:
- **07-05 (MLS Handler)**: TDD structure available for status tracking
- **07-06 (Transmission Queue)**: TddBuilderService can be called before transmission
- **07-08 (Export Service)**: TDD can be exported for auditing

No blockers for subsequent plans.
