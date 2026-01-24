---
phase: 05-wps-payroll-compliance
plan: 02
subsystem: wps-validation
tags: [iban, validation, banking, wps, mohre]
dependency-graph:
  requires: []
  provides:
    - IBAN validation utility
    - UAE bank code extraction
    - MOD-97 checksum validation
  affects:
    - 05-03 (SIF generation needs IBAN validation)
    - 05-05 (payroll validation uses IBAN checks)
tech-stack:
  added:
    - ibantools@4.5.1
  patterns:
    - utility function pattern
    - validation result interface
key-files:
  created:
    - web-erp-app/backend/src/utils/iban-validation.util.ts
  modified:
    - web-erp-app/backend/package.json
decisions:
  - id: IBAN-01
    title: UAE-specific validation before generic
    choice: Enforce AE prefix and 23-char length before MOD-97
    rationale: Fail fast on obviously non-UAE IBANs
  - id: IBAN-02
    title: Comprehensive bank code reference
    choice: Include 40+ UAE Central Bank registered codes
    rationale: Enable bank name lookups for better UX
  - id: IBAN-03
    title: Detailed error codes
    choice: Return both code and message in errors
    rationale: Supports programmatic handling and user display
metrics:
  duration: ~10 minutes
  completed: 2026-01-24
---

# Phase 05 Plan 02: IBAN Validation Utility Summary

**One-liner:** UAE IBAN validation with ibantools MOD-97 checksum, AE prefix enforcement, and bank code extraction for WPS compliance.

## What Was Built

### 1. ibantools Dependency (Task 1)

Installed `ibantools@4.5.1` as production dependency:
- MOD-97 checksum validation per ISO 13616
- Electronic/friendly format conversion
- TypeScript-native with included types
- No additional @types package needed

### 2. IBAN Validation Utility (Task 2)

Created comprehensive UAE IBAN validation at `web-erp-app/backend/src/utils/iban-validation.util.ts`:

**Constants:**
- `UAE_COUNTRY_CODE = 'AE'`
- `UAE_IBAN_LENGTH = 23`
- `UAE_BANK_CODE_START = 4` (0-indexed)
- `UAE_BANK_CODE_LENGTH = 3`

**Core Functions:**
| Function | Purpose |
|----------|---------|
| `validateUaeIban(iban)` | Full validation with MOD-97 checksum |
| `formatIban(iban)` | Electronic format (no spaces, uppercase) |
| `formatIbanForDisplay(iban)` | Friendly format with spaces |
| `extractBankCode(iban)` | Get 3-digit bank code |
| `getBankNameFromCode(code)` | Lookup bank name |
| `validateIbans(ibans[])` | Batch validation |

**Interfaces:**
```typescript
interface IbanValidationResult {
  isValid: boolean;
  iban: string;
  ibanFormatted: string | null;
  bankCode: string | null;
  bankName: string | null;
  errors: IbanValidationError[];
}

interface IbanValidationError {
  code: string;   // e.g., 'IBAN_NOT_UAE', 'IBAN_CHECKSUM_FAILED'
  message: string; // Human-readable message
}
```

**Bank Codes Reference:**
Includes 40+ UAE Central Bank registered bank codes:
- Emirates NBD (033)
- ADCB (002)
- FAB (035)
- Mashreq (046)
- Dubai Islamic Bank (031)
- RAK Bank (034)
- And 35+ more

## Validation Flow

```
Input: "AE07 0331 2345 6789 0123 456"
    |
    v
[1. Format] electronicFormatIBAN() -> "AE070331234567890123456"
    |
    v
[2. UAE Check] Must start with "AE"
    |
    v
[3. Length Check] Must be exactly 23 characters
    |
    v
[4. MOD-97] ibantools.validateIBAN() checksum validation
    |
    v
[5. Extract] Bank code from positions 4-6 -> "033"
    |
    v
Output: { isValid: true, bankCode: "033", bankName: "Emirates NBD", ... }
```

## Error Handling

| Scenario | Error Code | Message |
|----------|------------|---------|
| Empty input | `IBAN_EMPTY` | IBAN is required |
| Non-UAE | `IBAN_NOT_UAE` | IBAN must be a UAE IBAN starting with AE |
| Wrong length | `IBAN_WRONG_LENGTH` | UAE IBAN must be exactly 23 characters |
| Bad checksum | `IBAN_CHECKSUM_FAILED` | Invalid IBAN checksum (MOD-97 failed) |
| Invalid chars | `IBAN_INVALID_FORMAT` | IBAN contains invalid characters |

## Test Results

```
Test 1 - Valid IBAN: AE070331234567890123456
  isValid: true
  bankCode: 033
  bankName: Emirates NBD

Test 2 - Too short: AE12345
  isValid: false
  errors: ['IBAN_WRONG_LENGTH']

Test 3 - Wrong country: GB82WEST12345698765432
  isValid: false
  errors: ['IBAN_NOT_UAE', 'IBAN_WRONG_LENGTH']

Test 4 - Invalid checksum: AE080331234567890123456
  isValid: false
  errors: ['Invalid IBAN checksum (MOD-97 failed)']

Test 5 - With spaces input: AE07 0331 2345 6789 0123 456
  isValid: true
  ibanFormatted: AE070331234567890123456
```

## Success Criteria Verification

| Criterion | Status |
|-----------|--------|
| ibantools v4.x or v5.x installed | PASS (v4.5.1) |
| validateUaeIban returns IbanValidationResult | PASS |
| UAE-specific validation before MOD-97 | PASS |
| Bank code extraction (positions 4-6) | PASS |
| Human-readable error messages | PASS |
| formatIbanForDisplay with spaces | PASS |

## Files Changed

| File | Change |
|------|--------|
| `web-erp-app/backend/package.json` | Added ibantools@4.5.1 dependency |
| `web-erp-app/backend/src/utils/iban-validation.util.ts` | Created (501 lines) |

## Commits

| Hash | Message |
|------|---------|
| 9d16422 | chore(05-02): install ibantools dependency for IBAN validation |
| a885833 | feat(05-02): add UAE IBAN validation utility |

## Deviations from Plan

None - plan executed exactly as written.

## Integration Points

### Upstream Dependencies
- None (standalone utility)

### Downstream Consumers
- **SIF Generation (05-03):** Will use `validateUaeIban()` before generating WPS files
- **Payroll Service (05-05):** Will validate employee IBANs on input
- **Employee Profile:** Can display bank name via `getBankNameFromCode()`

### Usage Example

```typescript
import {
  validateUaeIban,
  formatIbanForDisplay,
  getBankNameFromCode
} from '@/utils/iban-validation.util';

// Validate employee IBAN before payroll
const result = validateUaeIban(employee.bankAccountNumber);

if (!result.isValid) {
  throw new Error(`Invalid IBAN: ${result.errors.map(e => e.message).join(', ')}`);
}

// Display in UI
const displayIban = formatIbanForDisplay(result.ibanFormatted);
const bankName = result.bankName || 'Unknown Bank';
```

## Next Phase Readiness

This plan provides the foundation for:
- **05-03:** SIF file generation (can now validate IBANs before generating)
- **05-05:** Payroll processing (IBAN validation integrated)
- **Employee Management:** Bank account validation on profile updates
