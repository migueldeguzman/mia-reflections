---
phase: 07-e-invoicing-transmission
plan: 06
subsystem: e-invoice-mls
tags: [mls, dctce, peppol, error-mapping, notification]

dependency-graph:
  requires: [07-01]
  provides: [MlsHandlerService, ErrorMapperService, MlsStatusCode, MLS types]
  affects: [07-07]

tech-stack:
  added: []
  patterns: [error-code-mapping, field-extraction, notification-service, status-state-machine]

key-files:
  created:
    - web-erp-app/backend/src/services/einvoice/mls/__tests__/mls-handler.service.test.ts
  verified:
    - web-erp-app/backend/src/services/einvoice/mls/mls.types.ts
    - web-erp-app/backend/src/services/einvoice/mls/error-mapper.service.ts
    - web-erp-app/backend/src/services/einvoice/mls/mls-handler.service.ts
    - web-erp-app/backend/src/services/einvoice/mls/index.ts

decisions:
  - title: Error storage in JSON field
    rationale: Store mapped errors in transmission errorDetails JSON field for simplicity
    pattern: errorDetails JSONB column

metrics:
  duration: 15min
  completed: 2026-01-25
---

# Phase 07 Plan 06: MLS Handler Service Summary

**One-liner:** DCTCE MLS response handler with error-to-field mapping and rejection notifications

## Objectives Achieved

1. MLS type definitions with status codes (AB, AP, RE, PENDING, PROCESSING, ERROR, TIMEOUT)
2. ErrorMapperService for PINT-AE/PEPPOL error code to invoice field mapping
3. MlsHandlerService for processing responses, updating status, and sending notifications
4. 65 unit tests covering all status handling, error mapping, and notification logic

## What Was Built

### MLS Types (mls.types.ts - 366 lines)
- MlsStatusCode enum with DCTCE standard codes
- MLS_TO_STATUS_MAP mapping to EInvoiceTransmissionStatus
- MlsResponse, MlsValidationError, MlsNotificationConfig interfaces
- STATUS_DESCRIPTIONS in English and Arabic
- Helper functions: isMlsSuccess, isMlsCleared, isMlsRejected, isMlsFailed
- requiresNotification for notification config evaluation

### Error Mapper Service (error-mapper.service.ts - 483 lines)
- PINT_AE_ERROR_CODES: 50+ UAE-specific validation error descriptions
- ERROR_FIELD_MAP: Maps error codes to invoice field names for UI highlighting
- SUGGESTED_FIXES: User-friendly fix instructions for common errors
- extractXPathField: Context-aware field extraction from XPath locations
- categorizeErrors: Groups errors by severity (fatal, error, warning)
- formatErrorsForEmail/Html: Notification-ready error formatting

### MLS Handler Service (mls-handler.service.ts - 573 lines)
- handleMlsResponse: Main entry point for processing DCTCE responses
- State machine validation for status transitions
- Error mapping and storage in errorDetails JSON field
- History logging to einvoice_transmission_history table
- Compliance audit integration for FTA requirements
- Email notifications on rejection/failure with configurable recipients
- HTML email templates with error details and suggested fixes

### Unit Tests (mls-handler.service.test.ts - 871 lines)
- 65 tests across 8 test suites
- MLS status mapping validation
- Error code to field mapping tests
- XPath field extraction tests
- Handler happy path, rejection, and failure scenarios
- Notification logic tests
- State transition validation
- Integration scenarios for full flows

## Key Technical Decisions

### 1. Error Storage Strategy
Store mapped errors in transmission errorDetails JSON field rather than separate table:
- Simpler schema
- Atomic updates with transmission status
- Easy retrieval for UI display

### 2. XPath Field Extraction
Smart extraction prioritizes specific patterns:
- Check supplier/buyer context first
- Then specific element patterns
- Fallback to generic element extraction

### 3. Notification Configuration
Default config:
- notifyOnRejection: true
- notifyOnFailure: true
- notifyOnClearance: false (success doesn't need alert)
- includeErrorDetails: true

## API/Interface

```typescript
// Main handler
const result = await mlsHandler.handleMlsResponse(
  transmissionId,
  mlsResponse,
  userId,
  notificationConfig
);

// Error mapping
const mappedErrors = errorMapper.mapErrors(validationErrors);
const categorized = errorMapper.categorizeErrors(mappedErrors);
```

## Files Modified/Created

| File | Lines | Purpose |
|------|-------|---------|
| mls.types.ts | 366 | MLS type definitions and status mappings |
| error-mapper.service.ts | 483 | Error code to field mapping service |
| mls-handler.service.ts | 573 | MLS response handling service |
| index.ts | 24 | Module exports |
| mls-handler.service.test.ts | 871 | Unit tests (65 tests) |

## Verification

- TypeScript compilation: Services compile with existing codebase
- Unit tests: 65/65 passing
- Error codes mapped: 50+ PINT-AE/PEPPOL codes
- Key patterns present: prisma.einvoice_transmissions, ERROR_FIELD_MAP

## Success Criteria Met

1. [x] MlsStatusCode enum includes AB, AP, RE, and internal codes
2. [x] MLS_TO_STATUS_MAP correctly maps to EInvoiceTransmissionStatus
3. [x] ErrorMapperService maps error codes to invoice fields
4. [x] Suggested fixes are user-friendly for common errors
5. [x] MlsHandlerService updates transmission status on response
6. [x] Validation errors stored with field mapping for UI
7. [x] Email notification sent on rejection/failure
8. [x] Status transitions logged to einvoice_transmission_history
9. [x] Unit tests cover status mapping, notifications, and error scenarios

## Deviations from Plan

None - plan executed exactly as written. Services already existed from prior work; tests added to complete coverage requirements.

## Next Phase Readiness

Ready for 07-07 (TransmissionWorkerService) which will:
- Use MlsHandlerService to process provider responses
- Call providers to submit invoices
- Pass MlsResponse to handler for status updates
