# Codebase Concerns

**Analysis Date:** 2026-01-23

## Tech Debt

**Massive API File (rent-a-car-mobile)**
- Issue: Single file `rent-a-car-mobile/src/services/api.ts` at 3,818 lines is extremely large
- Files: `rent-a-car-mobile/src/services/api.ts`
- Impact: Difficult to maintain, hard to test, merge conflicts likely, slow IDE performance
- Fix approach: Continue extracting domain-specific APIs (authApi.ts, vehicleApi.ts, bookingApi.ts noted in file header) and deprecate this monolithic file

**Large Screen Components**
- Issue: Multiple screen files exceed 1,500-2,000+ lines
- Files:
  - `rent-a-car-mobile/src/screens/KYCEligibilityScreen.tsx` (2,428 lines)
  - `rent-a-car-mobile/src/screens/SpeedSyncDashboardScreen.tsx` (2,186 lines)
  - `rent-a-car-mobile/src/screens/PaymentScreen.tsx` (1,803 lines)
  - `rent-a-car-mobile/src/screens/HomeScreen.tsx` (1,541 lines)
  - `rent-a-car-mobile/src/screens/BookingScreen.tsx` (1,465 lines)
- Impact: Component complexity, testing difficulty, code reuse hindered
- Fix approach: Extract reusable hooks, smaller subcomponents, and business logic into separate files

**Backend Service Layer Files**
- Issue: Large service files with mixed concerns
- Files:
  - `web-erp-app/backend/src/services/booking.service.ts` (2,225 lines)
  - `web-erp-app/backend/src/services/finance/receipt-voucher.service.ts` (1,687 lines)
  - `web-erp-app/backend/src/services/user.service.ts` (1,588 lines)
  - `web-erp-app/backend/src/services/deployment.service.ts` (1,588 lines)
- Impact: Testing complexity, tight coupling, harder to understand business logic
- Fix approach: Split services by subdomain, extract common patterns to base classes

**Deprecated Components Still In Use**
- Issue: Multiple components marked as deprecated but still referenced
- Files:
  - `web-erp-app/frontend/src/components/admin/AdminModal.tsx` - Use Modal from ui/Modal
  - `web-erp-app/frontend/src/components/admin/AdminBadge.tsx` - Use Badge from ui/Badge
  - `web-erp-app/frontend/src/components/admin/AdminTable.tsx` - Use Table from ui/Table
  - `web-erp-app/frontend/src/components/admin/AdminButton.tsx` - Use Button from ui/Button
  - `web-erp-app/frontend/src/components/common/StatusBadge.tsx` - Use Badge component
  - `web-erp-app/frontend/src/components/rental-operations/StatCard.tsx` - Use common/StatCard
  - `web-erp-app/frontend/src/pages/RentalsDashboardPage.tsx` - Deprecated as of 2026-01-10
- Impact: Code duplication, inconsistent UI, maintenance burden
- Fix approach: Migrate all usages to unified components, then remove deprecated files

**Worktree Directories Accumulating**
- Issue: Multiple git worktrees exist that may be stale/abandoned
- Files:
  - `web-erp-app/.worktrees/feature-dispatch-tracking/`
  - `web-erp-app/.worktrees/review-web-erp-app-feature-pricing-package-1769072337335/`
  - `web-erp-app/.worktrees/speed-sync/`
- Impact: Disk space usage, confusion about which code is authoritative, potential stale code being indexed
- Fix approach: Review and clean up completed/abandoned worktrees; establish worktree management policy

**TypeScript `as any` Usage**
- Issue: Widespread use of `as any` type assertions bypassing type safety
- Files: Common across codebase, especially in:
  - `web-erp-app/frontend/src/components/rental-operations/modals/*.tsx`
  - `web-erp-app/backend/prisma/seeds/07-test-data/seed-complete.ts`
  - `web-erp-app/backend/backups-fix-all/*.ts`
- Impact: Runtime errors possible, defeats TypeScript benefits, hides type mismatches
- Fix approach: Define proper types/interfaces, use type guards, fix underlying type issues

## Known Bugs

