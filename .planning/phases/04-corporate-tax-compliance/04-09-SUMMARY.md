---
phase: 04-corporate-tax-compliance
plan: 09
subsystem: corporate-tax
tags: [testing, permissions, middleware, integration-tests, unit-tests, rbac, ct-compliance]
dependency-graph:
  requires:
    - 04-03 (CtAdjustmentService)
    - 04-04 (CtCalculationService)
    - 04-05 (CtReportService)
    - 04-06 (TransferPricingService)
    - 04-07 (TaxGroupService)
    - 04-08 (CtRetentionService)
  provides:
    - Unit tests for CT calculation (threshold, rate, loss offset)
    - Integration tests for full CT lifecycle
    - CT_PERMISSIONS constant for role-based access
    - CT permissions middleware (requireCtPermission, requireAnyCtPermission, requireAllCtPermissions)
    - Role bundles (TAX_ACCOUNTANT, TAX_MANAGER, CFO, AUDITOR)
  affects:
    - All CT API routes requiring authorization
    - Future CT controller implementations
    - Separation of duties compliance
tech-stack:
  added: []
  patterns:
    - Middleware factory pattern for permission checks
    - Role-based permission bundles
    - Multi-tenant company access validation
    - Mock-based unit testing for services
key-files:
  created:
    - backend/src/services/corporate-tax/__tests__/ct-calculation.test.ts
    - backend/src/services/corporate-tax/__tests__/ct-integration.test.ts
    - backend/src/middleware/ct-permissions.middleware.ts
    - backend/src/types/ct-permissions.ts
  modified: []
decisions:
  - decision: Role-based permission bundles instead of individual assignments
    rationale: Simplifies permission management and enforces separation of duties per FTA compliance
  - decision: TAX_ACCOUNTANT as entry-level role with view-only and classification permissions
    rationale: Day-to-day operations without risk of modifying calculations or approving returns
  - decision: CFO as only role with CT_RETURN_FILE permission
    rationale: Final authority for CT filing aligned with corporate governance
  - decision: AUDITOR role with view-only access
    rationale: Supports external audit requirements without modification risk
  - decision: Mock-based unit tests for calculation service
    rationale: Isolates CT calculation logic from database dependencies
metrics:
  duration: ~8 minutes
  completed: 2026-01-24
---

# Phase 04 Plan 09: CT Integration Tests and Permissions Summary

**One-liner:** Comprehensive CT unit tests (871 lines), integration tests (774 lines), and role-based permissions middleware (591 lines) with TAX_ACCOUNTANT/TAX_MANAGER/CFO/AUDITOR role bundles for FTA-compliant access control.

## Objectives Achieved

1. **CT Calculation Unit Tests** - 871 lines covering 9% rate, AED 375K threshold, 75% loss offset, SBR eligibility, QFZP handling
2. **CT Integration Tests** - 774 lines covering full CT lifecycle, non-deductible expenses, exempt income, transfer pricing, tax groups
3. **CT Permission Types** - 316 lines defining CT_PERMISSIONS constant and role bundles
4. **CT Permissions Middleware** - 591 lines with requireCtPermission(), requireAnyCtPermission(), requireAllCtPermissions()

## Implementation Details

### CT Calculation Unit Tests (871 lines)

```
ct-calculation.test.ts
├── CT Rate and Threshold
│   ├── 0% CT for income below AED 375,000
│   ├── 9% CT on income exceeding AED 375,000
│   ├── Exactly at threshold handling
│   ├── Negative income (losses)
│   ├── Very large income amounts
│   └── Income slightly above threshold
├── Loss Carry-Forward
│   ├── 75% maximum offset cap
│   ├── FIFO loss application order
│   ├── No available losses
│   ├── Zero/negative taxable income
│   └── Boundary case at exactly 75%
├── Small Business Relief
│   ├── Eligible (<= AED 3M revenue)
│   ├── Ineligible (> AED 3M)
│   ├── Post-December 2026 rejection
│   ├── QFZP exclusion
│   └── Multi-period revenue check
├── Taxable Income Schedule
│   ├── Schedule format generation
│   └── Adjustment line mapping
├── Tax Loss Recording
│   ├── New loss creation
│   ├── Available losses retrieval
│   └── Total loss calculation
├── Input Validation
│   ├── Missing company ID
│   ├── Missing fiscal year ID
│   ├── Invalid date range
│   └── Period exceeding 18 months
├── QFZP Calculation
│   ├── Non-QFZP identification
│   └── QFZP flag handling
└── Loss Offset Calculation
    ├── Detail calculation
    └── FIFO ordering verification
```

