+++
id = "typescript-standards"
title = "TypeScript Development Standards"
scope = "project"
target_audience = ["developers", "ai-assistants"]
status = "active"
priority = "critical"
tags = ["typescript", "coding-standards", "type-safety"]
version = "1.0.0"
created_date = "2025-01-24"
+++

# TypeScript Development Standards

## Absolute Prohibitions

### 🚫 ANY Type is FORBIDDEN
- **NEVER** use `any` type (implicit or explicit)
- **NEVER** use `any[]` for arrays
- **NEVER** cast to `any` to bypass type checking
- **NEVER** use `@ts-ignore` or `@ts-nocheck`

```typescript
// ❌ FORBIDDEN
const data: any = response.data;
const items: any[] = [];
const result = (response as any).someProperty;

// ✅ CORRECT - Use proper types
interface ResponseData {
  items: Item[];
  total: number;
}
const data: ResponseData = response.data;
const items: Item[] = [];
const result = (response as ApiResponse).someProperty;
```

## Type Safety Requirements

### Use Strict Types Always
```typescript
// ✅ Define interfaces for all data structures
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'moderator'; // Use union types for enums
}

// ✅ Use generic constraints
interface ApiResponse<T> {
  data: T;
  status: 'success' | 'error';
  message?: string;
}

// ✅ Use discriminated unions for complex state
type LoadingState = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: User[] }
  | { status: 'error'; error: string };
```

### Function Signatures
```typescript
// ✅ Always type function parameters and return types
async function fetchUser(id: string): Promise<User | null> {
  // Implementation
}

// ✅ Use proper event handler types
const handleClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
  // Implementation
};
```

## State Management Rules

### Components MUST NOT Access Stores Directly
```typescript
// ❌ FORBIDDEN - Direct store access
import { userStore } from '../stores/userStore';

function UserProfile() {
  const user = userStore.getUser(); // ❌ NO!
  return <div>{user.name}</div>;
}

// ✅ CORRECT - Use hooks only
import { useUser } from '../hooks/useUser';

function UserProfile() {
  const { user, loading, error } = useUser(); // ✅ YES!
  return <div>{user?.name}</div>;
}
```

### Hook Patterns
```typescript
// ✅ All store interactions through hooks
export function useUser(): {
  user: User | null;
  loading: boolean;
  error: string | null;
  updateUser: (updates: Partial<User>) => Promise<void>;
  logout: () => void;
} {
  // Hook implementation that interacts with store
  const user = userStore.getUser();
  const loading = userStore.isLoading();
  // ... etc
  
  return { user, loading, error, updateUser, logout };
}
```

## Component Architecture

### Props Interface Requirements
```typescript
// ✅ Always define prop interfaces
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export function Button({ children, variant = 'primary', ...props }: ButtonProps) {
  // Implementation
}
```

### Event Handler Types
```typescript
// ✅ Use specific event types
type FormSubmitHandler = (event: React.FormEvent<HTMLFormElement>) => void;
type InputChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => void;
type ButtonClickHandler = (event: React.MouseEvent<HTMLButtonElement>) => void;
```

## API Integration

### Response Type Definitions
```typescript
// ✅ Define API response types
interface ApiUser {
  id: string;
  name: string;
  email: string;
  created_at: string; // Raw API format
}

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date; // Transformed format
}

// ✅ Transform functions with proper types
function transformUser(apiUser: ApiUser): User {
  return {
    id: apiUser.id,
    name: apiUser.name,
    email: apiUser.email,
    createdAt: new Date(apiUser.created_at),
  };
}
```

## Error Handling

### Typed Error Handling
```typescript
// ✅ Define error types
interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: ApiError };

async function fetchData<T>(url: string): Promise<Result<T>> {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: { 
        code: 'FETCH_ERROR', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }
    };
  }
}
```

## Import/Export Standards

### Use Explicit Imports
```typescript
// ✅ Named imports for better tree shaking
import { useState, useEffect, useCallback } from 'react';
import { Button, Input } from '../components/ui';

// ✅ Type-only imports when appropriate
import type { User, ApiResponse } from '../types';
```

## File Naming Conventions

- Components: `PascalCase.tsx` (e.g., `UserProfile.tsx`)
- Hooks: `camelCase.ts` starting with `use` (e.g., `useUser.ts`)
- Types: `camelCase.ts` or `types.ts` (e.g., `userTypes.ts`)
- Utils: `camelCase.ts` (e.g., `formatDate.ts`)
- Constants: `UPPER_SNAKE_CASE.ts` (e.g., `API_ENDPOINTS.ts`)

## Code Quality Requirements

- Enable strict mode in `tsconfig.json`
- Use ESLint with TypeScript rules
- Configure Prettier for consistent formatting
- All functions must have explicit return types
- Use readonly for immutable data structures
- Prefer `const assertions` over type assertions when possible