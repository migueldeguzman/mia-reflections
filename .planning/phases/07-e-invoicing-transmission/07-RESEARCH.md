# Phase 7: E-Invoicing Transmission and Processing - Research

**Researched:** 2026-01-25
**Domain:** UAE DCTCE E-Invoice Transmission, TDD/MLS Processing, ASP Integration, Queue Management
**Confidence:** MEDIUM (DCTCE specifics not fully public; based on PEPPOL standards and UAE MoF publications)

## Summary

This research investigates the technical requirements for implementing e-invoice transmission to the UAE DCTCE platform, processing Tax Data Documents (TDD), handling Message Level Status (MLS) responses, and supporting ASP integration patterns. Phase 7 builds upon Phase 6's PINT-AE XML generation and archive services.

The UAE's DCTCE (Decentralized Continuous Transaction Control and Exchange) model follows the PEPPOL 5-corner architecture where e-invoices flow through Accredited Service Providers (ASPs), with both sender and receiver ASPs reporting Tax Data Documents to the FTA's central platform. The system returns MLS responses confirming acceptance (AB/AP) or rejection (RE) of submitted invoices.

Key findings: The FTA has not yet published detailed API specifications for DCTCE direct integration. Current implementations rely on ASP partnerships for transmission. The TDD structure extracts tax-relevant fields from PINT-AE invoices for FTA reporting. MLS responses follow PEPPOL patterns with UAE-specific status codes. For the July 2026 pilot, businesses should integrate with the FTA Sandbox for testing.

**Primary recommendation:** Implement an `ITransmissionProvider` abstraction supporting multiple transmission modes (DCTCE Direct, ASP, Sandbox), use BullMQ for job queue management with exponential backoff retry, build a TDD extractor service to generate tax reporting documents from archived e-invoices, and implement MLS status tracking with email notifications for rejections.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| bullmq | ^5.x | Job queue for transmission | Redis-backed, exponential backoff, TypeScript native, 1M+ weekly downloads |
| ioredis | ^5.x | Redis client for BullMQ | Fast, cluster support, used by BullMQ internally |
| axios | ^1.7.x | HTTP client for API calls | Universal, interceptors, timeout handling |
| p-retry | ^6.x | Lightweight retry utility | Simple exponential backoff for non-queue operations |
| p-queue | ^8.x | Concurrency control | Rate limiting API calls |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| nodemailer | ^6.x | Email notifications | Sending rejection alerts |
| handlebars | ^4.7.x | Email templates | Notification email formatting |
| jszip | ^3.x | ZIP file creation | Bulk export packaging |
| fast-xml-parser | ^4.5.x | XML parsing | Already in Phase 6, for TDD extraction |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| BullMQ | Agenda | BullMQ faster, better TypeScript; Agenda uses MongoDB |
| BullMQ | p-queue only | p-queue simpler but no persistence; BullMQ for production reliability |
| Redis | PostgreSQL SKIP LOCKED | Redis faster; PostgreSQL simpler (no new service) |
| axios | node-fetch | axios has better interceptors and timeout handling |

**Installation:**
```bash
npm install bullmq ioredis p-retry p-queue jszip
npm install -D @types/node
```

**Note on Redis:** BullMQ requires Redis. For development, use Redis in Docker:
```bash
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

For production, consider Upstash Redis (serverless) or Redis Cloud compatible with Neon's serverless model.

## DCTCE Platform Overview

### UAE 5-Corner Architecture

Based on official UAE Ministry of Finance documentation:

```
Corner 1 (C1): Supplier
    ↓ sends e-invoice
Corner 2 (C2): Supplier's ASP
    ↓ validates, converts to PINT-AE, reports TDD to C5
    ↓ transmits via PEPPOL network
Corner 3 (C3): Buyer's ASP
    ↓ receives, validates, reports TDD to C5
    ↓ delivers to buyer
Corner 4 (C4): Buyer

Corner 5 (C5): FTA Platform (receives TDD from both C2 and C3)
```

### DCTCE API Details (Based on Available Information)

**Authentication:**
- OAuth 2.0 with client credentials flow for direct DCTCE connection
- API key authentication for ASP integrations
- TLS 1.2+ required for all communications

**Expected Endpoints (based on PEPPOL patterns):**
```
POST /api/v1/invoices/submit         # Submit e-invoice
GET  /api/v1/invoices/{id}/status    # Check submission status
POST /api/v1/invoices/batch          # Batch submission
GET  /api/v1/invoices/{id}/mls       # Get MLS response
POST /api/v1/tdd/report              # Report Tax Data Document
GET  /api/v1/connection/health       # Connection health check
```

**Rate Limits (estimated based on similar systems):**
- 10-50 requests per second (TPS)
- Daily limits may apply for batch operations
- Sandbox may have lower limits

**Note:** Exact API specifications not yet public. Implementation should use FTA Sandbox for validation.

## Tax Data Document (TDD) Structure

### Purpose

The TDD is a tax-relevant subset of the full e-invoice, reported to FTA by both sender and receiver ASPs. It enables real-time tax monitoring without transmitting full invoice content to the tax authority.

### TDD Fields (Based on UAE MoF Data Dictionary + PINT-AE)

```typescript
// Source: UAE E-Invoicing Data Dictionary (Feb 2025 consultation) + PINT-AE spec

