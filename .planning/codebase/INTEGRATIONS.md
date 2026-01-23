# External Integrations

**Analysis Date:** 2026-01-23

## APIs & External Services

### Payment Processing

**CC Avenue:**
- Purpose: Online payment gateway for car rental bookings
- SDK/Client: Custom service (`web-erp-app/backend/src/services/payment/ccavenue-unified.service.ts`)
- Auth: Environment variables
  - `CCAVENUE_MERCHANT_ID`
  - `CCAVENUE_ACCESS_CODE`
  - `CCAVENUE_WORKING_KEY`
- Encryption: AES-128-CBC (MD5 hash of working key)
- Callbacks: `CCAVENUE_REDIRECT_URL`, `CCAVENUE_CANCEL_URL`

**Stripe (Planned):**
- Purpose: Future payment processing
- SDK/Client: `@stripe/stripe-js` (referenced in env config)
- Auth: `VITE_STRIPE_PUBLISHABLE_KEY` (frontend only, not yet implemented)

### Real-Time Tracking

**Firebase Realtime Database:**
- Purpose: Real-time vehicle location tracking for fleet management
- SDK/Client:
  - Frontend: `firebase` ^12.8.0 (`web-erp-app/frontend/src/config/firebase.ts`)
  - Backend: `firebase-admin` ^13.6.0 (`web-erp-app/backend/src/config/firebase.ts`)
  - Mobile: `firebase` ^12.8.0 (`rent-a-car-mobile/src/config/firebase.ts`)
- Auth: Environment variables
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY`
  - `FIREBASE_DATABASE_URL`
  - Frontend: `VITE_FIREBASE_*` variables
- Usage: Driver location broadcasts, fleet tracking dashboard

### Maps & Location

**Google Maps:**
- Purpose: Fleet map visualization, route playback, vehicle markers
- SDK/Client: `@react-google-maps/api` ^2.20.8
- Auth: `VITE_GOOGLE_MAPS_API_KEY`
- Components:
  - `web-erp-app/frontend/src/components/fleet/FleetMap.tsx`
  - `web-erp-app/frontend/src/components/fleet/RoutePlayback.tsx`
  - `web-erp-app/frontend/src/components/fleet/VehicleMarker.tsx`

**React Native Maps:**
- Purpose: Mobile app map integration
- SDK/Client: `react-native-maps` 1.20.1
- Used in: `rent-a-car-mobile/`

### Error Monitoring

**Sentry:**
- Purpose: Error tracking and performance monitoring
- SDK/Client: `@sentry/react` ^10.33.0 (frontend)
- Auth: `VITE_SENTRY_DSN`
- Config:
  - `VITE_SENTRY_ENVIRONMENT`
  - `VITE_SENTRY_SAMPLE_RATE`
- Service: `web-erp-app/frontend/src/services/monitoring.ts`

### External System Integrations

**Speed Auto Systems:**
- Purpose: Vehicle data synchronization, scraping rental agreements
- Integration: Custom Python scraper, sync jobs
- Auth: Environment variables
  - `SPEED_SCRAPER_EMAIL`
  - `SPEED_SCRAPER_PASSWORD`
  - `SPEED_SCRAPER_USERNAME`
- Config: `SPEED_SCRAPER_PATH`, `SPEED_SCRAPER_TIMEOUT`
- Sync: `SPEED_SYNC_ENABLED`, `SPEED_SYNC_CRON_SCHEDULE`
- Backend job: `web-erp-app/backend/src/jobs/tracking-sync.job.ts`

## Data Storage

### Primary Database

**PostgreSQL (Neon Serverless):**
- Provider: Neon (https://console.neon.tech)
- Connection: `DATABASE_URL` environment variable
- ORM: Prisma ^5.22.0
- Schema: `web-erp-app/backend/prisma/schema.prisma`
- Features:
  - Branching support via Neon API
  - Connection pooling
  - Serverless scaling

**Neon API Integration:**
- Purpose: Database branching for development/testing
- Auth:
  - `NEON_API_KEY`
  - `NEON_PROJECT_ID`
- Endpoint: `https://console.neon.tech/api/v2`
- Scripts: `npm run neon:branch:*` commands

### File Storage

**AWS S3:**
- Purpose: Document storage (contracts, invoices, vehicle images)
- SDK/Client: `@aws-sdk/client-s3` ^3.969.0
- Auth:
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `AWS_REGION` (default: me-south-1 Bahrain)
- Bucket: `AWS_S3_BUCKET` (vesla-finance-docs)
- Service: `web-erp-app/backend/src/services/s3-storage.service.ts`
- Features: Presigned URLs for secure uploads/downloads

### Caching

**Redis (Optional):**
- Purpose: Distributed rate limiting, session caching
- Connection: `REDIS_URL` environment variable
- SDK/Client: `redis` ^5.10.0
- Fallback: In-memory rate limiting when Redis unavailable

## Authentication & Identity

### JWT Authentication

