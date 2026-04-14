# cust-spec-032 — company_drivers design decision

**Date:** 2026-04-14
**Author:** Anders 🤖
**Status:** Investigation complete. Recommendation: **Option B (new join table)**.
Option A in the card description rests on a misread of the `CompanyCustomers` relation; this doc explains why.

## Goal

Speed has `CreateOrUpdateCopmanyDriver` / `DeleteCompanyDriver` for "person A is an authorized driver of corporate B's fleet" — a **persistent** relationship, distinct from the per-contract `additional_drivers` Vesla already supports.

Pick a design before drafting the implementation card.

## Today in Vesla

### `additional_drivers` — `prisma/schema.prisma:2446`

Per-rental driver. Required FKs:

```
additional_drivers
  bookingId NOT NULL,
  contractId nullable,
  customerId nullable (CCU-033 added it),
  fullName, firstName, lastName, email, licenseNumber, licenseExpiry, …
```

Wired to: `bookings`, `contracts`, `customers` (CustomerAdditionalDrivers
relation). Lifecycle is **booking-scoped** — once a booking ends the row stays
for audit but isn't a "this driver works for X" durable fact.

### `customers.companyId` (the `CompanyCustomers` relation)

Card description suggests Option A: re-purpose `customers.companyId` as
"individual customer attached to corporate customer". **This is incorrect.**
Reading the schema:

* `customers.companyId` is `String?` mapped to `company_id`.
* The relation `CompanyCustomers` declares `fields: [companyId], references: [id]` → the **tenant** `companies` table (line 580 + 830 in schema.prisma).
* Every customer row already uses this column to record which Vesla **tenant** owns the customer record. Re-purposing it for "tenant of which the customer is also an employee/driver" would collide with multi-tenancy.

So Option A is rejected on architecture grounds. Forcing dual semantics into one column would either:

1. Break tenant isolation (a customer could appear to belong to multiple tenants).
2. Or force a self-FK from `customers.companyId` to `customers.id`, which means inventing a "synthetic company-as-customer" pattern that overlaps the existing `customer_corporate_details` work in cust-spec-025.

### Mobile app probe

Grepped `rent-a-car-mobile/` for `companyDriver`, `company_driver`,
`drivers/`, `manageDrivers`. **No matches.** Customer mobile + staff mobile
do not currently surface a "company drivers" management view. So the design
choice is unconstrained by an existing mobile contract.

## Recommendation: **Option B — new `company_drivers` join table**

```
company_drivers
  id                 TEXT PK
  company_id         TEXT NOT NULL FK→companies(id)         -- tenant scope
  corporate_customer_id  TEXT NOT NULL FK→customers(id)     -- the corporate B
  driver_customer_id     TEXT NOT NULL FK→customers(id)     -- the individual A
  role               VARCHAR(30) NULL                       -- DRIVER, MANAGER, FINANCE_CONTACT, OTHER
  is_authorized      BOOLEAN NOT NULL DEFAULT TRUE
  authorized_by      TEXT NULL FK→users(id)
  authorized_at      TIMESTAMPTZ NULL
  notes              TEXT NULL
  created_at, updated_at
  UNIQUE (corporate_customer_id, driver_customer_id, role)  -- multi-role allowed
```

Service-level guards:

* Both customers must belong to the same tenant.
* `corporate_customer.customerType = 'CORPORATE'` and
  `driver_customer.customerType = 'INDIVIDUAL'`.
* On unauthorize: keep the row, set `is_authorized = false`. (Audit history
  matters for compliance — Speed's "who authorized whom" trail.)

## Why not extend `additional_drivers`?

* `additional_drivers.bookingId` is NOT NULL. Making it nullable forces a
  bigger migration and weakens the per-contract integrity check.
* The two concepts have different lifecycles:
  * `additional_drivers` → "rental N permits person A to drive vehicle V"
  * `company_drivers` → "person A is on company B's roster, ongoing"
  Same row would conflate both signals; service code would have to constantly
  distinguish them via "is the booking_id null?" — a smell.
* Reports want different cuts: "all authorized drivers of corporate B" is
  cheap on `company_drivers`; "all drivers who drove vehicle V last month"
  stays on `additional_drivers`.

## Why not extend `customers.companyId`?

Already covered. It's tenant scope, not corporate-employer scope.

## Cost estimate

* Schema: 1 new table, 4 indexes, 2 service guards.
* Backend: ~150 lines of service + controller + routes (parallel to
  cust-spec-001/cust-spec-030 patterns).
* Frontend: 1 admin page (Corporate Customers > Drivers tab) — can sit
  inside the future cust-spec-040 ApproveCompany screen, or stand alone.
* Tests: ~20 jest cases covering tenant scope, role uniqueness,
  customerType guards, authorize/unauthorize lifecycle.

About the same shape as cust-spec-025 + cust-spec-030 combined — call it
half a day with the established pattern.

## Draft follow-up card body (NOT inserted)

```
# cust-spec-032-impl — company_drivers table + service + admin UI

Implements Option B from cust-spec-032 design decision.

Schema
- New table company_drivers per spec in cust-spec-032 audit doc.
- Prisma model + back-relations on customers (twice, with named
  relations CorporateRoster + DriverRoster) and companies (tenant).
- Migration applied to vesla_dev, file deleted post-apply.

Backend
- CompanyDriversService: list/get/authorize/unauthorize/delete with:
  * Same-tenant guard on both customer ends.
  * customerType guards (corporate must be CORPORATE, driver must be INDIVIDUAL).
  * Role enum (DRIVER, MANAGER, FINANCE_CONTACT, OTHER).
  * unauthorize keeps the row; delete removes it.
- Controller + audit logging.
- Routes /api/customers/:corporateId/drivers; admin.customers.manage gate.

Frontend
- Drivers tab on the corporate customer detail screen (or admin page).
- Add-driver dialog: pick from existing INDIVIDUAL customers, set role,
  optional notes.
- Authorize/unauthorize toggle + audit trail link.

FAQ
- One admin-settings entry explaining how corporate driver registry
  differs from per-contract additional_drivers.

Tests
- 18-22 jest cases covering all guards, lifecycle, tenant isolation,
  customerType validation.
```

## Sign-off

Card scope was DECISION ONLY — no schema or code changes.
Recommendation: Option B.
Awaiting Miguel's pick before drafting the implementation card.
