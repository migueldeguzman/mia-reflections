# tars — Behavior Specification

> **Doctrine:** See `DOCTRINE.md`. Three Tests applied to every preserved feature below. All Speed-side facts cite source (bundle line / probe / proxy line). Vesla-side facts cite `web-erp-app/backend/...` paths.

**Module:** `tars` *(Vesla natives: `tars_credentials`, `tars_customers`, `tars_vehicles`, `tars_contracts`, `tars_attachment_cache`, `vehicle_tars_registrations`; Vesla mirror: `spd_tars_postings`)*

**Speed services** (`AbpServiceProxies-jquery.js`):
- `abp.services.app.tarsPosting` — proxy lines 3–67. 8 endpoints.
- `abp.services.app.tarsPostingStatus` — proxy lines 18891–18923. 4 endpoints.
- `abp.services.app.tarsSetting` — proxy lines 18931–18955. 3 endpoints.
- `abp.services.app.azureJobForTars` — proxy lines 18867–18883. 2 endpoints (Azure Function bridge).
- `abp.services.app.tenantSettings` — proxy lines 24109–24123. 2 TARS-scoped endpoints.

**Probes:** `tars/tars-posting.json`, `tars/tars-postings.json` (both null/empty — empty-probe handling per DOCTRINE; bundle becomes primary source).

**External dependencies:**
- UAE RTA TARS API (per-tenant credentials, per-vehicle traffic file).
- Azure Function bridge: `https://speedserviceapp.azurewebsites.net/api/UpdatePosting` (bundle line 219071) — Speed's hosted poller that pulls TARS-side state and writes it back.

---

## 1. Purpose

TARS = **UAE RTA Transport Authority Registration System**. Mandatory for every rental contract operating in UAE. Registration enables:
- Driver/customer tracking on government rolls.
- Automatic fine attribution (RTA links the fine to the registered driver-of-record).
- Lifecycle event reporting (open/modify/replace/close + NRM + workshop) so the registry stays current.
- Regulatory compliance — non-registration is a fineable offence to the rental company itself.

Speed posts agreement and movement events asynchronously, persists the queued/posted state in `tars_postings`, and offers a UI to view, retry, ignore, and manually close postings.

---

## 2. Primary Entities

### 2.1 TARS Posting *(Vesla mirror: `spd_tars_postings` — schema.prisma:21730)*
Represents one queued or completed registration event for one (agreement, operation, attempt) tuple. Identifying tuple in Speed grid: `(speedOperation, tarsOperation, tarsBatchId, tarsPostingId)` (bundle line 219123–219128).

Observed Speed fields (bundle viewModal columns + retry payloads):
- `id` (= `tarsPostingId`)
- `agreementId`
- `agreementNo`, `movementNo`, `movementDateTime`
- `speedOperation` (int, see §4.1)
- `tarsOperation` (int, see §4.2)
- `tarsBatchId`
- `status` (int, see §4.3)
- `error` (string), `errorType` (int, see §4.4)
- `noOfTries`
- `documents[]` (TARS attachments — guid, name, url; bundle line 219453, 219505)

### 2.2 TARS Setting *(no Vesla equivalent yet — Vesla uses `tars_credentials` + per-tenant config columns)*
Per-tenant configuration (bundle lines 218581–218684):
- `configuration.trafficFileCredentials[]` — array of `{ trafficFileId, clientId, clientSecret, agencyDid }` (bundle line 218616–218621). One credential set per traffic file (per fleet vehicle group) — Speed allows multiple credentials per tenant because RTA issues credentials per traffic file owner.
- `configuration.ignoredTrafficFileIds[]` — opt-out list.
- `customersToIgnore[]` — directory ids of customers to skip TARS posting for (e.g. tax-exempt diplomatic plates).
- `contactGroupId` (numeric) — directory contact group of TARS notification recipients.
- `dataToShare` — bitmask, default `6` per save logic (bundle line 218674).
- `sharingFormat` — int, default `0`.
- `isActive` — int (1=on), set on save (bundle line 218676).

