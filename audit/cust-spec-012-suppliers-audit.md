# cust-spec-012 — spd_suppliers vs vendors audit

**Date:** 2026-04-14
**Author:** Anders 🤖
**Status:** Audit complete. Recommendation: **Option A** (keep both, formalize the boundary). Three follow-up cards drafted but not inserted.

## Goal

Speed treats suppliers as `contacts` where `contactCategory=2`. Vesla
holds two tables that look adjacent: `spd_suppliers` (mirror) and
`vendors` (native). Map every read/write path, decide whether they
should remain split, and draft follow-up cards for whichever path
Miguel picks.

## Tables side-by-side

### `spd_suppliers` — `prisma/schema.prisma:21383`

```
spd_suppliers (15 cols)
  id Int autoincrement, companyId, supplierCode, syncImportId,
  supplierName, email, fax, website, phone1/phone2, address,
  city, state, zipCode, country, trn, otherDetail, rawData JSONB,
  createdAt, updatedAt
```

Pure mirror — flat, untyped, intentionally close to the Speed payload
(rawData JSONB preserves the original blob). No relations to
financial entities. Only indexes for the sync key (companyId,
supplierCode, syncImportId).

### `vendors` — `prisma/schema.prisma:7551`

```
vendors (Vesla native, ~22 cols)
  id String UUID, companyId, code, name, tradeName, taxNumber,
  email, phone, address, city, country, paymentTerms (default 30),
  creditLimit, bankName, bankAccount, iban, swiftCode, isActive,
  createdAt, updatedAt, createdById
```

Carries **all the AP plumbing**:

```
bills, payment_vouchers, fixed_assets, vehiclePurchaseOrders,
maintenanceContracts, spare_parts (PartSupplier),
service_work_task (TaskVendor), debit_notes, recurring_invoices,
purchase_orders (VendorPurchaseOrders), …
```

## Read/write paths

### Code reading `spd_suppliers`

| File | Purpose |
|---|---|
| `services/native-table-refresh.service.ts` | Bulk refresh of native cache from spd_* mirrors |
| `services/backup/backup-table-validation.ts` | Backup integrity check |
| `services/speed-sync/importers/spd-table-importer.service.ts` | Inbound Speed → spd_* writer |
| `services/speed-sign-off.service.ts` | Sync-state attestation |
| `services/speed-sync/speed-data-provider.service.ts` | Generic spd_* reader |
| `services/speed-sync/speed-vendor-bridge.service.ts` | spd_suppliers → vendors mapper (1 spd_suppliers read, 6 vendors reads/writes) |
| `routes/spd-data.routes.ts` | Read-only API for spd_* viewers |
| `routes/speed-sync.routes.ts` | Sync trigger endpoints |
| `controllers/finance/vendor.controller.ts` | `getSyncedVendors` reads spd_suppliers for the “Linked to Speed” admin view |
| `utils/safe-sql.ts` + tests | spd_suppliers in the allow-list |

### Code reading/writing `vendors`

* `services/finance/vendor.service.ts` — full CRUD (~10 prisma.vendors.* calls)
* `services/finance/bill.service.ts` — bill→vendor
* `services/finance/payment-voucher.service.ts`
* `services/finance/fixed-asset.service.ts`
* `services/finance/intercompany-integration.service.ts`
* `services/service-center/service-vendor.service.ts`
* `services/speed-sync/speed-vendor-bridge.service.ts` (the mapper)
* `services/speed-sync/speed-lookup-builder.ts`
* `services/speed-sync/importers/resolve.ts`
* `routes/search.routes.ts`
* `tests/e2e-accounting-flow.test.ts`

## Dual-role check

Grepped for any path that treats a `customers` row AND a `vendors`/`spd_suppliers` row as the same legal entity.

* `customer-vendor` — no matches.
* `corporate.*supplier` — no matches.
* `customers.companyId` (the `CompanyCustomers` relation) currently points at the **tenant** `companies` table, not at corporate-customer-acting-as-supplier. So Vesla does not currently model the “corporate customer that also sells to us” case. Any company that buys AND sells today gets two rows: one in `customers` and a separate one in `vendors`, with no FK between them.

