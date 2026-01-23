# Testing Patterns

**Analysis Date:** 2026-01-23

## Test Framework Overview

This monorepo uses different test frameworks depending on the project:

| Project | Framework | Environment | Config File |
|---------|-----------|-------------|-------------|
| `web-erp-app/frontend` | Jest + RTL | jsdom | `jest.config.cjs` |
| `mrm-investments-homepage` | Vitest + RTL | jsdom | `vite.config.ts` |
| `server-client-tests` | Jest | node | `jest.config.js` |
| Mobile apps | Jest (via Expo) | node | Expo defaults |

## Test Framework Details

### Frontend Tests (web-erp-app/frontend)

**Runner:**
- Jest with ts-jest preset
- Config: `web-erp-app/frontend/jest.config.cjs`

**Assertion Library:**
- Jest matchers
- `@testing-library/jest-dom` for DOM matchers
- `jest-axe` for accessibility assertions

**Run Commands:**
```bash
cd web-erp-app/frontend
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage report
npm run test:ui             # UI component tests only
npm run test:security       # Security tests only
npm run test:a11y           # Accessibility tests only
npm run test:ci             # CI mode with coverage
```

### Homepage Tests (mrm-investments-homepage)

**Runner:**
- Vitest (configured in `vite.config.ts`)
- Globals mode enabled

**Run Commands:**
```bash
cd mrm-investments-homepage
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:ui             # Vitest UI
```

### Backend/Integration Tests (server-client-tests)

**Runner:**
- Jest with ts-jest preset
- Config: `server-client-tests/jest.config.js`
- Global setup: `jest.global-setup.ts`

**Run Commands:**
```bash
cd server-client-tests
npm test                              # All tests
npm run test:backend                  # Backend API tests
npm run test:mobile                   # Mobile app tests
npm run test:backend:security         # Security tests
npm run test:backend:penetration      # Penetration tests
npm run test:backend:pack-role        # Permission system tests
npm run test:coverage                 # With coverage
```

## Test File Organization

**Location Patterns:**
- Co-located: `src/hooks/useModal.test.ts` (beside implementation)
- Dedicated folders: `src/__tests__/navigation.test.tsx`
- Component tests: `src/components/ui/Button.test.tsx`
- Separate repo: `server-client-tests/` for integration/E2E tests

**Naming:**
- Unit tests: `{name}.test.ts(x)`
- Integration tests: `{name}.integration.test.ts`
- E2E tests: `{name}.e2e.test.ts`
- Security tests: `{name}.security.test.ts`
- Penetration tests: `{name}.pentest.ts`

**Directory Structure (web-erp-app/frontend):**
```
src/
├── __tests__/                        # Global test files
│   ├── setup.ts                      # Test setup/config
│   ├── test-infrastructure.test.tsx
│   └── components/
│       └── Card.test.tsx
├── components/
│   └── ui/
│       ├── Button.tsx
│       ├── Button.test.tsx           # Co-located
│       └── __snapshots__/
│           └── Button.test.tsx.snap
├── hooks/
│   └── __tests__/
│       └── useVehicleCalendar.test.ts
└── stores/
    └── __tests__/
        └── authStore.test.ts
```

**Directory Structure (server-client-tests):**
```
server-client-tests/
├── backend-tests/
│   ├── api/                          # API endpoint tests
│   ├── auth/                         # Authentication tests
│   ├── business-logic/               # Business rule tests
│   ├── e2e/                          # End-to-end flows
│   ├── integration/                  # Integration tests
│   ├── security/                     # Security tests
│   ├── unit/                         # Unit tests
│   └── setup.ts                      # Backend test setup
├── mobile-tests/
│   ├── business-logic/
│   ├── components/
│   ├── integration/
│   ├── routing/
│   └── security/
└── client-tests/
    └── security/
```

## Test Structure

### Component Test Pattern (Frontend)

```typescript
/**
 * Button Component Tests
 * Tests for the Button UI component including variants, sizes, states, and accessibility
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import Button from './Button';

expect.extend(toHaveNoViolations);

describe('Button Component', () => {
  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('should render primary variant', () => {
      render(<Button variant="primary">Primary</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-blue-600');
    });
  });

  describe('Interactions', () => {
    it('should handle click events', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      render(<Button onClick={handleClick}>Clickable</Button>);
      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<Button>Accessible Button</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Snapshot Tests', () => {
    it('should match snapshot for primary button', () => {
      const { container } = render(<Button variant="primary">Primary</Button>);
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
```

### Hook Test Pattern

