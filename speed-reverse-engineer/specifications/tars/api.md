# tars — API

> All requests POST + JSON body unless noted. Source: `_scripts/AbpServiceProxies-jquery.js`.

---

## `abp.services.app.tarsPosting` (proxy lines 3–67)

Base path: `/api/services/app/tarsPosting/`

### `CreateOrUpdateAgreementInputForTars` (proxy line 5)
- **Purpose:** Build the JSON payload that will be submitted to RTA TARS for an agreement-open / modify event. Idempotent — also used as the retry kick-off for `(speedOperation=1|2, tarsOperation=1|2)` (bundle line 219121–219136).
- **Request body:**
  ```jsonc
  {
    "agreementId": <int>,
    "speedOperation": <1|2|...|13>,
    "tarsOperation": <1|2|...|8>,
    "tarsBatchId": <guid|null>,
    "tarsPostingId": <guid|null> // present on retry, null on first build
  }
  ```
- **Response:** `{ isError: bool, errorMsg: string, ... }` (bundle line 219130).
- **Permission:** `Page.TARS.TARSPostingStatus.Retry` (when called from retry dispatcher).

### `PostAgreementToTars` (proxy line 13)
- **Purpose:** Submit the built payload to RTA. Server-side normally chained from `CreateOrUpdate...`.
- **Request body:** `{ agreementId, tarsPostingId, payload }` (inferred — exact shape needs network-trace probe, ⚠).

