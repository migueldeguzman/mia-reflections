# Phase 8: Compliance Verification Portal - Research

**Researched:** 2026-01-25
**Domain:** Compliance Dashboard, Pre-submission Validation, Sandbox Testing, Sign-off Workflows
**Confidence:** HIGH

## Summary

This research investigates how to implement a unified Compliance Verification Portal that aggregates status from four UAE compliance areas (VAT, Corporate Tax, WPS, E-Invoice) and provides pre-submission validation with sign-off workflows. The research reveals that **significant infrastructure already exists** in the codebase from Phases 2-7 that can be leveraged.

Key findings:
1. **Existing Approval Workflows** - Phase 2 created FTA approval workflows with 5 templates (VAT_RETURN, CT_RETURN, PAYROLL, COMPLIANCE_CONFIG, EINVOICE_BATCH) that can be reused for compliance sign-offs
2. **Existing Audit Infrastructure** - ComplianceAuditService with hash chain provides immutable approval records
3. **Sandbox Provider Exists** - Phase 7 created SandboxProvider that connects to FTA sandbox environment
4. **Validation Services Available** - Each compliance phase has validation methods that can be called for checklist verification

**Primary recommendation:** Build a CompliancePortalService that aggregates status from existing services (VatReturnService, CtReportService, WpsSifService, TransmissionService), implements configurable checklists using existing validation methods, and leverages the existing FTA approval workflow for sign-offs with hash chain audit logging.

## Existing Services Analysis

### Phase 3: VAT Compliance Engine

| Service | Methods Available | What It Provides |
|---------|-------------------|------------------|
| VatCalculationService | calculateVat(), validateReverseCharge() | VAT calculation with rate validation |
| VatReturnService | generateForm201(), validatePeriod() | Form 201 generation and period validation |
| VatReconciliationService | reconcilePeriod(), findDiscrepancies() | Transaction reconciliation for VAT periods |
| VatPeriod model | status, dueDate, filedAt | Filing status and deadline tracking |

**Checklist Items (VAT-01 through VAT-08):**
- TRN valid and 15 digits starting with 100
- Filing frequency set (Monthly/Quarterly)
- Current period status (OPEN/CLOSED/FILED)
- Box 1-14 calculations complete
- Reconciliation discrepancies resolved
- Output/Input VAT balances
- Reverse charge transactions identified
- Bad debt relief eligibility checked

### Phase 4: Corporate Tax Compliance

| Service | Methods Available | What It Provides |
|---------|-------------------|------------------|
| CtCalculationService | calculate(), applyThreshold() | 9% rate calculation with 375K threshold |
| CtReportService | generateSchedule(), validateAdjustments() | Taxable income schedules |
| TransferPricingService | checkThresholds(), validateArmLength() | Related party transaction validation |
| TaxGroupService | verifyOwnership(), checkEligibility() | 95%+ ownership verification |

**Checklist Items (CT-01 through CT-09):**
- CT period defined (fiscal year)
- Accounting income calculated
- Non-deductible expenses identified (fines, penalties)
- Exempt income classified (participation exemption)
- Tax losses tracked with 75% offset cap
- Transfer pricing thresholds checked (AED 40M+)
- Small Business Relief eligibility verified
- Tax group ownership validated (if applicable)
- Filing deadline calculated (9 months after period end)

### Phase 5: WPS Payroll Compliance

| Service | Methods Available | What It Provides |
|---------|-------------------|------------------|
| WpsSifService | generateSif(), validateSifStructure() | SIF file generation with format validation |
| PayrollCycleService | validateCycle(), checkStatusTransition() | Payroll cycle state machine |
| WpsErrorService | mapErrors(), getResolution() | Error code mapping with remediation |
| EmployeeSalaryRecord model | personCode, iban, validationErrors | Employee-level validation |

**Checklist Items (WPS-01 through WPS-06):**
- All employees have MOHRE Person Codes (14 digits)
- IBANs valid (23 characters, UAE format)
- Bank routing codes valid (WPS agents table)
- Salary calculations complete
- SIF file validates without errors
- Payroll cycle approved via workflow

### Phase 6-7: E-Invoice Compliance

| Service | Methods Available | What It Provides |
|---------|-------------------|------------------|
| PintAeBuilderService | buildPintAe(), validate() | PINT-AE XML generation |
| UblValidatorService | validateXml(), validateSchematron() | XML schema + PEPPOL rules |
| EInvoiceArchiveService | archive(), getArchive() | 7-year archive with hash |
| TransmissionQueueService | queueTransmission(), getStatus() | BullMQ queue for transmission |
| MlsHandlerService | handleMlsResponse(), mapErrors() | MLS status processing |
| SandboxProvider | transmit(), checkStatus() | FTA sandbox testing |

