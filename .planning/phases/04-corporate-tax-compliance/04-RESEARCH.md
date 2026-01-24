# Phase 4: Corporate Tax Compliance - Research

**Researched:** 2026-01-24
**Domain:** UAE FTA Corporate Tax, Federal Decree-Law No. 47 of 2022
**Confidence:** HIGH (FTA regulations verified via official sources)

## Summary

This research investigates UAE Corporate Tax (CT) requirements under Federal Decree-Law No. 47 of 2022, which took effect on June 1, 2023. The phase requires implementing a 9% CT calculation engine with a 0% rate for profits up to AED 375,000, tracking non-deductible expenses and exempt income, generating CT-adjusted P&L and Balance Sheet statements, supporting transfer pricing documentation, and enabling group tax consolidation.

The existing codebase has solid foundations from Phase 2.5 (FinancialReportsService with P&L and Balance Sheet) and Phase 3 (VatReturnService with Form 201 box aggregation pattern). The CT compliance engine will extend these foundations by adding taxable income adjustments to accounting income, implementing transaction-level CT classification, and generating CT return data.

**Primary recommendation:** Build a CtCalculationService that starts with accounting income from FinancialReportsService.getProfitAndLoss(), applies the adjustment schedule (add non-deductible, subtract exempt income), and calculates CT at 9% on the portion exceeding AED 375,000. Follow the VatReturnService pattern for aggregating transactions into CT categories.

## FTA Specifications (Official Requirements)

### Corporate Tax Rates and Thresholds

| Taxable Income Bracket | CT Rate | Description |
|------------------------|---------|-------------|
| AED 0 - AED 375,000 | 0% | Small business threshold |
| Above AED 375,000 | 9% | Standard rate |
| Qualifying Free Zone Persons (QFZP) | 0% | On qualifying income |
| Large MNE Groups (GloBE) | 15% | DMTT from Jan 2025 |

**Calculation Example:**
```
Taxable Income: AED 1,000,000
Tax-free bracket: AED 375,000 x 0% = AED 0
Taxable bracket:  AED 625,000 x 9% = AED 56,250
Total CT Payable: AED 56,250
```

### Taxable Income Determination

Starting from accounting income (net profit before tax per IFRS), make these adjustments:

**Taxable Income = Accounting Income - Exempt Income + Non-Deductible Expenses + Other Adjustments - Relief**

| Adjustment Category | Direction | Examples |
|---------------------|-----------|----------|
| Exempt Income | SUBTRACT | Qualifying dividends, participation gains |
| Non-Deductible Expenses | ADD BACK | Fines, penalties, 50% entertainment |
| Unrealized Gains/Losses | ADJUST | If realisation basis elected |
| Related Party Adjustments | ADJUST | Arm's length pricing differences |
| Tax Losses Carried Forward | SUBTRACT | Up to 75% of taxable income |

### Non-Deductible Expenses (HIGH confidence)

The following must be added back to accounting income:

| Category | Deduction Allowed | FTA Reference |
|----------|-------------------|---------------|
| Fines and Penalties | 0% (fully disallowed) | Article 33 |
| Entertainment Expenses | 50% (half disallowed) | Article 33(2) |
| Donations to non-QPBEs | 0% (fully disallowed) | Article 33 |
| Bribes/Illicit Payments | 0% (fully disallowed) | Article 33 |
| Dividends/Profit Distributions | 0% (not an expense) | Article 33 |
| Owner Withdrawals | 0% (not an expense) | Article 33 |
| Recoverable Input VAT | 0% (fully disallowed) | Article 33 |
| Personal Expenses | 0% (fully disallowed) | Article 33 |
| Non-arm's length excess | Adjusted portion | Article 35 |

**Entertainment Expense Rule:**
- 50% deductible for meals, accommodation, transport for customers/partners
- Must be for business purposes
- Documentation required

### Exempt Income (HIGH confidence)

The following are excluded from taxable income:

| Category | Conditions | Source |
|----------|------------|--------|
| Domestic Dividends | From UAE companies | Article 22 |
| Foreign Dividends | 5%+ ownership, 12-month hold, 9%+ tax abroad | Article 23 |
| Capital Gains on Shares | Same conditions as dividends | Article 23 |
| Foreign PE Income | 9%+ tax abroad, election made | Article 24 |
| Intra-group Reorganization | Qualifying conditions met | Article 26 |

**Participation Exemption Requirements:**
1. Ownership interest at least 5% (or acquisition cost > AED 4 million)
2. Held for 12 months (or intention to hold)
3. Participation subject to 9%+ statutory tax rate
4. Not more than 50% of participation's assets are non-qualifying

