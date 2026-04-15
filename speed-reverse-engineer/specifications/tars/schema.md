# tars — Schema

> Format mandated by `DOCTRINE.md`. Speed-side reconstructed from `App-bundle.js` + `AbpServiceProxies-jquery.js`. Vesla-side cited from `web-erp-app/backend/prisma/schema.prisma` with line numbers.

---

## Speed table: `tars_postings`

Reconstructed from view-modal column definitions (bundle line 218900–218962) + retry payload shape (bundle line 219123–219128) + posting-row shape (api.md §`GetTarsPostingStatus` response).

| Field | Type | Nullable | Notes |
|-------|------|----------|-------|
| `id` | guid | NO | PK. Surface as `tarsPostingId`. |
| `tenantId` | int | NO | ABP multi-tenancy. |
| `agreementId` | int | NO | FK → agreements. |
| `agreementNo` | string | YES | Denormalized for grid. |
| `movementNo` | string | YES | Denormalized; the source movement (rental, NRM, workshop). |
| `movementDateTime` | datetime UTC | YES | Used to compute 3h grace window. |
| `speedOperation` | int (1–13) | NO | See behavior.md §4.1. |
| `tarsOperation` | int (1–8) | NO | See behavior.md §4.2. |
| `tarsBatchId` | guid | YES | Groups multi-step postings (e.g. open + driver attach). |
| `status` | int (0–8) | NO | See behavior.md §4.3. |
| `error` | string | YES | Last RTA/Speed error message. |
| `errorType` | int (1–4) | YES | See behavior.md §4.4. |
| `noOfTries` | int | NO | Increments per retry (Azure poller + manual). |
| `documents` | jsonb (array) | YES | `[{ name, guid, url, urlWithToken }]`. Populated via `SaveDocuments`. |
| `ignoreReason` | string | YES | Set when status flips to 7 via `SaveTarsPostingIgnoreReason`. |
| `creationTime` | datetime UTC | NO | ABP audit. |
| `lastModificationTime` | datetime UTC | YES | ABP audit. |

---

## Speed table: `tars_settings` (per-tenant)

Reconstructed from `vm.settings` save payload (bundle 218669–218685) + `getTarsSettings` consume (bundle 218641–218657) + `getTarsSetting` (bundle 218687–218701).

| Field | Type | Nullable | Notes |
|-------|------|----------|-------|
| `tenantId` | int | NO | PK. |
| `dataToShare` | int (bitmask) | NO | Hard-coded `6` ⚠. |
| `sharingFormat` | int | NO | Hard-coded `0` ⚠. |
| `isActive` | int (0/1) | NO | Hard-coded `1` on save. |
| `configuration` | jsonb | YES | See sub-shape below. |
| `customersToIgnore` | int[] | YES | Directory ids; sourced via `tenantSettings/GetTarsSetting`. |
| `contactGroupId` | int | YES | Directory contact group id; same source. |

**`configuration` sub-shape:**
```jsonc
{
  "trafficFileCredentials": [
    { "trafficFileId": "<int>", "clientId": "...", "clientSecret": "...", "agencyDid": "..." }
  ],
  "ignoredTrafficFileIds": [<int>, ...]
}
```

---

## Speed table: `traffic_files` (catalogue)

Returned by `tarsSetting/GetTrafficFiles` (bundle 218588). Probably tenant-shared / system-level.

| Field | Type | Nullable | Notes |
|-------|------|----------|-------|
| `id` | int | NO | PK. |
| `name` | string | NO | Display label, e.g. "VRC Traffic File 1". |

---

## Speed table: `tars_posting_documents` (or jsonb subarray)

If normalized: one row per attachment. If embedded: jsonb on `tars_postings.documents`. Bundle suggests embedded (R-010).

| Field | Type | Nullable | Notes |
|-------|------|----------|-------|
| `tarsPostingId` | guid | NO | FK. |
| `name` | string | NO | Display name. |
| `guid` | guid | NO | Speed file storage id. |
| `url` | string | NO | CDN URL. |

---

## Vesla equivalents

