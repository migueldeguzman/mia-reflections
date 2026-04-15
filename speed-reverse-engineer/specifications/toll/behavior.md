# toll — Behavior Specification

> **Doctrine:** See `DOCTRINE.md`. Three Tests applied. Sources cited per claim. Vesla side-by-side at `web-erp-app/backend/...`.

**Module:** `toll` *(Vesla natives: `tars_salik`, `darb_transactions`; Vesla mirrors: `spd_tolls`, `spd_darb_tolls`)*

**Speed services** (`AbpServiceProxies-jquery.js`):
- `abp.services.app.toll` — proxy lines 11171–11770. **75 endpoints.** Unified Salik+Darb service.
- `abp.services.app.salikAccount` — proxy lines 11091–11163. **10 endpoints.** Per-tenant Salik portal credentials.
- `abp.services.app.tollMonthEndPosting` — proxy lines 11067–11079. **2 endpoints.** EOM JV posting (Salik + Darb).
- `abp.services.app.tollsDataSharing` — proxy lines 22291–22319. **3 endpoints.** Inter-tenant aggregation.

**Probes** (`toll/`):
- `tolls-list.json` — null (empty tenant).
- `tolls-salik.json` — error "agreement not found".
- `tolls-darb.json` — error "internal".
- `tolls-report.json` — error "agreement not found".
- `tolls-crs.json` — `Speed.Tolls.TollAppService.GetTollsReportCRS` NullRef stack.
- `tollReport-list.json` — null.
- `toll-business-logic.json` — investigation narrative (test tenant lacks data; bundle is primary source).

**External:**
- **Salik portal** (Dubai — `https://www.salik.gov.ae/...`). Browser-extension-driven download (per bundle line 13103–13231 — `getDownloadUrl` builds Salik portal URLs with `pageSize`, `timePeriod`, `tripType`, `tagPlateDetails`, `tagNumber`).
- **Darb portal** (Abu Dhabi). Browser-extension-driven download (Vesla uses chrome-extension main-world relay per Fred subconscious).
- **TFMS** (third-party fleet/toll management — `GetTollsForTFMS`).
- **TMS dashboard** (separate third-party).

---

## 1. Purpose

UAE rental vehicles incur tolls every time they cross a Salik (Dubai) or Darb (Abu Dhabi) gate. Speed:
1. **Downloads** crossings from each portal per Salik account (per fleet of vehicles registered to one Salik account — typically multi-tag per account).
2. **Attributes** each crossing to the active rental movement at `(vehicleId, passageTime)`.
3. **Charges** the customer with a customer-side surcharge (per-customer config) — invoiced per-crossing OR aggregated (per-day / per-month / per-trip).
4. **Pays** the toll authority — handled at the Salik/Darb account level (prepaid wallet topup), not per-crossing.
5. **Reconciles** downloaded count vs invoiced count vs portal-account balance.
6. **Reports** consolidated Salik + Darb views, late tolls (unresolved past N days), external-vehicle tolls (third-party-vehicle crossings hitting our Salik account in error).

---

## 2. Primary Entities

### 2.1 Toll (Salik OR Darb — unified table per Speed)

Inferred from `spd_tolls` mirror columns + endpoint set:

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `id` | int | NO | PK. |
| `tollId` | string | YES | Portal-side toll id (Salik or Darb). |
| `date` | datetime UTC | NO | `passageTime`. |
| `tollType` | string | YES | "Salik" / "Darb" / "Parking". |
| `authority` | string | YES | "RTA" / "Department of Transportation Abu Dhabi". |
| `tagNo` | string | YES | RFID tag number (per vehicle). |
| `plateNo` | string | NO | Vehicle plate. |
| `vehicle` | string | YES | Display name. |
| `makeAndModel` | string | YES | Denorm. |
| `gate` | string | YES | Gate name (e.g. "Sheikh Zayed Bridge", "Al Maqta Bridge"). |
| `direction` | string | YES | INBOUND / OUTBOUND. |
| `amount` | decimal | NO | Toll price. |
| `agreementNo` | string | YES | Attributed agreement (denorm). |
| `customer` | string | YES | Denorm. |
| `customerCode` | string | YES | Denorm. |
| `invoiceNo` | string | YES | Customer invoice (denorm). |
| `status` | string | YES | "Pending" / "Charged" / "Invoiced" / "Disputed" / "Late" — ⚠ no enum doc; inferred. |
| `accountName` | string | YES | Salik account name. |
| `normalizedPlate` | string | YES | Plate canonicalized (per Vesla `spd_tolls.normalizedPlate`). |