### Transfer Pricing (CT-07)

**Documentation Requirements:**

| Threshold | Requirement |
|-----------|-------------|
| AED 40M+ total or AED 4M+ per category | TP Disclosure Form in CT Return |
| AED 500K+ payments to connected persons | Noted in return |
| AED 200M+ group revenue | Master File + Local File |
| AED 3.15B+ global MNE revenue | Country-by-Country Report |

**Key Requirements:**
- All related party transactions must follow arm's length principle
- Documentation must be provided within 30 days of FTA request (2026 change)
- Downward adjustments require FTA pre-approval
- Non-arm's length payments denied as deductions

### Group Tax Consolidation (CT-09)

**Tax Group Formation Requirements:**

| Condition | Requirement |
|-----------|-------------|
| Ownership | 95%+ of share capital, voting rights, and profit entitlement |
| Parent Residence | UAE tax resident (or foreign with UAE POEM) |
| Subsidiary Residence | All must be UAE resident juridical persons |
| Fiscal Year | Same financial year-end |
| Accounting Standards | Same standards (IFRS or IFRS for SMEs) |
| Exclusions | Cannot include exempt persons or QFZPs |

**Benefits:**
- Single consolidated CT return filed by parent
- Losses offset between group members
- Intercompany transactions eliminated

**Loss Transfer Rules (Non-Group Alternative):**
- 75%+ common ownership required
- Same fiscal year and accounting standards
- UAE resident juridical persons only
- Cannot transfer to/from exempt persons or QFZPs

### Filing Requirements

| Requirement | Details |
|-------------|---------|
| Filing Deadline | 9 months after tax period end |
| Filing Method | EmaraTax portal (online only) |
| Financial Statements | Required with CT return |
| Audit Requirement | Revenue > AED 50M or QFZP status |
| Record Retention | 7 years from end of tax period |
| Amendment Threshold | > AED 10,000 error requires voluntary disclosure |

**Penalties:**
- First filing default: AED 10,000
- Repeat violation (24 months): AED 20,000

## Standard Stack

### Core Libraries

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@prisma/client` | 6.x | ORM with Decimal support | Already in use, Prisma.Decimal for precision |
| `decimal.js` | (via Prisma) | CT calculations | FTA requires exact AED amounts |
| `date-fns` | 3.x | Tax period handling | Already in use for date operations |
| TypeScript | 5.x | Type safety | Financial code correctness |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Handlebars | 4.7.x | CT report templates | CT-adjusted P&L/BS generation |
| Puppeteer | 22.x | PDF generation | If CT reports need PDF export |

**Installation:**
```bash
# No additional packages needed - using existing stack
```

### Existing Codebase Assets

| Asset | Location | Phase 4 Usage |
|-------|----------|---------------|
| `FinancialReportsService` | `services/finance/` | Base P&L and Balance Sheet |
| `GeneralLedgerService` | `services/finance/` | Account balances |
| `decimal-math.util.ts` | `utils/` | roundCurrency, toDecimal, ZERO |
| `VatReturnService` | `services/vat/` | Pattern for tax aggregation |
| `ComplianceAuditService` | `services/compliance/` | Audit trail for CT adjustments |
| `tenant_compliance_config` | Schema | TRN, free zone status |
| `tax_configurations` | Schema | Tax registration settings |

## Architecture Patterns

### Recommended Project Structure

```
src/
  services/
    corporate-tax/
      ct-calculation.service.ts       # Core CT calculation engine
      ct-adjustment.service.ts        # Non-deductible/exempt tracking
      ct-return.service.ts            # CT return preparation
      ct-report.service.ts            # CT-adjusted P&L/BS
      transfer-pricing.service.ts     # TP documentation tracking
      tax-group.service.ts            # Group consolidation
      __tests__/                      # Unit tests
  types/
    corporate-tax.types.ts            # CT-specific types/enums
```

### Pattern 1: CT Calculation Engine

**What:** Calculate taxable income and CT payable from accounting income
**When to use:** Preparing CT returns, estimating CT liability

```typescript
// Source: Derived from existing FinancialReportsService patterns
interface CtCalculationInput {
  companyId: string;
  taxPeriodId: string;
  fiscalYearId: string;
  startDate: Date;
  endDate: Date;
}

interface CtCalculationResult {
  // From P&L
  accountingIncome: Decimal;

