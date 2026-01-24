---
phase: 03-vat-compliance-engine
plan: 09
name: Bilingual PDF Generation
subsystem: vat-pdf
tags:
  - puppeteer
  - handlebars
  - pdf-generation
  - arabic-rtl
  - fta-compliance

dependency-graph:
  requires:
    - 03-03  # Tax invoice template
    - 03-04  # Tax credit/debit note services
  provides:
    - PDF generation for tax invoices
    - PDF generation for credit notes
    - PDF generation for debit notes
    - Bilingual document support (Arabic RTL)
  affects:
    - 03-10  # Input VAT recovery (may need PDF reports)

tech-stack:
  added:
    - handlebars@4.7.8 (template compilation)
  patterns:
    - Singleton browser for Puppeteer (avoids multiple Chrome processes)
    - Template caching for performance
    - Handlebars.compile() for template compilation

key-files:
  created:
    - backend/src/utils/pdf-generator.util.ts (279 lines)
    - backend/src/services/vat/vat-pdf.service.ts (535 lines)
    - backend/src/templates/invoice/credit-note.hbs (345 lines)
    - backend/src/templates/invoice/debit-note.hbs (345 lines)
  modified:
    - backend/src/config/types.ts (added PdfGeneratorUtil, VatPdfService symbols)
    - backend/src/config/container.ts (added DI bindings)
    - backend/src/services/vat/index.ts (added VatPdfService export)
    - backend/package.json (added handlebars dependency)

decisions:
  - id: puppeteer-singleton
    title: Puppeteer singleton browser pattern
    rationale: Prevents spawning multiple Chrome processes which would consume excessive memory
    date: 2026-01-24
  - id: template-caching
    title: Handlebars template caching
    rationale: Compiling templates on every request is expensive; caching improves performance
    date: 2026-01-24
  - id: color-coded-documents
    title: Color-coded credit/debit notes
    rationale: Red for credit notes (reduction), green for debit notes (increase) for visual distinction
    date: 2026-01-24

metrics:
  duration: 15 minutes
  completed: 2026-01-24
---

# Phase 3 Plan 09: Bilingual PDF Generation Summary

Puppeteer-based bilingual PDF service with Handlebars templates for FTA-compliant tax documents.

## One-liner

PdfGeneratorUtil with Puppeteer singleton browser and VatPdfService using Handlebars.compile() for bilingual Arabic/English tax invoice, credit note, and debit note PDF generation.

## What Was Built

### PdfGeneratorUtil (279 lines)
Puppeteer wrapper for PDF generation with proper RTL Arabic support.

**Key Features:**
- Singleton browser instance (prevents multiple Chrome processes)
- `generatePdf()` for basic PDF generation
- `generateBilingualPdf()` with automatic Arabic font injection
- A4 format with configurable margins
- Font waiting (document.fonts.ready) for proper Arabic rendering
- Graceful cleanup on `close()`

**Arabic Font Support:**
```typescript
// Automatic Noto Sans Arabic injection
const ARABIC_FONT_CSS = `
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    .rtl, .arabic {
      font-family: 'Noto Sans Arabic', 'Arial', sans-serif;
      direction: rtl;
      text-align: right;
    }
  </style>
`;
```

### VatPdfService (535 lines)
Service for generating FTA-compliant PDF documents.

**Methods:**
- `generateTaxInvoicePdf()` - Uses VatInvoiceService for all 13 FTA fields
- `generateCreditNotePdf()` - Includes original invoice reference (FTA Article 70)
- `generateDebitNotePdf()` - For price increase adjustments

**Template Loading:**
```typescript
// Handlebars.compile() with caching
const templateSource = fs.readFileSync(templatePath, 'utf-8');
template = Handlebars.compile(templateSource);
this.templateCache.set(templateName, template);
```

**Handlebars Helpers:**
- `formatDate` - DD/MM/YYYY format (FTA standard)
- `formatNumber` - Locale-aware thousand separators
- `formatCurrency` - Currency symbol with 2 decimal places
- `formatPercent` - Decimal to percentage conversion