**Checklist Items (EINV-01 through EINV-09):**
- Supplier TRN valid in all invoices
- PINT-AE XML validates against schema
- PEPPOL Schematron rules pass
- QR codes contain valid TLV data
- Archives accessible (7-year retention)
- Transmission credentials configured
- Sandbox tests passing
- Transmission queue healthy
- MLS clearance status tracked

### Phase 2: Internal Controls (Reusable Infrastructure)

| Service | Methods Available | What It Provides |
|---------|-------------------|------------------|
| ComplianceAuditService | logWithHashChain(), logSmart() | Tamper-proof audit logging |
| AuditIntegrityService | verifyIntegrity(), verifyRecentRecords() | Hash chain verification |
| ApprovalWorkflowService | submitForApproval(), approve(), reject() | Multi-level approval workflow |
| approval_workflows table | 5 FTA templates seeded | Pre-configured approval chains |

**Approval Workflow Templates (Already Seeded):**
- VAT_RETURN: Accountant -> Finance Manager -> CFO (3 levels)
- CT_RETURN: Accountant -> Finance Manager -> CFO (3 levels)
- PAYROLL: HR Manager -> Finance Manager (2 levels)
- COMPLIANCE_CONFIG: Compliance Officer -> CEO (2 levels)
- EINVOICE_BATCH: Accountant -> Finance Manager (2 levels)

## Standard Stack

### Core (Already in Use)
| Library | Version | Purpose | Already Available |
|---------|---------|---------|-------------------|
| Prisma | ^5.22.0 | ORM for PostgreSQL | YES |
| inversify | ^6.x | Dependency injection | YES |
| BullMQ | ^5.x | Queue status monitoring | YES (Phase 7) |
| crypto | Node.js built-in | Hash chain audit | YES (Phase 2) |

### New Dependencies
| Library | Version | Purpose | Why Needed |
|---------|---------|---------|------------|
| node-cron | ^3.x | Scheduled status refresh | Already in use (Phase 2 backups) |
| handlebars | ^4.7.x | Preview templates | Already in use (Phase 7 notifications) |

**Installation:**
```bash
# No new dependencies needed - all required libraries already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── services/
│   └── compliance-portal/
│       ├── compliance-portal.service.ts      # Main aggregator
│       ├── compliance-checklist.service.ts   # Checklist validation
│       ├── compliance-preview.service.ts     # FTA submission preview
│       ├── sandbox-orchestrator.service.ts   # Sandbox test runner
│       └── __tests__/
├── controllers/
│   └── compliance-portal.controller.ts       # REST endpoints
├── routes/
│   └── compliance-portal.routes.ts           # Route definitions
└── types/
    └── compliance-portal.types.ts            # Portal-specific types
```

### Pattern 1: Status Aggregation Service

**What:** Central service aggregating compliance status from 4 domains
**When to use:** Dashboard display, overall compliance health

```typescript
// Source: Aggregation pattern from existing dashboard services

export interface ComplianceStatus {
  overall: 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT' | 'UNKNOWN';
  lastUpdated: Date;
  domains: {
    vat: DomainComplianceStatus;
    corporateTax: DomainComplianceStatus;
    wps: DomainComplianceStatus;
    eInvoice: DomainComplianceStatus;
  };
}

export interface DomainComplianceStatus {
  status: 'PASS' | 'WARNING' | 'FAIL' | 'PENDING';
  checksPassed: number;
  checksTotal: number;
  criticalIssues: ComplianceIssue[];
  warnings: ComplianceIssue[];
  lastCheckedAt: Date;
}

@injectable()
export class CompliancePortalService {
  constructor(
    @inject(TYPES.VatReturnService) private vatService: VatReturnService,
    @inject(TYPES.CtReportService) private ctService: CtReportService,
    @inject(TYPES.PayrollCycleService) private wpsService: PayrollCycleService,
    @inject(TYPES.TransmissionService) private einvService: TransmissionService,
    @inject(TYPES.ComplianceChecklistService) private checklistService: ComplianceChecklistService
  ) {}

  async getComplianceStatus(companyId: string): Promise<ComplianceStatus> {
    // Run all domain checks in parallel
    const [vat, ct, wps, einv] = await Promise.all([
      this.checklistService.runChecklist(companyId, 'VAT'),
      this.checklistService.runChecklist(companyId, 'CT'),
      this.checklistService.runChecklist(companyId, 'WPS'),
      this.checklistService.runChecklist(companyId, 'EINVOICE'),
    ]);

    const domains = { vat, corporateTax: ct, wps, eInvoice: einv };
    const overall = this.calculateOverallStatus(domains);

    return {
      overall,
      lastUpdated: new Date(),
      domains,
    };
  }

  private calculateOverallStatus(
    domains: Record<string, DomainComplianceStatus>
  ): 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT' | 'UNKNOWN' {
    const statuses = Object.values(domains).map((d) => d.status);

    if (statuses.some((s) => s === 'FAIL')) return 'NON_COMPLIANT';
    if (statuses.some((s) => s === 'WARNING')) return 'WARNING';
    if (statuses.some((s) => s === 'PENDING')) return 'UNKNOWN';
    return 'COMPLIANT';
  }
}
```

