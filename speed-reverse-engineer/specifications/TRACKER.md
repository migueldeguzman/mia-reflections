# TRACKER — Speed Module Specifications

*The system is not complete until every module below is spec-complete. One missing module = incomplete system.*

**Read `DOCTRINE.md` before editing any spec file.**

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ⬜ | Not started |
| 🟡 | In progress (some files written) |
| 🟢 | Spec-complete (all 5 files + citations + uncertain-features flagged) |
| ⚫ | Empty probe — no data captured; spec must explain why and what still needs probing |

**Spec-complete** = all 5 files exist (`behavior.md`, `schema.md`, `dependencies.md`, `api.md`, `state-machine.md`), every claim cites its source, uncertain features flagged, doctrine callout at top of `behavior.md`.

---

## Priority 0 — Core (must ship first)

These are the backbone of rent-a-car operations. Every other module depends on these directly or transitively.

| # | Module | Probe files | Status | Notes |
|---|--------|-------------|--------|-------|
| 1 | `agreement` | 16 | 🟢 | Rental contracts (Vesla: contracts) — 130-field entity, 100+ endpoints, 11 sub-services documented. Gold-standard reference. |
| 2 | `deposit` | 5 (+ ANALYSIS.md) | 🟢 | Security deposits — 22 + 6 + 4 endpoints across deposit/refund/bankDeposit services. usedDepositId chain, post-refund edit lock, balance invariant. |
| 3 | `invoice` | 5 | 🟢 | Billing — 46 invoice + 3 email + 1 print + 2 SMS endpoints. 6283 prod records. Source-specific generation (fine/toll/parking/limo/equipment/excess-km/advance). Dispute flag, approval workflow, merge invoices, silent payment flagged. Duplicate `spd_invoices` vs `speed_invoices` flagged for consolidation. |
| 4 | `receipt` | 4 | 🟢 | Payments received — 32 endpoints across receipt/receiptSearch/receiptChargesAllocation. Payment gateway callbacks, DDA+CC bulk imports, threshold notifications, credit balance mechanic, duplicate mirror flagged. |
| 5 | `vehicle` | 7 | 🟢 | Fleet master — 80+ vehicle endpoints. Status enum (HIR/IDL/SRV/DEF/DAM/AVL/BKD), sub-status refinement, defleet/onfleet lifecycle, marks tracking, availability validation. Missing Vesla: `vehicle_marks` + `vehicle_logs` tables, ACRISS masters, sub_status column. |

## Priority 1 — People & Customer

| # | Module | Probe files | Status | Notes |
|---|--------|-------------|--------|-------|
| 6 | `person` | 3 | 🟢 | Individual customers — 25 endpoints. KYC docs, blacklist, surcharges, VMI flagged. Missing Vesla: customer_identity_documents, contact_groups, national_id_formats, blacklist_countries masters. |
| 7 | `customer` | 2 | 🟢 | Search/lookup aggregator (3 endpoints). Stateless service over person+company. |
| 8 | `company` | 3 | 🟢 | Corporate contacts — 25 endpoints + contactGroup. ApproveCompany workflow, Sage X3 integration flagged, Regency-specific driver flow flagged. "Copmany" typo preserved. |
| 9 | `directory` | 0 | 🟢 | ⚫→🟢 Cross-contact search aggregator (28 endpoints). Stateless. Tenant-to-tenant linking + merge features flagged. Empty probe — sourced from bundles. |
| 10 | `staff` | 1 | 🟢 | Staff + supplier co-located (11+7 endpoints). Payroll, attendance, commission, KYC. |

## Priority 2 — Operations (Fleet movement)

| # | Module | Probe files | Status | Notes |
|---|--------|-------------|--------|-------|
| 11 | `movement` | 3 | 🟢 | Vehicle movements — 14830 records. Unified `movements` table, movementTypeId discriminator (1=Agreement, 2=Workshop, 3=NRM, 4=Delivery, 5=Custody, 6=Accident). |
| 12 | `workshop-movement` | 1 | 🟢 | movementTypeId=2. Service center integration, cost center routing, Vesla `service_booking` target. |
| 13 | `nrm` | 1 | 🟢 | movementTypeId=3. Non-revenue (transfer, demo, internal). Utilization analytics. |
| 14 | `delivery` | 0 | 🟢 | ⚫→🟢 movementTypeId=4. Airport delivery + GPS tracking + DeliveryCharges auto-attach. Sourced from bundles. |
| 15 | `custody` | 0 | 🟢 | ⚫→🟢 movementTypeId=5. Temporary safekeeping (manager, insurance, police). Overdue alerts. |
| 16 | `accident` | 3 | 🟢 | movementTypeId=6 + dedicated accident record. Insurance claim chain, excess charge auto-attach, driver blacklist candidacy, write-off workflow. |

## Priority 3 — Finance (GL, AR/AP, supporting)

