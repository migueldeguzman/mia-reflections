# fine — Schema

> Format mandated by `DOCTRINE.md`. Speed-side reconstructed from `App-bundle.js` + `AbpServiceProxies-jquery.js` + `fines-list.json`. Vesla-side cited from `web-erp-app/backend/prisma/schema.prisma`.

---

## Speed table: `fines` (UAE-pulled — `UaeFineAppService`)

Authoritative shape from `fines-list.json` (production capture, 4 rows).

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `id` | int | NO | PK. |
| `fineNo` | string | NO | RTA-side fine number. |
| `plateNo` | string | NO | Numeric portion. |
| `plateInfo` | string | YES | Full plate display. |
| `customPlateNo` | string | YES | Override. |
| `tripDriverName` | string | YES | Driver-of-record. |
| `contactNo` | string | YES | Driver mobile. |
| `salesPerson` | string | YES | Owning sales rep. |
| `fineDateTime` | datetime UTC | NO | Violation timestamp. |
| `authority` | string | NO | "Dubai Police" / "Department of Transportation Abu Dhabi". |
| `downloadDateTime` | datetime UTC | NO | Speed pull timestamp. |
| `fineDescription` | string | YES | RTA free-text. |
| `isPaid` | bool | NO | Government payment status. |
| `notes` | string | YES | Operator notes. |
| `vehicleId` | int | NO | FK → vehicles. |
| `movementId` | int | YES | FK → movements (NULL = unattributed). |
| `ignored` | bool | NO | Skip-from-billing flag. |
| `location` | string | YES | Violation street / "GPS Location". |
| `agreementCustomerName` | string | YES | Denorm. |
| `agreementNo` | string | YES | Denorm. |
| `tripNo` | string | YES | Limousine trip ref. |
| `movementRefNo` | string | YES | Cross-ref. |
| `movementStaffName` | string | YES | Denorm. |
| `movementContact` | jsonb | YES | Full customer snapshot (100+ fields). |
| `movementType` | string | YES | "Agreement" / "Limo" / "Workshop" / etc. |
| `trafficFileId` | int | NO | FK → trafficFiles. |
| `confiscationCharges` | decimal | NO | Vehicle-impound fees. |
| `amount` | decimal | NO | Base fine. |
| `acknowledgment` | decimal | NO | Acknowledgment fee. |
| `surcharge` | decimal | NO | Customer surcharge. |
| `amountWithSurcharge` | decimal | NO | `amount + surcharge` (excl. VAT, excl. acknowledgment in customer-due calc). |
| `isPayable` | bool | NO | Customer-bill eligibility. |
| `staffName` | string | YES | Denorm of driver. |
| `chargedAmmount` | decimal | NO | [SIC: typo preserved] Amount charged. |
| `customValueField1` | decimal | NO | Tenant extension. |
| `customValueField2` | decimal | NO | Tenant extension. |
| `collectedAmount` | decimal | NO | Customer payment received. |
| `due` | decimal | NO | Customer outstanding. |
| `invoiceVoucherNo` | string | YES | Invoice voucher (e.g. `FIN2604-000136`). |
| `debitJvVoucherNo` | string | YES | Debit JV voucher (month-end posting). |
| `invoiceDueAmount` | decimal | YES | Customer-side due (incl. VAT). |
| `server` | string | NO | "Dubai" / "Abu Dhabi". |
| `receiptDateTime` | datetime UTC | YES | Government-side payment timestamp. |
| `receiptNo` | string | YES | Government receipt no. |
| `latitude` | decimal | YES | GPS. |
| `longitude` | decimal | YES | GPS. |
| `blackPoints` | int | NO | Driver licence demerits. |
| `isAddedManually` | bool | NO | Manual vs portal-pulled. |
| `lateCharges` | decimal | NO | RTA-side late fee. |
| `billNo` | string | YES | Supplier bill (paid-to-government). |
| `billDate` | datetime | YES | Bill date. |
| `invoiceDate` | datetime | YES | Customer invoice date. |
| `billPaid` | bool | YES | Bill paid to government. |
| `companyCode` | string | YES | Tenant. |

**Indexes (inferred from query patterns):**
- `(tenantId, server, fineDateTime)` — paged list.
- `(tenantId, vehicleId, fineDateTime)` — attribution.
- `(tenantId, movementId)` — agreement-scoped read.
- `(tenantId, fineNo)` — uniqueness check.
- `(tenantId, isPaid, ignored)` — pending-fines query.

