---
phase: "07"
plan: "07"
subsystem: e-invoice-transmission
tags: [bullmq, redis, queue, worker, transmission, retry, exponential-backoff]
dependency-graph:
  requires: [07-01, 07-04, 07-05, 07-06]
  provides: [Transmission queue service, Worker service, Job processor]
  affects: [07-08, 07-09, 07-10]
tech-stack:
  added: [bullmq, ioredis, "@types/ioredis"]
  patterns: [BullMQ Queue/Worker, Exponential Backoff, Duplicate Detection]
key-files:
  created:
    - backend/src/services/einvoice/queue/queue.types.ts
    - backend/src/services/einvoice/queue/transmission-queue.service.ts
    - backend/src/services/einvoice/queue/transmission-worker.service.ts
    - backend/src/services/einvoice/queue/index.ts
    - backend/src/jobs/einvoice-transmission.job.ts
  modified:
    - backend/src/config/types.ts
    - backend/src/services/einvoice/index.ts
    - backend/package.json
decisions:
  - id: D-07-07-001
    title: "Use BullMQ with dynamic import"
    choice: "Lazy load BullMQ and ioredis via dynamic import"
    rationale: "Avoids module load errors in tests, allows mock injection for testing"
  - id: D-07-07-002
    title: "Any type for internal queue"
    choice: "Use 'any' for internal queue instead of strict IQueue interface"
    rationale: "BullMQ Queue type has complex generic parameters that don't map cleanly to abstraction interface"
  - id: D-07-07-003
    title: "Direct Prisma updates in job processor"
    choice: "Update transmission and archive records directly via Prisma"
    rationale: "MlsHandlerService uses DI with ComplianceAuditService; job processor runs standalone"
metrics:
  duration: "~25 minutes"
  completed: "2026-01-25"
---

# Phase 7 Plan 07: Transmission Queue Infrastructure Summary

**One-liner:** BullMQ-based transmission queue with Redis backend, exponential backoff retry (1s/4s/16s), duplicate detection, and progress tracking for reliable DCTCE transmission.

## What Was Built

### 1. Queue Type Definitions (queue.types.ts - 523 lines)

Complete type system for transmission queue management:

- **TransmissionJobData interface**: archiveId, companyId, transmissionMode, environment, priority, metadata
- **TransmissionJobResult interface**: success, transmissionId, status, errors, duration, completedAt
- **RetryConfig interface**: maxAttempts=3, baseDelay=1000, backoffMultiplier=4, noRetryOnValidation=true
- **QueueStats interface**: waiting, active, completed, failed, delayed, paused, oldestJobAge
- **JobStatus interface**: jobId, state, progress, attempts, timestamps, result
- **JOB_PRIORITIES constant**: HIGH=1, NORMAL=5, LOW=10
- **QUEUE_EVENTS constant**: completed, failed, stalled, progress, added, active, waiting, error
- **PROGRESS_STAGES constant**: QUEUED=0, VALIDATING=10, FETCHING_ARCHIVE=20, BUILDING_TDD=40, etc.
- **Utility functions**: shouldRetryJob, calculateRetryDelay, isWithinRetryWindow, isNonRetryableError

### 2. TransmissionQueueService (transmission-queue.service.ts - 730 lines)

BullMQ queue management service:

- **initialize(queue?)**: Creates BullMQ Queue with Redis connection, supports mock injection for tests
- **addToQueue(data, options)**: Validates data, checks duplicates, adds with priority, returns job ID
- **addBulk(jobs)**: Atomic batch add with validation and deduplication
- **getJobStatus(jobId)**: Returns state, progress, attempts, timestamps
- **cancelJob(jobId)**: Removes waiting/delayed jobs only
- **retryJob(jobId)**: Re-adds failed job with HIGH priority
- **getQueueStats()**: Returns counts by status with oldest job age
- **getRecentJobs(status, limit)**: Fetches recent jobs by status
- **pauseQueue()/resumeQueue()**: For maintenance windows
- **drainQueue()**: Emergency cleanup
- **Duplicate detection**: Same archiveId blocked within 1-hour window
- **Auto-cleanup**: Deduplication map cleaned every 10 minutes

### 3. TransmissionWorkerService (transmission-worker.service.ts - 290 lines)

BullMQ worker service for job processing:

- **start()**: Creates BullMQ Worker with configurable concurrency (default: 5)
- **stop()**: Graceful shutdown waiting for active jobs
- **getWorkerStatus()**: Returns isRunning, concurrency, activeJobCount, jobsProcessed, jobsFailed
- **shouldRetryAfterFailure(error, job)**: Returns false for validation errors, max attempts reached, or 24-hour window exceeded
- **getRetryDelay(attempt)**: Exponential backoff: 1s -> 4s -> 16s (multiplier: 4, cap: 1 hour)
- **Event handlers**: completed, failed, stalled, error, progress logging

### 4. Job Processor (einvoice-transmission.job.ts - 340 lines)

BullMQ job handler for e-invoice transmission:

- **processTransmissionJob(job)**: Main entry point orchestrating the complete flow
- **Progress stages**:
  - 10%: Validating job data
  - 20%: Fetching archive from database
  - 40%: Building TDD via TddBuilderService
  - 50%: Getting provider (mock implementation for now)
  - 80%: Handling response with database updates
  - 100%: Completed
