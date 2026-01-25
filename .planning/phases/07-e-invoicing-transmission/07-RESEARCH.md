# Phase 7: E-Invoicing Transmission and Processing - Research

**Researched:** 2026-01-25
**Domain:** UAE DCTCE E-Invoicing Transmission, Permission Systems, Package Integration
**Confidence:** HIGH (based on existing codebase patterns + UAE e-invoicing specifications)

## Summary

Phase 7 implements the transmission layer for UAE e-invoicing, connecting Phase 6's PINT-AE XML generation to the Federal Tax Authority's DCTCE platform via Accredited Service Providers (ASPs). This research focuses heavily on permissions, package integration, and superuser access patterns as requested.

The UAE DCTCE model uses a "5-corner" architecture where e-invoices flow through ASPs using PEPPOL infrastructure, with key tax data reported to FTA in near real-time. The system requires OAuth 2.0 authentication for direct DCTCE connections, with ASP-specific API key authentication for ASP routing. All transmission events require comprehensive audit logging with 7-year retention for FTA compliance.

**Primary recommendation:** Extend the existing UAE_COMPLIANCE package with einvoicing.transmission sub-module, implementing transmission permissions with strict SoD between invoice creation and production submission, and applying the superuser access framework for ASP credential management.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| axios | 1.6.x | HTTP client for DCTCE/ASP API calls | Standard HTTP client with interceptors for auth |
| p-queue | 8.x | Transmission queue management | Concurrency control for rate-limited APIs |
| p-retry | 6.x | Exponential backoff retry logic | Handles transient transmission failures |
| fast-xml-parser | 4.x | XML parsing for DCTCE responses | Already used in Phase 6 for PINT-AE |
| crypto | native | OAuth signature, credential encryption | Built-in Node.js crypto for secure operations |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @prisma/client | existing | Database operations | Queue persistence, status tracking |
| inversify | existing | DI container | Service injection for providers |
| nodemailer | existing | Email notifications | Rejection/failure alerts |
| jsonwebtoken | existing | JWT for OAuth tokens | DCTCE authentication |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| axios | node-fetch | axios has better interceptor support for OAuth refresh |
| p-queue | bull/bullmq | p-queue is simpler, no Redis dependency; bull for high-volume production |
| custom retry | axios-retry | p-retry more flexible for non-axios retry scenarios |

**Installation:**
```bash
npm install p-queue p-retry
# axios, fast-xml-parser already installed from Phase 6
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── services/
│   ├── einvoice/
│   │   ├── transmission/
│   │   │   ├── transmission-queue.service.ts     # Queue management
│   │   │   ├── transmission-status.service.ts    # Status tracking
│   │   │   ├── transmission-retry.service.ts     # Retry logic
│   │   │   └── transmission-export.service.ts    # XML/JSON export
│   │   ├── providers/
│   │   │   ├── transmission-provider.interface.ts  # ITransmissionProvider
│   │   │   ├── dctce-direct.provider.ts          # FTA direct
│   │   │   ├── asp.provider.ts                   # ASP routing
│   │   │   └── sandbox.provider.ts               # FTA sandbox
│   │   └── credentials/
│   │       ├── credential-store.service.ts       # Encrypted storage
│   │       └── oauth-token.service.ts            # Token management
├── types/
│   └── einvoice/
│       ├── einvoice-transmission-permissions.ts  # Permission constants
│       └── einvoice-transmission.types.ts        # Transmission types
├── middleware/
│   └── einvoice-transmission.middleware.ts       # Permission guards
└── prisma/
    └── seeds/
        └── einvoice-transmission-permissions.seed.ts
```

### Pattern 1: Provider Interface Pattern (from 07-CONTEXT.md)
**What:** Abstract transmission provider interface with concrete implementations
**When to use:** Always - tenant configuration determines which provider is used

```typescript
// Source: Established pattern from Phase 6 + 07-CONTEXT.md decisions
interface ITransmissionProvider {
  transmit(invoice: EInvoiceArchive): Promise<TransmissionResult>;
  checkStatus(transmissionId: string): Promise<TransmissionStatus>;
  getCredentialRequirements(): CredentialRequirement[];
  validateCredentials(credentials: ProviderCredentials): Promise<boolean>;
  supportsEnvironment(env: 'sandbox' | 'production'): boolean;
}

class DctceDirectProvider implements ITransmissionProvider {
  // OAuth 2.0 client credentials flow
  // Direct REST API to FTA DCTCE
}

class AspProvider implements ITransmissionProvider {
  // ASP-specific API key authentication
  // Routes through tenant's chosen ASP
}

class SandboxProvider implements ITransmissionProvider {
  // FTA official sandbox
  // No local mocking - use real FTA sandbox
}
```

