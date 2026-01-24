# Package Registry: Vesla ERP

## What Packages Are

Packages are **feature modules** that can be enabled per tenant. They control:
- **Permissions** - Which actions users can perform
- **Routes** - Which API endpoints are accessible
- **UI** - Which dashboard sections appear
- **Operations** - Billing, trials, expiration, coordination

**This is NOT about npm packages.** Packages are business modules that service clients.

---

## Package Architecture

```
Package (global definition)
    ↓
company_packages (tenant assignment)
    ├── isActive: boolean
    ├── expiresAt: Date (trial/subscription)
    └── activatedAt: Date
    ↓
Permissions (scoped by package)
    ↓
RolePack (roles require packages)
    ↓
User access (through role)
```

### Key Tables

| Table | Purpose |
|-------|---------|
| `packages` | Global package registry (code, name, dashboardRoute) |
| `company_packages` | Per-tenant assignments with expiration |
| `RolePack` | Links roles to required packages |
| `package_coordination` | Auto-enables Finance features for operational packages |

---

## Current Packages

### ADMIN (Core)
**Code:** `ADMIN`
**Core:** Yes (cannot be removed)
**Modules:** users, roles, permissions, settings, company, audit, system-health, error_logs

**Features:**
- User Management
- Company Settings
- Audit Logs
- Subscription Management
- Issue Tracking
- Dashboard

---

### RENT_A_CAR
**Code:** `RENT_A_CAR`
**Dependencies:** ADMIN
**Modules:** bookings, customers, vehicles, vehicle_pricing, maintenance, vehicle_setup, contracts, featured_vehicles, deposits

**Features:**
- Bookings Management
- Vehicle Management
- Rental Contracts
- Featured Vehicles
- Deposits

**Finance Coordination:**
- `vehicle_fixed_assets` - Auto-enabled in Finance
- `rental_income_recognition` - Auto-enabled in Finance

---

### FINANCIAL
**Code:** `FINANCIAL`
**Dependencies:** ADMIN
**Modules:** invoices, payments, accounts, transactions, reports, trial-balance, ledgers, customers, vendors, banks

**Features:**
- Invoicing
- Payment Processing
- Accounting
- Financial Reports
- Customer Management
- Vendor Management

---

### SERVICE_CENTER
**Code:** `SERVICE_CENTER`
**Dependencies:** ADMIN
**Modules:** service_setup, service_categories, service_images, service_bookings, service_time_slots

**Features:**
- Service Management
- Service Bookings
- Service Customers

---

## Compliance Package (Planned)

### UAE_COMPLIANCE
**Code:** `UAE_COMPLIANCE` (proposed)
**Dependencies:** ADMIN, FINANCIAL
**Modules:** (to be defined in Phase 3+)

**Sub-modules:**
- `vat` - VAT Compliance Engine (Phase 3)
- `corporate_tax` - Corporate Tax (Phase 4)
- `wps` - WPS Payroll (Phase 5)
- `einvoicing` - E-Invoicing Engine (Phase 6-7)
- `compliance_portal` - Verification Portal (Phase 8)

**Finance Coordination:**
- All existing accounting features
- VAT ledger integration
- CT-adjusted reports

---

## Phase-Package Mapping

| Phase | Packages Affected | New Modules |
|-------|-------------------|-------------|
| 1 - Multi-Tenant Foundation | ADMIN | compliance_config |
| 2 - Internal Controls | ADMIN | audit_enhanced |
| 2.5 - Accounting Foundation | FINANCIAL | closing, cash_flow, assets, liabilities |
| 3 - VAT Compliance | FINANCIAL, UAE_COMPLIANCE | vat, tax_invoices, credit_notes |
| 4 - Corporate Tax | FINANCIAL, UAE_COMPLIANCE | corporate_tax, ct_reports |
| 5 - WPS Payroll | ADMIN, UAE_COMPLIANCE | wps, sif_generation |
| 6 - E-Invoice Core | UAE_COMPLIANCE | einvoice_generation, qr_codes |
| 7 - E-Invoice Transmission | UAE_COMPLIANCE | dctce_transmission, mls_handling |
| 8 - Verification Portal | UAE_COMPLIANCE | compliance_dashboard |
| 9 - Standalone Package | UAE_COMPLIANCE | api_standalone |

---

## Permission Mapping

### Module → Package Lookup

```typescript
// From module-pack-mapping.ts
MODULE_PACK_MAPPING = {
  // ADMIN
  users: 'ADMIN',
  roles: 'ADMIN',
  permissions: 'ADMIN',
  settings: 'ADMIN',
  company: 'ADMIN',
  audit: 'ADMIN',

  // RENT_A_CAR
  bookings: 'RENT_A_CAR',
  vehicles: 'RENT_A_CAR',
  contracts: 'RENT_A_CAR',

  // FINANCIAL
  invoices: 'FINANCIAL',
  payments: 'FINANCIAL',
  accounts: 'FINANCIAL',
  transactions: 'FINANCIAL',

  // SERVICE_CENTER
  service_setup: 'SERVICE_CENTER',
  service_bookings: 'SERVICE_CENTER',

  // UAE_COMPLIANCE (planned)
  vat: 'UAE_COMPLIANCE',
  corporate_tax: 'UAE_COMPLIANCE',
  wps: 'UAE_COMPLIANCE',
  einvoicing: 'UAE_COMPLIANCE',
  compliance_portal: 'UAE_COMPLIANCE'
}
```

