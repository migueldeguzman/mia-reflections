---
phase: 05-wps-payroll-compliance
plan: 05
subsystem: payroll-cycle-management
tags: [wps, payroll, cycle, state-machine, api, crud]
dependency-graph:
  requires:
    - 05-01 (WPS Schema Foundation)
    - 05-02 (IBAN Validation)
    - 05-03 (Bank Routing Service)
    - 05-04 (WPS SIF Service)
  provides:
    - Payroll cycle state management service
    - Full CRUD operations for payroll cycles
    - Employee salary record management
    - WPS submission tracking
    - API endpoints for payroll management
  affects:
    - 05-06 (WPS Error Handling)
    - Dashboard payroll views
    - HR integration
tech-stack:
  added: []
  patterns:
    - State machine for cycle status transitions
    - Injectable service/controller pattern with inversify
    - Lazy controller resolution in routes
    - Prisma Decimal for financial precision
key-files:
  created:
    - web-erp-app/backend/src/services/payroll/payroll-cycle.service.ts
    - web-erp-app/backend/src/controllers/payroll/payroll-cycle.controller.ts
    - web-erp-app/backend/src/routes/payroll/payroll.routes.ts
  modified:
    - web-erp-app/backend/src/config/types.ts
    - web-erp-app/backend/src/config/container.ts
    - web-erp-app/backend/src/setup/routes.setup.ts
decisions:
  - id: CYC-01
    title: State machine validation
    choice: Explicit transition validation using PAYROLL_CYCLE_TRANSITIONS map
    rationale: Prevents invalid state jumps; provides clear error messages
  - id: CYC-02
    title: DRAFT-only edits
    choice: All employee add/edit/remove operations require DRAFT status
    rationale: Prevents modification after processing begins
  - id: CYC-03
    title: Lazy controller resolution
    choice: Use getController() function instead of top-level container.get()
    rationale: Avoids module load-time DI resolution issues
  - id: CYC-04
    title: Automatic totals calculation
    choice: updateCycleTotals() called after every employee change
    rationale: Keeps cycle summary always accurate
metrics:
  duration: ~18 minutes
  completed: 2026-01-24
---

# Phase 05 Plan 05: Payroll Cycle Management Summary

**One-liner:** Full payroll cycle state machine with CRUD operations, IBAN validation, routing code lookup, SIF generation integration, and secured API endpoints.

## What Was Built

### 1. PayrollCycleService (Task 1)

Created comprehensive payroll cycle management service at `web-erp-app/backend/src/services/payroll/payroll-cycle.service.ts` (999 lines):

**State Machine:**

```
DRAFT ─────→ PROCESSING ─────→ READY ─────→ SUBMITTED ─────→ ACCEPTED ─────→ COMPLETED
  │              │                │                              │
  │              │                │                              │
  │              ↓                ↓                              ↓
  └────────────────────────────→ DRAFT ←────────────────── REJECTED
  │
  ↓
CANCELLED (terminal)
```

**Core Methods:**

| Method | Purpose |
|--------|---------|
| `createPayrollCycle(context, input)` | Create new cycle with WPS agent validation |
| `getPayrollCycle(context, cycleId)` | Get cycle by ID with company validation |
| `listPayrollCycles(context, options)` | List cycles with pagination and filters |
| `addEmployeeToPayroll(context, cycleId, input)` | Add employee (DRAFT only) |
| `updateSalaryRecord(context, recordId, input)` | Update employee salary (DRAFT only) |
| `removeEmployeeFromPayroll(context, recordId)` | Remove employee (DRAFT only) |
| `transitionCycleStatus(context, cycleId, newStatus)` | Validate and transition status |
| `generateSif(context, cycleId, employerConfig)` | Generate SIF and transition to READY |
| `recordWpsSubmission(context, cycleId, data)` | Record submission, transition to SUBMITTED |
| `recordWpsResponse(context, submissionId, accepted, details)` | Record MOHRE response |
| `completeCycle(context, cycleId)` | Move ACCEPTED cycle to COMPLETED |
| `getSalaryRecords(context, cycleId)` | Get all employees in cycle |

**Validations:**

- IBAN validation using `validateUaeIban()` before adding employee
- Routing code lookup via `BankRoutingService.getRoutingCodeForIban()`
- Net salary must be greater than zero
- Duplicate employee check per cycle
- Company isolation (multi-tenant)

### 2. PayrollCycleController (Task 2)

Created API controller at `web-erp-app/backend/src/controllers/payroll/payroll-cycle.controller.ts` (610 lines):

**Endpoints:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/cycles` | POST | Create new payroll cycle |
| `/cycles` | GET | List cycles with filters |
| `/cycles/:id` | GET | Get cycle by ID |
| `/cycles/:id/employees` | POST | Add employee to cycle |
| `/cycles/:id/employees` | GET | Get salary records |
| `/cycles/:cycleId/employees/:recordId` | PUT | Update salary record |
| `/cycles/:cycleId/employees/:recordId` | DELETE | Remove employee |
| `/cycles/:id/transition` | POST | Transition status |
| `/cycles/:id/generate-sif` | POST | Generate SIF file |
| `/cycles/:id/submit` | POST | Record WPS submission |
| `/cycles/:id/complete` | POST | Complete cycle |
| `/submissions/:id/response` | POST | Record WPS response |

**Error Handling:**

- 400: Validation errors, invalid status transitions
- 403: Access denied (cross-company)
- 404: Resource not found
- 409: Duplicate employee
- 500: Server errors

### 3. Routes and DI Registration (Task 3)

**Routes (`web-erp-app/backend/src/routes/payroll/payroll.routes.ts`):**

- Registered at `/api/payroll`
- Uses lazy controller resolution to avoid load-time DI issues
- All routes protected with `authenticate` middleware
- Permission-based access control

**Permissions Required:**

| Permission | Endpoints |
|------------|-----------|
| `payroll.view` | GET /cycles, GET /cycles/:id, GET /cycles/:id/employees |
| `payroll.create` | POST /cycles |
| `payroll.edit` | POST /employees, PUT /employees, DELETE /employees, POST /transition |
| `payroll.process` | POST /generate-sif |
| `payroll.submit` | POST /submit, POST /submissions/:id/response |
| `payroll.complete` | POST /complete |

**DI Bindings:**

```typescript
// types.ts
PayrollCycleService: Symbol.for('PayrollCycleService'),
PayrollCycleController: Symbol.for('PayrollCycleController'),

