---
phase: "07"
plan: "03"
subsystem: e-invoice-transmission
tags: [credentials, encryption, oauth, aes-256-gcm, security]
dependency-graph:
  requires: [07-01]
  provides: [credential-store-service, oauth-token-service, encrypted-credentials]
  affects: [07-04, 07-05, 07-06]
tech-stack:
  added: []
  patterns: [aes-256-gcm-encryption, scrypt-key-derivation, oauth-client-credentials, axios-interceptor]
key-files:
  created:
    - web-erp-app/backend/src/services/einvoice/transmission/credential-store.service.ts
    - web-erp-app/backend/src/services/einvoice/transmission/oauth-token.service.ts
    - web-erp-app/backend/src/services/einvoice/transmission/index.ts
  modified:
    - web-erp-app/backend/src/config/container.ts
    - web-erp-app/backend/src/config/types.ts
decisions:
  - id: "07-03-D1"
    decision: "AES-256-GCM with scryptSync key derivation"
    rationale: "Industry standard authenticated encryption; scrypt prevents brute-force on master key"
  - id: "07-03-D2"
    decision: "5-minute token refresh buffer"
    rationale: "Ensures tokens refreshed before expiry to prevent failed API calls"
  - id: "07-03-D3"
    decision: "Per-company concurrent request deduplication"
    rationale: "Prevents multiple simultaneous token acquisitions wasting API calls"
  - id: "07-03-D4"
    decision: "MFA flag passed as parameter, validated in service"
    rationale: "Middleware handles MFA check; service enforces as defense-in-depth"
metrics:
  duration: "10 minutes"
  completed: "2026-01-25"
---

# Phase 07 Plan 03: Credential Store and OAuth Token Services Summary

AES-256-GCM encrypted credential storage and OAuth 2.0 token management with automatic refresh for DCTCE/ASP e-invoice transmission.

## What Was Built

### 1. CredentialStoreService (534 lines)

Secure storage for ASP/DCTCE credentials with AES-256-GCM encryption.

**Encryption Implementation:**
- Algorithm: AES-256-GCM (authenticated encryption)
- Key derivation: scryptSync from CREDENTIAL_ENCRYPTION_KEY env var
- Key length: 32 bytes (256 bits)
- IV: 16 bytes (128 bits), randomly generated per update
- Auth tag: 16 bytes stored alongside ciphertext

**Public Methods:**

| Method | Purpose | Security |
|--------|---------|----------|
| `getCredentialStatus(companyId)` | Return status without secrets | No secrets exposed |
| `setCredentials(companyId, input, userId, mfaVerified)` | Update credentials | MFA required, audit logged |
| `getDecryptedCredentials(companyId)` | Internal use only | Returns decrypted secrets |
| `updateCachedTokens(companyId, token, expiry, refresh?)` | Store OAuth tokens | Tokens encrypted at rest |
| `recordConnectionTest(companyId, success, error?)` | Log test results | Updates validation status |
| `clearCachedTokens(companyId)` | Clear on auth failure | Prevents stale token use |

**Security Features:**
- MFA enforcement: `setCredentials` throws if `mfaVerified=false`
- Audit trail: All credential changes logged via ComplianceAuditService
- No secret logging: Credentials never appear in logs
- Status-only responses: `getCredentialStatus` returns metadata only

### 2. OAuthTokenService (382 lines)

OAuth 2.0 token management for DCTCE direct connection.

**Token Acquisition:**
- Flow: OAuth 2.0 client_credentials grant
- Scope: `einvoice:transmit einvoice:status`
- Token storage: Encrypted in einvoice_credentials table

**Auto-Refresh Logic:**
```
TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000 (5 minutes)

if (tokenExpiresAt > now + 5min):
    return cached token
else if (hasRefreshToken):
    try refresh_token grant
    fallback to client_credentials
else:
    acquire new token via client_credentials
```

**Concurrent Request Deduplication:**
- Map<companyId, Promise<CachedToken>> prevents duplicate requests
- First request acquires token; subsequent requests await same promise
- Map cleared after token acquisition completes

