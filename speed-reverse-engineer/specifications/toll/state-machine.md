# toll — State Machine

> Per-entity (Speed `tolls` — Salik, Darb, Parking under one schema). Sources: `toll` endpoint set, `spd_tolls` mirror columns, behavior.md §5 rules.

---

## States

Speed encodes toll state via multiple booleans + financial breakdown rather than a single enum. Logical states:

| Logical state | Indicator | Definition |
|---|---|---|
| **Imported (Unattributed)** | `vehicleId NOT NULL` AND `movementId IS NULL` | Pulled from portal; vehicle resolved by plate; no active movement at passageTime. |
| **Pending Vehicle** | `vehicleId IS NULL` | Plate didn't match any fleet vehicle (defleet, unregistered, or external-vehicle). |
| **Pending External** | `isExternalVehicle = true` | Plate confirmed non-fleet — refund-from-portal candidate. |
| **Attributed** | `movementId NOT NULL` AND `chargedAmount = 0` AND `invoiceVoucherNo IS NULL` | Matched to movement; not yet billed. |
| **Charged** | `chargedAmount > 0` AND `invoiceVoucherNo NOT NULL` AND `due > 0` | Customer invoice generated; not yet paid. |
| **Paid** | `due = 0` AND `chargedAmount > 0` | Customer paid. |
| **Ignored** | `ignored = true` | Excluded from billing. |
| **Disputed** | (no dedicated flag — operator notes; ⚠) | Customer challenges; held. |
| **Late** | `due > 0` AND `passageTime < NOW() - N_DAYS` (typically 30) | Past late-bill threshold. |
| **Reconciled** | `invoiceVoucherNo NOT NULL` AND (debit JV posted OR EOM run complete) AND portal-side count matches local count | Three-way reconciliation. |

---

## Transition diagram (logical)

```
                  Browser-extension scrape
                  (SaveTollsInBulk per Salik account)
                                │
                                ▼
                       ┌─────────────────┐
                       │ Imported (Unat.)│ ── plate unknown ──▶ ┌────────────────┐
                       └────────┬─────────┘                      │ Pending Vehicle│
                                │                                └────┬───────────┘
                                │                                     │
              ProcessTolls      │            AttachVehicleForDarb     │
                                ▼            (or Salik manual)        │
                         ┌─────────────┐◀──────────────────────────────┘
                ┌────────│ Attributed  │
                │        └──────┬──────┘
                │               │
                │               │ ProcessTolls (invoicing pass)
                │               │   - per-crossing OR aggregated
                │               │   - per `tollAggregation` config
                │               ▼
                │        ┌─────────────┐
                │        │   Charged   │── due = 0 ──▶  Paid
                │        └──────┬──────┘
                │               │
                │     Operator: │ DetachTollsFromInvoice
                │               ▼
                │        Attributed
                │
                ├─▶ IgnoreFine-equivalent ── Ignored
                │
                ├─▶ Mark as External ── Pending External
                │   (refund claim filed)
                │
                ▼
             RTA wallet topup paid (out-of-band)
                │
                ▼
             Reconciled
                ▲
                │ portal-count == local-count == invoiced-count
                │ (GetSalikReconciliation passes)
                │
```

---

## Transition table