  // Adjustments
  exemptIncome: {
    dividends: Decimal;
    capitalGains: Decimal;
    otherExempt: Decimal;
    total: Decimal;
  };
  nonDeductibleExpenses: {
    finesAndPenalties: Decimal;
    entertainmentDisallowed: Decimal;  // 50% of entertainment
    donationsDisallowed: Decimal;
    otherNonDeductible: Decimal;
    total: Decimal;
  };

  // Calculation
  taxableIncomeBeforeLosses: Decimal;
  lossesApplied: Decimal;  // Max 75% of taxable income
  taxableIncome: Decimal;

  // Tax
  taxFreeAmount: Decimal;    // AED 375,000
  taxableAmount: Decimal;    // Amount above threshold
  ctRate: Decimal;           // 0.09
  ctPayable: Decimal;
}

@injectable()
class CtCalculationService {
  async calculateCorporateTax(
    input: CtCalculationInput
  ): Promise<CtCalculationResult> {
    // 1. Get accounting income from P&L
    const pnl = await this.financialReportsService.getProfitAndLoss(
      input.companyId,
      { startDate: input.startDate, endDate: input.endDate }
    );
    const accountingIncome = pnl.netIncome;

    // 2. Calculate adjustments
    const exemptIncome = await this.calculateExemptIncome(input);
    const nonDeductible = await this.calculateNonDeductible(input);

    // 3. Calculate taxable income
    const taxableBeforeLosses = accountingIncome
      .minus(exemptIncome.total)
      .plus(nonDeductible.total);

    // 4. Apply loss relief (max 75%)
    const availableLosses = await this.getAvailableLosses(input.companyId);
    const maxLossOffset = taxableBeforeLosses.times(new Decimal('0.75'));
    const lossesApplied = min(availableLosses, maxLossOffset);

    const taxableIncome = max(
      taxableBeforeLosses.minus(lossesApplied),
      ZERO
    );

    // 5. Calculate CT (9% on amount exceeding 375,000)
    const threshold = new Decimal('375000');
    const taxableAmount = max(taxableIncome.minus(threshold), ZERO);
    const ctPayable = roundCurrency(taxableAmount.times(new Decimal('0.09')));

    return {
      accountingIncome,
      exemptIncome,
      nonDeductibleExpenses: nonDeductible,
      taxableIncomeBeforeLosses: taxableBeforeLosses,
      lossesApplied,
      taxableIncome,
      taxFreeAmount: min(taxableIncome, threshold),
      taxableAmount,
      ctRate: new Decimal('0.09'),
      ctPayable
    };
  }
}
```

### Pattern 2: Transaction CT Classification

**What:** Flag transactions as non-deductible or exempt at entry time
**When to use:** Creating expenses, recording income, importing transactions

```typescript
// Source: Derived from VAT vatTransactionType pattern
enum CtExpenseClassification {
  FULLY_DEDUCTIBLE = 'FULLY_DEDUCTIBLE',
  NON_DEDUCTIBLE = 'NON_DEDUCTIBLE',
  ENTERTAINMENT_50_PCT = 'ENTERTAINMENT_50_PCT',
  RELATED_PARTY = 'RELATED_PARTY'
}

enum CtIncomeClassification {
  TAXABLE = 'TAXABLE',
  EXEMPT_DIVIDEND = 'EXEMPT_DIVIDEND',
  EXEMPT_CAPITAL_GAIN = 'EXEMPT_CAPITAL_GAIN',
  EXEMPT_FOREIGN_PE = 'EXEMPT_FOREIGN_PE',
  QUALIFYING_INCOME = 'QUALIFYING_INCOME'  // For QFZPs
}

interface CtTransactionData {
  ctExpenseClass?: CtExpenseClassification;
  ctIncomeClass?: CtIncomeClassification;
  isRelatedParty?: boolean;
  relatedPartyId?: string;
  armLengthValue?: Decimal;  // For TP adjustments
  exemptionReason?: string;
}
```

### Pattern 3: CT-Adjusted Financial Statements

**What:** Generate P&L and Balance Sheet with CT adjustment columns
**When to use:** CT return preparation, management reporting

```typescript
// Source: Extended from existing FinancialReportsService
interface CtAdjustedProfitAndLoss {
  companyId: string;
  periodStart: Date;
  periodEnd: Date;

  // Standard P&L columns
  revenue: {
    accounts: AccountLine[];
    total: Decimal;
  };
  expenses: {
    accounts: AccountLine[];
    total: Decimal;
  };
  netAccountingIncome: Decimal;

  // CT Adjustment columns
  ctAdjustments: {
    exemptIncomeDeductions: {
      dividends: Decimal;
      capitalGains: Decimal;
      foreignPE: Decimal;
      total: Decimal;
    };
    nonDeductibleAdditions: {
      finesPenalties: Decimal;
      entertainment: Decimal;
      donations: Decimal;
      relatedPartyExcess: Decimal;
      total: Decimal;
    };
  };