### 2.2 Salik Account *(separate entity; per-tenant)*

Inferred from `salikAccount` endpoints + bundle scrape logic (lines 12610–12728).

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `id` | int | NO | PK. |
| `tenantId` | int | NO | |
| `username` | string | NO | Salik portal login. |
| `password` (encrypted) | string | NO | |
| `authority` | string | NO | "Salik" / "Darb" / "Parking" — `GetSalikAccountsByAuthority`. |
| `lastDownloadDate` | datetime | YES | `UpdateLastDownloadDate`. |
| `parkingLastDownloadDate` | datetime | YES | `UpdateParkingLastDownloadDate`. |
| `tollsCount` | int | YES | Last-pull count (cached for dashboards). |
| `tollsDateList` | jsonb | YES | List of dates downloaded (per `saveAccountSingle` logic). |
| `daysToReconcile` | jsonb (date[]) | YES | Operator-supplied reconcile-window list. |
| `error` | string | YES | Last download error. |

### 2.3 Tag *(within Salik Account)*

A Salik account owns multiple RFID tags; each tag is linked to one or more plates (vehicle changes over tag lifetime).

Surfaced via:
- `toll.GetTagsOnPlateNo` — plate→tags lookup.
- `toll.SearchTollPlateAndTags` — search.
- `toll.PrepareDataForExtension` — per-extension preflight (which tags to download for).

### 2.4 External Vehicle Toll

When a customer-owned (non-fleet) vehicle uses our Salik account by mistake, we download a toll for it. `GetExternalVehiclesTollReport` + `SaveExternalTollsInBulk`.

### 2.5 Late Toll

A toll older than N days that is still UNBILLED. `GetLateSalikTollReport`.

---

## 3. Operations

### 3.1 `toll` (75 endpoints — proxy lines 11171–11770)

**Read / list:**
- `GetTolls` (11175) — main list.
- `GetTollsByAgreementId` (11183).
- `GetTollsForInvoice` (11191).
- `GetPendingTollsToInvoice` (11199).
- `GetTollsReportCRS` (11231) — CRS-customer report.
- `GetTollsReportForReport` (11319).
- `GetTollSummaryByDate` (11415).
- `GetTollSummaryByDateAndPlateNo` (11551).
- `GetTollsCountByAccount` (11423).
- `GetTollsCountBreakupDateWise` (11655).
- `GetDarbTollsReport` (11479).
- `GetDarbTollsReportForReport` (11535).
- `GetTmsTollsReport` (11495).
- `GetTmsTollsReportForReport` (11487).
- `GetTollSummaryReport` (11695).
- `GetLateSalikTollReport` (11703).
- `GetExternalVehiclesTollReport` (11711).
- `GetTollReport2` (11679) — alt-grouping report.
- `GetTollsForDetails` (11263).
- `GetSalikReconciliation` (11343).
- `GetReconcileToll` (11359).
- `GetDownloadedTollsCountForReconciliationByAccount` (11751).
- `SalikTollReportView` (11735) / `DarbTollReportView` (11759) — uigrid view.
- `SalikTollReportViewExportToExcel` (11743) / `DarbTollReportViewExportToExcel` (11767).
- `IsFeatureEnabled` (11719) / `IsFeaturesEnabled` (11727) — feature toggle gates.

