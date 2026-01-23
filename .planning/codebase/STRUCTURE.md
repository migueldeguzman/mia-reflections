# Codebase Structure

**Analysis Date:** 2026-01-23

## Directory Layout

```
tech-project/
├── .planning/                        # GSD planning documents
│   └── codebase/                     # Codebase analysis docs
├── docs/                             # Repository-level documentation
├── mrm-investments-homepage/         # Static landing page (React + Vite)
├── rent-a-car-mobile/                # Customer & Staff mobile app (Expo)
├── server-client-tests/              # Centralized test suite
├── service-center-mobile/            # Service booking mobile app (Expo)
├── showroom-mobile/                  # Placeholder for future showroom app
├── vendor-provider-app/              # Placeholder for vendor platform
├── vrc-commission/                   # Python desktop commission app
└── web-erp-app/                      # Core ERP system (Backend + Frontend)
```

## Project-Level Structure

### web-erp-app (Core ERP)

```
web-erp-app/
├── package.json                      # Monorepo root with workspaces
├── backend/
│   ├── src/
│   │   ├── index.ts                  # Server entry point
│   │   ├── controllers/              # HTTP request handlers (50+ files)
│   │   ├── services/                 # Business logic layer (50+ files)
│   │   ├── routes/                   # API route definitions (70+ files)
│   │   ├── middleware/               # Auth, permissions, error handling
│   │   ├── setup/                    # App initialization modules
│   │   ├── modules/                  # Feature modules (vehicle, booking, etc.)
│   │   ├── config/                   # Configuration files
│   │   ├── utils/                    # Utility functions
│   │   ├── types/                    # TypeScript type definitions
│   │   ├── validators/               # Input validation schemas
│   │   ├── jobs/                     # Background job handlers
│   │   ├── cache/                    # Caching utilities
│   │   └── __tests__/                # Backend unit tests
│   ├── prisma/
│   │   ├── schema.prisma             # Database schema (100+ models)
│   │   ├── migrations/               # Database migrations
│   │   └── seeds/                    # Seed data and helpers
│   └── scripts/                      # CLI scripts (migrations, audits)
├── frontend/
│   ├── src/
│   │   ├── main.tsx                  # React app entry point
│   │   ├── App.tsx                   # Root component with routing
│   │   ├── pages/                    # Page components
│   │   ├── components/               # Reusable UI components
│   │   │   ├── admin/                # Admin panel components
│   │   │   ├── bookings/             # Booking-related components
│   │   │   ├── dashboard/            # Dashboard widgets
│   │   │   ├── finance/              # Financial components
│   │   │   ├── inventory/            # Inventory management
│   │   │   ├── ui/                   # Base UI components (Table, etc.)
│   │   │   └── ...                   # Other domain components
│   │   ├── stores/                   # Zustand state stores
│   │   ├── services/                 # API client services
│   │   ├── types/                    # TypeScript types
│   │   ├── utils/                    # Utility functions
│   │   ├── contexts/                 # React contexts
│   │   ├── config/                   # Frontend configuration
│   │   └── styles/                   # Global styles
│   └── index.html                    # HTML template
└── documentation/                    # Project documentation
```

### rent-a-car-mobile (Mobile App)

```
rent-a-car-mobile/
├── App.tsx                           # App entry point
├── package.json                      # Expo dependencies
├── app.json                          # Expo configuration
├── src/
│   ├── screens/                      # Screen components (30+ files)
│   │   ├── HomeScreen.tsx
│   │   ├── BookingScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   └── ...
│   ├── components/                   # Reusable components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── VehicleCard/              # Feature-specific components
│   │   ├── booking/
│   │   ├── evidence/
│   │   └── ...
│   ├── navigation/                   # Navigation configuration
│   │   ├── CustomerNavigator.tsx
│   │   └── StaffNavigator.tsx
│   ├── contexts/                     # React contexts
│   │   ├── AuthContext.tsx
│   │   ├── BookingFlowContext.tsx
│   │   └── ToastContext.tsx
│   ├── services/                     # API clients
│   │   ├── api.ts                    # Main API module
│   │   ├── apiClient.ts              # Axios instance
│   │   ├── authApi.ts                # Auth endpoints
│   │   ├── bookingApi.ts             # Booking endpoints
│   │   └── vehicleApi.ts             # Vehicle endpoints
│   ├── hooks/                        # Custom React hooks
│   ├── types/                        # TypeScript types
│   ├── utils/                        # Utility functions
│   ├── config/                       # App configuration
│   ├── theme/                        # Styling constants
│   ├── admin/                        # Staff admin features
│   └── constants/                    # App constants
├── __tests__/                        # Test files
└── assets/                           # Static assets
```