  // CT Taxable Income
  taxableIncome: Decimal;
  ctPayable: Decimal;
}

@injectable()
class CtReportService {
  async generateCtAdjustedPnL(
    companyId: string,
    fiscalYearId: string
  ): Promise<CtAdjustedProfitAndLoss> {
    // 1. Get standard P&L
    const pnl = await this.financialReportsService.getProfitAndLoss(
      companyId,
      { fiscalYearId }
    );

    // 2. Aggregate CT adjustments
    const adjustments = await this.ctAdjustmentService.aggregateAdjustments(
      companyId,
      fiscalYearId
    );

    // 3. Calculate taxable income
    const calculation = await this.ctCalculationService.calculateCorporateTax({
      companyId,
      fiscalYearId,
      ...
    });

    return {
      ...pnl,
      ctAdjustments: adjustments,
      taxableIncome: calculation.taxableIncome,
      ctPayable: calculation.ctPayable
    };
  }
}
```

### Pattern 4: Chart of Accounts CT Mapping

**What:** Map chart of accounts to CT categories
**When to use:** Auto-classifying transactions, preparing CT return

```typescript
// Source: New pattern for CT-04
enum CtAccountCategory {
  // Revenue
  TRADING_INCOME = 'TRADING_INCOME',
  INVESTMENT_INCOME = 'INVESTMENT_INCOME',
  DIVIDEND_INCOME = 'DIVIDEND_INCOME',
  CAPITAL_GAINS = 'CAPITAL_GAINS',
  OTHER_INCOME = 'OTHER_INCOME',

  // Expenses
  COST_OF_SALES = 'COST_OF_SALES',
  STAFF_COSTS = 'STAFF_COSTS',
  ADMIN_EXPENSES = 'ADMIN_EXPENSES',
  ENTERTAINMENT = 'ENTERTAINMENT',
  DEPRECIATION = 'DEPRECIATION',
  FINANCE_COSTS = 'FINANCE_COSTS',
  FINES_PENALTIES = 'FINES_PENALTIES',
  DONATIONS = 'DONATIONS',

  // Balance Sheet
  FIXED_ASSETS = 'FIXED_ASSETS',
  INVESTMENTS = 'INVESTMENTS',
  RELATED_PARTY_RECEIVABLES = 'RELATED_PARTY_RECEIVABLES',
  RELATED_PARTY_PAYABLES = 'RELATED_PARTY_PAYABLES',

  // Not CT Relevant
  NOT_APPLICABLE = 'NOT_APPLICABLE'
}

interface CtChartMapping {
  accountId: string;
  accountCode: string;
  ctCategory: CtAccountCategory;
  expenseClassification?: CtExpenseClassification;
  incomeClassification?: CtIncomeClassification;
  isAutoClassified: boolean;
}
```

### Pattern 5: Transfer Pricing Documentation

**What:** Track related party transactions for TP compliance
**When to use:** Recording intercompany transactions, generating TP disclosures

```typescript
// Source: New pattern for CT-07
interface RelatedPartyTransaction {
  id: string;
  companyId: string;
  transactionDate: Date;
  relatedPartyId: string;
  relatedPartyName: string;
  relationshipType: 'SUBSIDIARY' | 'PARENT' | 'SISTER' | 'COMMON_OWNER' | 'KEY_MANAGEMENT';

  // Transaction details
  transactionType: 'SALE' | 'PURCHASE' | 'SERVICE' | 'LOAN' | 'IP_LICENSE';
  transactionAmount: Decimal;
  currency: string;

  // Transfer pricing
  armLengthPrice?: Decimal;
  pricingMethod: 'CUP' | 'RESALE_MINUS' | 'COST_PLUS' | 'TNMM' | 'PROFIT_SPLIT';
  adjustmentRequired: boolean;
  adjustmentAmount?: Decimal;

  // Documentation
  hasLocalFile: boolean;
  hasMasterFile: boolean;
  benchmarkingCompleted: boolean;
  notes?: string;
}

interface TpDisclosureSchedule {
  companyId: string;
  taxPeriodId: string;

  // Thresholds
  totalRelatedPartyValue: Decimal;
  exceedsAed40M: boolean;

  // Breakdown by category
  categories: Array<{
    transactionType: string;
    totalAmount: Decimal;
    exceedsAed4M: boolean;
    transactionCount: number;
  }>;

