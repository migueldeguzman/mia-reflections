# Phase 1: Multi-Tenant Compliance Foundation - Research

**Researched:** 2026-01-23
**Domain:** UAE Tax Compliance Configuration (TRN, Free Zones, Industry Rules, Tax Codes)
**Confidence:** HIGH

## Summary

This research investigates the UAE-specific compliance fields and data structures needed for a multi-tenant compliance configuration system. The existing Vesla ERP already has:
- Multi-tenant architecture with dedicated databases per company
- A `company_settings` table for operational configuration
- A `tax_configurations` table with TRN validation and tax codes
- Basic TRN validation (15-digit pattern) in place

**Key findings:**
1. UAE TRN format is confirmed as a 15-digit numeric code - existing validation is correct
2. UAE Free Zones have two categories: "Designated Zones" (special VAT treatment for goods) and "Non-Designated" (standard 5% VAT)
3. Industry classification should align with UAE DED activity codes (2,000+ activities) and support ISIC for international reporting
4. Five core VAT tax codes exist: Standard Rate (5%), Zero Rate, Exempt, Reverse Charge, Out of Scope

**Primary recommendation:** Extend the existing `tax_configurations` table with a new `tenant_compliance_config` table for comprehensive UAE-specific compliance settings, keeping the existing structure for backward compatibility.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already in Use)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | ^5.22.0 | ORM for PostgreSQL | Type-safe schema, migrations |
| Zod | ^4.3.5 | Validation | Schema validation for config |
| Express | ^4.18.2 | HTTP framework | Existing backend stack |

### Supporting (Recommended Additions)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| validator.js | ^13.x | String validation | TRN format, IBAN validation |
| decimal.js | ^10.4.x | Decimal math | Tax rate calculations (precision) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Prisma JSON fields | Separate tables | JSON is simpler but less queryable; use tables for compliance data that needs indexing |
| Custom TRN validator | FTA API validation | FTA API requires registration; use pattern validation + manual FTA portal verification |

**Installation:**
```bash
# Already installed - no new dependencies needed
npm install validator
```

## Architecture Patterns

### Recommended Project Structure

Compliance configuration should extend the existing finance module structure:

```
src/
├── services/
│   └── finance/
│       ├── tax-configuration.service.ts      # EXISTS - extend
│       └── compliance-config.service.ts      # NEW - tenant compliance
├── controllers/
│   └── finance/
│       ├── tax-configuration.controller.ts   # EXISTS - extend
│       └── compliance-config.controller.ts   # NEW - compliance CRUD
├── routes/
│   └── finance/
│       └── compliance-config.routes.ts       # NEW - compliance endpoints
└── types/
    └── compliance/
        └── uae-compliance.types.ts           # NEW - UAE-specific types
```

### Pattern 1: Tenant Compliance Configuration Table

**What:** A dedicated table for UAE-specific compliance settings per tenant
**When to use:** For all compliance fields beyond basic TRN/tax codes
**Example:**

```typescript
// Source: Based on existing tax_configurations pattern
// prisma/tenant-schema.prisma

model tenant_compliance_config {
  id                String   @id @default(uuid())

  // TRN Configuration (UAE FTA requirement)
  trnNumber         String?  // 15-digit UAE TRN
  trnVerifiedAt     DateTime?
  trnStatus         TrnStatus @default(UNVERIFIED)

  // Free Zone Configuration
  freeZoneStatus    FreeZoneStatus @default(NON_FREE_ZONE)
  freeZoneId        String?  // Reference to free_zones lookup table
  isDesignatedZone  Boolean  @default(false) // Affects VAT treatment

  // Industry Configuration
  industryCode      String?  // Primary DED activity code
  secondaryIndustry String?  // Secondary industry code
  isicCode          String?  // ISIC Rev 4 code for reporting

  // VAT Configuration
  vatRegistered     Boolean  @default(false)
  vatGroupMember    Boolean  @default(false)
  vatGroupTrn       String?  // If part of VAT group
  filingFrequency   FilingFrequency @default(QUARTERLY)

  // Corporate Tax Configuration
  ctRegistered      Boolean  @default(false)
  ctQualifyingFreeZone Boolean @default(false)
  smallBusinessRelief Boolean @default(false)

  // WPS Configuration
  wpsRegistered     Boolean  @default(false)
  molEstablishmentId String? // Ministry of Labor ID

  // Audit Fields
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  createdById       String?
  updatedById       String?

  @@map("tenant_compliance_config")
}

enum TrnStatus {
  UNVERIFIED
  VERIFIED
  PENDING_VERIFICATION
  INVALID
}

enum FreeZoneStatus {
  NON_FREE_ZONE
  DESIGNATED_ZONE    // Special VAT treatment for goods
  FREE_ZONE          // Standard 5% VAT applies
  OFFSHORE           // Outside UAE VAT scope
}

enum FilingFrequency {
  MONTHLY
  QUARTERLY
}
```

