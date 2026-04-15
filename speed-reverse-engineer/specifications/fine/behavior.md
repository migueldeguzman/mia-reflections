# fine — Behavior Specification

> **Doctrine:** See `DOCTRINE.md`. Three Tests applied to every preserved feature. Sources cited per claim. Vesla side-by-side at `web-erp-app/backend/...`.

**Module:** `fine` *(Vesla natives: `tars_fines`, `darb_fines`, `parkin_fines`; Vesla mirror: `spd_fines`)*

**Speed services** (`AbpServiceProxies-jquery.js`):
- `abp.services.app.uaeFine` — proxy lines 20599–21111. **62 endpoints.** The primary RTA-pulled fines bucket.
- `abp.services.app.trafficFine` — proxy lines 20495–20583. **11 endpoints.** Manually-entered / charged fines.
- `abp.services.app.fineReceipts` — proxy lines 20307–20431. **15 endpoints.** Receipts for fines paid to the government (separate spec module: `fine-receipts`).
- `abp.services.app.fineEmail` — proxy lines 20267–20303. **4 endpoints.** Customer-facing email notifications.
- `abp.services.app.fineSMS` — proxy lines 20243–20263. **2 endpoints.** SMS + WhatsApp.
- `abp.services.app.fineEmailAlert` — proxy lines 20203–20223. **2 endpoints.** Internal staff alerts.
- `abp.services.app.fineMonthEndPosting` — proxy line 20227. **1 endpoint.** EOM JV posting.
- `abp.services.app.finesDataSharing` — proxy lines 22323–22351. **3 endpoints.** Inter-tenant data sharing (used by parent companies aggregating fines across subsidiaries).
- `abp.services.app.generateFineBill` — proxy lines 5527–5550. **2 endpoints.** Generate bills for fines.

**Probes (`fine/`):**
- `GetFinesReport-request.json` — 27 filter fields (rich filter set, captured below).
- `GetFinesReport-response.json` — Server-side null-ref error in capture; reconstruct from `fines-list.json`.
- `GetFiltersData-response.json` — Drop-down catalogues: server (Dubai/Abu Dhabi), trafficFileId.
- `fines-list.json` — 4 real fine rows (Dubai Police + Department of Transportation Abu Dhabi). Authoritative for row shape.
- `fines-report.json` — error sample ("agreement not found").
- `fines-report2.json` — error sample (`UaeFineAppService.GetFinesReport` line 1082 NullReference). Confirms class is `Speed.Fines.UaeFineAppService`.
- `fine-detail.json` — empty.
- `fine-business-logic.json` — 27 MB extracted business-logic dump (used in spot-check; rows align with `fines-list.json` shape).

**External:**
- UAE Dubai Police fine portal (download Confiscation Charges — bundle endpoint `DownloadConfisactionChargesFromDubaiPolice`).
- AUH Department of Transportation portal.
- TARS API (per-vehicle traffic file binding).
- WhatsApp Business / Email / SMS providers.
- TMS (third-party traffic-management system — `GetFinesForTMS`).

---

## 1. Purpose

UAE rental companies are responsible for paying traffic fines on their fleet vehicles. Speed:
1. **Pulls** fines from RTA portals (Dubai Police + AUH DoT) per traffic file (per fleet of vehicles).
2. **Attributes** each fine to the rental movement that was active at the violation timestamp (vehicle + movement window).
3. **Charges** the customer/driver via invoice (base fine + surcharge + late fees + acknowledgment fee + confiscation charges).
4. **Pays** the government (recorded as a `fineReceipts` row).
5. **Emails / SMS / WhatsApps** the customer with the fine and proof.
6. **Reports** consolidated views (per vehicle, per customer, per traffic file, per server, per month).

---

## 2. Primary Entities

### 2.1 Fine *(Speed table reconstructed from `fines-list.json`)*

Every field observed in production capture (`fines-list.json`):

