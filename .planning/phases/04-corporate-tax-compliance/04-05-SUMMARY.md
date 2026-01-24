---
phase: 04
plan: 05
subsystem: corporate-tax
tags: [ct-report, ct-adjusted-pnl, ct-adjusted-balance-sheet, financial-statements]
depends_on:
  requires: [04-03, 04-04]
  provides: [CT-05, CT-06]
  affects: [04-06, 04-07, 04-09]
tech-stack:
  added: []
  patterns: [pattern-based-classification, decimal-math, json-export]
key-files:
  created:
    - web-erp-app/backend/src/services/corporate-tax/ct-report.service.ts
  modified:
    - web-erp-app/backend/src/config/types.ts
    - web-erp-app/backend/src/config/container.ts
    - web-erp-app/backend/src/services/corporate-tax/index.ts
decisions:
  - key: pattern-based-classification
    value: "Use DEFAULT_CT_MAPPING_RULES from CtChartMappingService for account classification"
    rationale: "Schema doesn't have CT fields on accounts table; rules-based matching provides flexibility"
  - key: deferred-tax-calculation
    value: "DTA = Available Losses * 9%, DTL simplified to zero"
    rationale: "Full timing difference tracking requires additional schema; simplified for MVP"
  - key: trn-fallback
    value: "Try tax_configurations first, fallback to companies.taxNumber"
    rationale: "Different deployments may have different schemas"
metrics:
  duration: "15 minutes"
  completed: "2026-01-24"
---

# Phase 04 Plan 05: CT Report Service Summary

CT-adjusted P&L and Balance Sheet generation using pattern-based account classification

## One-Liner

CtReportService generates CT-05/CT-06 reports showing accounting vs taxable amounts with exempt income deductions and non-deductible expense additions.

## What Was Built

### CtReportService (873 lines)

Core CT-adjusted financial statement generation service:

**Main Methods:**

| Method | Purpose | Output |
|--------|---------|--------|
| `generateCtAdjustedPnL()` | CT-05 P&L statement | Accounting, Adjustment, Taxable columns |
| `generateCtAdjustedBalanceSheet()` | CT-06 Balance Sheet | Assets, Liabilities, Equity + Tax items |
| `getCtReportSummary()` | Quick CT overview | Summary of key figures |
| `exportCtAdjustedPnL()` | JSON for PDF/Excel | Serialized report data |
| `exportCtAdjustedBalanceSheet()` | JSON for PDF/Excel | Serialized report data |

**P&L Sections:**
- Revenue (with exempt income deductions)
- Cost of Sales
- Gross Profit
- Operating Expenses (with non-deductible additions)
- Operating Profit
- Other Income (dividends, capital gains)
- Other Expenses (fines, finance costs)
- Net Accounting Income

**Balance Sheet Additions:**
- Deferred Tax Asset (from loss carry-forwards)
- Deferred Tax Liability (from timing differences)
- Current Tax Payable (CT for period)

### Pattern-Based Classification

Uses `DEFAULT_CT_MAPPING_RULES` from CtChartMappingService:

```typescript
// Account code patterns determine CT classification
'^4[0-3]' -> TRADING_INCOME (taxable)
'^4[6-7]' + dividend -> DIVIDEND_INCOME (exempt)
'^6[4-5]' + entertainment -> ENTERTAINMENT (50% deductible)
'^6[6-7]' + fine/penalty -> FINES_PENALTIES (0% deductible)
```

### DI Container Integration

```typescript
// types.ts
CtReportService: Symbol.for('CtReportService')

// container.ts
container.bind<CtReportService>(TYPES.CtReportService)
  .to(CtReportService).inSingletonScope();

// Dependencies injected:
// - PrismaClient
// - CtAdjustmentService
// - CtCalculationService
// - CtChartMappingService
```

## CT Adjustment Flow

