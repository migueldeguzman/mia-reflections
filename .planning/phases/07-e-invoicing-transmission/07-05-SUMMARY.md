---
phase: 07-e-invoicing-transmission
plan: 05
subsystem: einvoice-providers
tags: [transmission, providers, oauth, asp, sandbox, dctce, fta]
status: complete

dependency-graph:
  requires:
    - 07-01  # Transmission types and enums
    - 07-03  # OAuthTokenService, CredentialStoreService
    - 07-04  # TddBuilderService
  provides:
    - ITransmissionProvider interface
    - BaseTransmissionProvider abstract class
    - DctceDirectProvider (OAuth 2.0)
    - SandboxProvider (FTA sandbox)
    - AspProvider (API key auth)
    - ProviderFactoryService
  affects:
    - 07-07  # Transmission Worker will use providers
    - 07-08  # Export Service may need provider status
    - 07-09  # Dashboard will show provider status

tech-stack:
  added: []
  patterns:
    - Provider interface pattern (ITransmissionProvider)
    - Factory pattern (ProviderFactoryService)
    - Lazy initialization for credential loading
    - Status mapping (DCTCE/ASP vocabularies to internal enum)
    - Provider caching per company

file-tracking:
  created:
    - web-erp-app/backend/src/services/einvoice/providers/transmission-provider.interface.ts (284 lines)
    - web-erp-app/backend/src/services/einvoice/providers/dctce-direct.provider.ts (508 lines)
    - web-erp-app/backend/src/services/einvoice/providers/sandbox.provider.ts (370 lines)
    - web-erp-app/backend/src/services/einvoice/providers/asp.provider.ts (573 lines)
    - web-erp-app/backend/src/services/einvoice/providers/provider-factory.service.ts (276 lines)
    - web-erp-app/backend/src/services/einvoice/providers/index.ts (29 lines)
  modified:
    - web-erp-app/backend/src/config/types.ts

decisions:
  - id: "07-05-D1"
    decision: "Provider interface with BaseTransmissionProvider abstract class"
    rationale: "Common utilities (transmissionRef, error parsing) shared across providers"
  - id: "07-05-D2"
    decision: "Lazy initialization pattern for providers"
    rationale: "Credentials loaded on first use, not at construction time"
  - id: "07-05-D3"
    decision: "Provider caching in ProviderFactoryService"
    rationale: "Avoid recreating providers and re-authenticating on every transmission"
  - id: "07-05-D4"
    decision: "Sandbox always returns CLEARED status"
    rationale: "FTA sandbox validates immediately; SB- prefix distinguishes sandbox clearances"
  - id: "07-05-D5"
    decision: "ASP cancel via DELETE endpoint"
    rationale: "Common pattern for ASP APIs; not all ASPs support cancellation"

metrics:
  duration: "12 minutes"
  completed: 2026-01-25
---

# Phase 7 Plan 05: Transmission Provider Implementations Summary

Transmission provider implementations for DCTCE direct, ASP routing, and FTA sandbox following the ITransmissionProvider interface pattern.

## One-liner

Provider implementations (DctceDirectProvider, SandboxProvider, AspProvider) with OAuth/API key auth, status mapping, and ProviderFactoryService for instance management.

## What Was Built

### Task 1: Transmission Provider Interface (transmission-provider.interface.ts)

Created the base interface and abstract class for all transmission providers:

**ITransmissionProvider Interface Methods:**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `transmit` | archiveId, xml, metadata | TransmissionResult | Submit e-invoice |
| `checkStatus` | transmissionId | TransmissionStatusResult | Check submission status |
| `cancelTransmission?` | transmissionId | {success, message?} | Cancel pending (optional) |
| `getCredentialRequirements` | none | CredentialRequirement[] | List required credentials |
| `validateCredentials` | credentials | boolean | Validate credentials |
| `testConnection` | none | {connected, latencyMs?, error?} | Test connectivity |
| `supportsEnvironment` | env | boolean | Check environment support |
| `isConfigured` | none | boolean | Check if configured |

**BaseTransmissionProvider Utilities:**

| Method | Description |
|--------|-------------|
| `generateTransmissionRef()` | Create unique TX-{timestamp36}-{random6} references |
| `parseErrorResponse()` | Handle Error, object, and primitive error types |
| `isRetryableError()` | Detect transient errors (ECONNRESET, 429, etc.) |
| `formatDateForApi()` | Format dates as YYYY-MM-DD for API |

### Task 2: DCTCE Direct Provider (dctce-direct.provider.ts)

Direct FTA DCTCE connection with OAuth 2.0 authentication:

**Features:**
- Uses OAuthTokenService from 07-03 for token management
- Creates authenticated Axios client with auto-refresh interceptor
- Handles 401 responses with automatic token refresh
- Maps DCTCE status vocabulary to EInvoiceTransmissionStatus

**Credential Requirements:**
- `dctceClientId` - OAuth 2.0 client ID
- `dctceClientSecret` - OAuth 2.0 client secret (encrypted)
- `dctceTokenEndpoint` - OAuth token endpoint URL
- `dctceApiEndpoint` - DCTCE API base URL

**Status Mapping:**
```
RECEIVED, PROCESSING, VALIDATED, PENDING, SUBMITTED -> PENDING_CLEARANCE
CLEARED, APPROVED, ACCEPTED -> CLEARED
REJECTED, VALIDATION_FAILED -> REJECTED
FAILED, ERROR, TIMEOUT -> FAILED
```