| Field | Type | Notes |
|---|---|---|
| `id` | int | PK. |
| `fineNo` | string | RTA-side fine number (e.g. `7040804062`). |
| `plateNo` | string | Numeric portion (e.g. `54039`). |
| `plateInfo` | string | Full plate (e.g. `54039-DD`). |
| `customPlateNo` | string? | Override when plate display differs. |
| `tripDriverName` | string? | Driver-of-record at violation time. |
| `contactNo` | string | Driver's mobile. |
| `salesPerson` | string | Owning sales rep (denorm). |
| `fineDateTime` | datetime UTC | Violation timestamp (used for movement attribution). |
| `authority` | string | "Dubai Police" / "Department of Transportation Abu Dhabi". |
| `downloadDateTime` | datetime UTC | When Speed pulled this fine. |
| `fineDescription` | string | RTA-supplied free-text. |
| `isPaid` | bool | Government-side payment flag. |
| `notes` | string? | Operator notes. |
| `vehicleId` | int | FK → vehicles. |
| `movementId` | int | FK → movements (attributed). |
| `ignored` | bool | Skip-from-billing flag. |
| `location` | string | Violation location (street name or "GPS Location"). |
| `agreementCustomerName` | string | Denorm. |
| `agreementNo` | string | Denorm. |
| `tripNo` | string? | Trip identifier (limousine). |
| `movementRefNo` | string? | Cross-ref to movement. |
| `movementStaffName` | string | Denorm. |
| `movementContact` | jsonb | Full customer object embedded (100+ fields — see §2.4). |
| `movementType` | string | "Agreement" / "Limo" / "Workshop" / etc. |
| `trafficFileId` | int | FK → trafficFiles. |
| `confiscationCharges` | decimal | Vehicle-impound fees. |
| `amount` | decimal | Base fine. |
| `acknowledgment` | decimal | Acknowledgment fee (e.g. `20.0`). |
| `surcharge` | decimal | Customer surcharge (e.g. `30.0`). |
| `amountWithSurcharge` | decimal | `amount + surcharge`. |
| `isPayable` | bool | Whether to bill customer (vs absorb). |
| `staffName` | string | Denorm of driver. |
| `chargedAmmount` | decimal | [SIC: typo preserved] Amount charged to customer. |
| `customValueField1` | decimal | Tenant-extensible. |
| `customValueField2` | decimal | Tenant-extensible. |
| `collectedAmount` | decimal | Customer payment received. |
| `due` | decimal | Customer outstanding. |
| `invoiceVoucherNo` | string | Invoice voucher (e.g. `FIN2604-000136`). |
| `debitJvVoucherNo` | string? | Debit JV voucher (when posted via `fineMonthEndPosting`). |
| `invoiceDueAmount` | decimal | Customer-side due (incl. VAT, e.g. `651.5` for 650 + AED 1.5 VAT on 30 surcharge × 5%). |
| `server` | string | "Dubai" / "Abu Dhabi" — RTA source. |
| `receiptDateTime` | datetime? | Government-side payment timestamp. |
| `receiptNo` | string | Government receipt no. |
| `latitude` | decimal? | GPS. |
| `longitude` | decimal? | GPS. |
| `blackPoints` | int | Driver licence demerit points. |
| `isAddedManually` | bool | Manually-entered (vs portal-pulled). |
| `lateCharges` | decimal | Government-imposed late fee. |
| `billNo` | string? | Supplier bill number (when paid to government). |
| `billDate` | datetime? | Bill date. |
| `invoiceDate` | datetime | Customer invoice date. |
| `billPaid` | bool? | Bill paid to government. |
| `companyCode` | string? | Multi-tenant company. |

### 2.2 Traffic Fine *(Speed `trafficFine` service — proxy 20495–20583)*

A **separate entity** from the RTA-pulled fine. Used for:
- Workshop / off-fleet fines that the portal doesn't own.
- Third-party fines (e.g. parking on hotel property).
- Manually-entered fines.