### Pattern 2: Configurable Checklist Engine

**What:** Extensible checklist system with check definitions
**When to use:** Running validation checklists for each compliance domain

```typescript
// Source: Based on validation patterns from Phases 3-7

export interface CheckDefinition {
  id: string;
  domain: 'VAT' | 'CT' | 'WPS' | 'EINVOICE';
  name: string;
  description: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  checkFn: (context: CheckContext) => Promise<CheckResult>;
  remediationGuide: string;
}

export interface CheckContext {
  companyId: string;
  periodId?: string;
  prisma: PrismaClient;
  services: ServiceContainer;
}

export interface CheckResult {
  passed: boolean;
  status: 'PASS' | 'WARNING' | 'FAIL' | 'SKIPPED';
  message: string;
  details?: unknown;
  affectedRecords?: string[];
}

// VAT Checks Definition
const VAT_CHECKS: CheckDefinition[] = [
  {
    id: 'VAT-01',
    domain: 'VAT',
    name: 'TRN Validation',
    description: 'Verify company TRN is valid 15-digit format',
    severity: 'CRITICAL',
    checkFn: async (ctx) => {
      const company = await ctx.prisma.companies.findUnique({
        where: { id: ctx.companyId },
        select: { taxNumber: true },
      });

      const trnPattern = /^100\d{12}$/;
      const valid = trnPattern.test(company?.taxNumber || '');

      return {
        passed: valid,
        status: valid ? 'PASS' : 'FAIL',
        message: valid
          ? 'TRN is valid 15-digit format'
          : 'TRN must be 15 digits starting with 100',
      };
    },
    remediationGuide: 'Update company TRN in Settings > Company Profile',
  },
  {
    id: 'VAT-02',
    domain: 'VAT',
    name: 'Current Period Status',
    description: 'Verify VAT period exists and is properly configured',
    severity: 'CRITICAL',
    checkFn: async (ctx) => {
      const currentPeriod = await ctx.prisma.vat_periods.findFirst({
        where: {
          companyId: ctx.companyId,
          status: { in: ['OPEN', 'CLOSED'] },
          endDate: { gte: new Date() },
        },
        orderBy: { startDate: 'desc' },
      });

      return {
        passed: !!currentPeriod,
        status: currentPeriod ? 'PASS' : 'FAIL',
        message: currentPeriod
          ? `Active period: ${currentPeriod.periodNumber}`
          : 'No active VAT period configured',
        details: currentPeriod,
      };
    },
    remediationGuide: 'Create VAT period in VAT > Periods',
  },
  // ... more VAT checks
];
```

### Pattern 3: Sandbox Test Orchestrator

**What:** Run submissions through FTA sandbox before production
**When to use:** Pre-submission validation for e-invoices, testing VAT returns

