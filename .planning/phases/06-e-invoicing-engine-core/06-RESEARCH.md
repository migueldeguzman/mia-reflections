# Phase 6: E-Invoicing Engine Core - Research

**Researched:** 2026-01-24
**Domain:** UAE PEPPOL PINT-AE E-Invoicing, UBL 2.1 XML, QR Code TLV Encoding, ASP Integration
**Confidence:** HIGH (OpenPeppol specs verified, ZATCA TLV reference documented)

## Summary

This research investigates the UAE e-invoicing requirements for generating PEPPOL PINT-AE compliant e-invoices with UBL 2.1 schema validation and QR code embedding. The UAE Ministry of Finance has officially released PINT AE v1.0.1 specifications (June/July 2025) establishing the technical framework for mandatory e-invoicing starting July 2026.

The existing codebase from Phase 3 provides a solid foundation with FTA-compliant tax invoices containing all 13 mandatory fields, VAT calculation services, and bilingual support. Phase 6 extends this by converting internal invoice data to PINT AE XML format, validating against UBL 2.1 schemas, generating TLV-encoded QR codes, and preparing for ASP transmission (Phase 7).

**Primary recommendation:** Build an EInvoiceService that transforms Phase 3 TaxInvoiceData into PINT AE XML using `fast-xml-parser` or `xmlbuilder2`, validate with `libxmljs2-xsd`, generate QR codes using `qrcode` with TLV encoding based on ZATCA patterns (adapted for UAE), and archive e-invoices with hash integrity using the tamper-proof patterns from Phase 2.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| fast-xml-parser | ^4.5.x | XML generation/parsing | Fastest XML library, TypeScript support, 40M+ weekly downloads |
| xmlbuilder2 | ^4.x | Alternative XML builder | Modern DOM-compliant, namespace support, chainable API |
| libxmljs2-xsd | ^0.30.x | XSD schema validation | Full UBL 2.1 XSD validation, native libxml bindings |
| qrcode | ^1.5.x | QR code generation | Well-maintained, supports Buffer output, 30M+ weekly downloads |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tokenscript/libxmljs2-xsd | ^0.30.x | Node 18/20 compatible XSD | If libxmljs2-xsd has Node version issues |
| peppol-billing | ^0.0.3 | PEPPOL BIS Billing 3.0 | Experimental - useful for reference patterns |
| handlebars | ^4.7.x | Template-based XML | If prefer template approach over programmatic |
| date-fns | ^3.x | Date formatting | Already in use - ISO 8601 date formatting |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| fast-xml-parser | xmlbuilder2 | xmlbuilder2 has better namespace support but slower |
| libxmljs2-xsd | External validation API | External adds latency but no native deps |
| Custom TLV | ZATCA library port | No UAE-specific TLV library exists yet |

**Installation:**
```bash
npm install fast-xml-parser qrcode libxmljs2-xsd
npm install -D @types/qrcode
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── services/
│   └── einvoice/
│       ├── einvoice.service.ts           # Main e-invoice generation orchestrator
│       ├── pint-ae-builder.service.ts    # PINT AE XML construction
│       ├── ubl-validator.service.ts      # UBL 2.1 schema validation
│       ├── qr-code.service.ts            # QR code TLV generation
│       ├── einvoice-archive.service.ts   # 7-year archive with integrity
│       ├── asp-integration.service.ts    # ASP API abstraction
│       └── __tests__/
├── schemas/
│   └── ubl/
│       ├── UBL-Invoice-2.1.xsd           # UBL 2.1 Invoice schema
│       ├── PINT-AE-validation.sch        # PINT AE Schematron rules
│       └── common/                        # Common UBL components
├── types/
│   └── einvoice.types.ts                 # E-invoice specific types
└── utils/
    └── tlv-encoder.util.ts               # TLV encoding utility
```

### Pattern 1: PINT AE XML Generation

**What:** Convert TaxInvoiceData to PINT AE compliant UBL 2.1 XML
**When to use:** Every e-invoice generation