| # | Module | Probe files | Status | Notes |
|---|--------|-------------|--------|-------|
| 17 | `journal` | 8 | 🟢 | GL + JV. Dual services (journal read, jV CRUD). Approval, reversal chain, period lock. |
| 18 | `bill` | 5 | 🟢 | Supplier AP + PR/PO/GRN pipeline. 3-way match, approval. |
| 19 | `payment` | 2 | 🟢 | Outgoing payments — parallel structure to receipt. |
| 20 | `credit-note` | 3 | 🟢 | Invoice-reducing vouchers. E-invoice integration. |
| 21 | `debit-note` | 3 | 🟢 | Invoice-increasing vouchers. Dual GetDebitNotes flagged. |
| 22 | `cheques` | 4 | 🟢 | Distributed across bankAccount/bankDeposit/receipt/payment. PDC, bounce, bank recon. |
| 23 | `allocation` | 3 | 🟢 | Polymorphic allocations. Overlap with receiptChargesAllocation flagged. |
| 24 | `commission` | 3 | 🟢 | Distributed logic. Sales/broker/supplier commission. Staff pay integration. |
| 25 | `opening-balance` | 5 | 🟢 | 5 OB types. Year-end rollforward. |
| 26 | `statement-of-accounts` | 2 | 🟢 | Customer + supplier running balance. Stateless. |
| 27 | `profit-and-loss` | 5 | 🟢 | P&L with dimensional breakup. Stateless aggregation. |
| 28 | `account` | 11 | 🟢 | Composite: COA + fixed assets + depreciation + amortization + TB/BS/IS + tax. Backbone. |
| 29 | `fiscal-year` | 2 | 🟢 | Period management. Closed FY lock. |
| 30 | `refund` | 0 | 🟢 | ⚫→🟢 Vesla has rich 6-table lifecycle; preserve superset. |

## Priority 4 — Pricing & Quotes

| # | Module | Probe files | Status | Notes |
|---|--------|-------------|--------|-------|
| 31 | `tariff` | 3 | 🟢 | Tariff groups + cards + charges settings + rate types + ACRISS. Backbone of pricing. |
| 32 | `quotation` | 2 | 🟢 | Rental/lease/sales quotation variants. Validity + conversion to agreement. |
| 33 | `master-agreement` | 2 | 🟢 | Parent contract for lease. Child agreement linkage + consolidated billing. |
| 34 | `booking` | 5 | 🟢 | Reservations (portal/corporate/walk-in/phone). Payment, approval, conversion to agreement. |

## Priority 5 — Peripherals (Tolls, Fines, Parking, TARS)

| # | Module | Probe files | Status | Notes |
|---|--------|-------------|--------|-------|
| 35 | `toll` | 7 | 🟢 | Salik + Darb tolls. Attribution engine, merge-invoice, surcharge. |
| 36 | `fine` | 8 | 🟢 | Traffic fines with late fee accrual. Dispute + TARS integration. |
| 37 | `parking` | 3 | 🟢 | Parking charges. Same pattern as toll/fine. |
| 38 | `fine-receipts` | 0 | 🟢 | ⚫→🟢 Proof of fine payment to government. Fine status update. Empty probe — bundle-sourced. |
| 39 | `tars` | 2 | 🟢 | RTA TARS integration. Async posting, retry queue, failure alerts. |

## Priority 6 — Configuration & Admin

| # | Module | Probe files | Status | Notes |
|---|--------|-------------|--------|-------|
| 40 | `administration` | 42 | 🟢 | 42 sub-services. Masters + RBAC + templates + integrations + workflows + audit. ~400+ endpoints estimated. |
| 41 | `settings` | 3 | 🟢 | Per-tenant config + Daily Biz Report. Distinct from administration's tenantSettings. |

---

## Empty Probes (⚫)

Five modules have no probe data: `directory`, `delivery`, `custody`, `refund`, `fine-receipts`. Each spec must document:

1. Why the probe returned empty (endpoint requires params? endpoint doesn't exist? endpoint requires prior state?)
2. What endpoints Speed exposes for this module (from `AbpServiceProxies-jquery.js`)
3. What probe strategy would get real data (prerequisite records, required params)
4. Whether the module is actually used by Speed customers (check for references in other modules' business-logic.json)
5. Best-effort schema reconstruction from bundles

Empty probes do not exempt a module from a spec. They just change the source priority — the bundle becomes the primary source.

---

## Count Summary

- **Total modules:** 41 probe folders → **36 logical modules** (some folders split a service, e.g. `master-agreement` is really part of `agreement` domain).
  Final module count may condense slightly during spec writing. Any consolidation decision goes in `specifications/CONSOLIDATION_NOTES.md` with justification.
- **Empty probes:** 5
- **Business-logic.json files already extracted:** 17
- **Module folders with at least one probe file:** 36

---

## Workflow Per Module

```
1. Read DOCTRINE.md (re-read every session, it evolves)
2. Read all JSON probes in the module folder
3. grep App-bundle.js for the module's AppService name (e.g. DepositAppService)
4. grep AbpServiceProxies-jquery.js for the module's service namespace
5. Draft behavior.md — what the module does, doctrine callout at top, Three Tests applied
6. Draft schema.md — reconstruct Speed tables, side-by-side with Vesla, gap analysis
7. Draft dependencies.md — internal + external dependencies
8. Draft api.md — every endpoint with shapes
9. Draft state-machine.md — entity states + transitions (or explicitly N/A)
10. Verify: every claim has a source citation
11. Verify: uncertain features flagged, not dropped
12. Update TRACKER.md status to 🟢
13. Commit
```

---

## Status Updates

Every time a module reaches 🟢, update the table row above AND add a line to the log below:

```
- 2026-XX-XX — <module> — <author/persona> — <one-line summary of what was specified>
```

### Log

- 2026-04-14 — agreement — Anders — Gold-standard spec. 5 files, ~2500 lines. Covers 11 ABP sub-services, ~100 endpoints, 130-field entity. Speed→Vesla (contracts module) side-by-side shows ~110-field mirror gap on spd_agreements; missing line-item mirror entirely. 8 uncertain features flagged. Doctrine compliance enforced.
- 2026-04-14 — deposit — Anders — 5 files. 22 deposit + 6 refund + 4 bankDeposit endpoints. `usedDepositId` chain tracking, post-refund edit lock (magnificent), balance invariant. `spd_deposits` lossy by ~60% (22 missing columns). 8 uncertain features (bankDeposit co-location, `.NET min date sentinel`, voucherSubTypeId=12 full enum, etc).
- 2026-04-14 — invoice — Anders — 5 files. 46 invoice + 3 email + 1 print + 2 SMS endpoints. 6283 prod records. Source-specific batch generation (fine/toll/parking/limo/equipment/excess-km/advance). Merge invoice (magnificent), dispute flag, approval workflow, silent payment flagged. Duplicate `spd_invoices` vs `speed_invoices` consolidation flagged.
- 2026-04-14 — receipt — Anders — 5 files. 32 endpoints across receipt/receiptSearch/receiptChargesAllocation. Payment gateway callbacks, DDA + CC bulk imports, credit balance via `ProceedPaymentThroughCreditBalance`, threshold notifications (high-value receipt alert). Same duplicate mirror issue as invoice.
- 2026-04-14 — vehicle — Anders — 5 files. 80+ endpoints. Fleet lifecycle (onboard→IDL→BKD→HIR→IDL→DEF). Marks damage tracking, availability validation, ACRISS codes, sub-status refinement. Missing in Vesla: `vehicle_marks`, `vehicle_logs`, ACRISS masters, sub_status column, supplier-sublet tracking on rental table.
- 2026-04-15 — tars — Anders — Deepened from 160-line stub to 5 spec-complete files. 19 ABP endpoints across 5 services + 1 Azure Function bridge. SpeedOperation 1–13, TarsOperation 1–8, Status 0–8, ErrorType 1–4 enums fully documented. 3-hour grace period guard. trafficFileCredentials per-tenant array. Vesla `spd_tars_postings` mirror lossy by 12 fields; Vesla native `tars_credentials` lacks multi-traffic-file uniqueness. Recommended new native `tars_postings` table for full Speed-shape parity. 7 Uncertain-Value flagged (incl. Lease/NRM/Workshop retry gap in bundle dispatcher).
- 2026-04-15 — fine — Anders — Deepened from 160-line stub to 5 spec-complete files. 90+ endpoints across 9 services (uaeFine 62, trafficFine 11, fineEmail/SMS/Alert/MonthEnd/DataSharing/generateFineBill 17). Authoritative row shape from `fines-list.json` (4 production rows). VAT-on-surcharge-only rule confirmed (UAE FTA). 27-field `GetFinesReport` filter envelope captured. Vesla `tars_fines` rich (45+ fields) but missing confiscation/acknowledgment/blackPoints/GPS/ignored/manual flags + late-fee tracking. Vesla `spd_fines` mirror lossy by 25+ fields. 9 Uncertain-Value flagged.
- 2026-04-15 — toll — Anders — Deepened from 130-line stub to 5 spec-complete files. 90 endpoints across 4 services (toll 75, salikAccount 10, tollMonthEndPosting 2, tollsDataSharing 3). Salik portal scrape mechanics documented (browser-extension model, per-account per-tag per-day). Vesla `tars_salik`/`darb_transactions` solid baseline; missing salik_account_name, movement_id, sales_person_id, ignored, is_external_vehicle, lat/lng. No tag↔plate history table. Recommended new `toll_accounts` (unified) + `salik_tags` (history). Per-contract aggregation (Vesla `darb_charge_config.tollAggregation`) is BETTER than Speed's tenant-wide setting — preserve. 9 Uncertain-Value flagged.