export interface TaxDataDocument {
  // Document Identification
  tddId: string;                      // UUID for this TDD
  einvoiceReference: string;          // Reference to original e-invoice
  documentType: TddDocumentType;      // INVOICE, CREDIT_NOTE
  documentNumber: string;             // Original invoice number (IBT-001)
  issueDate: string;                  // YYYY-MM-DD (IBT-002)
  issueTime?: string;                 // HH:MM:SS if available
  invoiceTypeCode: string;            // 380, 381, 389 (IBT-003)

  // Supplier Tax Information (IBG-04)
  supplier: {
    trn: string;                      // 15-digit TRN (IBT-031) - MANDATORY
    name: string;                     // Legal name (IBT-027)
    nameArabic?: string;              // Arabic name if available
    countryCode: string;              // 'AE' (IBT-040)
  };

  // Buyer Tax Information (IBG-07)
  buyer: {
    trn?: string;                     // TRN if B2B (IBT-048)
    name: string;                     // Legal name (IBT-044)
    nameArabic?: string;
    countryCode?: string;             // (IBT-055)
  };

  // Monetary Amounts (IBG-22, IBG-23)
  amounts: {
    currencyCode: string;             // 'AED' (IBT-005) - MANDATORY
    taxExclusiveAmount: number;       // Subtotal (IBT-109)
    taxAmount: number;                // Total VAT (IBT-110)
    taxInclusiveAmount: number;       // Grand total (IBT-112)
    payableAmount: number;            // Amount due (IBT-115)
  };

  // VAT Breakdown (IBG-23)
  taxBreakdown: TddTaxSubtotal[];

  // Transaction Classification
  classification: {
    transactionType: TddTransactionType;
    reverseCharge: boolean;           // True if reverse charge applies
    freeZoneTransaction: boolean;     // True if designated zone
  };

  // Integrity
  invoiceHash: string;                // SHA-256 of XML content

  // Reporting Metadata
  reportedBy: 'SENDER_ASP' | 'RECEIVER_ASP';
  reportedAt: Date;
}

export interface TddTaxSubtotal {
  taxCategoryCode: string;            // 'S' = Standard, 'Z' = Zero, 'E' = Exempt
  taxableAmount: number;
  taxAmount: number;
  taxPercent: number;                 // 5 for UAE standard VAT
}

export enum TddDocumentType {
  INVOICE = 'INVOICE',
  CREDIT_NOTE = 'CREDIT_NOTE',
}

export enum TddTransactionType {
  STANDARD = 'STANDARD',              // Standard domestic sale
  REVERSE_CHARGE = 'REVERSE_CHARGE',  // Import or designated zone
  EXEMPT = 'EXEMPT',                  // VAT exempt supply
  ZERO_RATED = 'ZERO_RATED',          // Zero-rated supply
  OUT_OF_SCOPE = 'OUT_OF_SCOPE',      // Not subject to VAT
}
```

### TDD Mandatory Fields for FTA

Based on UAE data dictionary consultation:

| Field | Mandatory | Source in PINT-AE |
|-------|-----------|-------------------|
| Document Number | Yes | cbc:ID (IBT-001) |
| Issue Date | Yes | cbc:IssueDate (IBT-002) |
| Document Type Code | Yes | cbc:InvoiceTypeCode (IBT-003) |
| Currency Code | Yes | cbc:DocumentCurrencyCode (IBT-005) |
| Supplier TRN | Yes | cac:AccountingSupplierParty/cac:Party/cac:PartyTaxScheme/cbc:CompanyID (IBT-031) |
| Supplier Name | Yes | cac:AccountingSupplierParty/cac:Party/cac:PartyLegalEntity/cbc:RegistrationName (IBT-027) |
| Tax Exclusive Amount | Yes | cac:LegalMonetaryTotal/cbc:TaxExclusiveAmount (IBT-109) |
| Tax Amount | Yes | cac:TaxTotal/cbc:TaxAmount (IBT-110) |
| Tax Inclusive Amount | Yes | cac:LegalMonetaryTotal/cbc:TaxInclusiveAmount (IBT-112) |
| Invoice Hash | Yes | Calculated from XML |

## Message Level Status (MLS) Response Codes

### Core MLS Codes (DCTCE Standard)

Based on UAE MoF documentation and PEPPOL patterns:

| Code | Name | Description | System Action |
|------|------|-------------|---------------|
| AB | Accepted, Not Forwarded | Invoice accepted by C2, not yet sent to buyer | Status: PENDING_CLEARANCE |
| AP | Accepted and Forwarded | Invoice accepted and delivered to buyer via C3 | Status: CLEARED |
| RE | Rejected | Invoice rejected due to validation errors | Status: REJECTED, notify user |

### Extended Status Codes (Internal Tracking)

```typescript
export enum MlsStatusCode {
  // DCTCE Core Codes
  AB = 'AB',     // Accepted, not forwarded
  AP = 'AP',     // Accepted and forwarded (cleared)
  RE = 'RE',     // Rejected