Endpoints suggest a slimmer record: `fineNo, plateNo, vehicleId, amount, agreementNo, charged, invoiced`.

### 2.3 Fine Receipt *(separate spec module — `fine-receipts`)*

Government-side proof-of-payment. 15 endpoints in `fineReceipts`. Ties back to `fineNo`.

### 2.4 Embedded Movement Contact *(jsonb on Fine)*

Every fine row carries a 100+ field snapshot of the driver-of-record (`movementContact`). Fields observed in `fines-list.json`:
- Identity: `code`, `firstName`, `middleName`, `lastName`, `companyName`, `gender`, `nationality`, `dateOfBirth`.
- Contact: `mobileNo`, `contactNo`, `contactNo2`, `fax`, `email`, `email2`.
- Address: `addressLine1/2`, `city`, `state`, `zipCode`, `country`.
- Surcharge config: `fineSurcharge`, `tollSurcharge`, `darbTollSurcharge`, `parkingSurcharge`, plus `*Type` (FIXED/PERCENTAGE) and `*Lease` variants.
- Billing: `taxRule`, `invoicingRule`, `invoicingType`, `creditPeriod`, `creditLimit`.
- Loyalty / VIP: `isVip`, `loyaltyNo`, `discountPercent`.
- Operational: `isBlackListed`, `blackListReason`, `inActive`, `verified`, `emailInvoices`, `clubInvoicesCharges`.
- Cross-refs: `salesPersonId`, `locationId`, `tariffCardId`, `debtCollectorId`, `taxCodeId`, `currencyId`.

⚠ This denormalization is **magnificent** for report performance (no JOIN per row) but creates staleness risk if customer profile changes after the fine row is captured. Speed accepts the staleness; Vesla should preserve.

---

## 3. Operations

### 3.1 `uaeFine` — 62 endpoints (proxy lines 20599–21111)

**Read / list:**
- `GetFines` (20599) — main list; uses `GetFinesReport`-style filter envelope.
- `GetFinesByAgreementId` (20607) — fines on a specific agreement.
- `GetFinesForInvoice` (20615) — fines eligible for invoicing.
- `GetFinesDueToBills` (20623) — fines waiting for supplier bill.
- `GetPendingFines` (20631) — `isPaid=false` + not yet billed.
- `GetFinesReport` (20679) — grouped report (per filter envelope).
- `GetFinesReportForReport` / `GetFinesReportForReportView` (20759, 20767) — formatted variants.
- `GetMissingFines` (20855) — RTA-side fines we haven't captured yet (gap detector).
- `GetFineReconciliation` (20783) — debit JV vs invoice vs receipt three-way match.
- `GetFinesForTMS` (20799) — TMS export.
- `ExternalVehicleFinesReport` (20991) / `ExternalVehicleFinesReport2` (21111) — third-party fleet sharing.
- `GetFineForPrint` (20711) — printable PDF source.
- `GetFineByJV` (20719) — lookup by debit JV voucher.
- `GetFineById` (20727) — single-row read.
- `GetFineImage` (20871) / `UpdateFineImage` (20863) — RTA image attachment (speed-camera photo).

