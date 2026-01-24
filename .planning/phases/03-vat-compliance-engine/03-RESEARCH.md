# Phase 3: VAT Compliance Engine - Research

**Researched:** 2026-01-24
**Domain:** UAE FTA VAT Compliance, Tax Invoice Generation, VAT Returns
**Confidence:** HIGH (FTA regulations verified via official sources)

## Summary

This research investigates the UAE Federal Tax Authority (FTA) requirements for VAT compliance, focusing on tax invoice generation, VAT Return Form 201, and supporting features like reverse charge mechanism and bad debt relief. The findings are based on UAE Federal Decree-Law No. 8 of 2017, its Executive Regulations, and recent amendments effective through 2026.

The existing codebase already has solid foundations from Phase 1 (TRN configuration, free zone status) and Phase 2.5 (decimal math utilities, credit note service). The VAT compliance engine will extend these foundations with FTA-compliant tax invoice generation, bilingual support, and automated VAT return preparation.

**Primary recommendation:** Enhance the existing `invoices` model with all 13 FTA-mandated fields, implement a dedicated VAT calculation service that respects free zone status and reverse charge rules, and use Puppeteer/Playwright for Arabic RTL PDF generation.

## FTA Specifications (Official Requirements)

### Tax Invoice Mandatory Fields (Article 59)

Under Federal Decree-Law No. 8 of 2017 and Cabinet Decision No. 100 of 2025, a **full tax invoice** must contain:

| # | Field | Arabic Required | Format Requirements |
|---|-------|-----------------|---------------------|
| 1 | Words "Tax Invoice" / "فاتورة ضريبية" | YES | Must be prominent |
| 2 | Supplier Name | OPTIONAL | Arabic recommended for local |
| 3 | Supplier Address | NO | Full UAE address |
| 4 | Supplier TRN | NO | 15 digits, starts with 100 |
| 5 | Recipient Name | OPTIONAL | As registered |
| 6 | Recipient Address | NO | Full UAE address |
| 7 | Recipient TRN | NO | Required if VAT-registered |
| 8 | Sequential Invoice Number | NO | Unique per company/year |
| 9 | Date of Issue | NO | DD/MM/YYYY format |
| 10 | Date of Supply | NO | If different from issue date |
| 11 | Description of Goods/Services | NO | Including quantity and unit price |
| 12 | VAT Amount per Line or Total | NO | In AED, 2 decimal places |
| 13 | Total Amount Payable | NO | In AED |

**Additional Requirements:**
- If foreign currency used: Exchange rate to AED must be shown
- Reverse charge statement required when applicable
- Must be issued within **14 days** of date of supply (2024 amendment)

### Simplified Tax Invoice (AED 10,000 threshold)

For B2C transactions below AED 10,000, a simplified invoice requires only:
1. Words "Tax Invoice"
2. Supplier name, TRN, address
3. Invoice date
4. Goods/services description
5. Total amount payable (VAT-inclusive)
6. Total VAT amount

**NOTE:** Under e-invoicing (effective July 2026), simplified invoices will no longer be allowed for businesses in scope - all invoices must be full tax invoices.

### VAT Return Form 201 Box Structure

| Box | Name | Description | VAT Column |
|-----|------|-------------|------------|
| **OUTPUT TAX (Sales)** | | | |
| 1 | Standard Rated Supplies | Sales at 5% VAT, reported by Emirate | Output VAT + Adjustments |
| 2 | Tourist Refunds | Tax refunds under tourist scheme (negative) | Pre-filled from Planet Tax Free |
| 3 | Reverse Charge Supplies | RCM goods/services received | Output VAT due |
| 4 | Zero-Rated Supplies | Exports, healthcare, education, transport | AED 0 (value only) |
| 5 | Exempt Supplies | Financial services, residential property | AED 0 (value only) |
| 6 | Goods Imported | VAT on customs-declared imports | Output VAT + Adjustments |
| 7 | Adjustments to Imports | Corrections to Box 6 | Adjustment amount |
| 8 | **Total Output Tax** | Sum of Boxes 1-7 | Auto-calculated |
| **INPUT TAX (Purchases)** | | | |
| 9 | Standard Rated Expenses | Recoverable input VAT | Input VAT + Adjustments |
| 10 | Reverse Charge Purchases | Input VAT on RCM transactions | Recoverable VAT |
| 11 | **Total Input Tax** | Sum of Boxes 9-10 | Auto-calculated |
| **NET VAT** | | | |
| 12 | Total VAT Due | From Box 8 | |
| 13 | Total Recoverable VAT | From Box 11 | |
| 14 | Net VAT Payable/Refundable | Box 12 - Box 13 | |

