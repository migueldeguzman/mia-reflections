# Kevin Internal Knowledge Base — Vesla ERP

**Maintained by:** Kevin (Customer Support & QA)  
**Last updated:** January 31, 2026  
**Purpose:** Single reference for understanding the Vesla ERP system

---

## 1. Module Guides

### Rent-A-Car (Primary Module)
- **What:** Bookings, contracts, deliveries, dispatch, TARS fines/Salik
- **Frontend:** `/rent-a-car/*` routes, sidebar sections: Dashboard, Rental Operations, Rental Admin, TARS Management
- **Backend:** `booking.service.ts`, `contract.service.ts`, `delivery.service.ts`, `dispatch.service.ts`
- **Mobile:** rent-a-car-mobile (137 tsx files) — Customer + Staff dual-variant app
- **Key endpoints:** `POST /api/bookings`, `POST /api/contracts`, `GET /api/delivery-calendar`
- **Permissions:** bookings.*, contracts.*, deliveries.*, dispatch.*, vehicle_movements.*
- **Accounting:** booking-accounting.service.ts hooks into approval/cancel/complete

### Finance
- **What:** Invoices, payments, VAT, receivables, collections, GL, trial balance
- **Frontend:** `/finance/*` routes — 61 pages (largest module)
- **Backend:** `invoice.service.ts`, `payment.service.ts`, `accounting-entry.service.ts`
- **Key endpoints:** `GET/POST /api/finance/invoices`, `/payments`, `/vouchers`, `/collection/*`
- **Permissions:** invoices.*, payments.*, finance.*, transactions.*, ledgers.*
- **VAT:** INPUT: 2,273,925.05 / OUTPUT: -2,091,026.68 (verified via V9 script)

### TARS Management
- **What:** Traffic fines & Salik charges from RTA
- **Frontend:** `/rent-a-car/tars/*` routes — Dashboard, Traffic Fines, Salik Charges, Sync Log
- **Backend:** `tars-fines.service.ts`, `tars-salik.service.ts`, `tars-credentials.service.ts`
- **Status:** ⚠️ Needs real TARS staging API credentials to function (currently returns empty data)
- **Known issue:** Frontend crashes on empty data — needs specific error handling

### HR
- **What:** Attendance, leave, payroll (WPS-compliant)
- **Frontend:** `/hr/*` routes — Dashboard, Attendance, Leave, Payroll, Biometrics
- **Backend:** `attendance.service.ts`, `leave.service.ts`, `payroll-cycle.service.ts`
- **Accounting:** payroll-accounting.service.ts hooks into payroll completion

### Service Center
- **What:** Work orders, parts inventory, QR scanning
- **Frontend:** `/service-center/*` routes
- **Backend:** `parts.service.ts`, `parts-qr.service.ts`, work order endpoints
- **Mobile:** service-center-mobile (50 tsx files)
- **Accounting:** service-center-accounting.service.ts hooks into service completion

### Recovery
- **What:** Towing/transport jobs, trucks, drivers, mileage tracking
- **Frontend:** `/recovery/*` routes — Dashboard, Job Details, Trucks, Drivers
- **Backend:** `recovery.service.ts` — full CRUD for jobs, trucks, drivers, pricing
- **Mobile:** recovery-mobile (scaffolded)
- **Mileage:** Check-out/check-in system with audit trail

### Vehicle Dealership
- **What:** Vehicle inventory listings, sales pipeline
- **Frontend:** `/vehicle-dealership/*` routes
- **Backend:** `vehicle-dealership.service.ts` (492 lines), image upload middleware
- **Accounting:** dealership-accounting.service.ts hooks into vehicle sale

### Properties
- **What:** Leases, maintenance, units
- **Frontend:** `/properties/*` routes
- **Backend:** `properties.service.ts` (374 lines), `property-accounting.service.ts`
- **Accounting:** property-accounting.service.ts hooks into lease creation/rent/termination

### Fleet Partners / Owner Portal
- **What:** Vehicle owner revenue sharing
- **Frontend:** `/fleet-partners/*`, `/owner-portal/*` routes
- **Backend:** `owner-revenue.service.ts`
- **Permissions:** owner_portal.*, subscriptions.*