**Mutate:**
- `ProcessFines` (20639) — main attribute + invoice batch.
- `ProcessFinesInBulk` (20823) — chunked variant for large windows.
- `ProcessFinesMonthEndPosting` (20703) — posts month-end JV.
- `UpdateFineForInvoice` (20647) — adjust amount/surcharge before invoicing.
- `DetachFinesFromInvoice` (20655) — unbill.
- `IgnoreFine` / `UnIgnoreFine` (20663, 20671) — toggle the ignore flag.
- `UpdateFinesAccountDetails` (20775) — bulk account remap.
- `AttachVehicleWithFine` (20735) — operator manually attributes vehicle when plate is ambiguous.
- `UpdateFineWithAgreementNo` (20895) — operator manually attributes agreement.
- `MarkFinesPaidByTFID` (20975) — bulk-mark-paid for a traffic file.
- `SaveFinesInBulk` (20879) / `SaveFinesInBulkBackUp` (20887) — bulk insert (portal pull).
- `SaveExternalFines` (21015) — third-party-source insert.
- `UpdateFine` (20847) — generic update.
- `UpdateChargeAndCollection` (20807) — adjust collected/charged after the fact.
- `UpdateFineDetail` (20935) — detail-page edit.
- `UpdateFineDescription` (20951) / `UpdateFineDescriptionInBulk` (20959) — description edits.
- `UpdateDuabiFinesDescription` (20967) — Dubai-specific.
- `UpdateFinesDetails` (20911) — multi-field update.
- `UpdateFineNosForUpdateFineTimeAUH` (20919) / `UpdateFineNosForUpdateFineDescription` (20927) — AUH-specific timestamp/description fixes (RTA-side data quality issues).
- `CreateFineLog` (20839) / `FineLogs` (20831) — audit trail entries.
- `ImportFines` (20983) — CSV import.

**Lookup helpers:**
- `GetFiltersData` (20751) — drop-down sources (server, trafficFileId).
- `GetSearchPlateNo` (20743) — autocomplete.
- `GetTrafficFilesOnPlateNo` (20815) — resolve which traffic file owns a plate.
- `GetTrafficFilesOnVehicles` (20903) — bulk variant.
- `GetUaePasses` (21087) — UAE Pass tokens.
- `GetMissingFinesWithAmountChanges` (21071) — RTA changed an existing fine's amount; flag for reconciliation.

**External pull:**
- `DownloadConfisactionChargesFromDubaiPolice` (21023) — confiscation portal pull.
- `GetFinesForConfiscationDownloading` (21031) — pre-pull selection.
- `DownloadConfiscationCharges` (21039) — bulk download.
- `GetOmanFinesDatesToCheckPaymentDetails` (21047) — Oman expansion.
- `TestDescriptionDownloading` (21079) — debug RTA description fetch.

**Email:**
- `EmailFines` (20791) — bulk email customers.
- `WhatsAppProcessFines` (21095) — WhatsApp variant.
- `WhatsAppFromFinesReport` (21103) — from-report bulk variant.
- `ProcessEmailDetailsForEmailPendingFines` (21055).
- `GetPendingVehiclesForEmail` (20999) / `GetFinesOnPendingVehicleForEmail` (21007) — owner email push.
- `UpdateLastFineEmailDetailsByPlate` (21063).

**Export:**
- `ExportToExcel` (20687).
- `ExportToExcelView` (20695).
- `ExportToCsvCustom` (20943).

### 3.2 `trafficFine` — 11 endpoints (proxy lines 20495–20583)

- `GetTrafficFines` (20495), `GetTrafficFineForEdit` (20527), `GetMovementOnVehicle` (20535).
- `CreateOrUpdateTrafficFine` (20519).
- `DeleteTrafficFine` (20543).
- `ExportToExcel` (20551).
- `ChargeTrafficFine` (20559) / `ChargeTrafficFineNew` (20567) — version 1 + version 2 of "charge to customer".
- `CreateInvoiceFromTrafficFine` (20575).
- `ImportTrafficFines` (20583).
- `GetImageForShow` / `GetImageForEmail` (20503, 20511).

### 3.3 Other fine services
- `fineEmail` — 4 endpoints: EmailFine, EmailBlackPointsFine, IdBlockFineReportAlert2, IdBlockFineReportAlert3 (Driver licence-block warnings).
- `fineSMS` — 2 endpoints: SendFineSMS, SendFineWhatsAppSMS.
- `fineEmailAlert` — 2 endpoints: SendAlertForFineAmountGreaterThanAlert, SendAlertForNoOfFinesOnVehicleMoreThanLimit.
- `fineMonthEndPosting` — 1 endpoint: PostFinesMonthEnd.
- `finesDataSharing` — 3 endpoints: GetFines, GetFines2, UpdateSharedStatus.
- `generateFineBill` — 2 endpoints: GenerateBills, DeleteBillsInBulk.