**Filing Requirements:**
- Monthly: Companies with turnover > AED 150 million
- Quarterly: Companies with turnover < AED 150 million
- Due within **28 days** after tax period end
- All amounts in AED, rounded to 2 decimal places (nearest fils)

### Reverse Charge Mechanism Rules

RCM applies when a UAE VAT-registered business must self-account for VAT:

| Scenario | RCM Applies? | Form 201 Box |
|----------|--------------|--------------|
| Import goods from outside UAE | YES | Box 6 (goods), Box 3 (services) |
| Goods from Designated Zone to mainland | YES | Box 3 |
| Services from non-resident supplier | YES | Box 3 |
| Precious metals/stones (B2B) | YES | Box 3 (since Feb 2025) |
| B2B within Non-Designated Free Zone | NO | Box 1 |

**Accounting Treatment:**
```
For imported services worth AED 10,000:
DR Output VAT Payable (Liability)    500
CR Input VAT Recoverable (Asset)     500
* Net effect: Zero if fully recoverable
```

### Credit Note Requirements

Per Article 70 of the Executive Regulation:

| Field | Required |
|-------|----------|
| Words "Tax Credit Note" / "إشعار دائن ضريبي" | YES |
| Original Invoice Reference | YES (number, date) |
| Date of Issue | YES |
| Value on Original Invoice | YES |
| Corrected/Amended Value | YES |
| Difference Amount | YES |
| Difference in VAT | YES (in AED) |
| Reason for Credit Note | YES |

**Must be issued within 14 days** of the event triggering the adjustment.

### Bad Debt Relief Requirements

To claim VAT bad debt relief under Article 64:

| Condition | Requirement |
|-----------|-------------|
| Supply Made | Must have accounted for output VAT on taxable supply |
| Time Period | **More than 6 months** from payment due date |
| Written Off | Debt must be written off in accounting records |
| Notification | Customer must be notified of write-off |
| Documentation | Keep original invoice, VAT proof, collection attempts, notification copy |
| Retention | 5 years minimum from VAT return adjustment date |

**Claiming Process:**
- Report as **negative adjustment** in Box 1 (Adjustment column)
- Report by Emirate where supply was made
- If customer is VAT-registered, they must reverse corresponding input tax

## Standard Stack

### Core Libraries

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| decimal.js | (via Prisma) | VAT calculations | Already in use, UAE requires 2 decimal precision |
| puppeteer | ^22.x | PDF generation | Best RTL/Arabic support, handles bilingual layouts |
| handlebars | ^4.7.x | Invoice templates | Template engine for HTML generation |
| date-fns | ^3.x | Date handling | Already in use for timezone-aware operations |
| uuid | (via crypto) | Unique identifiers | Already used for entity IDs |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @napi-rs/canvas | ^0.1.x | QR code generation | Future e-invoicing phase |
| qrcode | ^1.5.x | QR code generation | Simpler alternative for basic QR |

**Installation:**
```bash
npm install puppeteer handlebars
# Note: puppeteer installs its own Chromium (~300MB)
```

### Existing Codebase Assets

The following already exist and should be reused:

| Asset | Location | Phase 3 Usage |
|-------|----------|---------------|
| `decimal-math.util.ts` | `src/utils/` | VAT calculations, rounding |
| `validateTRN()` | `decimal-math.util.ts` | TRN validation |
| `UAE_VAT_RATE` | `decimal-math.util.ts` | Standard 5% rate constant |
| `roundCurrency()` | `decimal-math.util.ts` | Round to 2 decimal places |
| `CreditNoteService` | `src/services/finance/` | Credit note patterns |
| `InvoiceService` | `src/services/` | Invoice creation patterns |
| `TaxCategoryService` | `src/services/finance/` | Tax code lookup |
| `tenant_compliance_config` | Schema | TRN, free zone status |
| `tax_codes` | Schema | VAT rates configuration |

## Architecture Patterns

### Recommended Project Structure