  // Extended Codes for Internal Tracking
  PENDING = 'PENDING',       // Awaiting response
  PROCESSING = 'PROCESSING', // Being processed by DCTCE
  ERROR = 'ERROR',           // System error (not validation rejection)
  TIMEOUT = 'TIMEOUT',       // Response timeout
}

// Map MLS to Transmission Status
export const MLS_TO_STATUS_MAP: Record<MlsStatusCode, EInvoiceTransmissionStatus> = {
  [MlsStatusCode.AB]: EInvoiceTransmissionStatus.PENDING_CLEARANCE,
  [MlsStatusCode.AP]: EInvoiceTransmissionStatus.CLEARED,
  [MlsStatusCode.RE]: EInvoiceTransmissionStatus.REJECTED,
  [MlsStatusCode.PENDING]: EInvoiceTransmissionStatus.TRANSMITTING,
  [MlsStatusCode.PROCESSING]: EInvoiceTransmissionStatus.PENDING_CLEARANCE,
  [MlsStatusCode.ERROR]: EInvoiceTransmissionStatus.FAILED,
  [MlsStatusCode.TIMEOUT]: EInvoiceTransmissionStatus.FAILED,
};
```

### MLS Response Structure

```typescript
export interface MlsResponse {
  // Identification
  submissionId: string;
  documentReference: string;   // e-invoice number

  // Status
  statusCode: MlsStatusCode;
  statusMessage: string;

  // Timestamps
  receivedAt: Date;
  processedAt: Date;

  // TDD Reference (if accepted)
  tddReference?: string;

  // Errors (if rejected)
  errors?: MlsValidationError[];

  // Raw response for debugging
  rawResponse?: unknown;
}

export interface MlsValidationError {
  errorCode: string;         // e.g., 'PINT-AE-001', 'XSD-VALIDATION-ERROR'
  errorMessage: string;      // Human-readable description
  errorLocation?: string;    // XPath to error location
  severity: 'fatal' | 'error' | 'warning';
  suggestedFix?: string;     // Guidance for correction
  fieldMapping?: string;     // Maps to invoice field for UI highlighting
}
```

### Common Validation Error Codes

Based on PEPPOL BIS Billing 3.0 Schematron rules (applicable to PINT-AE):

| Error Code | Description | Field Mapping |
|------------|-------------|---------------|
| PEPPOL-EN16931-R001 | Business process MUST be provided | cbc:ProfileID |
| PEPPOL-EN16931-R003 | Buyer reference or PO reference MUST be provided | cbc:BuyerReference |
| PEPPOL-EN16931-R010 | Buyer electronic address MUST be provided | cac:AccountingCustomerParty endpoint |
| PEPPOL-EN16931-R020 | Seller electronic address MUST be provided | cac:AccountingSupplierParty endpoint |
| PINT-AE-001 | CustomizationID must contain PINT AE identifier | cbc:CustomizationID |
| PINT-AE-002 | DocumentCurrencyCode must be AED | cbc:DocumentCurrencyCode |
| PINT-AE-003 | Seller TRN is mandatory and must be 15 digits | cac:PartyTaxScheme/cbc:CompanyID |
| XSD-001 | XML schema validation failure | Various |
| TRN-001 | Invalid TRN format | supplierTrn or buyerTrn |

## Architecture Patterns

### Recommended Project Structure
```
src/
├── services/
│   └── einvoice/
│       ├── transmission/
│       │   ├── transmission.service.ts         # Main orchestrator
│       │   ├── transmission-provider.interface.ts  # ITransmissionProvider
│       │   ├── providers/
│       │   │   ├── dctce-provider.ts           # Direct FTA integration
│       │   │   ├── asp-provider.ts             # ASP routing
│       │   │   └── sandbox-provider.ts         # FTA Sandbox
│       │   └── __tests__/
│       ├── tdd/
│       │   ├── tdd-builder.service.ts          # Tax Data Document builder
│       │   └── __tests__/
│       ├── mls/
│       │   ├── mls-handler.service.ts          # Message Level Status
│       │   ├── error-mapper.service.ts         # Map errors to fields
│       │   └── __tests__/
│       ├── queue/
│       │   ├── transmission-queue.service.ts   # BullMQ queue wrapper
│       │   ├── transmission.worker.ts          # Job processor
│       │   └── __tests__/
│       ├── export/
│       │   ├── export.service.ts               # XML/JSON export
│       │   └── __tests__/
│       └── notification/
│           ├── notification.service.ts         # Email alerts
│           └── __tests__/
├── types/
│   └── transmission.types.ts                   # Phase 7 specific types
└── config/
    └── redis.ts                                # Redis connection