### service-center-mobile

```
service-center-mobile/
├── App.tsx                           # App entry point
├── index.ts                          # Expo entry
├── src/
│   ├── screens/                      # Screen components (12 files)
│   ├── components/                   # UI components
│   │   ├── home/
│   │   └── booking/
│   ├── contexts/                     # Auth context
│   ├── services/                     # API clients
│   ├── types/                        # TypeScript types
│   ├── utils/                        # Utilities
│   ├── config/                       # Configuration
│   ├── hooks/                        # Custom hooks
│   └── theme/                        # Styling
└── __tests__/                        # Test files
```

### server-client-tests

```
server-client-tests/
├── backend-tests/
│   ├── unit/                         # Unit tests
│   ├── integration/                  # Integration tests
│   ├── security/                     # Security tests
│   ├── penetration/                  # Penetration tests
│   ├── auth/                         # Auth-specific tests
│   ├── pack-role-management/         # Permission system tests
│   ├── helpers/                      # Test utilities
│   ├── fixtures/                     # Test data fixtures
│   └── setup.ts                      # Test setup
├── web-erp-app-tests-moved/          # Migrated tests from web-erp-app
│   ├── frontend/
│   └── misplaced-server-client-tests/
└── package.json
```

## Directory Purposes

### Backend Controllers (`web-erp-app/backend/src/controllers/`)
- **Purpose:** HTTP request handling, input validation, response formatting
- **Contains:** One controller per domain (booking, customer, vehicle, etc.)
- **Key files:**
  - `auth.controller.ts` - Login, register, session management
  - `booking.controller.ts` - Booking CRUD operations
  - `dashboard.controller.ts` - Dashboard data endpoints
  - `customer.controller.ts` - Customer management

### Backend Services (`web-erp-app/backend/src/services/`)
- **Purpose:** Business logic, authorization validation, database operations
- **Contains:** Service files matching controllers + specialized services
- **Key files:**
  - `booking.service.ts` - Booking business logic (76KB, largest)
  - `auth.service.ts` - Authentication logic
  - `dashboard.service.ts` - Dashboard data aggregation
  - `contract-*.service.ts` - Contract-related services

### Backend Routes (`web-erp-app/backend/src/routes/`)
- **Purpose:** API endpoint definitions with middleware chains
- **Contains:** Route files matching controllers
- **Key patterns:**
  - `admin/*.routes.ts` - Admin-only endpoints
  - `service-center/*.routes.ts` - Service center specific
  - `finance/*.routes.ts` - Financial operations

### Frontend Components (`web-erp-app/frontend/src/components/`)
- **Purpose:** Reusable UI components
- **Contains:** Domain-organized component directories
- **Key directories:**
  - `admin/` - Admin panel (roles, users, packages)
  - `bookings/` - Booking management
  - `dashboard/` - Dashboard widgets (CEO, Financial)
  - `ui/` - Base components (Table, buttons)

### Mobile Services (`rent-a-car-mobile/src/services/`)
- **Purpose:** API communication with backend
- **Contains:** Domain-specific API modules
- **Key files:**
  - `api.ts` - Main API exports and legacy support
  - `apiClient.ts` - Axios instance with interceptors
  - `authApi.ts` - Authentication endpoints
  - `bookingApi.ts` - Booking operations

## Key File Locations

### Entry Points
- Backend server: `web-erp-app/backend/src/index.ts`
- Frontend app: `web-erp-app/frontend/src/main.tsx`
- Mobile app: `rent-a-car-mobile/App.tsx`
- Service center: `service-center-mobile/App.tsx`

### Configuration
- Backend environment: `web-erp-app/backend/.env`
- Database schema: `web-erp-app/backend/prisma/schema.prisma`
- Backend config: `web-erp-app/backend/src/config/`
- Mobile API config: `rent-a-car-mobile/src/config/api.config.ts`