```
src/
├── services/
│   └── vat/
│       ├── vat-calculation.service.ts      # Core VAT calculation engine
│       ├── vat-invoice.service.ts          # FTA-compliant invoice generation
│       ├── vat-return.service.ts           # Form 201 preparation
│       ├── vat-reconciliation.service.ts   # GL reconciliation
│       ├── reverse-charge.service.ts       # RCM handling
│       ├── bad-debt-relief.service.ts      # Bad debt tracking
│       └── __tests__/                      # Unit tests
├── templates/
│   └── invoice/
│       ├── tax-invoice.hbs                 # Bilingual invoice template
│       ├── credit-note.hbs                 # Credit note template
│       └── debit-note.hbs                  # Debit note template
├── types/
│   └── vat.types.ts                        # VAT-specific types
└── utils/
    └── pdf-generator.util.ts               # Puppeteer wrapper
```

### Pattern 1: VAT Calculation Engine

**What:** Centralized VAT calculation respecting free zone status and transaction type
**When to use:** Any transaction requiring VAT determination

```typescript
// Source: Derived from existing codebase patterns
interface VatCalculationInput {
  companyId: string;
  transactionType: 'SALE' | 'PURCHASE' | 'IMPORT';
  lineItems: {
    amount: Decimal;
    taxCategoryId?: string;
  }[];
  customerTrn?: string;
  supplierLocation?: 'UAE_MAINLAND' | 'DESIGNATED_ZONE' | 'FREE_ZONE' | 'OVERSEAS';
}

interface VatCalculationResult {
  subtotal: Decimal;
  vatAmount: Decimal;
  total: Decimal;
  vatBreakdown: {
    taxCategoryId: string;
    taxableAmount: Decimal;
    rate: Decimal;
    vatAmount: Decimal;
  }[];
  isReverseCharge: boolean;
  reverseChargeReason?: string;
  form201Box: number; // Which box this belongs to
}

class VatCalculationService {
  async calculateVat(input: VatCalculationInput): Promise<VatCalculationResult> {
    // 1. Get company compliance config (TRN, free zone status)
    const complianceConfig = await this.getComplianceConfig(input.companyId);

    // 2. Determine if reverse charge applies
    const reverseCharge = this.determineReverseCharge(
      complianceConfig,
      input.transactionType,
      input.supplierLocation
    );

    // 3. Calculate VAT per line item
    const breakdown = await this.calculateLineItems(
      input.companyId,
      input.lineItems,
      reverseCharge
    );

    // 4. Determine Form 201 box
    const form201Box = this.determineForm201Box(
      input.transactionType,
      reverseCharge,
      breakdown
    );

    return { ...breakdown, form201Box };
  }
}
```

### Pattern 2: FTA-Compliant Invoice Generation

**What:** Generate tax invoices with all 13 mandatory fields
**When to use:** Creating any customer-facing invoice

```typescript
// Source: Extended from existing InvoiceService patterns
interface TaxInvoiceData {
  // Company (Supplier) Details
  supplierName: string;
  supplierNameArabic?: string;
  supplierAddress: string;
  supplierTrn: string;

  // Customer (Recipient) Details
  recipientName: string;
  recipientAddress: string;
  recipientTrn?: string;

  // Invoice Details
  invoiceNumber: string;
  invoiceDate: Date;
  supplyDate?: Date; // If different from invoice date

  // Line Items
  lineItems: {
    description: string;
    quantity: Decimal;
    unitPrice: Decimal;
    vatRate: Decimal;
    vatAmount: Decimal;
    total: Decimal;
  }[];

  // Totals
  subtotal: Decimal;
  totalVat: Decimal;
  totalAmount: Decimal;
  currency: string;
  exchangeRate?: Decimal; // If foreign currency

  // Additional
  isReverseCharge: boolean;
  reverseChargeStatement?: string;
  notes?: string;
}

class VatInvoiceService {
  async generateTaxInvoice(
    companyId: string,
    invoiceId: string,
    language: 'en' | 'ar' | 'bilingual' = 'bilingual'
  ): Promise<Buffer> {
    // 1. Fetch invoice with all relations
    const invoice = await this.getInvoiceWithDetails(invoiceId);

    // 2. Validate all mandatory fields present
    this.validateMandatoryFields(invoice);

    // 3. Build template data
    const templateData = this.buildTemplateData(invoice, language);

    // 4. Render HTML template
    const html = await this.renderTemplate('tax-invoice', templateData);

    // 5. Generate PDF with Puppeteer
    return this.generatePdf(html, { language });
  }
}
```

### Pattern 3: VAT Return Aggregation

**What:** Aggregate transaction data into Form 201 boxes
**When to use:** Preparing VAT returns

