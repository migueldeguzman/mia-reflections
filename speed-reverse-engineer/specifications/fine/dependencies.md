# fine — Dependencies

> Speed-internal + external. Vesla code refs at end.

---

## Speed-internal upstream (fine consumes data from)

- **vehicle** — `vehicleId`, `plateNo`, `plateInfo`, `customPlateNo`, `trafficFileId`. Drives attribution + per-vehicle reports.
- **movement** — `movementId` + window. Drives `(vehicleId, fineDateTime ∈ movement window)` attribution rule (R-001).
- **agreement** — `agreementNo`, `agreementCustomerName`, `movementStaffName` (denormalized).
- **customer** (person/company) — `movementContact` snapshot (100+ fields). Surcharge config (`fineSurcharge`, `fineSurchargeType`, lease variants), invoicing rule, VAT rule, blacklist, credit period, sales person.
- **trafficFile** — RTA traffic file binding per vehicle/plate. Determines API credentials for fine pull.
- **administration / TARS settings** — RTA portal credentials.
- **directory** — sales person + customer lookup.

## Speed-internal downstream (fine feeds)

- **invoice** — generated via `generateFineInvoices` / `ProcessFines`. Charge type id `8` (Fines), `34` (FinesSurcharge) per movement-charge bridge.
- **debit JV** — month-end posting via `fineMonthEndPosting/PostFinesMonthEnd`.
- **bill** (supplier AP) — generated via `generateFineBill/GenerateBills` for government payment.
- **fineReceipts** — proof of payment to government (separate spec module).
- **journal / GL** — both customer-side AR and supplier-side AP feed GL.
- **fineEmail / fineSMS / WhatsApp** — customer notifications.
- **fineEmailAlert** — internal staff alerts (high-value, count-per-vehicle).
- **finesDataSharing** — inter-tenant aggregation (multi-subsidiary holding cos).
- **TMS** — third-party traffic-management export (`GetFinesForTMS`).

---

## External systems

| System | Direction | Purpose |
|---|---|---|
| **UAE RTA Dubai Police portal** | inbound | Pull fines via `SaveFinesInBulk`. |
| **AUH Department of Transportation portal** | inbound | Pull fines (separate API surface). |
| **Dubai Police Confiscation portal** | inbound | `DownloadConfisactionChargesFromDubaiPolice`. |
| **Oman expansion portal** | inbound | `GetOmanFinesDatesToCheckPaymentDetails`. |
| **TARS API** | bidirectional | Per-vehicle traffic file resolution + posting. |
| **UAE Pass** | inbound | OAuth tokens (`GetUaePasses`) for portal auth. |
| **WhatsApp Business** | outbound | Customer notifications. |
| **SMTP / SMS gateway** | outbound | Customer + staff alerts. |
| **TMS (third-party)** | outbound | Fleet-fines export. |

---

## Build order (Speed reconstruction)

1. RTA portal credentials per traffic file.
2. `fines` table + `traffic_fines` (manual) + `fine_logs` (audit).
3. Portal pull (`SaveFinesInBulk`).
4. Attribution engine (`ProcessFines`).
5. Surcharge + acknowledgment + late-fee computation.
6. Invoice generation (`CreateInvoiceFromTrafficFine`).
7. Government bill generation (`generateFineBill`).
8. Customer notifications (email + SMS + WhatsApp).
9. Reconciliation (`GetFineReconciliation`).
10. Reports + exports (`GetFinesReport`, `ExportToExcel`).
11. Black-points alerts + ID-block.
12. Inter-tenant data sharing (optional).

---

## Vesla code dependencies (secondary)

`backend/src/services/`:
- `tars-fines.service.ts` (661L) — primary list/sync/per-customer reads.
- `tars-match.service.ts` (127L) — auto-attribution (replaces Speed `ProcessFines` matching half).
- `tars-billing.service.ts` (545L) — invoice + government bill (replaces `ProcessFines` invoicing half + `generateFineBill`).
- `tars-period-billing.service.ts` (323L) — period-aligned variant for tolls (not used for fines — fines are same-day).
- `tars-charge-config.service.ts` (90L) — VAT + admin fee + late-fee config.
- `notification-trigger.service.ts:fineInvoiced` — customer email/WhatsApp.
- `finance/ar-wiring.service.ts` — GL voucher.

`backend/src/controllers/`:
- `tars-fines.controller.ts` — list, sync, summary, per-customer.

`backend/src/routes/`:
- `tars-fines.routes.ts`.

Worker:
- `vesla-tars-fines-worker` (port 3030/3031) — RTA pull (replaces Dubai Police + AUH DoT manual portal pulls).

Charge type ids (per `MEMORY.md` + chart-of-accounts):
- `8` = Fines (customer-side AR).
- `34` = FinesSurcharge (revenue).

---

## Vesla → Speed mapping

| Vesla file | Plays role of (Speed) |
|---|---|
| `tars-fines.service.ts:listFines` | `uaeFine.GetFines` |
| `tars-fines.service.ts:incrementalSync` (worker) | `uaeFine.SaveFinesInBulk` |
| `tars-match.service.ts:matchUnmatchedFines` | `uaeFine.ProcessFines` (attribution half) |
| `tars-billing.service.ts:invoiceFine` | `uaeFine.ProcessFines` (invoicing half) + `trafficFine.CreateInvoiceFromTrafficFine` |
| `tars-billing.service.ts:createGovernmentBill` | `generateFineBill.GenerateBills` |
| `notification-trigger.fineInvoiced` | `fineEmail.EmailFine` + `fineSMS.SendFineWhatsAppSMS` |
| `tars-rta-payments.service.ts` | `fineReceipts.SaveReceiptRTA` (separate spec module) |
| EOD daily run | EOM Speed `fineMonthEndPosting.PostFinesMonthEnd` (cadence deviation noted) |

---

## Build-order implications for Vesla parity

1. **Worker collection completeness** (card B1) — every Speed `fines` field must land in `tars_fines` / `darb_fines` / `parkin_fines`.
2. **Schema enrichment** (separate isolated migration card per schema.md gap analysis) — confiscation, acknowledgment, lateCharges, blackPoints, GPS, ignored.
3. **Manual fine entry path** (mirrors `trafficFine.CreateOrUpdateTrafficFine`) — Vesla currently has no manual-fine UX.
4. **Reports parity** (cards C1, C2) — `GetFinesReport`, `GetFiltersData`, `GetMissingFines`, `GetFineReconciliation`, `ExportToExcel`.
5. **Reconciliation engine** (card C2) — three-way match invoice ↔ debit JV ↔ government receipt.
6. **WhatsApp channel** (follow-up card) — Vesla `notificationTrigger` lacks WhatsApp adapter.
7. **Black-points + ID-block alerts** (follow-up card) — Vesla doesn't track demerit points.
8. **EOM JV posting** (follow-up card) — Vesla bills daily; Speed posts monthly. Decide cadence with finance team.
