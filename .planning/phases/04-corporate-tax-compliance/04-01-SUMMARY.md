---
phase: 04-corporate-tax-compliance
plan: 01
subsystem: corporate-tax
tags: [prisma, schema, typescript, ct-enums, tax-losses, transfer-pricing, tax-groups]
dependency-graph:
  requires:
    - Phase 2.5 (Accounting Foundation - fiscal_years model)
    - Phase 1 (Multi-tenant - companies, users models)
  provides:
    - CT enums for expense/income classification
    - Tax loss tracking models
    - Related party transaction models
    - Tax group consolidation models
    - CT tax period models
    - TypeScript types for CT calculations
  affects:
    - 04-02 (Non-deductible expenses service)
    - 04-03 (Exempt income service)
    - 04-04 (CT mapping service)
    - 04-07 (Transfer pricing service)
    - 04-09 (Tax group service)
tech-stack:
  added: []
  patterns:
    - Prisma enum with inline comments for CT classification
    - Decimal types for financial precision
    - Relation arrays for bidirectional model access
    - TypeScript const for immutable configuration
key-files:
  created:
    - backend/src/types/corporate-tax.types.ts
  modified:
    - backend/prisma/schema.prisma
decisions:
  - decision: "Use enum values with inline comments"
    rationale: "Documentation embedded in schema for developer clarity"
    date: 2026-01-24
  - decision: "Tax losses linked to fiscal_years via fiscalYearId"
    rationale: "Enables period-based loss tracking matching FTA requirements"
    date: 2026-01-24
  - decision: "CT_CONSTANTS as TypeScript const with Decimal"
    rationale: "Immutable config with high precision for financial calculations"
    date: 2026-01-24
metrics:
  duration: ~5m
  completed: 2026-01-24
---

# Phase 4 Plan 01: Corporate Tax Schema Foundation Summary

**One-liner:** CT schema foundation with 7 enums, 6 models, and 37 TypeScript types for UAE Corporate Tax (9% on profits > AED 375K) including loss carry-forward, transfer pricing, and tax group consolidation.

## What Was Built

### Schema Enums (7 total)

| Enum | Values | Purpose |
|------|--------|---------|
| CtAccountCategory | 20 | Chart of accounts CT mapping (CT-04) |
| CtExpenseClassification | 6 | Expense deductibility (CT-02) |
| CtIncomeClassification | 6 | Income taxability (CT-03) |
| TaxGroupStatus | 4 | Tax group lifecycle (CT-09) |
| CtTaxPeriodStatus | 5 | CT period filing status (CT-01) |
| RelationshipType | 6 | Related party relationships (CT-07) |
| TransferPricingMethod | 5 | OECD transfer pricing methods (CT-07) |

### Schema Models (6 total)

| Model | Table Name | Purpose |
|-------|------------|---------|
| tax_losses | tax_losses | Loss carry-forward tracking with 75% cap |
| tax_loss_usages | tax_loss_usages | Audit trail of loss utilization |
| related_party_transactions | related_party_transactions | Transfer pricing documentation |
| tax_groups | tax_groups | CT consolidation groups (95%+ ownership) |
| tax_group_members | tax_group_members | Group subsidiary membership |
| ct_tax_periods | ct_tax_periods | CT filing periods and status |

### TypeScript Types (37 exports)

**CT Constants:**
- `CT_CONSTANTS` - Immutable configuration:
  - THRESHOLD: AED 375,000 (0% CT below this)
  - RATE: 9% standard CT rate
  - MAX_LOSS_OFFSET: 75% utilization cap
  - SBR_THRESHOLD: AED 3,000,000 (Small Business Relief)
  - TAX_GROUP_OWNERSHIP_MIN: 95%
  - PARTICIPATION_OWNERSHIP_MIN: 5%
  - FILING_DEADLINE_MONTHS: 9 months after period end

**Core Calculation Types:**
- `CtCalculationInput` - Input for CT calculation
- `CtCalculationResult` - Complete CT computation result
- `TaxableIncomeSchedule` - 8-line form layout
- `CtAdjustmentSummary` - Income/expense adjustment summary

**Exempt Income (CT-03):**
- `ExemptIncomeSummary` - Dividends, capital gains, foreign PE
- `DividendExemptionDetail` - Domestic and foreign dividends
- `CapitalGainExemptionDetail` - Qualifying vs non-qualifying
- `ParticipationDetail` - Investment exemption qualification

**Non-Deductible (CT-02):**
- `NonDeductibleSummary` - Fines, entertainment, related party excess
- `NonDeductibleDetail` - Per-account breakdown

**Transfer Pricing (CT-07):**
- `TransferPricingThresholds` - AED 40M disclosure, AED 200M master file
- `TransferPricingCategoryBreakdown` - Per-type transaction summary
- `RelatedPartyTransactionInput` - Transaction creation input
- `ArmLengthTestResult` - Pricing verification result

