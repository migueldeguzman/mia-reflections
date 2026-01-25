---
phase: 07
plan: 01
subsystem: e-invoice-transmission
tags: [prisma, typescript, e-invoicing, fta, dctce, asp]
status: complete
dependency-graph:
  requires: [phase-06-einvoice-archives]
  provides: [transmission-types, transmission-schema, transmission-migration]
  affects: [07-02, 07-03, 07-04]
tech-stack:
  added: []
  patterns: [state-machine, encrypted-credentials, queue-management]
key-files:
  created:
    - web-erp-app/backend/src/types/einvoice-transmission.types.ts
    - web-erp-app/backend/prisma/migrations/20260125000000_einvoice_transmission/migration.sql
  modified:
    - web-erp-app/backend/prisma/schema.prisma
decisions:
  - id: state-machine-enum
    choice: TypeScript enum + transitions map
    rationale: Prisma doesn't support native state machines; enforce via TypeScript
  - id: aes-256-gcm
    choice: AES-256-GCM for credential encryption
    rationale: Industry standard authenticated encryption, 256-bit key security
  - id: queue-retry-backoff
    choice: Exponential backoff (1s -> 4s -> 16s)
    rationale: Prevents thundering herd on DCTCE/ASP rate limits
metrics:
  duration: ~15 minutes
  completed: 2026-01-25
---

# Phase 7 Plan 1: Transmission Schema and Types Summary

**One-liner:** State machine types and Prisma models for DCTCE/ASP e-invoice transmission queue with encrypted credential storage

## Tasks Completed

| Task | Name | Commit | Key Changes |
|------|------|--------|-------------|
| 1 | Create transmission types | c365327 | EInvoiceTransmissionStatus enum (7 states), ITransmissionProvider interface, queue types |
| 2 | Add Prisma schema models | 50c6570 | 4 models, 3 enums, relations to companies/users/archives |
| 3 | Create migration SQL | a94277d | CREATE TYPE, CREATE TABLE, indexes, foreign keys |

## What Was Built

### TypeScript Types (einvoice-transmission.types.ts)

**Transmission Status State Machine:**
- 7 states: DRAFT -> QUEUED -> TRANSMITTING -> PENDING_CLEARANCE -> CLEARED/REJECTED/FAILED
- TRANSMISSION_STATUS_TRANSITIONS map enforces valid transitions
- isValidTransmissionTransition() helper function

**Transmission Mode Configuration:**
- TransmissionMode enum: DIRECT_DCTCE, ASP_PROVIDER, SANDBOX
- TransmissionEnvironment enum: SANDBOX, PRODUCTION

**Provider Interface (ITransmissionProvider):**
- transmit(): Submit e-invoice to DCTCE/ASP
- checkStatus(): Poll transmission status
- cancelTransmission(): Cancel pending (if supported)
- validateCredentials(): Verify stored credentials
- testConnection(): Health check

**Queue Management:**
- QueueItem interface with priority, retryCount, nextRetryAt
- QueueProcessingOptions: batchSize, concurrency, retryBackoff
- DEFAULT_QUEUE_OPTIONS: 50 batch, 5 concurrent, 3 retries, exponential backoff

**TDD/MLS Types:**
- TddField, TddValidationResult, TddValidationError
- MlsStatusCode enum, MlsResponse, MlsError

**Constants:**
- CREDENTIAL_ENCRYPTION: AES-256-GCM, 32-byte key, 16-byte IV
- TRANSMISSION_RETENTION: 7 years, 6-month warning

### Prisma Schema Models

**einvoice_transmissions:**
- Links to einvoice_archives (Phase 6)
- Queue fields: priority, retryCount, maxRetries, nextRetryAt, queuedAt
- FTA response: ftaReferenceNumber, clearanceNumber, tddReference, mlsStatus
- Error tracking: errorCode, errorMessage, errorDetails (JSON)
- Raw request/response storage for debugging
- Timestamps: transmittedAt, clearedAt, rejectedAt

**einvoice_transmission_history:**
- Audit trail for status changes
- fromStatus, toStatus, reason
- changedById, changedAt

**einvoice_credentials:**
- One per company (unique companyId)
- DCTCE OAuth: clientId, clientSecretEnc, tokenEndpoint, apiEndpoint
- ASP API key: apiKeyEnc, aspEndpoint, aspIdentifier, aspProviderName
- Cached tokens: accessTokenEnc, tokenExpiresAt, refreshTokenEnc
- Encryption metadata: encryptionIv, encryptionAuthTag
- Connection health: lastConnectionTestAt, lastConnectionSuccess

**einvoice_transmission_config:**
- Per-company queue settings
- Batch: batchSize, concurrency, maxRetries
- Retry: retryDelayMs, retryBackoffMultiplier, maxRetryWindowHours
- Rate limits: maxTransmissionsPerHour, maxTransmissionsPerDay
- Notifications: notifyOnRejection, notifyOnFailure, notifyOnClearance
- Feature flags: autoSubmitEnabled, bulkSubmitEnabled

### Migration SQL

- 3 new ENUMs: EInvoiceTransmissionStatus, TransmissionMode, TransmissionEnvironment
- 4 new tables with all columns
- 8 indexes for queue queries (status, queuedAt, nextRetryAt, etc.)
- 8 foreign key constraints

## Verification Results

| Check | Status |
|-------|--------|
| Types compile (tsc --noEmit) | PASS |
| Schema valid (prisma validate) | PASS |
| Client generated (prisma generate) | PASS |
| Migration file created | PASS |
| State machine transitions defined | PASS |
| AES-256-GCM constants | PASS |
| FK: einvoice_transmissions -> einvoice_archives | PASS |
| FK: einvoice_credentials -> companies | PASS |

## Deviations from Plan

None - plan executed exactly as written.

## Files Summary

**Created:**
- `web-erp-app/backend/src/types/einvoice-transmission.types.ts` (418 lines)
- `web-erp-app/backend/prisma/migrations/20260125000000_einvoice_transmission/migration.sql` (260 lines)

**Modified:**
- `web-erp-app/backend/prisma/schema.prisma` (+349 lines, -135 lines reformatted)

## Next Steps (Plan 07-02)

1. Implement CredentialEncryptionService for AES-256-GCM operations
2. Create TransmissionQueueService for queue management
3. Implement status transition validation

## Dependencies for Future Plans

This plan provides foundation for:
- **07-02**: Queue service uses einvoice_transmissions model
- **07-03**: ASP/DCTCE providers implement ITransmissionProvider
- **07-04**: Status polling uses transmission_history

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| State machine enforcement | TypeScript + transitions map | Prisma lacks native state machine; app-layer enforcement |
| Credential encryption | AES-256-GCM | Authenticated encryption prevents tampering |
| Retry strategy | Exponential backoff 4x | 1s->4s->16s prevents overwhelming DCTCE/ASP |
| Queue priority | Integer field | Higher priority = processed first; simple to implement |
| Raw storage | TEXT columns | Debug/audit trail for FTA compliance |