  // Connected persons
  connectedPersonPayments: Decimal;
  exceedsAed500K: boolean;
}
```

### Pattern 6: Tax Group Consolidation

**What:** Consolidate multiple entities for CT purposes
**When to use:** Multi-company groups with 95%+ ownership

```typescript
// Source: New pattern for CT-09
interface TaxGroup {
  id: string;
  parentCompanyId: string;
  groupName: string;
  effectiveDate: Date;
  status: 'ACTIVE' | 'PENDING' | 'DISSOLVED';

  members: Array<{
    companyId: string;
    companyName: string;
    ownershipPercentage: Decimal;
    joinDate: Date;
    leaveDate?: Date;
  }>;
}

interface ConsolidatedCtReturn {
  taxGroupId: string;
  taxPeriodId: string;

  // Per-member breakdown
  memberResults: Array<{
    companyId: string;
    accountingIncome: Decimal;
    taxableIncome: Decimal;
    adjustments: Decimal;
  }>;

  // Eliminations
  intercompanyEliminations: Decimal;

  // Consolidated figures
  consolidatedAccountingIncome: Decimal;
  consolidatedTaxableIncome: Decimal;
  consolidatedCtPayable: Decimal;

  // Filed by parent
  filedBy: string;
  filedAt?: Date;
}
```

### Anti-Patterns to Avoid

- **Hardcoding CT rate:** Store rate in config table (rates can change)
- **Ignoring free zone status:** Must check QFZP eligibility before applying 9%
- **Mixing VAT and CT classification:** Separate concerns - VAT treatment differs from CT
- **Calculating CT on accounting income directly:** Must apply adjustment schedule
- **Not tracking related party status:** Required for TP disclosure thresholds
- **Loss offset without limit:** Cannot offset more than 75% of taxable income

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Decimal precision | Custom rounding | `decimal-math.util.ts` | Already UAE-compliant |
| P&L calculation | Direct GL queries | `FinancialReportsService` | Already has account balances |
| Tax aggregation | Custom queries | Pattern from `VatReturnService` | Proven aggregation pattern |
| Audit trail | Custom logging | `ComplianceAuditService` | FTA-compliant hash chain |
| TRN validation | Regex | `validateTRN()` | Already exists |

**Key insight:** CT compliance builds on top of existing accounting infrastructure. The adjustment layer (non-deductible/exempt) sits between accounting income and taxable income.

## Common Pitfalls

### Pitfall 1: Incorrect Entertainment Expense Treatment

**What goes wrong:** Adding back 100% of entertainment instead of 50%
**Why it happens:** Misreading the 50% deductible rule
**How to avoid:** Entertainment expenses should add back only 50%, not full amount
**Warning signs:** CT liability higher than expected

### Pitfall 2: Missing Arm's Length Adjustments

**What goes wrong:** Related party transactions at non-market prices accepted
**Why it happens:** Not tracking related party status on transactions
**How to avoid:** Flag related party transactions, track arm's length values
**Warning signs:** FTA TP audits, denied deductions

### Pitfall 3: Loss Offset Exceeds 75%

**What goes wrong:** Offsetting 100% of current year profits with carried losses
**Why it happens:** Not implementing the 75% cap
**How to avoid:** Apply min(availableLosses, taxableIncome * 0.75)
**Warning signs:** Lower CT calculated than allowed

### Pitfall 4: QFZP Benefits Applied to Non-Qualifying Income

**What goes wrong:** Applying 0% to all free zone company income
**Why it happens:** Not separating qualifying from non-qualifying income
**How to avoid:** Track income sources, apply de minimis threshold
**Warning signs:** FTA withdrawal of QFZP status

### Pitfall 5: Participation Exemption Without Verification

**What goes wrong:** Exempting dividends/gains that don't meet conditions
**Why it happens:** Not checking 5%/12-month/9% requirements
**How to avoid:** Store ownership %, acquisition date, and foreign tax rate
**Warning signs:** Exempt income denied on audit

### Pitfall 6: Wrong Period for Adjustments

**What goes wrong:** Adjustments in wrong tax period
**Why it happens:** Accrual vs cash timing confusion
**How to avoid:** Follow IFRS timing, adjust in period expense/income recognized
**Warning signs:** Period variances in CT reconciliation

## Code Examples

### CT Rate Calculation

```typescript
// Source: Derived from FTA regulations
import { Decimal } from '@prisma/client/runtime/library';
import { roundCurrency, toDecimal, ZERO, max } from '../utils/decimal-math.util';

/** UAE Corporate Tax threshold (0% rate up to this amount) */
const CT_THRESHOLD = new Decimal('375000');

