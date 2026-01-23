# Coding Conventions

**Analysis Date:** 2026-01-23

## Naming Patterns

**Files:**
- Components: PascalCase (`Button.tsx`, `ErrorBoundary.tsx`, `PermissionGuard.tsx`)
- Hooks: camelCase with `use` prefix (`useDebounce.ts`, `useModal.ts`, `useERPSidebar.ts`)
- Services: camelCase with `Service` suffix (`authService.ts`, `bookingService.ts`, `dashboardService.ts`)
- Tests: Same name as source with `.test.ts(x)` suffix (`Button.test.tsx`, `useModal.test.ts`)
- Types: camelCase or PascalCase for files (`auth.types.ts`, `error.types.ts`)

**Functions:**
- Regular functions: camelCase (`calculateDays`, `formatCurrency`, `validateEmail`)
- React components: PascalCase (`Button`, `ErrorBoundary`, `ScrollIndicator`)
- Hook functions: camelCase with `use` prefix (`useDebounce`, `useModal`, `useFocusTrap`)
- Event handlers: camelCase with `handle` prefix (`handleClick`, `handleSubmit`)
- Async service methods: camelCase verb-noun (`login`, `getMe`, `registerCompany`)

**Variables:**
- Local variables: camelCase (`validToken`, `searchTerm`, `debouncedValue`)
- Constants: SCREAMING_SNAKE_CASE for true constants (`API_URL`, `SEEDED_PASSWORD`)
- Booleans: camelCase with `is/has/can` prefix (`isOpen`, `isLoading`, `hasError`, `canAccessFinancialData`)
- State variables: camelCase (`modalState`, `authStore`, `backendAvailable`)

**Types/Interfaces:**
- Interfaces: PascalCase (`LoginCredentials`, `LoginResponse`, `UserResponse`)
- Type aliases: PascalCase (`AuthRequest`, `ValidationResponse`)
- Props interfaces: PascalCase with `Props` suffix (`ButtonProps` implied)
- Generic type parameters: Single uppercase letter (`T`, `K`) or descriptive PascalCase

**Database Fields (Prisma):**
- Model fields: camelCase in Prisma schema
- Use `@map("snake_case")` for PostgreSQL column mapping
- Example: `lockedByUserId` in code, `locked_by_user_id` in database

## Code Style

**Formatting:**
- No explicit Prettier config detected - uses ESLint defaults
- Indentation: 2 spaces (TypeScript standard)
- Semicolons: Required (TypeScript default)
- Quotes: Single quotes preferred in imports

**Linting:**
- Tool: ESLint with TypeScript plugin
- Config locations:
  - `web-erp-app/frontend/eslint.config.mjs`
  - `web-erp-app/backend/eslint.config.mjs`
  - `server-client-tests/.eslintrc.js`
  - `rent-a-car-mobile/security-config/.eslintrc.security.js`

**Key Rules Enforced:**

Frontend (`web-erp-app/frontend`):
```javascript
'react-hooks/exhaustive-deps': 'error'  // All hooks must have correct dependencies
'@typescript-eslint/no-explicit-any': 'warn'
'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
'no-console': ['warn', { allow: ['warn', 'error', 'group', 'groupEnd', 'table', 'time', 'timeEnd'] }]
```

Backend (`web-erp-app/backend`):
```javascript
'@typescript-eslint/no-explicit-any': 'error'  // Stricter than frontend
'no-console': 'error'  // Use logger instead
'security/detect-unsafe-regex': 'error'
'security/detect-eval-with-expression': 'error'
'no-eval': 'error'
```

Test Suite (`server-client-tests`):
```javascript
// Safety rule for database operations
'no-restricted-syntax': [
  'error',
  {
    selector: 'CallExpression[callee.property.name="deleteMany"][arguments.length=0]',
    message: 'CRITICAL: deleteMany({}) without WHERE filter will delete ALL data'
  }
]
```

**Custom ESLint Rules (Frontend):**
```javascript
// Ban direct storage access - use helpers
'no-restricted-globals': ['error', {
  name: 'localStorage',
  message: 'Use getStorageItem/setStorageItem from utils/storageHelpers'
}]

// Ban inline currency formatting
'no-restricted-syntax': ['error', {
  selector: 'CallExpression[callee.property.name="toLocaleString"]',
  message: 'Use formatAED() from utils/currencyHelpers'
}]
```

## Import Organization

**Order:**
1. React and React-related imports (`react`, `react-dom`)
2. External library imports (`@testing-library/react`, `axios`, `date-fns`)
3. Internal absolute imports using path aliases (`@/components/*`, `@/hooks/*`)
4. Relative imports (`./utils`, `../types`)
5. Type-only imports at the end

**Path Aliases (Frontend):**
```json
{
  "@/*": ["src/*"],
  "@components/*": ["src/components/*"],
  "@pages/*": ["src/pages/*"],
  "@stores/*": ["src/stores/*"],
  "@utils/*": ["src/utils/*"],
  "@hooks/*": ["src/hooks/*"],
  "@services/*": ["src/services/*"],
  "@types/*": ["src/types/*"]
}
```

