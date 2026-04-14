# cust-spec-031 — customer_documents parity audit

**Date:** 2026-04-14
**Author:** Anders 🤖
**Status:** Complete. Additive cols + service helper merged.

## Goal

Confirm Vesla's `customer_documents` table covers Speed `identity_documents`,
identify any missing fields, and ship the additive enrichment cols called out in
the kanban card.

## Vesla baseline (web-erp-app `prisma/schema.prisma:24529`)

```
customer_documents
  id, customerId, companyId,
  documentType (PASSPORT, EMIRATES_ID_FRONT, EMIRATES_ID_BACK,
                DRIVERS_LICENSE_FRONT, DRIVERS_LICENSE_BACK, VISA,
                UTILITY_BILL, BANK_STATEMENT, CONTRACT, OTHER),
  documentNumber, issuingCountry, issueDate, expiryDate,
  fileName, originalName, filePath, fileSize, mimeType,
  verificationStatus (PENDING, VERIFIED, REJECTED, EXPIRED),
  verifiedAt, verifiedBy, rejectionReason,
  uploadedBy, notes,
  createdAt, updatedAt
```

Plus tenant + customer FK CASCADE, indexes on customerId / companyId /
documentType / verificationStatus / expiryDate.

## Speed `identity_documents` shape

Per `tech-project/speed-reverse-engineer/specifications/person/schema.md`:

| Speed field | Vesla equivalent | Verdict |
|---|---|---|
| `id`, `personId`, `companyId` | `id`, `customerId`, `companyId` | Match |
| `documentType` enum | `documentType` (10 values) | Vesla covers all Speed types + extras (UTILITY_BILL, BANK_STATEMENT) |
| `documentNumber` | `documentNumber` | Match |
| `issuingCountry` (string) | `issuingCountry` | Match |
| `issueDate`, `expiryDate` | same | Match |
| `photoFrontFileId`, `photoBackFileId` | `fileName`/`filePath` (one row per side; documentType discriminates FRONT/BACK) | **Better in Vesla** — separate rows per side, but no explicit pairing. Closed by cust-spec-031 via `linked_document_id`. |
| `isVerified` Boolean | `verificationStatus` enum (PENDING, VERIFIED, REJECTED, EXPIRED) | **Better in Vesla** — richer state machine |
| `verifiedAt`, `verifiedBy`, `rejectionReason` | same | Match |

## Real gaps (after the audit)

1. **No FRONT ↔ BACK pairing.** Multiple-row strategy is good but downstream
   code has to infer the pair by `documentType` + `customerId` + temporal
   proximity. That breaks if a user re-uploads only one side.
2. **No issuing-authority field.** Some compliance use cases (UAE EID issued
   by ICA) want this stored alongside the country.
3. **No OCR scan-quality / OCR JSON.** Future KYC enrichment (auto-extract
   ID number, name, expiry date) needs a place to land structured output and
   a confidence score.

## Resolution shipped in this card

Migration adds **four optional cols** (all nullable, no defaults so no rows
break):

```
issuing_authority   VARCHAR(200)
scan_quality_score  DECIMAL(5, 2)   -- CHECK between 0..100
ocr_extracted_json  JSONB
linked_document_id  TEXT            -- self-FK ON DELETE SET NULL
```

Plus partial index on `linked_document_id` for the lookup hot-path.

Service helper `customer-documents-link.service.ts`:

* `link(idA, idB)` — bidirectional, transactional, validates same-customer
  + same-tenant + valid F/B pair (`DRIVERS_LICENSE_FRONT ↔ _BACK`,
  `EMIRATES_ID_FRONT ↔ _BACK`).
* `unlink(id)` — clears both sides.
* `getPartner(id)` — convenience lookup.

13 jest cases cover validators, link/unlink semantics, tenant isolation,
self-link refusal, mismatched-type pairs.

## Things deliberately NOT done

* **No upload-flow integration.** OCR provider isn't wired in this repo and
  the card explicitly says "optional; don't block upload on OCR failure". The
  cols + service exist; consumers can populate them when OCR ships.
* **No new enum value** on `documentType`. Existing 10 values cover the
  ground; Speed didn't introduce any new ones.
* **No rename, no remove.** The card scope is additive only — it called this
  out and the audit confirms the existing schema is superior to Speed's.

## Sign-off

| Test | Result |
|---|---|
| Vesla `customer_documents` covers Speed `identity_documents` | YES, plus extras |
| New cols applied to vesla_dev | YES (migration applied + verified, file deleted) |
| Prisma model updated + back-relation `DocumentLink` | YES |
| Link helper + 13 unit tests | PASS |
| Backend esbuild + production-readiness import check | PASS |

Card status: ready to merge to `develop`.