```typescript
// Source: Extending SandboxProvider from Phase 7

export interface SandboxTestRequest {
  domain: 'VAT' | 'CT' | 'WPS' | 'EINVOICE';
  testType: 'FULL' | 'QUICK' | 'SPECIFIC';
  documentIds?: string[]; // Specific documents to test
}

export interface SandboxTestResult {
  testId: string;
  domain: string;
  status: 'PASS' | 'FAIL' | 'PARTIAL';
  startedAt: Date;
  completedAt: Date;
  testsRun: number;
  testsPassed: number;
  testsFailed: number;
  results: SandboxDocumentResult[];
}

@injectable()
export class SandboxOrchestratorService {
  constructor(
    @inject(TYPES.SandboxProvider) private sandboxProvider: SandboxProvider,
    @inject(TYPES.EInvoiceArchiveService) private archiveService: EInvoiceArchiveService,
    @inject(TYPES.ComplianceAuditService) private auditService: ComplianceAuditService
  ) {}

  async runEInvoiceSandboxTest(
    companyId: string,
    userId: string,
    request: SandboxTestRequest
  ): Promise<SandboxTestResult> {
    const testId = crypto.randomUUID();
    const startedAt = new Date();

    // Get documents to test
    const documents = await this.getDocumentsForTest(companyId, request);

    const results: SandboxDocumentResult[] = [];

    for (const doc of documents) {
      try {
        const archive = await this.archiveService.getArchive(doc.id);
        const result = await this.sandboxProvider.transmit(
          doc.id,
          archive.xmlContent,
          {
            einvoiceNumber: archive.einvoiceNumber,
            supplierTrn: archive.supplierTrn,
            recipientTrn: archive.recipientTrn,
            invoiceType: archive.documentType,
            totalAmount: archive.totalAmount,
            vatAmount: archive.vatAmount,
            currency: 'AED',
            issueDate: archive.issueDate,
          }
        );

        results.push({
          documentId: doc.id,
          documentNumber: archive.einvoiceNumber,
          status: result.success ? 'PASS' : 'FAIL',
          errors: result.errors,
          sandboxResponse: result.rawResponse,
        });
      } catch (error) {
        results.push({
          documentId: doc.id,
          documentNumber: doc.documentNumber,
          status: 'ERROR',
          errors: [{ code: 'TEST_ERROR', message: error.message }],
        });
      }
    }

    // Log sandbox test to audit
    await this.auditService.logSmart(
      this.prisma,
      { userId, companyId },
      {
        action: 'SANDBOX_TEST_RUN',
        entity: 'CompliancePortal',
        entityId: testId,
        newValue: { domain: request.domain, testsRun: results.length },
      }
    );

    return {
      testId,
      domain: request.domain,
      status: this.calculateTestStatus(results),
      startedAt,
      completedAt: new Date(),
      testsRun: results.length,
      testsPassed: results.filter((r) => r.status === 'PASS').length,
      testsFailed: results.filter((r) => r.status !== 'PASS').length,
      results,
    };
  }
}
```

### Pattern 4: Sign-Off Workflow Integration

**What:** Leverage existing FTA approval workflows for compliance sign-offs
**When to use:** Final approval before FTA submission

```typescript
// Source: Extending ApprovalWorkflowService from Phase 2

export interface ComplianceSignOffRequest {
  companyId: string;
  domain: 'VAT' | 'CT' | 'WPS' | 'EINVOICE';
  periodId: string;
  submitterId: string;
  checklistResults: DomainComplianceStatus;
  previewData: SubmissionPreviewData;
}

@injectable()
export class ComplianceSignOffService {
  constructor(
    @inject(TYPES.ApprovalWorkflowService) private approvalService: ApprovalWorkflowService,
    @inject(TYPES.ComplianceAuditService) private auditService: ComplianceAuditService,
    @inject(TYPES.PrismaClient) private prisma: PrismaClient
  ) {}

  async submitForSignOff(
    tx: PrismaTransactionClient,
    request: ComplianceSignOffRequest,
    userId: string
  ): Promise<SignOffResult> {
    // Validate all critical checks passed
    if (request.checklistResults.status === 'FAIL') {
      throw new Error('Cannot submit for sign-off with failing critical checks');
    }

    // Map domain to document type
    const documentTypeMap: Record<string, ApprovalDocumentType> = {
      VAT: 'VAT_RETURN',
      CT: 'CT_RETURN',
      WPS: 'PAYROLL',
      EINVOICE: 'EINVOICE_BATCH',
    };

    const documentType = documentTypeMap[request.domain];

    // Create sign-off record
    const signOffId = crypto.randomUUID();
    await tx.compliance_sign_offs.create({
      data: {
        id: signOffId,
        companyId: request.companyId,
        domain: request.domain,
        periodId: request.periodId,
        status: 'PENDING_APPROVAL',
        checklistSnapshot: request.checklistResults,
        previewSnapshot: request.previewData,
        submittedById: request.submitterId,
        submittedAt: new Date(),
      },
    });

    // Submit to existing approval workflow
    const approval = await this.approvalService.submitForApproval(tx, {
      documentType,
      documentId: signOffId,
      companyId: request.companyId,
      submitterId: request.submitterId,
      metadata: {
        domain: request.domain,
        periodId: request.periodId,
        criticalChecksPassed: request.checklistResults.checksPassed,
        totalChecks: request.checklistResults.checksTotal,
      },
    });

    // Create immutable audit record using hash chain
    await this.auditService.logWithHashChain(tx, { userId, companyId: request.companyId }, {
      action: 'COMPLIANCE_SIGNOFF_SUBMITTED',
      entity: 'ComplianceSignOff',
      entityId: signOffId,
      newValue: {
        domain: request.domain,
        periodId: request.periodId,
        approvalId: approval.id,
        checklistSnapshot: request.checklistResults,
      },
    });

    return {
      signOffId,
      approvalId: approval.id,
      status: 'PENDING_APPROVAL',
      currentLevel: approval.currentLevel,
      pendingApprovers: approval.pendingApprovers,
    };
  }

  async approveSignOff(
    tx: PrismaTransactionClient,
    signOffId: string,
    approverId: string,
    comments?: string
  ): Promise<ApprovalResult> {
    const signOff = await tx.compliance_sign_offs.findUnique({
      where: { id: signOffId },
    });

    if (!signOff) throw new Error('Sign-off not found');

    // Call existing approval workflow
    const result = await this.approvalService.approve(tx, {
      documentId: signOffId,
      approverId,
      comments,
    });

    // If fully approved, update sign-off status
    if (result.isFullyApproved) {
      await tx.compliance_sign_offs.update({
        where: { id: signOffId },
        data: {
          status: 'APPROVED',
          approvedAt: new Date(),
          approvalRecord: result,
        },
      });

      // Create immutable approval record
      await this.auditService.logWithHashChain(
        tx,
        { userId: approverId, companyId: signOff.companyId },
        {
          action: 'COMPLIANCE_SIGNOFF_APPROVED',
          entity: 'ComplianceSignOff',
          entityId: signOffId,
          newValue: {
            domain: signOff.domain,
            periodId: signOff.periodId,
            approvers: result.approvalHistory,
            approvedAt: new Date().toISOString(),
          },
        }
      );
    }

    return result;
  }
}
```

