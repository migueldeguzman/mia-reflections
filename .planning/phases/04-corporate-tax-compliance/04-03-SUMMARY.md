---
phase: 04-corporate-tax-compliance
plan: 03
subsystem: corporate-tax
tags: [ct, non-deductible, exempt-income, participation-exemption, entertainment-50, fta-article-33]
status: complete

dependency-graph:
  requires: [04-01, 04-02]
  provides: [CT-02-non-deductible, CT-03-exempt-income]
  affects: [04-04, 04-05, 04-06]

tech-stack:
  added: []
  patterns: [service-layer, decimal-arithmetic, participation-exemption, di-injection]

file-tracking:
  key-files:
    created:
      - web-erp-app/backend/src/services/corporate-tax/ct-adjustment.service.ts
    modified:
      - web-erp-app/backend/src/config/types.ts
      - web-erp-app/backend/src/config/container.ts
      - web-erp-app/backend/src/services/corporate-tax/index.ts

decisions:
  - id: CT-ADJ-01
    decision: Decimal helpers inline in service
    rationale: No decimal-math utility exists; created toDecimal/roundCurrency locally
  - id: CT-ADJ-02
    decision: Conservative default for capital gains exemption
    rationale: Capital gains require manual verification; default to non-qualifying
  - id: CT-ADJ-03
    decision: Account name pattern matching for subcategories
    rationale: Distinguish fines vs illicit payments within NON_DEDUCTIBLE classification
  - id: CT-ADJ-04
    decision: Related party excess from transfer pricing table
    rationale: Uses related_party_transactions.adjustmentAmount for arm's length failures

metrics:
  duration: ~6 minutes
  lines-added: 1152
  files-created: 1
  files-modified: 3
  completed: 2026-01-24
---

# Phase 04 Plan 03: CT Adjustment Service Summary

CtAdjustmentService with 1152 lines aggregating non-deductible expenses (CT-02) and exempt income (CT-03) from accounting data with entertainment 50% disallowed calculation, participation exemption verification for dividends/capital gains, and related party excess from transfer pricing adjustments.

## Tasks Completed

### Task 1: Create CT Adjustment Service

Created `ct-adjustment.service.ts` with:

**Types Exported:**
- `AdjustmentPeriodInput` - Input for period-based calculations
- `CtAdjustmentResult` - Complete adjustment result with breakdowns
- `EntertainmentBreakdown` - Detailed entertainment expense breakdown
- `DonationDeductibilityResult` - QPBE status check result

**Main Aggregation Methods:**
- `aggregateAdjustments()` - Main entry point combining all adjustments
- `aggregateNonDeductibleExpenses()` - CT-02 non-deductible aggregation
- `aggregateExemptIncome()` - CT-03 exempt income aggregation
- `aggregateOtherAdjustments()` - Unrealized gains, transitional adjustments

**Non-Deductible (CT-02) Methods:**
- Fines/penalties: 100% non-deductible per FTA Article 33
- Entertainment: 50% disallowed per FTA Article 33(2)
- Owner withdrawals: 100% non-deductible
- Personal expenses: 100% non-deductible
- Related party excess: From arm's length test failures
- `getEntertainmentBreakdown()` - Full/disallowed/allowed breakdown
- `calculateRelatedPartyExcess()` - Sum adjustments from TP table

**Exempt Income (CT-03) Methods:**
- `checkDividendExemption()` - Verifies 5%/12-month/9% rules
- `checkCapitalGainExemption()` - Participation exemption for gains
- `verifyParticipationExemption()` - Full eligibility check
- Domestic vs foreign dividend classification
- Foreign PE income and QFZP qualifying income support

**Additional Features:**
- `checkDonationDeductibility()` - QPBE status verification
- `getAccountAdjustmentDetail()` - Drill-down for specific accounts
- Inline decimal helpers: `toDecimal()`, `roundCurrency()`

### Task 2: Register in DI Container

**types.ts Updates:**
- Added `CtAdjustmentService: Symbol.for('CtAdjustmentService')`

**container.ts Updates:**
- Imported CtAdjustmentService
- Bound as singleton with comment: `// CtAdjustmentService - CT adjustment aggregation (CT-02, CT-03)`

