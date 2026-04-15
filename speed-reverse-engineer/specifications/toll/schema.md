# toll — Schema

> Format mandated by `DOCTRINE.md`. Speed-side reconstructed from `App-bundle.js` + `AbpServiceProxies-jquery.js` + `spd_tolls`/`spd_darb_tolls` mirror columns. Vesla cited from `web-erp-app/backend/prisma/schema.prisma`.

---

## Speed table: `tolls` (unified Salik + Darb + Parking, with `tollType` discriminator)

Reconstructed from `spd_tolls` mirror (line 21299) + bundle row references.

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `id` | int | NO | PK. |
| `tollId` | string | NO | Portal-side toll id (per-portal unique). |
| `tenantId` | int | NO | ABP. |
| `date` | datetime UTC | NO | Passage time. |
| `tollType` | string | NO | "Salik" / "Darb" / "Parking". |
| `authority` | string | NO | "RTA Salik" / "Department of Transportation Abu Dhabi". |
| `tagNo` | string | YES | RFID tag. |
| `plateNo` | string | NO | Vehicle plate. |
| `vehicle` | string | YES | Display name. |
| `makeAndModel` | string | YES | Denorm. |
| `gate` | string | YES | Gate name. |
| `direction` | string | YES | INBOUND/OUTBOUND. |
| `amount` | decimal | NO | Toll amount. |
| `agreementId` | int | YES | FK → agreements (NULL = unattributed). |
| `agreementNo` | string | YES | Denorm. |
| `customer` | string | YES | Denorm. |
| `customerCode` | string | YES | Denorm. |
| `salesPerson` | string | YES | Denorm. |
| `vehicleId` | int | YES | FK → vehicles (NULL = pending vehicle). |
| `movementId` | int | YES | FK → movements (NULL = unattributed). |
| `salikAccountId` | int | NO | FK → salikAccount. |
| `accountName` | string | YES | Denorm. |
| `surcharge` | decimal | NO | Customer surcharge. |
| `amountWithSurcharge` | decimal | NO | `amount + surcharge`. |
| `chargedAmount` | decimal | NO | Customer charged. |
| `invoiceVoucherNo` | string | YES | Customer invoice. |
| `debitJvVoucherNo` | string | YES | EOM JV. |
| `invoiceDueAmount` | decimal | YES | Customer due (incl. VAT). |
| `status` | string | NO | "Pending" / "Charged" / "Invoiced" / "Disputed" / "Late" — ⚠ inferred. |
| `ignored` | bool | NO | Skip-from-billing. |
| `isAddedManually` | bool | NO | Manual import vs portal pull. |
| `isExternalVehicle` | bool | NO | Non-fleet vehicle on our account. |
| `latitude` | decimal | YES | GPS (Darb has GPS; Salik may not). |
| `longitude` | decimal | YES | |
| `creationTime` | datetime UTC | NO | ABP audit. |

**Indexes (inferred):**
- `(tenantId, tollType, date)` — paged list.
- `(tenantId, vehicleId, date)` — attribution.
- `(tenantId, salikAccountId, date)` — per-account report.
- `(tenantId, tagNo)` — tag-plate change tracking.
- `(tenantId, tollId)` UNIQUE — portal dedup.

## Speed table: `salikAccount`

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `id` | int | NO | PK. |
| `tenantId` | int | NO | |
| `username` | string | NO | Portal login. |
| `password` (encrypted) | string | NO | |
| `authority` | string | NO | "Salik" / "Darb" / "Parking". |
| `accountName` | string | YES | Display name. |
| `lastDownloadDate` | datetime | YES | Tolls cursor. |
| `parkingLastDownloadDate` | datetime | YES | Parking cursor (account is shared). |
| `tollsCount` | int | YES | Cached count. |
| `tollsDateList` | jsonb (date[]) | YES | Downloaded dates. |
| `daysToReconcile` | jsonb (date[]) | YES | Operator reconcile window. |
| `error` | string | YES | Last download error. |

## Speed table: `salik_tags`

Inferred from `GetTagsOnPlateNo`, `salikAccount.daysToReconcile` per-tag scrape.

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `id` | int | NO | PK. |
| `tenantId` | int | NO | |
| `salikAccountId` | int | NO | FK. |
| `tagNo` | string | NO | RFID. |
| `plateNo` | string | YES | Current vehicle plate. |
| `vehicleId` | int | YES | Current vehicle. |
| `assignedFrom` | datetime | YES | History start. |
| `assignedTo` | datetime | YES | History end (NULL = current). |

## Speed table: `tolls_data_sharing`

Inferred from `tollsDataSharing.UpdateSharedStatus`.

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `tollId` | int | NO | FK. |
| `consumerTenantId` | int | NO | |
| `sharedAt` | datetime | NO | |
| `sharingStatus` | int | NO | enum: 0=Pending, 1=Shared, 2=Consumed. |

---

## Vesla equivalents

