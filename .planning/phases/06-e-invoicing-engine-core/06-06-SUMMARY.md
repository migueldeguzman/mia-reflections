---
phase: 06
plan: 06
subsystem: e-invoicing
tags: [orchestration, einvoice, asp-client, pint-ae, di-container]
dependency-graph:
  requires: [06-02, 06-03, 06-04, 06-05]
  provides: [einvoice-orchestration, asp-client-interface, di-registration]
  affects: [06-07, 06-08, phase-7-asp-integration]
tech-stack:
  added: []
  patterns: [orchestrator-pattern, interface-segregation, stub-for-future]
key-files:
  created:
    - backend/src/services/einvoice/einvoice.service.ts
    - backend/src/services/einvoice/asp-client.interface.ts
  modified:
    - backend/src/services/einvoice/index.ts
    - backend/src/config/types.ts
    - backend/src/config/container.ts
decisions:
  - id: orchestration-order
    choice: "QR code generated FIRST, then embedded in XML"
    rationale: "QR contains invoice hash, but hash changes if QR embedded - generate initial QR, embed, then regenerate final QR with hash"
  - id: asp-stub-pattern
    choice: "Interface + Stub for Phase 7"
    rationale: "Allows Phase 6 to compile and test without ASP connectivity; Phase 7 rebinds to real implementation"
  - id: audit-action-reuse
    choice: "Use existing EINVOICE_GENERATE audit action"
    rationale: "Consistent with Phase 2 audit framework; already in AuditAction enum"
  - id: singleton-scope-di
    choice: "All e-invoice services bound as singleton"
    rationale: "Stateless services; single instance per application reduces memory and improves performance"
metrics:
  duration: ~15m
  completed: 2026-01-24
---

# Phase 6 Plan 06: E-Invoice Orchestration Service Summary

**One-liner:** Main EInvoiceService orchestrating QR code, PINT AE XML, validation, and archival with AspClientStub for Phase 7 integration.

## What Was Built

### 1. ASP Client Interface (`asp-client.interface.ts`)

Interface for Accredited Service Provider (ASP) communication:
- `IAspClient` interface with 5 methods: submitEInvoice, checkStatus, cancelSubmission, testConnection, isConfigured
- `AspClientStub` implementation returning "not configured" for all operations
- Request/result types: `AspSubmissionRequest`, `AspSubmissionResult`, `AspStatusResult`
- Ready for Phase 7 to rebind with actual ASP implementation

### 2. E-Invoice Orchestration Service (`einvoice.service.ts`)

Main service coordinating all e-invoice sub-services:
- **generateEInvoice()**: Complete invoice generation flow
  1. Generate QR code with TLV encoding (QrCodeService)
  2. Build PINT AE XML with embedded QR (PintAeBuilderService)
  3. Validate XML (UblValidatorService) - blocks archiving if invalid
  4. Archive in Prisma transaction (EInvoiceArchiveService)
  5. Create audit log with EINVOICE_GENERATE action
  6. Optionally submit to ASP (Phase 7)
- **generateCreditNote()**: Credit note generation with original invoice reference
- **submitToAsp()**: Manual submission for existing archives
- **validateForEInvoice()**: Pre-flight validation before generation
- **Utility methods**: getEInvoice, getEInvoiceByNumber, listEInvoices, verifyIntegrity, getStatistics

### 3. DI Container Registration

Type symbols added to `types.ts`:
- `QrCodeService`, `PintAeBuilderService`, `UblValidatorService`
- `EInvoiceArchiveService`, `EInvoiceService`, `AspClient`

Container bindings added to `container.ts`:
- All 6 e-invoice services bound as singletons
- `AspClient` bound to `AspClientStub` (Phase 7 will rebind)

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Orchestration order | QR first, then XML, then validate, then archive | QR needs to be embedded in XML; validation must pass before archiving |
| ASP interface pattern | Interface + Stub | Compile-time safety now, runtime flexibility for Phase 7 |
| Transaction scope | Single Prisma transaction for archive + audit | Atomicity ensures both succeed or both fail |
| Audit action | EINVOICE_GENERATE | Reuses existing Phase 2 audit framework |
| DI scope | Singleton for all services | Stateless services; memory efficient |

## Files Created/Modified

**Created:**
- `backend/src/services/einvoice/asp-client.interface.ts` (~200 lines)
- `backend/src/services/einvoice/einvoice.service.ts` (~600 lines)

**Modified:**
- `backend/src/services/einvoice/index.ts` (added exports)
- `backend/src/config/types.ts` (added 6 symbols)
- `backend/src/config/container.ts` (added 6 bindings)

## Integration Points

### Incoming Dependencies (Plan uses these)
- `QrCodeService` (06-02) - TLV-encoded QR generation
- `PintAeBuilderService` (06-03) - PINT AE XML building
- `UblValidatorService` (06-04) - XML validation
- `EInvoiceArchiveService` (06-05) - Tamper-proof archival

### Outgoing Dependencies (Future plans use this)
- 06-07, 06-08: E-invoice controller and routes
- Phase 7: Real ASP client implementation replaces stub

## Verification Checklist

- [x] E-invoice generation orchestrates all sub-services in correct order
- [x] Validation failures block archiving with clear error messages
- [x] QR code is embedded in generated e-invoice XML
- [x] All operations run within single database transaction
- [x] Audit log created for every e-invoice generation
- [x] ASP client interface defined for Phase 7 integration
- [x] AspClientStub allows Phase 6 to compile without ASP connectivity
- [x] DI container properly configured for all services

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

**Ready for 06-07 (E-Invoice Controller):**
- EInvoiceService fully injectable via DI
- All methods ready for HTTP endpoint exposure
- Error handling returns structured results for API responses

**Phase 7 ASP Integration:**
- IAspClient interface defines contract
- AspClientStub will be rebound to real implementation
- submitEInvoice, checkStatus, cancelSubmission ready to be called

## Commits

| Hash | Message |
|------|---------|
| `041f66f` | feat(06-06): add ASP client interface and stub |
| `95ea872` | feat(06-06): add e-invoice orchestration service |
| `d6c69e9` | feat(06-06): register e-invoice services in DI container |