**Mutate (process / attribute / charge):**
- `ProcessTolls` (11207) — attribute + invoice batch.
- `UpdateTollForInvoice` (11215) — adjust before invoicing.
- `DetachTollsFromInvoice` (11223) — unbill.
- `ProcessTollsMonthEndPosting` (11247) — Salik EOM JV.
- `ProcessDarbsMonthEndPosting` (11255) — Darb EOM JV.
- `UpdateSalikAccountDetails` (11335) — bulk account remap.
- `SaveTollsInBulk` (11391) — portal-pull insert (legacy).
- `SaveTollsInBulkNew` (11567) — v2.
- `SaveExternalTollsInBulk` (11399) — external-vehicle insert.
- `SaveAndUpdateAgreementNo` (11407) — manual attribute.
- `UpdateTollsAgreement` (11631) — bulk agreement update.
- `AttachVehicleForDarb` (11575) — Darb-specific manual vehicle attach.
- `UpdateSharingStatus` (11447) — `tollsDataSharing` write.

**Lookups:**
- `GetSearchPlateNo` (11295) / `GetSearchPlateNonew` (11303) — autocomplete (legacy + new).
- `GetSearchTagNo` (11311).
- `SearchPlateNos` (11327).
- `GetTagsOnPlateNo` (11367).
- `SearchTollPlateAndTags` (11375) / `SearchTollPlateAndTags1` (11471).

**Browser-extension (portal scrape):**
- `PrepareDataForExtension` (11383) / `PrepareDataForExtension1` (11463) — preflight: tells extension which Salik account + tags + date range to scrape.
- `JsLoaderForExtension` (11455) — returns JS payload for extension to inject.

**Status alerts:**
- `GetSalikStatusAlertDetails` (11591) — Salik account threshold alerts.
- `GetDarbStatusAlertDetails` (11583).

**Export:**
- `ExportToExcel` (11239).
- `TollDetailsExportToExcel` (11271).
- `DownloadForAllAccountSummary` (11279).
- `DownloadForSelectedTagsSummary` (11287).
- `ExportToCsvCustom` (11687).
- `ExportToExcelCustom` (11599).
- `ValidateExportToExcelCustom` (11607).
- `GetTollsReportCrsForReport` (11519) / `ExportToExcelTollsReportCrs` (11527).
- `ExportToExcelTmsSalikTollsReport` (11503) / `ExportToExcelTmsDarbTollsReport` (11511).
- `ExportToExcelDarbTollsReport` (11543).

**TMS/TFMS export:**
- `GetTollsForTFMS` (11351) — third-party fleet system export.
- `GetDarbTollsForTMS` (11559).
- `GetDarbTollsForTmsDashboard` (11615).
- `GetSalikTollsForTmsDashboard` (11623).

**Import (manual upload):**
- `ImportSalikTolls` (11639).
- `ImportDarbTolls` (11647).

**Custom data sharing:**
- `GetTollsForCustomDataSharing_Shif` (11431) [SIC: typo "Shif"].
- `GetTollsForCustomDataSharing_Shift_Paged` (11439).
- `GetSalikTollsForCustomDataSharing_Shift` (11671).
- `GetDarbTollsForCustomDataSharing_Shift` (11663).

### 3.2 `salikAccount` (10 endpoints — proxy lines 11091–11163)

| Endpoint | Proxy line | Purpose |
|---|---|---|
| `GetSalikAccounts` | 11095 | List per tenant. |
| `GetSalikAccountsByAuthority` | 11103 | Filter by Salik / Darb / Parking. |
| `CreateOrUpdateSalikAccount` | 11111 | Persist. |
| `GetSalikAccountForEdit` | 11119 | Edit form. |
| `GetSalikAccountForView` | 11127 | View form. |
| `DeleteSalikAccount` | 11135 | Delete. |
| `UpdateLastDownloadDate` | 11143 | Cursor advance after Salik scrape. |
| `UpdateParkingLastDownloadDate` | 11151 | Cursor advance after Parking scrape (parking shares Salik account). |
| `GetSalikAccountsForExtension` | 11159 | Extension preflight list. |

### 3.3 `tollMonthEndPosting` (2 endpoints — proxy lines 11067–11079)

| Endpoint | Proxy line | Purpose |
|---|---|---|
| `PostTollsMonthEnd` | 11071 | Salik EOM JV. |
| `PostDarbsMonthEnd` | 11079 | Darb EOM JV. |

### 3.4 `tollsDataSharing` (3 endpoints — proxy lines 22291–22319)