### Permission Naming Convention

```
{module}.{action}

Actions:
- .view, .list - Read access
- .create - Create new records
- .update, .edit - Modify records
- .delete, .void - Remove/void records
- .print, .generate_pdf - Document generation
- .approve - Workflow approval
- .submit - External submission (FTA, WPS)
```

### Document Role Permissions

These permissions require `RoleType.DOCUMENT_ROLE`:
- `invoices.*` (create, update, void, print)
- `payments.*` (create, update, void)
- `contracts.*` (create, update, void)
- `vouchers.*` (create, update, void)
- `receipts.*` (create, update, void)
- `tax_invoices.*` (planned)
- `credit_notes.*` (planned)
- `debit_notes.*` (planned)

---

## Operations

### Trial/Subscription Flow

```
Company subscribes
    ↓
company_packages created with expiresAt
    ↓
User accesses feature
    ↓
Middleware checks:
  1. isActive = true
  2. expiresAt >= now OR expiresAt IS NULL
    ↓
Access granted or denied
```

### Expiration Handling

- `checkPackExpiration()` middleware warns but doesn't block
- `X-Pack-Expiration-Warning` header added to responses
- `getExpiringPackages(daysAhead)` for proactive alerts
- Expired packs excluded from permission calculations

### Package Removal Cascade

When removing a package from a company:

1. **Check dependencies** - Other packs depending on this one
2. **Check roles** - Roles requiring this pack
3. **Check users** - Users with affected roles
4. **Cascade options:**
   - `force: false` - Warn and abort
   - `force: true, cascadeRemoveRoles: true` - Remove assignments

### Finance Coordination

Operational packages auto-enable Finance features:

```typescript
COORDINATION_RULES = {
  RENT_A_CAR: ['vehicle_fixed_assets', 'rental_income_recognition'],
  REAL_ESTATE: ['property_fixed_assets', 'unearned_property_rent'],
  UAE_COMPLIANCE: ['vat_ledger', 'ct_adjustments'] // planned
}
```

---

## Testing by Package

### Test Scope per Package

| Package | Integration Tests | E2E Tests |
|---------|-------------------|-----------|
| ADMIN | User CRUD, Role assignment, Audit logging | Login flow, Settings |
| RENT_A_CAR | Booking lifecycle, Vehicle management | Full rental flow |
| FINANCIAL | Invoice lifecycle, Payment processing | Invoice → Payment → Ledger |
| SERVICE_CENTER | Service booking lifecycle | Service booking flow |
| UAE_COMPLIANCE | VAT calculation, E-invoice generation | Full compliance flow |

### Package-Aware Test Commands

```bash
# Test specific package
npm run test:package RENT_A_CAR

# Test packages affected by phase
npm run test:phase 3  # Tests FINANCIAL + UAE_COMPLIANCE
```

---

## MRM Workflow Integration

### When Planning Phases

1. Check which packages the phase affects (Phase-Package Mapping above)
2. Ensure package dependencies are satisfied in earlier phases
3. Plan permission seeding for new modules
4. Consider Finance Coordination rules

### When Executing Plans

1. Create new permissions with correct `packageId`
2. Update `module-pack-mapping.ts` for new modules
3. Add coordination rules if operational package
4. Seed permissions in correct order (package → permission → role → user)

### When Testing

1. Use Package-Aware Test Scope table
2. Test with/without package enabled
3. Test expiration scenarios
4. Test cascade removal

### When Documenting

1. Reference package codes (e.g., `UAE_COMPLIANCE`)
2. Document new modules added to packages
3. Update Permission Mapping section
4. Note any Finance Coordination rules

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `server/src/config/packs.config.ts` | Package definitions |
| `server/src/config/module-pack-mapping.ts` | Module → Package mapping |
| `server/src/services/package.service.ts` | Package CRUD |
| `server/src/services/pack-validation.service.ts` | Dependency validation |
| `server/src/services/package-coordination.service.ts` | Finance coordination |
| `server/src/middleware/pack-validation.middleware.ts` | Route protection |
| `prisma/schema.prisma` | Database schema |
| `prisma/seeds/seed-default.ts` | Default seeding |

---

## Adding a New Package

### Checklist

- [ ] Define in `packs.config.ts` with features and dependencies
- [ ] Add to `module-pack-mapping.ts`
- [ ] Create database record in `packages` table
- [ ] Create permissions with correct `packageId`
- [ ] Add coordination rules if needed
- [ ] Update seed scripts
- [ ] Add to this registry

### Example: Adding UAE_COMPLIANCE Package

```typescript
// packs.config.ts
UAE_COMPLIANCE: {
  code: 'UAE_COMPLIANCE',
  name: 'UAE Compliance',
  description: 'VAT, Corporate Tax, WPS, E-Invoicing compliance',
  dependencies: ['ADMIN', 'FINANCIAL'],
  isCore: false,
  features: [
    {
      code: 'vat_compliance',
      name: 'VAT Compliance',
      modules: ['vat', 'tax_invoices', 'credit_notes', 'debit_notes']
    },
    // ... more features
  ]
}
```

---

*Last updated: 2026-01-24*
*Referenced by: MRM workflow for phase planning, execution, testing, and documentation*
