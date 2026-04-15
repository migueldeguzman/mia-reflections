# toll — Dependencies

> Speed-internal + external. Vesla code refs at end.

---

## Speed-internal upstream

- **vehicle** — `vehicleId`, `plateNo`, `tagNo`. Drives attribution.
- **movement** — `movementId` + window. Drives `(vehicleId, passageTime ∈ window)` attribution.
- **agreement** — `agreementNo`, `agreementCustomerName` (denorm).
- **customer** — surcharge config (`tollSurcharge`, `darbTollSurcharge` + lease variants), invoicing rule.
- **salikAccount** — portal credentials, tag inventory.
- **administration** — toll feature flags (`IsFeatureEnabled`).
- **directory** — sales person + customer lookup.

## Speed-internal downstream

- **invoice** — generated per `ProcessTolls` (per-crossing or aggregated per cycle).
- **debit JV** — month-end via `tollMonthEndPosting/Post{Tolls,Darbs}MonthEnd`.
- **journal / GL** — both customer-side AR and supplier-side AP (Salik account top-ups).
- **tollsDataSharing** — inter-tenant aggregation.
- **TFMS / TMS** — third-party fleet integrations.
- **CRS** — customer-portal Tolls tab.

---

## External systems

| System | Direction | Purpose |
|---|---|---|
| **Salik portal** (Dubai RTA) | inbound | Browser-extension scrape per Salik account. |
| **Darb portal** (Abu Dhabi DoT) | inbound | Browser-extension scrape per Darb account. |
| **Parkin portal** (AUH parking) | inbound | Same; shared with Salik account in some cases. |
| **TFMS** (Tasleem Fleet Management) | outbound | `GetTollsForTFMS`. |
| **TMS** (Trips Management System) | outbound | `GetTmsTollsReport`, `GetDarbTollsForTMS`. |
| **CRS** (Customer Reservation System / customer portal) | outbound | `GetTollsReportCRS`. |
| **Salik wallet topup** | outbound | Account credit replenishment (handled outside toll module). |

---

## Build order (Speed reconstruction)

1. Salik account credentials + per-account tag inventory.
2. `tolls` table + `salik_tags` (plate↔tag history) + `tolls_data_sharing` (optional).
3. Browser-extension preflight + JS payload (`PrepareDataForExtension`, `JsLoaderForExtension`).
4. Portal pull (`SaveTollsInBulk`).
5. Attribution engine (`ProcessTolls`).
6. Surcharge + VAT computation.
7. Invoice generation (per-crossing OR aggregated).
8. Reconciliation (`GetSalikReconciliation`).
9. External-vehicle tracking (`SaveExternalTollsInBulk`).
10. Late-toll alerts (`GetLateSalikTollReport`).
11. Status alerts (`GetSalikStatusAlertDetails`).
12. EOM JV posting.
13. Reports + exports.
14. TFMS / TMS / CRS exports (optional).
15. Inter-tenant data sharing (optional).

---

## Vesla code dependencies (secondary)

`backend/src/services/`:
- `tars-salik.service.ts` (970L) — primary list/sync/per-customer reads (Salik).
- `tars-match.service.ts` (`matchUnmatchedSalik`) — Salik attribution.
- `tars-billing.service.ts` (`invoiceSalikBatch`) — per-customer Salik invoice.
- `tars-period-billing.service.ts` (`processTollBilling`) — period-aligned Salik+Darb consolidated.
- `tars-charge-config.service.ts` — VAT + admin fee + aggregation config.
- Darb services — split across `darb`-prefixed files + worker-side logic.
- `vehicle-salik.service.ts` — vehicle↔Salik linkage.
- `notification-trigger.salikInvoiced` — customer notifications.
- `finance/ar-wiring.service.ts` — AR voucher + GL.

`backend/src/controllers/`:
- `tars-salik.controller.ts` — Salik list, sync, summary.
- `vehicle-salik.controller.ts` — vehicle linkage.
- (Darb endpoints embedded in `darb.routes.ts` inline.)

`backend/src/routes/`:
- `tars-salik.routes.ts`.
- `darb.routes.ts` (1100+ lines — includes credentials, sync, transactions, fines, vehicles, charge-config, auto-match, bulk-invoice).
- `vehicle-salik.routes.ts`.

Workers:
- `vesla-tars-salik-worker` (port 3040/3041) — Salik portal scrape.
- `vesla-darb-worker` (port 3010) — Darb portal scrape (Chrome extension main-world relay).

Charge type ids (per `MEMORY.md` + chart-of-accounts):
- `7` = Tolls (customer-side AR — Salik).
- `33` = TollsSurcharge (revenue — Salik).
- `73` = DarbTolls (customer-side AR — Darb).
- `74` = DarbTollsSurcharge (revenue — Darb).

---

## Vesla → Speed mapping

| Vesla file | Plays role of (Speed) |
|---|---|
| `tars-salik.service.ts:listSalik` | `toll.GetTolls` (Salik) |
| `darb` route handlers | `toll.GetTolls` (Darb) |
| `tars-match.matchUnmatchedSalik` | `toll.ProcessTolls` (attribution half) |
| `tars-billing.invoiceSalikBatch` | `toll.ProcessTolls` (invoicing — per-customer) |
| `tars-period-billing.processTollBilling` | `toll.ProcessTolls` (invoicing — consolidated period) |
| `vesla-tars-salik-worker` | `toll.SaveTollsInBulk` + `salikAccount.UpdateLastDownloadDate` (Salik) |
| `vesla-darb-worker` | `toll.SaveTollsInBulk` + `salikAccount.UpdateLastDownloadDate` (Darb) |
| `notification-trigger.salikInvoiced` | (no Speed equivalent — Speed emails per-fine, not per-batch) |
| EOD daily run | EOM Speed `tollMonthEndPosting` |

---

## Build-order implications for Vesla parity

1. **Worker collection completeness** (cards B2 + B3) — every Speed `tolls` field must land in `tars_salik` / `darb_transactions`.
2. **Schema enrichment** (separate isolated migration card) per gap analysis.
3. **`toll_accounts` unified table** OR enrich existing 3 credential tables with account name + counts (decide with Miguel).
4. **`salik_tags` history table** for accurate historical attribution.
5. **External-vehicle handling** — `is_external_vehicle` column + `SaveExternalTollsInBulk` equivalent.
6. **Reports parity** (cards C1, C3) — `GetTollsReport`, `GetDarbTollsReport`, `GetTollSummaryByDate`, `GetSalikReconciliation`, `GetLateSalikTollReport`, `GetExternalVehiclesTollReport`, `ExportToExcel*`.
7. **Reconciliation engine** — three-way: portal-account count vs local count vs invoiced count.
8. **Status alerts** — Salik account low-balance / stale-cursor alerts.
9. **EOM JV posting** (follow-up card) — Vesla bills daily; Speed posts monthly. Decide cadence.
10. **TFMS / TMS / CRS exports** (deferred; per Three Tests).