### Pattern 5: FTA Submission Preview

**What:** Show exactly what will be submitted to FTA
**When to use:** Before final sign-off

```typescript
// Source: Based on export formats from Phases 3-7

export interface SubmissionPreviewData {
  domain: string;
  periodId: string;
  format: 'FORM_201' | 'CT_RETURN' | 'SIF_FILE' | 'PINT_AE_XML';
  previewHtml: string;
  rawData: unknown;
  summary: {
    totalRecords: number;
    totalAmount: number;
    totalTax: number;
    filingDeadline: Date;
  };
  validationStatus: 'VALID' | 'WARNINGS' | 'INVALID';
  validationMessages: ValidationMessage[];
}

@injectable()
export class CompliancePreviewService {
  async generatePreview(
    companyId: string,
    domain: string,
    periodId: string
  ): Promise<SubmissionPreviewData> {
    switch (domain) {
      case 'VAT':
        return this.generateVatPreview(companyId, periodId);
      case 'CT':
        return this.generateCtPreview(companyId, periodId);
      case 'WPS':
        return this.generateWpsPreview(companyId, periodId);
      case 'EINVOICE':
        return this.generateEInvoicePreview(companyId, periodId);
      default:
        throw new Error(`Unknown domain: ${domain}`);
    }
  }

  private async generateVatPreview(
    companyId: string,
    periodId: string
  ): Promise<SubmissionPreviewData> {
    const form201 = await this.vatReturnService.generateForm201(companyId, periodId);

    // Render Form 201 as HTML for display
    const previewHtml = await this.renderTemplate('form-201', form201);

    return {
      domain: 'VAT',
      periodId,
      format: 'FORM_201',
      previewHtml,
      rawData: form201,
      summary: {
        totalRecords: form201.transactionCount,
        totalAmount: form201.box8_totalOutputTax.amount + form201.box11_totalInputTax.amount,
        totalTax: form201.box14_netVatPayable,
        filingDeadline: form201.dueDate,
      },
      validationStatus: form201.errors.length === 0 ? 'VALID' : 'INVALID',
      validationMessages: form201.errors,
    };
  }
}
```

### Anti-Patterns to Avoid

- **Tight coupling to domain services:** Use interfaces, not concrete implementations
- **Hardcoded checklists:** Use configurable check definitions
- **Synchronous status calculation:** Always use parallel Promise.all for domain checks
- **Missing audit trail:** Every sign-off action must go through ComplianceAuditService
- **Bypassing approval workflow:** Use existing ApprovalWorkflowService, don't create new approval logic
- **Storing sensitive data in preview:** Preview should reference, not duplicate, source data

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Approval workflow | Custom approval logic | ApprovalWorkflowService (Phase 2) | Already has multi-level, escalation, roles |
| Immutable records | Custom hash logic | ComplianceAuditService.logWithHashChain (Phase 2) | Hash chain already implemented |
| Sandbox testing | Mock sandbox | SandboxProvider (Phase 7) | Real FTA sandbox integration |
| E-Invoice validation | Custom XML validation | UblValidatorService (Phase 6) | PEPPOL Schematron rules |
| Error mapping | Custom error codes | ErrorMapperService (Phase 7) | PINT-AE field mapping exists |
| Notification sending | Direct email | NotificationService (Phase 7) | Templates, queue, retries |