**Custom Implementation:**
- Library: `jsonwebtoken` ^9.0.3
- Config:
  - `JWT_SECRET` - Access token secret
  - `JWT_REFRESH_SECRET` - Refresh token secret
  - `JWT_EXPIRES_IN` - Access token expiry (default: 7d)
  - `JWT_REFRESH_EXPIRES_IN` - Refresh token expiry (default: 30d)
- Password hashing: `bcrypt` ^5.1.1 (configurable rounds via `BCRYPT_SALT_ROUNDS`)

### Security Features

**Account Lockout:**
- `LOCKOUT_MAX_ATTEMPTS` - Failed attempts before lockout (default: 5)
- `LOCKOUT_DURATION_MINUTES` - Lockout duration (default: 30)

**Superuser Bypass (Development):**
- `ENABLE_SUPERUSER_BYPASS` - Enable cross-company access
- `SUPERUSER_EMAIL` - Superuser email address

## Email & Notifications

### Transactional Email

**Nodemailer:**
- Purpose: Password reset, email verification, notifications
- SDK/Client: `nodemailer` ^7.0.12
- Auth:
  - `EMAIL_HOST` - SMTP server
  - `EMAIL_PORT` - SMTP port
  - `EMAIL_USER` - SMTP username
  - `EMAIL_PASSWORD` - SMTP password
  - `EMAIL_FROM` - Default sender
- Services:
  - `web-erp-app/backend/src/services/password-reset.service.ts`
  - `web-erp-app/backend/src/services/email-notification.service.ts`
  - `web-erp-app/backend/src/services/email-verification.service.ts`

### Push Notifications

**Expo Notifications (Mobile):**
- SDK/Client: `expo-notifications` ~0.32.15
- Purpose: Mobile push notifications for booking updates

**Firebase Cloud Messaging (Planned):**
- Backend integration through `firebase-admin`

## Monitoring & Observability

### Error Tracking

**Sentry:**
- Frontend: `@sentry/react` ^10.33.0
- Config: Via `VITE_SENTRY_*` environment variables

### Logging

**Winston:**
- Backend: `winston` ^3.19.0
- Format: JSON structured logging
- Levels: error, warn, info, debug

### Analytics (Planned)

**Google Analytics:**
- Config: `VITE_GOOGLE_ANALYTICS_ID` (not yet implemented)
- Frontend tracking ready

## CI/CD & Deployment

### Hosting

**Render.com:**
- Backend API: `https://web-erp-app.onrender.com`
- Mobile Web: `https://rent-a-car-mobile.onrender.com`
- Auto-deploy: From `develop` branch

### GitHub Integration

**Optional CI/CD:**
- Auth: `GITHUB_TOKEN`
- Config: `GITHUB_REPO_OWNER`, `GITHUB_REPO_NAME`
- Purpose: Automated deployment triggers

## Encryption Services

### Payment Credentials

**Custom Encryption:**
- `PAYMENT_ENCRYPTION_KEY` - 32+ char encryption key
- `ENCRYPTION_SALT` - 64+ char salt for key derivation

### AWS KMS (Optional)

**Key Management:**
- Service: `web-erp-app/backend/src/services/security/kms-encryption.service.ts`
- Auth: `AWS_KMS_KEY_ID`
- Cache TTL: `AWS_KMS_CACHE_TTL` (default: 300s)

### Credential Vault

**Secrets Manager:**
- Service: `web-erp-app/backend/src/services/payment/credential-vault.service.ts`
- Purpose: Secure storage for third-party credentials
- Config: `CREDENTIAL_VAULT_ENABLED`, `CREDENTIAL_AUDIT_LOG`

## Webhooks & Callbacks

### Incoming Webhooks

**Payment Callbacks:**
- CC Avenue success: `/api/payments/ccavenue/callback`
- CC Avenue cancel: `/api/payments/ccavenue/cancel`

**Alerts:**
- Payment alerts: `PAYMENT_ALERT_WEBHOOK_URL` (Slack, Discord)

### Outgoing Webhooks

None currently configured.

## Environment Configuration Summary

### Required for Basic Operation

```bash
DATABASE_URL          # PostgreSQL connection (Neon)
JWT_SECRET            # Authentication (min 32 chars)
CORS_ORIGIN           # Allowed origins
```

### Required for Full Features

```bash
# Payment Processing
CCAVENUE_MERCHANT_ID
CCAVENUE_ACCESS_CODE
CCAVENUE_WORKING_KEY

# File Storage
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_S3_BUCKET

# Vehicle Tracking
FIREBASE_PROJECT_ID
FIREBASE_DATABASE_URL
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY

# Frontend (Vite)
VITE_FIREBASE_API_KEY
VITE_FIREBASE_DATABASE_URL
VITE_GOOGLE_MAPS_API_KEY
```

### Optional Services

```bash
# Error Monitoring
VITE_SENTRY_DSN

# Caching
REDIS_URL

# Email
EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD

# External Sync
SPEED_SCRAPER_EMAIL, SPEED_SCRAPER_PASSWORD
```

---

*Integration audit: 2026-01-23*
