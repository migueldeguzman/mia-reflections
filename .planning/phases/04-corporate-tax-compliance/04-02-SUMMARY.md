---
phase: 04-corporate-tax-compliance
plan: 02
subsystem: corporate-tax
tags: [ct, chart-mapping, expense-classification, income-classification, fta-compliance]
status: complete

dependency-graph:
  requires: [04-01]
  provides: [CT-04-chart-mapping]
  affects: [04-03, 04-05, 04-06]

tech-stack:
  added: []
  patterns: [service-layer, pattern-matching, bulk-operations, di-injection]

file-tracking:
  key-files:
    created:
      - web-erp-app/backend/src/services/corporate-tax/ct-chart-mapping.service.ts
      - web-erp-app/backend/src/services/corporate-tax/index.ts
      - web-erp-app/backend/prisma/seed/ct-chart-mappings.ts
    modified:
      - web-erp-app/backend/src/config/types.ts
      - web-erp-app/backend/src/config/container.ts

decisions:
  - id: CT-MAPPING-01
    decision: Pattern-based matching for auto-classification
    rationale: Flexible regex matching on account codes and names enables bulk mapping
  - id: CT-MAPPING-02
    decision: Two-pass matching algorithm
    rationale: First pass matches both code+name (specific), second pass code-only (fallback)
  - id: CT-MAPPING-03
    decision: Service uses existing accounts model
    rationale: CT fields will be added to accounts by 04-01 schema migration

metrics:
  duration: ~6 minutes
  lines-added: ~1,500
  files-created: 3
  files-modified: 2
  completed: 2026-01-24
---

# Phase 04 Plan 02: CT Chart Mapping Service Summary

CtChartMappingService with 889 lines providing auto-classification of chart of accounts for UAE Corporate Tax with 15+ default mapping rules covering entertainment (50% deductible), fines (0% deductible), and related party expenses.

## Tasks Completed

### Task 1: Create CT Chart Mapping Service

Created `ct-chart-mapping.service.ts` with:

**Types Exported:**
- `CtAccountCategory` - 20 account categories for CT grouping
- `CtExpenseClassification` - 6 deductibility levels
- `CtIncomeClassification` - 6 income tax treatments
- `CtMappingInput` - Input for single account mapping
- `CtMappingRule` - Pattern-based mapping rule
- `BulkMappingResult` - Bulk operation result tracking
- `CtMappingSummary` - Coverage statistics
- `NonDeductibleAccount` - Account with deductibility info
- `ExemptIncomeAccount` - Account with exemption info
- `MappingValidationResult` - Validation result with issues/warnings

**Methods Implemented:**
- `updateAccountMapping()` - Update single account CT classification
- `applyDefaultMappings()` - Bulk apply DEFAULT_CT_MAPPING_RULES
- `getMappingSummary()` - Get coverage statistics by category
- `getAccountsByExpenseClass()` - Query accounts by expense classification
- `getAccountsByIncomeClass()` - Query accounts by income classification
- `getNonDeductibleAccounts()` - Get all non-deductible expense accounts
- `getExemptIncomeAccounts()` - Get all exempt income accounts
- `validateMappings()` - Validate mapping completeness

**DEFAULT_CT_MAPPING_RULES (15+ patterns):**
- Trading income (4xxx) - TAXABLE
- Interest income - TAXABLE
- Dividend income - EXEMPT_DIVIDEND
- Capital gains - TAXABLE (check participation exemption)
- Cost of sales (5xxx) - FULLY_DEDUCTIBLE
- Staff costs (60xx-61xx) - FULLY_DEDUCTIBLE
- Admin expenses (62xx-64xx) - FULLY_DEDUCTIBLE
- Entertainment (65xx) - ENTERTAINMENT_50_PCT
- Depreciation (66xx) - FULLY_DEDUCTIBLE
- Finance costs (67xx) - FULLY_DEDUCTIBLE
- Fines/Penalties (680x-682x) - NON_DEDUCTIBLE
- Donations (683x-685x) - Based on QPBE status
- Related party (69xx) - RELATED_PARTY
- Fixed assets (10xx-14xx) - Balance sheet tracking
- Investments (15xx-17xx) - Participation exemption tracking
- Related party receivables/payables - Transfer pricing