- **Error handling**: Validation errors update status to REJECTED without retry
- **Database updates**: Direct Prisma updates for transmission and archive records
- **Mock provider**: Simulates successful transmission for sandbox testing

## Queue Configuration

| Setting | Value | Description |
|---------|-------|-------------|
| Queue Name | einvoice-transmission | BullMQ queue identifier |
| Worker Concurrency | 5 | Parallel job processing |
| Max Attempts | 3 | Retry limit |
| Base Delay | 1000ms | First retry delay |
| Backoff Multiplier | 4 | Exponential: 1s, 4s, 16s |
| Max Retry Window | 24 hours | Jobs expire after this |
| Duplicate Window | 1 hour | Same archiveId blocked |
| removeOnComplete | 1000 jobs or 7 days | Auto-cleanup completed |
| removeOnFail | 5000 jobs or 30 days | Auto-cleanup failed |

## Non-Retryable Error Patterns

Errors containing these patterns skip retry and mark as REJECTED:

- validation
- PINT-AE
- PEPPOL-EN16931
- rejected
- XSD
- TRN-
- schema
- format
- invalid

## Commits

| Hash | Type | Description |
|------|------|-------------|
| fbca5d2 | feat | Queue type definitions for transmission |
| c73a539 | feat | TransmissionQueueService with BullMQ |
| 7cacc3a | feat | TransmissionWorkerService and job processor |

## Files Created/Modified

**Created:**
- `backend/src/services/einvoice/queue/queue.types.ts` (523 lines)
- `backend/src/services/einvoice/queue/transmission-queue.service.ts` (730 lines)
- `backend/src/services/einvoice/queue/transmission-worker.service.ts` (290 lines)
- `backend/src/services/einvoice/queue/index.ts` (16 lines)
- `backend/src/jobs/einvoice-transmission.job.ts` (340 lines)

**Modified:**
- `backend/src/config/types.ts` (+2 DI symbols: TransmissionQueueService, TransmissionWorkerService)
- `backend/src/services/einvoice/index.ts` (+1 export: queue module)
- `backend/package.json` (+3 dependencies: bullmq, ioredis, @types/ioredis)

## Deviations from Plan

### [Rule 3 - Blocking] BullMQ and ioredis not installed

**Found during:** Task 2 implementation
**Issue:** bullmq and ioredis packages not in dependencies
**Fix:** Installed bullmq, ioredis, and @types/ioredis
**Impact:** Required npm install before service would compile

### [Rule 3 - Blocking] MlsHandlerService requires DI

**Found during:** Task 3 implementation
**Issue:** MlsHandlerService uses @inject for PrismaClient and ComplianceAuditService
**Fix:** Job processor uses direct Prisma updates instead of MlsHandlerService
**Impact:** Full MLS handling (notifications, audit logging) deferred to orchestration layer

### [Rule 3 - Blocking] TddBuilderService.buildFromArchive type mismatch

**Found during:** Task 3 implementation
**Issue:** buildFromArchive expects EInvoiceArchiveRecord with all fields
**Fix:** Use buildFromXml with TddXmlMetadata instead
**Impact:** Same functionality, different method signature

## Verification

| Check | Result |
|-------|--------|
| queue.types.ts compiles | PASS |
| transmission-queue.service.ts compiles | PASS |
| transmission-worker.service.ts compiles | PASS |
| einvoice-transmission.job.ts compiles | PASS |
| DI symbols exported | PASS |
| Queue module exported from einvoice/index | PASS |
| BullMQ dependencies installed | PASS |

## EINV-09 Requirement Compliance

| Aspect | Implementation |
|--------|----------------|
| Real-time transmission | BullMQ queue processes immediately |
| Reliability | Redis-backed persistence |
| Retry logic | 3 attempts with exponential backoff |
| Validation handling | RE status marked rejected, no retry |
| Progress tracking | Updates at 10%, 20%, 40%, 50%, 80%, 100% |
| Monitoring | QueueStats with counts by status |
| Duplicate prevention | 1-hour window deduplication |
| Priority handling | HIGH=1, NORMAL=5, LOW=10 |

## Next Phase Readiness

**Dependencies satisfied for:**
- 07-08 (Transmission Orchestration): Queue service ready for orchestration
- 07-09 (Status Polling): Worker service provides job status tracking
- 07-10 (Monitoring Dashboard): QueueStats and getRecentJobs available

**Blockers identified:**
- Redis must be running for queue operations
- Provider implementation is mocked (will use real providers from 07-05)

## Usage Example

```typescript
// Queue a transmission
const queueService = new TransmissionQueueService();
await queueService.initialize();

const result = await queueService.addToQueue({
  archiveId: 'uuid-here',
  einvoiceNumber: 'INV-2026-001',
  companyId: 'company-uuid',
  transmissionMode: TransmissionMode.SANDBOX,
  environment: TransmissionEnvironment.SANDBOX,
  priority: 'NORMAL',
  metadata: {
    einvoiceNumber: 'INV-2026-001',
    invoiceType: 'INVOICE',
    supplierTrn: '100123456789012',
    totalAmount: '1000.00',
    vatAmount: '50.00',
    currency: 'AED',
    issueDate: '2026-01-25',
  },
});

// Start worker
const workerService = new TransmissionWorkerService();
await workerService.start();

// Monitor queue
const stats = await queueService.getQueueStats();
console.log(`Waiting: ${stats.waiting}, Active: ${stats.active}`);
```