### `UpdateTarsPostingStatus` (proxy line 21)
- **Purpose:** Refresh status of all postings owned by the calling tenant (no body — server walks the tenant's pending list).
- **Request body:** `{}`.
- **No UI caller in current bundle.** ⚠ Uncertain — may be invoked by background flow.

### `CreateCloseAgreementInputForTars` (proxy line 29)
- **Purpose:** Build close payload. Retry path for `(speedOperation=5, tarsOperation=4)`.
- **Request body:** same shape as `CreateOrUpdateAgreementInputForTars` with `speedOperation=5, tarsOperation=4`.

### `CloseAgreementForTars` (proxy line 37)
- **Purpose:** Submit close payload.

### `CreateReplacementAgreementInputForTars` (proxy line 45)
- **Purpose:** Build replacement payload (vehicle swap mid-rental). Retry path for `(speedOperation=4, tarsOperation=3)`.

### `PostReplacementAgreementForTars` (proxy line 53)
- **Purpose:** Submit replacement.

### `SendTarPostingEmail` (proxy line 61)
- **Purpose:** Email a posting summary (intended audience: ops + driver). No UI caller in current bundle. ⚠ Uncertain.
- **Request body:** likely `{ tarsPostingId }`.

---

## `abp.services.app.tarsPostingStatus` (proxy lines 18891–18923)

Base path: `/api/services/app/tarsPostingStatus/`

### `GetTarsPostingStatus` (proxy line 18893)
- **Purpose:** Paged grid feed for the posting-status page.
- **Request body (`vm.filters`, bundle line 218834–218852):**
  ```jsonc
  {
    "enableDateRange": false,
    "agreementNo": null,
    "statuses": [0, 4, 6, 8],     // default = needs-attention set
    "speedOperation": "",
    "tarsOperation": "",
    "startDate": null,             // ISO UTC if enableDateRange=true
    "endDate": null,
    "skipCount": 0,
    "maxResultCount": <int>,        // pageSize (default from app.consts.grid)
    "sorting": "refNo desc"
  }
  ```
- **Response:** `{ totalCount, items: [TarsPostingRow] }` (uigrid pagination).
- **Row shape:**
  ```jsonc
  {
    "id": "<guid>",
    "agreementId": <int>,
    "agreementNo": "<string>",
    "movementNo": "<string>",
    "movementDateTime": "<iso utc>",
    "speedOperation": <1..13>,
    "tarsOperation": <1..8>,
    "tarsBatchId": "<guid>",
    "status": <0..8>,
    "error": "<string|null>",
    "errorType": <1..4|null>,
    "noOfTries": <int>
  }
  ```

### `GetTarsPostingForView` (proxy line 18901)
- **Purpose:** Single posting detail for the View modal (bundle line 219525).
- **Request body:** `{ id: <tarsPostingId> }`.
- **Response:** Same shape as row + `documents[]` array (`{ name, guid, url, urlWithToken }`, bundle line 219446–219455).

### `SaveDocuments` (proxy line 18909)
- **Purpose:** Attach signed-agreement / driver-document images (bundle line 219501).
- **Request body:**
  ```jsonc
  { "id": "<tarsPostingId>", "documents": [{ "name": "...", "guid": "...", "url": "..." }, ...] }
  ```

### `SaveTarsPostingIgnoreReason` (proxy line 18917)
- **Purpose:** Mark a posting Ignored with free-text reason (bundle line 219272–219277).
- **Request body:** `{ id: <tarsPostingId>, reason: "<string>" }`.
- **Side effect:** sets `status=7`.

---

## `abp.services.app.tarsSetting` (proxy lines 18931–18955)

Base path: `/api/services/app/tarsSetting/`

### `UpdateAllSettings` (proxy line 18933)
- **Purpose:** Persist the full TARS settings envelope (bundle line 218678).
- **Request body (`vm.settings`):**
  ```jsonc
  {
    "dataToShare": 6,            // hard-coded; ⚠ bitmask meaning unknown
    "sharingFormat": 0,
    "isActive": 1,
    "configuration": {
      "trafficFileCredentials": [
        { "trafficFileId": "<int>", "clientId": "...", "clientSecret": "...", "agencyDid": "..." }
      ],
      "ignoredTrafficFileIds": [<int>, ...]
    }
  }
  ```

### `GetTarsSettings` (proxy line 18941)
- **Purpose:** Load current settings (bundle line 218641).
- **Request body:** none.
- **Response:** envelope above.

### `GetTrafficFiles` (proxy line 18949)
- **Purpose:** Catalogue of UAE traffic files for the credential-row dropdown (bundle line 218588).
- **Request body:** none.
- **Response:** `[ { id: <int>, name: "<traffic file name>" }, ... ]`.

---

## `abp.services.app.tenantSettings` (TARS-scoped subset — proxy lines 24109–24123)

### `GetTarsSetting` (proxy line 24109)
- **Request body:** none.
- **Response (bundle 218687–218701):**
  ```jsonc
  {
    "contactGroupId": "<int>",   // string→int parse on client
    "customersToIgnore": [<directoryId>, ...]
  }
  ```

### `UpdateTarsSetting` (proxy line 24117)
- **Request body:** same shape as response of `GetTarsSetting` plus any tenant-toggle flags.

---

## `abp.services.app.azureJobForTars` (proxy lines 18867–18883)

Base path: `/api/services/app/azureJobForTars/` — invoked by Azure Function side, NOT browser UI.

### `UpdateTarsPostingStatuses` (proxy line 18869)
- **Purpose:** Bulk poll RTA, write back results (status, error, errorType, noOfTries).
- **Request body:** `{ items: [{ id, status, error, errorType }] }` (inferred from bundle line 219200–219207 caller pattern).

### `GetTarsPostingsForAzureJob` (proxy line 18877)
- **Purpose:** Returns the queue of postings the Azure poller should process (status ∈ {1,2,3} + retryable {4,6}).
- **Request body:** none.

---

## External Azure Function (bundle lines 219071, 219082)

```
GET https://speedserviceapp.azurewebsites.net/api/UpdatePosting
    ?code=Js4wsXSqX6KLsIH0GdnpLXlVcs7Glhall2wD0q4/mmScYRIyTVtWAA==
    &id=<tarsPostingId>
    &tenantId=<tenantId>
```
- **Purpose:** Manual single-posting refresh (used by the "Try Posting" UI action when Azure poller is stalled).
- **Auth:** shared Azure Function code key. ⚠ Vesla replacement MUST NOT carry this secret.
- **Response:** plain-text status string surfaced via `abp.notify.success`.

---

## Vesla Equivalents

| Speed endpoint | Vesla route + controller |
|---|---|
| `tarsPosting/CreateOrUpdateAgreementInputForTars` | `POST /api/tars-contracts/upload` → `tars-contract.service.ts:uploadContract` |
| `tarsPosting/PostAgreementToTars` | merged into `uploadContract` (Vesla single-call) |
| `tarsPosting/CloseAgreementForTars` | `POST /api/tars-contracts/:id/close` → `tars-contract.service.ts:closeContract` |
| `tarsPosting/PostReplacementAgreementForTars` | NOT YET — needs implementation per F1 |
| `tarsPostingStatus/GetTarsPostingStatus` | `GET /api/tars-dashboard/postings` → `tars-dashboard.controller.ts` |
| `tarsPostingStatus/SaveDocuments` | uses `tars_attachment_cache` (schema.prisma:13321) — controller TBD |
| `tarsPostingStatus/SaveTarsPostingIgnoreReason` | NOT YET — schema column missing on `spd_tars_postings` |
| `tarsSetting/UpdateAllSettings` | `PUT /api/tars-credentials/:id` (per-credential, not per-tenant envelope) |
| `tarsSetting/GetTrafficFiles` | NOT YET — Vesla relies on RTA-issued creds without traffic-file picker UX |
| `tenantSettings/GetTarsSetting` (customersToIgnore) | NOT YET — must add column or extension table |
| `azureJobForTars/UpdateTarsPostingStatuses` | `vesla-tars-fines-worker` `tars-fines-sync.job.ts` (cron */5 *) |
| Azure `/api/UpdatePosting` | NOT YET — UI manual-refresh button needs implementation |

---

## ⚠ Open Questions

- Q1: Exact shape of the TARS payload built by `CreateOrUpdateAgreementInputForTars` — needs a captured network trace.
- Q2: Does `PostAgreementToTars` proxy to `tarsapi.rta.ae` directly, or via a Speed-side relay?
- Q3: Are documents stored as base64 in `SaveDocuments` or pre-uploaded to S3 with guid pointer?
- Q4: `dataToShare` bitmask semantics (see behavior.md §7).
