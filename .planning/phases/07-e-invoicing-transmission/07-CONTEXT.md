# Phase 7 Context: E-Invoicing Transmission and Processing

## Overview

Phase 7 connects Vesla ERP to the UAE DCTCE e-invoicing platform, enabling real-time transmission of e-invoices generated in Phase 6. This phase implements ASP integration, status tracking, failure handling, and export capabilities for the July 2026 pilot.

---

## Decisions

### 1. ASP/DCTCE Connection Model

**Decision:** Support both direct DCTCE and ASP routing — tenant choice

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Connection Mode | Dual-mode (Direct DCTCE + ASP) | Some tenants have existing ASP relationships; others prefer direct FTA integration |
| Provider Interface | Abstract `ITransmissionProvider` | Single interface implemented by `DctceProvider` and `AspProvider` |
| Tenant Configuration | `transmission_mode` enum in compliance config | DIRECT_DCTCE, ASP_PROVIDER, or SANDBOX |
| Sandbox Strategy | FTA Sandbox only | No local mock layer — use FTA's official sandbox for all pre-production testing |
| Credential Management | Admin-configured per tenant | API keys/certificates stored in tenant's compliance settings (encrypted) |
| Connection Health | Dashboard widget | Real-time indicator showing DCTCE/ASP connectivity status |

**ASP Provider Pattern:**
```
Tenant Config → ITransmissionProvider (interface)
                    ├── DctceDirectProvider (FTA direct)
                    ├── AspProvider (routes through ASP)
                    └── SandboxProvider (FTA sandbox)
```

### 2. Transmission Status & Notifications

**Decision:** FTA-aligned status states with email alerts for critical events

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Status Model | FTA-aligned states | Match DCTCE response vocabulary for clarity |
| Status Flow | DRAFT → QUEUED → TRANSMITTING → PENDING_CLEARANCE → CLEARED / REJECTED | Mirrors FTA processing pipeline |
| Notification Method | Email for critical + in-app for routine | Rejections/failures warrant email; routine status in-app |
| Queue View | Dashboard widget + dedicated page | Widget for quick glance, page for bulk operations |
| Timing Granularity | Full audit trail | Every status transition logged (required for FTA compliance) |

**E-Invoice Status Enum:**
- `DRAFT` — Generated, not yet submitted
- `QUEUED` — In transmission queue
- `TRANSMITTING` — Currently being sent to DCTCE/ASP
- `PENDING_CLEARANCE` — Received by FTA, awaiting clearance
- `CLEARED` — Successfully cleared by FTA
- `REJECTED` — Rejected with validation errors
- `FAILED` — Transmission failure (network, auth, etc.)

### 3. Failure Handling & Retry Behavior

**Decision:** Automatic retry with exponential backoff, manual intervention for rejections

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Transmission Failures | Auto-retry 3x with exponential backoff | Network issues are transient; 1s → 4s → 16s delays |
| Validation Rejections | No auto-retry — require correction | FTA rejections need human review of validation errors |
| Max Retry Window | 24 hours | After 24h, mark as FAILED for manual review |
| Retry Visibility | Show retry count and next attempt time | Users know what's happening without needing to act |
| Rejection Details | Store full FTA error response | Display validation errors with field-level mapping |
| Batch Failures | Partial success allowed | If batch has 10 invoices and 2 fail, 8 proceed |

**Retry Strategy:**
```
Attempt 1 → Wait 1s → Attempt 2 → Wait 4s → Attempt 3 → Wait 16s → FAILED
```

**Rejection Handling Flow:**
1. Receive rejection from DCTCE/ASP
2. Parse validation errors (TDD violations, schema issues)
3. Map errors to invoice fields where possible
4. Set status to REJECTED with error details
5. Email notification to invoice creator
6. Allow correction and resubmission as new transmission

### 4. Export Flexibility & Use Cases

**Decision:** XML primary (FTA standard), JSON for API integration, bulk export supported

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Primary Format | PINT-AE XML | FTA standard — what gets transmitted |
| Secondary Format | JSON (UBL-mapped) | API consumers prefer JSON; map from UBL structure |
| Export Scope | Single + bulk (date range, status filter) | Accountants need bulk export for external systems |
| Export Access | Download + API endpoint | UI download button + REST endpoint for integration |
| Archive Inclusion | Include archived invoices | Export from archive for 7-year retention queries |
| Metadata | Include transmission status and timestamps | Exports show when submitted, cleared, etc. |

**Export Endpoints:**
- `GET /api/einvoice/:id/export?format=xml|json` — Single invoice
- `POST /api/einvoice/export` — Bulk export with filters (date range, status, format)

---

## Technical Constraints

### From Phase 6 (E-Invoice Core)
- E-invoices already generated as PINT-AE XML (PintAeBuilderService)
- QR codes embedded with TLV encoding
- Archives use hash chain for tamper-proofing
- `einvoice_archives` table stores generated invoices

### DCTCE API Integration
- UAE DCTCE uses REST API (not SOAP)
- Authentication: OAuth 2.0 with client credentials
- Rate limits: TBD from FTA documentation
- Sandbox available for pilot participants

### ASP Integration
- ASPs provide their own API specs
- Common pattern: REST with API key auth
- May require different data formats (ASP-specific mapping)

---

## Deferred Ideas

None captured — all discussion items within phase scope.

---

## Next Steps

1. **Research Phase** — Investigate DCTCE API specification, ASP integration patterns
2. **Plan Phase** — Create detailed implementation plans for 4 requirements

---

## Revision History

| Date | Change | Author |
|------|--------|--------|
| 2026-01-25 | Initial context from discussion | Claude |