### Credit Note Template (credit-note.hbs)
**Red color scheme (#b91c1c) for visual distinction:**
- Bilingual header: "TAX CREDIT NOTE" / "إشعار دائن ضريبي"
- Original invoice reference section (FTA Article 70 requirement)
- Reason for credit note section
- Line items with VAT breakdown
- Totals section with Arabic labels

### Debit Note Template (debit-note.hbs)
**Green color scheme (#059669) for visual distinction:**
- Bilingual header: "TAX DEBIT NOTE" / "إشعار مدين ضريبي"
- Original invoice reference section
- Reason for debit note section
- Same structure as credit note for consistency

## FTA Compliance

### Tax Invoice Requirements (Article 59)
All 13 mandatory fields supported via VatInvoiceService:
1. "Tax Invoice" / "فاتورة ضريبية" designation
2. Supplier name (Arabic optional)
3. Supplier address
4. Supplier TRN (15 digits)
5. Recipient name
6. Recipient address
7. Recipient TRN (if VAT-registered)
8. Sequential invoice number
9. Invoice issue date (DD/MM/YYYY)
10. Date of supply (if different)
11. Description of goods/services
12. VAT amount per line/total
13. Total amount payable

### Credit Note Requirements (Article 70)
- Original invoice reference (number, date, value)
- Reason for credit note
- Clear "TAX CREDIT NOTE" designation

## DI Container Integration

```typescript
// types.ts
PdfGeneratorUtil: Symbol.for('PdfGeneratorUtil'),
VatPdfService: Symbol.for('VatPdfService'),

// container.ts
container.bind<PdfGeneratorUtil>(TYPES.PdfGeneratorUtil)
  .to(PdfGeneratorUtil)
  .inSingletonScope();  // CRITICAL: Singleton for browser reuse

container.bind<VatPdfService>(TYPES.VatPdfService)
  .to(VatPdfService)
  .inSingletonScope();
```

## Usage Example

```typescript
// In controller
const vatPdfService = container.get<VatPdfService>(TYPES.VatPdfService);

// Generate tax invoice PDF
const result = await vatPdfService.generateTaxInvoicePdf(companyId, invoiceId);

// Send PDF response
res.setHeader('Content-Type', result.mimeType);
res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
res.send(result.buffer);
```

## Shutdown Cleanup

```typescript
// In SIGTERM handler
const pdfGenerator = container.get<PdfGeneratorUtil>(TYPES.PdfGeneratorUtil);
await pdfGenerator.close();  // Closes Chrome browser
```

## Deviations from Plan

None - plan executed exactly as written.

## Files Changed

| File | Action | Lines |
|------|--------|-------|
| `src/utils/pdf-generator.util.ts` | Created | 279 |
| `src/services/vat/vat-pdf.service.ts` | Created | 535 |
| `src/templates/invoice/credit-note.hbs` | Created | 345 |
| `src/templates/invoice/debit-note.hbs` | Created | 345 |
| `src/config/types.ts` | Modified | +4 |
| `src/config/container.ts` | Modified | +7 |
| `src/services/vat/index.ts` | Modified | +7 |
| `package.json` | Modified | +1 |

## Commit

- **Hash:** 087fa53
- **Message:** `feat(03-09): add bilingual PDF generation service for FTA-compliant documents`

## Next Phase Readiness

**Dependencies Satisfied:**
- VatInvoiceService provides all 13 FTA fields for tax invoices
- TaxCreditNoteService and TaxDebitNoteService provide document data
- tax-invoice.hbs template already exists from 03-03

**Ready For:**
- 03-10: Input VAT Recovery Service (may use PDF reports)
- API controllers can now generate downloadable PDFs
- E-invoicing phase can extend PDF generation

## Key Technical Notes

1. **Puppeteer Browser Singleton:** Critical for memory management; never spawn multiple browsers
2. **Font Loading:** Must wait for `document.fonts.ready` for Arabic text rendering
3. **Template Caching:** Handlebars compilation is expensive; cache compiled templates
4. **A4 Viewport:** 794x1123px at 96 DPI with deviceScaleFactor: 2 for crisp text
5. **RTL Support:** CSS `direction: rtl` with Noto Sans Arabic font family