| Endpoint | Proxy line | Purpose |
|---|---|---|
| `GetTolls` | 22295 | Inter-tenant aggregated read. |
| `GetTollsNew` | 22303 | v2. |
| `UpdateSharedStatus` | 22311 | Mark as consumed. |

---

## 4. Salik portal scrape mechanics (bundle lines 13103–13231)

```
getDownloadUrl(pageId, tagNo, startDate, endDate, downloadUnchargedSalikTolls):
  baseUrl + 
    "&pageSize=10
     &timePeriod=" + (startDate ? "4" : "1") +
    "&tripType=" + (downloadUnchargedSalikTolls ? "1" : "2") +
    "&tagPlateDetails=" + (tagNo ? "2" : "1") +
    "&tagNumber=" + tagNo
```

- `timePeriod=4` = custom date range; `=1` = default last N days.
- `tripType=1` = uncharged-only; `=2` = all.
- `tagPlateDetails=2` = filter by tag; `=1` = all tags on account.
- `pageSize=10` (small — Salik portal limit).
- `daysToReconcile` is operator-supplied; loop: per day call `getTollsByPage`.
- Per page: insert into local DB + re-call until `nextPage` exhausted.
- Status notification: `salikAccount.status = 'DD-MMM Done'`, progress %, error string.

Speed runs this in a browser extension (NOT server-side) because the Salik portal is geo-restricted to UAE IPs and CAPTCHA-gated.

⚠ **Vesla's** `vesla-tars-salik-worker` and `vesla-darb-worker` use the same browser-extension model (see Fred subconscious notes on Chrome MV3 main-world content scripts).

---

## 5. Business Rules

| ID | Rule | Source |
|----|------|--------|
| R-001 | Toll attribution = `(vehicleId, passageTime ∈ movement window)`. Same algorithm as fines (R-001 there). | bundle behavior + Vesla `tars-match.matchUnmatchedSalik`. |
| R-002 | Customer surcharge per `movementContact.tollSurcharge` / `darbTollSurcharge`. Type FIXED or PERCENTAGE; lease variants present. | fines-list.json movementContact subset. |
| R-003 | VAT 5% applies to surcharge only — base toll is VAT-exempt. | UAE FTA + Vesla `tars-billing.invoiceSalikBatch:317`. |
| R-004 | Aggregation modes: PER_CROSSING, DAILY, WEEKLY, MONTHLY (Vesla `darb_charge_config.tollAggregation`). Speed uses tenant-wide setting. | Vesla `darb_charge_config:13475`. |
| R-005 | Salik account auth: per-account login (`salikAccount.username/password`). One account often owns 100+ tags. | bundle + `salikAccount` endpoint set. |
| R-006 | Per-account scrape cadence: operator-defined (`daysToReconcile`). Daily auto-scrape per `lastDownloadDate`. | bundle 12967, 13037. |
| R-007 | Tag↔plate mapping is mutable (vehicle is reassigned to a different tag after defleet/onfleet). `GetTagsOnPlateNo` returns ALL tags ever associated with the plate. Operator chooses correct one. | bundle + endpoint set. |
| R-008 | External-vehicle tolls (non-fleet hitting our account in error) are tracked separately for refund-from-Salik claim. | `SaveExternalTollsInBulk`, `GetExternalVehiclesTollReport`. |
| R-009 | Late toll = unbilled past N days (typically 30). `GetLateSalikTollReport` returns these. | endpoint name. |
| R-010 | EOM posting separates Salik (`PostTollsMonthEnd`) and Darb (`PostDarbsMonthEnd`) — different GL accounts. | endpoint set. |
| R-011 | TFMS / TMS exports: third-party fleet management tools consume `GetTollsForTFMS` and `GetTmsTollsReport`. | endpoint set. |
| R-012 | CRS report (`GetTollsReportCRS`) is a customer-facing variant — used in the customer-portal "Tolls" tab. | bundle + Vesla CRS = customer-facing rental system. |
| R-013 | Inter-tenant data sharing — same as fines (R-016). | `tollsDataSharing.UpdateSharedStatus`. |
| R-014 | Status alerts: `GetSalikStatusAlertDetails` / `GetDarbStatusAlertDetails` notify on stale `lastDownloadDate` (account inactive) or low wallet balance. | endpoint name. |
| R-015 | Custom data sharing for shifts (`*_Shift`) — ⚠ purpose unclear; possibly per-driver-shift toll attribution. | endpoint name. |
| R-016 | Browser-extension preflight (`PrepareDataForExtension`) returns the scrape plan; `JsLoaderForExtension` returns the JS payload. Speed treats the extension as a thin client. | bundle scrape logic. |