```

### Pattern 1: Transmission Provider Interface

**What:** Abstract interface for multiple transmission backends
**When to use:** All transmission operations - allows switching between DCTCE, ASP, Sandbox

```typescript
// Source: Based on Phase 6 IAspClient interface + UAE DCTCE 5-corner model
import { EInvoiceArchiveRecord, TaxDataDocument } from '../../types/einvoice.types';

export enum TransmissionMode {
  DIRECT_DCTCE = 'DIRECT_DCTCE',
  ASP_PROVIDER = 'ASP_PROVIDER',
  SANDBOX = 'SANDBOX',
}

export interface TransmissionRequest {
  archiveId: string;
  einvoiceNumber: string;
  companyId: string;
  xml: string;
  xmlHash: string;
  tddPayload: TaxDataDocument;
}

export interface TransmissionResult {
  success: boolean;
  submissionId?: string;
  tddReference?: string;
  mlsStatus: MlsStatusCode;
  responseCode?: string;
  responseMessage?: string;
  errors?: TransmissionError[];
  transmittedAt?: Date;
  retryable: boolean;
}

export interface TransmissionError {
  code: string;
  message: string;
  element?: string;
  severity: 'error' | 'warning';
  field?: string; // Maps to invoice field for correction UI
}

export interface ITransmissionProvider {
  transmit(request: TransmissionRequest): Promise<TransmissionResult>;
  checkStatus(submissionId: string): Promise<TransmissionStatusResult>;
  testConnection(): Promise<{ connected: boolean; latencyMs?: number; error?: string }>;
  isConfigured(): boolean;
  getProviderName(): string;
}
```

### Pattern 2: Status State Machine

**What:** E-invoice transmission status flow matching DCTCE responses
**When to use:** All status transitions - ensures valid state changes

```typescript
// Source: Based on 07-CONTEXT.md decisions + UAE MoF DCTCE documentation

export enum EInvoiceTransmissionStatus {
  DRAFT = 'DRAFT',               // Generated, not yet submitted
  QUEUED = 'QUEUED',             // In transmission queue
  TRANSMITTING = 'TRANSMITTING', // Currently being sent
  PENDING_CLEARANCE = 'PENDING_CLEARANCE', // Received by FTA, awaiting clearance
  CLEARED = 'CLEARED',           // Successfully cleared by FTA
  REJECTED = 'REJECTED',         // Rejected with validation errors
  FAILED = 'FAILED',             // Transmission failure (network, auth, etc.)
}

// Valid status transitions
export const VALID_STATUS_TRANSITIONS: Record<
  EInvoiceTransmissionStatus,
  EInvoiceTransmissionStatus[]
> = {
  [EInvoiceTransmissionStatus.DRAFT]: [EInvoiceTransmissionStatus.QUEUED],
  [EInvoiceTransmissionStatus.QUEUED]: [
    EInvoiceTransmissionStatus.TRANSMITTING,
    EInvoiceTransmissionStatus.FAILED,
  ],
  [EInvoiceTransmissionStatus.TRANSMITTING]: [
    EInvoiceTransmissionStatus.PENDING_CLEARANCE,
    EInvoiceTransmissionStatus.REJECTED,
    EInvoiceTransmissionStatus.FAILED,
  ],
  [EInvoiceTransmissionStatus.PENDING_CLEARANCE]: [
    EInvoiceTransmissionStatus.CLEARED,
    EInvoiceTransmissionStatus.REJECTED,
  ],
  [EInvoiceTransmissionStatus.CLEARED]: [], // Terminal state
  [EInvoiceTransmissionStatus.REJECTED]: [
    EInvoiceTransmissionStatus.DRAFT, // After correction, re-submit as new
  ],
  [EInvoiceTransmissionStatus.FAILED]: [
    EInvoiceTransmissionStatus.QUEUED, // Retry
  ],
};

export function canTransition(
  from: EInvoiceTransmissionStatus,
  to: EInvoiceTransmissionStatus
): boolean {
  return VALID_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}
```

### Pattern 3: BullMQ Transmission Queue

**What:** Job queue for reliable e-invoice transmission with retry
**When to use:** All transmissions - ensures reliability and traceability

```typescript
// Source: BullMQ documentation + 07-CONTEXT.md retry strategy (1s -> 4s -> 16s)
import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';

const QUEUE_NAME = 'einvoice-transmission';

// Exponential backoff: 1s, 4s, 16s (factor of 4)
const BACKOFF_CONFIG = {
  type: 'exponential' as const,
  delay: 1000, // 1 second base
};

const MAX_ATTEMPTS = 3;
const MAX_RETRY_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface TransmissionJobData {
  archiveId: string;
  einvoiceNumber: string;
  companyId: string;
  transmissionMode: TransmissionMode;
  priority: 'high' | 'normal' | 'low';
  scheduledAt?: Date;
}

@injectable()
export class TransmissionQueueService {
  private queue: Queue<TransmissionJobData>;
  private connection: IORedis;