| From | Event | To | Guard | Side effect |
|---|---|---|---|---|
| (none) | Browser extension downloads a crossing | Imported (Unattributed) | tenant has Salik account active | INSERT toll row; `vehicleId` resolved by `tagNo` → tag→plate→vehicle |
| Imported | tag has no current vehicle assignment | Pending Vehicle | `vehicleId IS NULL` | row stays; surfaced in unattributed report |
| Pending Vehicle | Operator confirms non-fleet | Pending External | operator clicks "External" | sets `isExternalVehicle=true`; refund process kicks in |
| Pending Vehicle | Operator selects fleet vehicle | Imported (or Attributed) | `AttachVehicleForDarb` (Darb) / Salik manual | sets `vehicleId`; if movement exists → Attributed |
| Imported | `ProcessTolls` runs | Attributed | active movement at `passageTime` exists | sets `movementId`, `agreementNo`, `customer*`, `salesPerson` |
| Imported | `IgnoreFine`-equivalent | Ignored | operator | sets `ignored=true` |
| Attributed | Operator manual override | Attributed (different movement) | `SaveAndUpdateAgreementNo` / `UpdateTollsAgreement` | sets new `movementId` etc. |
| Attributed | `ProcessTolls` invoicing pass (per-crossing) | Charged | customer not blacklisted, surcharge config valid | calculates `surcharge`, `amountWithSurcharge`, posts invoice |
| Attributed | `ProcessTolls` invoicing pass (aggregated) | Charged (waits for cycle boundary) | `tollAggregation = DAILY/WEEKLY/MONTHLY` | accumulates until cycle end, then bulk invoice |
| Charged | Customer payment received | Paid | `collectedAmount >= chargedAmount` | `due=0` |
| Charged | Past late threshold | Late (still Charged) | `passageTime < NOW() - 30d` AND `due > 0` | flagged for `GetLateSalikTollReport` |
| Charged | Customer disputes | Disputed | operator | held from collection (manual flow) |
| Charged | `DetachTollsFromInvoice` | Attributed | operator | clears `invoiceVoucherNo`, `chargedAmount` |
| Attributed / Charged | Ignore | Ignored | operator | sets `ignored=true`; if Charged, also `DetachTollsFromInvoice` |
| Ignored | UnIgnore | Attributed | operator | clears `ignored` |
| Charged | EOM JV posted | Charged (with `debitJvVoucherNo`) | `ProcessTollsMonthEndPosting` / `ProcessDarbsMonthEndPosting` | sets `debitJvVoucherNo` |
| Pending External | Refund received from portal | (terminal-ish) | manual operator action | optionally archives |
| ANY | Re-download (dedup) | (state unchanged) | `(tenantId, tollId)` already present | UPSERT (no row created) |
| ANY | Operator action | (state unchanged) | logged via audit | audit trail entry |

---

## Invariants

- **I-1:** `tollId` per portal is unique per tenant. Re-download MUST upsert, not insert.
- **I-2:** `chargedAmount` is set ONLY by `ProcessTolls` / aggregator — never by manual edit.
- **I-3:** `surcharge` is computed from `customer.tollSurcharge` (or `darbTollSurcharge`) at charge time — snapshot.
- **I-4:** `tagNo` may map to different vehicles over time (defleet/onfleet); attribution MUST use `passageTime`-aware tag→vehicle lookup (per `salik_tags` history).
- **I-5:** A Pending External toll MUST NOT be invoiced to any customer.
- **I-6:** Aggregated invoicing (DAILY/WEEKLY/MONTHLY) holds Attributed tolls until cycle boundary; on early customer return, still bills accumulated.
- **I-7:** `salikAccountId` is required on every toll — every crossing belongs to one Salik account.
- **I-8:** Reconciled is a derived state — not stored.

---

## Vesla mapping notes

Vesla `tars_salik.status` enum: `UNBILLED, BILLED, PAID`. Maps to:
- Vesla `UNBILLED` covers Speed's Imported / Attributed (cannot distinguish — same gap as fines).
- Vesla `BILLED` covers Speed's Charged / Late.
- Vesla `PAID` covers Speed's Paid.

Vesla `darb_transactions.status` enum: same `UNBILLED, BILLED, PAID`.

**Gap:** Vesla cannot distinguish:
- Imported vs Attributed (use `contractId IS NULL` vs NOT NULL workaround)
- Pending External (need column)
- Late (compute from `passageTime < now - 30d AND status='BILLED'`)
- Reconciled (compute from portal-count vs local-count)

**Recommended:** add `is_external_vehicle`, `ignored`, `latitude`, `longitude` per schema.md ALTER list.

Vesla `tars-period-billing.processTollBilling` already handles the aggregated-invoicing pattern — period-aware (daily/weekly/monthly per contract `rateType`). This is **better than Speed's tenant-wide setting** (per-contract control). Preserve.

Vesla `tars-match.matchUnmatchedSalik` covers the attribution transition (Imported → Attributed). Already excellent.

---

## Open Questions

- Q1: Speed late-toll threshold — 30 days hard-coded or configurable? Bundle decomp.
- Q2: External-vehicle refund workflow — does Speed file the refund automatically with Salik portal?
- Q3: Aggregation cycle boundary — Speed tenant-wide setting vs Vesla per-contract `rateType`. Reconcile semantics.
- Q4: Tag↔vehicle reassignment — is `salik_tags` a real Speed table or computed?
- Q5: `daysToReconcile` operator workflow — what triggers a reconcile vs auto-scrape?
