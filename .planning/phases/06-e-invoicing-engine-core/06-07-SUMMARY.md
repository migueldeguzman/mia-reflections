---
phase: 06-e-invoicing-engine-core
plan: 07
summary: "E-Invoice permission types and middleware with 21 permission codes and 4 role bundles following CT/VAT patterns"
subsystem: einvoice-permissions
tags: [permissions, middleware, rbac, fta-compliance]

dependency-graph:
  requires: [06-06]
  provides: ["einvoice-permissions", "einvoice-middleware"]
  affects: [06-08, 07-*]

tech-stack:
  added: []
  patterns: ["permission-middleware", "role-bundles", "separation-of-duties"]

key-files:
  created:
    - backend/src/types/einvoice-permissions.ts
    - backend/src/middleware/einvoice-permissions.middleware.ts
  modified: []

decisions:
  - "Record<string, EInvoicePermission[]> for role bundles - flexible type handling"
  - "21 permission codes covering 7 categories (generate, archive, verify, submit, config, report, admin)"
  - "4 role bundles following separation of duties (Accountant, Finance Manager, CFO, Auditor)"
  - "Superuser/Master org bypass for elevated access"

metrics:
  duration: "~10 minutes"
  completed: "2026-01-24"
---

# Phase 6 Plan 07: E-Invoice Permissions Summary

21 permission codes in einvoice:action:scope format with 4 role bundles and permission middleware following CT/VAT patterns.

## What Was Built

### Permission Constants (Task 1)
Created `einvoice-permissions.ts` with comprehensive e-invoice access control:

**Permission Codes (21 total):**
- **Generation (4):** view, create, batch, credit
- **Archive (4):** view, download, list, search
- **Verification (2):** integrity, retention
- **Submission (4):** initiate, view, retry, cancel
- **Configuration (3):** view, edit, asp
- **Reporting (3):** view, export, statistics
- **Admin (1):** full

**Role Bundles:**
| Role | Permissions | Purpose |
|------|-------------|---------|
| ACCOUNTANT | 8 | Generate e-invoices, view archives, view reports |
| FINANCE_MANAGER | 16 | + Batch, verify, submit, export |
| CFO | 21 | Full access including config and admin |
| AUDITOR | 7 | Read-only for compliance verification |

**Utilities:**
- `isEInvoicePermission()` - Type guard
- `roleHasEInvoicePermission()` - Check role permission
- `getEInvoicePermissionsForRole()` - Get role's permissions
- `hasAllEInvoicePermissions()` - Check all permissions
- `hasAnyEInvoicePermission()` - Check any permission
- `EINVOICE_PERMISSION_DESCRIPTIONS` - Human-readable descriptions
- `EINVOICE_PERMISSION_GROUPS` - UI grouping

### Permission Middleware (Task 2)
Created `einvoice-permissions.middleware.ts` following CT patterns:

**Middleware Functions:**
- `requireEInvoicePermission(permission)` - Single permission check
- `requireAnyEInvoicePermission(permissions[])` - OR logic
- `requireAllEInvoicePermissions(permissions[])` - AND logic
- `validateEInvoiceCompanyAccess()` - Multi-tenant isolation

**Features:**
- Database role lookup from `userRole_New` table
- Superuser bypass (ADMIN, SUPER_ADMIN, isMasterOrgUser)
- Audit logging for denied access
- Company access validation for multi-tenant isolation
- Generic error responses (security hardened)

**Usage Example:**
```typescript
import { requireEInvoicePermission, EINVOICE_PERMISSIONS } from './einvoice-permissions.middleware';

router.post('/einvoices/generate',
  authenticateJWT,
  requireEInvoicePermission(EINVOICE_PERMISSIONS.GENERATE_CREATE),
  controller.generateEInvoice
);
```

## Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `backend/src/types/einvoice-permissions.ts` | 371 | Permission constants, role bundles, utilities |
| `backend/src/middleware/einvoice-permissions.middleware.ts` | 615 | Permission middleware functions |

## Technical Decisions

1. **Record<string, EInvoicePermission[]> for role bundles**
   - Allows flexible role key lookup without TypeScript narrowing issues
   - Consistent with CT_ROLE_PERMISSIONS pattern

2. **Permission format: einvoice:{resource}:{action}**
   - Follows established CT and VAT patterns
   - Self-documenting permission codes
   - Easy to filter/audit

3. **Separation of duties**
   - Accountant: Day-to-day operations
   - Finance Manager: Submission and reporting
   - CFO: Configuration authority
   - Auditor: Read-only verification

4. **Superuser bypass support**
   - ADMIN/SUPER_ADMIN roles
   - isMasterOrgUser flag
   - Consistent with existing auth patterns

## Commits

| Hash | Message |
|------|---------|
| a74ecfb | feat(06-07): create e-invoice permission types |
| 3509d76 | feat(06-07): create e-invoice permission middleware |

## Verification Results

| Criterion | Status |
|-----------|--------|
| Permission codes follow einvoice:action:scope | PASS |
| 4 role bundles defined | PASS |
| Middleware validates permissions | PASS |
| TypeScript syntax valid | PASS |
| Total permission codes: 21 | PASS |

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

**Dependencies provided for 06-08 (Integration Tests):**
- EINVOICE_PERMISSIONS constant for test assertions
- EINVOICE_ROLE_BUNDLES for role-based testing
- Middleware functions for integration testing

**Ready for Phase 7 (E-Invoice Transmission):**
- Submission permissions prepared (initiate, view, retry, cancel)
- ASP configuration permission ready (config:asp)