  constructor(@inject(TYPES.RedisConfig) redisConfig: RedisConfig) {
    this.connection = new IORedis(redisConfig.url, {
      maxRetriesPerRequest: null, // Required for BullMQ
    });

    this.queue = new Queue(QUEUE_NAME, {
      connection: this.connection,
      defaultJobOptions: {
        attempts: MAX_ATTEMPTS,
        backoff: BACKOFF_CONFIG,
        removeOnComplete: { age: 7 * 24 * 3600, count: 1000 },
        removeOnFail: false,
      },
    });
  }

  async queueTransmission(data: TransmissionJobData): Promise<Job> {
    return this.queue.add('transmit-einvoice', data, {
      priority: this.getPriorityValue(data.priority),
      jobId: `transmission-${data.archiveId}`, // Prevent duplicates
    });
  }
}
```

### Pattern 4: TDD Builder Service

**What:** Extract tax-relevant data from PINT-AE XML for FTA reporting
**When to use:** Before transmission - TDD is sent alongside invoice

```typescript
// Source: UAE MoF E-Invoicing Data Dictionary + PINT-AE specification
import { XMLParser } from 'fast-xml-parser';

@injectable()
export class TddBuilderService {
  private parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    removeNSPrefix: true,
  });

  buildFromArchive(archive: EInvoiceArchiveRecord): TaxDataDocument {
    const parsed = this.parser.parse(archive.xmlContent);
    const invoice = parsed.Invoice || parsed.CreditNote;

    return {
      tddId: crypto.randomUUID(),
      einvoiceReference: archive.einvoiceNumber,
      documentType: parsed.CreditNote ? 'CREDIT_NOTE' : 'INVOICE',
      documentNumber: invoice['cbc:ID'],
      issueDate: invoice['cbc:IssueDate'],
      invoiceTypeCode: invoice['cbc:InvoiceTypeCode'],

      supplier: {
        trn: this.extractSupplierTrn(invoice),
        name: this.extractSupplierName(invoice),
        countryCode: 'AE',
      },

      buyer: {
        trn: this.extractBuyerTrn(invoice),
        name: this.extractBuyerName(invoice),
      },

      amounts: {
        currencyCode: invoice['cbc:DocumentCurrencyCode'] || 'AED',
        taxExclusiveAmount: this.extractAmount(invoice, 'TaxExclusiveAmount'),
        taxAmount: this.extractTaxAmount(invoice),
        taxInclusiveAmount: this.extractAmount(invoice, 'TaxInclusiveAmount'),
        payableAmount: this.extractAmount(invoice, 'PayableAmount'),
      },

      taxBreakdown: this.extractTaxBreakdown(invoice),

      classification: {
        transactionType: this.determineTransactionType(invoice),
        reverseCharge: this.isReverseCharge(invoice),
        freeZoneTransaction: false, // Determine from invoice data
      },

      invoiceHash: archive.xmlHash,
      reportedBy: 'SENDER_ASP',
      reportedAt: new Date(),
    };
  }
}
```

### Anti-Patterns to Avoid

- **Synchronous transmission:** Never block request thread - use job queue
- **Missing idempotency:** Ensure duplicate submissions don't create duplicate TDDs
- **Ignoring retry limits:** After 3 failed attempts, require manual intervention
- **No audit trail:** Log every status transition for FTA compliance
- **Hardcoded credentials:** Store ASP/DCTCE credentials encrypted in tenant config
- **Missing timeout:** Set request timeouts (30s default) to prevent hanging
- **No circuit breaker:** Implement circuit breaker for ASP API failures

## Export Format Standards

### Primary Format: PINT-AE XML

The PINT-AE XML format is the FTA-mandated standard. Exports should preserve the exact XML as generated in Phase 6.

### Secondary Format: JSON (UBL-Mapped)

JSON export maps UBL structure for API consumers:

```typescript
// Source: 07-CONTEXT.md export decisions

export interface JsonExportOptions {
  includeMetadata: boolean;
  prettyPrint: boolean;
}

export interface ExportedInvoice {
  metadata?: {
    exportedAt: string;
    format: 'PINT-AE-JSON';
    version: '1.0.1';
    source: {
      archiveId: string;
      einvoiceNumber: string;
    };
  };
  invoice: {
    id: string;
    issueDate: string;
    invoiceTypeCode: string;
    documentCurrencyCode: string;
    supplier: {
      trn: string;
      name: string;
      address: object;
    };
    buyer: {
      trn?: string;
      name: string;
      address: object;
    };
    totals: {
      lineExtensionAmount: number;
      taxExclusiveAmount: number;
      taxInclusiveAmount: number;
      payableAmount: number;
    };
    taxTotal: {
      taxAmount: number;
      taxSubtotals: object[];
    };
    lines: object[];
  };
}
```

### Export Endpoints

```typescript
// Single invoice export
GET /api/einvoice/:id/export?format=xml|json

