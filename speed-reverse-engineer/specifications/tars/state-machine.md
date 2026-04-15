# tars — State Machine

> Per-entity (`tars_postings`). Sources: bundle status enum (218747–218774), error type enum (219421–219430), retry dispatcher (219106–219119), grace-period guard (219065–219077), Azure poller flow (219200–219207).

---

## Entity: `tars_postings`

### States (from `status` int enum)

| id | name | terminal? | actor that sets |
|----|------|-----------|-----------------|
| 0 | Pending | no | Speed (insert on Speed-side movement event) |
| 1 | Queued | no | Azure poller (after pickup confirms RTA accepted submission) |
| 2 | Picked | no | Azure poller (RTA acknowledges receipt) |
| 3 | Wait | no | Azure poller (RTA processing, response not yet ready) |
| 4 | Error | no (retryable) | Azure poller / RTA response |
| 5 | Success | YES | Azure poller (RTA returned 2xx) |
| 6 | Expired | no (retryable, narrow window) | Azure poller (RTA-side validity expired) |
| 7 | Ignored | YES | Operator (`SaveTarsPostingIgnoreReason`) |
| 8 | Grace Period Expired | no (retryable with manual confirm) | Operator-triggered transition (movement >3h old at attempt) |

---

### Transition diagram

```
     ┌──────────────────────────────────────────────────────────────┐
     │  Speed movement event (rental open / close / replace / ...)   │
     └──────────────────────────────┬───────────────────────────────┘
                                    ▼
                              ┌──────────┐
                              │  0 Pending │
                              └────┬─────┘
                  Azure picks up   │
                                   ▼
                              ┌──────────┐
                              │ 1 Queued  │
                              └────┬─────┘
                                   │
                                   ▼
                              ┌──────────┐
                              │ 2 Picked  │
                              └────┬─────┘
                                   │
                                   ▼
                              ┌──────────┐
                              │ 3 Wait    │ ── retry-from-RTA ──┐
                              └────┬─────┘                       │
              RTA response arrives │                              │
                ┌──────────────────┼──────────────────┐          │
                ▼                  ▼                  ▼          │
        ┌───────────┐      ┌────────────┐     ┌──────────┐      │
        │ 5 Success │◄─────│  4 Error   │◄────│ 6 Expired │      │
        └───────────┘      └────────────┘     └──────────┘      │
            (terminal)         │   ▲                ▲            │
                               │   │ retry          │            │
                               │   └─── createOrUpdateAgreementInputForTars
                               │       (perm: Page.TARS.TARSPostingStatus.Retry)
                               │
                               │  saveTarsPostingIgnoreReason
                               ▼
                          ┌───────────┐
                          │ 7 Ignored │  (terminal)
                          └───────────┘

  ┌──────────────────────────────────────────────────────────────┐
  │  ANY non-terminal state, age > 3h since movementDateTime →    │
  │  on next operator interaction the row may be flipped to       │
  │  8 Grace Period Expired (UI requires confirm before retry).   │
  └──────────────────────────────────────────────────────────────┘
```

---

### Transition table

| From | Event | To | Guard | Side effect |
|------|-------|----|-------|-------------|
| (none) | Speed movement event emitted | 0 | tenant TARS active + customer not in `customersToIgnore` + traffic file not in `ignoredTrafficFileIds` | INSERT row + assign `tarsBatchId` |
| 0 | Azure poller picks up | 1 | `getTarsPostingsForAzureJob` returns this id | submit to RTA |
| 1 | RTA accepts submission | 2 | RTA 2xx ack | record submission ack |
| 2 | RTA acknowledges receipt | 3 | second poll round confirms processing | continue polling |
| 3 | RTA returns final response (success) | 5 | `errorType=null` | `noOfTries++`, write tarsReference back to agreement |
| 3 | RTA returns final response (error) | 4 | `errorType ∈ {1,3,4}` | `noOfTries++`, persist `error` + `errorType` |
| 3 | Azure detects RTA validity expired | 6 | TARS API returns expired-window code | `noOfTries++` |
| 4 | Operator clicks Retry | back to 0 (rebuilt) | `Page.TARS.TARSPostingStatus.Retry` perm + `(speedOperation, tarsOperation) ∈ {(1,1),(2,2),(5,4),(4,3)}` | calls `CreateOrUpdateAgreementInputForTars` (or close/replacement variant) |
| 4 | Operator marks Ignored | 7 | reason text supplied | `SaveTarsPostingIgnoreReason` |
| 6 | Operator clicks Retry | back to 0 (rebuilt) | same as 4 | same as 4 |
| 0 / 4 / 6 | Movement age > 3h, operator interacts | 8 | client-side check `moment.utc().diff(movementDateTime, 'hours') >= 3` | UI confirm prompt; on accept calls Azure `/api/UpdatePosting` directly |
| 8 | Confirm accepted | (Azure-determined: 1, 4, or stays 6) | confirm received | hits Azure Function bypass |
| 8 | Operator marks Ignored | 7 | reason text supplied | same |
| ANY | Manual document attach | (state unchanged) | "Pending for attachment" / "Pending for Replacement's Attachment" was the reason | `SaveDocuments`; next retry now passes |

---

### Invariants

- **I-1:** A posting must always have `(speedOperation, tarsOperation)` set; both are required for retry dispatching.
- **I-2:** Terminal states are 5 (Success) and 7 (Ignored). All other states are recoverable.
- **I-3:** `noOfTries` is monotonic — never resets on transitions, only on row recreate.
- **I-4:** A retry MUST use `tarsBatchId` from the original posting so RTA correlates the attempt with the previous submission.
- **I-5:** Agreement lifecycle is NEVER blocked by TARS state — agreement may be ACTIVE while posting is Error/Expired/Pending.
- **I-6:** A posting with `error == "Pending for attachment"` cannot transition out of 4/6 until `documents[].length > 0`.
- **I-7:** Customers in `customersToIgnore[]` MUST never have a posting row inserted (R-006); this is a pre-state guard, not a transition.

---

### Vesla mapping notes

- Vesla's `spd_tars_postings.status` is a string today; map to the int enum on read (or migrate per schema.md).
- Vesla's planned native `tars_postings.statusCode` (schema.md §Recommended) MUST honor the same int values to keep parity with downstream consumers.
- Vesla's retry dispatcher must cover ALL 13 SpeedOperation pairs (Speed wires only 4 — see behavior.md §7 #3).
- Vesla replaces Azure Function poll with `vesla-tars-fines-worker` cron (5-min). The worker MUST drive transitions 1→2→3→5/4/6 itself.
- Vesla "Try Posting" button (UI manual refresh) replaces the direct-Azure call with a `POST /api/tars-dashboard/postings/:id/refresh` endpoint that internally hits the worker's status-pull function.

---

## Open Questions

- Q1: Speed-side definition of "Wait" vs "Picked" — is `Picked` always followed by `Wait`, or can `Picked → Success` skip `Wait`?
- Q2: Does Speed re-create the row on retry, or update in place? Bundle 219123–219136 reads as in-place update — confirm by network trace.
- Q3: The `tarsBatchId` — is it server-generated on first build, or operator-supplied? Speed UI never exposes a generator.
- Q4: Document attach side-effect — does it auto-trigger retry or wait for next poll?