**Axios Interceptor Integration:**
```typescript
createAuthenticatedClient(companyId, baseURL): AxiosInstance
  - Request interceptor: Adds Bearer token header
  - Response interceptor: Handles 401 with automatic retry
    1. Clear cached tokens
    2. Acquire new token
    3. Retry original request
```

### 3. DI Container Integration

**TYPES registered:**
- `TYPES.CredentialStoreService: Symbol.for('CredentialStoreService')`
- `TYPES.OAuthTokenService: Symbol.for('OAuthTokenService')`

**Container bindings:**
- Both services bound as singletons
- OAuthTokenService injects CredentialStoreService

## Commits

| Commit | Description | Files |
|--------|-------------|-------|
| 9d635eb | CredentialStoreService with AES-256-GCM | credential-store.service.ts |
| 641fba0 | OAuthTokenService with auto-refresh | oauth-token.service.ts, index.ts |

## Verification Results

| Requirement | Status | Evidence |
|-------------|--------|----------|
| AES-256-GCM encryption | PASS | `createCipheriv('aes-256-gcm', ...)` |
| scryptSync key derivation | PASS | Line 122 |
| Secrets never logged | PASS | No credentials in logger calls |
| getCredentialStatus safe | PASS | Returns status fields only |
| setCredentials MFA check | PASS | Throws if `!mfaVerified` |
| Audit logging | PASS | `auditService.logWithHashChain()` call |
| client_credentials flow | PASS | `grant_type: 'client_credentials'` |
| 5-min refresh buffer | PASS | `TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000` |
| Concurrent deduplication | PASS | `tokenRefreshPromises` Map |
| Axios 401 interceptor | PASS | Response interceptor retries on 401 |
| DI bindings | PASS | container.ts, types.ts updated |
| Line count 200+ | PASS | 534 lines |

## Deviations from Plan

None - plan executed exactly as written.

## Success Criteria Verification

| Criterion | Status |
|-----------|--------|
| CredentialStoreService encrypts all secrets with AES-256-GCM | PASS |
| getCredentialStatus returns status without exposing secrets | PASS |
| setCredentials requires MFA verification flag | PASS |
| All credential changes logged to audit trail | PASS |
| OAuthTokenService implements client_credentials flow | PASS |
| Tokens auto-refresh before expiry with configurable buffer | PASS |
| Axios interceptor handles 401 response with token refresh | PASS |
| Concurrent token requests deduplicated per company | PASS |
| Failed token operations clear cached tokens | PASS |

## Key Decisions Made

1. **Encryption algorithm**: AES-256-GCM provides both confidentiality and authenticity
2. **Key derivation**: scryptSync prevents brute-force attacks on master key
3. **IV management**: Fresh IV per credential update, stored alongside ciphertext
4. **Token buffer**: 5 minutes ensures refresh happens before actual expiry
5. **Deduplication scope**: Per-company to prevent thundering herd on DCTCE

## Technical Notes

- CREDENTIAL_ENCRYPTION_KEY env var required at startup
- All encrypted fields stored as hex strings
- Auth tag stored separately for verification during decryption
- Token refresh uses same deduplication pattern as acquisition
- Axios client created per-call with company-specific token injection

## Dependencies

**Requires:**
- einvoice_credentials Prisma model (from 07-01)
- CREDENTIAL_ENCRYPTION constants (from 07-01)
- ComplianceAuditService (from Phase 2)

**Provides to 07-04+:**
- `CredentialStoreService.getDecryptedCredentials()` for API authentication
- `OAuthTokenService.getAccessToken()` for token acquisition
- `OAuthTokenService.createAuthenticatedClient()` for DCTCE API calls

## Environment Requirements

```bash
# Required environment variable
CREDENTIAL_ENCRYPTION_KEY=<64-character-hex-string>
```

## Next Phase Readiness

Ready for 07-04 (Transmission Queue Service). The credential services provide:
- Secure credential retrieval for DCTCE/ASP authentication
- Authenticated Axios clients for API calls
- Automatic token lifecycle management
