---
phase: 03-vat-compliance-engine
plan: 08
subsystem: vat-adjustments
tags: [bad-debt-relief, fta-article-64, vat-recovery, six-month-rule]
dependency-graph:
  requires: ["03-01", "03-05"]
  provides: ["BadDebtReliefService", "FTA Article 64 compliance"]
  affects: ["03-10"]
tech-stack:
  added: []
  patterns: ["eligibility-based-claiming", "lifecycle-tracking", "reversal-handling"]
key-files:
  created:
    - backend/src/services/vat/bad-debt-relief.service.ts
  modified:
    - backend/src/config/container.ts
    - backend/src/services/vat/index.ts
decisions:
  - id: "eligibility-days-183"
    summary: "Use 183 days for 6-month eligibility period"
    rationale: "FTA Article 64 requires 6+ months from due date; 183 days = average 6 months"
  - id: "due-date-not-invoice-date"
    summary: "6-month check uses payment DUE DATE"
    rationale: "FTA explicitly specifies payment due date, not invoice date"
  - id: "proportional-relief"
    summary: "Relief amount proportional to outstanding balance"
    rationale: "If partially paid, relief only on VAT portion of remaining balance"
metrics:
  duration: "7m"
  completed: "2026-01-24"
---

# Phase 3 Plan 08: Bad Debt Relief Service Summary

**One-liner:** FTA Article 64 bad debt VAT recovery with 6-month eligibility from due date, write-off and notification tracking, and VAT return integration.

## Implementation Details

### BadDebtReliefService (893 lines)

Created comprehensive bad debt relief tracking service per FTA Article 64 requirements:

**Core Lifecycle Methods:**
- `createBadDebtRelief()` - Creates relief record for eligible invoice
- `markWrittenOff()` - Records debt write-off in accounting (FTA requirement)
- `markNotified()` - Records customer notification (FTA requirement)
- `claimRelief()` - Claims relief in VAT period (Box 1 negative adjustment)
- `reverseRelief()` - Reverses relief when customer subsequently pays

**Eligibility Checking:**
- `checkEligibility()` - Validates all FTA requirements:
  - Invoice has outstanding balance
  - Invoice has VAT amount
  - 6+ months from payment DUE DATE (not invoice date)
  - No existing relief for invoice
- `getEligibleInvoices()` - Lists all invoices eligible for bad debt relief

**VAT Return Integration:**
- `getReliefForPeriod()` - Gets claimed/reversed reliefs for Form 201
- Claimed reliefs: Negative adjustment in Box 1
- Reversed reliefs: Positive adjustment in Box 1
- Net adjustment calculated for VAT return

**Helper Methods:**
- `getRelief()` - Get single relief record
- `listReliefs()` - Paginated list with status filtering

### FTA Article 64 Compliance

The service implements all five FTA requirements:

| Requirement | Implementation |
|-------------|---------------|
| Supply made and VAT accounted | Invoice must have taxAmount > 0 |
| 6+ months from due date | ELIGIBILITY_DAYS = 183, checks dueDate |
| Debt written off | debtWrittenOff flag, writtenOffDate tracked |
| Customer notified | customerNotified flag, notificationDate tracked |
| Documentation 5+ years | Full audit logging, relief records permanent |

### Status Lifecycle

```
PENDING → ELIGIBLE → CLAIMED → REVERSED (if paid)
   ↓         ↓
   └─────────┴── Requirements not met: stays in status
```

**Status Transitions:**
- `PENDING`: Relief created, awaiting requirements
- `ELIGIBLE`: 6 months passed + written off + customer notified
- `CLAIMED`: Included in VAT return Box 1 adjustment
- `REVERSED`: Customer paid after claiming (added back to Box 1)

### Key Business Rules

1. **6-Month Rule:** Uses payment DUE DATE, not invoice date
2. **Proportional Relief:** `(outstanding / total) * VAT`
3. **Prerequisites:** Both write-off AND notification required before claiming
4. **Period Validation:** Can only claim in OPEN VAT periods
5. **Reversal Tracking:** Full audit trail when relief is reversed

## Files Changed

| File | Change Type | Purpose |
|------|-------------|---------|
| `backend/src/services/vat/bad-debt-relief.service.ts` | Created | Main service (893 lines) |
| `backend/src/config/container.ts` | Modified | DI container binding |
| `backend/src/services/vat/index.ts` | Modified | Module exports |

## Verification

- TypeScript compilation: No errors in BadDebtReliefService files
- 6-month eligibility uses dueDate (lines 172, 531-533)
- Write-off and notification both required for ELIGIBLE status
- Relief amount is proportional to outstanding balance
- ELIGIBILITY_DAYS = 183 (line 123)

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| ELIGIBILITY_DAYS = 183 | Average 6 months (182.5 days), FTA says "more than 6 months" |
| Check dueDate not invoiceDate | FTA Article 64 explicitly specifies payment due date |
| Proportional relief calculation | If partially paid, VAT relief only on remaining portion |
| Audit logging on all actions | FTA requires 5+ year documentation retention |

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

### Ready for 03-09 (Input VAT Recovery)
- BadDebtReliefService provides recovery mechanism for output VAT
- Pattern can be replicated for input VAT deductions
- Integration point: VatReturnService can include bad debt adjustments

### Ready for 03-10 (VAT Automation)
- Relief lifecycle fully automated once requirements marked
- Status transitions handled automatically
- Integration with VAT period filing workflow

## Commits

| Hash | Message |
|------|---------|
| 41d6e03 | feat(03-08): add bad debt relief service for VAT recovery on unpaid invoices |
