---
phase: 06-e-invoicing-engine-core
plan: 04
subsystem: e-invoicing
tags: [ubl-21, pint-ae, xml-validation, schema-validation, trn-validation]

# Dependency graph
requires: [06-01]
provides: [UBL 2.1 schema validation, PINT-AE business rule validation]
affects: [06-05, 06-06, 06-07, 06-08]

# Tech tracking
tech-stack:
  added: []
  patterns: [Regex-based XML parsing, Rule-based validation, Context-aware element extraction]

# File tracking
key-files:
  created:
    - backend/src/services/einvoice/ubl-validator.service.ts
    - backend/src/services/einvoice/__tests__/ubl-validator.service.test.ts
    - backend/src/schemas/ubl/README.md
  modified:
    - backend/src/services/einvoice/index.ts

# Decisions
decisions:
  - id: regex-xml-parsing
    choice: Use regex-based XML parsing instead of full DOM parser
    rationale: Lightweight, no external dependencies, sufficient for PINT-AE subset
  - id: header-extraction
    choice: Extract invoice header section separately for context-aware ID extraction
    rationale: Prevents line item IDs from being mistaken for invoice ID
  - id: schema-on-init
    choice: Load validation rules once at service initialization
    rationale: Avoids per-request rule compilation overhead

# Metrics
metrics:
  duration: ~15 minutes
  completed: 2026-01-24
---

# Phase 06 Plan 04: UBL 2.1 Schema Validator Summary

**One-liner:** UblValidatorService validates e-invoice XML against UBL 2.1 structure and 12 PINT-AE business rules with element-path error reporting.

## What Was Built

### UblValidatorService

Core validation service for ensuring FTA compliance before e-invoice archival or transmission:

**Main Methods:**
- `validateInvoice(xml)` - Full validation against all rules, returns EInvoiceValidationResult
- `validateBatch(invoices[])` - Batch validation for multiple documents
- `hasValidStructure(xml)` - Quick structural check without full validation
- `getRules()` - Returns list of all validation rules with descriptions

**PINT-AE Business Rules (12 rules):**
| Code | Description |
|------|-------------|
| PINT-AE-001 | CustomizationID must be `urn:peppol:pint:billing-1@ae-1.0.1` |
| PINT-AE-002 | ProfileID must be `urn:peppol:bis:billing` |
| PINT-AE-003 | DocumentCurrencyCode must be `AED` |
| PINT-AE-004 | Invoice ID is required |
| PINT-AE-005 | IssueDate is required and must be YYYY-MM-DD format |
| PINT-AE-006 | Supplier TRN is required |
| PINT-AE-007 | Supplier TRN must be 15 digits starting with 100 |
| PINT-AE-008 | Supplier name is required |
| PINT-AE-009 | Buyer name is required |
| PINT-AE-010 | Tax scheme must be VAT |
| PINT-AE-011 | Tax total must be present |
| PINT-AE-012 | At least one invoice line is required |

**UBL Structure Rules (4 rules):**
| Code | Description |
|------|-------------|
| UBL-001 | UBL 2.1 namespace must be present |
| UBL-002 | Root element must be Invoice |
| UBL-003 | LegalMonetaryTotal with PayableAmount is required |
| UBL-004 | Invoice lines must have ID, quantity, and item name |

**Error Reporting:**
- Each error includes: code, message, element path, severity
- Element paths use XPath-like notation: `/Invoice/cbc:CustomizationID`
- Actual vs expected values included in messages
- Multiple errors reported when multiple rules fail

## Technical Implementation

### Rule Initialization (Schema loaded once)
```typescript
constructor() {
  // Rules compiled at service creation, not per-request
  this.rules = this.initializeRules();
  this.patterns = this.initializePatterns();
}
```

### Context-Aware Header Extraction
```typescript
private extractInvoiceHeader(xml: string): string {
  // Extract content between <Invoice> and first <cac:> element
  // Ensures invoice ID is extracted, not line item IDs
  const match = xml.match(/<(?:\w+:)?Invoice[^>]*>([\s\S]*?)(?=<(?:\w+:)?(?:cac:|AccountingSupplierParty))/i);
  return match ? match[1] : xml;
}
```

