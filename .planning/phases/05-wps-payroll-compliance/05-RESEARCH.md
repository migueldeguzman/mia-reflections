# Phase 5: WPS Payroll Compliance - Research

**Researched:** 2026-01-24
**Domain:** UAE Wages Protection System (WPS), SIF File Generation, IBAN Validation, MOHRE Compliance
**Confidence:** HIGH

## Summary

This phase implements UAE Wages Protection System (WPS) compliance for payroll processing. The WPS is an electronic salary transfer system mandated by MOHRE (Ministry of Human Resources and Emiratisation) in collaboration with the Central Bank of UAE, requiring employers to pay employee salaries through approved banks and exchange houses using standardized Salary Information Files (SIF).

The implementation builds on existing infrastructure:
- **Gratuity Calculator** (Phase 2.5): `gratuity.service.ts` already implements UAE Labor Law gratuity calculations with Decimal precision
- **Decimal Math Utilities**: `decimal-math.util.ts` provides high-precision financial calculations
- **Compliance Config**: `compliance-config.service.ts` already has WPS config fields (`isWpsRegistered`, `wpsAgentId`, `molEstablishmentId`)
- **Audit Infrastructure** (Phase 2): `ComplianceAuditService` and hash chain for tamper-proof payroll records

The core requirements are:
1. Generate WPS-compliant SIF files with EDR (Employee Detail Record) and SCR (Salary Control Record)
2. Validate UAE IBANs (23 characters, AE prefix, MOD-97 checksum)
3. Configure WPS agents with 9-digit routing codes
4. Track salary cycles and WPS submission status
5. Capture and resolve WPS errors with specific error codes
6. Maintain 7-year audit trail for payroll records

**Primary recommendation:** Use `ibantools` (v4.5.1) for IBAN validation, generate SIF as CSV files with exact MOHRE format specifications, leverage existing gratuity service for end-of-service calculations.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ibantools | 4.5.1 | IBAN validation and formatting | TypeScript-native, supports AE (UAE), MOD-97 validation, well-maintained |
| decimal.js | (via Prisma) | Precise financial calculations | Already in use for gratuity, prevents floating-point errors |
| date-fns | (existing) | Date formatting for SIF fields | YYYY-MM-DD and MMYYYY format support |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| csv-stringify | 6.x | CSV generation for SIF files | When generating SIF content |
| archiver | 6.x | Optional: ZIP archives for SIF files | If bundling multiple SIF files |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ibantools | iban.js | ibantools has better TypeScript support and detailed validation errors |
| csv-stringify | manual string concat | csv-stringify handles edge cases (escaping, encoding) correctly |

**Installation:**
```bash
npm install ibantools csv-stringify
npm install -D @types/csv-stringify  # if needed
```

## Architecture Patterns

### Recommended Project Structure
```
backend/src/
├── services/
│   ├── payroll/
│   │   ├── wps-sif.service.ts          # SIF file generation
│   │   ├── payroll-cycle.service.ts    # Salary cycle management
│   │   └── wps-submission.service.ts   # WPS status tracking
│   └── finance/
│       └── hr/
│           └── gratuity.service.ts     # [EXISTING] Gratuity calculations
├── types/
│   └── payroll/
│       └── wps.types.ts                # WPS/SIF TypeScript types
├── utils/
│   ├── decimal-math.util.ts            # [EXISTING] Decimal operations
│   └── iban-validation.util.ts         # UAE IBAN validation wrapper
└── routes/
    └── payroll/
        └── wps.routes.ts               # WPS API endpoints
```