---

## 4. Filter envelope (`GetFinesReport` request)

Captured from `fine/GetFinesReport-request.json` (27 fields):

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

This is the canonical filter shape Vesla must support to claim parity.

---

## 5. Business Rules

| ID | Rule | Source |
|----|------|--------|
| R-001 | Fine attribution = `(vehicleId, fineDateTime ∈ movement window)`. Speed walks `vehicleId` movements until the active one at violation time is found. | bundle (UaeFineAppService.GetFinesReport line 1082 in C# stack); confirmed by `movementId, agreementNo, agreementCustomerName` co-presence in fines-list.json. |
| R-002 | Customer surcharge applied per `movementContact.fineSurcharge` (FIXED) or `fineSurchargeType=PERCENTAGE`. Lease variant `fineSurchargeLease` overrides for lease invoicing rule. | fines-list.json fields. |
| R-003 | Acknowledgment fee (`acknowledgment`) is a separate line — added to `amountWithSurcharge` for invoice but NOT subject to customer surcharge. | fines-list.json: `amount=600, surcharge=30, amountWithSurcharge=650, acknowledgment=20`. Sum: 600+30+20=650. So acknowledgment IS in amountWithSurcharge but NOT surcharged. |
| R-004 | Late fees (`lateCharges`) accrue government-side after RTA-defined due date. Speed reflects them; never auto-imposes. | fines-list.json: `lateCharges=0` typical (RTA pre-due-date). |
| R-005 | Confiscation charges (`confiscationCharges`) are vehicle-impound fees; downloaded separately via `DownloadConfisactionChargesFromDubaiPolice`. | bundle 21023. |
| R-006 | Black points (`blackPoints`) trigger `EmailBlackPointsFine` notification. Driver licence may be blocked at 24+ points (UAE policy). | bundle 20279; also `IdBlockFineReportAlert*`. |
| R-007 | "isAddedManually" fines bypass RTA reconciliation (`GetFineReconciliation` skips them). | bundle 20783. |
| R-008 | Ignore flag (`ignored=true`) excludes fine from invoice generation but keeps in reports (`enableIgnored` filter shows them). | bundle 20663, 20671 + filter envelope. |
| R-009 | Customer surcharge VAT — VAT applies to surcharge amount (not base fine). E.g. surcharge 30 × 5% VAT = 1.5 → `invoiceDueAmount = amountWithSurcharge + 1.5 = 651.5`. | fines-list.json arithmetic. |
| R-010 | One invoice per fine OR merge multiple fines per customer on one invoice — controlled by `invoicingRule` on customer (3 = merge, others = per-fine). | fines-list.json `invoicingRule:3` on Avgerios + Laura customers. |
| R-011 | `movementContact` is denormalized at fine-creation time; no live JOIN. Subsequent customer profile edits don't propagate to historical fines. | shape of fines-list.json. |
| R-012 | Per-server (Dubai/AUH) processing pipelines — `server` field disambiguates. AUH has its own `UpdateFineNosForUpdateFineTimeAUH`. | bundle 20919, 20951, 20967. |
| R-013 | RTA-side amount changes are detected by `GetMissingFinesWithAmountChanges` and surfaced for operator approval before re-billing. | bundle 21071. |
| R-014 | `MarkFinesPaidByTFID` allows bulk-marking when government acknowledges payment for an entire traffic file at once. | bundle 20975. |
| R-015 | `EmailFines` and `WhatsAppProcessFines` are tied to customer's `emailInvoices` flag (R-013-style audit needed). | bundle 20791, 21095. |
| R-016 | Inter-tenant data sharing: `finesDataSharing/UpdateSharedStatus` flips `sharingStatus` so parent companies aggregating subsidiary fines don't re-process. | bundle 22343. |
| R-017 | Traffic file resolution per plate: `GetTrafficFilesOnPlateNo`. Multiple traffic files per plate possible (re-registration). | bundle 20815. |
| R-018 | "Try" / "Confiscation" downloads can be retried via dedicated debug endpoint `TestDescriptionDownloading`. | bundle 21079. |

---

## 6. Three Tests Applied

### Feature: Per-server (Dubai/AUH) processing
- **Value:** YES — different RTA APIs, different update cadences, different fee schedules.
- **Understand:** YES.
- **Risk:** Removing = AUH-specific endpoints break.
- **Decision:** PRESERVE. Vesla `tars_fines.fineSourceCode` already encodes this; map to Speed `server`.

### Feature: Embedded `movementContact` snapshot
- **Value:** YES — historical accuracy + report perf.
- **Understand:** YES — accept staleness.
- **Risk:** Removing = JOIN cost on every report; loses historical "what address did we charge at the time" audit.
- **Decision:** PRESERVE. Vesla `tars_fines.rawData` (Json) already mirrors this; codify the snapshot pattern.

### Feature: 62 endpoints in `uaeFine`
- **Value:** PARTIAL — many are one-off operational fixes (UpdateDuabiFinesDescription, AUH-only time fix).
- **Understand:** PARTIAL — these were likely written to fix data-quality issues from RTA portal scrapers.
- **Risk:** Removing = if Vesla's portal scrapers have the same issues, we'll need them.
- **Decision:** PRESERVE the patterns; build them only when our scrapers exhibit the same data drift.

### Feature: Customer surcharge VAT (5% on surcharge only)
- **Value:** YES — UAE FTA rule (fines themselves are VAT-exempt; admin fees are not).
- **Understand:** YES — already preserved in Vesla `tars-billing.service.ts:104`.
- **Risk:** Removing = wrong invoice totals.
- **Decision:** PRESERVE — DO NOT VAT base fine.

### Feature: Inter-tenant data sharing (`finesDataSharing`)
- **Value:** UNCERTAIN — applies to multi-subsidiary holding companies; Vesla's tenant model is per-company.
- **Understand:** PARTIAL — could be a Speed-only feature for legacy holding-co customers.
- **Risk:** Low — Vesla has no equivalent customer base.
- **Decision:** ⚠ FLAG — `Uncertain-Value Features` below.

### Feature: WhatsApp processing
- **Value:** YES — UAE customers prefer WhatsApp over email.
- **Understand:** YES.
- **Risk:** Removing = customer notification gap.
- **Decision:** PRESERVE — Vesla `notificationTrigger.fineInvoiced` exists; needs WhatsApp channel.

---

## 7. ⚠ Uncertain-Value Features

1. **`finesDataSharing` service** — see §6 last item. Decide by: customer survey of Vesla tenants.
2. **`SaveFinesInBulkBackUp`** — duplicate of `SaveFinesInBulk` with different schema? Decide by: bundle decomp.
3. **`ChargeTrafficFine` vs `ChargeTrafficFineNew`** — v1/v2 coexistence. Decide by: which the UI calls.
4. **`customValueField1` / `customValueField2`** — tenant-extensible decimal columns. Use unknown.
5. **`UpdateDuabiFinesDescription`** [SIC: typo "Duabi"] — Dubai-specific batch updater. Decide by: data-quality root-cause.
6. **`GetFinesReportForReport` vs `GetFinesReportForReportView`** — view vs report? Likely uigrid view-state.
7. **`ExternalVehicleFinesReport2`** — version 2 alongside v1. Decide by: which UI calls.
8. **`GetOmanFinesDatesToCheckPaymentDetails`** — Oman-only path; Vesla doesn't operate Oman. Decide by: business decision (don't build).
9. **`generateFineBill` standalone service** — overlap with `uaeFine.GetFinesDueToBills`? Decide by: bundle UI search.

