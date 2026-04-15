# fine — API

> All requests POST + JSON unless noted. Source: `_scripts/AbpServiceProxies-jquery.js`. Probe payloads in `fine/*.json`.

---

## `abp.services.app.uaeFine` — 62 endpoints (proxy lines 20599–21111)

Base path: `/api/services/app/uaeFine/`

| # | Endpoint | Proxy line | Purpose |
|---|---|---|---|
| 1 | `GetFines` | 20599 | Main paged list. |
| 2 | `GetFinesByAgreementId` | 20607 | Per-agreement list. |
| 3 | `GetFinesForInvoice` | 20615 | Eligible-for-invoice subset. |
| 4 | `GetFinesDueToBills` | 20623 | Awaiting supplier bill. |
| 5 | `GetPendingFines` | 20631 | Unpaid + unbilled. |
| 6 | `ProcessFines` | 20639 | Attribute + invoice batch. |
| 7 | `UpdateFineForInvoice` | 20647 | Pre-invoice tweak. |
| 8 | `DetachFinesFromInvoice` | 20655 | Unbill. |
| 9 | `IgnoreFine` | 20663 | Toggle on. |
| 10 | `UnIgnoreFine` | 20671 | Toggle off. |
| 11 | `GetFinesReport` | 20679 | Grouped report (filter envelope §below). |
| 12 | `ExportToExcel` | 20687 | XLSX export. |
| 13 | `ExportToExcelView` | 20695 | XLSX of currently-filtered view. |
| 14 | `ProcessFinesMonthEndPosting` | 20703 | EOM JV. |
| 15 | `GetFineForPrint` | 20711 | Print payload. |
| 16 | `GetFineByJV` | 20719 | Lookup by debit JV voucher. |
| 17 | `GetFineById` | 20727 | Single read (GET-style with id query param). |
| 18 | `AttachVehicleWithFine` | 20735 | Manual vehicle attribute. |
| 19 | `GetSearchPlateNo` | 20743 | Plate autocomplete. |
| 20 | `GetFiltersData` | 20751 | Drop-down sources (server, trafficFileId). |
| 21 | `GetFinesReportForReport` | 20759 | Formatted variant. |
| 22 | `GetFinesReportForReportView` | 20767 | View-state variant. |
| 23 | `UpdateFinesAccountDetails` | 20775 | Bulk account remap. |
| 24 | `GetFineReconciliation` | 20783 | Three-way match. |
| 25 | `EmailFines` | 20791 | Bulk email. |
| 26 | `GetFinesForTMS` | 20799 | TMS export. |
| 27 | `UpdateChargeAndCollection` | 20807 | Adjust collected/charged. |
| 28 | `GetTrafficFilesOnPlateNo` | 20815 | Plate→trafficFile. |
| 29 | `ProcessFinesInBulk` | 20823 | Chunked process. |
| 30 | `FineLogs` | 20831 | Audit trail read. |
| 31 | `CreateFineLog` | 20839 | Audit trail write. |
| 32 | `UpdateFine` | 20847 | Generic update. |
| 33 | `GetMissingFines` | 20855 | RTA-side gap detector. |
| 34 | `UpdateFineImage` | 20863 | Speed-camera image set. |
| 35 | `GetFineImage` | 20871 | Image read (GET-style with id). |
| 36 | `SaveFinesInBulk` | 20879 | Portal pull insert. |
| 37 | `SaveFinesInBulkBackUp` | 20887 | ⚠ Backup variant — purpose unclear. |
| 38 | `UpdateFineWithAgreementNo` | 20895 | Manual agreement attribute. |
| 39 | `GetTrafficFilesOnVehicles` | 20903 | Bulk plate→trafficFile. |
| 40 | `UpdateFinesDetails` | 20911 | Multi-field update. |
| 41 | `GetFineNosForUpdateFineTimeAUH` | 20919 | AUH timestamp fix selection. |
| 42 | `GetFineNosForUpdateFineDescription` | 20927 | Description fix selection. |
| 43 | `UpdateFineDetail` | 20935 | Detail-page edit. |
| 44 | `ExportToCsvCustom` | 20943 | Custom-format CSV. |
| 45 | `UpdateFineDescription` | 20951 | Single description fix. |
| 46 | `UpdateFineDescriptionInBulk` | 20959 | Bulk variant. |
| 47 | `UpdateDuabiFinesDescription` | 20967 | Dubai-specific batch [SIC: typo "Duabi"]. |
| 48 | `MarkFinesPaidByTFID` | 20975 | Bulk paid-mark per traffic file. |
| 49 | `ImportFines` | 20983 | CSV import. |
| 50 | `ExternalVehicleFinesReport` | 20991 | Third-party fleet sharing. |
| 51 | `GetPendingVehiclesForEmail` | 20999 | Pending-fines vehicle list. |
| 52 | `GetFinesOnPendingVehicleForEmail` | 21007 | Per-vehicle fine list for email. |
| 53 | `SaveExternalFines` | 21015 | Third-party-source insert. |
| 54 | `DownloadConfisactionChargesFromDubaiPolice` | 21023 | DP confiscation pull. |
| 55 | `GetFinesForConfiscationDownloading` | 21031 | Pre-pull selection. |
| 56 | `DownloadConfiscationCharges` | 21039 | Bulk download. |
| 57 | `GetOmanFinesDatesToCheckPaymentDetails` | 21047 | Oman expansion (GET-style). |
| 58 | `ProcessEmailDetailsForEmailPendingFines` | 21055 | Email pending-vehicles batch. |
| 59 | `UpdateLastFineEmailDetailsByPlate` | 21063 | Track last-emailed timestamp. |
| 60 | `GetMissingFinesWithAmountChanges` | 21071 | RTA amount-change detector. |
| 61 | `TestDescriptionDownloading` | 21079 | Debug RTA description fetch (GET-style). |
| 62 | `GetUaePasses` | 21087 | UAE Pass tokens. |
| 63 | `WhatsAppProcessFines` | 21095 | WhatsApp bulk send. |
| 64 | `WhatsAppFromFinesReport` | 21103 | WhatsApp from-report variant. |
| 65 | `ExternalVehicleFinesReport2` | 21111 | Third-party v2. |