### 2.3 Vesla-native TARS contract / customer / vehicle linkage
- `tars_contracts` (schema.prisma:13272) — Vesla rental contract ↔ TARS contract DID linkage.
- `tars_customers` (schema.prisma:13183) — customer ↔ TARS customer DID linkage.
- `tars_vehicles` (schema.prisma:13222) — fleet vehicle ↔ TARS vehicle DID linkage.
- `tars_credentials` (schema.prisma:12952) — encrypted per-tenant TARS API credentials (Vesla equivalent of Speed's `trafficFileCredentials` array).
- `vehicle_tars_registrations` (schema.prisma:16890) — per-vehicle registration audit history.
- `tars_attachment_cache` (schema.prisma:13321) — local cache of TARS attachments before upload.

### 2.4 Traffic File *(observed Speed entity)*
Bundle line 218949–218954: `tarsSetting.getTrafficFiles()` returns the catalogue of UAE traffic files (one per RTA-registered fleet owner). Speed uses these to bind credentials.

---

## 3. Operations

All ABP service methods cited from `_scripts/AbpServiceProxies-jquery.js`. See §6 (`api.md`) for full payload shapes.

### 3.1 `tarsPosting` (8 endpoints)
1. `createOrUpdateAgreementInputForTars` — proxy line 5. Build the TARS payload from a Speed agreement; idempotent.
2. `postAgreementToTars` — proxy line 13. Submit a built payload to RTA.
3. `updateTarsPostingStatus` — proxy line 21. Refresh status (no body — server uses session).
4. `createCloseAgreementInputForTars` — proxy line 29. Build close payload.
5. `closeAgreementForTars` — proxy line 37. Submit close.
6. `createReplacementAgreementInputForTars` — proxy line 45. Build replacement (used when a vehicle is swapped mid-rental).
7. `postReplacementAgreementForTars` — proxy line 53. Submit replacement.
8. `sendTarPostingEmail` — proxy line 61. Email a TARS posting (e.g. failure notification to ops, signed-agreement-needed reminder to driver).

### 3.2 `tarsPostingStatus` (4 endpoints)
1. `getTarsPostingStatus` — proxy line 18893. Paged grid feed for the posting-status page (bundle line 219235).
2. `getTarsPostingForView` — proxy line 18901. Single posting detail (bundle line 219525).
3. `saveDocuments` — proxy line 18909. Attach signed-agreement / driver-document images to a posting (bundle line 219501).
4. `saveTarsPostingIgnoreReason` — proxy line 18917. Mark posting as Ignored with reason text (bundle line 219276).

### 3.3 `tarsSetting` (3 endpoints)
1. `updateAllSettings` — proxy line 18933. Persist `vm.settings` envelope including `configuration.trafficFileCredentials[]` (bundle line 218678).
2. `getTarsSettings` — proxy line 18941. Load `vm.settings` (bundle line 218641).
3. `getTrafficFiles` — proxy line 18949. Catalogue of UAE traffic files for the dropdown (bundle line 218588).

### 3.4 `tenantSettings` (2 TARS-scoped endpoints)
1. `getTarsSetting` — proxy line 24109. Loads the per-tenant TARS toggle envelope including `customersToIgnore`, `contactGroupId` (bundle line 218687–218701).
2. `updateTarsSetting` — proxy line 24117. Companion writer (bundle line 218673).

### 3.5 `azureJobForTars` (Azure Function bridge — 2 endpoints)
1. `updateTarsPostingStatuses` — proxy line 18869. Bulk poll RTA for queued posting statuses; called from the Azure-side worker.
2. `getTarsPostingsForAzureJob` — proxy line 18877. Returns the queue Azure should process.

> ⚠ **Authoritative external poll URL:** `https://speedserviceapp.azurewebsites.net/api/UpdatePosting?code=Js4wsXSqX6KLsIH0GdnpLXlVcs7Glhall2wD0q4/mmScYRIyTVtWAA==&id=<id>&tenantId=<tenantId>` (bundle line 219071, 219082). Speed offloads the long-running TARS poll to an Azure Function with a hard-coded code key. Vesla replacement = `vesla-tars-fines-worker` + bidirectional poll — secret must NOT be reproduced; rotate at migration.

---

## 4. Enums

### 4.1 SpeedOperation (movement classification, 1–13)
Bundle lines 218776–218790:
| id | name |
|----|------|
| 1 | Rental Agreement Opening |
| 2 | Rental Agreement Editing |
| 3 | Rental Agreement CutShort |
| 4 | Replacement |
| 5 | Rental Agreement Closing |
| 6 | Lease Agreement Opening |
| 7 | Lease Agreement Editing |
| 8 | Lease Agreement Closing |
| 9 | NRM Opening |
| 10 | NRM Editing |
| 11 | NRM Closing |
| 12 | Workshop Opening |
| 13 | Workshop Closing |

### 4.2 TarsOperation (RTA-side API event, 1–8)
Bundle lines 218821–218830:
| id | name |
|----|------|
| 1 | Agreement Opening |
| 2 | Agreement Modification |
| 3 | Replacement |
| 4 | Agreement Closing |
| 5 | NRM Opening |
| 6 | NRM Closing |
| 7 | Workshop Opening |
| 8 | Workshop Closing |

Note: Speed has 13 operations; TARS has 8. Many-to-one mapping handled in retry dispatcher (bundle line 219106–219119: only `(1→1)`, `(2→2)`, `(5→4)`, `(4→3)` are wired for retry — Lease + NRM + Workshop retry not implemented in the UI).

### 4.3 Posting Status (0–8)
Bundle lines 218753–218774:
| id | name | semantics |
|----|------|-----------|
| 0 | Pending | Created locally, awaiting Azure pickup. |
| 1 | Queued | Sent to Azure / TARS API queue. |
| 2 | Picked | Azure worker has picked up the item. |
| 3 | Wait | TARS-side processing, response not in. |
| 4 | Error | TARS or RTA returned an error response. |
| 5 | Success | TARS returned 2xx, posting confirmed. |
| 6 | Expired | RTA-side validity expired (e.g. movement >24h old at submission). |
| 7 | Ignored | Manually ignored by operator with reason. |
| 8 | Grace Period Expired | Movement is older than 3h and was never submitted. |

Default filter = `[0,4,6,8]` ("needs attention" set), bundle line 218845.

### 4.4 Error Type (1–4)
Bundle lines 219421–219430:
| id | name | meaning |
|----|------|---------|
| 1 | Validation Error | Payload rejected (driver attachments missing, address.emirate empty, etc.). |
| 2 | Temporary Issue | Network/service blip — auto-retry safe. |
| 3 | Authentication Error | Credentials invalid/expired — operator must fix `trafficFileCredentials`. |
| 4 | TARS Error | RTA-side server error or business rule rejection. |

---

## 5. Business Rules

| ID | Rule | Source |
|----|------|--------|
| R-001 | Every rental, lease, NRM, and workshop movement that affects a TARS-registered vehicle MUST emit a TARS posting. | Bundle 218776–218790 (operation enum exists for all of them). |
| R-002 | TARS failure does NOT block the originating Speed operation. | Async via Azure queue (bundle 219071). |
| R-003 | Posting retry is permission-gated: `Page.TARS.TARSPostingStatus.Retry`. | Bundle 218862–218864. |
| R-004 | A posting older than 3 hours requires an extra confirm before retry ("TarsGracePeriodExpired"). | Bundle 219065–219077. |
| R-005 | Failed retry classifications by `errorType`: only Validation (1) + Auth (3) + TARS (4) flow into the retry dispatcher; Temporary (2) is auto-retried by Azure poller. | Bundle 218911 (commented but documents intent) + 219106–219119. |
| R-006 | Customers in `tarsSetting.customersToIgnore[]` are skipped from posting entirely. | Bundle 218603–218609 + 218695. |
| R-007 | Traffic files in `configuration.ignoredTrafficFileIds[]` are excluded from posting. | Bundle 218595–218601. |
| R-008 | Per-vehicle credential resolution = look up the vehicle's traffic file → resolve credential row in `trafficFileCredentials[]`. Missing credential → posting fails with "No trafic file credentials found for selected vehicle". | Bundle 218616–218621 + 219487–219495 (help text). |
| R-009 | Manually-ignored postings (status=7) require a free-text reason persisted via `saveTarsPostingIgnoreReason`. | Bundle 219272–219277. |
| R-010 | TARS posting documents (signed agreement, driving licence, national ID, passport) are uploaded via `saveDocuments` and stored as `{ name, guid, url, urlWithToken }`. Required when error is "Pending for attachment" / "Pending for Replacement's Attachment". | Bundle 219453–219505 + help text 219470–219486. |
| R-011 | "Try Posting" calls the Azure Function `/api/UpdatePosting?id=X&tenantId=Y` directly — bypasses ABP, used as last-ditch when Azure poller has stalled. | Bundle 219071, 219082. |
| R-012 | `vm.settings.dataToShare = 6`, `sharingFormat = 0`, `isActive = 1` are hard-coded on every save (TARS-only data sharing mode, no alternate flow exposed). | Bundle 218674–218676. |
| R-013 | `getTarsSettings` enriches `configuration.ignoredTrafficFileIds` into `ignoredTrafficFilesArray` for ng-select binding — empty IDs default to `[]`. | Bundle 218643–218657. |

---

## 6. Three Tests Applied

### Feature: 8-step status enum (Pending/Queued/Picked/Wait/Error/Success/Expired/Ignored/Grace Period Expired)
- **Value:** YES — staff use the status filter daily to triage failures.
- **Understand:** PARTIAL — Queued/Picked/Wait are Azure-poller internals; Vesla can collapse to Pending unless staff need to see Azure progress.
- **Risk:** Removing Wait/Picked = staff can't tell if Azure is alive. PRESERVE.
- **Decision:** Specify all 9 states. Vesla mirror columns must record each.

### Feature: 3-hour grace period before manual retry
- **Value:** YES — RTA expires postings after a window; trying a stale posting wastes auth tokens.
- **Understand:** YES — RTA business rule (movement must be reported within ~24h, but Speed's UI threshold is 3h to encourage timely action).
- **Risk:** Removing = increased Auth-error counts. PRESERVE.
- **Decision:** Specify the 3h threshold + confirm-prompt UX.

### Feature: Azure Function poll bridge (`speedserviceapp.azurewebsites.net`)
- **Value:** YES — the bridge is *how* TARS state is observed; without it, Speed never knows when RTA changes a posting from Queued→Success.
- **Understand:** YES — async pattern, RTA does not callback.
- **Risk:** Removing = postings stuck in Queued/Picked/Wait forever.
- **Decision:** Vesla replaces with `vesla-tars-fines-worker` cron poll. Specify the poll cadence + payload shape. Do NOT carry the Azure secret.

### Feature: Customers-to-ignore list
- **Value:** YES — diplomatic plates, government-owned cars, and certain B2B contracts contractually opt out of RTA reporting.
- **Understand:** YES.
- **Risk:** Removing = posting attempts produce noise + may violate exempt agreements. PRESERVE.

### Feature: Lease + NRM + Workshop retry NOT wired in UI
- **Value:** UNCERTAIN — bundle dispatcher (line 219106–219119) only handles 4 operation pairs.
- **Understand:** UNCERTAIN — could be (a) Speed bug, (b) those events never fail in practice, or (c) those events don't need TARS update.
- **Risk:** Removing = lose retry for failures we don't yet observe.
- **Decision:** ⚠ FLAG — `Uncertain-Value Features` below. Vesla should wire retry for ALL 13 SpeedOperation × TARS Operation pairs to be safe.

---

## 7. ⚠ Uncertain-Value Features (flag, never drop)

1. **`vm.settings.dataToShare = 6`** — Bitmask hard-coded. Speed UI exposes no alternate. Best guess: bitmask of `{ vehicle, driver, contract, fines }` flags. *Decide by:* probing TARS API docs or asking RTA integrator.
2. **`sharingFormat = 0`** — Likely "JSON" vs hypothetical "XML". *Decide by:* same source.
3. **Lease/NRM/Workshop retry gap** — see §6 last item.
4. **Azure Function code key shared across all tenants** — Bundle 219071 has a fixed `?code=Js4w...` key. *Decide by:* Vesla must NOT replicate; design own per-tenant token.
5. **`updateTarsPostingStatus()` (no body)** — Endpoint exists but bundle search shows no caller. May be a server-pulled refresh used by some other view. *Decide by:* network-trace probe of the legacy UI.
6. **`sendTarPostingEmail`** — Endpoint exists; no UI caller in current bundle search. May be invoked by server-side workflows. *Decide by:* App-bundle deeper grep + AbpUserNotifications.
7. **Permission `Page.TARS.TARSPostingStatus.View`** vs **CRS menu `CRS.TarsPostingStatus.Tenant`** (bundle line 4209) — two permission strings reference the same screen. May be a Speed legacy-rename artifact. *Decide by:* tenant-permissions.json export.

---

## 8. Proposed Improvements (Vesla deviations from Speed)

| Speed | Vesla improvement | Reason |
|-------|-------------------|--------|
| Hard-coded Azure Function with shared secret | Per-tenant credentialed worker (`vesla-tars-fines-worker`) | Security; tenant isolation. |
| `dataToShare` magic number `6` | Explicit columns on `tars_credentials` (`shareVehicles`, `shareDrivers`, `shareContracts`, `shareFines`) | Auditability + per-tenant control. |
| Status enum stored as int | Same int + a `tars_status_label` view in DB | Reports remain Speed-compatible while UI gets readable strings. |
| Retry dispatcher hard-coded for 4 operation pairs | Universal retry dispatcher keyed on `(speedOperation, tarsOperation)` lookup table | Closes the Lease/NRM/Workshop gap (R-013 uncertainty). |
| Posting documents stored as `{guid,url}` only | Add `tars_attachment_cache` (already exists, line 13321) for local copy | Survive RTA-side blob expiry. |

---

## 9. Vesla Code Cross-Reference

| Speed surface | Vesla equivalent |
|---|---|
| `tarsPosting.*` ABP service | `backend/src/services/tars-api.service.ts` (HTTP client) + `tars-contract.service.ts` (orchestration) |
| `tarsPostingStatus.*` ABP service | `backend/src/services/tars-sync-progress.service.ts` + `controllers/tars-dashboard.controller.ts` |
| `tarsSetting.*` ABP service | `backend/src/services/tars-credentials.service.ts` + `controllers/tars-credentials.controller.ts` |
| `azureJobForTars.*` Azure bridge | `vesla-tars-fines-worker` cron job (5-min poll, bundle equivalent: bidirectional) |
| `tenantSettings` TARS extension | `tars_charge_config` (schema.prisma:13120) |
| `customersToIgnore` | NOT YET IMPLEMENTED in Vesla — add to `tars_credentials` or `tars_charge_config`. |
| `trafficFileCredentials[]` | `tars_credentials` (one row per traffic file per tenant) |
| `documents[]` on posting | `tars_attachment_cache` (schema.prisma:13321) |

---

## 10. Open Questions

- Q1: Lease/NRM/Workshop posting retry — does Vesla wire all 13 SpeedOperation pairs or only the 4 Speed wires?
- Q2: `dataToShare` bitmask — what does each bit map to?
- Q3: TARS-side fine pullback — does Speed rely on Azure poller for fines as well, or is `tars-fines` a separate API?
- Q4: TARS customer registration — is it a separate endpoint from contract registration, or a side-effect of `postAgreementToTars`?
- Q5: Azure Function rate limits — what is the per-tenant cap that drives Speed's queue depth?
