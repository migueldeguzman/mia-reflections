# toll — API

> All requests POST + JSON unless noted. Source: `_scripts/AbpServiceProxies-jquery.js`.

---

## `abp.services.app.toll` — 75 endpoints (proxy lines 11171–11770)

Base path: `/api/services/app/toll/`

| # | Endpoint | Proxy line | Purpose |
|---|---|---|---|
| 1 | `GetTolls` | 11175 | Main list (Salik default; Darb via filter). |
| 2 | `GetTollsByAgreementId` | 11183 | Per-agreement. |
| 3 | `GetTollsForInvoice` | 11191 | Eligible for invoicing. |
| 4 | `GetPendingTollsToInvoice` | 11199 | Pending bucket. |
| 5 | `ProcessTolls` | 11207 | Attribute + invoice batch. |
| 6 | `UpdateTollForInvoice` | 11215 | Pre-invoice tweak. |
| 7 | `DetachTollsFromInvoice` | 11223 | Unbill. |
| 8 | `GetTollsReportCRS` | 11231 | CRS-customer report (server-side class: `Speed.Tolls.TollAppService.GetTollsReportCRS`, per `tolls-crs.json` stack). |
| 9 | `ExportToExcel` | 11239 | XLSX. |
| 10 | `ProcessTollsMonthEndPosting` | 11247 | Salik EOM JV. |
| 11 | `ProcessDarbsMonthEndPosting` | 11255 | Darb EOM JV. |
| 12 | `GetTollsForDetails` | 11263 | Detail-page payload. |
| 13 | `TollDetailsExportToExcel` | 11271 | Detail XLSX. |
| 14 | `DownloadForAllAccountSummary` | 11279 | All-Salik-accounts summary. |
| 15 | `DownloadForSelectedTagsSummary` | 11287 | Selected tags. |
| 16 | `GetSearchPlateNo` | 11295 | Autocomplete (legacy). |
| 17 | `GetSearchPlateNonew` | 11303 | Autocomplete (new). |
| 18 | `GetSearchTagNo` | 11311 | Tag autocomplete. |
| 19 | `GetTollsReportForReport` | 11319 | Formatted report. |
| 20 | `SearchPlateNos` | 11327 | Bulk plate search. |
| 21 | `UpdateSalikAccountDetails` | 11335 | Bulk account remap. |
| 22 | `GetSalikReconciliation` | 11343 | Three-way: portal vs local vs invoiced. |
| 23 | `GetTollsForTFMS` | 11351 | TFMS export. |
| 24 | `GetReconcileToll` | 11359 | Single-toll reconcile lookup. |
| 25 | `GetTagsOnPlateNo` | 11367 | Plate→tags. |
| 26 | `SearchTollPlateAndTags` | 11375 | Combined search. |
| 27 | `PrepareDataForExtension` | 11383 | Extension scrape preflight (legacy). |
| 28 | `SaveTollsInBulk` | 11391 | Portal-pull insert (legacy). |
| 29 | `SaveExternalTollsInBulk` | 11399 | Non-fleet vehicle insert. |
| 30 | `SaveAndUpdateAgreementNo` | 11407 | Manual attribute. |
| 31 | `GetTollSummaryByDate` | 11415 | Daily summary. |
| 32 | `GetTollsCountByAccount` | 11423 | Per-account count. |
| 33 | `GetTollsForCustomDataSharing_Shif` [SIC] | 11431 | Custom-shift sharing. |
| 34 | `GetTollsForCustomDataSharing_Shift_Paged` | 11439 | Paged variant. |
| 35 | `UpdateSharingStatus` | 11447 | DataSharing write. |
| 36 | `JsLoaderForExtension` | 11455 | Extension JS payload (GET-style with `type` query). |
| 37 | `PrepareDataForExtension1` | 11463 | New variant. |
| 38 | `SearchTollPlateAndTags1` | 11471 | New variant. |
| 39 | `GetDarbTollsReport` | 11479 | Darb consolidated report. |
| 40 | `GetTmsTollsReportForReport` | 11487 | TMS-formatted. |
| 41 | `GetTmsTollsReport` | 11495 | TMS list. |
| 42 | `ExportToExcelTmsSalikTollsReport` | 11503 | TMS Salik XLSX. |
| 43 | `ExportToExcelTmsDarbTollsReport` | 11511 | TMS Darb XLSX. |
| 44 | `GetTollsReportCrsForReport` | 11519 | CRS-formatted. |
| 45 | `ExportToExcelTollsReportCrs` | 11527 | CRS XLSX. |
| 46 | `GetDarbTollsReportForReport` | 11535 | Darb formatted. |
| 47 | `ExportToExcelDarbTollsReport` | 11543 | Darb XLSX. |
| 48 | `GetTollSummaryByDateAndPlateNo` | 11551 | Daily-by-plate summary. |
| 49 | `GetDarbTollsForTMS` | 11559 | Darb TMS export. |
| 50 | `SaveTollsInBulkNew` | 11567 | Portal-pull insert (v2). |
| 51 | `AttachVehicleForDarb` | 11575 | Darb manual vehicle attach. |
| 52 | `GetDarbStatusAlertDetails` | 11583 | Darb account alert. |
| 53 | `GetSalikStatusAlertDetails` | 11591 | Salik account alert. |
| 54 | `ExportToExcelCustom` | 11599 | Custom XLSX. |
| 55 | `ValidateExportToExcelCustom` | 11607 | Validate before export. |
| 56 | `GetDarbTollsForTmsDashboard` | 11615 | Darb TMS dashboard. |
| 57 | `GetSalikTollsForTmsDashboard` | 11623 | Salik TMS dashboard. |
| 58 | `UpdateTollsAgreement` | 11631 | Bulk agreement update. |
| 59 | `ImportSalikTolls` | 11639 | Manual XLSX upload (Salik). |
| 60 | `ImportDarbTolls` | 11647 | Manual XLSX upload (Darb). |
| 61 | `GetTollsCountBreakupDateWise` | 11655 | Date-wise breakup. |
| 62 | `GetDarbTollsForCustomDataSharing_Shift` | 11663 | Darb shift sharing. |
| 63 | `GetSalikTollsForCustomDataSharing_Shift` | 11671 | Salik shift sharing. |
| 64 | `GetTollReport2` | 11679 | Alt-grouping report. |
| 65 | `ExportToCsvCustom` | 11687 | Custom CSV. |
| 66 | `GetTollSummaryReport` | 11695 | Aggregate by account/tag. |
| 67 | `GetLateSalikTollReport` | 11703 | Past-N-days unbilled. |
| 68 | `GetExternalVehiclesTollReport` | 11711 | Non-fleet on our account. |
| 69 | `IsFeatureEnabled` | 11719 | Per-feature flag. |
| 70 | `IsFeaturesEnabled` | 11727 | Bulk flags. |
| 71 | `SalikTollReportView` | 11735 | uigrid view. |
| 72 | `SalikTollReportViewExportToExcel` | 11743 | View XLSX. |
| 73 | `GetDownloadedTollsCountForReconciliationByAccount` | 11751 | Reconciliation count. |
| 74 | `DarbTollReportView` | 11759 | Darb uigrid view. |
| 75 | `DarbTollReportViewExportToExcel` | 11767 | Darb view XLSX. |