// Bulk export with filters
POST /api/einvoice/export
{
  format: 'xml' | 'json',
  filters: {
    startDate?: string,
    endDate?: string,
    status?: EInvoiceTransmissionStatus[],
  },
  includeMetadata: boolean
}
// Returns: ZIP file with invoices + manifest.json
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Job queue | Custom DB polling | BullMQ | Atomic, exponential backoff, dashboard |
| Retry logic | setTimeout loops | BullMQ backoff or p-retry | Handles edge cases, jitter |
| HTTP client | Raw fetch | axios | Interceptors, timeouts, retry |
| XML parsing | Regex | fast-xml-parser | Proper namespace handling |
| Email sending | SMTP direct | nodemailer | Templates, queue, retries |
| Rate limiting | Manual counters | p-queue | Concurrency control built-in |
| ZIP creation | Manual streams | jszip | Cross-platform, async |

**Key insight:** E-invoice transmission is mission-critical. Use proven libraries for job processing and retry logic rather than custom implementations that may fail under edge cases.

## Common Pitfalls

### Pitfall 1: Missing Idempotency on Resubmission

**What goes wrong:** Duplicate TDD submissions to FTA after retry
**Why it happens:** Job retries without checking if previous attempt partially succeeded
**How to avoid:** Store submission attempt ID, check status before retrying
**Warning signs:** Multiple TDD references for same invoice

### Pitfall 2: Ignoring Network Timeouts

**What goes wrong:** Jobs hang indefinitely waiting for ASP response
**Why it happens:** Default axios timeout is infinite
**How to avoid:** Set explicit timeouts (30s connect, 60s response)
**Warning signs:** Queue jobs stuck in "active" state, memory growth

### Pitfall 3: Validation Rejection Loops

**What goes wrong:** System keeps retrying validation-rejected invoices
**Why it happens:** Not distinguishing retryable (network) from non-retryable (validation) errors
**How to avoid:** Check MLS status code - RE (rejected) should NOT auto-retry
**Warning signs:** Same invoice failing repeatedly, email spam to users

### Pitfall 4: Credential Exposure in Logs

**What goes wrong:** API keys/secrets appear in error logs
**Why it happens:** Logging full request/response objects
**How to avoid:** Sanitize sensitive fields before logging
**Warning signs:** Security audit finding credentials in log files

### Pitfall 5: Redis Memory Exhaustion

**What goes wrong:** BullMQ stops accepting new jobs
**Why it happens:** Failed jobs accumulating, no cleanup policy
**How to avoid:** Configure `maxmemory-policy: noeviction`, clean up old jobs
**Warning signs:** Redis OOM errors, queue operations timing out

### Pitfall 6: Missing Error Field Mapping

**What goes wrong:** Users can't identify which invoice field caused rejection
**Why it happens:** Only showing raw error codes from DCTCE
**How to avoid:** Map error codes to PINT-AE field names with friendly messages
**Warning signs:** Support tickets asking "what does PINT-AE-003 mean?"

## Code Examples

### Complete Transmission Flow

```typescript
// Source: Orchestration combining queue, provider, and status handling

@injectable()
export class TransmissionService {
  constructor(
    @inject(TYPES.EInvoiceArchiveService) private archiveService: EInvoiceArchiveService,
    @inject(TYPES.TddBuilderService) private tddBuilder: TddBuilderService,
    @inject(TYPES.TransmissionQueueService) private queueService: TransmissionQueueService,
    @inject(TYPES.AuditLogService) private auditService: AuditLogService
  ) {}

  async submitForTransmission(
    archiveId: string,
    userId: string
  ): Promise<{ jobId: string; status: EInvoiceTransmissionStatus }> {
    const archive = await this.archiveService.getArchive(archiveId);
    if (!archive) throw new Error(`Archive not found: ${archiveId}`);

    if (!['VALIDATED', 'GENERATED'].includes(archive.status)) {
      throw new Error(`Cannot submit invoice in status: ${archive.status}`);
    }

    const mode = await this.getTenantTransmissionMode(archive.companyId);

    const job = await this.queueService.queueTransmission({
      archiveId,
      einvoiceNumber: archive.einvoiceNumber,
      companyId: archive.companyId,
      transmissionMode: mode,
      priority: 'normal',
    });

    await this.archiveService.updateStatus(archiveId, { status: 'SUBMITTED' });

    await this.auditService.log({
      userId,
      action: 'EINVOICE_QUEUED',
      entity: 'EInvoice',
      entityId: archiveId,
      newValue: { jobId: job.id, mode },
      companyId: archive.companyId,
    });

    return { jobId: job.id!, status: EInvoiceTransmissionStatus.QUEUED };
  }
}
```

### MLS Handler with Error Mapping