**Key insight:** 80% of the compliance portal infrastructure already exists. Phase 8 is about **aggregating and presenting** existing functionality, not rebuilding it.

## Common Pitfalls

### Pitfall 1: Running All Checks Synchronously

**What goes wrong:** Dashboard takes 10+ seconds to load
**Why it happens:** Each domain check runs sequentially
**How to avoid:**
- Use Promise.all() for parallel domain checks
- Cache results with short TTL (1-5 minutes)
- Show loading states per domain
**Warning signs:** Users refreshing page, abandoning dashboard

### Pitfall 2: Stale Compliance Status

**What goes wrong:** Dashboard shows "Compliant" but submission fails
**Why it happens:** Status not refreshed after changes
**How to avoid:**
- Invalidate cache on relevant data changes
- Show "Last checked: X minutes ago" timestamp
- Allow manual refresh
**Warning signs:** Users confused by outdated status

### Pitfall 3: Incomplete Checklist Coverage

**What goes wrong:** Submission fails due to unchecked requirement
**Why it happens:** Checklist doesn't cover all FTA requirements
**How to avoid:**
- Map every FTA requirement to a check
- Include checks from all compliance phases
- Test with real FTA sandbox
**Warning signs:** Sandbox rejections for unchecked issues

### Pitfall 4: Lost Approval Context

**What goes wrong:** Can't prove who approved what
**Why it happens:** Approval details not stored with sign-off
**How to avoid:**
- Store checklistSnapshot at approval time
- Store previewSnapshot at approval time
- Use hash chain for immutability
**Warning signs:** FTA audit finding missing approval records

### Pitfall 5: Bypassed Approvals

**What goes wrong:** Submissions without proper sign-off
**Why it happens:** Direct API calls bypass UI workflow
**How to avoid:**
- Validate approval status before allowing submission
- Check current user is in approval chain
- Log all bypass attempts
**Warning signs:** Audit showing submissions without approvals

### Pitfall 6: Preview Mismatch

**What goes wrong:** What user approved != what was submitted
**Why it happens:** Data changed between preview and submission
**How to avoid:**
- Lock data when sign-off submitted
- Use snapshot stored in approval record
- Compare submitted data with snapshot
**Warning signs:** Customer complaints about unexpected submissions

## Code Examples

### Complete Compliance Dashboard Endpoint

```typescript
// Source: Aggregation pattern with existing services

@injectable()
export class CompliancePortalController {
  constructor(
    @inject(TYPES.CompliancePortalService) private portalService: CompliancePortalService
  ) {}

  async getDashboard(req: AuthRequest, res: Response): Promise<void> {
    try {
      const companyId = req.user.companyId;

      // Run all compliance checks in parallel
      const status = await this.portalService.getComplianceStatus(companyId);

      res.json({
        success: true,
        data: {
          overallStatus: status.overall,
          lastUpdated: status.lastUpdated,
          domains: {
            vat: {
              status: status.domains.vat.status,
              passed: status.domains.vat.checksPassed,
              total: status.domains.vat.checksTotal,
              issues: status.domains.vat.criticalIssues.length,
              warnings: status.domains.vat.warnings.length,
            },
            corporateTax: {
              status: status.domains.corporateTax.status,
              passed: status.domains.corporateTax.checksPassed,
              total: status.domains.corporateTax.checksTotal,
              issues: status.domains.corporateTax.criticalIssues.length,
              warnings: status.domains.corporateTax.warnings.length,
            },
            wps: {
              status: status.domains.wps.status,
              passed: status.domains.wps.checksPassed,
              total: status.domains.wps.checksTotal,
              issues: status.domains.wps.criticalIssues.length,
              warnings: status.domains.wps.warnings.length,
            },
            eInvoice: {
              status: status.domains.eInvoice.status,
              passed: status.domains.eInvoice.checksPassed,
              total: status.domains.eInvoice.checksTotal,
              issues: status.domains.eInvoice.criticalIssues.length,
              warnings: status.domains.eInvoice.warnings.length,
            },
          },
        },
      });
    } catch (error) {
      console.error('[CompliancePortal] Dashboard error:', {
        userId: req.user.id,
        error: error.message,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to fetch compliance status',
      });
    }
  }
}
```

### Checklist Service with Remediation