### Validation Result Structure
```typescript
interface EInvoiceValidationResult {
  valid: boolean;
  errors: EInvoiceValidationError[];
  warnings: EInvoiceValidationError[];
  validatedAt: Date;
}

interface EInvoiceValidationError {
  code: string;
  message: string;
  element?: string;
  line?: number;
  severity: 'error' | 'warning';
}
```

## Files Created/Modified

| File | Action | Purpose |
|------|--------|---------|
| `backend/src/services/einvoice/ubl-validator.service.ts` | Created | UBL 2.1 + PINT-AE validator |
| `backend/src/services/einvoice/__tests__/ubl-validator.service.test.ts` | Created | 54 unit tests |
| `backend/src/schemas/ubl/README.md` | Created | Schema documentation |
| `backend/src/services/einvoice/index.ts` | Modified | Export new service |

## Test Coverage

| Category | Tests | Status |
|----------|-------|--------|
| Initialization | 4 | PASS |
| Valid Invoice Validation | 3 | PASS |
| CustomizationID (PINT-AE-001) | 2 | PASS |
| ProfileID (PINT-AE-002) | 2 | PASS |
| DocumentCurrencyCode (PINT-AE-003) | 2 | PASS |
| Invoice ID (PINT-AE-004) | 2 | PASS |
| IssueDate (PINT-AE-005) | 4 | PASS |
| Supplier TRN (PINT-AE-006/007) | 6 | PASS |
| Supplier Name (PINT-AE-008) | 1 | PASS |
| Buyer Name (PINT-AE-009) | 1 | PASS |
| Tax Scheme (PINT-AE-010) | 1 | PASS |
| Tax Total (PINT-AE-011) | 1 | PASS |
| Invoice Lines (PINT-AE-012) | 1 | PASS |
| UBL Namespace (UBL-001) | 1 | PASS |
| Root Element (UBL-002) | 1 | PASS |
| Monetary Total (UBL-003) | 1 | PASS |
| Line Structure (UBL-004) | 2 | PASS |
| Malformed XML Handling | 3 | PASS |
| Batch Validation | 2 | PASS |
| hasValidStructure | 3 | PASS |
| Error Message Quality | 3 | PASS |
| Performance | 2 | PASS |
| Edge Cases | 4 | PASS |
| Result Structure | 2 | PASS |
| **Total** | **54** | **ALL PASS** |

## Performance

- Single invoice validation: < 50ms
- 100 invoices batch: < 2 seconds
- Schema/rules loaded once at initialization

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 425a050 | feat | UBL 2.1 schema validator with PINT-AE business rules |

## Verification Results

| Criterion | Status |
|-----------|--------|
| XML is validated against UBL 2.1 schema structure | PASS |
| PINT AE business rules are checked (CustomizationID, currency, TRN) | PASS |
| Validation errors include element path and specific message | PASS |
| Invalid invoices are blocked with clear error codes | PASS |
| Schema is loaded once at initialization (not per-request) | PASS |

## Deviations from Plan

None - plan executed exactly as written.

## Integration Points

**Uses (from Phase 6):**
- `einvoice.types.ts` - EInvoiceValidationResult, EInvoiceValidationError, PINT_AE_CONSTANTS

**Provides to (future plans):**
- Plan 06-05: E-invoice archive service will call validator before archiving
- Plan 06-06: E-invoice generation controller validates before returning
- Plan 06-07: Batch processing validates all invoices
- Plan 06-08: API returns validation errors to clients

## Next Phase Readiness

**Ready for:** Plan 06-05 (E-Invoice Archive Service)

**Prerequisites met:**
- UblValidatorService available for pre-archive validation
- All 16 validation rules implemented and tested
- Error reporting provides actionable feedback

## Usage Example

```typescript
import { UblValidatorService } from './ubl-validator.service';

const validator = new UblValidatorService();

// Validate single invoice
const result = validator.validateInvoice(xmlContent);
if (!result.valid) {
  console.error('Validation failed:');
  result.errors.forEach(err => {
    console.error(`  [${err.code}] ${err.message}`);
    console.error(`    Element: ${err.element}`);
  });
  // Block invoice from being archived/transmitted
  throw new Error('Invoice validation failed');
}

// Batch validation
const results = validator.validateBatch([xml1, xml2, xml3]);
const validCount = results.filter(r => r.valid).length;
console.log(`${validCount}/${results.length} invoices valid`);
```