### Task 3: Sandbox Provider (sandbox.provider.ts)

FTA official sandbox for testing:

**Features:**
- No authentication required (sandbox is open)
- Configurable via FTA_SANDBOX_URL environment variable
- Immediate validation results
- Sandbox clearance numbers use SB- prefix
- Always configured (no credentials needed)

**Behavior:**
- `transmit()` validates XML and returns immediate result
- Valid invoices receive CLEARED status immediately
- Invalid invoices receive REJECTED with validation errors
- `supportsEnvironment()` returns true only for SANDBOX

### Task 4: ASP Provider (asp.provider.ts)

Routes through Accredited Service Provider:

**Features:**
- API key authentication via X-API-Key header
- ASP-specific endpoint configuration
- Cancel transmission support via DELETE
- Status mapping for various ASP vocabularies

**Credential Requirements:**
- `aspApiKey` - API key from ASP (encrypted)
- `aspEndpoint` - ASP API base URL
- `aspIdentifier` - Unique client identifier
- `aspProviderName` - Display name (optional)

**API Format:**
```json
POST /einvoice/submit
{
  "clientReference": "TX-...",
  "invoice": { ... },
  "document": {
    "format": "PINT_AE",
    "content": "<base64>",
    "encoding": "base64"
  }
}
```

### Task 5: Provider Factory Service (provider-factory.service.ts)

Factory for creating and caching provider instances:

**Public Methods:**

| Method | Description |
|--------|-------------|
| `getProvider(companyId, mode?)` | Get/create provider for company |
| `getAvailableProviders(companyId)` | List providers with config status |
| `clearCache(companyId, mode?)` | Clear cached providers |
| `testProviderConnection(companyId, mode)` | Test specific provider |

**Caching:**
- Providers cached per company + mode combination
- Cache key format: `{companyId}:{mode}`
- Clear cache when credentials updated

## Commits

| Hash | Type | Description |
|------|------|-------------|
| cff96d2 | feat | Create transmission provider interface and base class |
| d9164d5 | feat | Create DCTCE direct provider with OAuth 2.0 |
| f91287e | feat | Create Sandbox, ASP providers and ProviderFactory |
| 196df85 | chore | Register ProviderFactoryService in DI types |

## Success Criteria Verification

| Criterion | Status | Evidence |
|-----------|--------|----------|
| ITransmissionProvider interface exported with all methods | PASS | 7 methods + 2 properties defined |
| BaseTransmissionProvider provides common utilities | PASS | 4 utility methods implemented |
| DctceDirectProvider uses OAuthTokenService for authentication | PASS | Line 125: `this.oauthService.createAuthenticatedClient()` |
| DctceDirectProvider maps DCTCE status vocabulary | PASS | DCTCE_STATUS_MAP with 13 mappings |
| SandboxProvider requires no credentials | PASS | `getCredentialRequirements()` returns empty array |
| SandboxProvider returns immediate validation results | PASS | Returns CLEARED or REJECTED immediately |
| AspProvider uses API key from encrypted credentials | PASS | `X-API-Key: credentials.aspApiKey` header |
| AspProvider supports cancel operation | PASS | `cancelTransmission()` method implemented |
| All providers implement testConnection() for health checks | PASS | All 3 providers implement testConnection |
| ProviderFactoryService caches provider instances | PASS | `providerCache` Map per company+mode |

## Deviations from Plan

None - plan executed exactly as written.

## Key Files

```
web-erp-app/backend/src/services/einvoice/providers/
  transmission-provider.interface.ts  # 284 lines - Interface + base class
  dctce-direct.provider.ts            # 508 lines - DCTCE with OAuth
  sandbox.provider.ts                 # 370 lines - FTA sandbox
  asp.provider.ts                     # 573 lines - ASP routing
  provider-factory.service.ts         # 276 lines - Factory + caching
  index.ts                            # 29 lines - Module exports

Total: 2,040 lines
```

## Usage Example

```typescript
import { ProviderFactoryService } from './providers';
import { TransmissionMode } from '../../../types/einvoice-transmission.types';

// Get provider for company (auto-detects mode from credentials)
const factory = container.get<ProviderFactoryService>(TYPES.ProviderFactoryService);
const provider = await factory.getProvider(companyId);

// Transmit e-invoice
const result = await provider.transmit(archiveId, xml, {
  companyId,
  einvoiceNumber: 'EI-INV-001',
  invoiceType: 'INVOICE',
  supplierTrn: '100123456789012',
  totalAmount: '1050.00',
  vatAmount: '50.00',
  currency: 'AED',
  issueDate: '2026-01-25',
});

if (result.success) {
  console.log('Transmission ID:', result.transmissionId);
  console.log('Status:', result.status);
  console.log('FTA Reference:', result.ftaReferenceNumber);
} else {
  console.error('Errors:', result.errors);
}

// Check status later
const status = await provider.checkStatus(result.transmissionId);
console.log('Current status:', status.status);
console.log('Clearance number:', status.clearanceNumber);
```

## Environment Variables

```bash
# Optional: Override FTA sandbox URL (default: https://sandbox.dctce.gov.ae)
FTA_SANDBOX_URL=https://sandbox.dctce.gov.ae
```

## Next Phase Readiness

Ready for:
- **07-07 (Transmission Worker)**: ProviderFactoryService provides providers for worker
- **07-08 (Export Service)**: Provider status available for export metadata
- **07-09 (Dashboard)**: Provider status and configuration UI

No blockers for subsequent plans.