### Speed Sync
- **What:** Data sync between Vesla and Speed Auto Systems
- **Frontend:** `/speed-sync/*` routes — Settings, Modules, Run Now
- **Backend:** Puppeteer-based sync runner, 19 modules mapped
- **Excel parser:** 320 lines, handles all module data imports

### Dynamic Pricing
- **What:** Rate management for rentals
- **Frontend:** `/dynamic-pricing/*` routes — Dashboard, Rules, Assignments, Variables, Calculator
- **Backend:** `dynamic-pricing.service.ts`

### Admin
- **What:** Users, roles, permissions, packages, system health, knowledge base, blog
- **Frontend:** `/admin/*` routes — User Management, Integrations, General Settings, Data Management
- **Permissions:** 299 total permissions across all modules
- **Superuser:** admin@mrminvestments.ae — has ALL permissions

### Customer Support
- **What:** Support ticket management
- **Frontend:** `/customer-support/*` routes
- **Backend:** Support ticket endpoints
- **Kevin's service account:** kevin-bot@mrminvestments.ae (15 permissions)

---

## 2. Troubleshooting Guide

### Common Issues & Fixes

| Problem | Cause | Fix |
|---------|-------|-----|
| "Access Denied" for superuser | `ENABLE_SUPERUSER_BYPASS` env var missing | Restart backend — fix in aad31e47 makes isMasterOrgUser unconditional |
| TARS "Unable to Load Data" | No TARS API credentials configured | Need staging credentials from RTA |
| Packages page empty table | Packages not assigned to companies | Superuser sees all regardless — this shows company-package assignments |
| 404 on module pages | Missing permissions in DB | Run `add-missing-permissions.ts` seed |
| Frontend TS errors after merge | Feature branches merged without typecheck | Run `npx tsc --noEmit` before merge |
| FAQ not showing | Missing FAQ seed data | Run all faq-seed-v*.ts scripts in order |
| Permission cache stale | User permissions cached in JWT | Re-login to refresh |
| Speed Sync routes no auth | Fixed by Mia (369a30d6) | Applied — verify auth middleware present |

### Error Resolution Steps
1. Check browser console for frontend errors
2. Check backend logs (`npm run dev` output)
3. Search Knowledge Base (Cmd+K → search)
4. Check kanban for existing task about the issue
5. If new: create kanban card with screenshot + error text

---

## 3. Seed Scripts Catalog

**Run order:** Execute in this sequence for a fresh setup.

| Order | Script | What it does |
|-------|--------|-------------|
| 1 | `01-core/` | Core system data (companies, base config) |
| 2 | `02-permissions/` | Permission definitions |
| 3 | `seed-packages.ts` | Package definitions (Rent-A-Car, Finance, Admin, etc.) |
| 4 | `seed-permissions.ts` | Permission-to-package mappings |
| 5 | `add-missing-permissions.ts` | 50 additional permissions for newer modules |
| 6 | `grant-superuser-permissions.ts` | Grant all 299 permissions to MRM_SUPERUSER |
| 7 | `kevin-service-account.ts` | Kevin service account (kevin-bot@mrminvestments.ae) |
| 8 | `08-chart-of-accounts/chart-of-accounts-seed.ts` | 31 GL accounts per company |
| 9 | `faq-seed.ts` through `faq-seed-v9.ts` | FAQ entries (run in order v1→v9) |
| 10 | `faq-url-fix.ts`, `faq-url-fix-v2.ts`, `faq-url-fix-v3.ts` | Fix FAQ target URLs |
| 11 | `07-test-data/staff-mobile-test-data-v2.ts` | Test staff, customers, vehicles, bookings |
| 12 | `seed-tars-sample-data.ts` | TARS sample traffic fines & Salik |
| 13 | `blog-content-seed.ts` | Blog posts and categories |
| 14 | `seed-support-tickets.ts` | Sample support tickets |

---

## 4. Team Contacts