```typescript
// Source: Derived from OpenPeppol PINT AE v1.0.1 specification
import { XMLBuilder } from 'fast-xml-parser';

interface PintAeInvoice {
  // Header (Mandatory)
  'cbc:CustomizationID': string; // Must contain "urn:peppol:pint:billing-1@ae-1"
  'cbc:ProfileID': string;
  'cbc:ID': string; // Invoice number (IBT-001)
  'cbc:IssueDate': string; // YYYY-MM-DD format (IBT-002)
  'cbc:InvoiceTypeCode': string; // 380, 381, 389, etc. (IBT-003)
  'cbc:DocumentCurrencyCode': string; // AED required (IBT-005)

  // Supplier Party (IBG-04)
  'cac:AccountingSupplierParty': SupplierParty;

  // Buyer Party (IBG-07)
  'cac:AccountingCustomerParty': BuyerParty;

  // Tax Total (IBG-22)
  'cac:TaxTotal': TaxTotal;

  // Legal Monetary Total (IBG-23)
  'cac:LegalMonetaryTotal': MonetaryTotal;

  // Invoice Lines (IBG-25)
  'cac:InvoiceLine': InvoiceLine[];
}

class PintAeBuilderService {
  private readonly UBL_NS = 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2';
  private readonly CAC_NS = 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2';
  private readonly CBC_NS = 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2';

  buildInvoiceXml(invoice: TaxInvoiceData): string {
    const builder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      format: true,
      suppressEmptyNode: true,
    });

    const ublInvoice = {
      'Invoice': {
        '@_xmlns': this.UBL_NS,
        '@_xmlns:cac': this.CAC_NS,
        '@_xmlns:cbc': this.CBC_NS,

        // Specification identifier (IBT-024) - MANDATORY
        'cbc:CustomizationID': 'urn:peppol:pint:billing-1@ae-1.0.1',
        'cbc:ProfileID': 'urn:peppol:bis:billing',

        // Document identifiers
        'cbc:ID': invoice.invoiceNumber,
        'cbc:IssueDate': this.formatDate(invoice.invoiceDate),
        'cbc:InvoiceTypeCode': this.mapInvoiceTypeCode(invoice),
        'cbc:DocumentCurrencyCode': 'AED', // Mandatory for UAE

        // Tax currency (if different - UAE requires AED)
        ...(invoice.currency !== 'AED' && {
          'cbc:TaxCurrencyCode': 'AED',
        }),

        // Supplier
        'cac:AccountingSupplierParty': this.buildSupplierParty(invoice),

        // Buyer
        'cac:AccountingCustomerParty': this.buildBuyerParty(invoice),

        // Tax total
        'cac:TaxTotal': this.buildTaxTotal(invoice),

        // Monetary totals
        'cac:LegalMonetaryTotal': this.buildMonetaryTotal(invoice),

        // Line items
        'cac:InvoiceLine': invoice.lineItems.map((item, idx) =>
          this.buildInvoiceLine(item, idx + 1)
        ),
      }
    };

    return '<?xml version="1.0" encoding="UTF-8"?>\n' + builder.build(ublInvoice);
  }

  private buildSupplierParty(invoice: TaxInvoiceData) {
    return {
      'cac:Party': {
        'cbc:EndpointID': {
          '@_schemeID': 'AEUAE', // UAE scheme
          '#text': invoice.supplierTrn,
        },
        'cac:PartyIdentification': {
          'cbc:ID': {
            '@_schemeID': 'AEUAE-TRN',
            '#text': invoice.supplierTrn,
          },
        },
        'cac:PartyName': {
          'cbc:Name': invoice.supplierName,
        },
        'cac:PostalAddress': {
          'cbc:StreetName': invoice.supplierAddress,
          'cac:Country': {
            'cbc:IdentificationCode': 'AE',
          },
        },
        'cac:PartyTaxScheme': {
          'cbc:CompanyID': invoice.supplierTrn,
          'cac:TaxScheme': {
            'cbc:ID': 'VAT',
          },
        },
        'cac:PartyLegalEntity': {
          'cbc:RegistrationName': invoice.supplierName,
        },
      },
    };
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  private mapInvoiceTypeCode(invoice: TaxInvoiceData): string {
    // PINT AE Document Type Codes
    if (invoice.isReverseCharge) return '380'; // Standard with reverse charge
    return '380'; // Commercial invoice
  }
}
```

### Pattern 2: UBL 2.1 Schema Validation

**What:** Validate XML against UBL 2.1 XSD and PINT AE Schematron rules
**When to use:** Before transmission - block invalid invoices