### Pattern 1: SIF File Generation Service
**What:** Service that generates WPS-compliant Salary Information Files
**When to use:** Every payroll cycle submission
**Example:**
```typescript
// Source: MOHRE WPS specifications, NOW Money SIF Guide
interface SifGenerationResult {
  fileName: string;           // EEEEEEEEEEEEEYYMMDDHHMMSS.SIF
  content: string;            // EDR rows + SCR row
  employeeCount: number;
  totalAmount: Decimal;
  createdAt: Date;
}

export class WpsSifService {
  generateSifFile(
    employees: EmployeeSalaryRecord[],
    employer: WpsEmployerConfig,
    payPeriod: PayPeriod
  ): SifGenerationResult {
    const edrRecords = employees.map(emp => this.createEdrRecord(emp, payPeriod));
    const scrRecord = this.createScrRecord(employer, edrRecords, payPeriod);

    const fileName = this.generateFileName(employer.molEstablishmentId, new Date());
    const content = [...edrRecords, scrRecord].join('\n');

    return { fileName, content, employeeCount: employees.length, totalAmount, createdAt: new Date() };
  }
}
```

### Pattern 2: IBAN Validation Utility
**What:** Wrapper around ibantools for UAE-specific IBAN validation
**When to use:** Before saving employee bank details, before SIF generation
**Example:**
```typescript
// Source: ibantools npm, Central Bank UAE IBAN specs
import { validateIBAN, electronicFormatIBAN, ValidationErrorsIBAN } from 'ibantools';

export interface IbanValidationResult {
  isValid: boolean;
  iban: string;              // Electronic format (no spaces)
  bankCode: string | null;   // 3-digit bank identifier
  errors: string[];
}

export function validateUaeIban(iban: string): IbanValidationResult {
  const electronic = electronicFormatIBAN(iban) || '';

  // Check UAE format: AE + 2 check digits + 3 bank code + 16 account
  if (!electronic.startsWith('AE')) {
    return { isValid: false, iban: electronic, bankCode: null, errors: ['IBAN must be UAE (AE prefix)'] };
  }

  if (electronic.length !== 23) {
    return { isValid: false, iban: electronic, bankCode: null, errors: ['UAE IBAN must be 23 characters'] };
  }

  const result = validateIBAN(electronic);
  if (!result.valid) {
    const errorMessages = result.errorCodes.map(code => ValidationErrorsIBAN[code]);
    return { isValid: false, iban: electronic, bankCode: null, errors: errorMessages };
  }

  const bankCode = electronic.substring(4, 7); // Digits 5-7 are bank code
  return { isValid: true, iban: electronic, bankCode, errors: [] };
}
```

### Pattern 3: Salary Cycle State Machine
**What:** State management for payroll cycles from draft to WPS-submitted
**When to use:** Managing payroll workflow status
**Example:**
```typescript
// Payroll cycle states
enum PayrollCycleStatus {
  DRAFT = 'DRAFT',           // Initial, can add/edit employees
  PROCESSING = 'PROCESSING', // Calculating salaries
  READY = 'READY',           // SIF generated, ready for WPS
  SUBMITTED = 'SUBMITTED',   // Sent to WPS agent
  ACCEPTED = 'ACCEPTED',     // MOHRE accepted
  REJECTED = 'REJECTED',     // MOHRE rejected (needs correction)
  COMPLETED = 'COMPLETED',   // Salaries paid
  CANCELLED = 'CANCELLED'    // Cycle cancelled
}

// Valid transitions
const CYCLE_TRANSITIONS: Record<PayrollCycleStatus, PayrollCycleStatus[]> = {
  DRAFT: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['READY', 'DRAFT'],
  READY: ['SUBMITTED', 'DRAFT'],
  SUBMITTED: ['ACCEPTED', 'REJECTED'],
  REJECTED: ['DRAFT'],
  ACCEPTED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: []
};
```

### Anti-Patterns to Avoid
- **Floating-point arithmetic for salary amounts:** Always use Decimal for financial calculations
- **Hardcoded routing codes:** Use reference table for WPS agent routing codes (they change)
- **Missing audit trail:** Every SIF generation and WPS submission must be logged with ComplianceAuditService
- **Generating SIF without validation:** Always validate IBAN, employee ID, dates before generating SIF
- **Storing SIF files without encryption:** SIF contains sensitive salary data, must be encrypted at rest

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| IBAN validation | Regex validation | `ibantools` | MOD-97 checksum algorithm is complex, bank code lookup needed |
| UAE IBAN checksum | Custom MOD-97 | `ibantools.validateIBAN()` | Algorithm has edge cases, library handles them |
| CSV generation | String concatenation | `csv-stringify` | Proper escaping, encoding, newline handling |
| Decimal arithmetic | JavaScript numbers | `@prisma/client/runtime/library` Decimal | Floating-point errors on financial data |
| Gratuity calculation | Custom formula | Existing `GratuityService` | Already implements UAE Labor Law correctly |
| Audit logging | Custom logging | `ComplianceAuditService` with hash chain | Tamper-proof audit already exists |