## Speed table: `traffic_fines` (manually-entered — `TrafficFineAppService`)

Inferred from `trafficFine` proxy methods. Schema slimmer than `fines`:

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `id` | int | NO | PK. |
| `tenantId` | int | NO | ABP. |
| `fineNo` | string | YES | Manual entry; may be blank. |
| `plateNo` | string | NO | |
| `vehicleId` | int | NO | FK. |
| `agreementNo` | string | YES | Manual attach. |
| `amount` | decimal | NO | |
| `description` | string | YES | |
| `image` | bytea / blob ref | YES | `GetImageForShow` / `GetImageForEmail`. |
| `charged` | bool | NO | Has been charged via `ChargeTrafficFineNew`. |
| `invoiceVoucherNo` | string | YES | After `CreateInvoiceFromTrafficFine`. |

## Speed table: `fine_logs` (audit trail)

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `id` | int | NO | PK. |
| `fineId` | int | NO | FK. |
| `eventType` | string | NO | "Created" / "Updated" / "Charged" / "Detached" / "Ignored" / "Emailed". |
| `eventData` | jsonb | YES | Diff. |
| `actorUserId` | int | NO | |
| `creationTime` | datetime UTC | NO | |

Surface: `uaeFine.FineLogs` (read) + `CreateFineLog` (write).

---

## Vesla equivalents

| Speed table | Vesla mirror (`spd_*`) | Vesla native | Notes |
|---|---|---|---|
| `fines` (UAE-pulled) | `spd_fines` (line 21371) | `tars_fines` (line 12982) + `darb_fines` (line 13403) + `parkin_fines` (line 13536) | Vesla SPLIT by source (TARS/Darb/Parkin); Speed unifies under `fines` with `server` discriminator. |
| `traffic_fines` (manual) | NONE | NOT YET — could overload `tars_fines` with `isAddedManually=true` flag | Gap: Vesla has no manual-fine entry path. |
| `fine_logs` | NONE | NONE | Gap: Vesla has no audit trail for fine state changes. |

---

### Gap analysis: `spd_fines` (Vesla mirror line 21371)

Vesla mirror columns: `id, companyId, fineId, fineNo, date, fineType, source, plateNo, vehicle, makeAndModel, amount, discount, finalAmount, agreementNo, customer, customerCode, driver, invoiceNo, billNo, status, location, description, trafficFileNo, syncImportId, rawData, rowHash, deletedAt, isMigrated`.

**Missing fields on Vesla mirror (vs Speed `fines`):**
- `vehicleId` (int FK) — only `vehicle` (string) and `plateNo` are present.
- `movementId` — no FK to attributed movement.
- `tripDriverName`, `contactNo`, `salesPerson` — not denormalized.
- `fineDateTime` (datetime) — only `date` (date-only).
- `authority` — covered by `source`?
- `downloadDateTime` — pull timestamp not tracked.
- `fineDescription` — covered by `description`.
- `ignored` flag — missing.
- `agreementCustomerName`, `movementStaffName` — denorms missing.
- `movementContact` (jsonb) — missing; rawData carries raw payload but not in queryable jsonb shape.
- `movementType` — missing.
- `confiscationCharges`, `acknowledgment`, `surcharge`, `amountWithSurcharge`, `chargedAmmount`, `customValueField1/2`, `collectedAmount`, `due`, `lateCharges` — missing financial breakdown.
- `invoiceVoucherNo`, `debitJvVoucherNo`, `invoiceDueAmount` — missing voucher refs (only `invoiceNo` present).
- `server` — covered by `source`.
- `receiptDateTime`, `receiptNo` — missing govt-side timestamps.
- `latitude`, `longitude`, `blackPoints` — missing GPS + demerits.
- `isAddedManually` — missing.
- `billPaid` — missing.

**Structural mismatches:**
- `date` is date-only, Speed is datetime UTC.
- `status` is string, Speed has multiple bool flags + status.
- No FK to `rentalContracts` or `vehicles` — only string columns.

