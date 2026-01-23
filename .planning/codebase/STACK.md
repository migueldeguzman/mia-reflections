# Technology Stack

**Analysis Date:** 2026-01-23

## Languages

**Primary:**
- TypeScript ~5.9.x - All web and mobile applications (frontend, backend, mobile apps)
- Python 3.x - VRC Commission processing system (`vrc-commission/`)

**Secondary:**
- JavaScript - Configuration files, build scripts, some test utilities
- SQL - Prisma migrations, raw database queries

## Runtime

**Environment:**
- Node.js >= 18.0.0 - Backend and build tooling
- Expo SDK ~54.x - React Native mobile app runtime
- Python 3.x - VRC Commission scripts

**Package Manager:**
- npm >= 9.0.0 - All JavaScript/TypeScript projects
- Lockfile: package-lock.json present in each project

## Frameworks

### Web Applications

**mrm-investments-homepage:**
- React ^18.2.0 - UI framework
- Vite ^5.0.8 - Build tool and dev server
- Vitest ^4.0.17 - Test runner

**web-erp-app/frontend:**
- React ^18.2.0 - UI framework
- Vite 7.3.1 - Build tool and dev server
- React Router DOM ^6.21.1 - Client-side routing
- Zustand ^4.4.7 - State management
- TanStack React Query ^5.17.0 - Server state management
- Tailwind CSS ^3.4.0 - Utility-first CSS

**web-erp-app/backend:**
- Express.js ^4.18.2 - HTTP server framework
- Prisma ^5.22.0 - ORM and database client
- Inversify ^7.11.0 - Dependency injection
- Zod ^4.3.5 - Schema validation
- Winston ^3.19.0 - Logging

### Mobile Applications

**rent-a-car-mobile:**
- React Native 0.81.5 - Cross-platform mobile framework
- Expo ~54.0.26 - Development platform and build tools
- React Navigation ^7.x - Navigation stack
- React 19.1.4 - UI framework (latest React)

**service-center-mobile:**
- React Native 0.81.5 - Cross-platform mobile framework
- Expo ~54.0.30 - Development platform
- React Navigation ^7.x - Navigation stack
- React 19.1.0 - UI framework

### Testing Frameworks

**Backend Testing:**
- Jest ^29.7.0 - Test runner
- Supertest ^7.1.4 - HTTP testing
- ts-jest ^29.4.6 - TypeScript support

**Frontend Testing:**
- Jest ^29.7.0 - Test runner
- React Testing Library ^14.3.1 (frontend), ^12.9.0 (mobile)
- jest-axe ^8.0.0 - Accessibility testing
- MSW ^2.0.11 - API mocking

**E2E Testing:**
- Cypress ^13.6.0 - End-to-end testing
- Puppeteer ^24.34.0 - Browser automation

### Build/Dev Tools

- Vite ^5.0.8 / 7.3.1 - Frontend bundling and dev server
- esbuild ^0.24.2 - Backend bundling
- tsx ^4.7.0 - TypeScript execution (Node.js)
- ESLint ^9.39.x - Linting
- Husky ^9.1.7 - Git hooks
- lint-staged ^16.2.7 - Staged file linting

## Key Dependencies

### Critical

**Backend:**
- `@prisma/client` ^5.22.0 - Database ORM (PostgreSQL)
- `jsonwebtoken` ^9.0.3 - JWT authentication
- `bcrypt` ^5.1.1 - Password hashing
- `helmet` ^8.1.0 - Security headers
- `express-rate-limit` ^8.2.1 - Rate limiting
- `express-validator` ^7.3.1 - Input validation

**Frontend:**
- `axios` ^1.13.2 - HTTP client (all projects)
- `axios-retry` ^4.5.0 - Request retry logic
- `date-fns` ^4.1.0 - Date manipulation
- `@tanstack/react-query` ^5.17.0 - Server state caching

**Mobile:**
- `@react-native-async-storage/async-storage` ^2.2.0 - Local storage
- `expo-secure-store` ~15.0.8 - Secure credential storage
- `firebase` ^12.8.0 - Push notifications, realtime tracking
- `react-native-maps` 1.20.1 - Map integration

### Infrastructure

**Database:**
- `pg` ^8.16.3 - PostgreSQL driver
- `prisma` ^5.7.1 - Schema migrations and generation
- `redis` ^5.10.0 - Caching and rate limiting (optional)

**Cloud Services:**
- `@aws-sdk/client-s3` ^3.969.0 - File storage
- `@aws-sdk/s3-request-presigner` ^3.969.0 - Signed URLs
- `firebase-admin` ^13.6.0 - Backend Firebase SDK

**Email:**
- `nodemailer` ^7.0.12 - Email sending

**PDF Generation:**
- `pdfkit` ^0.17.2 - PDF document generation
- `qrcode` ^1.5.4 - QR code generation

**Data Processing:**
- `xlsx` ^0.18.5 - Excel file handling
- `csv-parse` ^5.6.0 - CSV parsing
- `tesseract.js` ^5.1.1 - OCR (document scanning)

## Configuration

**Environment:**
- `.env` files per project (not committed)
- `.env.example` files document required variables
- Zod validation at backend startup (`web-erp-app/backend/src/config/env.config.ts`)

**Key Environment Variables Required:**
- `DATABASE_URL` - PostgreSQL connection string (Neon)
- `JWT_SECRET` - Authentication secret (min 32 chars)
- `CORS_ORIGIN` - Allowed origins for CORS
- `FIREBASE_*` - Firebase configuration (tracking features)
- `CCAVENUE_*` - Payment gateway credentials
- `AWS_*` - S3 storage configuration

**Build Configuration:**
- `tsconfig.json` - TypeScript configuration per project
- `vite.config.ts` - Vite build configuration
- `app.config.ts` - Expo configuration (mobile)
- `jest.config.js` - Test configuration

## Platform Requirements

**Development:**
- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL (via Neon cloud or local)
- Python 3.x (for VRC Commission only)

**Mobile Development:**
- Expo CLI (installed via npx)
- iOS Simulator (macOS) or Android Emulator
- EAS CLI for production builds

**Production:**
- Render.com - Backend hosting (auto-deploy from develop branch)
- Neon - PostgreSQL serverless database
- AWS S3 - File storage (documents, images)
- Firebase - Realtime Database (vehicle tracking)

## Project Port Configuration

| Project | Development Port |
|---------|-----------------|
| web-erp-app/backend | 3000 |
| web-erp-app/frontend | 5173 |
| rent-a-car-mobile (customer) | 8082 |
| rent-a-car-mobile (staff) | 8083 |
| service-center-mobile | 8085 |
| Prisma Studio | 5555 |

## Monorepo Structure

This is a **multi-project monorepo** (not a traditional npm workspace monorepo). Each project has its own `package.json` and dependencies.

**Active Projects:**
- `web-erp-app/` - Web ERP (npm workspaces: backend + frontend)
- `rent-a-car-mobile/` - Customer and staff mobile apps
- `service-center-mobile/` - Service center mobile app
- `server-client-tests/` - Shared test suite
- `vrc-commission/` - Python commission processor
- `mrm-investments-homepage/` - Marketing website

**Placeholder Projects (README only):**
- `showroom-mobile/` - Future showroom app
- `vendor-provider-app/` - Future vendor app

---

*Stack analysis: 2026-01-23*