---

## 8. Proposed Improvements (Vesla deviations)

| Speed | Vesla improvement | Reason |
|---|---|---|
| 62-endpoint sprawl in one service | Three-layer split: `tars-fines-pull.service`, `tars-fines-attribute.service`, `tars-fines-billing.service` (already present) | Maintainability. |
| Two charge variants (`ChargeTrafficFine`, `ChargeTrafficFineNew`) | Single canonical `chargeFineToCustomer` | Simpler. |
| `customValueField1/2` decimal extensions | Use `rawData` jsonb (Vesla pattern) | More flexible. |
| `MarkFinesPaidByTFID` bulk-mark | Combine with `GetFineReconciliation` to auto-reconcile | Less manual. |
| `finesDataSharing` (multi-tenant aggregation) | NOT BUILT (per Three Tests) | Not in scope until customer requests. |
| AUH-specific timestamp fix endpoints | Fix in worker pull layer (one place) | DRY. |
| Inline VAT calc (per-fine) | Centralized via `tars-charge-config.vatRate` (already present) | Already done. |
| Ignored vs UnIgnored toggles | Single `setIgnored(bool)` action | Simpler. |

---

## 9. Vesla Code Cross-Reference

| Speed surface | Vesla equivalent |
|---|---|
| `uaeFine.GetFines*` | `backend/src/services/tars-fines.service.ts:listFines` |
| `uaeFine.GetFinesByAgreementId` | `backend/src/services/tars-fines.service.ts:getFinesByContract` |
| `uaeFine.GetFinesReport` | NOT YET — needs `tars-fines-report.service.ts` (card C2). |
| `uaeFine.ProcessFines` | `backend/src/services/tars-match.service.ts:matchUnmatchedFines` + `tars-billing.service.ts:invoiceFine` (split). |
| `uaeFine.IgnoreFine` / `UnIgnoreFine` | NOT YET — needs `setIgnored` in tars-fines.service. |
| `uaeFine.GetFiltersData` | NOT YET — needs filter-source endpoint. |
| `uaeFine.GetMissingFines` | NOT YET — needs `tars-fines-reconcile.service.ts` (card C2). |
| `uaeFine.MarkFinesPaidByTFID` | NOT YET — needs bulk-mark endpoint. |
| `uaeFine.EmailFines` / `WhatsApp*` | `notificationTrigger.fineInvoiced` (single-fine) — needs bulk variant. |
| `uaeFine.ExportToExcel` | NOT YET — Vesla uses `xlsx-template-007` pattern. |
| `trafficFine.*` | partial via `tars-fines.service.ts` for manual entry; gap on Workshop fines. |
| `fineReceipts.*` | covered by separate `fine-receipts` spec module. |
| `fineMonthEndPosting.PostFinesMonthEnd` | `runBillingForCompany` + `createGovernmentBill` (different cadence — Vesla is daily, Speed is monthly). |
| `finesDataSharing.*` | NOT BUILT — see Three Tests + Improvements §8. |
| `generateFineBill.*` | overlapping with Vesla `createGovernmentBill`. |

---

## 10. Open Questions

- Q1: How does Speed correlate Dubai Police downloads to AUH DoT downloads when the same customer drives in both emirates? (server field implies separate buckets; cross-emirate trip needs spec.)
- Q2: `GetMissingFines` algorithm — does Speed compare RTA-side count vs local count by date+plate? Bundle decomp needed.
- Q3: Black-points threshold for ID-block alert — UAE policy is 24 points; is this hard-coded?
- Q4: `acknowledgment` fee semantics — RTA-issued for fine receipt itself? Or surcharge?
- Q5: `customField1..4` (string) AND `customValueField1..2` (decimal) on customer + on fine — which is which?