```typescript
// Source: MLS processing with field-level error mapping

@injectable()
export class MlsHandlerService {
  private readonly ERROR_FIELD_MAP: Record<string, string> = {
    'PINT-AE-001': 'customizationId',
    'PINT-AE-002': 'documentCurrencyCode',
    'PINT-AE-003': 'supplierTrn',
    'PEPPOL-EN16931-R010': 'buyerEndpoint',
    'PEPPOL-EN16931-R020': 'supplierEndpoint',
    'TRN-001': 'supplierTrn',
  };

  async handleMlsResponse(archiveId: string, response: MlsResponse): Promise<void> {
    const newStatus = MLS_TO_STATUS_MAP[response.statusCode];

    // Map errors to fields
    const mappedErrors = response.errors?.map(error => ({
      ...error,
      fieldMapping: this.ERROR_FIELD_MAP[error.errorCode] || null,
      suggestedFix: this.getSuggestedFix(error.errorCode),
    }));

    await this.archiveService.updateStatus(archiveId, {
      status: newStatus,
      mlsStatus: response.statusCode,
      tddReference: response.tddReference,
      aspResponseCode: response.statusCode,
      aspResponseMessage: response.statusMessage,
    });

    // Store mapped errors for UI display
    if (mappedErrors?.length) {
      await this.storeValidationErrors(archiveId, mappedErrors);
    }

    // Notify on rejection
    if (response.statusCode === MlsStatusCode.RE) {
      await this.notificationService.sendRejectionNotification(archiveId, mappedErrors!);
    }
  }

  private getSuggestedFix(errorCode: string): string {
    const fixes: Record<string, string> = {
      'PINT-AE-002': 'Document currency must be AED for UAE invoices',
      'PINT-AE-003': 'Supplier TRN must be exactly 15 digits starting with 100',
      'TRN-001': 'Check that the TRN format is valid (15 digits starting with 100)',
    };
    return fixes[errorCode] || 'Please review the invoice data and correct any errors';
  }
}
```

### Export Service with Bulk Support