| Speed table | Vesla mirror (`spd_*`) | Vesla native | Notes |
|---|---|---|---|
| `tars_postings` | `spd_tars_postings` (line 21652) | NONE — proposed `tars_postings` native (see Recommended) | Lossy mirror — only 13 fields; missing 8 critical state fields. |
| `tars_settings` | NONE | `tars_credentials` (line 12952) — partial; one row per traffic file | Vesla splits credentials per-row with PER-tenant `@@unique([companyId, environment])`. ⚠ Vesla currently allows only ONE credential per (tenant, env) — Speed allows N credentials per tenant. |
| `traffic_files` | NONE | NONE | Vesla derives from RTA-issued credentials directly; no catalogue. |
| `tars_posting_documents` | NONE | `tars_attachment_cache` (line 13321) | Vesla caches via S3 — better than Speed's external CDN dependency. |
| (RTA mirror — vehicles) | NONE | `tars_vehicles` (line 13222) | Vesla has it; Speed lacks an explicit RTA-vehicle mirror table. |
| (RTA mirror — contracts) | NONE | `tars_contracts` (line 13272) | Vesla pulls from RTA proactively. |
| (RTA mirror — customers) | NONE | `tars_customers` (line 13183) | Vesla pulls from RTA proactively. |

---

### Gap analysis: `spd_tars_postings` (Vesla mirror line 21652)

Vesla mirror columns: `id, companyId, postingId, date, agreementNo, customer, vehicle, plateNo, postingType, status (string), amount, reference, notes, syncImportId, rawData, rowHash, deletedAt, isMigrated`.

**Missing fields on Vesla mirror (vs Speed `tars_postings`):**
- `agreementId` (int FK)
- `movementNo`
- `movementDateTime` (needed for 3h grace calc)
- `speedOperation` (int 1–13)
- `tarsOperation` (int 1–8)
- `tarsBatchId` (guid)
- `status` — Speed is INT enum (0–8), Vesla mirror is `String?` ⚠ structural mismatch
- `error` (string)
- `errorType` (int 1–4)
- `noOfTries` (int)
- `documents` (jsonb)
- `ignoreReason` (string)

**Structural mismatches:**
- `status` type: int (Speed) vs string (Vesla mirror) — must reconcile or carry both.
- No FK to `rentalContracts.id` — only string `agreementNo`. Reattribution to Vesla contract requires lookup.
- Vesla mirror has `amount` (Decimal) — TARS posting itself is not financial; this column is unused/misnamed ⚠.

**Recommended changes to `spd_tars_postings`:**
```sql
ALTER TABLE spd_tars_postings ADD COLUMN agreement_id INT;
ALTER TABLE spd_tars_postings ADD COLUMN movement_no VARCHAR;
ALTER TABLE spd_tars_postings ADD COLUMN movement_date_time TIMESTAMPTZ;
ALTER TABLE spd_tars_postings ADD COLUMN speed_operation SMALLINT;     -- 1..13
ALTER TABLE spd_tars_postings ADD COLUMN tars_operation SMALLINT;       -- 1..8
ALTER TABLE spd_tars_postings ADD COLUMN tars_batch_id UUID;
ALTER TABLE spd_tars_postings ADD COLUMN status_code SMALLINT;          -- 0..8
ALTER TABLE spd_tars_postings ADD COLUMN error_text TEXT;
ALTER TABLE spd_tars_postings ADD COLUMN error_type SMALLINT;            -- 1..4
ALTER TABLE spd_tars_postings ADD COLUMN no_of_tries INT DEFAULT 0;
ALTER TABLE spd_tars_postings ADD COLUMN documents JSONB;
ALTER TABLE spd_tars_postings ADD COLUMN ignore_reason TEXT;
CREATE INDEX idx_spd_tars_postings_status_code ON spd_tars_postings(company_id, status_code);
CREATE INDEX idx_spd_tars_postings_speed_op ON spd_tars_postings(company_id, speed_operation);
```

---

### Gap analysis: `tars_credentials` (Vesla native line 12952) vs Speed `tars_settings.configuration.trafficFileCredentials`