### Pattern 2: Status State Machine (from 07-CONTEXT.md)
**What:** Invoice transmission status tracking with defined transitions
**When to use:** All transmission operations

```typescript
// Source: 07-CONTEXT.md decisions
enum EInvoiceTransmissionStatus {
  DRAFT = 'DRAFT',              // Generated, not yet submitted
  QUEUED = 'QUEUED',            // In transmission queue
  TRANSMITTING = 'TRANSMITTING', // Currently being sent
  PENDING_CLEARANCE = 'PENDING_CLEARANCE', // Received by FTA
  CLEARED = 'CLEARED',          // Successfully cleared
  REJECTED = 'REJECTED',        // Rejected with errors
  FAILED = 'FAILED'             // Transmission failure
}

const STATUS_TRANSITIONS: Record<EInvoiceTransmissionStatus, EInvoiceTransmissionStatus[]> = {
  DRAFT: ['QUEUED'],
  QUEUED: ['TRANSMITTING', 'FAILED'],
  TRANSMITTING: ['PENDING_CLEARANCE', 'REJECTED', 'FAILED'],
  PENDING_CLEARANCE: ['CLEARED', 'REJECTED'],
  CLEARED: [],  // Terminal
  REJECTED: [], // Terminal (requires new submission after correction)
  FAILED: ['QUEUED'] // Can retry
};
```

### Pattern 3: Permission Bundle Pattern (from WPS/VAT phases)
**What:** Group permissions by role for easy assignment
**When to use:** E-invoice transmission permission definition

```typescript
// Source: Existing pattern from 05-07-PLAN.md (WPS) and 03-10-PLAN.md (VAT)
export const EINVOICE_TRANSMISSION_PERMISSIONS = {
  // Queue Management
  QUEUE_VIEW: 'einvoicing:queue:view',
  QUEUE_SUBMIT: 'einvoicing:queue:submit',
  QUEUE_RETRY: 'einvoicing:queue:retry',
  QUEUE_CANCEL: 'einvoicing:queue:cancel',

  // Status & Monitoring
  STATUS_VIEW: 'einvoicing:status:view',
  STATUS_EXPORT: 'einvoicing:status:export',

  // Transmission Operations
  TRANSMIT_SANDBOX: 'einvoicing:transmit:sandbox',
  TRANSMIT_PRODUCTION: 'einvoicing:transmit:production',
  TRANSMIT_BULK: 'einvoicing:transmit:bulk',

  // Credential Management
  CREDENTIALS_VIEW: 'einvoicing:credentials:view',
  CREDENTIALS_MANAGE: 'einvoicing:credentials:manage',

  // Export
  EXPORT_XML: 'einvoicing:export:xml',
  EXPORT_JSON: 'einvoicing:export:json',
  EXPORT_BULK: 'einvoicing:export:bulk',

  // Configuration
  CONFIG_VIEW: 'einvoicing:config:view',
  CONFIG_EDIT: 'einvoicing:config:edit',
  MODE_SWITCH: 'einvoicing:mode:switch', // sandbox to production

  // Audit
  AUDIT_VIEW: 'einvoicing:audit:view',
  AUDIT_EXPORT: 'einvoicing:audit:export'
} as const;
```

### Anti-Patterns to Avoid
- **Direct API Calls:** Never call DCTCE/ASP directly from controllers - always use provider interface
- **Synchronous Transmission:** Never block request for transmission - use queue pattern
- **Unencrypted Credentials:** Never store ASP keys or OAuth secrets in plain text
- **Missing Status Transitions:** Never update status without checking valid transitions
- **Ignoring Retry Windows:** Never retry after 24-hour window - mark as FAILED

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Retry with backoff | Custom retry loop | p-retry library | Edge cases: jitter, max attempts, abort |
| Queue concurrency | Array with Promise.all | p-queue library | Rate limiting, concurrency control |
| OAuth token refresh | Manual expiry check | axios interceptors | Automatic refresh, thread-safe |
| Credential encryption | Custom crypto | crypto.createCipheriv | Proven, audited crypto |
| Permission checks | Custom middleware | Existing requirePermission | Consistent with codebase |
| Audit logging | Custom implementation | Existing auditLogs table | 7-year retention already implemented |