### `GetFinesReport` filter envelope (probe `fine/GetFinesReport-request.json`)

```jsonc
{
  "enableDateRange": true,
  "name": "",
  "agreementNo": null,
  "vehicleId": null,
  "plateTagNo": null,
  "customerId": null,
  "fromDate": "<iso utc>",
  "fromTime": "<iso utc>",
  "toDate": "<iso utc>",
  "toTime": "<iso utc>",
  "amount": null,
  "trafficFileId": null,
  "vehicleNo": [],
  "enableWithAgreement": false,
  "enableOthers": false,
  "enableWithOutAgreement": false,
  "enableInvoiced": false,
  "enableIgnored": false,
  "enableGenerated": false,
  "enableUnIgnored": false,
  "debitJvStatus": null,
  "sharingStatus": null,
  "skipCount": 0,
  "maxResultCount": 10,
  "finesWithFailedVehicleMappings": false,
  "isPaid": null,
  "isPayable": null,
  "locationId": "",
  "plateNo": [],
  "durationType": 1,
  "trafficFileIdEN": [],
  "vehicleNoEN": [],
  "server": null,
  "vehicleNoArr": [],
  "movementType": null,
  "externalTollsOnly": null,
  "hasBlackPoints": null,
  "hasConfiscationCharges": null,
  "hasLateCharges": null,
  "isAddedManually": null,
  "trafficFileIdArr": [],
  "serverArr": []
}
```

### `GetFinesReport` row shape (from `fines-list.json`)

See behavior.md §2.1 — every observed field documented. Authoritative.

### `GetFiltersData` response (probe)

```jsonc
{
  "result": {
    "server": [
      { "id": 0, "name": "Dubai", "state": null },
      { "id": 0, "name": "Abu Dhabi", "state": null }
    ],
    "trafficFileId": [
      { "id": 725, "name": "50024395", "state": "Dubai" },
      { "id": 726, "name": "50495971", "state": "Dubai" }
    ]
  }
}
```

⚠ Note: `server.id=0` for both — means `id` is unused; UI keys on `name`.

---

## `abp.services.app.trafficFine` — 11 endpoints (proxy lines 20495–20583)

Base path: `/api/services/app/trafficFine/`

| # | Endpoint | Proxy line |
|---|---|---|
| 1 | `GetTrafficFines` | 20495 |
| 2 | `GetImageForShow` | 20503 |
| 3 | `GetImageForEmail` | 20511 |
| 4 | `CreateOrUpdateTrafficFine` | 20519 |
| 5 | `GetTrafficFineForEdit` | 20527 |
| 6 | `GetMovementOnVehicle` | 20535 |
| 7 | `DeleteTrafficFine` | 20543 |
| 8 | `ExportToExcel` | 20551 |
| 9 | `ChargeTrafficFine` | 20559 |
| 10 | `ChargeTrafficFineNew` | 20567 |
| 11 | `CreateInvoiceFromTrafficFine` | 20575 |
| 12 | `ImportTrafficFines` | 20583 |

⚠ `ChargeTrafficFine` vs `ChargeTrafficFineNew` — both exist; UI caller decides which is current.

---

## `abp.services.app.fineEmail` — 4 endpoints (proxy lines 20267–20303)

| # | Endpoint | Proxy line | Purpose |
|---|---|---|---|
| 1 | `EmailFine` | 20271 | Single fine email. |
| 2 | `EmailBlackPointsFine` | 20279 | Black points warning email. |
| 3 | `IdBlockFineReportAlert2` | 20287 | Driver licence-block alert v2. |
| 4 | `IdBlockFineReportAlert3` | 20295 | v3. |

## `abp.services.app.fineSMS` — 2 endpoints (proxy lines 20243–20263)

| # | Endpoint | Proxy line |
|---|---|---|
| 1 | `SendFineSMS` | 20247 |
| 2 | `SendFineWhatsAppSMS` | 20255 |