```typescript
// Source: Checklist pattern with existing validation services

@injectable()
export class ComplianceChecklistService {
  private checkRegistry: Map<string, CheckDefinition[]> = new Map();

  constructor(
    @inject(TYPES.PrismaClient) private prisma: PrismaClient,
    @inject(TYPES.VatReturnService) private vatService: VatReturnService,
    @inject(TYPES.CtReportService) private ctService: CtReportService,
    @inject(TYPES.PayrollCycleService) private wpsService: PayrollCycleService,
    @inject(TYPES.TransmissionService) private einvService: TransmissionService
  ) {
    this.registerChecks();
  }

  private registerChecks(): void {
    this.checkRegistry.set('VAT', VAT_CHECKS);
    this.checkRegistry.set('CT', CT_CHECKS);
    this.checkRegistry.set('WPS', WPS_CHECKS);
    this.checkRegistry.set('EINVOICE', EINVOICE_CHECKS);
  }

  async runChecklist(
    companyId: string,
    domain: 'VAT' | 'CT' | 'WPS' | 'EINVOICE',
    periodId?: string
  ): Promise<DomainComplianceStatus> {
    const checks = this.checkRegistry.get(domain) || [];
    const context: CheckContext = {
      companyId,
      periodId,
      prisma: this.prisma,
      services: {
        vat: this.vatService,
        ct: this.ctService,
        wps: this.wpsService,
        einv: this.einvService,
      },
    };

    const results: CheckResultWithMeta[] = [];

    for (const check of checks) {
      try {
        const result = await check.checkFn(context);
        results.push({
          checkId: check.id,
          name: check.name,
          severity: check.severity,
          result,
          remediationGuide: check.remediationGuide,
        });
      } catch (error) {
        results.push({
          checkId: check.id,
          name: check.name,
          severity: check.severity,
          result: {
            passed: false,
            status: 'FAIL',
            message: `Check error: ${error.message}`,
          },
          remediationGuide: check.remediationGuide,
        });
      }
    }

    const criticalIssues = results
      .filter((r) => r.severity === 'CRITICAL' && !r.result.passed)
      .map((r) => ({
        checkId: r.checkId,
        name: r.name,
        message: r.result.message,
        remediation: r.remediationGuide,
      }));

    const warnings = results
      .filter((r) => r.severity === 'WARNING' && !r.result.passed)
      .map((r) => ({
        checkId: r.checkId,
        name: r.name,
        message: r.result.message,
        remediation: r.remediationGuide,
      }));

    const status =
      criticalIssues.length > 0 ? 'FAIL' : warnings.length > 0 ? 'WARNING' : 'PASS';

    return {
      status,
      checksPassed: results.filter((r) => r.result.passed).length,
      checksTotal: results.length,
      criticalIssues,
      warnings,
      lastCheckedAt: new Date(),
    };
  }
}
```

## Database Schema Additions

### New Tables Required