```typescript
// Source: libxmljs2-xsd documentation
import * as xsd from 'libxmljs2-xsd';
import * as path from 'path';

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  code: string;
  message: string;
  line?: number;
  element?: string;
}

class UblValidatorService {
  private schema: any;
  private schemaLoaded = false;

  async initialize(): Promise<void> {
    if (this.schemaLoaded) return;

    const schemaPath = path.join(__dirname, '../../schemas/ubl/UBL-Invoice-2.1.xsd');
    this.schema = xsd.parseFile(schemaPath);
    this.schemaLoaded = true;
  }

  async validateInvoice(xml: string): Promise<ValidationResult> {
    await this.initialize();

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Step 1: XSD Schema Validation
    const xsdErrors = this.schema.validate(xml);

    if (xsdErrors) {
      for (const error of xsdErrors) {
        errors.push({
          code: 'XSD_VALIDATION_ERROR',
          message: error.message,
          line: error.line,
        });
      }
    }

    // Step 2: PINT AE Business Rules Validation
    const businessErrors = this.validatePintAeRules(xml);
    errors.push(...businessErrors);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private validatePintAeRules(xml: string): ValidationError[] {
    const errors: ValidationError[] = [];

    // PINT AE Mandatory Field Checks
    // IBT-024: CustomizationID must start with urn:peppol:pint:billing-1@ae
    if (!xml.includes('urn:peppol:pint:billing-1@ae')) {
      errors.push({
        code: 'PINT-AE-001',
        message: 'CustomizationID must contain PINT AE specification identifier',
        element: 'cbc:CustomizationID',
      });
    }

    // IBT-005: Currency must be AED for UAE
    if (!xml.includes('<cbc:DocumentCurrencyCode>AED</cbc:DocumentCurrencyCode>')) {
      errors.push({
        code: 'PINT-AE-002',
        message: 'DocumentCurrencyCode must be AED for UAE e-invoices',
        element: 'cbc:DocumentCurrencyCode',
      });
    }

    // IBT-031: Seller TRN is mandatory
    if (!/<cac:PartyTaxScheme>[\s\S]*?<cbc:CompanyID>100\d{12}<\/cbc:CompanyID>/.test(xml)) {
      errors.push({
        code: 'PINT-AE-003',
        message: 'Seller Tax Registration Number (TRN) is mandatory and must be 15 digits starting with 100',
        element: 'cbc:CompanyID',
      });
    }

    return errors;
  }
}
```

### Pattern 3: TLV QR Code Generation (ZATCA-based)

**What:** Generate QR code with TLV-encoded invoice data
**When to use:** Every invoice - embeds verification data

