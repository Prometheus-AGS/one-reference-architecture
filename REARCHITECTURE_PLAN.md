# React Server Components Rearchitecture Plan

## Current Architecture Problems

### 1. **Mixed Server/Client Logic in Pages**
- [`src/routes/dashboard/index.tsx`](src/routes/dashboard/index.tsx:1) has `'use client'` but should be server-rendered
- [`src/components/landing-content.tsx`](src/components/landing-content.tsx:8) uses client hooks (`useState`, `useEffect`) but no `'use client'` directive
- [`src/routes/__layout.tsx`](src/routes/__layout.tsx:14) imports client-only `ThemeProvider` directly

### 2. **Improper Component Boundaries**
- Navigation logic mixed into route components
- Theme provider in layout causing hydration mismatch
- Client-only components not properly isolated

### 3. **Hydration Mismatch Root Cause**
- Server renders static content, client renders dynamic content
- State management happening during SSR phase
- Conditional rendering based on client-side state

## Target Architecture

### Server Components (SSR-friendly)
- Route pages (`index.tsx`, `dashboard/index.tsx`, etc.)
- Static content components
- Data presentation components
- Layout shells

### Client Components (Interactive)
- Navigation systems
- Theme providers
- State management
- Interactive UI elements
- Database clients

## Rearchitecture Strategy

### Phase 1: Component Separation
1. Create server-only page shells
2. Extract client logic into dedicated client components
3. Use composition pattern to combine server/client components

### Phase 2: Layout Restructuring
1. Keep layout as server component
2. Move theme provider to client boundary
3. Create client-only navigation wrapper

### Phase 3: Data Flow Optimization
1. Pass server data as props to client components
2. Initialize client state from server props
3. Eliminate client-side data fetching where possible

## Implementation Plan

### New Component Structure
```
src/
├── routes/                    # Server Components (SSR)
│   ├── __layout.tsx          # Server layout shell
│   ├── index.tsx             # Server landing page
│   └── dashboard/
│       ├── index.tsx         # Server dashboard shell
│       ├── data/index.tsx    # Server data page
│       └── database/index.tsx # Server database shell
├── components/
│   ├── server/               # Server Components
│   │   ├── page-shells/      # Static page layouts
│   │   └── content/          # Static content components
│   └── client/               # Client Components ('use client')
│       ├── navigation/       # Navigation system
│       ├── theme/            # Theme provider
│       ├── interactive/      # Interactive components
│       └── database/         # Database client
└── lib/
    ├── server/               # Server-only utilities
    └── client/               # Client-only utilities
```

### Data Flow Pattern
```
Server Page → Server Data → Client Component → Client State
```

## Benefits of This Architecture

1. **Clean SSR**: Pages render consistently on server and client
2. **Optimal Performance**: Minimal client-side JavaScript
3. **Clear Boundaries**: Explicit separation of server/client concerns
4. **Maintainable**: Easy to reason about what runs where
5. **Scalable**: Can add new features without hydration issues