**Key insight:** The codebase already has established patterns for permissions, audit logging, and package integration from VAT (Phase 3), WPS (Phase 5), and E-Invoice Core (Phase 6). Phase 7 should extend these patterns, not reinvent them.

## Permission Model Design

### E-Invoice Transmission Permissions

Based on existing WPS and VAT permission patterns, the transmission permissions follow the `{module}:{resource}:{action}` convention:

```typescript
// Permission Categories for E-Invoice Transmission

// 1. QUEUE MANAGEMENT
'einvoicing:queue:view'      // View transmission queue
'einvoicing:queue:submit'    // Submit invoices to queue
'einvoicing:queue:retry'     // Retry failed transmissions
'einvoicing:queue:cancel'    // Cancel queued transmissions

// 2. TRANSMISSION OPERATIONS
'einvoicing:transmit:sandbox'     // Submit to FTA sandbox
'einvoicing:transmit:production'  // Submit to FTA production
'einvoicing:transmit:bulk'        // Bulk submission operations

// 3. CREDENTIAL MANAGEMENT (Superuser scope)
'einvoicing:credentials:view'     // View credential status (not values)
'einvoicing:credentials:manage'   // Configure ASP/DCTCE credentials

// 4. CONFIGURATION
'einvoicing:config:view'          // View transmission settings
'einvoicing:config:edit'          // Edit transmission settings
'einvoicing:mode:switch'          // Switch sandbox/production mode

// 5. EXPORT
'einvoicing:export:xml'           // Export as PINT-AE XML
'einvoicing:export:json'          // Export as JSON
'einvoicing:export:bulk'          // Bulk export operations

// 6. AUDIT (FTA compliance)
'einvoicing:audit:view'           // View transmission audit logs
'einvoicing:audit:export'         // Export audit logs for FTA
```

### Role-Based Permission Bundles

Following the WPS/VAT pattern from existing plans:

```typescript
export const EINVOICE_TRANSMISSION_PERMISSION_BUNDLES = {
  /**
   * E-Invoice Clerk - Basic queue and status viewing
   */
  EINVOICE_CLERK: [
    EINVOICE_TRANSMISSION_PERMISSIONS.QUEUE_VIEW,
    EINVOICE_TRANSMISSION_PERMISSIONS.STATUS_VIEW,
    EINVOICE_TRANSMISSION_PERMISSIONS.EXPORT_XML,
    EINVOICE_TRANSMISSION_PERMISSIONS.EXPORT_JSON,
    EINVOICE_TRANSMISSION_PERMISSIONS.AUDIT_VIEW,
  ],

  /**
   * E-Invoice Operator - Can submit to sandbox, retry failed
   */
  EINVOICE_OPERATOR: [
    EINVOICE_TRANSMISSION_PERMISSIONS.QUEUE_VIEW,
    EINVOICE_TRANSMISSION_PERMISSIONS.QUEUE_SUBMIT,
    EINVOICE_TRANSMISSION_PERMISSIONS.QUEUE_RETRY,
    EINVOICE_TRANSMISSION_PERMISSIONS.STATUS_VIEW,
    EINVOICE_TRANSMISSION_PERMISSIONS.TRANSMIT_SANDBOX,
    EINVOICE_TRANSMISSION_PERMISSIONS.EXPORT_XML,
    EINVOICE_TRANSMISSION_PERMISSIONS.EXPORT_JSON,
    EINVOICE_TRANSMISSION_PERMISSIONS.AUDIT_VIEW,
    EINVOICE_TRANSMISSION_PERMISSIONS.CONFIG_VIEW,
  ],

  /**
   * E-Invoice Manager - Full transmission authority except credentials
   */
  EINVOICE_MANAGER: [
    EINVOICE_TRANSMISSION_PERMISSIONS.QUEUE_VIEW,
    EINVOICE_TRANSMISSION_PERMISSIONS.QUEUE_SUBMIT,
    EINVOICE_TRANSMISSION_PERMISSIONS.QUEUE_RETRY,
    EINVOICE_TRANSMISSION_PERMISSIONS.QUEUE_CANCEL,
    EINVOICE_TRANSMISSION_PERMISSIONS.STATUS_VIEW,
    EINVOICE_TRANSMISSION_PERMISSIONS.STATUS_EXPORT,
    EINVOICE_TRANSMISSION_PERMISSIONS.TRANSMIT_SANDBOX,
    EINVOICE_TRANSMISSION_PERMISSIONS.TRANSMIT_PRODUCTION,
    EINVOICE_TRANSMISSION_PERMISSIONS.TRANSMIT_BULK,
    EINVOICE_TRANSMISSION_PERMISSIONS.EXPORT_XML,
    EINVOICE_TRANSMISSION_PERMISSIONS.EXPORT_JSON,
    EINVOICE_TRANSMISSION_PERMISSIONS.EXPORT_BULK,
    EINVOICE_TRANSMISSION_PERMISSIONS.CONFIG_VIEW,
    EINVOICE_TRANSMISSION_PERMISSIONS.AUDIT_VIEW,
    EINVOICE_TRANSMISSION_PERMISSIONS.AUDIT_EXPORT,
  ],

  /**
   * Finance Admin - Full access including credentials and mode switch
   */
  FINANCE_ADMIN: [
    ...Object.values(EINVOICE_TRANSMISSION_PERMISSIONS),
  ],

  /**
   * CFO - Full access (approves production mode switch)
   */
  CFO: [
    ...Object.values(EINVOICE_TRANSMISSION_PERMISSIONS),
  ],

  /**
   * Auditor - Read-only access to all transmission data and logs
   */
  AUDITOR: [
    EINVOICE_TRANSMISSION_PERMISSIONS.QUEUE_VIEW,
    EINVOICE_TRANSMISSION_PERMISSIONS.STATUS_VIEW,
    EINVOICE_TRANSMISSION_PERMISSIONS.STATUS_EXPORT,
    EINVOICE_TRANSMISSION_PERMISSIONS.EXPORT_XML,
    EINVOICE_TRANSMISSION_PERMISSIONS.EXPORT_JSON,
    EINVOICE_TRANSMISSION_PERMISSIONS.CONFIG_VIEW,
    EINVOICE_TRANSMISSION_PERMISSIONS.AUDIT_VIEW,
    EINVOICE_TRANSMISSION_PERMISSIONS.AUDIT_EXPORT,
  ],
};
```