**index.ts Barrel Exports:**
```typescript
export {
  CtAdjustmentService,
  AdjustmentPeriodInput,
  CtAdjustmentResult,
  EntertainmentBreakdown,
  DonationDeductibilityResult
} from './ct-adjustment.service';
```

## Verification Results

| Check | Result |
|-------|--------|
| ct-adjustment.service.ts exists | PASS |
| Service has 350+ lines (1152 actual) | PASS |
| aggregateAdjustments method exists | PASS |
| aggregateNonDeductibleExpenses method exists | PASS |
| aggregateExemptIncome method exists | PASS |
| Entertainment 50% calculation | PASS |
| Fines 100% non-deductible | PASS |
| checkDividendExemption with 5%/12-month/9% | PASS |
| calculateRelatedPartyExcess method exists | PASS |
| checkDonationDeductibility method exists | PASS |
| DI container binding | PASS |
| TypeScript compiles (new files) | PASS |

## FTA Compliance Implementation

| FTA Article | Implementation |
|-------------|----------------|
| Article 33 | Fines/penalties 0% deductible |
| Article 33(2) | Entertainment 50% deductible with breakdown |
| Article 23 | Participation exemption (5%/12-month/9%) |
| Article 24 | Foreign PE income election |
| Article 18 | QFZP qualifying income |
| Article 35 | Related party excess from TP adjustments |

## Participation Exemption Criteria

For dividends/capital gains to qualify (FTA Article 23):

| Criterion | Threshold | Implementation |
|-----------|-----------|----------------|
| Ownership | >= 5% | Checked in `checkDividendExemption()` |
| Acquisition Cost | > AED 4M (alternative) | CT_CONSTANTS.PARTICIPATION_COST_THRESHOLD |
| Holding Period | >= 12 months | `calculateHoldingMonths()` |
| Foreign Tax Rate | >= 9% | Checked for foreign dividends |
| Asset Test | < 50% non-qualifying | Placeholder for future implementation |

## Key Design Decisions

1. **Decimal Helpers Inline**: Created `toDecimal()` and `roundCurrency()` locally since no decimal-math utility exists

2. **Conservative Capital Gains Default**: Capital gains default to non-qualifying, requiring manual verification for participation exemption

3. **Subcategory Detection**: Uses account name patterns to distinguish fines vs illicit payments within NON_DEDUCTIBLE classification

4. **Related Party Integration**: Queries `related_party_transactions` table for arm's length adjustments (sum of adjustmentAmount where adjustmentRequired=true)

5. **Domestic vs Foreign**: Dividend source determined by presence of foreignTaxRate in participation detail

## Deviations from Plan

None - plan executed exactly as written.

## Files Delivered

| File | Lines | Purpose |
|------|-------|---------|
| ct-adjustment.service.ts | 1152 | Main service with all CT-02/CT-03 methods |
| types.ts | +2 | CtAdjustmentService symbol |
| container.ts | +3 | Import and singleton binding |
| index.ts | +9 | Barrel exports |

## Usage Example

```typescript
import { container } from './config/container';
import { TYPES } from './config/types';
import { CtAdjustmentService } from './services/corporate-tax';

const adjustmentService = container.get<CtAdjustmentService>(TYPES.CtAdjustmentService);

// Get all CT adjustments for a period
const result = await adjustmentService.aggregateAdjustments({
  companyId: 'company-uuid',
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-12-31')
});

console.log('Non-deductible expenses:', result.nonDeductible.total.toString());
console.log('Exempt income:', result.exemptIncome.total.toString());
console.log('Net adjustment:', result.netAdjustment.toString());
```

## Next Phase Readiness

**CT-04 (CT Calculation)** can use:
- `aggregateAdjustments()` for complete adjustment calculation
- `netAdjustment` for taxable income formula

**CT-05/CT-06 (CT-Adjusted Statements)** can use:
- `nonDeductibleDetails` for line-by-line adjustments
- `exemptIncomeDetails` for exempt income breakdown

**CT-07 (Transfer Pricing)** can use:
- `calculateRelatedPartyExcess()` to verify TP adjustments are captured

## Commit Reference

| Commit | Message |
|--------|---------|
| daca5a6 | feat(04-03): implement CtAdjustmentService for CT adjustments |