```typescript
// Source: Based on 07-CONTEXT.md export requirements

@injectable()
export class ExportService {
  async exportSingle(
    archiveId: string,
    format: 'xml' | 'json'
  ): Promise<{ content: string; filename: string; mimeType: string }> {
    const archive = await this.archiveService.getArchive(archiveId);
    if (!archive) throw new Error(`Archive not found: ${archiveId}`);

    if (format === 'xml') {
      return {
        content: archive.xmlContent,
        filename: `${archive.einvoiceNumber}.xml`,
        mimeType: 'application/xml',
      };
    }

    const json = this.convertXmlToJson(archive.xmlContent, true);
    return {
      content: JSON.stringify(json, null, 2),
      filename: `${archive.einvoiceNumber}.json`,
      mimeType: 'application/json',
    };
  }

  async exportBulk(
    companyId: string,
    filter: BulkExportFilter,
    format: 'xml' | 'json'
  ): Promise<Buffer> {
    const { archives } = await this.archiveService.listArchives(companyId, {
      startDate: filter.startDate,
      endDate: filter.endDate,
      limit: 1000,
    });

    const filtered = filter.status
      ? archives.filter(a => filter.status!.includes(a.status as any))
      : archives;

    const zip = new JSZip();

    for (const archive of filtered) {
      const exported = await this.exportSingle(archive.id, format);
      zip.file(exported.filename, exported.content);
    }

    const manifest = {
      exportedAt: new Date().toISOString(),
      companyId,
      filter,
      count: filtered.length,
      format,
    };
    zip.file('manifest.json', JSON.stringify(manifest, null, 2));

    return zip.generateAsync({ type: 'nodebuffer' });
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Direct FTA upload | ASP-mediated transmission | July 2026 | Must integrate with ASP or DCTCE |
| PDF delivery | Peppol network delivery | July 2026 | Must support structured formats |
| Manual status checks | Real-time MLS responses | July 2026 | Build status tracking system |
| Single format | XML + JSON export | July 2026 | Support multiple export formats |
| Manual TDD filing | Near real-time TDD | July 2026 | Auto-generate TDD from invoices |

**Deprecated/outdated:**
- Direct buyer email delivery (must go through ASP network after 2027)
- Manual tax reporting (TDD auto-extracted and transmitted)
- PDF-only exports (structured XML/JSON required)

## Open Questions

1. **DCTCE Direct API Specification**
   - What we know: OAuth 2.0 authentication, REST API mentioned
   - What's unclear: Exact endpoints, request/response schemas not public
   - Recommendation: Use FTA Sandbox for testing; implement ASP provider as primary path

2. **TDD Field-Level Specification**
   - What we know: TDD contains tax-relevant subset of invoice data
   - What's unclear: Exact required fields not in public documentation
   - Recommendation: Extract all tax-related PINT-AE fields; adjust based on sandbox feedback

3. **MLS Extended Error Codes**
   - What we know: AB, AP, RE are core codes
   - What's unclear: Full list of validation error codes
   - Recommendation: Implement flexible error mapping; update based on real responses

4. **Batch Transmission Limits**
   - What we know: Batches allowed, partial success supported
   - What's unclear: Maximum batch size, rate limits
   - Recommendation: Start with individual transmission; add batching after testing

5. **ASP Provider API Differences**
   - What we know: ASPs may have different API formats
   - What's unclear: No standardized ASP API specification
   - Recommendation: Build flexible provider interface; implement per-ASP adapters

6. **Sandbox vs Production Differences**
   - What we know: FTA provides sandbox environment
   - What's unclear: Sandbox limitations, data requirements
   - Recommendation: Test thoroughly in sandbox before July 2026 pilot

## Sources

### Primary (HIGH confidence)
- [UAE Ministry of Finance E-Invoicing Portal](https://mof.gov.ae/en/about-ministry/mof-initiatives/einvoicing/) - Official 5-corner model description
- [OpenPeppol PINT AE Specification](https://docs.peppol.eu/poac/ae/2025-Q2/pint-ae/) - PINT-AE format reference
- [PEPPOL BIS Billing 3.0 Rules](https://docs.peppol.eu/poacc/billing/3.0/rules/ubl-peppol/) - Validation rules and Schematron
- [BullMQ Documentation](https://docs.bullmq.io/) - Queue implementation patterns
- [Phase 6 Research](06-RESEARCH.md) - Existing PINT-AE generation patterns
- [07-CONTEXT.md](07-CONTEXT.md) - Phase decisions from discussion

### Secondary (MEDIUM confidence)
- [Deloitte UAE E-Invoicing Analysis](https://www.deloitte.com/middle-east/en/services/tax/perspectives/uae-e-invoicing-data-dictionary-release-for-consultation.html) - TDD field analysis
- [ClearTax UAE E-Invoicing Guide](https://www.cleartax.com/ae/e-invoicing-uae) - Implementation timeline, MLS codes
- [RTC Suite UAE E-Invoicing Guide](https://rtcsuite.com/e-invoicing-uae/) - MLS status codes, 5-corner details
- [KPMG UAE E-Invoicing Framework](https://kpmg.com/us/en/taxnewsflash/news/2025/10/uae-framework-scope-implementation-e-invoicing-system.html) - TDD reporting SLA
- [Flick Network UAE E-Invoice Format](https://www.flick.network/en-ae/uae-standard-e-invoice-xml-format) - Field mapping details

### Tertiary (LOW confidence)
- Various ASP provider websites - API patterns (need verification per provider)
- Community blog posts on Peppol integration
- WebSearch results on error handling patterns

### Existing Codebase (HIGH confidence)
- `src/services/einvoice/asp-client.interface.ts` - IAspClient interface (Phase 6)
- `src/services/einvoice/einvoice-archive.service.ts` - Archive service with status update
- `src/types/einvoice.types.ts` - EInvoiceStatus, MLS types already defined
- `prisma/schema.prisma` - einvoice_archives table with transmission fields

## Metadata

**Confidence breakdown:**
- Transmission architecture: HIGH - Based on PEPPOL standards and UAE MoF publications
- TDD structure: MEDIUM - Fields inferred from PINT-AE; exact spec not public
- MLS codes: MEDIUM - Core codes documented; extended codes unclear
- ASP integration: LOW - No standardized API; varies by provider
- DCTCE direct API: LOW - Not publicly documented; rely on sandbox
- Export formats: HIGH - XML standard, JSON based on UBL mapping

**Research date:** 2026-01-25
**Valid until:** 2026-07-01 (review after e-invoicing pilot launch)

## Implementation Recommendations

### What to Build (Phase 7 Scope)

1. **ITransmissionProvider Interface** - Abstraction for DCTCE/ASP/Sandbox
2. **SandboxProvider** - FTA Sandbox integration for testing
3. **TddBuilderService** - Tax Data Document extraction from archives
4. **MlsHandlerService** - Status processing with error mapping
5. **TransmissionQueueService** - BullMQ-based job queue
6. **TransmissionWorker** - Job processor with retry logic
7. **ExportService** - XML/JSON single + bulk export
8. **NotificationService** - Email alerts for rejections/failures
9. **Transmission Dashboard** - Queue status, health monitoring
10. **Database migrations** - Status enum updates, queue tracking

### Defer to Later
- Direct ASP provider implementations (await ASP partnerships)
- DCTCE direct integration (await API specification release)
- Advanced batch transmission (start with individual)
- Webhook receivers for async MLS (implement polling first)

### Estimated Effort
| Component | Effort | Notes |
|-----------|--------|-------|
| ITransmissionProvider + SandboxProvider | 8 hours | Interface + sandbox stub |
| TddBuilderService | 6 hours | XML parsing, field extraction |
| MlsHandlerService + ErrorMapper | 6 hours | Status mapping, notifications |
| TransmissionQueueService + Worker | 12 hours | BullMQ setup, retry logic |
| ExportService | 6 hours | XML/JSON + ZIP bulk |
| NotificationService | 4 hours | Email templates |
| Dashboard components | 8 hours | Queue status, health widget |
| Database migrations | 2 hours | Status enum, queue table |
| Unit/integration tests | 12 hours | Queue, worker, export tests |
| **Total** | **64 hours** | ~8 days |