### Pattern 2: Reference Data Tables

**What:** Lookup tables for free zones and industry codes
**When to use:** For standardized reference data that doesn't change per tenant

```typescript
// Free Zone Reference Data
model free_zones {
  id             String   @id @default(uuid())
  code           String   @unique  // e.g., "JAFZA", "DAFZA", "DIFC"
  name           String   // "Jebel Ali Free Zone"
  emirate        String   // "Dubai", "Abu Dhabi", etc.
  isDesignated   Boolean  @default(false) // VAT Designated Zone status
  vatTreatment   String   // "OUTSIDE_SCOPE", "STANDARD_RATE", etc.
  isActive       Boolean  @default(true)

  @@map("free_zones")
}

// Industry Classification Reference
model industry_codes {
  id             String   @id @default(uuid())
  dedCode        String?  // Dubai DED code
  isicCode       String   // ISIC Rev 4 code
  name           String
  category       String   // "Trading", "Services", "Manufacturing"
  vatDefaultRate String   @default("STANDARD") // Default VAT treatment
  isActive       Boolean  @default(true)

  @@index([isicCode])
  @@index([category])
  @@map("industry_codes")
}
```

### Pattern 3: Tax Code Mapping Per Tenant

**What:** Extended tax code configuration linked to compliance settings
**When to use:** When tenant needs custom tax code behavior based on free zone/industry

```typescript
// Source: Extend existing tax_codes table pattern
model tax_code_mappings {
  id             String   @id @default(uuid())
  taxCodeId      String   // FK to tax_codes
  complianceId   String   // FK to tenant_compliance_config

  // Override settings based on compliance
  effectiveRate  Decimal  @db.Decimal(5, 2)
  isApplicable   Boolean  @default(true)
  conditions     Json?    // JSON for complex rules

  taxCode        tax_codes                 @relation(fields: [taxCodeId], references: [id])
  compliance     tenant_compliance_config  @relation(fields: [complianceId], references: [id])

  @@unique([taxCodeId, complianceId])
  @@map("tax_code_mappings")
}
```

### Anti-Patterns to Avoid

- **Storing compliance config in JSON blobs:** Use typed columns for queryability and validation
- **Duplicating TRN in multiple tables:** Single source of truth in compliance config, reference elsewhere
- **Hardcoding free zone list in code:** Use reference data table, FTA updates zones periodically
- **Mixing operational and compliance settings:** Keep `company_settings` for operations, compliance config separate

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TRN validation | Complex checksum algorithm | 15-digit pattern + FTA portal verification | FTA doesn't publish checksum algorithm |
| IBAN validation | Custom regex | `validator.js` isIBAN() | Handles all country formats with checksums |
| Decimal calculations | JavaScript floats | Prisma Decimal / decimal.js | Floating point errors in tax calculations |
| Free zone lookup | Hardcoded list | Reference data table | FTA updates designated zones; table allows updates without code changes |
| Date handling for tax periods | Custom logic | date-fns | UAE tax periods follow calendar quarters |

