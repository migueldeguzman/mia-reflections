# fine — State Machine

> Per-entity (Speed `fines`). Sources: `fines-list.json` row shape, `uaeFine` endpoint set, behavior.md §5 rules.

---

## States

Speed encodes fine state via multiple booleans + financial breakdown rather than a single `status` enum. Logical states:

| Logical state | Indicator | Definition |
|---|---|---|
| **Imported (Unattributed)** | `vehicleId NOT NULL` AND `movementId IS NULL` | Pulled from RTA portal; vehicle resolved by plate but no active movement matched. |
| **Pending Vehicle** | `vehicleId IS NULL` | Plate didn't match any fleet vehicle (ambiguous plate or vehicle already defleeted). Surfaced via `finesWithFailedVehicleMappings` filter. |
| **Attributed** | `movementId NOT NULL` AND `chargedAmmount = 0` AND `invoiceVoucherNo IS NULL` | Matched to movement; not yet billed. |
| **Charged** | `chargedAmmount > 0` AND `invoiceVoucherNo NOT NULL` AND `due > 0` | Customer invoice generated; not yet paid. |
| **Paid (by Customer)** | `collectedAmount >= chargedAmmount` AND `due = 0` | Customer paid the invoice. |
| **Paid (by Government)** | `isPaid = true` AND `receiptNo NOT NULL` AND `billPaid = true` | Government received payment from us (separate from customer payment). |
| **Ignored** | `ignored = true` | Excluded from billing — operator decision. |
| **Disputed** | (no dedicated flag — operator notes; ⚠ uncertain — possibly via `debitJvStatus` filter) | Customer challenges; held from collection. |
| **Late** | `due > 0` AND `lateCharges > 0` | Past RTA due date; government accrued late fee. |
| **Reconciled** | `invoiceVoucherNo NOT NULL` AND `debitJvVoucherNo NOT NULL` AND `billNo NOT NULL` AND `billPaid = true` AND `collectedAmount >= chargedAmmount` | Three-way reconciliation complete (invoice + JV + bill + customer payment + government payment). |

---

## Transition diagram (logical)

```
                        RTA portal pull
                         (SaveFinesInBulk)
                                │
                                ▼
                       ┌─────────────────┐
                       │  Imported (Unat.)│  ── plate unknown ──▶ ┌────────────────┐
                       └────────┬─────────┘                       │ Pending Vehicle│
                                │                                 └────┬───────────┘
              ProcessFines      │                                       │
                                ▼                                       │ AttachVehicleWithFine
                         ┌─────────────┐                                │
              ┌──────────│ Attributed  │◀───────────────────────────────┘
              │          └──────┬──────┘
              │                 │
              │                 │ ProcessFines / CreateInvoiceFromTrafficFine
              │                 ▼
              │          ┌─────────────┐
              │          │   Charged   │
              │          └──────┬──────┘
              │                 │
              │  ┌──────────────┼─────────────┐
              │  │              │             │
              │  ▼              ▼             ▼
              │ Paid(Customer)  Disputed     Late
              │  │              │             │
              │  │              │             ▼
              │  │              │            Charged (RTA late fee added)
              │  │              │             │
              │  │              ▼             │
              │  │           DetachFinesFromInvoice ── back to Attributed
              │  │
              │  └─▶ Government bill generated (generateFineBill)
              │      → Bill paid (POST receipt) → Reconciled
              │
              └─▶ IgnoreFine ── Ignored ──▶ UnIgnoreFine ── Attributed
```

---

## Transition table