**Key insight:** SIF file format looks simple (just CSV) but has strict validation rules. Field lengths, date formats, amount formatting (no commas, exactly 2 decimals) must be exact or MOHRE rejects the file.

## Common Pitfalls

### Pitfall 1: SIF File Naming Mismatch
**What goes wrong:** File name date/time doesn't match SCR record date/time, causing rejection
**Why it happens:** Generating file name at different time than SCR record
**How to avoid:** Capture timestamp once and use for both file name and SCR record
**Warning signs:** MOHRE rejection with "file name mismatch" error

### Pitfall 2: Employee ID Format Error
**What goes wrong:** Person Code (employee ID) not exactly 14 digits, padded incorrectly
**Why it happens:** MOHRE Person Code can have leading zeros, storing as number strips them
**How to avoid:** Store Person Code as string, validate length is 14, pad with leading zeros if needed
**Warning signs:** WPS rejection "invalid employee ID"

### Pitfall 3: Routing Code Changes
**What goes wrong:** Old routing codes no longer work, WPS submission fails
**Why it happens:** Banks/exchange houses get new routing codes assigned by CBUAE
**How to avoid:** Store routing codes in reference table with effective dates, allow admin updates
**Warning signs:** "Agent not found" errors after working previously

### Pitfall 4: Amount Format Rejection
**What goes wrong:** Amounts with commas (e.g., "1,234.56") rejected
**Why it happens:** SIF requires amounts without commas (e.g., "1234.56")
**How to avoid:** Use `.toFixed(2)` formatting, explicitly remove commas
**Warning signs:** "Invalid amount format" in WPS error response

### Pitfall 5: Leave Days Calculation
**What goes wrong:** Total days paid doesn't match actual work days, causing salary variance alerts
**Why it happens:** Not accounting for unpaid leave, partial months correctly
**How to avoid:** Calculate: Total calendar days - Unpaid leave days = Days for salary
**Warning signs:** MOHRE flags salary amount doesn't match contract

### Pitfall 6: Duplicate Employee Records
**What goes wrong:** Same employee appears twice in SIF, causing double payment
**Why it happens:** Employee with multiple positions or re-hired without closing previous record
**How to avoid:** Unique constraint on (person_code, pay_period), deduplicate before SIF generation
**Warning signs:** Bank account receives unexpected amount, MOHRE flags duplicate

## Code Examples

Verified patterns from official sources and existing codebase:

### SIF EDR Record Generation
```typescript
// Source: NOW Money SIF Guide, MOHRE WPS specifications
interface EdrRecord {
  recordType: 'EDR';
  personCode: string;         // 14-digit MOHRE employee ID
  agentId: string;            // 9-digit bank routing code
  iban: string;               // 23-digit UAE IBAN
  payStartDate: string;       // YYYY-MM-DD
  payEndDate: string;         // YYYY-MM-DD
  totalDays: number;          // Calendar days in period
  fixedSalary: string;        // e.g., "9000.00"
  variableSalary: string;     // e.g., "0.00"
  leaveDays: number;          // Days on leave (optional field)
}

function formatEdrRecord(record: EdrRecord): string {
  return [
    record.recordType,
    record.personCode.padStart(14, '0'),
    record.agentId.padStart(9, '0'),
    record.iban,
    record.payStartDate,
    record.payEndDate,
    record.totalDays.toString(),
    record.fixedSalary,
    record.variableSalary,
    record.leaveDays.toString()
  ].join(',');
}

// Example output:
// EDR,10003128177364,201234567,AE920330000010000000000,2022-11-01,2022-11-30,30,9000.00,0.00,0
```