## `abp.services.app.fineEmailAlert` — 2 endpoints (proxy lines 20203–20223)

| # | Endpoint | Proxy line | Purpose |
|---|---|---|---|
| 1 | `SendAlertForFineAmountGreaterThanAlert` | 20207 | Internal staff alert. |
| 2 | `SendAlertForNoOfFinesOnVehicleMoreThanLimit` | 20215 | Internal staff alert. |

## `abp.services.app.fineMonthEndPosting` — 1 endpoint (proxy line 20227)

| # | Endpoint | Proxy line |
|---|---|---|
| 1 | `PostFinesMonthEnd` | 20231 |

## `abp.services.app.finesDataSharing` — 3 endpoints (proxy lines 22323–22351)

| # | Endpoint | Proxy line |
|---|---|---|
| 1 | `GetFines` | 22327 |
| 2 | `GetFines2` | 22335 |
| 3 | `UpdateSharedStatus` | 22343 |

## `abp.services.app.generateFineBill` — 2 endpoints (proxy lines 5527–5550)

| # | Endpoint | Proxy line |
|---|---|---|
| 1 | `GenerateBills` | 5535 |
| 2 | `DeleteBillsInBulk` | 5543 |

---

## Vesla equivalents matrix

| Speed endpoint | Vesla route + handler | Status |
|---|---|---|
| `uaeFine/GetFines` | `GET /api/tars-fines` → `tars-fines.controller.ts:listFines` | ✅ exists; gap: 27-field filter envelope vs Vesla's slimmer query |
| `uaeFine/GetFinesByAgreementId` | `GET /api/tars-fines/customers/:customerId/fines` | ✅ exists (customer-scoped, not agreement-scoped — gap) |
| `uaeFine/GetFinesReport` | NOT YET | 🚧 card C2 |
| `uaeFine/GetFiltersData` | NOT YET | 🚧 card C2 |
| `uaeFine/ProcessFines` | `POST /api/tars-fines/sync` (sync) + `runBillingForCompany` (bill) | ✅ split implementation |
| `uaeFine/IgnoreFine` / `UnIgnoreFine` | NOT YET | 🚧 card C2 |
| `uaeFine/GetMissingFines` | NOT YET | 🚧 card C2 (reconciliation) |
| `uaeFine/GetFineReconciliation` | NOT YET | 🚧 card C2 |
| `uaeFine/MarkFinesPaidByTFID` | NOT YET | 🚧 card B1 worker side |
| `uaeFine/AttachVehicleWithFine` | partial via `tars-match.service.ts` (auto) — manual attach UX missing | 🚧 card C2 |
| `uaeFine/UpdateFineWithAgreementNo` | partial via `resolveVehiclePossessor` (auto) — manual override missing | 🚧 card C2 |
| `uaeFine/EmailFines` | `notificationTrigger.fineInvoiced` (single) — bulk variant missing | 🚧 card C2 |
| `uaeFine/WhatsApp*` | NOT YET — Vesla notification channel needs WhatsApp adapter | 🚧 follow-up card |
| `uaeFine/ExportToExcel` / `ExportToCsvCustom` | NOT YET | 🚧 card C2 |
| `uaeFine/SaveFinesInBulk` | `vesla-tars-fines-worker.upsertMany` | ✅ exists |
| `uaeFine/SaveExternalFines` | NOT YET | 🚧 if business need |
| `uaeFine/Download*Confiscation*` | NOT YET — Vesla doesn't pull confiscation portal yet | 🚧 follow-up |
| `uaeFine/GetUaePasses` | UAE Pass integration in `web-erp-app` (separate) | ✅ separate domain |
| `trafficFine/CreateOrUpdateTrafficFine` | `POST /api/tars-fines` (manual create) | ✅ partial |
| `trafficFine/ChargeTrafficFineNew` | `tars-billing.service.ts:invoiceFine` | ✅ exists |
| `fineEmail/EmailBlackPointsFine` | NOT YET — Vesla doesn't track blackPoints yet | 🚧 follow-up |
| `fineEmailAlert/*` | NOT YET — internal staff alerts | 🚧 follow-up |
| `fineMonthEndPosting/PostFinesMonthEnd` | EOD daily run via `runBillingForCompany` (different cadence) | ⚠ deviation noted in behavior.md §8 |
| `finesDataSharing/*` | NOT BUILT (per Three Tests) | ❌ deferred |
| `generateFineBill/*` | overlapping with `createGovernmentBill` | ⚠ consolidate |

---

## ⚠ Open Questions (API-level)

- Q1: Exact response shape of `GetFinesReport` (probe captured a server-side null-ref) — needs replay against a tenant with data.
- Q2: `enableWithAgreement` vs `enableOthers` vs `enableWithOutAgreement` — overlapping booleans; need bundle-side eval logic.
- Q3: `durationType: 1` — enum values?
- Q4: `debitJvStatus` filter — what enum?
- Q5: `sharingStatus` filter — implies `finesDataSharing` integration on the read path even if Vesla doesn't write.
