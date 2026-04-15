# tars — Dependencies

> Speed-internal + external system dependencies (primary). Vesla-side code dependencies (secondary, end of file).

---

## Speed-internal upstream (TARS posting consumes data from these)

- **agreement** — source of truth for `agreementId`, `agreementNo`, customer/vehicle/driver shape. `tarsPosting/CreateOrUpdateAgreementInputForTars` reads from agreement detail.
- **movement** — `movementNo` + `movementDateTime` are sourced from the originating movement record (rental / lease / NRM / workshop). The movement type maps to `speedOperation` (1–13).
- **customer** (person or company) — driver-of-record fields, address, attachments. Customer must NOT be in `tarsSetting.customersToIgnore[]` (R-006).
- **vehicle** — plate + chassis + traffic file binding. Drives credential resolution (R-008).
- **directory** — `customersToIgnore[]` and `contactGroupId` are stored as directory ids; resolved via `directoryService.searchByIds`.
- **administration / tenantSettings** — TARS toggle + customers-to-ignore configured here.
- **tarsSetting** (own service) — credentials per traffic file.

## Speed-internal downstream (TARS posting feeds these)

- **agreement** — TARS-generated reference number + last-success timestamp written back so the agreement detail page can show "Posted to TARS ✓".
- **azureJobForTars** — picks up Pending postings from this side; loops until terminal state.
- **CRS dashboard / posting-status grid** — read-only consumer of `tars_postings` for triage UX.
- **email** — `sendTarPostingEmail` notifies ops + driver on failures (no UI caller observed; server-side trigger ⚠).

---

## External systems

| System | Direction | Purpose |
|---|---|---|
| **UAE RTA TARS API** | outbound | Submit agreement open / modify / replace / close / NRM / workshop events. |
| **Azure Function** (`speedserviceapp.azurewebsites.net/api/UpdatePosting`) | outbound | Hosted poller that reconciles RTA-side state back into Speed. ⚠ shared secret in JS bundle. |
| **Speed file storage / CDN** | bidirectional | Document blobs (`documents[].url`). |
| **SMTP / notification provider** | outbound | Failure / signed-agreement-needed emails. |

---

## Build order (Speed-side reconstruction)

1. TARS credentials per tenant (per traffic file).
2. `tars_postings` table + the four enums (status, errorType, speedOperation, tarsOperation).
3. `tarsPosting/CreateOrUpdate...` payload builders (one per operation pair).
4. Azure Function bridge (`UpdateTarsPostingStatuses`).
5. `tarsPostingStatus` grid + view modal + retry/ignore actions.
6. `SaveDocuments` upload UX.
7. Failure alerting + email.
8. Customer-to-ignore + contact group config.

Speed orders these as a unit because the grid is unusable without the status enum, and retry is unusable without the payload builders.

---

## Vesla code dependencies (secondary)

`backend/src/services/`:
- `tars-api.service.ts` — RTA HTTP client (uploadContract, closeContract).
- `tars-api-client.ts` — token + retry layer.
- `tars-contract.service.ts` — orchestration (push from rentalContracts lifecycle).
- `tars-customer-pull.service.ts` — RTA → `tars_customers`.
- `tars-vehicle-pull.service.ts` — RTA → `tars_vehicles`.
- `tars-contract-pull.service.ts` — RTA → `tars_contracts`.
- `tars-credentials.service.ts` — encrypted credential CRUD.
- `tars-rta-payments.service.ts` — RTA-side payment notifications.
- `tars-sync-progress.service.ts` — sync run state.
- `tars-sync-triggers.service.ts` — manual + cron entry points.
- `tars-attachment-sync.service.ts` — pulls attachments into `tars_attachment_cache`.

`backend/src/controllers/`:
- `tars-dashboard.controller.ts` — Vesla equivalent of `tarsPostingStatus` grid.
- `tars-credentials.controller.ts` — settings UX.
- `tars-contracts.controller.ts` — contract-side actions.

`backend/src/routes/`:
- `tars-pull.routes.ts` — periodic pulls.
- `tars-credentials.routes.ts` — settings.
- `tars-dashboard.routes.ts` — status feed.
- `speed-tars-bridge.routes.ts` — Speed→Vesla bridge.

Worker:
- `vesla-tars-fines-worker` (port 3030/3031) — replaces Azure Function for fines+postings poll.

---

## Vesla → Speed mapping

| Vesla file | Plays role of (Speed) |
|---|---|
| `tars-contract.service.ts:uploadContract` | `tarsPosting/PostAgreementToTars` |
| `tars-contract.service.ts:closeContract` | `tarsPosting/CloseAgreementForTars` |
| `vesla-tars-fines-worker` cron | `azureJobForTars/UpdateTarsPostingStatuses` |
| `tars-dashboard.controller.ts` | `tarsPostingStatus/GetTarsPostingStatus` |
| `tars_credentials` table | `tarsSetting.configuration.trafficFileCredentials[]` |
| `tars_attachment_cache` | `tars_postings.documents[]` (better — local S3 cache) |

---

## Build-order implications for Vesla parity

1. **Schema parity first** (`tars_postings` native + `spd_tars_postings` enrichment per schema.md).
2. **Vesla worker for status poll** (replace Azure Function with `vesla-tars-fines-worker` extension).
3. **Vesla retry dispatcher** for ALL 13 SpeedOperation pairs (close the gap noted in behavior.md §6).
4. **Vesla equivalent UI** for grid + view modal + retry/ignore.
5. **`customersToIgnore` + `contactGroupId` config** wired into Vesla settings.
6. **Document upload** unification — Vesla already has `tars_attachment_cache`; just wire the upload UX.

This sequencing matches the kanban cards `tarspar-F1` (TARS posting back) and downstream.