## Field gap analysis (spd_suppliers vs Speed payload)

The Speed supplier payload (per `tech-project/speed-reverse-engineer/specifications/company/schema.md`) carries the standard contact set plus a few accounting-specific fields:

| Speed field | spd_suppliers | vendors | Verdict |
|---|---|---|---|
| code, name | supplierCode, supplierName | code, name | match |
| email, phone, address city/state/country/zip | yes | yes | match |
| trn / VAT | trn | taxNumber | match (different name) |
| paymentTermDays | NOT captured | paymentTerms | gap on mirror, present on native |
| creditLimit | NOT captured | creditLimit | gap on mirror, present on native |
| bank account/IBAN/SWIFT | NOT captured | bankName, bankAccount, iban, swiftCode | gap on mirror, present on native |
| contactCategory (the discriminator) | not stored | not stored | not needed |
| `rawData` blob | yes (JSONB) | n/a | mirror keeps the original blob |

Conclusion: `vendors` is the richer model. `spd_suppliers` is intentionally lean — it's a staging surface for the importer, not a system of record.

## Recommendation: **Option A — keep both, formalize the boundary**

* `spd_suppliers` stays as the **inbound Speed staging table.** Field set frozen to whatever Speed sends. No new accounting logic should read it.
* `vendors` is the **canonical AP entity.** Bills, payment vouchers, FA, POs all reference `vendors.id`. New code must hit `vendors`, not `spd_suppliers`.
* `speed-vendor-bridge.service.ts` is the **single allowed translator**: it reads spd_suppliers rows, maps them onto `vendors` rows (creating or updating by code), and is the only place where the two tables touch.
* Add a code review checklist line: "If you `prisma.spd_suppliers.findX(...)` outside `speed-sync/`, justify it in the PR description."

This matches the reality on the ground (`speed-vendor-bridge.service.ts` already does the mapping; only one downstream consumer (`vendor.controller.getSyncedVendors`) reads the mirror, and that's a UI affordance to surface "this vendor was created from Speed").

### Why not Option B (deprecate spd_suppliers)?

Removing the mirror would force `speed-vendor-bridge.service.ts` to either (a) write directly into `vendors` from the Puppeteer scrape pipeline — coupling sync to canonical writes — or (b) drop the original Speed payload entirely, losing the audit trail in `rawData`. The mirror exists to absorb messy upstream payloads safely; that pattern is healthy.

### Why not Option C (dual-write trigger)?

Adds a postgres trigger that has to be maintained outside Prisma, breaks Prisma's understanding of writes, and creates a deadlock vector if both tables get hit in the same transaction. Triggers are a tax we don't need to pay for two tables that are already cleanly separated by a service.

## Three candidate follow-up cards (drafted, NOT inserted)

### A1. `cust-spec-012-followup-A` — formalize the boundary (recommended)

* Add the lint/comment guard described above.
* Add a check in `vendor.service.create` that warns (not errors) if the same `code` exists in `spd_suppliers` without a corresponding `vendors` row — surfaces sync drift.
* No schema change.

### A2. `cust-spec-012-followup-B` — deprecate spd_suppliers (rejected)

* Drop spd_suppliers + raw payload archive.
* Move the importer to write `vendors` directly + a `vendors_audit_payloads` JSONB log table.
* Risk: high. Cost: 2-3 days. Skipped unless Miguel disagrees with Option A.

### A3. `cust-spec-012-followup-C` — dual-write trigger (rejected)

* postgres `AFTER INSERT/UPDATE ON spd_suppliers` mirrors into vendors.
* Breaks Prisma's write tracking; deadlock risk. Skipped.

## Sign-off

Card scope was AUDIT ONLY — no schema or code changes. Recommendation Option A above. Awaiting Miguel's pick before drafting the implementation card.