---

## 6. Three Tests Applied

### Feature: Unified `toll` service for Salik + Darb
- **Value:** YES — single bucket simplifies reports and EOM posting.
- **Understand:** YES — both are time-of-passage gate crossings.
- **Risk:** Removing (split per-authority) = duplicate report code.
- **Decision:** PRESERVE pattern — Vesla currently SPLITS into `tars_salik` + `darb_transactions`; consider a unified read-model view for reports.

### Feature: Per-Salik-account browser-extension scrape
- **Value:** YES — Salik portal blocks server-side scrapers + requires UAE IP.
- **Understand:** YES — Speed has no alternative.
- **Risk:** Removing = no toll data.
- **Decision:** PRESERVE — Vesla already does this in `vesla-tars-salik-worker` extension.

### Feature: External-vehicle tolls
- **Value:** YES — recoverable revenue (refund claims to Salik).
- **Understand:** YES.
- **Risk:** Removing = miss refund opportunities.
- **Decision:** PRESERVE — Vesla currently lacks this; gap to fill.

### Feature: Tags as separate entity (mutable plate↔tag mapping)
- **Value:** YES — handles defleet/onfleet vehicle swaps.
- **Understand:** YES — RFID tags outlive vehicle assignments.
- **Risk:** Removing = wrong attribution after fleet rotation.
- **Decision:** PRESERVE — Vesla `tars_salik.tagNumber` exists; check that historical tag→plate mapping is captured.

### Feature: 75-endpoint sprawl in `toll` service
- **Value:** PARTIAL — many are one-off operational fixes (Shift sharing, CRS view, TMS dashboard variants).
- **Understand:** PARTIAL.
- **Risk:** Removing = if our customers consume any of these, regressions.
- **Decision:** ⚠ FLAG endpoints that have NO Vesla equivalent; build only when needed.

### Feature: TFMS / TMS / CRS / Custom-Shift exports
- **Value:** UNCERTAIN — third-party integrations specific to legacy Speed customers.
- **Understand:** PARTIAL — `TFMS` likely Tasleem fleet management; `TMS` likely Trips Management System.
- **Risk:** Low for Vesla (no current customer using these).
- **Decision:** ⚠ FLAG `Uncertain-Value Features` below.

### Feature: Aggregation mode (per-crossing / daily / weekly / monthly)
- **Value:** YES — large fleets need monthly consolidated invoices.
- **Understand:** YES — already captured in Vesla `darb_charge_config.tollAggregation`.
- **Risk:** Removing = invoice spam.
- **Decision:** PRESERVE — extend to `tars_salik` config (currently only Darb has aggregation column).

---

## 7. ⚠ Uncertain-Value Features

1. **`tollsDataSharing` service** — same as fines (R-016 there). Decide by: Vesla customer survey.
2. **`PrepareDataForExtension` vs `PrepareDataForExtension1` and `SearchTollPlateAndTags` vs `SearchTollPlateAndTags1`** — two versions of the same endpoint coexist. Decide by: which UI calls.
3. **`SaveTollsInBulk` vs `SaveTollsInBulkNew`** — same pattern.
4. **`GetTollSummaryByDate` vs `GetTollSummaryByDateAndPlateNo`** — two report variants, may need both.
5. **`Custom_Shift` family** — purpose unclear; possibly driver-shift attribution. Decide by: Vesla operations interview.
6. **`GetTollsForTFMS`, `GetTmsTollsReport`, `GetTmsTollsReportForReport`** — third-party integrations; build only if customer requests.
7. **`GetTollsReportCRS`** — customer-portal report (similar to Vesla customer-app fines tab). Decide by: customer-portal scope.
8. **`IsFeatureEnabled` / `IsFeaturesEnabled`** — feature flag endpoints; what flags?
9. **`UpdateParkingLastDownloadDate` on `salikAccount`** — implies parking shares the Salik account. Vesla currently has separate `parkin_credentials`. Worth merging.