```typescript
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useModal } from './useModal';

describe('useModal', () => {
  it('returns initial state with isOpen=false', () => {
    const { result } = renderHook(() => useModal());
    expect(result.current.isOpen).toBe(false);
    expect(typeof result.current.openModal).toBe('function');
  });

  it('sets isOpen to true when openModal is called', () => {
    const { result } = renderHook(() => useModal());
    act(() => {
      result.current.openModal();
    });
    expect(result.current.isOpen).toBe(true);
  });

  it('calls onOpen callback when modal opens', () => {
    const onOpen = vi.fn();
    const { result } = renderHook(() => useModal({ onOpen }));
    act(() => {
      result.current.openModal();
    });
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('memoizes openModal function', () => {
    const { result, rerender } = renderHook(() => useModal());
    const firstOpenModal = result.current.openModal;
    rerender();
    expect(firstOpenModal).toBe(result.current.openModal);
  });
});
```

### Security Test Pattern (Backend)

```typescript
/**
 * Authentication & Authorization Security Test Suite
 *
 * BUSINESS IMPACT:
 * - Prevents unauthorized access to ERP system
 * - Blocks brute force login attacks
 *
 * ATTACK SCENARIOS BLOCKED:
 * - Login with stolen/forged JWT tokens
 * - Accessing endpoints without required permissions
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import {
  generateTestJWT,
  generateExpiredJWT,
  isBackendAvailable,
  TEST_COMPANY_A,
  TEST_ADMIN_COMPANY_A
} from '../fixtures/test-data';

const prisma = new PrismaClient();
const API_URL = process.env.TEST_BACKEND_URL || 'http://localhost:3000';

describe('Authentication & Authorization Security Tests', () => {
  let validToken: string;
  let backendAvailable: boolean = false;

  beforeAll(async () => {
    backendAvailable = await isBackendAvailable(API_URL);
    if (!backendAvailable) {
      console.warn('Backend not available - tests will be SKIPPED');
      return;
    }
    validToken = generateTestJWT(TEST_ADMIN_COMPANY_A.id, TEST_COMPANY_A.id);
  }, 30000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('should reject invalid JWT token', async () => {
    if (!backendAvailable) return;
    const response = await request(API_URL)
      .get('/api/dashboard')
      .set('Authorization', 'Bearer invalid-token');
    expect(response.status).toBe(401);
  });
});
```

## Mocking

**Framework:** Jest mocks (`jest.fn()`, `jest.mock()`)

### Browser API Mocks (Frontend)

Location: `web-erp-app/frontend/src/__tests__/setup.ts`

```typescript
// matchMedia mock
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// localStorage mock with in-memory store
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// IntersectionObserver mock
class MockIntersectionObserver implements IntersectionObserver {
  disconnect(): void {}
  observe(): void {}
  unobserve(): void {}
}
global.IntersectionObserver = MockIntersectionObserver;
```

### React Native Mocks (Mobile Tests)

Location: `server-client-tests/mobile-tests/__mocks__/`

```javascript
// react-native.js
module.exports = {
  Platform: { OS: 'ios', select: jest.fn() },
  StyleSheet: { create: (styles) => styles },
  View: 'View',
  Text: 'Text',
  // ...
};

// expo-secure-store.js
module.exports = {
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
};
```

**What to Mock:**
- External APIs (use `supertest` for real API tests)
- Browser APIs not available in jsdom
- React Native modules in Jest environment
- Time-sensitive operations (`jest.useFakeTimers()`)
- File system operations

**What NOT to Mock:**
- Business logic being tested
- React components (test real behavior)
- Integration test targets

## Fixtures and Factories

### Test Data Location

- `server-client-tests/backend-tests/fixtures/test-data.ts` - Shared test fixtures
- `server-client-tests/shared/` - Common utilities

### Test Data Pattern

```typescript
// backend-tests/fixtures/test-data.ts
export const TEST_COMPANY_A = {
  id: 'company-a-uuid',
  code: 'COMPANY_A',
  name: 'Test Company A'
};

export const TEST_ADMIN_COMPANY_A = {
  id: 'admin-a-uuid',
  email: 'admin@companya.com',
  companyId: TEST_COMPANY_A.id
};

export const SEEDED_PASSWORD = 'TestPassword123!';

export function generateTestJWT(userId: string, companyId: string): string {
  // Generate valid JWT for testing
}

export function generateExpiredJWT(userId: string, companyId: string): string {
  // Generate expired JWT for testing
}

export async function isBackendAvailable(url: string): Promise<boolean> {
  // Check if backend is running
}
```