**Popular Vehicles Endpoint Returns All Vehicles**
- Symptoms: `/api/vehicles/popular` returns ALL available vehicles instead of popularity-ranked subset
- Files: `server-client-tests/mobile-tests/business-logic/popular-vehicles.test.ts` (lines 107-108)
- Trigger: Call GET /api/vehicles/popular
- Workaround: None documented - test is marked as expected to fail

**Error Handler Crashes on Null/Undefined**
- Symptoms: Backend error handler crashes when null or undefined error is thrown
- Files: `server-client-tests/backend-tests/unit/error-handling.test.ts` (lines 504-513)
- Trigger: Throw null or undefined in catch block
- Workaround: Tests are skipped; always throw Error objects

**Internal Error Exposure**
- Symptoms: Non-operational errors leak internal details to client
- Files: `server-client-tests/backend-tests/unit/error-handling.test.ts` (line 283)
- Trigger: Unexpected errors in request handlers
- Workaround: Test skipped; need to implement error sanitization

## Security Considerations

**Credentials Committed to .env Files**
- Risk: Database URL with credentials visible in committed `.env` file
- Files: `web-erp-app/backend/.env` contains live DATABASE_URL with password
- Current mitigation: .gitignore should exclude this, but file exists in working directory
- Recommendations: Verify .env is in .gitignore; rotate database credentials; use environment-specific .env files

**Google Maps and Firebase API Keys in Frontend .env**
- Risk: API keys visible in frontend environment file
- Files: `web-erp-app/frontend/.env` contains VITE_GOOGLE_MAPS_API_KEY, VITE_FIREBASE_API_KEY
- Current mitigation: These are client-side keys that must be exposed
- Recommendations: Ensure API keys have proper domain restrictions in Google Cloud Console; implement usage quotas

**JWT Secret in Development Config**
- Risk: Weak/predictable JWT secret in development
- Files: `web-erp-app/backend/.env` - JWT_SECRET is a descriptive string
- Current mitigation: Comment says "change-in-production"
- Recommendations: Use proper secret rotation; ensure production uses cryptographically random secret

**Deprecated Permission Boolean Flags**
- Risk: Old `isAdmin`, `isCompanyAdmin`, `isBookingAgent` flags still exist in schema
- Files: `web-erp-app/backend/prisma/schema.prisma`, various service files
- Current mitigation: Pack-role system is preferred; bypass logic removed
- Recommendations: Complete migration to pack-role system; remove deprecated columns after verification

## Performance Bottlenecks

**Large Test Sidebar File**
- Problem: Test file for sidebar extremely large
- Files: `web-erp-app/frontend/src/components/erp-homepage/__tests__/ERPSidebar.test.tsx` (2,411 lines)
- Cause: Excessive test duplication, testing implementation details
- Improvement path: Refactor tests to use shared fixtures; focus on behavior not implementation

**Console Logging in Production Code**
- Problem: 74+ files contain console.log/error/warn calls
- Files: Widespread across `web-erp-app/frontend/src/`, `mrm-investments-homepage/src/`
- Cause: Debug statements not removed, no centralized logging
- Improvement path: Implement centralized logger (service-center-mobile has good pattern in `src/utils/logger.ts`); remove direct console calls

## Fragile Areas

**Payment Processing**
- Files:
  - `rent-a-car-mobile/src/screens/PaymentScreen.tsx`
  - `web-erp-app/backend/src/services/payment/*.ts`
- Why fragile: Complex state management, multiple external integrations (CCAvenue), error recovery logic
- Safe modification: Always test full payment flow end-to-end; maintain staging environment
- Test coverage: Has dedicated security tests but business logic may have gaps

**Multi-Tenant Data Isolation**
- Files: All service files in `web-erp-app/backend/src/services/`
- Why fragile: Every query MUST include companyId filter; easy to miss in new code
- Safe modification: Always include companyId in WHERE clauses; use service-layer validation pattern from CLAUDE.md
- Test coverage: Penetration tests exist but need continuous vigilance

**KYC Eligibility Logic**
- Files: `rent-a-car-mobile/src/screens/KYCEligibilityScreen.tsx`
- Why fragile: Complex state machine for 4 KYC status values; UI depends heavily on backend state
- Safe modification: Test all 4 kycStatus transitions (ELIGIBLE, PENDING_VERIFICATION, REJECTED, INCOMPLETE)
- Test coverage: `server-client-tests/mobile-tests/business-logic/kyc-eligibility-status.test.tsx` exists