### SIF SCR Record Generation
```typescript
// Source: Bayzat SIF Guide, MOHRE specifications
interface ScrRecord {
  recordType: 'SCR';
  employerUniqueId: string;   // 13-digit MOHRE establishment ID
  agentId: string;            // 9-digit employer bank routing code
  fileCreationDate: string;   // YYYY-MM-DD
  fileCreationTime: string;   // HHMM (24-hour)
  salaryMonth: string;        // MMYYYY
  recordCount: number;        // Count of EDR records
  totalAmount: string;        // Sum of all salaries, no commas
  currency: 'AED';
  employerRef?: string;       // Optional reference
}

function formatScrRecord(record: ScrRecord): string {
  return [
    record.recordType,
    record.employerUniqueId.padStart(13, '0'),
    record.agentId.padStart(9, '0'),
    record.fileCreationDate,
    record.fileCreationTime,
    record.salaryMonth,
    record.recordCount.toString().padStart(2, '0'),
    record.totalAmount,
    record.currency,
    record.employerRef || ''
  ].join(',');
}

// Example output:
// SCR,0000000330000,203526101,2022-11-27,0937,112022,02,16000.00,AED,SAL
```

### SIF File Name Generation
```typescript
// Source: MOHRE WPS specifications
function generateSifFileName(employerUniqueId: string, timestamp: Date): string {
  // Format: EEEEEEEEEEEEEYYMMDDHHMMSS.SIF
  // E = Employer Unique ID (up to 13 digits)
  // YY = Year (2 digits)
  // MM = Month
  // DD = Day
  // HH = Hour (24-hour)
  // MM = Minute
  // SS = Second

  const paddedId = employerUniqueId.padStart(13, '0');
  const year = timestamp.getFullYear().toString().slice(-2);
  const month = (timestamp.getMonth() + 1).toString().padStart(2, '0');
  const day = timestamp.getDate().toString().padStart(2, '0');
  const hour = timestamp.getHours().toString().padStart(2, '0');
  const minute = timestamp.getMinutes().toString().padStart(2, '0');
  const second = timestamp.getSeconds().toString().padStart(2, '0');

  return `${paddedId}${year}${month}${day}${hour}${minute}${second}.SIF`;
}

// Example: generateSifFileName('330000', new Date('2022-11-27T09:37:01'))
// Returns: 0000000330000221127093701.SIF
```

### UAE IBAN Validation with ibantools
```typescript
// Source: ibantools npm documentation
import { validateIBAN, electronicFormatIBAN, ValidationErrorsIBAN } from 'ibantools';

function validateEmployeeIban(rawIban: string): { valid: boolean; iban: string; error?: string } {
  // Remove spaces and convert to uppercase
  const iban = electronicFormatIBAN(rawIban) || '';

  // UAE-specific checks
  if (!iban.startsWith('AE')) {
    return { valid: false, iban, error: 'IBAN must start with AE for UAE' };
  }

  if (iban.length !== 23) {
    return { valid: false, iban, error: `UAE IBAN must be 23 characters, got ${iban.length}` };
  }

  // Full IBAN validation including MOD-97 checksum
  const result = validateIBAN(iban);
  if (!result.valid) {
    const errors = result.errorCodes.map(code => {
      switch (code) {
        case ValidationErrorsIBAN.WrongBBANLength: return 'Invalid account number length';
        case ValidationErrorsIBAN.WrongIBANChecksum: return 'Invalid checksum';
        case ValidationErrorsIBAN.NoIBANCountry: return 'Unknown country code';
        default: return 'Invalid IBAN';
      }
    });
    return { valid: false, iban, error: errors.join(', ') };
  }

  return { valid: true, iban };
}
```