**Key insight:** UAE compliance rules change frequently (new designated zones, rate changes, new CT rules). Reference data tables with admin UI allow updates without code deployments.

## Common Pitfalls

### Pitfall 1: TRN Format Assumptions

**What goes wrong:** Assuming all TRNs follow same format or that validation means the TRN is active
**Why it happens:** FTA provides TRNs but doesn't publish detailed format specifications
**How to avoid:**
- Validate format (15 digits) locally
- Store verification status separately from validity
- Recommend manual FTA portal verification for critical operations
**Warning signs:** Accepting TRNs that start with specific prefixes (not documented by FTA)

### Pitfall 2: Free Zone VAT Confusion

**What goes wrong:** Treating all free zones as VAT-exempt
**Why it happens:** Only "Designated Zones" have special VAT treatment, and only for goods
**How to avoid:**
- Store both `freeZoneStatus` and `isDesignatedZone` flags
- Services in ALL free zones (including designated) are subject to 5% VAT
- Only goods within/between designated zones get special treatment
**Warning signs:** Zero VAT on service invoices for free zone companies

### Pitfall 3: Industry Code Scope Creep

**What goes wrong:** Building complex industry rule engine before basic compliance
**Why it happens:** 2,000+ DED activity codes with varying requirements
**How to avoid:**
- Phase 1: Store industry code, apply manual rules
- Phase 2: Add rule engine for specific industries (construction retention, real estate)
- Keep industry-specific logic in separate service
**Warning signs:** Giant switch statements for industry-specific VAT treatment

### Pitfall 4: Mixing Tenant Isolation Patterns

**What goes wrong:** Compliance config stored in master DB instead of tenant DB
**Why it happens:** Confusion about what data belongs where
**How to avoid:**
- Compliance config is tenant-specific data -> tenant database
- Reference data (free zones, industry codes) is shared -> master database
- Follow existing isolation pattern in `tenant-schema.prisma`
**Warning signs:** Queries joining master and tenant DB for compliance data

### Pitfall 5: Ignoring Corporate Tax Interaction

**What goes wrong:** VAT configuration that doesn't account for CT Qualifying Free Zone status
**Why it happens:** VAT and CT have different "free zone" definitions
**How to avoid:**
- Store both `isDesignatedZone` (VAT) and `ctQualifyingFreeZone` (CT) separately
- A company can be VAT designated but not CT qualifying, or vice versa
**Warning signs:** Single "freeZone" boolean trying to serve both purposes

## Code Examples

Verified patterns from official sources and existing codebase:

### TRN Validation (Existing Pattern)
```typescript
// Source: web-erp-app/backend/src/services/finance/tax-configuration.service.ts
// UAE TRN validation pattern (15 digits)
const UAE_TRN_PATTERN = /^\d{15}$/;

private validateTrn(trn: string): boolean {
  // Remove any spaces or dashes
  const cleanTrn = trn.replace(/[\s-]/g, '');
  return UAE_TRN_PATTERN.test(cleanTrn);
}
```

### Compliance Config Service Pattern
```typescript
// Source: Based on existing CompanySettingsService pattern
export class ComplianceConfigService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Get or create compliance config for tenant
   */
  async getComplianceConfig(companyId: string): Promise<TenantComplianceConfig> {
    let config = await this.prisma.tenant_compliance_config.findUnique({
      where: { companyId },
    });

    if (!config) {
      config = await this.createDefaultConfig(companyId);
    }

    return config;
  }

  /**
   * Update free zone status with validation
   */
  async updateFreeZoneStatus(
    companyId: string,
    freeZoneId: string | null,
    userId: string
  ): Promise<void> {
    // Validate free zone exists if provided
    if (freeZoneId) {
      const freeZone = await this.prisma.free_zones.findUnique({
        where: { id: freeZoneId }
      });

      if (!freeZone) {
        throw new Error('Invalid free zone');
      }

      await this.prisma.tenant_compliance_config.update({
        where: { companyId },
        data: {
          freeZoneId,
          freeZoneStatus: freeZone.isDesignated ? 'DESIGNATED_ZONE' : 'FREE_ZONE',
          isDesignatedZone: freeZone.isDesignated,
          updatedById: userId,
          updatedAt: new Date()
        }
      });
    } else {
      await this.prisma.tenant_compliance_config.update({
        where: { companyId },
        data: {
          freeZoneId: null,
          freeZoneStatus: 'NON_FREE_ZONE',
          isDesignatedZone: false,
          updatedById: userId,
          updatedAt: new Date()
        }
      });
    }
  }
}
```