## Scaling Limits

**Monolithic API File**
- Current capacity: Single 3,818-line file handling all mobile API calls
- Limit: Team collaboration bottleneck; IDE performance degrades
- Scaling path: Complete domain extraction; use modular API architecture

**Git Worktrees**
- Current capacity: 3+ active worktrees
- Limit: Disk space; developer confusion; CI/CD complexity
- Scaling path: Establish feature branch lifecycle; automate worktree cleanup

## Dependencies at Risk

**React 19 (Breaking Changes)**
- Risk: Mobile apps using React 19.1.x which has significant breaking changes
- Impact: Component lifecycle changes, concurrent mode behavior
- Migration plan: Already on latest; monitor for patch releases

**Expo SDK 54**
- Risk: Recent major version; ecosystem catching up
- Impact: Plugin compatibility issues possible
- Migration plan: Stay current but cautious; test thoroughly before SDK upgrades

## Missing Critical Features

**Popularity System Not Implemented**
- Problem: Popular vehicles endpoint exists but returns all vehicles; no actual popularity tracking
- Blocks: Cannot show truly popular vehicles to customers; affects recommendations
- Files: Multiple TODOs in `server-client-tests/mobile-tests/business-logic/popular-vehicles.test.ts` (lines 836-897)

**Profile Update Endpoint**
- Problem: `profileAPI.updateProfile()` marked as TODO - backend endpoint not implemented
- Blocks: Customers cannot update their profile after initial creation
- Files: `rent-a-car-mobile/src/services/api.ts` (lines 1061, 1263-1269)

**Production Error Tracking Integration**
- Problem: Logger has TODO for production error tracking service integration
- Blocks: Limited visibility into production errors on mobile
- Files: `service-center-mobile/src/utils/logger.ts` (line 30)

## Test Coverage Gaps

**Skipped Tests - Error Handling**
- What's not tested: Error handler edge cases (null errors, stack trace logging, generic messages)
- Files: `server-client-tests/backend-tests/unit/error-handling.test.ts` (8 skipped tests)
- Risk: Error handling bugs could leak sensitive info or crash server
- Priority: High

**Skipped Tests - Popularity System**
- What's not tested: All popularity-related functionality
- Files: `server-client-tests/mobile-tests/business-logic/popular-vehicles.test.ts` (7 skipped tests)
- Risk: Feature doesn't work as expected; no regression protection
- Priority: Medium (feature not fully implemented)

**Skipped Tests - Clipboard Fallback**
- What's not tested: Clipboard API fallback when not available
- Files: `mrm-investments-homepage/src/hooks/useClipboard.test.ts` (2 skipped tests)
- Risk: Clipboard functionality may fail on older browsers
- Priority: Low

**Placeholder Tests**
- What's not tested: Modal and contact form functionality
- Files:
  - `mrm-investments-homepage/src/__tests__/modal.test.tsx` - placeholder tests
  - `mrm-investments-homepage/src/__tests__/contact.test.tsx` - placeholder tests
- Risk: Core UI functionality untested
- Priority: Medium

**Backend Jest Coverage Threshold**
- What's not tested: Many backend files (30% baseline noted in jest.config.js)
- Files: `web-erp-app/backend/jest.config.js` (line 65)
- Risk: Regressions in untested code paths
- Priority: High - establish coverage enforcement

## Inconsistencies Between Projects

**Different State Management Approaches**
- Issue: No unified state management pattern across mobile apps
- Impact: Knowledge sharing difficulty; inconsistent user experience
- Projects affected: rent-a-car-mobile, service-center-mobile, showroom-mobile

**Logging Implementation Varies**
- Issue: service-center-mobile has structured logger; other projects use console directly
- Impact: Inconsistent log formats; harder to debug across projects
- Good pattern: `service-center-mobile/src/utils/logger.ts`

**Test Framework Setup Differences**
- Issue: Tests centralized in server-client-tests but some projects have local tests
- Impact: Unclear where to add new tests; some projects may have outdated test setups
- Recommendation: Document canonical test locations per project type

---

*Concerns audit: 2026-01-23*