---

## `abp.services.app.salikAccount` — 10 endpoints (proxy lines 11091–11163)

Base path: `/api/services/app/salikAccount/`

| # | Endpoint | Proxy line |
|---|---|---|
| 1 | `GetSalikAccounts` | 11095 |
| 2 | `GetSalikAccountsByAuthority` | 11103 |
| 3 | `CreateOrUpdateSalikAccount` | 11111 |
| 4 | `GetSalikAccountForEdit` | 11119 |
| 5 | `GetSalikAccountForView` | 11127 |
| 6 | `DeleteSalikAccount` | 11135 |
| 7 | `UpdateLastDownloadDate` | 11143 |
| 8 | `UpdateParkingLastDownloadDate` | 11151 |
| 9 | `GetSalikAccountsForExtension` | 11159 |

---

## `abp.services.app.tollMonthEndPosting` — 2 endpoints (proxy lines 11067–11079)

| # | Endpoint | Proxy line |
|---|---|---|
| 1 | `PostTollsMonthEnd` | 11071 |
| 2 | `PostDarbsMonthEnd` | 11079 |

## `abp.services.app.tollsDataSharing` — 3 endpoints (proxy lines 22291–22319)

| # | Endpoint | Proxy line |
|---|---|---|
| 1 | `GetTolls` | 22295 |
| 2 | `GetTollsNew` | 22303 |
| 3 | `UpdateSharedStatus` | 22311 |