| Speed table | Vesla mirror | Vesla native | Notes |
|---|---|---|---|
| `tolls` (Salik subset) | `spd_tolls` (line 21299) | `tars_salik` (line 13052) | Vesla SPLITS by source. |
| `tolls` (Darb subset) | `spd_darb_tolls` (line 21335) | `darb_transactions` (line 13366) | Same. |
| `tolls` (Parking subset) | `spd_parking` (line 21409) | `parkin_fines` (line 13536) | Note: Vesla naming is `parkin_*` (Abu Dhabi parking authority "Parkin"). |
| `salikAccount` | NONE | `tars_credentials` (TARS Salik subset) + `darb_credentials` (line 13345) + `parkin_credentials` (line 13517) | Three separate credential tables; Speed unifies. |
| `salik_tags` | NONE | NONE | Gap: Vesla has no tag↔plate history table. |
| `tolls_data_sharing` | NONE | NONE | Not built. |

---

### Gap analysis: `spd_tolls` (Vesla mirror line 21299) vs Speed `tolls` (Salik)

Vesla mirror columns (21299–21333): `id, companyId, tollId, date, tollType, authority, tagNo, plateNo, vehicle, makeAndModel, gate, direction, amount, agreementNo, customer, customerCode, invoiceNo, status, accountName, normalizedPlate, syncImportId, rawData, rowHash, deletedAt, isMigrated`.

**Missing fields on Vesla mirror (vs Speed `tolls`):**
- `vehicleId` (int FK)
- `agreementId` (int FK)
- `movementId` (int FK)
- `salikAccountId` (int FK)
- `salesPerson` (denorm)
- `surcharge`, `amountWithSurcharge`, `chargedAmount`, `invoiceVoucherNo`, `debitJvVoucherNo`, `invoiceDueAmount` — financial breakdown
- `ignored`, `isAddedManually`, `isExternalVehicle`
- `latitude`, `longitude`

**Structural mismatches:**
- Same as `spd_fines`: status is string, no enums.
- `tollType` exists; good. But Salik vs Darb is split into two mirror tables (spd_tolls vs spd_darb_tolls) — redundant if `tollType` discriminates.

**Recommended `spd_tolls` enrichment:**
```sql
ALTER TABLE spd_tolls ADD COLUMN vehicle_id_int INT;
ALTER TABLE spd_tolls ADD COLUMN agreement_id_int INT;
ALTER TABLE spd_tolls ADD COLUMN movement_id BIGINT;
ALTER TABLE spd_tolls ADD COLUMN salik_account_id INT;
ALTER TABLE spd_tolls ADD COLUMN sales_person VARCHAR;
ALTER TABLE spd_tolls ADD COLUMN surcharge DECIMAL(12,2) DEFAULT 0;
ALTER TABLE spd_tolls ADD COLUMN amount_with_surcharge DECIMAL(12,2);
ALTER TABLE spd_tolls ADD COLUMN charged_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE spd_tolls ADD COLUMN invoice_voucher_no VARCHAR;
ALTER TABLE spd_tolls ADD COLUMN debit_jv_voucher_no VARCHAR;
ALTER TABLE spd_tolls ADD COLUMN invoice_due_amount DECIMAL(12,2);
ALTER TABLE spd_tolls ADD COLUMN ignored BOOLEAN DEFAULT FALSE;
ALTER TABLE spd_tolls ADD COLUMN is_added_manually BOOLEAN DEFAULT FALSE;
ALTER TABLE spd_tolls ADD COLUMN is_external_vehicle BOOLEAN DEFAULT FALSE;
ALTER TABLE spd_tolls ADD COLUMN latitude DECIMAL(10,6);
ALTER TABLE spd_tolls ADD COLUMN longitude DECIMAL(10,6);
CREATE INDEX idx_spd_tolls_vehicle_date ON spd_tolls(company_id, vehicle_id_int, date);
```

Mirror the same ALTERs for `spd_darb_tolls` (line 21335).

---

### Gap analysis: `tars_salik` (Vesla native line 13052) vs Speed `tolls` (Salik)

Vesla `tars_salik` has 30+ fields. Strong baseline.

**Comparison:**

| Speed field | Vesla `tars_salik` field | Status |
|---|---|---|
| `tollId` | `transactionId` | ✅ |
| `passageTime` | `passageTime` | ✅ |
| `gateName` | `gateName` | ✅ |
| `gateCode` | `gateCode` | ✅ |
| `direction` | `direction` | ✅ |
| `amount` | `amount` | ✅ |
| `vehicleId` (uuid) | `vehicleId` | ✅ |
| `tagNo` | `tagNumber` | ✅ |
| `accountName` | `accountNumber` | ⚠ partial — `accountNumber` numeric vs `accountName` string |
| `salikAccountId` | NOT YET (no `salikAccount` table) | ❌ gap |
| `agreementId` / `movementId` | `contractId` | ⚠ no `movementId` |
| `surcharge` etc. | computed via `tars_charge_config` | ✅ deferred |
| `isExternalVehicle` | NOT YET | ❌ gap |
| `ignored` | NOT YET | ❌ gap |
| `latitude` / `longitude` | NOT YET | ❌ gap |
| `salesPerson` (denorm) | NOT YET | ❌ gap |