### CT Integration Tests (774 lines)

```
ct-integration.test.ts
├── Full CT Calculation Lifecycle
│   ├── CT from accounting data
│   ├── Period tracking
│   └── Multiple periods
├── Non-Deductible Expense Handling
│   ├── Fines 100% non-deductible
│   ├── Entertainment 50% non-deductible
│   ├── Total non-deductible aggregation
│   ├── Add-back to taxable income
│   └── Category breakdown
├── Exempt Income Handling
│   ├── Dividend exemption
│   ├── Participation exemption rules
│   ├── Subtraction from taxable income
│   ├── Capital gains exemption
│   └── Total exempt aggregation
├── Transfer Pricing Integration
│   ├── Arm's length differences
│   ├── Tolerance calculation
│   ├── AED 40M disclosure threshold
│   ├── Transaction aggregation by type
│   └── AED 500K connected person threshold
├── Tax Group Consolidation
│   ├── 95% ownership verification
│   ├── Below-threshold rejection
│   ├── Member income consolidation
│   ├── Intercompany elimination
│   ├── Consolidated CT calculation
│   ├── Loss transfers between members
│   └── 75% limit on transfers
├── CT-Adjusted Reports
│   ├── CT-adjusted P&L
│   ├── Account-level adjustments
│   └── Deferred tax assets
├── Filing Deadline Calculation
│   ├── 9-month deadline
│   └── Non-December year-end
├── Retention Requirements
│   ├── 7-year retention
│   └── Expiry warning
├── CT Return Data Structure
│   ├── Complete return data
│   └── TP disclosure inclusion
└── Edge Cases
    ├── Zero income
    ├── Threshold boundaries
    ├── Small decimal amounts
    ├── Rounding behavior
    └── Multiple adjustment types
```

### CT Permission Types (316 lines)

```
ct-permissions.ts
├── CT_PERMISSIONS Constant
│   ├── Classification: ct:classify:expense, ct:classify:income
│   ├── Chart Mapping: ct:chart-mapping:view, ct:chart-mapping:edit
│   ├── Calculation: ct:calculation:view, ct:calculation:run
│   ├── Reports: ct:report:view, ct:report:generate, ct:report:export
│   ├── Return: ct:return:prepare, ct:return:approve, ct:return:file
│   ├── Transfer Pricing: ct:tp:transaction:*, ct:tp:arm-length:*, ct:tp:documentation
│   ├── Tax Groups: ct:group:create, ct:group:manage, ct:group:consolidate
│   ├── Losses: ct:loss:record, ct:loss:transfer, ct:loss:view
│   ├── Config: ct:config:view, ct:config:edit
│   ├── Audit: ct:audit:view, ct:audit:export
│   └── Retention: ct:retention:view, ct:retention:manage
├── Role Bundles (CT_ROLE_PERMISSIONS)
│   ├── TAX_ACCOUNTANT (11 permissions - view + classify)
│   ├── TAX_MANAGER (20 permissions - +edit, run, prepare)
│   ├── CFO (all 24 permissions - +approve, file, manage)
│   └── AUDITOR (9 permissions - view only)
├── Permission Groups
│   ├── VIEW_ONLY
│   ├── CLASSIFICATION
│   ├── CT_RETURN_WORKFLOW
│   ├── TRANSFER_PRICING
│   ├── TAX_GROUP
│   └── LOSS_MANAGEMENT
└── Type Guards
    ├── isCtPermission()
    ├── roleHasPermission()
    ├── getPermissionsForRole()
    ├── hasAllPermissions()
    └── hasAnyPermission()
```