```typescript
// Source: New pattern based on FTA requirements
interface VatReturnPeriod {
  companyId: string;
  startDate: Date;
  endDate: Date;
  frequency: 'MONTHLY' | 'QUARTERLY';
}

interface Form201Data {
  period: VatReturnPeriod;

  // Output Tax (Boxes 1-7)
  box1_standardRatedSupplies: {
    byEmirate: Record<string, { amount: Decimal; vat: Decimal; adjustment: Decimal }>;
    total: Decimal;
    totalVat: Decimal;
  };
  box2_touristRefunds: Decimal; // Negative value
  box3_reverseChargeSupplies: { amount: Decimal; vat: Decimal };
  box4_zeroRatedSupplies: Decimal;
  box5_exemptSupplies: Decimal;
  box6_goodsImported: { amount: Decimal; vat: Decimal; adjustment: Decimal };
  box7_importAdjustments: Decimal;
  box8_totalOutputTax: Decimal; // Calculated

  // Input Tax (Boxes 9-10)
  box9_standardRatedExpenses: { amount: Decimal; vat: Decimal; adjustment: Decimal };
  box10_reverseChargePurchases: { amount: Decimal; vat: Decimal };
  box11_totalInputTax: Decimal; // Calculated

  // Net VAT (Boxes 12-14)
  box12_totalVatDue: Decimal;
  box13_totalRecoverableVat: Decimal;
  box14_netVatPayable: Decimal; // Can be negative (refund)
}

class VatReturnService {
  async prepareForm201(period: VatReturnPeriod): Promise<Form201Data> {
    // 1. Get all invoices for period
    const invoices = await this.getInvoicesForPeriod(period);

    // 2. Categorize by VAT treatment
    const categorized = this.categorizeTransactions(invoices);

    // 3. Aggregate into boxes
    const form201 = this.aggregateToBoxes(categorized);

    // 4. Apply bad debt relief adjustments
    const withAdjustments = await this.applyBadDebtAdjustments(
      period,
      form201
    );

    return withAdjustments;
  }
}
```

### Pattern 4: Bilingual PDF Generation with Puppeteer

**What:** Generate PDF with proper Arabic RTL and English LTR
**When to use:** Any document generation with Arabic

```typescript
// Source: Derived from WebSearch findings on Arabic PDF generation
class PdfGeneratorUtil {
  private browser: Browser | null = null;

  async generateBilingualPdf(
    html: string,
    options: { language?: 'en' | 'ar' | 'bilingual' } = {}
  ): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    // Set viewport for A4
    await page.setViewport({ width: 794, height: 1123 }); // A4 at 96 DPI

    // Set content with proper encoding
    await page.setContent(html, {
      waitUntil: 'networkidle0'
    });

    // Generate PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });

    await page.close();
    return Buffer.from(pdf);
  }

  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
  }
}
```

**HTML Template Pattern for Bilingual:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', 'Arial', sans-serif; }
    .rtl { direction: rtl; text-align: right; }
    .ltr { direction: ltr; text-align: left; }
    .bilingual-row {
      display: flex;
      justify-content: space-between;
    }
    .arabic { font-family: 'Noto Sans Arabic', 'Arial', sans-serif; }
  </style>
</head>
<body>
  <h1 class="bilingual-row">
    <span class="ltr">Tax Invoice</span>
    <span class="rtl arabic">فاتورة ضريبية</span>
  </h1>
  <!-- Content -->