| Who | Role | Handles | Tag |
|-----|------|---------|-----|
| **Miguel** | Team Leader | Direction, decisions, deployment | Direct message |
| **Anders** 🤖 | Developer (Backend) | APIs, infra, tests, DB, automation | ⚠️ NEEDS ANDERS |
| **Mia** 🌸 | Developer (Frontend) | UI/UX, React pages, integrations | ⚠️ NEEDS MIA |
| **Kevin** 🔧 | Customer Support & QA | Bug triage, hotfixes, audits, KB | ⚠️ NEEDS KEVIN |

### Escalation Flow
- Level 1 (Kevin): UI bugs, config issues, permission errors, how-to questions
- Level 2 (Mia): Frontend architecture, complex React components, UI/UX redesigns
- Level 2 (Anders): Backend logic, database schema, API changes, test infrastructure

---

## 5. Known Open Issues

| Issue | Module | Severity | Blocker? |
|-------|--------|----------|----------|
| TARS fines "Unable to Load Data" | TARS | HIGH | Needs credentials |
| Package access middleware is stub (allows all) | Admin | CRITICAL | SaaS model bypassed |
| MFA disabled in auth controller | Auth | CRITICAL | No 2FA in production |
| TARS client secrets in plain text | TARS | CRITICAL | Needs encryption |
| Push notifications placeholder project ID | Mobile | HIGH | No push notifs work |
| All notification channels are stubs | Multiple | HIGH | No emails/SMS/WhatsApp sent |
| 468 TS errors (from feature merges) | Backend | MEDIUM | CI failing |
| Profile update throws "not implemented" (mobile) | Mobile | HIGH | User-facing error |
| Hardcoded company ID in mobile app | Mobile | HIGH | Multi-tenant blocked |
| Frontend admin routes no permission gating | Frontend | CRITICAL | Fixed by Mia (b21eea13) |

---

## 6. Key API Endpoints

### Authentication
- `POST /api/auth/login` — Login, returns JWT + permissions
- `POST /api/auth/register-customer` — Customer registration

### Rent-A-Car
- `POST /api/bookings` — Create booking
- `GET /api/bookings?status=*` — List bookings
- `POST /api/contracts` — Create contract
- `GET /api/delivery-calendar/monthly` — Delivery calendar

### Finance
- `GET/POST /api/finance/invoices` — Invoice CRUD
- `GET/POST /api/finance/payments` — Payment CRUD
- `GET /api/finance/collection/queue` — Collection queue
- `GET /api/finance/vat-returns` — VAT returns

### Admin
- `GET /api/admin/users` — User management
- `GET /api/admin/roles` — Role management
- `GET /api/admin/packages` — Package management
- `GET /api/health` — Health check (public)
- `GET /api/health/detailed` — Detailed health (auth required)

### Support
- `GET /api/support-tickets?status=open` — Open tickets
- `POST /api/support-tickets/:id/comments` — Reply to ticket
- `GET /api/support-tickets/stats` — Ticket stats

### Speed Sync
- `GET /api/speed-sync/settings` — Sync settings
- `POST /api/speed-sync/run` — Manual sync trigger

### Swagger
- `GET /api-docs` — Swagger UI
- `GET /api-docs.json` — Raw OpenAPI spec

---

## 7. Architecture Decisions

| Decision | Why | Who |
|----------|-----|-----|
| Monolith Prisma schema (258 models) | Speed of development, single migration path | Team |
| All accounting hooks in service layer | Real-time GL entries on business events | Mia |
| Dual-variant mobile app (Customer/Staff) | Single codebase, shared components | Mia |
| Puppeteer for Speed Sync | Speed Auto has no API — web scraping required | Anders |
| In-memory API cache (not Redis) | Simplicity for MVP, Redis planned for production | Mia |
| JWT with 299 permissions in payload | Fast permission checks without DB roundtrip | Anders |
| FAQ seeded per company | Multi-tenant FAQ isolation | Team |
| Kanban board (flat JSON) | Simple, agent-accessible, no DB dependency | Anders |

---

*This document is maintained by Kevin. Update it when you learn something new about the system.*