**Recommended `spd_fines` enrichment:**
```sql
ALTER TABLE spd_fines ADD COLUMN vehicle_id_int INT;
ALTER TABLE spd_fines ADD COLUMN movement_id BIGINT;
ALTER TABLE spd_fines ADD COLUMN fine_date_time TIMESTAMPTZ;
ALTER TABLE spd_fines ADD COLUMN download_date_time TIMESTAMPTZ;
ALTER TABLE spd_fines ADD COLUMN authority VARCHAR;
ALTER TABLE spd_fines ADD COLUMN ignored BOOLEAN DEFAULT FALSE;
ALTER TABLE spd_fines ADD COLUMN movement_contact JSONB;
ALTER TABLE spd_fines ADD COLUMN movement_type VARCHAR;
ALTER TABLE spd_fines ADD COLUMN confiscation_charges DECIMAL(12,2) DEFAULT 0;
ALTER TABLE spd_fines ADD COLUMN acknowledgment DECIMAL(12,2) DEFAULT 0;
ALTER TABLE spd_fines ADD COLUMN surcharge DECIMAL(12,2) DEFAULT 0;
ALTER TABLE spd_fines ADD COLUMN amount_with_surcharge DECIMAL(12,2);
ALTER TABLE spd_fines ADD COLUMN charged_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE spd_fines ADD COLUMN collected_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE spd_fines ADD COLUMN due_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE spd_fines ADD COLUMN late_charges DECIMAL(12,2) DEFAULT 0;
ALTER TABLE spd_fines ADD COLUMN invoice_voucher_no VARCHAR;
ALTER TABLE spd_fines ADD COLUMN debit_jv_voucher_no VARCHAR;
ALTER TABLE spd_fines ADD COLUMN invoice_due_amount DECIMAL(12,2);
ALTER TABLE spd_fines ADD COLUMN server VARCHAR;
ALTER TABLE spd_fines ADD COLUMN receipt_date_time TIMESTAMPTZ;
ALTER TABLE spd_fines ADD COLUMN receipt_no VARCHAR;
ALTER TABLE spd_fines ADD COLUMN latitude DECIMAL(10,6);
ALTER TABLE spd_fines ADD COLUMN longitude DECIMAL(10,6);
ALTER TABLE spd_fines ADD COLUMN black_points INT DEFAULT 0;
ALTER TABLE spd_fines ADD COLUMN is_added_manually BOOLEAN DEFAULT FALSE;
ALTER TABLE spd_fines ADD COLUMN bill_paid BOOLEAN;
ALTER TABLE spd_fines ADD COLUMN bill_date TIMESTAMPTZ;
ALTER TABLE spd_fines ADD COLUMN invoice_date TIMESTAMPTZ;
CREATE INDEX idx_spd_fines_movement ON spd_fines(company_id, movement_id);
CREATE INDEX idx_spd_fines_vehicle_date ON spd_fines(company_id, vehicle_id_int, fine_date_time);
```

Per protocol §4 — separate isolated migration card if confirmed.

---

### Gap analysis: `tars_fines` (Vesla native line 12982) vs Speed `fines`

Vesla `tars_fines` has 45+ fields including TARS-specific `tarsVehicleDid`, `tarsContractDid`, `tarsStatusCode`, `regulationCode`, `violationDescriptionEn/Ar`, etc. — the Vesla native is **richer than the Speed mirror** for TARS-sourced fines.

**Comparison highlights:**

| Speed field | Vesla `tars_fines` field | Status |
|---|---|---|
| `fineNo` | `fineNumber` | ✅ |
| `plateNo` | `plateNumber` | ✅ |
| `vehicleId` (int) | `vehicleId` (uuid) | ✅ |
| `fineDateTime` | `violationDate` | ✅ |
| `authority` | `authorityCode` + `authorityName` (implied via fineSourceName) | ✅ |
| `fineDescription` | `violationDescriptionEn` + `violationDescriptionAr` | ✅ better (bilingual) |
| `isPaid` | `status` ∈ {UNPAID, PAID, DISPUTED} | ✅ richer enum |
| `vehicleId/movementId` | `vehicleId` + `contractId` (matched) | ✅ |
| `agreementNo` | derive via `contract.contractNumber` | ✅ |
| `movementContact` (jsonb) | `customerId` FK + `rawData` | ⚠ no inline snapshot — must JOIN |
| `confiscationCharges` | NOT YET | ❌ gap |
| `acknowledgment` | NOT YET | ❌ gap |
| `surcharge` | computed via `tars_charge_config` | ✅ deferred |
| `amountWithSurcharge` | computed at billing time | ✅ deferred |
| `collectedAmount` / `due` | derive via `invoices.paidAmount/balanceAmount` | ✅ |
| `invoiceVoucherNo` | `invoiceId` FK → `invoices.invoiceNumber` | ✅ |
| `debitJvVoucherNo` | NOT YET — Vesla EOD billing posts directly to GL | ⚠ gap |
| `server` | `fineSourceCode` / `fineSourceName` | ✅ |
| `receiptDateTime` / `receiptNo` | NOT YET — `tars-rta-payments.service.ts` may have | ⚠ verify |
| `latitude` / `longitude` | NOT YET | ❌ gap |
| `blackPoints` | NOT YET | ❌ gap |
| `isAddedManually` | NOT YET | ❌ gap |
| `lateCharges` | computed via `tars_charge_config.latePaymentEnabled` | ✅ deferred |
| `customValueField1/2` | use `rawData` jsonb | ✅ Vesla-better pattern |