```typescript
// Source: ZATCA QR Code Creation Guide (adapted for UAE)
// UAE TLV structure follows same encoding principles as ZATCA
import QRCode from 'qrcode';

// TLV Tag definitions (adapted from ZATCA for UAE)
enum TlvTag {
  SELLER_NAME = 1,
  SELLER_TRN = 2,
  INVOICE_TIMESTAMP = 3,
  INVOICE_TOTAL = 4,
  VAT_TOTAL = 5,
  // UAE-specific tags (to be confirmed by FTA)
  INVOICE_HASH = 6,
  DIGITAL_SIGNATURE = 7,
  PUBLIC_KEY = 8,
}

interface QrCodeInput {
  sellerName: string;
  sellerTrn: string;
  timestamp: Date;
  invoiceTotal: string; // Decimal string
  vatTotal: string; // Decimal string
  invoiceHash?: string;
  digitalSignature?: string;
}

class QrCodeService {
  /**
   * Generates TLV-encoded QR code data as Base64
   *
   * TLV Format: Tag (1 byte) + Length (1 byte) + Value (variable)
   */
  generateTlvData(input: QrCodeInput): Buffer {
    const tlvParts: Buffer[] = [];

    // Tag 1: Seller Name (UTF-8)
    tlvParts.push(this.encodeTlv(TlvTag.SELLER_NAME, input.sellerName));

    // Tag 2: Seller TRN
    tlvParts.push(this.encodeTlv(TlvTag.SELLER_TRN, input.sellerTrn));

    // Tag 3: Invoice Timestamp (ISO 8601)
    const timestamp = input.timestamp.toISOString();
    tlvParts.push(this.encodeTlv(TlvTag.INVOICE_TIMESTAMP, timestamp));

    // Tag 4: Invoice Total (with VAT)
    tlvParts.push(this.encodeTlv(TlvTag.INVOICE_TOTAL, input.invoiceTotal));

    // Tag 5: VAT Total
    tlvParts.push(this.encodeTlv(TlvTag.VAT_TOTAL, input.vatTotal));

    // Tag 6: Invoice Hash (optional - for tamper detection)
    if (input.invoiceHash) {
      tlvParts.push(this.encodeTlv(TlvTag.INVOICE_HASH, input.invoiceHash));
    }

    return Buffer.concat(tlvParts);
  }

  private encodeTlv(tag: TlvTag, value: string): Buffer {
    const valueBuffer = Buffer.from(value, 'utf-8');
    const length = valueBuffer.length;

    // Tag: 1 byte, Length: 1 byte (supports up to 255 bytes per value)
    const tlvBuffer = Buffer.alloc(2 + length);
    tlvBuffer.writeUInt8(tag, 0);
    tlvBuffer.writeUInt8(length, 1);
    valueBuffer.copy(tlvBuffer, 2);

    return tlvBuffer;
  }

  /**
   * Generates QR code image from TLV data
   */
  async generateQrCode(
    input: QrCodeInput,
    options: { format: 'base64' | 'buffer' | 'dataUrl' } = { format: 'base64' }
  ): Promise<string | Buffer> {
    const tlvData = this.generateTlvData(input);
    const base64Data = tlvData.toString('base64');

    // QR code contains Base64 of TLV-encoded data
    switch (options.format) {
      case 'buffer':
        return await QRCode.toBuffer(base64Data, {
          errorCorrectionLevel: 'M',
          width: 200,
          margin: 2,
        });

      case 'dataUrl':
        return await QRCode.toDataURL(base64Data, {
          errorCorrectionLevel: 'M',
          width: 200,
          margin: 2,
        });

      case 'base64':
      default:
        const buffer = await QRCode.toBuffer(base64Data);
        return buffer.toString('base64');
    }
  }

  /**
   * Decodes TLV data from Base64 (for verification)
   */
  decodeTlvData(base64Data: string): QrCodeInput {
    const buffer = Buffer.from(base64Data, 'base64');
    const result: Partial<QrCodeInput> = {};

    let offset = 0;
    while (offset < buffer.length) {
      const tag = buffer.readUInt8(offset);
      const length = buffer.readUInt8(offset + 1);
      const value = buffer.slice(offset + 2, offset + 2 + length).toString('utf-8');

      switch (tag) {
        case TlvTag.SELLER_NAME:
          result.sellerName = value;
          break;
        case TlvTag.SELLER_TRN:
          result.sellerTrn = value;
          break;
        case TlvTag.INVOICE_TIMESTAMP:
          result.timestamp = new Date(value);
          break;
        case TlvTag.INVOICE_TOTAL:
          result.invoiceTotal = value;
          break;
        case TlvTag.VAT_TOTAL:
          result.vatTotal = value;
          break;
        case TlvTag.INVOICE_HASH:
          result.invoiceHash = value;
          break;
      }

      offset += 2 + length;
    }

    return result as QrCodeInput;
  }
}
```

### Pattern 4: E-Invoice Archiving with Tamper-Proof Storage

**What:** Store e-invoices with hash integrity for 7-year FTA retention
**When to use:** Every e-invoice generation - before and after transmission