// container.ts
container.bind<PayrollCycleService>(TYPES.PayrollCycleService).to(PayrollCycleService).inSingletonScope();
container.bind<PayrollCycleController>(TYPES.PayrollCycleController).to(PayrollCycleController).inSingletonScope();
```

## Verification Results

| Check | Status |
|-------|--------|
| PayrollCycleService compiles | PASS |
| PayrollCycleController compiles | PASS |
| Routes register without error | PASS |
| Server starts successfully | PASS |
| State machine transitions validated | PASS |
| IBAN validation integrated | PASS |
| Routing code lookup integrated | PASS |
| SIF generation integrated | PASS |
| All endpoints secured with auth | PASS |

## Success Criteria Verification

| Criterion | Status |
|-----------|--------|
| PayrollCycleService implements full state machine with valid transitions | PASS |
| Employee addition in DRAFT status only | PASS |
| IBAN validated before adding employee | PASS |
| Routing code looked up from BankRoutingService | PASS |
| SIF generation moves cycle from DRAFT/PROCESSING to READY | PASS |
| WPS submission moves cycle to SUBMITTED | PASS |
| All endpoints secured with authentication and permissions | PASS |

## Files Changed

| File | Change |
|------|--------|
| `web-erp-app/backend/src/services/payroll/payroll-cycle.service.ts` | Created (999 lines) |
| `web-erp-app/backend/src/controllers/payroll/payroll-cycle.controller.ts` | Created (610 lines) |
| `web-erp-app/backend/src/routes/payroll/payroll.routes.ts` | Created (200 lines) |
| `web-erp-app/backend/src/config/types.ts` | Added PayrollCycleService, PayrollCycleController |
| `web-erp-app/backend/src/config/container.ts` | Registered service and controller |
| `web-erp-app/backend/src/setup/routes.setup.ts` | Added payroll routes |

## Commits

| Hash | Message |
|------|---------|
| 19ef772 | feat(05-05): create PayrollCycleService with state machine |
| 9d13d6a | feat(05-05): create PayrollCycleController for API endpoints |
| 06d956e | feat(05-05): create payroll routes and register DI bindings |

## Deviations from Plan

None - plan executed exactly as written.

## Integration Points

### Upstream Dependencies
- **05-01 (WPS Schema):** Uses `payroll_cycles`, `employee_salary_records`, `wps_submissions`, `wps_agents` models
- **05-02 (IBAN Validation):** Uses `validateUaeIban()` for employee IBAN validation
- **05-03 (BankRoutingService):** Uses `getRoutingCodeForIban()` for routing code lookup
- **05-04 (WpsSifService):** Uses `generateSifFile()` for SIF generation

### Downstream Consumers
- **05-06 (WPS Error Handling):** Will handle WPS rejection errors
- **Dashboard:** Will display payroll cycle status and totals
- **HR Module:** Will integrate for employee selection

### Usage Example

```typescript
import { container } from '@/config/container';
import { TYPES } from '@/config/types';
import { PayrollCycleService } from '@/services/payroll/payroll-cycle.service';

// Get service from DI container
const cycleService = container.get<PayrollCycleService>(TYPES.PayrollCycleService);

// Create a payroll cycle
const cycle = await cycleService.createPayrollCycle(
  { companyId: 'company-uuid', userId: 'user-uuid' },
  {
    salaryMonth: '202601',
    payPeriodStart: new Date('2026-01-01'),
    payPeriodEnd: new Date('2026-01-31'),
    paymentDate: new Date('2026-02-01'),
    wpsAgentId: 'agent-uuid',
  }
);

// Add employees
await cycleService.addEmployeeToPayroll(context, cycle.id, {
  employeeId: 'emp-uuid',
  personCode: '12345678901234',
  iban: 'AE070331234567890123456',
  basicSalary: 10000,
  housingAllowance: 2000,
});

// Generate SIF (transitions to READY)
const sif = await cycleService.generateSif(context, cycle.id, {
  molEstablishmentId: '1234567890123',
  employerRoutingCode: '000000033',
});

// Record submission (transitions to SUBMITTED)
await cycleService.recordWpsSubmission(context, cycle.id, {
  sifFileName: sif.fileName,
  sifFileUrl: '/uploads/sif/...',
});

// Record acceptance (transitions to ACCEPTED)
await cycleService.recordWpsResponse(context, submissionId, true, {
  agentReference: 'BANK-REF-123',
  acceptedCount: 5,
});

// Complete cycle (transitions to COMPLETED)
await cycleService.completeCycle(context, cycle.id);
```

## Next Phase Readiness

This plan completes the core payroll cycle management functionality. Next:
- **05-06:** WPS error handling and resolution workflow
- **Frontend:** Payroll cycle management UI
- **Reports:** Payroll cycle reports and exports