**Recommended `tars_fines` enrichment:**
```sql
ALTER TABLE tars_fines ADD COLUMN confiscation_charges DECIMAL(10,2) DEFAULT 0;
ALTER TABLE tars_fines ADD COLUMN acknowledgment_fee DECIMAL(10,2) DEFAULT 0;
ALTER TABLE tars_fines ADD COLUMN late_charges DECIMAL(10,2) DEFAULT 0;
ALTER TABLE tars_fines ADD COLUMN black_points INT DEFAULT 0;
ALTER TABLE tars_fines ADD COLUMN latitude DECIMAL(10,6);
ALTER TABLE tars_fines ADD COLUMN longitude DECIMAL(10,6);
ALTER TABLE tars_fines ADD COLUMN is_added_manually BOOLEAN DEFAULT FALSE;
ALTER TABLE tars_fines ADD COLUMN ignored BOOLEAN DEFAULT FALSE;
ALTER TABLE tars_fines ADD COLUMN ignored_reason TEXT;
ALTER TABLE tars_fines ADD COLUMN ignored_at TIMESTAMPTZ;
ALTER TABLE tars_fines ADD COLUMN ignored_by_user_id UUID;
ALTER TABLE tars_fines ADD COLUMN movement_id UUID;                    -- attribution to spd_movements
ALTER TABLE tars_fines ADD COLUMN movement_contact JSONB;              -- inline snapshot pattern
ALTER TABLE tars_fines ADD COLUMN debit_jv_id UUID;                    -- when EOM JV is implemented
ALTER TABLE tars_fines ADD COLUMN govt_receipt_no VARCHAR;
ALTER TABLE tars_fines ADD COLUMN govt_receipt_date_time TIMESTAMPTZ;
ALTER TABLE tars_fines ADD COLUMN bill_paid BOOLEAN;
CREATE INDEX idx_tars_fines_ignored ON tars_fines(company_id, ignored);
CREATE INDEX idx_tars_fines_movement ON tars_fines(movement_id);
```

Per protocol §4 — separate isolated migration card.

---

### Gap analysis: `darb_fines` (Vesla native line 13403) vs Speed `fines` (Abu Dhabi rows)

Vesla `darb_fines` is similar to `tars_fines` but slimmer:

| Speed field | Vesla `darb_fines` field | Status |
|---|---|---|
| Standard linkage (contractId, customerId, invoiceId, billId, matchedAt, billedAt) | ✅ | |
| `acknowledgment`, `surcharge`, `lateCharges`, `confiscationCharges` | NOT YET | ❌ gap |
| `movementContact` snapshot | NOT YET | ❌ gap |
| `tarsVehicleDid` analog (Darb vehicle DID) | covered by `darb_vehicles.tagNo` join | ✅ |
| `blackPoints` | NOT YET | ❌ gap |

**Recommended `darb_fines` enrichment:** mirror the `tars_fines` ALTER list above.

---

### Gap analysis: `parkin_fines` (Vesla native line 13536)

Slim. Same pattern. Gaps mirror `tars_fines` recommendations.

---

## Source citations

| Claim | Source |
|---|---|
| 62 `uaeFine` endpoints | proxy lines 20599–21111 |
| 11 `trafficFine` endpoints | proxy lines 20495–20583 |
| Row shape | `fines-list.json` (4 rows) |
| Filter envelope | `GetFinesReport-request.json` |
| Filter dropdown sources | `GetFiltersData-response.json` |
| Server-side class name | `fines-report2.json` (NullRef stack: `Speed.Fines.UaeFineAppService.GetFinesReport line 1082`) |
| Vesla `spd_fines` | schema.prisma:21371 |
| Vesla `tars_fines` | schema.prisma:12982 |
| Vesla `darb_fines` | schema.prisma:13403 |
| Vesla `parkin_fines` | schema.prisma:13536 |