</body>
</html>
```

### Anti-Patterns to Avoid

- **Hardcoding VAT rate:** Always fetch from `tax_codes` table, rates can change
- **Ignoring free zone status:** Must check `tenant_compliance_config.freeZoneStatus` for every calculation
- **Manual date arithmetic:** Use `date-fns` for period calculations (DST-aware)
- **Floating-point for currency:** Always use `Decimal` from decimal-math utilities
- **Generating invoice number at controller:** Must use database transaction with `FOR UPDATE`
- **Storing VAT in single field:** Need breakdown by rate/category for Form 201
- **PDFKit for Arabic:** Does not support RTL, use Puppeteer instead

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Decimal precision | Custom rounding | `decimal-math.util.ts` | Already UAE-compliant, handles banker's rounding |
| TRN validation | Regex pattern | `validateTRN()` | Validates 15-digit format and 100 prefix |
| Sequential numbering | Counter table | Existing pattern with `FOR UPDATE` | Race condition safe |
| Arabic PDF | pdfmake-arabic | Puppeteer + HTML/CSS | Full BiDi support, proper text rendering |
| Tax calculation | Inline math | `VatCalculationService` | Centralized rules, testable |
| Date calculations | Millisecond math | `date-fns` | DST-aware, timezone handling |

**Key insight:** VAT compliance has many edge cases (free zones, reverse charge, bad debt). Centralizing logic in dedicated services makes it testable and auditable - essential for FTA compliance.

## Common Pitfalls

### Pitfall 1: Ignoring Designated Zone Status

**What goes wrong:** Applying 5% VAT to goods transfers between designated zones
**Why it happens:** Not checking `freeZoneStatus` and `isDesignatedZone` from compliance config
**How to avoid:** Always check compliance config before calculating VAT
**Warning signs:** VAT charged on JAFZA-to-JAFZA goods transfer

### Pitfall 2: Incorrect Reverse Charge Accounting

**What goes wrong:** Recording RCM as expense instead of both output and input
**Why it happens:** Treating reverse charge like a regular purchase
**How to avoid:** Create paired journal entries (DR Output VAT, CR Input VAT)
**Warning signs:** Net VAT position incorrect, Form 201 boxes don't reconcile

### Pitfall 3: Bad Debt Relief Timing

**What goes wrong:** Claiming relief before 6 months elapsed
**Why it happens:** Miscounting from payment due date (not invoice date)
**How to avoid:** Track due date separately, enforce 6-month check in service
**Warning signs:** FTA rejection of bad debt claim, penalties

### Pitfall 4: Credit Note Without Original Reference

**What goes wrong:** FTA penalty of AED 2,500 per invalid credit note
**Why it happens:** Not storing or displaying original invoice reference
**How to avoid:** Make `originalInvoiceId` required, display on document
**Warning signs:** Credit notes without invoice reference in output

### Pitfall 5: Arabic Text Rendering in PDF

**What goes wrong:** Arabic characters appear disconnected or reversed
**Why it happens:** Using PDF library without BiDi algorithm support
**How to avoid:** Use Puppeteer with HTML/CSS, proper font (Noto Sans Arabic)
**Warning signs:** "عربى" displays as disconnected letters

### Pitfall 6: VAT Period Boundary Errors

**What goes wrong:** Transactions counted in wrong period
**Why it happens:** Using UTC dates when business operates in UAE timezone (UTC+4)
**How to avoid:** Use timezone-aware date handling (existing `getCurrentYear()` pattern)
**Warning signs:** Period totals don't match manual calculation

## Code Examples

### VAT Calculation with Free Zone Check

```typescript
// Source: Pattern derived from existing decimal-math.util.ts
import { Decimal } from '@prisma/client/runtime/library';
import { toDecimal, roundCurrency, UAE_VAT_RATE, ZERO } from '../utils/decimal-math.util';