---

## Filter envelope (`GetTolls` / `GetTollsForInvoice` / `GetTollsReport*`)

⚠ Probes returned errors — exact filter shape not captured. From bundle inspection, expected fields include:

- `enableDateRange`, `fromDate`, `toDate`, `fromTime`, `toTime`
- `agreementNo`, `vehicleId`, `customerId`, `plateNo[]`
- `tagNo[]`, `salikAccountId`
- `gate[]`, `direction`, `authority`
- `amountFrom`, `amountTo`
- `enableInvoiced`, `enablePending`, `enableLate`
- `tollType` (Salik / Darb / Parking)
- `skipCount`, `maxResultCount`, `sorting`

Authoritative filter envelope must be captured by replaying `GetTolls` against a tenant with data.

## Row shape

Per `spd_tolls` mirror (Vesla schema.prisma:21299) and `tolls-list.json` (which was null on this probe):
- `id, tollId, date, tollType, authority, tagNo, plateNo, vehicle, makeAndModel, gate, direction, amount, agreementNo, customer, customerCode, invoiceNo, status, accountName, normalizedPlate`.

---

## Vesla equivalents matrix

| Speed endpoint | Vesla route + handler | Status |
|---|---|---|
| `toll/GetTolls` (Salik) | `GET /api/tars-salik` → `tars-salik.controller.ts:listSalik` | ✅ |
| `toll/GetTolls` (Darb) | `GET /api/darb/transactions` → `darb.routes.ts` | ✅ |
| `toll/GetTollsByAgreementId` | per-customer endpoint exists (per-contract gap) | ⚠ partial |
| `toll/GetTollsReportCRS` | NOT YET | 🚧 card C3 |
| `toll/GetDarbTollsReport` | NOT YET | 🚧 card C3 |
| `toll/GetTollSummaryByDate` | partial via `listSalikYears/Months` | ⚠ |
| `toll/GetTollSummaryReport` | NOT YET | 🚧 |
| `toll/GetLateSalikTollReport` | NOT YET | 🚧 |
| `toll/GetExternalVehiclesTollReport` | NOT YET | 🚧 |
| `toll/SaveExternalTollsInBulk` | NOT YET | 🚧 |
| `toll/ProcessTolls` (attribute) | `tars-match.matchUnmatchedSalik` + Darb auto-match | ✅ |
| `toll/ProcessTolls` (invoice) | `tars-billing.invoiceSalikBatch` + `tars-period-billing.processTollBilling` | ✅ |
| `toll/GetSalikReconciliation` | NOT YET | 🚧 |
| `toll/SaveTollsInBulk` (Salik) | `vesla-tars-salik-worker.upsertMany` | ✅ |
| `toll/SaveTollsInBulk` (Darb) | `vesla-darb-worker.upsertMany` | ✅ |
| `toll/AttachVehicleForDarb` | `PATCH /api/darb/transactions/:id/assign` | ✅ |
| `toll/UpdateTollsAgreement` | NOT YET (bulk) | 🚧 |
| `toll/GetTagsOnPlateNo` | NOT YET | 🚧 |
| `toll/Import{Salik,Darb}Tolls` | NOT YET (manual XLSX) | 🚧 |
| `toll/IsFeatureEnabled(s)` | Vesla uses `feature-flags` infra | ⚠ different |
| `salikAccount/*` | Vesla split: `tars_credentials` + `darb_credentials` (no unified Salik-account model) | ⚠ schema gap |
| `salikAccount/UpdateLastDownloadDate` | Vesla `tars_credentials.lastSyncAt` | ✅ |
| `tollMonthEndPosting/Post{Tolls,Darbs}MonthEnd` | Vesla bills daily; no EOM JV | ⚠ deviation |
| `tollsDataSharing/*` | NOT BUILT | ❌ deferred |

---

## ⚠ Open Questions

- Q1: Exact `GetTolls` filter envelope (probe errored).
- Q2: `GetTollsReportCRS` field set vs `GetTollsReport2` — what differs?
- Q3: `_Shift` data sharing semantics (driver shifts?).
- Q4: `IsFeatureEnabled` flag list — what features?