### Separation of Duties (SoD) Requirements

Based on superuser-access-management-framework.md:

| Role A | Cannot Hold | Rationale |
|--------|-------------|-----------|
| Invoice Creator (Phase 6) | Production Transmitter | Creator cannot self-approve production submission |
| Credential Manager | Invoice Creator | Prevents credential misuse through self-submission |
| Config Editor | Audit Exporter | Configuration authority separate from audit evidence |
| Mode Switcher (sandbox/prod) | Bulk Transmitter | Prevents unauthorized production bulk submissions |

**SoD Conflict Matrix for E-Invoicing:**
```typescript
const EINVOICE_SOD_CONFLICTS = [
  {
    roleA: ['einvoicing:invoice:create'], // From Phase 6
    roleB: ['einvoicing:transmit:production'],
    reason: 'Invoice creation must be separate from production submission'
  },
  {
    roleA: ['einvoicing:credentials:manage'],
    roleB: ['einvoicing:transmit:production'],
    reason: 'Credential management must be separate from transmission authority'
  },
  {
    roleA: ['einvoicing:mode:switch'],
    roleB: ['einvoicing:transmit:bulk'],
    reason: 'Mode switching must be separate from bulk operations'
  }
];
```

## Superuser Access for DCTCE Transmission

Based on superuser-access-management-framework.md, apply the following to e-invoice transmission:

### Function-Specific Admin Roles

| Role | Scope | E-Invoice Transmission Permissions |
|------|-------|-----------------------------------|
| **E-Invoice Admin** | Transmission configuration, queue management | Full transmission permissions, no credential access |
| **Security Admin** | Credential management | einvoicing:credentials:* only |
| **Finance Admin** | Production mode control | einvoicing:mode:switch, transmit:production |
| **Audit Admin** | Read-only transmission logs | einvoicing:audit:view, einvoicing:audit:export |

### Credential Management Security

Following superuser framework requirements:

```typescript
// Credential storage pattern
interface EInvoiceCredentialStore {
  // OAuth 2.0 credentials for DCTCE Direct
  dctce: {
    clientId: string;          // Encrypted at rest
    clientSecret: string;      // Encrypted at rest
    tokenEndpoint: string;
    accessToken?: string;      // Cached, auto-refreshed
    tokenExpiresAt?: Date;
  };

  // ASP credentials
  asp: {
    apiKey: string;            // Encrypted at rest
    aspEndpoint: string;
    aspIdentifier: string;
  };

  // Metadata
  configuredBy: string;        // User ID who set credentials
  configuredAt: Date;          // When credentials were set
  lastValidated: Date;         // Last successful validation
  environment: 'sandbox' | 'production';
}

// Access control
// Only Security Admin can view/edit credentials
// Changes logged to audit trail with 7-year retention
// MFA required for credential modifications
```

### Temporary Elevated Access for Bulk Submissions

Following superuser framework section 5:

```typescript
interface TemporaryElevatedAccess {
  userId: string;
  permission: 'einvoicing:transmit:bulk';
  grantedBy: string;           // Approving manager
  approvedBy: string;          // CFO/Finance Admin
  reason: string;              // Business justification
  startTime: Date;
  endTime: Date;               // Max 24-72 hours
  autoRevoke: boolean;         // System auto-revokes at endTime
  actionsLogged: boolean;      // All actions during window flagged
}
```

### MFA Requirements

| Operation | MFA Required | Rationale |
|-----------|--------------|-----------|
| Credential configuration | Yes | Sensitive credential access |
| Production mode switch | Yes | Critical environment change |
| First production submission | Yes | Irreversible submission to FTA |
| Bulk production submission | Yes | High-impact operation |
| Audit log export | No | Read-only operation |
| Sandbox submission | No | Non-production environment |

## Package Integration

### UAE_COMPLIANCE Package Extension

From PACKAGES.md, Phase 7 extends UAE_COMPLIANCE:

```typescript
// Module mapping update
MODULE_PACK_MAPPING = {
  // ... existing mappings

  // Phase 7 additions
  einvoice_transmission: 'UAE_COMPLIANCE',
  einvoice_queue: 'UAE_COMPLIANCE',
  einvoice_credentials: 'UAE_COMPLIANCE',
  dctce_integration: 'UAE_COMPLIANCE',
  asp_integration: 'UAE_COMPLIANCE',
};
```

### Finance Coordination Rules

From PACKAGES.md pattern:

```typescript
COORDINATION_RULES = {
  // ... existing rules

  UAE_COMPLIANCE: [
    'vat_ledger',
    'ct_adjustments',
    'einvoice_transmission_status', // NEW: Show transmission status in Finance
    'einvoice_export_for_accounting' // NEW: Export for external accounting
  ]
}
```

### Package Expiration Handling for Transmission Queue

When UAE_COMPLIANCE package expires:

```typescript
// Queue behavior on package expiration
class TransmissionQueueService {
  async processQueue(companyId: string) {
    // Check package validity BEFORE processing
    const packageValid = await this.checkPackageExpiration(companyId, 'UAE_COMPLIANCE');

    if (!packageValid) {
      // Do NOT process queue
      // Mark queued items as SUSPENDED
      // Send notification to company admin
      await this.suspendQueue(companyId, 'Package expired');
      return;
    }

    // Process queue normally
    await this.processQueuedItems(companyId);
  }
}
```

## Common Pitfalls

### Pitfall 1: OAuth Token Expiration During Transmission
**What goes wrong:** Token expires mid-transmission, causing partial failures
**Why it happens:** Long-running bulk transmissions exceed token lifetime
**How to avoid:**
- Check token validity before each transmission
- Use axios interceptor for automatic refresh
- Implement proactive refresh 5 minutes before expiry
**Warning signs:** Sporadic 401 errors in transmission logs

### Pitfall 2: Race Condition in Status Updates
**What goes wrong:** Multiple status updates conflict, losing intermediate states
**Why it happens:** Async transmission responses processed out of order
**How to avoid:**
- Use optimistic locking (version field) on status updates
- Validate transition is allowed before updating
- Log all attempted transitions for audit
**Warning signs:** Status jumps (TRANSMITTING -> CLEARED without PENDING_CLEARANCE)

### Pitfall 3: Credential Exposure in Logs
**What goes wrong:** API keys or OAuth secrets appear in error logs
**Why it happens:** Axios error serialization includes request config with headers
**How to avoid:**
- Configure axios to redact sensitive headers before logging
- Use dedicated error sanitization middleware
- Never log request.headers directly
**Warning signs:** Credential rotation needed after log review