### Integration with Existing Gratuity Service
```typescript
// Source: Existing gratuity.service.ts
import { GratuityService, TerminationType, ContractType } from '../finance/hr/gratuity.service';

// When employee terminates, calculate gratuity as part of final salary
async function calculateFinalSettlement(
  employeeId: string,
  terminationDate: Date,
  terminationType: TerminationType
): Promise<FinalSettlement> {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });

  const gratuityService = new GratuityService(prisma);
  const gratuity = await gratuityService.calculateGratuity(
    { companyId: employee.companyId, userId: 'system' },
    {
      employeeId,
      basicSalary: employee.basicSalary,
      startDate: employee.joinDate,
      endDate: terminationDate,
      terminationType,
      contractType: employee.contractType as ContractType
    }
  );

  return {
    basicSalary: employee.basicSalary,
    accruedLeaveBalance: calculateLeaveEncashment(employee),
    gratuityAmount: gratuity.cappedGratuity,
    totalSettlement: employee.basicSalary.plus(gratuity.cappedGratuity),
    notes: gratuity.notes
  };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual SIF upload to bank portal | Direct API integration with WPS agents | 2025 MOHRE update | Real-time status tracking possible |
| Salary cards (physical) | Electronic IBAN transfers | 2020+ | All employees can have bank accounts |
| Monthly manual verification | Automated MOHRE database verification | 2026 | Instant employee/contract validation |

**Deprecated/outdated:**
- Physical salary cards: Most WPS agents now prefer IBAN transfers
- Excel SIF templates: Use programmatic generation with validation
- Manual routing code lookups: Central Bank maintains updated database

**2026 MOHRE Update:** The Ministry launched an upgraded WPS version with real-time, direct data integration between MOHRE systems and financial institutions via Central Bank. This enables faster rejection notifications and instant validation.

## Open Questions

Things that couldn't be fully resolved:

1. **WPS Agent API Integration**
   - What we know: WPS agents (banks) accept SIF files, return acceptance/rejection status
   - What's unclear: Specific API endpoints vary by bank; some only accept portal upload
   - Recommendation: Start with file-based submission, add API integration for banks that support it

2. **Employee Leave Deduction Field**
   - What we know: EDR has optional leave_days field
   - What's unclear: Whether this is mandatory, how MOHRE uses it for verification
   - Recommendation: Include field, default to 0, populate when employee has unpaid leave

3. **Multi-Currency Support**
   - What we know: SIF currency must be AED
   - What's unclear: How to handle employees paid in foreign currency
   - Recommendation: Convert to AED for WPS, maintain separate tracking for actual payment

## Sources

### Primary (HIGH confidence)
- [Central Bank UAE IBAN Structure](https://www.centralbank.ae/en/our-operations/payments-and-settlements/regulations-and-standards/iban/) - Official IBAN format
- [ibantools npm](https://www.npmjs.com/package/ibantools) - v4.5.1 verified
- [NOW Money SIF Guide](https://nowmoney.me/blog/your-salary-information-file-sif-guide/) - EDR/SCR field specifications
- [Bayzat SIF Guide](https://www.bayzat.com/blog/all-about-the-salary-information-file/) - File format details
- Existing `gratuity.service.ts` - UAE Labor Law gratuity implementation
- Existing `compliance-config.service.ts` - WPS config fields already present

### Secondary (MEDIUM confidence)
- [OnCount WPS Guide](https://oncount.com/articles/wps-uae-guide/) - WPS overview and penalties
- [HR Chronicle SIF Explained](https://www.hrchronicle.com/wps-salary-file-sif-salary-information-file-explained/) - Example records
- [JAAN Corporate WPS Routing Codes](https://www.jaancorp.com/bank-routing-codes-for-wps-process-united-arab-emirates-uae/) - Bank routing code lookup
- [UAE Person Code Guide](https://www.gulfistan.com/what-is-person-code) - 14-digit MOHRE employee ID format

### Tertiary (LOW confidence)
- DIB WPS File Format Guide (PDF binary, couldn't extract) - Needs manual verification
- MOHRE official portal - Requires login, couldn't verify API specs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - ibantools verified current, patterns from official docs
- Architecture: HIGH - Based on existing codebase patterns (gratuity service, compliance config)
- Pitfalls: MEDIUM - Based on community guides and WPS agent documentation
- SIF Format: HIGH - Multiple sources confirm same field specifications

**Research date:** 2026-01-24
**Valid until:** 60 days (WPS format is stable, routing codes may change)
