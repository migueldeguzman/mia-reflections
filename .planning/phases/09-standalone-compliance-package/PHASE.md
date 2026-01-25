# Phase 09: Standalone Compliance Package

## Goal
Compliance engine is available as independent REST API package for integration with external systems.

## Requirements

| ID | Requirement | Status |
|----|-------------|--------|
| STANDALONE-01 | REST API for all compliance functions | 🔄 In Progress |
| STANDALONE-02 | Standalone deployment option | ⬜ Not Started |
| STANDALONE-03 | Self-service onboarding portal | ⬜ Not Started |
| STANDALONE-04 | API documentation and SDK | ⬜ Not Started |

## Plans

| Plan | Description | Status |
|------|-------------|--------|
| 09-01-PLAN.md | REST API audit and gaps | ⬜ |
| 09-02-PLAN.md | Standalone server entry point | ⬜ |
| 09-03-PLAN.md | API key management and onboarding | ⬜ |
| 09-04-PLAN.md | OpenAPI documentation and SDK | ⬜ |

## Success Criteria

1. All compliance functions (VAT, CT, WPS, E-Invoice) are accessible via documented REST endpoints
2. Package can be deployed independently without full Vesla ERP installation
3. External developers can onboard and generate API keys without manual intervention
4. SDK is available with code samples demonstrating all major integration scenarios

## Dependencies
- Phase 3-5: Stable compliance engines (VAT, CT, WPS)
- Phase 6-7: Stable e-invoicing engine
- Phase 8: Compliance portal services