### Pitfall 4: Retry Storm on Rate Limit
**What goes wrong:** Exponential backoff creates burst when queue unblocks
**Why it happens:** All retries scheduled for same time window
**How to avoid:**
- Add jitter to retry delays (randomize +/- 30%)
- Use p-queue with concurrency limit
- Respect DCTCE rate limit headers
**Warning signs:** Spikes in 429 errors from DCTCE

### Pitfall 5: Permission Check Bypass via Direct Service Call
**What goes wrong:** Internal service calls skip permission middleware
**Why it happens:** Defense-in-depth not implemented at service layer
**How to avoid:**
- Implement permission checks at BOTH middleware AND service layer
- Follow existing VAT/WPS pattern with dual validation
- Use decorator pattern for permission checks in services
**Warning signs:** Audit log shows operations without corresponding permission grants

## Code Examples

### Transmission Provider Interface

```typescript
// Source: Codebase pattern + 07-CONTEXT.md decisions
import { EInvoiceArchive } from '@prisma/client';

export interface TransmissionResult {
  success: boolean;
  transmissionId: string;
  status: EInvoiceTransmissionStatus;
  ftaReferenceNumber?: string;
  clearanceNumber?: string;
  errors?: TransmissionError[];
  rawResponse?: unknown;
}

export interface TransmissionError {
  code: string;
  message: string;
  field?: string;       // Mapped to invoice field if possible
  severity: 'ERROR' | 'WARNING';
}

export interface ITransmissionProvider {
  /**
   * Transmit an e-invoice to DCTCE/ASP
   */
  transmit(invoice: EInvoiceArchive): Promise<TransmissionResult>;

  /**
   * Check status of a previous transmission
   */
  checkStatus(transmissionId: string): Promise<TransmissionStatus>;

  /**
   * Get required credentials for this provider
   */
  getCredentialRequirements(): CredentialRequirement[];

  /**
   * Validate stored credentials are valid
   */
  validateCredentials(credentials: ProviderCredentials): Promise<boolean>;

  /**
   * Check if provider supports the environment
   */
  supportsEnvironment(env: 'sandbox' | 'production'): boolean;
}
```

### Permission Middleware Pattern

```typescript
// Source: Existing 05-07-PLAN.md (WPS) and 03-10-PLAN.md (VAT) patterns
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types/express';
import { EINVOICE_TRANSMISSION_PERMISSIONS, EInvoiceTransmissionPermission } from '../types/einvoice-transmission-permissions';
import logger from '../services/logger.service';

export function requireEInvoiceTransmissionPermission(permission: EInvoiceTransmissionPermission) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user?.id;
      const companyId = authReq.query.companyId || authReq.body?.companyId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      // Check permission using pack-role system
      const hasPermission = await checkUserEInvoicePermission(userId, permission, companyId);

      if (!hasPermission) {
        logger.security('[E-Invoice Transmission] Permission denied', {
          userId,
          companyId,
          permission,
          path: req.path,
        });

        return res.status(403).json({
          success: false,
          message: `Permission denied: ${permission} required`,
        });
      }

      // Check package is active and not expired
      const packageValid = await checkPackageValid(companyId, 'UAE_COMPLIANCE');
      if (!packageValid) {
        return res.status(403).json({
          success: false,
          message: 'UAE_COMPLIANCE package not active or expired',
        });
      }

      next();
    } catch (error) {
      logger.error('[E-Invoice Transmission] Permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Permission check failed',
      });
    }
  };
}
```

### Credential Store Service