```typescript
// Source: Extended from Phase 2 audit tamper-proof patterns
import * as crypto from 'crypto';

interface EInvoiceArchiveRecord {
  id: string;
  companyId: string;
  invoiceId: string;
  einvoiceNumber: string;

  // Content
  xmlContent: string;
  xmlHash: string; // SHA-256 of XML
  qrCodeData: string; // Base64 TLV

  // Status
  status: 'GENERATED' | 'VALIDATED' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED';
  validationResult?: ValidationResult;

  // ASP Submission
  aspSubmissionId?: string;
  aspSubmissionDate?: Date;
  aspResponseCode?: string;
  tddReference?: string; // Tax Data Document reference
  mlsStatus?: string; // Message Level Status

  // Tamper-proof chain (from Phase 2 pattern)
  sequenceNumber: number;
  previousHash: string;
  recordHash: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Retention
  retentionEndDate: Date; // 7 years from creation
}

class EInvoiceArchiveService {
  private readonly RETENTION_YEARS = 7;

  async archiveEInvoice(
    tx: Prisma.TransactionClient,
    invoice: TaxInvoiceData,
    xml: string,
    qrCodeData: string
  ): Promise<EInvoiceArchiveRecord> {
    // Calculate XML hash
    const xmlHash = crypto.createHash('sha256').update(xml).digest('hex');

    // Get next sequence number (atomic)
    const sequenceResult = await tx.$queryRaw<[{nextval: bigint}]>`
      SELECT nextval('einvoice_archive_seq')
    `;
    const sequenceNumber = Number(sequenceResult[0].nextval);

    // Get previous record's hash
    const previousRecord = await tx.einvoice_archives.findFirst({
      where: { sequenceNumber: sequenceNumber - 1 },
      select: { recordHash: true },
    });
    const previousHash = previousRecord?.recordHash || 'GENESIS';

    // Calculate record hash
    const recordData = {
      sequenceNumber,
      invoiceId: invoice.invoiceNumber,
      xmlHash,
      createdAt: new Date().toISOString(),
      previousHash,
    };
    const recordHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(recordData))
      .digest('hex');

    // Calculate retention end date
    const retentionEndDate = new Date();
    retentionEndDate.setFullYear(retentionEndDate.getFullYear() + this.RETENTION_YEARS);

    const archive = await tx.einvoice_archives.create({
      data: {
        id: crypto.randomUUID(),
        companyId: invoice.companyId,
        invoiceId: invoice.invoiceNumber,
        einvoiceNumber: `EI-${invoice.invoiceNumber}`,
        xmlContent: xml,
        xmlHash,
        qrCodeData,
        status: 'GENERATED',
        sequenceNumber,
        previousHash,
        recordHash,
        retentionEndDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return archive;
  }

  /**
   * Verify archive integrity (hash chain)
   */
  async verifyIntegrity(
    companyId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{ valid: boolean; invalidRecords: number[] }> {
    const archives = await this.prisma.einvoice_archives.findMany({
      where: {
        companyId,
        ...(startDate && { createdAt: { gte: startDate } }),
        ...(endDate && { createdAt: { lte: endDate } }),
      },
      orderBy: { sequenceNumber: 'asc' },
    });

    const invalidRecords: number[] = [];
    let previousHash = 'GENESIS';

    for (const archive of archives) {
      // Verify chain continuity
      if (archive.previousHash !== previousHash) {
        invalidRecords.push(archive.sequenceNumber);
      }

      // Verify record hash
      const expectedHash = this.calculateRecordHash(archive, previousHash);
      if (archive.recordHash !== expectedHash) {
        invalidRecords.push(archive.sequenceNumber);
      }

      previousHash = archive.recordHash;
    }

    return {
      valid: invalidRecords.length === 0,
      invalidRecords,
    };
  }
}
```

### Anti-Patterns to Avoid

- **String concatenation for XML:** Use XMLBuilder - prevents malformed XML and encoding issues
- **Hardcoding UAE TLV tags:** FTA hasn't published final TLV spec - make tags configurable
- **Skipping validation before archive:** Always validate XML before archiving
- **Storing XML in regular table:** Use separate archive table with tamper-proof mechanisms
- **Synchronous schema loading:** Load XSD schemas at startup, not per-request
- **Ignoring namespace prefixes:** UBL 2.1 requires correct cac/cbc namespace prefixes

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| XML generation | String templates | fast-xml-parser / xmlbuilder2 | Handles encoding, namespaces, escaping |
| XSD validation | Regex/manual checks | libxmljs2-xsd | Full XSD 1.0 compliance, error details |
| QR codes | Canvas drawing | qrcode npm | Handles error correction, sizing, formats |
| TLV encoding | Manual byte manipulation | Utility function (above) | Reusable, testable, handles UTF-8 |
| Date formatting | Manual string | date-fns format | ISO 8601 compliance, timezone handling |
| Hash integrity | Custom algorithm | crypto.createHash('sha256') | Standard, verified, performant |

**Key insight:** E-invoicing has strict schema requirements. Using proper XML libraries with namespace support prevents subtle compliance failures that manual approaches miss.

## Common Pitfalls

### Pitfall 1: Wrong Namespace Handling

**What goes wrong:** XML validates locally but fails PEPPOL validation
**Why it happens:** UBL 2.1 requires specific namespace declarations and prefixes
**How to avoid:** Always declare all three namespaces (Invoice, cac, cbc) with correct URIs
**Warning signs:** "Namespace prefix not declared" errors, elements not found

### Pitfall 2: Date Format Errors