/** UAE Corporate Tax rate (9%) */
const CT_RATE = new Decimal('0.09');

/** Maximum loss offset percentage (75%) */
const MAX_LOSS_OFFSET = new Decimal('0.75');

/**
 * Calculate UAE Corporate Tax
 *
 * @param taxableIncome - Taxable income after all adjustments
 * @returns CT payable amount
 */
export function calculateCorporateTax(taxableIncome: Decimal): Decimal {
  // No tax on losses or income below threshold
  if (taxableIncome.lessThanOrEqualTo(CT_THRESHOLD)) {
    return ZERO;
  }

  // 9% on amount exceeding threshold
  const taxableAmount = taxableIncome.minus(CT_THRESHOLD);
  return roundCurrency(taxableAmount.times(CT_RATE));
}

/**
 * Calculate maximum loss offset allowed
 *
 * @param taxableIncomeBeforeLosses - Taxable income before loss relief
 * @param availableLosses - Total carried forward losses
 * @returns Amount of losses that can be applied
 */
export function calculateLossOffset(
  taxableIncomeBeforeLosses: Decimal,
  availableLosses: Decimal
): Decimal {
  // Maximum 75% of taxable income can be offset
  const maxOffset = taxableIncomeBeforeLosses.times(MAX_LOSS_OFFSET);
  return roundCurrency(Decimal.min(availableLosses, maxOffset));
}
```

### Non-Deductible Expense Aggregation

```typescript
// Source: Based on FTA Article 33
interface NonDeductibleSummary {
  finesAndPenalties: Decimal;
  entertainmentDisallowed: Decimal;
  donationsDisallowed: Decimal;
  ownerWithdrawals: Decimal;
  personalExpenses: Decimal;
  relatedPartyExcess: Decimal;
  total: Decimal;
}

async function aggregateNonDeductible(
  companyId: string,
  startDate: Date,
  endDate: Date
): Promise<NonDeductibleSummary> {
  // Get transactions classified as non-deductible
  const expenses = await prisma.accountingJournalLine.findMany({
    where: {
      journalEntry: {
        companyId,
        entryDate: { gte: startDate, lte: endDate },
        status: 'POSTED'
      },
      debitAmount: { gt: 0 },
      account: {
        ctExpenseClass: {
          in: ['NON_DEDUCTIBLE', 'ENTERTAINMENT_50_PCT']
        }
      }
    },
    include: { account: true }
  });

  let finesAndPenalties = ZERO;
  let entertainment = ZERO;
  let donationsDisallowed = ZERO;

  for (const expense of expenses) {
    const amount = toDecimal(expense.debitAmount);

    switch (expense.account.ctCategory) {
      case 'FINES_PENALTIES':
        finesAndPenalties = finesAndPenalties.plus(amount);
        break;
      case 'ENTERTAINMENT':
        // 50% disallowed
        entertainment = entertainment.plus(amount.times(new Decimal('0.5')));
        break;
      case 'DONATIONS':
        // Check if qualifying public benefit entity
        if (!expense.account.isQualifyingPBE) {
          donationsDisallowed = donationsDisallowed.plus(amount);
        }
        break;
    }
  }

  const total = finesAndPenalties
    .plus(entertainment)
    .plus(donationsDisallowed);

  return {
    finesAndPenalties: roundCurrency(finesAndPenalties),
    entertainmentDisallowed: roundCurrency(entertainment),
    donationsDisallowed: roundCurrency(donationsDisallowed),
    ownerWithdrawals: ZERO,  // From separate tracking
    personalExpenses: ZERO,   // From separate tracking
    relatedPartyExcess: ZERO, // From TP adjustments
    total: roundCurrency(total)
  };
}
```

### Participation Exemption Check

```typescript
// Source: Based on FTA Article 23
interface ParticipationCheck {
  qualifies: boolean;
  reason?: string;
  ownershipPercent: Decimal;
  holdingMonths: number;
  taxRatePercent: Decimal;
}