**Speed structure:** array; multiple credentials per tenant, one per traffic file.
**Vesla structure:** table with `@@unique([companyId, environment])` — at most ONE credential per (tenant, env). ⚠ DOES NOT support multi-traffic-file fleets.

**Recommended changes:**
- Add `@@unique([companyId, environment, trafficFileNo])` (drop the env-only unique).
- Optional: catalogue table `traffic_files` (or just rely on `trafficFileNo` as a free-text key).
- Add `customersToIgnore` (uuid[]) and `contactGroupId` (string?) — currently Vesla has neither.

```sql
ALTER TABLE tars_credentials DROP CONSTRAINT tars_credentials_company_id_environment_key;
CREATE UNIQUE INDEX tars_credentials_company_env_traffic_file_uq
  ON tars_credentials(company_id, environment, traffic_file_no);
ALTER TABLE tars_credentials ADD COLUMN customers_to_ignore UUID[] DEFAULT '{}';
ALTER TABLE tars_credentials ADD COLUMN contact_group_id TEXT;
```

NOTE: Per protocol §4 these go in their OWN migration cards (tarspar-D1 covers `invoiceFromDate` only — these must be a separate isolated card if confirmed).

---

### Recommended new Vesla native table: `tars_postings`

`spd_tars_postings` is the historical mirror. For Vesla to *originate* postings (not just receive Speed's), we need a native table with the full Speed-shape:

```prisma
model tars_postings {
  id                String   @id @default(uuid())
  companyId         String   @map("company_id")
  agreementId       String?  @map("agreement_id")           // FK → rentalContracts
  movementNo        String?  @map("movement_no")
  movementDateTime  DateTime? @map("movement_date_time")
  speedOperation    Int      @map("speed_operation")        // 1..13
  tarsOperation     Int      @map("tars_operation")         // 1..8
  tarsBatchId       String?  @map("tars_batch_id")
  statusCode        Int      @default(0) @map("status_code") // 0..8
  errorText         String?  @map("error_text")
  errorType         Int?     @map("error_type")              // 1..4
  noOfTries         Int      @default(0) @map("no_of_tries")
  documents         Json?
  ignoreReason      String?  @map("ignore_reason")
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  company           companies        @relation(fields: [companyId], references: [id], onDelete: Cascade)
  contract          rentalContracts? @relation(fields: [agreementId], references: [id])
  @@index([companyId, statusCode])
  @@index([companyId, speedOperation])
  @@index([agreementId])
  @@map("tars_postings")
}
```

This is the table our `vesla-tars-fines-worker` and (future) `vesla-tars-postings-worker` push into. `spd_tars_postings` remains the historical Speed-import mirror (read-only).

---

## Source citations summary

| Claim | Source |
|---|---|
| 8 `tarsPosting` endpoints | proxy lines 3–67 |
| 4 `tarsPostingStatus` endpoints | proxy lines 18891–18923 |
| 3 `tarsSetting` endpoints | proxy lines 18931–18955 |
| 2 `tenantSettings` TARS endpoints | proxy lines 24109–24123 |
| 2 `azureJobForTars` endpoints | proxy lines 18867–18883 |
| Status enum | bundle lines 218747–218774 |
| Error type enum | bundle lines 219421–219430 |
| SpeedOperation enum | bundle lines 218776–218790 |
| TarsOperation enum | bundle lines 218821–218830 |
| 3-hour grace period | bundle lines 219065–219077 |
| trafficFileCredentials shape | bundle lines 218616–218621 |
| Document upload shape | bundle lines 219446–219455 |
| Azure Function URL | bundle lines 219071, 219082 |
| Vesla `spd_tars_postings` (lossy) | schema.prisma:21652 |
| Vesla `tars_credentials` | schema.prisma:12952 |
| Vesla `tars_customers` | schema.prisma:13183 |
| Vesla `tars_vehicles` | schema.prisma:13222 |
| Vesla `tars_contracts` | schema.prisma:13272 |
| Vesla `tars_attachment_cache` | schema.prisma:13321 |