**Recommended `tars_salik` enrichment:**
```sql
ALTER TABLE tars_salik ADD COLUMN salik_account_name VARCHAR;
ALTER TABLE tars_salik ADD COLUMN movement_id UUID;
ALTER TABLE tars_salik ADD COLUMN sales_person_id UUID;
ALTER TABLE tars_salik ADD COLUMN ignored BOOLEAN DEFAULT FALSE;
ALTER TABLE tars_salik ADD COLUMN ignored_reason TEXT;
ALTER TABLE tars_salik ADD COLUMN is_external_vehicle BOOLEAN DEFAULT FALSE;
ALTER TABLE tars_salik ADD COLUMN is_added_manually BOOLEAN DEFAULT FALSE;
ALTER TABLE tars_salik ADD COLUMN latitude DECIMAL(10,6);
ALTER TABLE tars_salik ADD COLUMN longitude DECIMAL(10,6);
ALTER TABLE tars_salik ADD COLUMN debit_jv_id UUID;
CREATE INDEX idx_tars_salik_external ON tars_salik(company_id, is_external_vehicle);
CREATE INDEX idx_tars_salik_ignored ON tars_salik(company_id, ignored);
```

Mirror the same ALTERs for `darb_transactions` (line 13366).

---

### Recommended new Vesla native table: `salik_accounts` (or `toll_accounts`)

Vesla currently splits credentials into `tars_credentials`, `darb_credentials`, `parkin_credentials`. To match Speed's per-account scrape model, consider a unified table:

```prisma
model toll_accounts {
  id                       String   @id @default(uuid())
  companyId                String   @map("company_id")
  authority                String   // SALIK, DARB, PARKIN
  username                 String
  password                 String   // encrypted
  accountName              String?  @map("account_name")
  lastDownloadDate         DateTime? @map("last_download_date")
  parkingLastDownloadDate  DateTime? @map("parking_last_download_date")
  tollsCount               Int      @default(0) @map("tolls_count")
  tollsDateList            Json?    @map("tolls_date_list")
  daysToReconcile          Json?    @map("days_to_reconcile")
  lastError                String?  @map("last_error")
  isActive                 Boolean  @default(true) @map("is_active")
  syncIntervalMinutes      Int?     @map("sync_interval_minutes")
  createdAt                DateTime @default(now())
  updatedAt                DateTime @updatedAt
  company                  companies @relation(fields: [companyId], references: [id], onDelete: Cascade)
  @@unique([companyId, authority, username])
  @@index([companyId, authority])
  @@map("toll_accounts")
}
```

Optionally migrate `tars_credentials` (Salik portion only), `darb_credentials`, `parkin_credentials` into this. Or keep the three separate per their Vesla-specific shape and add `accountName`+`tollsCount`+`tollsDateList` to all three.

---

### Recommended new Vesla native table: `salik_tags`

Captures plate↔tag history for accurate historical attribution after fleet rotation:

```prisma
model salik_tags {
  id              String    @id @default(uuid())
  companyId       String    @map("company_id")
  tollAccountId   String?   @map("toll_account_id")
  tagNo           String    @map("tag_no")
  plateNumber     String?   @map("plate_number")
  vehicleId       String?   @map("vehicle_id")
  assignedFrom    DateTime? @map("assigned_from")
  assignedTo      DateTime? @map("assigned_to")
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  @@index([companyId, tagNo])
  @@index([companyId, vehicleId])
  @@map("salik_tags")
}
```

---

## Source citations

| Claim | Source |
|---|---|
| 75 `toll` endpoints | proxy lines 11171–11770 |
| 10 `salikAccount` endpoints | proxy lines 11091–11163 |
| 2 `tollMonthEndPosting` endpoints | proxy lines 11067–11079 |
| 3 `tollsDataSharing` endpoints | proxy lines 22291–22319 |
| Salik portal scrape mechanics | bundle lines 13103–13231 |
| Server-side class | `tolls-crs.json` NullRef stack: `Speed.Tolls.TollAppService.GetTollsReportCRS` |
| Vesla `spd_tolls` | schema.prisma:21299 |
| Vesla `spd_darb_tolls` | schema.prisma:21335 |
| Vesla `tars_salik` | schema.prisma:13052 |
| Vesla `darb_transactions` | schema.prisma:13366 |
| Vesla `darb_credentials` | schema.prisma:13345 |
| Vesla `darb_charge_config` | schema.prisma:13465 |
| Vesla `parkin_credentials` | schema.prisma:13517 |
| Vesla `parkin_fines` | schema.prisma:13536 |
