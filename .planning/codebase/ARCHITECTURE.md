# Architecture

**Analysis Date:** 2026-01-23

## Pattern Overview

**Overall:** Multi-project monorepo with centralized backend API serving multiple frontend applications

**Key Characteristics:**
- Unified Express.js backend (`web-erp-app/backend`) serves all client applications
- Multiple React Native mobile apps consume the same API endpoints
- Multi-tenant architecture with company-scoped data isolation
- Pack-role permission system for granular access control
- Three-layer architecture: Controller -> Service -> Data (Prisma ORM)

## System Architecture

```
                    ┌─────────────────────────────────────────────┐
                    │            Backend API (Port 3000)          │
                    │         web-erp-app/backend                 │
                    │                                             │
                    │   Express.js + TypeScript + Prisma ORM      │
                    │   JWT Auth + Pack-Role Permissions          │
                    └──────────────────┬──────────────────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
    ┌───────────────┴───┐  ┌───────────┴───────┐  ┌──────┴──────────────┐
    │ web-erp-app/      │  │ rent-a-car-mobile │  │ service-center-     │
    │ frontend          │  │ (Expo/RN)         │  │ mobile (Expo/RN)    │
    │                   │  │                   │  │                     │
    │ React + Vite      │  │ Customer & Staff  │  │ Service Booking     │
    │ ERP Dashboard     │  │ Apps              │  │ App                 │
    │ Port: 5173        │  │ Ports: 8082/8083  │  │ Port: 8085          │
    └───────────────────┘  └───────────────────┘  └─────────────────────┘
                    │                  │                  │
                    └──────────────────┴──────────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    │         PostgreSQL (Neon)          │
                    │      Multi-tenant Database         │
                    └─────────────────────────────────────┘
```

## Projects and Their Relationships

### Core System (`web-erp-app`)
- **Backend API:** Unified REST API on port 3000 serving all applications
- **Frontend Dashboard:** React + Vite admin dashboard on port 5173
- **Relationship:** Backend is the central hub; all other apps depend on it

### Mobile Applications
1. **`rent-a-car-mobile`** (Active Development)
   - Dual-app architecture: Customer app + Staff app via APP_VARIANT
   - Consumes `/api/customers/*`, `/api/bookings/*`, `/api/vehicles/*`
   - Uses React Native + Expo

2. **`service-center-mobile`** (Active)
   - Service booking for vehicle maintenance
   - Consumes `/api/service-center/*` endpoints
   - Independent customer authentication flow

3. **`showroom-mobile`** (Placeholder)
   - Empty project with only README.md
   - Future vehicle showroom app

### Supporting Projects
1. **`vrc-commission`** (Python Desktop App)
   - Commission calculation and legal case tracking
   - Standalone PyQt desktop application
   - Uses separate data sources (Excel, local DB)
   - Does NOT connect to main backend API

2. **`server-client-tests`** (Testing Repository)
   - Centralized test suite for backend API
   - Contains: unit, integration, security, penetration tests
   - Tests run against web-erp-app/backend

3. **`mrm-investments-homepage`** (Static Website)
   - Simple React + Vite landing page
   - No backend integration
   - Standalone deployment

4. **`vendor-provider-app`** (Empty Placeholder)
   - Future vehicle vendor platform

## Layers

### API Layer (Controllers)
- **Purpose:** HTTP request/response handling, input validation
- **Location:** `web-erp-app/backend/src/controllers/`
- **Contains:** 50+ controller files organized by domain
- **Depends on:** Services, Middleware
- **Pattern:** Express route handlers with error wrapping

### Business Logic Layer (Services)
- **Purpose:** Core business logic, authorization validation
- **Location:** `web-erp-app/backend/src/services/`
- **Contains:** 50+ service files with business rules
- **Depends on:** Prisma client, utilities
- **Critical Rule:** All services validate companyId for multi-tenant isolation

### Data Access Layer (Prisma)
- **Purpose:** Database operations, type-safe queries
- **Location:** `web-erp-app/backend/prisma/schema.prisma`
- **Contains:** 100+ models for ERP operations
- **Pattern:** Prisma ORM with PostgreSQL

### Middleware Layer
- **Purpose:** Cross-cutting concerns (auth, permissions, rate limiting)
- **Location:** `web-erp-app/backend/src/middleware/`
- **Key files:**
  - `auth.middleware.ts` - JWT validation
  - `permission.middleware.ts` - Pack-role authorization
  - `error.middleware.ts` - Error handling

## Data Flow

### Customer Booking Flow (Mobile -> Backend):