| From | Event | To | Guard | Side effect |
|------|-------|-----|-------|-------------|
| (none) | RTA portal returns new fine | Imported (Unattributed) | tenant has TARS creds + traffic file binding | INSERT fine row with `vehicleId` resolved by plate |
| Imported | `vehicleId IS NULL` | Pending Vehicle | plate didn't match fleet | row stays; surfaced in `finesWithFailedVehicleMappings` |
| Pending Vehicle | Operator selects vehicle | Attributed (or Imported) | `AttachVehicleWithFine` | sets `vehicleId`; if movement found → Attributed; else stays Imported |
| Imported | `ProcessFines` runs | Attributed | active movement at `fineDateTime` exists | sets `movementId`, `agreementNo`, `agreementCustomerName`, `movementContact` snapshot |
| Imported | `IgnoreFine` | Ignored | operator | sets `ignored=true` |
| Attributed | Operator manual override | Attributed (different movement) | `UpdateFineWithAgreementNo` | sets new `movementId` etc. |
| Attributed | `ProcessFines` invoicing pass | Charged | customer not blacklisted, surcharge config valid | calculates `surcharge`, `amountWithSurcharge`, `acknowledgment`, posts invoice; sets `chargedAmmount`, `invoiceVoucherNo`, `invoiceDueAmount`, `due`, `invoiceDate` |
| Charged | Customer payment received | Paid (Customer) | `collectedAmount >= chargedAmmount` | `due=0` |
| Charged | RTA due date passed, govt charges late fee | Late (still Charged) | `lateCharges > 0` from portal pull | `lateCharges` updated |
| Charged | Customer disputes | Disputed | operator sets dispute | held from collection (manual flow) |
| Charged | `DetachFinesFromInvoice` | Attributed | operator | clears `invoiceVoucherNo`, `chargedAmmount`, `invoiceDueAmount` |
| Attributed / Charged | `IgnoreFine` | Ignored | operator | sets `ignored=true`; if Charged, also `DetachFinesFromInvoice` first |
| Ignored | `UnIgnoreFine` | Attributed | operator | clears `ignored`; back to Attributed |
| Charged | Govt-side payment marked | Paid (Govt) | `MarkFinesPaidByTFID` or `SaveReceiptRTA` | sets `isPaid=true`, `receiptNo`, `receiptDateTime`, `billPaid=true` |
| Paid (Customer) + Paid (Govt) | All vouchers issued | Reconciled | three-way match (`GetFineReconciliation`) | (terminal-ish; reports tag as ✓) |
| ANY (mid-state) | RTA changes amount | (state unchanged; flagged) | `GetMissingFinesWithAmountChanges` | flagged for operator approval |
| ANY | Operator action | (state unchanged) | logged via `CreateFineLog` | audit trail row inserted |

---

## Invariants

- **I-1:** A fine MUST always carry the original RTA `fineNo` — never overwritten on update.
- **I-2:** `chargedAmmount` is set ONLY by `ProcessFines` / `ChargeTrafficFineNew` / `CreateInvoiceFromTrafficFine` — never by manual edit (per audit integrity).
- **I-3:** `surcharge` is computed from `movementContact.fineSurcharge` at charge time, NOT from current customer profile. (Snapshot pattern — R-011.)
- **I-4:** A fine in Ignored state MUST NOT have an active `invoiceVoucherNo` — `IgnoreFine` calls `DetachFinesFromInvoice` first if needed.
- **I-5:** `vehicleId` may be set without `movementId` (vehicle resolved but no active movement at fineDateTime); the inverse is forbidden (cannot have movementId without vehicleId).
- **I-6:** Pending-Vehicle state is tenant-scoped; cross-tenant plate ambiguity is NOT auto-resolved (multi-tenant safety).
- **I-7:** Reconciled is a derived state — not stored as a column. Reports compute it on read.
- **I-8:** Disputed is operator-driven — Speed has no system-level dispute workflow. Vesla improvement: add `disputeStatus` enum + audit trail.

---

## Vesla mapping notes

Vesla `tars_fines.status` enum: `UNPAID, PAID, DISPUTED`. Maps to logical states:
- Vesla `UNPAID` covers Speed's Imported / Attributed / Charged / Late.
- Vesla `PAID` covers Speed's Paid (Customer) AND Paid (Govt) — Vesla doesn't distinguish.
- Vesla `DISPUTED` covers Speed's Disputed.

**Gap:** Vesla cannot distinguish "Imported but unattributed" vs "Attributed but uninvoiced" vs "Invoiced unpaid" using `status` alone. Workaround: check `contractId IS NULL` (= Imported), `invoiceId IS NULL` (= Attributed), `invoiceId NOT NULL AND <invoice.balanceAmount > 0>` (= Charged unpaid).

**Recommended:** add columns to `tars_fines` per schema.md ALTER list:
- `ignored BOOLEAN`
- `is_added_manually BOOLEAN`
- `bill_paid BOOLEAN`
- `govt_receipt_no` / `govt_receipt_date_time`

Then logical state derivation becomes single-row.

Vesla's matching engine (`tars-match.service.ts`) is **closer to Speed's `ProcessFines` attribution half** than the spec stub suggested — uses `resolveVehiclePossessor` for movement-aware lookup. Already excellent; doesn't need rework.

Vesla's billing engine (`tars-billing.service.ts:invoiceFine`) is **the equivalent of `ProcessFines` invoicing half + `CreateInvoiceFromTrafficFine`**, with proper VAT-on-surcharge-only and government AP bill creation. Already excellent.

The gap is **state visibility / reporting / explicit ignore + dispute / late-fee tracking**, not the core flow.

---

## Open Questions

- Q1: How does Speed decide "active movement" tie-breaker when two movements (e.g. agreement + workshop) overlap at violation time?
- Q2: Does `MarkFinesPaidByTFID` require all fines on the traffic file to be paid, or any-paid sets the flag?
- Q3: `DetachFinesFromInvoice` — what happens to the underlying invoice (delete row vs negative line vs credit note)?
- Q4: `debitJvStatus` filter in the request envelope — what enum?
- Q5: Disputed flow — fully manual in Speed, or does `IgnoreFine` double as dispute hold?