**Path Aliases (Test Suite):**
```json
{
  "@/*": ["shared/*"]
}
```

## Error Handling

**Patterns:**
- Controllers: Try-catch with generic client messages, detailed server logging
- Services: Throw errors with specific messages for business logic failures
- Frontend: Error boundaries for component errors (`ErrorBoundary.tsx`, `ModuleErrorBoundary.tsx`)

**Backend Error Response Pattern:**
```typescript
try {
  const data = await service.getData();
  res.json({ success: true, data });
} catch (error) {
  console.error('[SECURITY] Dashboard error:', {
    userId: req.user?.id,
    companyId: req.query.companyId,
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
  res.status(500).json({
    success: false,
    message: 'Failed to fetch dashboard data'
    // NO details field - security requirement
  });
}
```

**Frontend Error Handling:**
- Use `ErrorBoundary` wrapper components
- Toast notifications for user feedback (`react-toastify`)
- Custom error hooks (`useAdminError.ts`, `useErrorHandler.ts`)

## Logging

**Framework:**
- Backend: Custom logger (console banned via ESLint)
- Frontend: `devLogger`, `errorLogger` from `@/utils/logger` (console discouraged)

**Patterns:**
- Prefix log messages with context: `[SECURITY]`, `[AUTH]`, `[DATABASE]`
- Include timestamp, userId, and relevant IDs in error logs
- Never log sensitive data (passwords, tokens, full error stacks to client)

## Comments

**When to Comment:**
- Security-critical code sections (see `SECURITY FIXES` comments)
- Complex business logic that isn't self-explanatory
- Workarounds or technical debt (TODO/FIXME)
- Public API documentation (JSDoc for exported functions)

**JSDoc/TSDoc:**
- Used for hooks with examples (`useDebounce.ts`)
- Used for test suites with test purpose documentation
- Service methods have brief descriptions

**Example (Hook Documentation):**
```typescript
/**
 * useDebounce Hook
 *
 * Returns a debounced value that updates after the specified delay.
 * Useful for search inputs, form validation, and other cases where you
 * want to delay processing until the user stops typing.
 *
 * @param value - The value to debounce
 * @param delay - The debounce delay in milliseconds (default: 300ms)
 * @returns The debounced value
 *
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 300);
 * ```
 */
```

**Test Documentation Pattern:**
```typescript
/**
 * Authentication & Authorization Security Test Suite
 *
 * CRITICAL TESTS FOR AUTH SECURITY
 *
 * BUSINESS IMPACT:
 * - Prevents unauthorized access to ERP system
 * - Blocks brute force login attacks
 *
 * ATTACK SCENARIOS BLOCKED:
 * - Login with stolen/forged JWT tokens
 * - Accessing endpoints without required permissions
 */
```

## Function Design

**Size:**
- Keep functions focused on single responsibility
- Extract complex logic into helper functions
- Service methods handle one business operation

**Parameters:**
- Use object destructuring for multiple parameters
- Provide default values where sensible (`delay: number = 300`)
- Type all parameters explicitly

**Return Values:**
- Consistent response shape for APIs: `{ success: boolean, data?: T, message?: string }`
- Hooks return object with state and handlers
- Services return typed responses

## Module Design

**Exports:**
- Named exports preferred for services and hooks
- Default export for React components
- Re-export through index files (barrel files)

**Barrel Files:**
- `hooks/index.ts` re-exports all hooks
- Component directories may have index files

**Service Pattern:**
```typescript
// Named export with object containing methods
export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => { ... },
  register: async (data: RegisterData): Promise<LoginResponse> => { ... },
  getMe: async (): Promise<UserResponse> => { ... }
};
```

**Hook Pattern:**
```typescript
// Named export function
export function useDebounce<T>(value: T, delay: number = 300): T { ... }
// Also default export for convenience
export default useDebounce;
```

## TypeScript Strictness

**Frontend (`web-erp-app/frontend/tsconfig.json`):**
```json
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noFallthroughCasesInSwitch": true
}
```

**Backend (`web-erp-app/backend/tsconfig.json`):**
```json
{
  "strict": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true,
  "experimentalDecorators": true,
  "emitDecoratorMetadata": true
}
```

**Mobile Apps (Expo-based):**
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true
  }
}
```

## React Patterns

**Component Structure:**
```typescript
// 1. Imports
import React from 'react';
import { useEffect, useState } from 'react';

// 2. Types/Interfaces
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  onClick?: () => void;
}

// 3. Component
const Button: React.FC<ButtonProps> = ({ variant = 'primary', disabled, onClick, children }) => {
  // Hooks first
  const [isLoading, setIsLoading] = useState(false);

  // Effects
  useEffect(() => { ... }, []);

  // Handlers
  const handleClick = () => { ... };

  // Render
  return <button>...</button>;
};

// 4. Export
export default Button;
```

**Hook Rules:**
- `react-hooks/exhaustive-deps` is enforced as ERROR
- All `useEffect`/`useCallback` must have correct dependencies
- Use `useCallback` for memoized handlers
- Use `useMemo` for expensive computations

---

*Convention analysis: 2026-01-23*