```
Accounting Income
    |
    v
(-) Exempt Income Deductions
    - Dividends (if participation exemption met)
    - Capital gains (if qualifying)
    - Foreign PE income
    |
    v
(+) Non-Deductible Additions
    - Fines & Penalties (100%)
    - Entertainment (50%)
    - Owner withdrawals (100%)
    - Personal expenses (100%)
    |
    v
(+/-) Other Adjustments
    - Unrealized gains/losses
    - Transitional adjustments
    |
    v
= Taxable Income Before Losses
    |
    v
(-) Loss Relief (max 75%)
    |
    v
= Taxable Income
    |
    v
CT Payable = (Taxable - 375K) * 9%
```

## Key Design Decisions

### 1. Pattern-Based Classification

**Decision:** Use regex pattern matching on account codes/names instead of DB fields

**Why:**
- Schema doesn't have CT classification fields on accounts table
- Pattern matching is flexible and doesn't require migrations
- Matches approach used by CtChartMappingService

### 2. Simplified Deferred Tax

**Decision:** DTA from losses only; DTL simplified to zero

**Full Implementation Would Track:**
- Accelerated depreciation differences
- Provisions timing differences
- Unrealized gains/losses

**MVP Approach:**
```typescript
deferredTaxAsset = availableLosses * 0.09;
deferredTaxLiability = ZERO; // Simplified
```

### 3. TRN Retrieval Fallback

**Decision:** Try multiple sources for company TRN

```typescript
// Try tax_configurations if exists
// Fallback to companies.taxNumber
```

## Files Changed

| File | Change | Lines |
|------|--------|-------|
| `ct-report.service.ts` | Created | +873 |
| `config/types.ts` | Added symbol | +1 |
| `config/container.ts` | Added binding | +2 |
| `corporate-tax/index.ts` | Added exports | +6 |

## Verification

### Must-Haves Satisfied

| Requirement | Status |
|-------------|--------|
| CT-adjusted P&L shows accounting amounts and CT adjustment columns | DONE |
| Non-deductible expenses shown as additions to accounting income | DONE |
| Exempt income shown as deductions from accounting income | DONE |
| CT-adjusted Balance Sheet shows deferred tax and CT payable | DONE |
| Reports can be generated for any fiscal period | DONE |

### TypeScript Compilation

```bash
npx tsc --noEmit 2>&1 | grep ct-report
# No errors in ct-report.service.ts
```

### Service Line Count

```
873 lines (requirement: min 300)
```

## Commits

| Hash | Message |
|------|---------|
| 7d65be3 | feat(04-05): add CtReportService for CT-adjusted financial statements |

## Next Steps

1. **Plan 04-06:** CT Return Form service for FTA submission format
2. **Plan 04-07:** Related party transaction tracking (CT-07)
3. **Plan 04-09:** Integration tests for CT calculation flow

## Technical Notes

### Account Balance Calculation

```typescript
// Income accounts: credit - debit (positive = income)
// Expense accounts: debit - credit (positive = expense)
// Asset accounts: debit - credit (positive = asset)
// Liability/Equity: credit - debit (positive = liability/equity)
```

### Adjustment Direction

```typescript
// For income sections: exempt reduces taxable
adjustment = totalExempt.negated();

// For expense sections: non-deductible adds back
adjustment = totalNonDeductible;
```

### JSON Export Format

```json
{
  "reportTitle": "CT-Adjusted Profit & Loss Statement",
  "company": { "name": "...", "trn": "..." },
  "period": { "start": "2026-01-01", "end": "2026-12-31" },
  "sections": {
    "revenue": { "accounts": [...], "total": {...} },
    "costOfSales": {...},
    "grossProfit": {...},
    ...
  },
  "ctAdjustments": {
    "exemptIncomeDeductions": 50000,
    "nonDeductibleAdditions": 25000,
    "otherAdjustments": 0,
    "netAdjustment": -25000
  },
  "taxableIncome": 1000000,
  "ctPayable": 56250
}
```