```typescript
// Source: Superuser access framework requirements
import { PrismaClient } from '@prisma/client';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { injectable, inject } from 'inversify';

@injectable()
export class CredentialStoreService {
  private readonly ALGORITHM = 'aes-256-gcm';
  private readonly KEY = process.env.CREDENTIAL_ENCRYPTION_KEY!; // 32 bytes

  constructor(
    @inject(TYPES.PrismaClient) private prisma: PrismaClient,
    @inject(TYPES.AuditService) private auditService: AuditService
  ) {}

  async setCredentials(
    companyId: string,
    credentials: ProviderCredentials,
    userId: string,
    mfaVerified: boolean
  ): Promise<void> {
    // MFA required for credential changes (superuser framework)
    if (!mfaVerified) {
      throw new Error('MFA verification required for credential changes');
    }

    // Encrypt sensitive fields
    const encrypted = this.encryptCredentials(credentials);

    await this.prisma.tenant_compliance_config.update({
      where: { companyId },
      data: {
        einvoiceCredentials: encrypted,
        credentialsConfiguredBy: userId,
        credentialsConfiguredAt: new Date(),
      }
    });

    // Audit log (7-year retention, per superuser framework)
    await this.auditService.log({
      action: 'CREDENTIALS_UPDATE',
      entity: 'EInvoiceCredentials',
      entityId: companyId,
      userId,
      newValue: { provider: credentials.provider, environment: credentials.environment },
      // Never log actual credential values
    });
  }

  private encryptCredentials(credentials: ProviderCredentials): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv(this.ALGORITHM, Buffer.from(this.KEY, 'hex'), iv);

    const sensitive = JSON.stringify({
      clientSecret: credentials.clientSecret,
      apiKey: credentials.apiKey,
    });

    let encrypted = cipher.update(sensitive, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return JSON.stringify({
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      data: encrypted,
      metadata: {
        clientId: credentials.clientId,
        endpoint: credentials.endpoint,
        provider: credentials.provider,
      }
    });
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SOAP/EDI transmission | REST API + PEPPOL AS4 | UAE DCTCE 2026 | Modern API patterns |
| Manual XML upload | Automated queue-based transmission | Current | Real-time compliance |
| Shared API keys | OAuth 2.0 + MFA | Current | Enhanced security |
| Single admin role | Function-specific admin roles | Superuser framework | SoD enforcement |

**Deprecated/outdated:**
- **Manual XML file upload:** FTA requires automated transmission through DCTCE/ASP
- **Shared credentials:** Superuser framework mandates individual accountability
- **SMS-based MFA:** Prohibited per superuser framework (SIM-swap vulnerable)

## Open Questions

Things that couldn't be fully resolved:

1. **DCTCE Rate Limits**
   - What we know: DCTCE uses rate limiting per FTA documentation
   - What's unclear: Exact rate limit values (TPS, daily limits)
   - Recommendation: Implement configurable rate limiting, start conservative (10 TPS), adjust based on sandbox testing

2. **ASP API Specifications**
   - What we know: ASPs provide their own API specs, common REST patterns
   - What's unclear: Specific ASP implementations vary
   - Recommendation: Use abstract ITransmissionProvider, implement ASP-specific adapters as needed

3. **FTA Sandbox Availability**
   - What we know: FTA sandbox available for July 2026 pilot
   - What's unclear: Access credentials, registration process
   - Recommendation: Monitor FTA announcements, implement SandboxProvider when specs available

4. **Batch Size Limits**
   - What we know: Batch submissions supported
   - What's unclear: Maximum batch size, optimal batch size
   - Recommendation: Start with batches of 50, monitor performance, adjust

## Sources

### Primary (HIGH confidence)
- Existing codebase: `web-erp-app/backend/` - Permission middleware, pack-role system
- `.planning/PACKAGES.md` - Package architecture, UAE_COMPLIANCE structure
- `superuser-access-management-framework.md` - Security requirements
- `07-CONTEXT.md` - Phase 7 decisions from discussion phase
- `05-07-PLAN.md` - WPS permission pattern reference
- `03-10-PLAN.md` - VAT permission pattern reference

### Secondary (MEDIUM confidence)
- [EDICOM: UAE E-Invoicing](https://edicomgroup.com/blog/united-arab-emirates-electronic-invoicing-project) - DCTCE model overview
- [Cleartax: UAE E-Invoicing](https://www.cleartax.com/ae/e-invoicing-uae) - PINT-AE format requirements
- [PEPPOL AS4 Specification](https://docs.peppol.eu/edelivery/as4/specification/) - Transmission protocol
- [Storecove: PEPPOL Access Point](https://www.storecove.com/us/en/solutions/peppol-access-point/) - ASP patterns

### Tertiary (LOW confidence - needs validation)
- FTA technical specifications (not yet publicly available for July 2026 pilot)
- Specific ASP API documentation (varies by provider)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Based on existing Phase 6 dependencies and codebase patterns
- Architecture: HIGH - Follows established codebase patterns (WPS, VAT)
- Permission model: HIGH - Direct extension of existing pack-role system
- Superuser access: HIGH - Based on documented framework
- DCTCE/ASP specifics: MEDIUM - UAE announcements available, detailed specs pending
- Pitfalls: MEDIUM - Based on general API integration experience

**Research date:** 2026-01-25
**Valid until:** 2026-03-25 (30 days for stable patterns, review before July 2026 pilot)