async function calculateLineItemVat(
  companyId: string,
  amount: Decimal,
  taxCategoryId: string,
  supplierLocation: string
): Promise<{ vatRate: Decimal; vatAmount: Decimal; isExempt: boolean }> {
  // Get company compliance config
  const config = await prisma.tenant_compliance_config.findFirst({
    where: { companyId }
  });

  // Check if goods transfer between designated zones (exempt)
  if (config?.isDesignatedZone && supplierLocation === 'DESIGNATED_ZONE') {
    return { vatRate: ZERO, vatAmount: ZERO, isExempt: true };
  }

  // Get tax category rate
  const taxCategory = await prisma.tax_categories.findUnique({
    where: { id: taxCategoryId }
  });

  const vatRate = taxCategory ? toDecimal(taxCategory.rate) : UAE_VAT_RATE;
  const vatAmount = roundCurrency(amount.times(vatRate));

  return { vatRate, vatAmount, isExempt: false };
}
```

### Sequential Invoice Number Generation

```typescript
// Source: Existing pattern from InvoiceService
async function generateVatInvoiceNumber(
  tx: Prisma.TransactionClient,
  companyId: string
): Promise<string> {
  const year = getCurrentYear(); // Timezone-aware

  const result = await tx.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count
    FROM invoices
    WHERE "companyId" = ${companyId}
      AND "invoiceNumber" LIKE ${`TI-${year}-%`}
    FOR UPDATE
  `;

  const count = Number(result[0].count);
  return `TI-${year}-${String(count + 1).padStart(6, '0')}`;
}
```

### Form 201 Box Determination

```typescript
// Source: New pattern based on FTA requirements
function determineForm201Box(
  transactionType: 'SALE' | 'PURCHASE' | 'IMPORT',
  vatRate: Decimal,
  isReverseCharge: boolean,
  isExempt: boolean
): number {
  // Sales
  if (transactionType === 'SALE') {
    if (isExempt) return 5; // Exempt supplies
    if (vatRate.isZero()) return 4; // Zero-rated
    return 1; // Standard rated
  }

  // Purchases
  if (transactionType === 'PURCHASE') {
    if (isReverseCharge) return 10; // RCM purchases
    return 9; // Standard rated expenses
  }

  // Imports
  if (transactionType === 'IMPORT') {
    if (isReverseCharge) return 3; // Services import (RCM)
    return 6; // Goods import
  }

  return 1; // Default
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Paper invoices | E-invoicing mandatory | July 2026 | Must prepare for PINT AE format |
| Simplified invoices | Full invoices required | July 2026 | All invoices need 13 fields |
| 12-month bad debt | 6-month bad debt | 2021 amendment | Shorter waiting period |
| Manual VAT returns | EmaraTax portal | 2018 | All filing online |
| Indefinite carry-forward | 5-year limit | Jan 2026 | Excess input VAT expires |

**Deprecated/outdated:**
- Simplified tax invoices (being phased out under e-invoicing)
- Self-invoicing for RCM (no longer required from Jan 2026)
- Indefinite carry-forward of excess input VAT (max 5 years from Jan 2026)

## Open Questions

1. **E-invoicing API Integration**
   - What we know: PINT AE format required, ASP integration needed
   - What's unclear: Exact API specifications not yet published
   - Recommendation: Build invoices to include all PINT AE fields now, add transmission layer in Phase 6

2. **QR Code Requirements**
   - What we know: E-invoices need QR codes with TLV encoding
   - What's unclear: Exact TLV structure for UAE
   - Recommendation: Defer QR implementation to Phase 6 (E-Invoicing)

3. **Tourist Refund Integration**
   - What we know: Box 2 is pre-filled from Planet Tax Free
   - What's unclear: API integration requirements
   - Recommendation: Leave Box 2 as manual entry for now

## Sources

### Primary (HIGH confidence)
- [UAE Federal Decree-Law No. 8 of 2017 on VAT](https://tax.gov.ae/DataFolder/Files/Pdf/VAT-Decree-Law-No-8-of-2017.pdf)
- [Executive Regulation of Federal Decree Law No 8 of 2017](https://tax.gov.ae/-/media/Files/FTA/links/Legislation/VAT/03-Cabinet-Decision-52-of-2017.pdf)
- [VAT Returns User Guide (FTA)](https://tax.gov.ae/DataFolder/Files/Pdf/VAT%20Returns%20User%20GuideEnglishV40%2015%2008%202021%20SEP2021.pdf)
- Existing codebase: `src/utils/decimal-math.util.ts`, `src/services/invoice.service.ts`

### Secondary (MEDIUM confidence)
- [ClearTax UAE VAT Invoicing Guide](https://www.cleartax.com/ae/vat-invoicing-uae)
- [Flick Network VAT Return Filing Guide](https://www.flick.network/en-ae/vat-return-filing-uae-process)
- [Alpha Partners Credit Note Guide](https://www.alphapartners.co/blog/understanding-tax-credit-notes-in-the-uae-rules-and-compliance)
- [EAS MEA Bad Debt Relief Guide](https://www.easmea.com/bad-debt-relief-reclaiming-vat-on-unpaid-customer/)
- [Flick Network Reverse Charge Guide](https://www.flick.network/en-ae/reverse-charge-mechanism-uae-vat)

### Tertiary (LOW confidence)
- WebSearch results for PDF generation libraries (verify with package documentation)
- Community blog posts on Arabic RTL handling

## Metadata

**Confidence breakdown:**
- FTA Invoice Fields: HIGH - Direct from Executive Regulation Article 59
- Form 201 Structure: HIGH - Verified with multiple official and professional sources
- Reverse Charge Rules: HIGH - Verified with multiple tax advisory sources
- Bad Debt Relief: HIGH - Verified with FTA clarification VATP024
- PDF Generation: MEDIUM - Based on community best practices, not official docs

**Research date:** 2026-01-24
**Valid until:** 2026-07-01 (review after e-invoicing pilot launch)