**Tax Groups (CT-09):**
- `TaxGroupEligibility` - Group formation eligibility check
- `TaxGroupMemberEligibility` - Member qualification (95%+ test)
- `ConsolidatedCtReturn` - Consolidated return structure
- `TaxGroupMemberResult` - Per-member calculation
- `IntercompanyElimination` - Intercompany transaction elimination

**Tax Losses:**
- `TaxLossRecord` - Loss record structure
- `LossOffsetCalculation` - 75% cap application

**Financial Statements (CT-05, CT-06):**
- `CtAdjustedProfitAndLoss` - CT-adjusted P&L
- `CtAdjustedBalanceSheet` - CT-adjusted B/S
- `CtAdjustedSection` - Section with account lines
- `CtAdjustedAccountLine` - Per-account with CT adjustments
- `CtAdjustedLine` - Accounting vs taxable amounts

**Other:**
- `SmallBusinessReliefCheck` - SBR eligibility
- `CtReturnData` - Complete CT return structure
- `OtherAdjustmentsSummary` - Unrealized gains, transitional

## Model Relations Added

**companies model:**
```prisma
taxLosses                 tax_losses[]
relatedPartyTransactions  related_party_transactions[]
taxGroupsAsParent         tax_groups[]              @relation("TaxGroupParent")
taxGroupMemberships       tax_group_members[]       @relation("TaxGroupMember")
ctTaxPeriods              ct_tax_periods[]
```

**users model:**
```prisma
taxLossesCreated          tax_losses[]              @relation("TaxLossCreatedBy")
relatedPartyTxCreated     related_party_transactions[] @relation("RelatedPartyTxCreatedBy")
taxGroupsCreated          tax_groups[]              @relation("TaxGroupCreatedBy")
ctPeriodsFiledBy          ct_tax_periods[]          @relation("CtPeriodFiledBy")
ctPeriodsLockedBy         ct_tax_periods[]          @relation("CtPeriodLockedBy")
```

## Verification Results

| Check | Result |
|-------|--------|
| `npx prisma validate` | PASSED |
| CT enums in schema | 7 enums verified |
| CT models in schema | 6 models verified |
| TypeScript exports | 37 exports verified |
| Schema formatted | `npx prisma format` applied |

## Commits

| Hash | Message |
|------|---------|
| 270b827 | feat(04-01): add corporate tax schema and TypeScript types |

## Files Changed

**Created:**
- `backend/src/types/corporate-tax.types.ts` (569 lines)

**Modified:**
- `backend/prisma/schema.prisma` (+413/-54 lines including format changes)

## Deviations from Plan

None - plan executed exactly as written.

## Must-Haves Verification

| Must-Have | Status | Evidence |
|-----------|--------|----------|
| Tax losses tracked with amount, usage, remaining | DONE | `tax_losses` model with lossAmount, usedAmount, remainingAmount |
| Related party transactions with arm's length pricing | DONE | `related_party_transactions` with armLengthPrice, pricingMethod |
| Tax groups with 95%+ ownership requirement | DONE | `tax_group_members` with shareCapitalPct, votingRightsPct, profitEntitlementPct |
| CT enums cover expense/income classifications | DONE | CtExpenseClassification (6), CtIncomeClassification (6) |
| Fiscal year tax periods for CT filing | DONE | `ct_tax_periods` with periodNumber, status, filingDeadline |

## Key Artifacts Verification

| Artifact | Path | Verification |
|----------|------|--------------|
| Schema with CT models | backend/prisma/schema.prisma | Contains `model tax_losses` |
| TypeScript interfaces | backend/src/types/corporate-tax.types.ts | Exports CtCalculationResult, CtAdjustmentSummary, TaxableIncomeSchedule, CtExpenseClassification |

## Key Links Verification

| Link | Pattern | Verified |
|------|---------|----------|
| corporate-tax.types.ts -> schema.prisma | Type definitions matching schema enums | CtExpenseClassification, CtIncomeClassification types match enums |

## Next Phase Readiness

**CT-01 (Plan 02 - Non-deductible expenses):** Ready
- CtExpenseClassification enum provides classification
- NonDeductibleSummary and NonDeductibleDetail types ready

**CT-03 (Plan 03 - Exempt income):** Ready
- CtIncomeClassification enum provides classification
- ExemptIncomeSummary and ParticipationDetail types ready

**CT-07 (Plan 07 - Transfer pricing):** Ready
- related_party_transactions model ready
- TransferPricingThresholds, ArmLengthTestResult types ready

**CT-09 (Plan 09 - Tax groups):** Ready
- tax_groups and tax_group_members models ready
- TaxGroupEligibility, ConsolidatedCtReturn types ready

## Notes

- Schema uses lowercase model names following existing codebase convention
- CT_CONSTANTS uses Prisma Decimal for financial precision
- All models include audit fields (createdAt, updatedAt, createdById)
- Related party transactions link to journalEntryId for accounting integration
- Tax group members require all three ownership tests >= 95%
