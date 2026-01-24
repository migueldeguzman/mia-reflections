---
phase: 04-corporate-tax-compliance
plan: 06
subsystem: corporate-tax
tags: [transfer-pricing, related-party, ct-07, compliance]
dependency-graph:
  requires:
    - 04-01 (CT schema and types)
  provides:
    - TransferPricingService for CT-07 compliance
    - Related party transaction recording
    - Arm's length price testing
    - TP disclosure threshold calculations
    - Documentation requirement tracking
  affects:
    - 04-04 (CT Calculation uses TP adjustments for non-deductible)
    - Future CT return generation
tech-stack:
  added: []
  patterns:
    - Raw SQL for group revenue aggregation
    - Decimal precision for financial calculations
    - Audit trail for all TP price updates
key-files:
  created:
    - backend/src/services/corporate-tax/transfer-pricing.service.ts
  modified:
    - backend/src/config/types.ts (TransferPricingService symbol)
    - backend/src/config/container.ts (service binding)
    - backend/src/services/corporate-tax/index.ts (barrel exports)
decisions:
  - decision: Use raw SQL for group revenue calculation
    rationale: Consistent with CtCalculationService pattern, reliable aggregation across tax group members
  - decision: 5% tolerance for arm's length testing
    rationale: Standard international transfer pricing practice, aligns with OECD guidelines
  - decision: Audit trail for all TP price updates
    rationale: FTA compliance requires complete audit trail for transfer pricing documentation
metrics:
  duration: ~7 minutes
  completed: 2026-01-24
---

# Phase 04 Plan 06: Transfer Pricing Service Summary

**One-liner:** TransferPricingService (CT-07) with related party transaction recording, arm's length testing (5% tolerance), and FTA disclosure thresholds (AED 40M/4M/500K).

## Objectives Achieved

1. **Related Party Transaction Recording** - recordTransaction() with automatic arm's length testing when arm's length price provided
2. **Arm's Length Price Testing** - performArmLengthTest() comparing transaction price against arm's length with 5% tolerance threshold
3. **TP Disclosure Threshold Calculations** - calculateThresholds() analyzing AED 40M total, AED 4M per category, AED 500K connected person
4. **Documentation Requirement Tracking** - updateDocumentationStatus() for Master File/Local File/Benchmarking status
5. **Compliance Status Reporting** - getComplianceStatus() with required actions list and documentation tracking

## Implementation Details

### TransferPricingService (1,202 lines)

```
transfer-pricing.service.ts
├── Constants
│   └── TP_THRESHOLDS (40M total, 4M category, 500K connected, 200M Master/Local, 3.15B CbCR)
├── Transaction Recording
│   ├── recordTransaction() - Create RP transaction with auto arm's length test
│   ├── getTransaction() - Single transaction lookup with company validation
│   ├── getTransactionsForPeriod() - Period query
│   ├── getTransactionsByRelatedParty() - Related party filter
│   └── getTransactionsRequiringAdjustment() - Adjustment filter
├── Arm's Length Testing
│   ├── performArmLengthTest() - 5% tolerance comparison
│   ├── updateArmLengthPrice() - Update with audit trail
│   └── batchArmLengthTest() - Year-end batch testing
├── Threshold Calculations
│   ├── calculateThresholds() - Full threshold analysis
│   ├── getGroupRevenue() - Tax group revenue aggregation
│   └── calculateTotalAdjustments() - Sum of TP adjustments
├── Compliance Status
│   └── getComplianceStatus() - Full compliance report with required actions
├── Documentation Management
│   ├── updateDocumentationStatus() - Master/Local File tracking
│   └── getTransactionsMissingDocumentation() - Documentation gaps
└── Statistics
    └── getTransactionStatistics() - Transaction summary by type/relationship
```

### FTA Transfer Pricing Thresholds

| Threshold | Amount | Requirement |
|-----------|--------|-------------|
| DISCLOSURE_TOTAL | AED 40M | TP Disclosure Form in CT Return |
| DISCLOSURE_PER_CATEGORY | AED 4M | TP Disclosure Form in CT Return |
| CONNECTED_PERSON_NOTED | AED 500K | Note connected person payments |
| MASTER_LOCAL_FILE | AED 200M | Prepare Master File + Local File |
| CBCR_THRESHOLD | AED 3.15B | Country-by-Country Report |

### Arm's Length Testing

- **Tolerance:** 5% variance from arm's length price
- **Adjustment:** Excess above arm's length price is non-deductible
- **Methods Supported:** CUP, Resale Minus, Cost Plus, TNMM, Profit Split

### Integration Points

1. **CtAdjustmentService** - Uses calculateTotalAdjustments() for related party excess in non-deductible expenses
2. **Tax Group Members** - getGroupRevenue() sums revenue across all group members for documentation thresholds
3. **Audit Logs** - All price updates create audit trail with old/new values

## Verification Results

- TypeScript compilation: PASS (no errors in transfer-pricing.service.ts)
- Line count: 1,202 lines (min 300 required)
- All required methods implemented
- DI container registration complete
- Barrel exports configured

## Deviations from Plan

None - plan executed exactly as written.

## Files Changed

| File | Change | Lines |
|------|--------|-------|
| transfer-pricing.service.ts | Created | 1,202 |
| types.ts | Modified | +1 |
| container.ts | Modified | +3 |
| index.ts | Modified | +10 |

## Commit

- `145fdd4`: feat(04-06): add TransferPricingService for CT-07 compliance

## CT-07 Requirement Coverage

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Record RP transactions | COMPLETE | recordTransaction() |
| Arm's length testing | COMPLETE | performArmLengthTest() |
| TP disclosure thresholds | COMPLETE | calculateThresholds() |
| Master/Local File tracking | COMPLETE | updateDocumentationStatus() |
| TP adjustments to CT | COMPLETE | calculateTotalAdjustments() feeds non-deductible |

## Next Phase Readiness

**Phase 04 Progress:** 6/9 plans complete

**Remaining Plans:**
- 04-07: Tax Loss Carry-Forward Service (CT-08)
- 04-08: Tax Group Consolidation Service (CT-09)
- 04-09: CT Integration Tests

**Dependencies Satisfied:**
- TransferPricingService provides TP adjustments for CT calculation
- Threshold calculations ready for CT return generation
- Documentation status tracking operational
