---
phase: 01-multi-tenant-foundation
plan: 01
subsystem: database-schema
tags: [prisma, schema, compliance, uae, vat, corporate-tax, free-zones]

dependency-graph:
  requires: []
  provides:
    - master-db-free-zones-table
    - master-db-industry-codes-table
    - tenant-db-compliance-config-table
    - tenant-db-tax-codes-table
    - uae-compliance-enums
  affects:
    - 01-02 (compliance config service)
    - 01-03 (compliance validation)
    - 03-vat-compliance (VAT return generation)
    - 04-corporate-tax (CT filing)

tech-stack:
  added:
    - free_zones model (master schema)
    - industry_codes model (master schema)
    - tenant_compliance_config model (tenant schema)
    - tax_codes model (tenant schema)
    - tax_code_mappings model (tenant schema)
  patterns:
    - singleton-per-tenant (compliance config)
    - cross-database-reference (UUID/code lookups)
    - bilingual-support (nameArabic fields)

key-files:
  created:
    - web-erp-app/backend/prisma/seeds/reference-data/free-zones.seed.ts
    - web-erp-app/backend/prisma/seeds/reference-data/industry-codes.seed.ts
  modified:
    - web-erp-app/backend/prisma/master-schema.prisma
    - web-erp-app/backend/prisma/tenant-schema.prisma

decisions:
  - id: cross-db-reference
    choice: UUID/code-based lookups instead of foreign keys
    rationale: Cannot create FK constraints across separate databases
  - id: singleton-compliance
    choice: One tenant_compliance_config per tenant database
    rationale: Company-wide settings, not per-user or per-entity

metrics:
  duration: ~15 minutes
  completed: 2026-01-23
---

# Phase 01 Plan 01: UAE Compliance Schema Foundation Summary

**One-liner:** Prisma schema models for UAE free zones, industry codes, and per-tenant compliance configuration with TRN, VAT, CT, WPS, and e-invoicing fields.

## What Was Built

### Master Database (Reference Data)

**1. free_zones model**
- 27 UAE free zones seeded across all 7 emirates
- Fields: code, name, nameArabic, emirate, isDesignated, vatTreatment, isCtQualifying
- All major designated free zones included (JAFZA, DIFC, DMCC, ADGM, etc.)
- Supports both VAT 0% eligibility and CT qualifying status

**2. industry_codes model**
- 38 industry codes covering target verticals
- DED to ISIC Rev 4 mapping for international standards
- Categories: Automotive, Real Estate, Professional Services, Financial Services, Transportation, Hospitality, Healthcare, Education, Retail
- Includes vatDefaultRate and hasSpecialRules flags

### Tenant Database (Per-Company Configuration)

**3. tenant_compliance_config model**
- TRN configuration: trn, trnStatus, trnRegistrationDate
- Free zone config: freeZoneStatus, freeZoneId, freeZoneLicenseNo
- Industry classification: industryCode, tradeLicenseNo
- VAT config: isVatRegistered, vatFilingFrequency, vatGroupId, defaultVatRate
- CT config: isCtRegistered, ctFilingFrequency, isSmallBusiness
- WPS config: isWpsRegistered, wpsAgentId, molEstablishmentId
- E-invoicing: isEinvoiceReady, peppolParticipantId

**4. tax_codes model**
- Standard UAE tax code reference (SR, ZR, EX, RC patterns)
- FTA box number mapping for VAT return generation
- Effective date range for temporal validity

**5. tax_code_mappings model**
- Per-tenant tax code customization
- GL account linkage
- Free zone rate overrides

### Enums Added

- `TrnStatus`: NOT_REGISTERED, PENDING, ACTIVE, SUSPENDED, DEREGISTERED
- `FreeZoneStatus`: NOT_FREE_ZONE, REGISTERED, DESIGNATED, QUALIFYING
- `FilingFrequency`: MONTHLY, QUARTERLY, ANNUAL

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Cross-database reference | UUID/code lookups | Cannot create FK across separate Neon databases |
| Compliance config pattern | Singleton per tenant | Company-wide settings, one record per tenant DB |
| Arabic field naming | nameArabic suffix | Consistent with existing schema pattern |
| Tax code mappings | Separate table | Allows per-tenant customization without modifying reference data |

## Files Changed

| File | Changes |
|------|---------|
| `master-schema.prisma` | +62 lines (free_zones, industry_codes models) |
| `tenant-schema.prisma` | +157 lines (compliance config, tax codes, enums) |
| `free-zones.seed.ts` | New file (333 lines, 27 free zones) |
| `industry-codes.seed.ts` | New file (458 lines, 38 industry codes) |

## Commits

1. `a11847c` feat(01-01): add reference data tables to master schema
2. `9df63aa` feat(01-01): add tenant compliance config to tenant schema
3. `7bbf225` feat(01-01): create reference data seed scripts
4. `4482de4` style(01-01): format prisma schemas

## Verification Results

- Master schema validation: PASSED
- Tenant schema validation: PASSED
- Prisma format: Applied successfully
- Seed files: Valid TypeScript (333 + 458 lines)

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

### Ready for 01-02 (Compliance Config Service)
- Schema models are in place
- Seed data available for testing
- Cross-database reference pattern established

### Dependencies Satisfied
- `tenant_compliance_config.freeZoneId` references `free_zones.id` via UUID
- `tenant_compliance_config.industryCode` references `industry_codes.dedCode` via code lookup

### Migration Required
After merging, run:
```bash
cd web-erp-app/backend
npx prisma migrate dev --schema=prisma/master-schema.prisma
npx prisma migrate dev --schema=prisma/tenant-schema.prisma
npx prisma generate
```

Then seed reference data:
```bash
npx ts-node prisma/seeds/reference-data/free-zones.seed.ts
npx ts-node prisma/seeds/reference-data/industry-codes.seed.ts
```