### VAT Treatment Determination
```typescript
// Determine VAT treatment based on compliance config
function determineVatTreatment(
  config: TenantComplianceConfig,
  supplyType: 'GOODS' | 'SERVICES',
  destination: 'SAME_ZONE' | 'OTHER_ZONE' | 'MAINLAND' | 'EXPORT'
): VatTreatment {
  // Services are always standard rated (5%) regardless of zone
  if (supplyType === 'SERVICES') {
    return destination === 'EXPORT' ? 'ZERO_RATED' : 'STANDARD_RATED';
  }

  // Goods in designated zones have special treatment
  if (config.isDesignatedZone && supplyType === 'GOODS') {
    if (destination === 'SAME_ZONE' || destination === 'OTHER_ZONE') {
      return 'OUT_OF_SCOPE'; // Goods within/between designated zones
    }
    if (destination === 'MAINLAND') {
      return 'STANDARD_RATED'; // Import to mainland
    }
  }

  // Exports are zero-rated
  if (destination === 'EXPORT') {
    return 'ZERO_RATED';
  }

  // Default: standard rate
  return 'STANDARD_RATED';
}
```

## UAE Compliance Field Specifications

### TRN (Tax Registration Number)

| Field | Specification | Source |
|-------|--------------|--------|
| Format | 15 digits, numeric only | [TaxDo UAE TIN Guide](https://taxdo.com/resources/global-tax-id-validation-guide/united-arab-emirates) |
| Validation | Pattern match + FTA portal verification | FTA Portal |
| Storage | String, trimmed, no spaces/dashes | Best practice |
| E-Invoice TIN | First 10 digits of TRN | [ClearTax E-Invoicing](https://www.cleartax.com/ae/uae-e-invoicing-tax-registration-identifiers) |

### Free Zone Categories

| Category | VAT Treatment | CT Treatment | Examples |
|----------|--------------|--------------|----------|
| Designated Zone | Out of scope for goods within zone | May qualify for 0% CT | JAFZA, DAFZA, KIZAD |
| Non-Designated Free Zone | Standard 5% VAT | Standard CT rules | DMCC, DIFC, ADGM |
| Mainland | Standard 5% VAT | Standard CT rules | Dubai mainland |
| Offshore | Outside UAE VAT scope | May not be CT taxable | RAK Offshore |

**Key Designated Zones (Cabinet Decision No. 59):**
- Jebel Ali Free Zone (JAFZA) - Dubai
- Dubai Airport Free Zone (DAFZA) - Dubai
- Dubai Silicon Oasis (DSO) - Dubai
- Dubai South Free Zone - Dubai
- Khalifa Industrial Zone Abu Dhabi (KIZAD) - Abu Dhabi
- Sharjah Airport International Free Zone (SAIF Zone) - Sharjah
- Hamriyah Free Zone - Sharjah
- Ras Al Khaimah Free Trade Zone - RAK
- Fujairah Free Zone - Fujairah
- Ajman Free Zone - Ajman
- (20+ total designated zones)

**Source:** [Tulpartax Designated Zones List](https://tulpartax.com/list-of-designated-free-zones-in-uae/)

### VAT Tax Codes

| Code | Name | Rate | Usage |
|------|------|------|-------|
| SR | Standard Rate | 5% | Default for most supplies |
| ZR | Zero Rate | 0% | Exports, certain healthcare/education |
| EX | Exempt | N/A | Financial services, residential rent |
| RC | Reverse Charge | 5% | Imported services (buyer reports) |
| OS | Out of Scope | N/A | Goods in designated zones, non-UAE |

**Source:** [ClearTax UAE VAT Guide](https://www.cleartax.com/ae/zero-rated-vs-exempt-vat-supplies)

### Industry Classification

| System | Purpose | Coverage |
|--------|---------|----------|
| DED Activity Codes | UAE Trade License | 2,000+ activities |
| ISIC Rev 4 | International reporting | UN standard classification |
| FTA Activity | CT registration | Maps to ISIC |

**Source:** [ILO ISIC Classification](https://ilostat.ilo.org/methods/concepts-and-definitions/classification-economic-activities/)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Boolean VAT exempt | Enum with zone types | VAT Law 2018 | More granular control |
| Single TRN field | TRN + verification status | E-invoicing mandate | Need to track verification |
| Manual free zone lookup | Reference data table | Best practice | FTA updates zones periodically |
| Combined VAT/CT config | Separate configurations | CT Law 2023 | Different requirements |

**Deprecated/outdated:**
- Single "isFreeZone" boolean - doesn't distinguish designated vs non-designated
- Storing TRN in companies table only - need dedicated compliance config
- Hardcoded 5% VAT rate - need configurable rates for future changes

## Open Questions

Things that couldn't be fully resolved:

1. **TRN Checksum Algorithm**
   - What we know: TRN is 15 digits
   - What's unclear: FTA doesn't publish checksum validation algorithm
   - Recommendation: Pattern validation only; recommend FTA portal verification for critical operations

2. **Group VAT TRN Handling**
   - What we know: VAT groups share single TRN
   - What's unclear: How to model subsidiary relationships in multi-tenant
   - Recommendation: Store group TRN + member flag; defer group reporting to later phase

3. **Industry-Specific VAT Rules**
   - What we know: Construction has retention rules, real estate has special treatment
   - What's unclear: Complete list of industry-specific VAT variations
   - Recommendation: Store industry code; implement rules as needed per industry

4. **WPS Integration Scope**
   - What we know: WPS requires MOL establishment ID
   - What's unclear: Should Phase 1 include WPS fields or defer?
   - Recommendation: Include basic WPS config fields (registered flag, MOL ID) for future

## Sources

### Primary (HIGH confidence)
- Existing codebase: `web-erp-app/backend/src/services/finance/tax-configuration.service.ts` - TRN validation, tax codes
- Existing codebase: `web-erp-app/backend/prisma/tenant-schema.prisma` - Multi-tenant patterns
- [UAE Ministry of Finance VAT Page](https://mof.gov.ae/en/public-finance/tax/vat/) - Official VAT information

### Secondary (MEDIUM confidence)
- [TaxDo UAE TIN Guide](https://taxdo.com/resources/global-tax-id-validation-guide/united-arab-emirates) - TRN format verification
- [Tulpartax Designated Zones](https://tulpartax.com/list-of-designated-free-zones-in-uae/) - Free zone list
- [ClearTax UAE VAT Guide](https://www.cleartax.com/ae/zero-rated-vs-exempt-vat-supplies) - VAT categories
- [PWC UAE Tax Summary](https://taxsummaries.pwc.com/united-arab-emirates/corporate/other-taxes) - Corporate tax overview

### Tertiary (LOW confidence)
- Web search results for industry codes - DED activity codes mentioned but full list not verified
- ISIC code mapping to UAE activities - needs validation with FTA documentation

## Metadata

**Confidence breakdown:**
- TRN Format: HIGH - Verified with official sources, matches existing implementation
- Free Zone Categories: HIGH - Cabinet Decision No. 59 is well documented
- VAT Tax Codes: HIGH - Existing implementation matches FTA requirements
- Industry Codes: MEDIUM - DED codes exist but full mapping not verified
- WPS Requirements: MEDIUM - Basic requirements known, integration details not researched

**Research date:** 2026-01-23
**Valid until:** 2026-04-23 (3 months - UAE tax rules relatively stable)