---

## 8. Proposed Improvements (Vesla deviations)

| Speed | Vesla improvement | Reason |
|---|---|---|
| Single mutable `tagNo` on toll row | Add `tag_assignments` history table for plate↔tag changes | Auditability across fleet rotation. |
| Two `SaveTollsInBulk` endpoints | One canonical `upsertSalikTolls` | Simpler. |
| Salik portal scrape JS hard-coded in bundle | Vesla extension already separated (good) | Already done. |
| Per-tenant aggregation on Darb only | Add `tollAggregation` to TARS charge config too | Consistency. |
| 75 `toll` endpoints | Three-layer split: `tars-salik-pull/attribute/billing` + `darb-pull/attribute/billing` (already partially done) | Maintainability. |
| Inline VAT calc | Centralized `vatHelper` (already done) | Already done. |
| Per-crossing invoice (default) | Tenant-controlled aggregation (already done in Vesla `darb_charge_config`) | Already done. |

---

## 9. Vesla Code Cross-Reference

| Speed surface | Vesla equivalent |
|---|---|
| `toll.GetTolls` (Salik) | `backend/src/services/tars-salik.service.ts:listSalik` |
| `toll.GetTolls` (Darb) | `backend/src/services/darb-transactions.service.ts:listTransactions` (route `/api/darb/transactions`) |
| `toll.GetTollsByAgreementId` | `backend/src/services/tars-salik.service.ts:getSalikByContract` |
| `toll.GetDarbTollsReport` | NOT YET — needs `tars-tolls-report.service.ts` (card C3) |
| `toll.GetTollSummaryByDate` | `backend/src/controllers/tars-salik.controller.ts:listSalikYears/Months` (partial) |
| `toll.ProcessTolls` (attribute) | `tars-match.service.ts:matchUnmatchedSalik` (Salik) + Darb auto-match in `darb` route handler |
| `toll.ProcessTolls` (invoice) | `tars-billing.service.ts:invoiceSalikBatch` (Salik) + `tars-period-billing.service.ts:processTollBilling` (consolidated Salik+Darb) |
| `toll.GetSalikReconciliation` | NOT YET |
| `toll.GetLateSalikTollReport` | NOT YET |
| `toll.GetExternalVehiclesTollReport` | NOT YET |
| `toll.SaveExternalTollsInBulk` | NOT YET |
| `toll.AttachVehicleForDarb` | partial via `darb` route `/transactions/:id/assign` |
| `toll.SaveTollsInBulk` (Salik) | `vesla-tars-salik-worker.tars-salik-sync.upsertMany` |
| `toll.SaveTollsInBulk` (Darb) | `vesla-darb-worker.darb-autosync.upsertMany` |
| `toll.PrepareDataForExtension` | Vesla extension uses internal preflight (different shape) |
| `toll.GetTagsOnPlateNo` | NOT YET |
| `salikAccount.GetSalikAccounts` | Vesla split: `tars_credentials` (TARS Salik) + `darb_credentials` |
| `salikAccount.UpdateLastDownloadDate` | Vesla `tars_credentials.lastSyncAt` |
| `tollMonthEndPosting.PostTollsMonthEnd` | Vesla bills daily; no EOM JV today |
| `tollsDataSharing.*` | NOT BUILT |

---

## 10. Open Questions

- Q1: Does Speed dedupe `tollId` across re-downloads, or does it depend on portal-side dedup? (Vesla uses `(companyId, transactionId)` unique.)
- Q2: How does Speed handle Salik account suspension (low balance) — does it pause attribution or just alerts?
- Q3: `Custom_Shift` family — driver shift attribution semantics?
- Q4: Tag↔plate history — does Speed track historical mapping or only current?
- Q5: External-vehicle tolls — what's the refund workflow with Salik authority?