### Core Logic
- Route setup: `web-erp-app/backend/src/setup/routes.setup.ts`
- Auth middleware: `web-erp-app/backend/src/middleware/auth.middleware.ts`
- Permission middleware: `web-erp-app/backend/src/middleware/permission.middleware.ts`
- Auth store (frontend): `web-erp-app/frontend/src/stores/authStore.ts`
- Auth context (mobile): `rent-a-car-mobile/src/contexts/AuthContext.tsx`

### Testing
- Backend tests: `server-client-tests/backend-tests/`
- Frontend tests: `web-erp-app/frontend/src/**/__tests__/`
- Mobile tests: `rent-a-car-mobile/__tests__/`

## Naming Conventions

### Files
- **Controllers:** `{domain}.controller.ts` (e.g., `booking.controller.ts`)
- **Services:** `{domain}.service.ts` (e.g., `booking.service.ts`)
- **Routes:** `{domain}.routes.ts` (e.g., `booking.routes.ts`)
- **Components:** `{ComponentName}.tsx` (PascalCase)
- **Screens:** `{Name}Screen.tsx` (e.g., `BookingScreen.tsx`)
- **Utilities:** `{name}.util.ts` or `{name}.ts` (camelCase)
- **Types:** `{domain}.types.ts` or in `types/index.ts`
- **Tests:** `{name}.test.ts` or `{name}.spec.ts`

### Directories
- **Domain grouping:** lowercase with hyphens (e.g., `service-center/`)
- **Feature grouping:** lowercase (e.g., `bookings/`, `admin/`)
- **Special directories:** `__tests__/`, `__mocks__/`

## Where to Add New Code

### New Backend API Endpoint
1. **Route file:** `web-erp-app/backend/src/routes/{domain}.routes.ts`
2. **Controller:** `web-erp-app/backend/src/controllers/{domain}.controller.ts`
3. **Service:** `web-erp-app/backend/src/services/{domain}.service.ts`
4. **Route registration:** Add to `web-erp-app/backend/src/setup/routes.setup.ts`
5. **Tests:** `server-client-tests/backend-tests/{category}/{domain}.test.ts`

### New Frontend Page
1. **Page component:** `web-erp-app/frontend/src/pages/{Name}Page.tsx`
2. **Route:** Add to app router configuration
3. **Components:** `web-erp-app/frontend/src/components/{domain}/`

### New Mobile Screen
1. **Screen component:** `rent-a-car-mobile/src/screens/{Name}Screen.tsx`
2. **Navigation:** Add to `rent-a-car-mobile/src/navigation/`
3. **API service:** `rent-a-car-mobile/src/services/{domain}Api.ts`

### New Reusable Component
- **Frontend:** `web-erp-app/frontend/src/components/{domain}/` or `components/ui/`
- **Mobile:** `rent-a-car-mobile/src/components/{domain}/` or `components/`

### New Utility Function
- **Backend:** `web-erp-app/backend/src/utils/{name}.util.ts`
- **Frontend:** `web-erp-app/frontend/src/utils/{name}.ts`
- **Mobile:** `rent-a-car-mobile/src/utils/{name}.ts`

### New Database Model
1. **Schema:** Add to `web-erp-app/backend/prisma/schema.prisma`
2. **Migration:** Run `npm run prisma:migrate`
3. **Types:** Auto-generated by Prisma client

### New Test
- **Unit test:** `server-client-tests/backend-tests/unit/{domain}.test.ts`
- **Integration:** `server-client-tests/backend-tests/integration/{domain}.test.ts`
- **Security:** `server-client-tests/backend-tests/security/{domain}.test.ts`

## Special Directories

### `.planning/` (Root)
- **Purpose:** GSD planning and analysis documents
- **Generated:** By GSD commands
- **Committed:** No (should be in .gitignore)

### `prisma/migrations/` (Backend)
- **Purpose:** Database migration history
- **Generated:** By `prisma migrate`
- **Committed:** Yes (required for DB sync)

### `dist/` or `build/` (Various)
- **Purpose:** Compiled/bundled output
- **Generated:** By build commands
- **Committed:** No

### `node_modules/` (All projects)
- **Purpose:** npm dependencies
- **Generated:** By `npm install`
- **Committed:** No

### `coverage/` (Test projects)
- **Purpose:** Test coverage reports
- **Generated:** By test commands with --coverage
- **Committed:** No

### `uploads/` (Backend)
- **Purpose:** User-uploaded files
- **Generated:** Runtime
- **Committed:** No (use S3 in production)

---

*Structure analysis: 2026-01-23*