### CT Permissions Middleware (591 lines)

```
ct-permissions.middleware.ts
├── Helper Functions
│   ├── hasCtPermission() - Check single permission for roles
│   ├── getUserCtPermissions() - Get all CT permissions for user
│   ├── validateCompanyAccess() - Multi-tenant isolation
│   └── logPermissionDenied() - Security audit logging
├── Middleware Functions
│   ├── requireCtPermission(permission) - Single permission check
│   ├── requireAnyCtPermission(permissions[]) - OR logic
│   ├── requireAllCtPermissions(permissions[]) - AND logic
│   └── requireCtPackagePermission(pkg, perm) - Package + permission combo
├── Utility Exports
│   ├── getEffectiveCtPermissions(userId) - Async permission fetch
│   └── canPerformCtOperation(userId, perm) - Operation check
└── Features
    ├── Master org user bypass
    ├── Company access validation
    ├── Role-based permission lookup
    ├── Audit logging on denied access
    └── Proper error responses with codes
```

### Role Permission Matrix

| Permission | TAX_ACCOUNTANT | TAX_MANAGER | CFO | AUDITOR |
|-----------|----------------|-------------|-----|---------|
| ct:classify:* | Yes | Yes | Yes | No |
| ct:chart-mapping:view | Yes | Yes | Yes | Yes |
| ct:chart-mapping:edit | No | Yes | Yes | No |
| ct:calculation:view | Yes | Yes | Yes | Yes |
| ct:calculation:run | No | Yes | Yes | No |
| ct:report:view | Yes | Yes | Yes | Yes |
| ct:report:generate | No | Yes | Yes | No |
| ct:return:prepare | No | Yes | Yes | No |
| ct:return:approve | No | No | Yes | No |
| ct:return:file | No | No | Yes | No |
| ct:tp:* | View only | Full | Full | View only |
| ct:group:* | No | No | Yes | No |
| ct:loss:record | No | Yes | Yes | No |
| ct:loss:transfer | No | No | Yes | No |
| ct:config:edit | No | No | Yes | No |
| ct:retention:manage | No | No | Yes | No |

## Verification Results

- TypeScript compilation: PASS (no errors in new files)
- ct-calculation.test.ts: 871 lines (min 250 required)
- ct-integration.test.ts: 774 lines (min 200 required)
- ct-permissions.middleware.ts: 591 lines (min 100 required)
- ct-permissions.ts: 316 lines (supporting types)
- Test files discovered by Jest

## Deviations from Plan

None - plan executed exactly as written.

## Files Changed

| File | Change | Lines |
|------|--------|-------|
| ct-calculation.test.ts | Created | 871 |
| ct-integration.test.ts | Created | 774 |
| ct-permissions.middleware.ts | Created | 591 |
| ct-permissions.ts | Created | 316 |
| **Total** | | **2,552** |

## Commits

- `f1ad59d`: feat(04-09): add CT integration tests and permissions middleware

## Test Coverage Summary

| Test File | Describe Blocks | Test Cases |
|-----------|-----------------|------------|
| ct-calculation.test.ts | 12 | 35 |
| ct-integration.test.ts | 11 | 41 |
| **Total** | 23 | 76 |

## Next Phase Readiness

**Phase 04 Progress:** 9/9 plans complete

**Phase 04 Complete!** All CT compliance components implemented:
1. CT Schema Extensions
2. CtChartMappingService
3. CtAdjustmentService
4. CtCalculationService
5. CtReportService
6. TransferPricingService
7. TaxGroupService
8. CtRetentionService
9. CT Tests and Permissions

**Ready for Phase 05:** Fixed Asset and Depreciation Module