### Task 2: Create CT Chart Mapping Seed Script

Created `ct-chart-mappings.ts` with:

**CT_ACCOUNT_TEMPLATES (20+ templates):**
- Income categories with proper CT income classifications
- Expense categories with deductibility percentages
- Balance sheet accounts for CT reporting
- Related party accounts flagged for arm's length test

**Functions Exported:**
- `seedCtChartMappings()` - Bulk seed CT mappings for a company
- `previewCtMappings()` - Preview what would be mapped without changes
- `getCtTemplates()` - Get templates for inspection
- `findMatchingTemplate()` - Internal matching function

**CLI Runner:**
```bash
npx ts-node prisma/seed/ct-chart-mappings.ts --companyId=<uuid>
npx ts-node prisma/seed/ct-chart-mappings.ts --companyId=<uuid> --preview
```

### Task 3: Register in DI Container

**types.ts Updates:**
- Added `CtChartMappingService: Symbol.for('CtChartMappingService')`

**container.ts Updates:**
- Imported CtChartMappingService
- Bound as singleton: `container.bind<CtChartMappingService>(TYPES.CtChartMappingService).to(CtChartMappingService).inSingletonScope()`

**index.ts Barrel Export:**
- Exports CtChartMappingService and all types
- Exports DEFAULT_CT_MAPPING_RULES constant

## Verification Results

| Check | Result |
|-------|--------|
| ct-chart-mapping.service.ts exists | PASS |
| Service has 200+ lines (889 actual) | PASS |
| CtChartMappingService class exported | PASS |
| ENTERTAINMENT_50_PCT rule exists | PASS |
| NON_DEDUCTIBLE rule for fines | PASS |
| Seed file contains ENTERTAINMENT | PASS |
| DI container has CtChartMappingService | PASS |
| TypeScript compiles (new files) | PASS |

## FTA Compliance Mapping

| FTA Article | Implementation |
|-------------|----------------|
| Article 33(2) | Entertainment 50% deductible |
| Article 33 | Fines/Penalties 0% deductible |
| Article 35 | Related party flagged for arm's length |
| Participation Exemption | Dividend/Capital gains flagged |

## Key Design Decisions

1. **Pattern-Based Matching**: Uses regex on account codes with optional name keywords for flexible auto-mapping

2. **Two-Pass Algorithm**:
   - First pass: Match both code pattern AND name keyword (more specific)
   - Second pass: Match code pattern only (fallback)

3. **Service Integration**: Works with existing `accounts` model; CT fields added by 04-01 schema migration

4. **Deductibility Percentages**:
   - FULLY_DEDUCTIBLE: 100%
   - ENTERTAINMENT_50_PCT: 50%
   - NON_DEDUCTIBLE: 0%
   - RELATED_PARTY: 100% (subject to arm's length)

## Deviations from Plan

None - plan executed exactly as written. Note: Files were committed as part of 04-01 parallel execution.

## Files Delivered

| File | Lines | Purpose |
|------|-------|---------|
| ct-chart-mapping.service.ts | 889 | Main service with methods and rules |
| ct-chart-mappings.ts | 554 | Seed script with CLI |
| index.ts | 34 | Barrel exports |

## Next Phase Readiness

**CT-03 (Exempt Income)** can use:
- `getExemptIncomeAccounts()` for querying exempt income accounts
- `CtIncomeClassification` types for classification

**CT-05/CT-06 (CT-Adjusted Statements)** can use:
- `getMappingSummary()` for account categorization
- `getNonDeductibleAccounts()` for adjustment calculations

**CT-02 (Non-Deductible Expenses)** can use:
- `getNonDeductibleAccounts()` for expense aggregation
- `getDeductiblePercent()` for partial deductibility calculations

## Commit Reference

| Commit | Message |
|--------|---------|
| 1c9f718 | feat(04-01): add corporate tax schema foundation |

Note: Plan 04-02 artifacts were included in the 04-01 commit during parallel execution.