## Coverage

### Frontend Coverage Requirements

**Target:** 95% (enforced in CI)

Config: `web-erp-app/frontend/jest.config.cjs`
```javascript
coverageThreshold: {
  global: {
    branches: 95,
    functions: 95,
    lines: 95,
    statements: 95
  }
}
```

**Coverage Reports:**
```bash
npm run test:coverage
# Generates: text, lcov, html, json-summary
```

### Backend Test Suite Coverage

**Target:** 70%

Config: `server-client-tests/jest.config.js`
```javascript
coverageThreshold: {
  global: {
    branches: 70,
    functions: 70,
    lines: 70,
    statements: 70
  }
}
```

### View Coverage

```bash
# Frontend
cd web-erp-app/frontend
npm run test:coverage
open coverage/lcov-report/index.html

# Integration tests
cd server-client-tests
npm run test:coverage
open coverage/lcov-report/index.html
```

## Test Types

### Unit Tests

**Scope:** Individual functions, hooks, components in isolation
**Location:**
- Frontend: Co-located with source files
- Backend: `server-client-tests/backend-tests/unit/`

```bash
npm run test:backend:unit
```

### Integration Tests

**Scope:** Multiple components/services working together
**Location:** `server-client-tests/backend-tests/integration/`

Examples:
- `vehicle-crud-create.test.ts`
- `booking-flow-vehiclesetup.test.ts`
- `vehicle-multi-tenant-isolation.test.ts`

```bash
npm run test:backend:integration
```

### End-to-End Tests

**Scope:** Complete user flows
**Location:** `server-client-tests/backend-tests/e2e/`

Examples:
- `ford-escort-booking-flow.e2e.test.ts`
- `vehicle-setup-flow.test.ts`

```bash
npm run test:ford-escort
```

### Security Tests

**Scope:** Security vulnerabilities, penetration testing
**Location:** `server-client-tests/backend-tests/security/`

Examples:
- `auth-security.test.ts` - Authentication attacks
- `injection.security.test.ts` - SQL injection
- `multi-tenant-isolation.test.ts` - Cross-company data access
- `payment-security.test.ts` - Payment manipulation

```bash
npm run test:backend:security
npm run test:backend:penetration
```

### Pack-Role Tests

**Scope:** Permission system testing
**Location:** `server-client-tests/backend-tests/pack-role-management/`

```bash
npm run test:backend:pack-role
npm run test:backend:pack-role:unit
npm run test:backend:pack-role:integration
npm run test:backend:pack-role:e2e
```

## Common Testing Patterns

### Async Testing

```typescript
it('should handle async operations', async () => {
  const handleClick = jest.fn();
  const user = userEvent.setup();
  render(<Button onClick={handleClick}>Click</Button>);

  await user.click(screen.getByRole('button'));

  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### Error Testing

```typescript
it('should not trigger onClick when disabled', async () => {
  const handleClick = jest.fn();
  const user = userEvent.setup();
  render(<Button onClick={handleClick} disabled>Disabled</Button>);

  await user.click(screen.getByRole('button'));

  expect(handleClick).not.toHaveBeenCalled();
});
```

### API Request Testing

```typescript
import request from 'supertest';

test('should reject invalid JWT token', async () => {
  const response = await request(API_URL)
    .get('/api/dashboard')
    .set('Authorization', 'Bearer invalid-token');
  expect(response.status).toBe(401);
});
```

### Accessibility Testing

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

it('should have no accessibility violations', async () => {
  const { container } = render(<Button>Accessible</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Test Setup Files

### Frontend Setup (`web-erp-app/frontend/src/__tests__/setup.ts`)

- Extends Jest with `@testing-library/jest-dom` matchers
- Extends Jest with `jest-axe` accessibility matchers
- Mocks browser APIs (matchMedia, localStorage, IntersectionObserver)
- Clears mocks before each test
- Filters known React warnings

### Backend Test Setup (`server-client-tests/backend-tests/setup.ts`)

- Database connection setup
- Test fixture loading
- Cleanup utilities

### Mobile Test Setup (`server-client-tests/mobile-tests/setup.ts`)

- React Native module mocks
- Navigation mocks
- Async storage mocks

## CI/CD Integration

**Frontend CI:**
```bash
npm run test:ci   # --ci --coverage --maxWorkers=2
```

**Security Tests CI:**
```bash
npm run test:security:ci  # Full security suite
```

---

*Testing analysis: 2026-01-23*