```
1. Mobile App (rent-a-car-mobile)
   └─> POST /api/auth/login { email, password }
       └─> Returns { token, customer }

2. Mobile App uses token for subsequent requests
   └─> GET /api/vehicles/available?companyId={id}
       └─> Controller: vehicleController.getAvailable()
           └─> Service: vehicleService.getAvailable(companyId)
               └─> Prisma: vehicles.findMany({ where: { companyId } })

3. Create Booking
   └─> POST /api/bookings { vehicleSetupId, dates, ... }
       └─> Middleware: authenticateJWT, requirePermission
           └─> Controller: bookingController.createBooking()
               └─> Service: bookingService.create()
                   └─> Validates customer's companyId
                   └─> Calculates pricing (server-side)
                   └─> Prisma: bookings.create()
```

### Dashboard Data Flow (Web -> Backend):

```
1. Web Dashboard (web-erp-app/frontend)
   └─> POST /api/auth/login { email, password }
       └─> Returns { token, user, permissions }

2. Load Dashboard
   └─> GET /api/dashboard/ceo
       └─> Middleware: authenticateJWT, requirePermission('dashboard.view.admin')
           └─> Controller: dashboardController.getCEODashboard()
               └─> Service: dashboardService.getCEODashboard(userId)
                   └─> Validates user's companyId
                   └─> Fetches company-scoped data only
```

### State Management:

**Mobile Apps:**
- React Context for authentication (`AuthContext`)
- Local state for component-level data
- AsyncStorage for token persistence

**Web Dashboard:**
- Zustand store for auth state (`authStore`)
- Permission caching with 5-minute TTL
- httpOnly cookies for session (production)

## Key Abstractions

### Pack-Role Permission System:
- **Purpose:** Granular, scalable access control
- **Flow:** Package -> Company -> Role -> User
- **Examples:** `dashboard.view.admin`, `booking.create`, `vehicle.edit`
- **Files:**
  - `web-erp-app/backend/src/middleware/permission.middleware.ts`
  - `web-erp-app/frontend/src/components/PermissionGuard.tsx`

### Multi-Tenant Isolation:
- **Purpose:** Company-scoped data access
- **Pattern:** All queries filtered by `companyId`
- **Enforcement:** Service layer validates user.companyId matches requested companyId
- **Files:**
  - All service files in `web-erp-app/backend/src/services/`

### Dual Authentication:
- **Purpose:** Separate auth for customers vs. employees
- **Tables:**
  - `customers` - Mobile app users (rental customers)
  - `users` - Dashboard users (employees, managers)
- **Endpoints:**
  - `/api/auth/login` - Dashboard users
  - `/api/auth/customer/login` - Mobile customers

## Entry Points

### Backend Server:
- **Location:** `web-erp-app/backend/src/index.ts`
- **Triggers:** `npm run dev` or `npm start`
- **Responsibilities:** Express app setup, middleware, routes, graceful shutdown

### Route Registration:
- **Location:** `web-erp-app/backend/src/setup/routes.setup.ts`
- **Contains:** 80+ route registrations organized by domain
- **Pattern:** `/api/{domain}/{resource}`

### Mobile App Entry:
- **Location:** `rent-a-car-mobile/App.tsx`
- **Triggers:** `expo start --port 8082`
- **Pattern:** NavigationContainer with auth-based routing

### Web Dashboard Entry:
- **Location:** `web-erp-app/frontend/src/main.tsx`
- **Triggers:** `npm run dev` (Vite)
- **Pattern:** React app with React Router

## Error Handling

**Strategy:** Three-layer error handling with generic client responses

**Patterns:**
1. **Controller Layer:** Try-catch with generic client messages
   ```typescript
   try {
     const data = await service.getData();
     res.json({ success: true, data });
   } catch (error) {
     logger.error('[SECURITY] Error:', { userId, error });
     res.status(500).json({ success: false, message: 'Failed to fetch data' });
   }
   ```

2. **Service Layer:** Throw specific errors for business logic failures
   ```typescript
   if (user.companyId !== requestedCompanyId) {
     throw new Error('Access denied: Cannot access data from other companies');
   }
   ```

3. **Global Error Handler:** `web-erp-app/backend/src/middleware/error.middleware.ts`

## Cross-Cutting Concerns

**Logging:**
- Winston logger utility (`web-erp-app/backend/src/utils/logger.util.ts`)
- All security events logged with context (userId, companyId, timestamp)

**Validation:**
- express-validator for input validation in routes
- Zod schemas for environment validation (`web-erp-app/backend/src/config/env-validation.ts`)

**Authentication:**
- JWT tokens with configurable expiry (default 7 days)
- httpOnly cookies in production
- Token refresh mechanism in mobile apps

**Rate Limiting:**
- General limiter on all API routes
- Stricter limits on auth endpoints

**CORS:**
- Configurable origins via CORS_ORIGIN environment variable
- Mobile app origins allowed for API access

---

*Architecture analysis: 2026-01-23*