**What goes wrong:** E-invoice rejected for invalid date format
**Why it happens:** Using locale-dependent date formatting (DD/MM/YYYY instead of YYYY-MM-DD)
**How to avoid:** Use ISO 8601 format (YYYY-MM-DD) exclusively
**Warning signs:** "Invalid date format" validation errors

### Pitfall 3: Currency Code Mismatch

**What goes wrong:** E-invoice rejected despite correct amounts
**Why it happens:** UAE mandates AED as document currency; foreign currency requires additional fields
**How to avoid:** Always set DocumentCurrencyCode to AED; use exchange rate fields for foreign currencies
**Warning signs:** PINT-AE currency validation failures

### Pitfall 4: TRN Format Validation

**What goes wrong:** Supplier/Buyer TRN rejected
**Why it happens:** UAE TRN must be exactly 15 digits starting with "100"
**How to avoid:** Use existing validateTRN() from Phase 3; pad/format before XML generation
**Warning signs:** "Invalid Tax Registration Number" errors

### Pitfall 5: QR Code Size Overflow

**What goes wrong:** QR code too dense to scan reliably
**Why it happens:** TLV data with Arabic text exceeds QR capacity
**How to avoid:** Limit QR to 5 mandatory fields (ZATCA minimum); omit optional fields if size exceeds 500 chars
**Warning signs:** QR generation errors, scan failures

### Pitfall 6: Schema File Not Found in Production

**What goes wrong:** Validation fails in production but works locally
**Why it happens:** XSD files not included in build output or wrong path
**How to avoid:** Include schemas in build config; use path.join(__dirname) for paths
**Warning signs:** "Schema file not found" errors only in deployed environments

## Code Examples

### Complete E-Invoice Generation Flow

```typescript
// Source: Orchestration pattern combining all services
import { injectable, inject } from 'inversify';
import { TYPES } from '../../config/types';

@injectable()
export class EInvoiceService {
  constructor(
    @inject(TYPES.PrismaClient) private prisma: PrismaClient,
    @inject(TYPES.VatInvoiceService) private vatInvoiceService: VatInvoiceService,
    @inject(TYPES.PintAeBuilderService) private pintAeBuilder: PintAeBuilderService,
    @inject(TYPES.UblValidatorService) private ublValidator: UblValidatorService,
    @inject(TYPES.QrCodeService) private qrCodeService: QrCodeService,
    @inject(TYPES.EInvoiceArchiveService) private archiveService: EInvoiceArchiveService,
  ) {}

  async generateEInvoice(
    companyId: string,
    invoiceId: string
  ): Promise<EInvoiceResult> {
    // 1. Get source tax invoice from Phase 3
    const taxInvoice = await this.vatInvoiceService.getTaxInvoice(companyId, invoiceId);
    if (!taxInvoice) {
      throw new Error('Tax invoice not found');
    }

    // 2. Validate FTA compliance (Phase 3 validation)
    const ftaCompliance = await this.vatInvoiceService.validateFtaCompliance(
      companyId,
      invoiceId
    );
    if (!ftaCompliance.compliant) {
      throw new Error(`Invoice not FTA compliant: ${ftaCompliance.issues.join(', ')}`);
    }

    // 3. Generate PINT AE XML
    const xml = this.pintAeBuilder.buildInvoiceXml(taxInvoice);

    // 4. Validate against UBL 2.1 schema
    const validationResult = await this.ublValidator.validateInvoice(xml);
    if (!validationResult.valid) {
      return {
        success: false,
        errors: validationResult.errors,
        invoice: null,
      };
    }

    // 5. Generate QR code with TLV encoding
    const qrCodeInput: QrCodeInput = {
      sellerName: taxInvoice.supplierName,
      sellerTrn: taxInvoice.supplierTrn,
      timestamp: taxInvoice.invoiceDate,
      invoiceTotal: taxInvoice.totalAmount.toString(),
      vatTotal: taxInvoice.totalVat.toString(),
      invoiceHash: crypto.createHash('sha256').update(xml).digest('hex'),
    };
    const qrCodeData = await this.qrCodeService.generateQrCode(qrCodeInput);

    // 6. Archive with tamper-proof storage
    return await this.prisma.$transaction(async (tx) => {
      const archive = await this.archiveService.archiveEInvoice(
        tx,
        taxInvoice,
        xml,
        qrCodeData
      );

      // 7. Create audit log
      await tx.auditLogs.create({
        data: {
          id: crypto.randomUUID(),
          userId: taxInvoice.createdById,
          action: 'EINVOICE_GENERATE',
          entity: 'EInvoice',
          entityId: archive.id,
          newValue: {
            invoiceId,
            einvoiceNumber: archive.einvoiceNumber,
            xmlHash: archive.xmlHash,
          },
          companyId,
        },
      });

      return {
        success: true,
        errors: [],
        invoice: {
          id: archive.id,
          einvoiceNumber: archive.einvoiceNumber,
          xml,
          qrCode: qrCodeData,
          xmlHash: archive.xmlHash,
          status: 'GENERATED',
        },
      };
    });
  }
}
```