```prisma
// compliance_sign_offs - Stores sign-off records with snapshots
model compliance_sign_offs {
  id                String   @id @default(uuid())
  companyId         String   @map("company_id")
  domain            String   // VAT, CT, WPS, EINVOICE
  periodId          String   @map("period_id")

  // Status
  status            String   @default("PENDING_APPROVAL") // PENDING_APPROVAL, APPROVED, REJECTED
  submittedById     String   @map("submitted_by_id")
  submittedAt       DateTime @map("submitted_at")
  approvedAt        DateTime? @map("approved_at")
  rejectedAt        DateTime? @map("rejected_at")
  rejectedReason    String?  @map("rejected_reason")

  // Snapshots (immutable at submission time)
  checklistSnapshot Json     @map("checklist_snapshot")
  previewSnapshot   Json     @map("preview_snapshot")

  // Approval record (linked to approval_workflows)
  approvalRecord    Json?    @map("approval_record")

  // Audit
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  @@index([companyId, domain, status])
  @@index([periodId])
  @@map("compliance_sign_offs")
}

// compliance_check_runs - Historical check results
model compliance_check_runs {
  id              String   @id @default(uuid())
  companyId       String   @map("company_id")
  domain          String
  periodId        String?  @map("period_id")

  // Results
  status          String   // PASS, WARNING, FAIL
  checksPassed    Int      @map("checks_passed")
  checksTotal     Int      @map("checks_total")
  resultsJson     Json     @map("results_json")

  // Metadata
  triggeredBy     String   @map("triggered_by") // userId or 'SYSTEM'
  triggerType     String   @map("trigger_type") // MANUAL, SCHEDULED, ON_CHANGE
  runDurationMs   Int      @map("run_duration_ms")

  createdAt       DateTime @default(now()) @map("created_at")

  @@index([companyId, domain, createdAt])
  @@map("compliance_check_runs")
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual spreadsheet checklists | Automated validation with code | Phase 8 | Real-time compliance status |
| Email-based approvals | Multi-level workflow system | Phase 2 | Auditable approval chain |
| PDF-only previews | Interactive HTML previews | Phase 8 | Better user experience |
| No sandbox testing | FTA sandbox integration | Phase 7 | Pre-submission validation |
| Separate domain dashboards | Unified compliance portal | Phase 8 | Single source of truth |

**Already implemented in codebase:**
- Hash chain audit logging (Phase 2)
- FTA approval workflow templates (Phase 2)
- Sandbox provider (Phase 7)
- Domain-specific validation services (Phases 3-7)

## Open Questions

1. **Checklist Refresh Frequency**
   - What we know: Users need current status
   - What's unclear: How often to auto-refresh vs. manual
   - Recommendation: 5-minute cache with manual refresh button

2. **Partial Sign-Off Support**
   - What we know: Some domains may be ready before others
   - What's unclear: Should users sign off per domain or all at once?
   - Recommendation: Per-domain sign-off with dependency checks

3. **Historical Comparison**
   - What we know: Users want to see changes over time
   - What's unclear: How long to retain check run history?
   - Recommendation: 7-year retention matching audit log policy

4. **Role-Based Checklist Visibility**
   - What we know: Different users need different views
   - What's unclear: Should checks be filtered by role?
   - Recommendation: Show all checks, highlight actionable ones per role

## Sources

### Primary (HIGH confidence)
- Existing codebase: Phase 2 approval workflows, audit services
- Existing codebase: Phase 3-7 domain services and validation methods
- Existing codebase: Phase 7 SandboxProvider implementation

### Secondary (MEDIUM confidence)
- FTA compliance requirements from Phase 3-7 research
- Approval workflow patterns from Phase 2 research

### Tertiary (LOW confidence)
- Dashboard best practices (industry patterns)

## Metadata

**Confidence breakdown:**
- Service integration: HIGH - All services exist and are documented
- Checklist engine: HIGH - Pattern validated in domain phases
- Sign-off workflow: HIGH - Reusing existing ApprovalWorkflowService
- Sandbox testing: HIGH - SandboxProvider already implemented
- Preview generation: MEDIUM - New functionality using existing data
- Performance optimization: MEDIUM - Needs load testing

**Research date:** 2026-01-25
**Valid until:** 2026-04-25 (3 months - stable patterns, FTA requirements may evolve)

## Implementation Recommendations

### What to Build (Phase 8 Scope)

1. **CompliancePortalService** - Status aggregation from 4 domains
2. **ComplianceChecklistService** - Configurable check engine
3. **CompliancePreviewService** - FTA submission previews
4. **ComplianceSignOffService** - Integration with approval workflows
5. **SandboxOrchestratorService** - Multi-domain sandbox testing
6. **CompliancePortalController** - REST API endpoints
7. **Database migrations** - sign_offs and check_runs tables
8. **Check definitions** - 30+ checks across 4 domains

### Reuse from Existing Phases

| Capability | Source | How to Use |
|------------|--------|------------|
| Approval workflow | ApprovalWorkflowService (Phase 2) | submitForApproval(), approve() |
| Immutable audit | ComplianceAuditService (Phase 2) | logWithHashChain() |
| Sandbox testing | SandboxProvider (Phase 7) | transmit(), checkStatus() |
| VAT validation | VatReturnService (Phase 3) | validatePeriod(), generateForm201() |
| CT validation | CtReportService (Phase 4) | validateAdjustments() |
| WPS validation | WpsSifService (Phase 5) | validateSifStructure() |
| E-Invoice validation | UblValidatorService (Phase 6) | validateXml() |
| Notification | NotificationService (Phase 7) | sendRejectionNotification() |

### Estimated Effort

| Component | Effort | Notes |
|-----------|--------|-------|
| CompliancePortalService | 4 hours | Aggregation, parallel checks |
| ComplianceChecklistService | 8 hours | Check engine + 30 check definitions |
| CompliancePreviewService | 6 hours | 4 domain previews with templates |
| ComplianceSignOffService | 4 hours | Workflow integration |
| SandboxOrchestratorService | 4 hours | Multi-domain test runner |
| REST API + Routes | 4 hours | Controller, routes, permissions |
| Database migrations | 2 hours | 2 new tables |
| Unit tests | 8 hours | Service tests |
| Integration tests | 6 hours | End-to-end flows |
| **Total** | **46 hours** | ~6 days |