function checkParticipationExemption(
  ownershipPercent: Decimal,
  acquisitionCost: Decimal,
  acquisitionDate: Date,
  disposalDate: Date,
  foreignTaxRate: Decimal
): ParticipationCheck {
  // Condition 1: 5% ownership OR acquisition cost > AED 4M
  const meetsOwnership = ownershipPercent.greaterThanOrEqualTo(new Decimal('5'))
    || acquisitionCost.greaterThan(new Decimal('4000000'));

  // Condition 2: 12-month holding period
  const holdingMonths = differenceInMonths(disposalDate, acquisitionDate);
  const meetsHolding = holdingMonths >= 12;

  // Condition 3: 9%+ tax rate in foreign jurisdiction
  const meetsTaxRate = foreignTaxRate.greaterThanOrEqualTo(new Decimal('9'));

  const qualifies = meetsOwnership && meetsHolding && meetsTaxRate;

  let reason: string | undefined;
  if (!qualifies) {
    if (!meetsOwnership) reason = 'Ownership below 5% and cost below AED 4M';
    else if (!meetsHolding) reason = 'Holding period less than 12 months';
    else if (!meetsTaxRate) reason = 'Foreign tax rate below 9%';
  }

  return {
    qualifies,
    reason,
    ownershipPercent,
    holdingMonths,
    taxRatePercent: foreignTaxRate
  };
}
```

### Small Business Relief Check

```typescript
// Source: FTA Small Business Relief provisions
interface SmallBusinessReliefResult {
  eligible: boolean;
  reason?: string;
  revenueAmount: Decimal;
}

