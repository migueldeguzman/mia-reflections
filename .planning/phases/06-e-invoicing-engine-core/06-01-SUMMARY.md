---
phase: 06
plan: 01
subsystem: e-invoicing
tags: [prisma, schema, typescript, archive, hash-chain, fta-compliance]
status: complete
dependency-graph:
  requires: [02-internal-controls-audit]
  provides: [einvoice-archive-schema, einvoice-types, hash-chain-model]
  affects: [06-02, 06-03, 06-04, 06-05, 06-06]
tech-stack:
  added: []
  patterns: [tamper-proof-hash-chain, 7-year-retention, immutability-trigger]
key-files:
  created:
    - web-erp-app/backend/prisma/migrations/20260124191900_einvoice_archive_schema/migration.sql
    - web-erp-app/backend/src/types/einvoice.types.ts
  modified:
    - web-erp-app/backend/prisma/schema.prisma
decisions:
  - id: einvoice-hash-chain
    choice: Same hash chain pattern as Phase 2 audit_logs
    rationale: Consistent tamper-proof implementation across compliance features
  - id: immutability-trigger
    choice: PostgreSQL trigger prevents core field modification
    rationale: Database-level enforcement as defense-in-depth
  - id: 7-year-retention
    choice: retentionEndDate calculated from createdAt + 7 years
    rationale: FTA EINV-05 requires 7-year retention for e-invoices
metrics:
  duration: 9m
  completed: 2026-01-24
---

# Phase 6 Plan 01: E-Invoice Archive Schema Summary

**One-liner:** E-invoice archive Prisma model with tamper-proof hash chain, TypeScript types for PINT-AE document structures

## What Was Built

### Task 1: E-Invoice Schema Additions

**Prisma Schema Updates:**

1. **EInvoiceStatus enum** - Lifecycle tracking for e-invoices:
   - GENERATED: XML created, not yet validated
   - VALIDATED: Passed UBL 2.1 + PINT AE validation
   - SUBMITTED: Sent to ASP
   - ACCEPTED: ASP confirmed acceptance
   - REJECTED: ASP rejected (needs correction)
   - CANCELLED: E-invoice cancelled
   - ARCHIVED: Long-term archival state

2. **EInvoiceFormat enum** - E-invoice format types:
   - PINT_AE: PEPPOL PINT AE 1.0.1
   - UBL_21: UBL 2.1 base format

3. **AuditAction enum additions** - E-invoice audit actions:
   - EINVOICE_GENERATE
   - EINVOICE_SUBMIT
   - EINVOICE_CANCEL

4. **einvoice_archives model** - Core archive table:
   - Source reference: invoiceId, einvoiceNumber (unique)
   - Content: xmlContent, xmlHash (SHA-256), qrCodeData
   - Status tracking: status enum
   - Validation: validationResult, validationErrors (JSON)
   - ASP submission: aspSubmissionId, aspSubmissionDate, aspResponseCode, aspResponseMessage, tddReference, mlsStatus
   - Hash chain: sequenceNumber (unique), previousHash, recordHash
   - Retention: retentionEndDate, isRetentionExpired
   - Indexes: companyId+createdAt, companyId+status, invoiceId, retentionEndDate, sequenceNumber

**Migration SQL:**
- CREATE TYPE for EInvoiceStatus and EInvoiceFormat enums
- ALTER TYPE for AuditAction additions
- CREATE SEQUENCE for atomic archive numbering
- CREATE TABLE for einvoice_archives with all fields
- CREATE TRIGGER for immutability (protects xml_content, xml_hash, sequence_number, previous_hash, record_hash)

### Task 2: E-Invoice TypeScript Types

**Type Definitions Created (einvoice.types.ts):**

| Export | Type | Purpose |
|--------|------|---------|
| EInvoiceStatus | Type alias | Matches Prisma enum |
| EInvoiceFormat | Type alias | Matches Prisma enum |
| TlvQrInput | Interface | QR code TLV encoding input |
| TlvTag | Enum | TLV field identifiers (1-8) |
| DecodedTlvData | Interface | QR code decoding result |
| EInvoiceValidationError | Interface | Validation error structure |
| EInvoiceValidationResult | Interface | Full validation result |
| EInvoiceArchiveRecord | Interface | Matches Prisma model |
| EInvoiceResult | Interface | Generation response |
| TaxInvoiceData | Interface | Source invoice data (Phase 3) |
| TaxInvoiceLineItem | Interface | Line item structure |
| PintAeInvoiceTypeCode | Enum | UBL invoice type codes |
| PintAeDocument | Interface | Full PINT-AE document |
| PintAeParty | Interface | Party (supplier/buyer) |
| PintAeTaxTotal | Interface | Tax totals structure |
| PintAeMonetaryTotal | Interface | Monetary amounts |
| PintAeInvoiceLine | Interface | Invoice line structure |
| EInvoiceData | Interface | Archive creation input |

**Constants Exported:**
- EINVOICE_GENESIS_HASH: 'GENESIS'
- EINVOICE_HASH_ALGORITHM: 'sha256'
- EINVOICE_RETENTION_YEARS: 7
- PINT_AE_CONSTANTS: Specification values (customization ID, profile ID, currency, schemes)

## Verification Results

| Check | Result |
|-------|--------|
| npx prisma validate | PASS |
| npx prisma format | PASS |
| EINVOICE_GENERATE in AuditAction | PASS |
| TypeScript imports work | PASS |
| PINT_AE_CONSTANTS.CUSTOMIZATION_ID | urn:peppol:pint:billing-1@ae-1.0.1 |
| EINVOICE_RETENTION_YEARS | 7 |

## Decisions Made

1. **Hash chain pattern reuse** - Same implementation as Phase 2 audit_logs for consistency
2. **Immutability trigger** - Database-level enforcement prevents core field modifications
3. **7-year retention** - FTA EINV-05 compliance built into schema with retentionEndDate
4. **Status-based lifecycle** - Clear progression from GENERATED to ARCHIVED

## Deviations from Plan

None - plan executed exactly as written. Both tasks were verified complete from previous execution sessions.

## Success Criteria Verification

| Criterion | Status |
|-----------|--------|
| einvoice_archives model exists with hash chain fields | PASS |
| EInvoiceStatus and EInvoiceFormat enums defined | PASS |
| EINVOICE_GENERATE added to AuditAction enum | PASS |
| TypeScript interfaces match schema structure | PASS |
| PINT_AE_CONSTANTS exported with spec values | PASS |
| TLV tag enum defined for QR encoding | PASS |

## Next Phase Readiness

Phase 6 Plan 02 prerequisites met:
- einvoice_archives schema ready for archive service
- TypeScript types available for TLV encoding service
- PINT_AE_CONSTANTS available for XML generation
- Hash chain pattern established for integrity verification

## Files Summary

**Created:**
- `web-erp-app/backend/prisma/migrations/20260124191900_einvoice_archive_schema/migration.sql` (99 lines)
- `web-erp-app/backend/src/types/einvoice.types.ts` (343 lines)

**Modified:**
- `web-erp-app/backend/prisma/schema.prisma` (+136 lines: enums, model, relation)