### VAT Invoice to PINT AE Field Mapping

```typescript
// Source: Mapping from existing TaxInvoiceData to PINT AE fields
const FIELD_MAPPING = {
  // Header
  'cbc:ID': (inv: TaxInvoiceData) => inv.invoiceNumber,                    // IBT-001
  'cbc:IssueDate': (inv: TaxInvoiceData) => formatDate(inv.invoiceDate),   // IBT-002
  'cbc:InvoiceTypeCode': () => '380',                                       // IBT-003
  'cbc:DocumentCurrencyCode': () => 'AED',                                  // IBT-005

  // Supplier (from Phase 3 TaxInvoiceData)
  'Supplier.Name': (inv: TaxInvoiceData) => inv.supplierName,               // IBT-027
  'Supplier.TRN': (inv: TaxInvoiceData) => inv.supplierTrn,                 // IBT-031
  'Supplier.Address': (inv: TaxInvoiceData) => inv.supplierAddress,         // IBG-05

  // Buyer
  'Buyer.Name': (inv: TaxInvoiceData) => inv.recipientName,                 // IBT-044
  'Buyer.TRN': (inv: TaxInvoiceData) => inv.recipientTrn,                   // IBT-048
  'Buyer.Address': (inv: TaxInvoiceData) => inv.recipientAddress,           // IBG-08

  // Totals
  'MonetaryTotal.LineExtensionAmount': (inv: TaxInvoiceData) => inv.subtotal,        // IBT-106
  'MonetaryTotal.TaxExclusiveAmount': (inv: TaxInvoiceData) => inv.subtotal,         // IBT-109
  'MonetaryTotal.TaxInclusiveAmount': (inv: TaxInvoiceData) => inv.totalAmount,      // IBT-112
  'MonetaryTotal.PayableAmount': (inv: TaxInvoiceData) => inv.totalAmount,           // IBT-115

  // Tax
  'TaxTotal.TaxAmount': (inv: TaxInvoiceData) => inv.totalVat,              // IBT-110
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| PDF invoices | PINT AE XML mandatory | July 2026 | Must generate structured XML |
| Simplified invoices | Full e-invoices only | July 2026 | All fields required |
| Manual QR codes | TLV-encoded QR mandatory | July 2026 | Machine-readable verification |
| Email delivery | ASP network delivery | July 2026 | Must integrate with Access Points |
| 5-year retention | 7-year retention proposed | Under review | Plan for 7 years |

**Deprecated/outdated:**
- PDF/image invoices for B2B (not compliant)
- Simplified tax invoices (being phased out)
- Direct buyer delivery (must go through ASP network)

## Open Questions

1. **UAE-Specific TLV Tag Numbers**
   - What we know: TLV encoding similar to ZATCA, 5 mandatory fields minimum
   - What's unclear: UAE FTA hasn't published official tag number assignments
   - Recommendation: Use ZATCA tags 1-5 as baseline; make configurable for FTA updates

2. **QR Code Requirements for Full E-Invoices**
   - What we know: QR codes mentioned but "not required to be printed" per some sources
   - What's unclear: Whether QR is mandatory in XML or just for PDF representation
   - Recommendation: Generate QR for all e-invoices; include in archive; display on PDF

3. **Digital Signature Requirements**
   - What we know: "Digital signatures, encryption" mentioned in ASP requirements
   - What's unclear: Whether invoice-level signatures required or handled by ASP
   - Recommendation: Defer to Phase 7 (ASP integration); prepare hash field for signing

4. **PINT AE Self-Billing (Document Type 389)**
   - What we know: Separate spec for self-billing exists
   - What's unclear: Which customers require self-billing invoices
   - Recommendation: Focus on 380 (standard) and 381 (credit note) for Phase 6

5. **Free Zone Indicator in XML**
   - What we know: PINT AE has "special transaction classifications" including free zones
   - What's unclear: Exact XML element and code list for free zone indicator
   - Recommendation: Research PINT AE code lists; map from Phase 3 free zone status

## Sources

### Primary (HIGH confidence)
- [OpenPeppol PINT AE Billing v1.0.1](https://docs.peppol.eu/poac/ae/2025-Q2/pint-ae/) - Official UAE e-invoice specification
- [OpenPeppol PINT AE Self-Billing](https://docs.peppol.eu/poac/ae/2025-Q2/pint-ae-sb/) - Self-billing specification
- [UAE Ministry of Finance E-Invoicing Portal](https://mof.gov.ae/einvoicing/) - Official UAE government source
- [OASIS UBL 2.1 Documentation](https://docs.oasis-open.org/ubl/UBL-2.1.html) - UBL schema specification
- [ZATCA QR Code Creation Guide](https://zatca.gov.sa/ar/E-Invoicing/SystemsDevelopers/Documents/QRCodeCreation.pdf) - TLV encoding reference

### Secondary (MEDIUM confidence)
- [Deloitte PINT AE Specifications Analysis](https://www.deloitte.com/middle-east/en/services/tax/perspectives/mof-publishes-pint-ae-specifications-for-e-invoicing.html) - Field requirements
- [Flick Network UAE E-Invoice Format Guide](https://www.flick.network/en-ae/uae-standard-e-invoice-xml-format) - Detailed IBT field mapping
- [fast-xml-parser npm](https://www.npmjs.com/package/fast-xml-parser) - XML library documentation
- [libxmljs2-xsd npm](https://www.npmjs.com/package/libxmljs2-xsd) - XSD validation library
- [qrcode npm](https://www.npmjs.com/package/qrcode) - QR generation library

### Tertiary (LOW confidence)
- [peppol-billing GitHub](https://github.com/pondersource/peppol-billing) - Under construction, useful patterns
- Community blog posts on TLV encoding
- WebSearch results on ASP integration patterns

### Existing Codebase (HIGH confidence)
- `src/services/vat/vat-invoice.service.ts` - Phase 3 tax invoice generation
- `src/types/vat.types.ts` - TaxInvoiceData interface
- `src/utils/decimal-math.util.ts` - TRN validation, currency rounding
- `src/services/audit.service.ts` - Tamper-proof logging patterns (Phase 2)

## Metadata

**Confidence breakdown:**
- PINT AE XML structure: HIGH - OpenPeppol official documentation
- UBL 2.1 schema validation: HIGH - OASIS standard, established libraries
- QR code generation: HIGH - Standard libraries, ZATCA reference
- TLV encoding for UAE: MEDIUM - Based on ZATCA; UAE FTA tags not published
- ASP integration patterns: LOW - General Peppol patterns; UAE ASPs not yet certified
- Archival requirements: MEDIUM - 5-year confirmed, 7-year proposed

**Research date:** 2026-01-24
**Valid until:** 2026-07-01 (review after e-invoicing pilot launch)

## Implementation Recommendations

### What to Build (Core Phase 6)
1. **PintAeBuilderService** - XML generation from TaxInvoiceData
2. **UblValidatorService** - Schema + business rule validation
3. **QrCodeService** - TLV encoding + QR generation
4. **EInvoiceArchiveService** - Tamper-proof 7-year storage
5. **EInvoiceService** - Orchestration layer
6. **Database schema** - einvoice_archives table with hash chain

### Defer to Phase 7 (Transmission)
1. ASP API integration
2. Tax Data Document (TDD) generation
3. Message Level Status (MLS) handling
4. Digital signature implementation
5. DCTCE platform connectivity

### Estimated Effort
| Component | Effort | Notes |
|-----------|--------|-------|
| Schema setup (XSD files) | 2 hours | Download, configure paths |
| PintAeBuilderService | 8 hours | Complex namespace/mapping |
| UblValidatorService | 4 hours | XSD + business rules |
| QrCodeService | 4 hours | TLV encoding, testing |
| EInvoiceArchiveService | 4 hours | Extend Phase 2 patterns |
| EInvoiceService orchestration | 4 hours | Integration |
| Database migrations | 2 hours | Archive table, sequence |
| Unit/integration tests | 8 hours | Validation edge cases |
| **Total** | **36 hours** | ~4-5 days |