async function checkSmallBusinessRelief(
  companyId: string,
  taxPeriodEndDate: Date
): Promise<SmallBusinessReliefResult> {
  const threshold = new Decimal('3000000'); // AED 3M
  const reliefEndDate = new Date('2026-12-31');

  // Check if relief still available
  if (taxPeriodEndDate.getTime() > reliefEndDate.getTime()) {
    return {
      eligible: false,
      reason: 'Small Business Relief ended December 2026',
      revenueAmount: ZERO
    };
  }

  // Check if QFZP (not eligible)
  const config = await prisma.tenant_compliance_config.findFirst({
    where: { companyId }
  });

  if (config?.isQualifyingFreeZonePerson) {
    return {
      eligible: false,
      reason: 'QFZPs not eligible for Small Business Relief',
      revenueAmount: ZERO
    };
  }

  // Check revenue in current and previous period
  const currentRevenue = await calculatePeriodRevenue(companyId, taxPeriodEndDate);
  const previousRevenue = await calculatePreviousPeriodRevenue(companyId, taxPeriodEndDate);

  const eligible = currentRevenue.lessThanOrEqualTo(threshold)
    && previousRevenue.lessThanOrEqualTo(threshold);

  return {
    eligible,
    reason: eligible ? undefined : 'Revenue exceeds AED 3M threshold',
    revenueAmount: currentRevenue
  };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No federal CT | 9% CT with threshold | June 2023 | Must implement |
| Paper filing | EmaraTax portal only | 2023 | Online integration needed |
| Manual TP documentation | 30-day response requirement | Jan 2026 | Must maintain documentation |
| Unlimited loss offset | 75% cap | 2023 | Loss tracking needed |
| Indefinite loss carry-forward | Indefinite but 75% limited | 2023 | Loss registry needed |

**Upcoming Changes (2026):**
- Small Business Relief ends December 2026
- Tighter FTA response deadlines (30 days for TP docs)
- R&D tax credits (30-50%) from 2026

## Open Questions

1. **EmaraTax API Integration**
   - What we know: CT returns filed via EmaraTax portal
   - What's unclear: Whether API integration is available for automated filing
   - Recommendation: Build for export first, add API when specs available

2. **QFZP De Minimis Threshold**
   - What we know: QFZPs can have some non-qualifying income
   - What's unclear: Exact threshold percentages and calculation
   - Recommendation: Track qualifying vs non-qualifying income separately

3. **Transitional Rules**
   - What we know: Special rules for assets acquired before CT
   - What's unclear: Exact calculations for opening balances
   - Recommendation: Support manual override of opening tax base values

4. **CT Return Form Structure**
   - What we know: Form is dynamic based on selections
   - What's unclear: Exact JSON structure for export
   - Recommendation: Model on FTA guide, adjust when specs clarified

## Sources

### Primary (HIGH confidence)
- [Federal Decree-Law No. 47 of 2022](https://mof.gov.ae/wp-content/uploads/2022/12/Federal-Decree-Law-No.-47-of-2022-EN.pdf) - CT Law
- [PWC Tax Summaries - UAE](https://taxsummaries.pwc.com/united-arab-emirates/corporate/deductions) - Deductions reference
- [PWC Tax Summaries - UAE Income](https://taxsummaries.pwc.com/united-arab-emirates/corporate/income-determination) - Income determination
- [FTA Corporate Tax Guides](https://tax.gov.ae/en/taxes/corporate.tax/corporate.tax.guides.references.aspx) - Official guides
- Existing codebase: `FinancialReportsService`, `VatReturnService`

### Secondary (MEDIUM confidence)
- [Alpha Partners UAE CT Guide](https://www.alphapartners.co/blog/uae-corporate-tax-list-of-non-deductible-expenses-explained) - Non-deductible expenses
- [ClearTax UAE CT FAQs](https://www.cleartax.com/ae/uae-corporate-tax-faqs) - General CT guidance
- [Chambers Corporate Tax 2025](https://practiceguides.chambers.com/practice-guides/corporate-tax-2025/uae) - Group taxation
- [Alvarez & Marsal TP Guide](https://www.alvarezandmarsal.com/thought-leadership/a-deep-dive-into-the-uae-transfer-pricing-rules) - Transfer pricing

### Tertiary (LOW confidence)
- WebSearch results for "UAE Corporate Tax 2026 changes"
- Community tax advisory blog posts

## Metadata

**Confidence breakdown:**
- CT Rates/Thresholds: HIGH - Direct from Decree-Law
- Non-Deductible Expenses: HIGH - Verified with PWC Tax Summaries
- Exempt Income: HIGH - Verified with multiple sources
- Transfer Pricing: MEDIUM - Based on Ministerial Decision, evolving
- Tax Groups: MEDIUM - Clear rules but complex edge cases
- CT Return Structure: MEDIUM - EmaraTax form is dynamic

**Research date:** 2026-01-24
**Valid until:** 2026-06-30 (review before July filing deadlines)

---

## Quick Reference for Planner

### Key Decisions to Make

1. **CT calculation service:** Build on FinancialReportsService.getProfitAndLoss()
2. **Transaction classification:** Add ctExpenseClass/ctIncomeClass to transactions
3. **Chart of accounts mapping:** ctCategory field on chart_of_accounts table
4. **Loss tracking:** New tax_losses table for carry-forward tracking
5. **TP documentation:** New related_party_transactions table
6. **Tax groups:** New tax_groups and tax_group_members tables

### Critical Formulas

1. **Taxable Income:** `Accounting Income - Exempt Income + Non-Deductible`
2. **CT Payable:** `max(0, Taxable Income - 375,000) x 9%`
3. **Loss Offset:** `min(Available Losses, Taxable Income x 75%)`
4. **Entertainment Disallowed:** `Entertainment Expense x 50%`

### Dependencies from Prior Phases

| Dependency | Phase | What's Needed |
|------------|-------|---------------|
| `FinancialReportsService` | 2.5 | P&L and Balance Sheet generation |
| `GeneralLedgerService` | 2.5 | Account balances by period |
| `ComplianceAuditService` | 2 | Audit trail for CT changes |
| `decimal-math.util.ts` | 2.5 | Financial calculations |
| `tenant_compliance_config` | 1 | TRN, free zone status |
| `tax_configurations` | 1 | Tax registration settings |

### Schema Extensions Needed

```prisma
// Chart of accounts CT mapping
model chartOfAccounts {
  // Existing fields...
  ctCategory          CtAccountCategory?
  ctExpenseClass      CtExpenseClassification?
  ctIncomeClass       CtIncomeClassification?
  isQualifyingPBE     Boolean @default(false)
}

// Tax losses tracking
model taxLoss {
  id              String   @id @default(uuid())
  companyId       String
  fiscalYearId    String
  lossAmount      Decimal
  usedAmount      Decimal  @default(0)
  remainingAmount Decimal
  createdAt       DateTime @default(now())
}

// Related party transactions
model relatedPartyTransaction {
  id                  String   @id @default(uuid())
  companyId           String
  relatedPartyId      String
  transactionDate     Date
  transactionType     String
  transactionAmount   Decimal
  armLengthPrice      Decimal?
  pricingMethod       String?
  adjustmentRequired  Boolean
  adjustmentAmount    Decimal?
}

// Tax groups
model taxGroup {
  id              String   @id @default(uuid())
  parentCompanyId String
  groupName       String
  effectiveDate   Date
  status          String
  members         taxGroupMember[]
}

model taxGroupMember {
  id                  String   @id @default(uuid())
  taxGroupId          String
  companyId           String
  ownershipPercentage Decimal
  joinDate            Date
  leaveDate           Date?
  taxGroup            taxGroup @relation(fields: [taxGroupId], references: [id])
}
```

### Files to Reference

- `/web-erp-app/.worktrees/phase-2.5-accounting/backend/src/services/finance/financial-reports.service.ts` - P&L/BS patterns
- `/web-erp-app/.worktrees/phase-2.5-accounting/backend/src/services/vat/vat-return.service.ts` - Tax aggregation patterns
- `/web-erp-app/.worktrees/phase-2.5-accounting/backend/src/utils/decimal-math.util.ts` - Calculation utilities
