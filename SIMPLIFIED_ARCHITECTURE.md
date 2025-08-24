# Simplified React Server Components Architecture

## Architecture Philosophy: Server Shells + Client Apps

### Core Principle
- **Server Components**: Only route `index.tsx` files (minimal data-fetching shells)
- **Client Components**: Everything else (all components, logic, interactivity)

## Target Architecture

```mermaid
graph TD
    A[Layout Server] --> B[Route index.tsx Server]
    B --> C[Server Data Fetching]
    C --> D[Client Component Boundary]
    D --> E[Page Client Component]
    E --> F[All UI Components Client]
    E --> G[Navigation Client]
    E --> H[Theme Provider Client]
    E --> I[State Management Client]
    
    style A fill:#e1f5fe,stroke:#01579b
    style B fill:#e1f5fe,stroke:#01579b
    style C fill:#e1f5fe,stroke:#01579b
    style D fill:#fff3e0,stroke:#ef6c00
    style E fill:#ffebee,stroke:#c62828
    style F fill:#ffebee,stroke:#c62828
    style G fill:#ffebee,stroke:#c62828
    style H fill:#ffebee,stroke:#c62828
    style I fill:#ffebee,stroke:#c62828
```

## File Structure Pattern

### Server Components (SSR)
```
src/routes/
├── index.tsx                 # Server: Landing page shell
├── dashboard/
│   ├── index.tsx            # Server: Dashboard shell
│   ├── data/index.tsx       # Server: Data page shell
│   └── database/index.tsx   # Server: Database shell
└── __layout.tsx             # Server: HTML layout
```

### Client Components (Interactive)
```
src/components/
├── landing-content.tsx       # Client: Landing page app
├── application-container.tsx # Client: Dashboard app
├── theme-provider.tsx       # Client: Theme management
├── database-client.tsx      # Client: Database interface
└── ui/                      # Client: All UI components
```

## Data Flow Pattern

```mermaid
sequenceDiagram
    participant Browser
    participant ServerRoute
    participant RustHandler
    participant ClientComponent
    
    Browser->>ServerRoute: Request page
    ServerRoute->>RustHandler: Fetch data
    RustHandler->>ServerRoute: Return data
    ServerRoute->>ClientComponent: Pass data as props
    ClientComponent->>ClientComponent: Initialize client state
    ClientComponent->>Browser: Render interactive UI
```

## Benefits

1. **Clean SSR**: Server routes are minimal and predictable
2. **No Hydration Issues**: Clear server/client boundary
3. **Optimal Performance**: Server handles data, client handles interactivity
4. **Simple Mental Model**: Easy to understand what runs where
5. **Maintainable**: All complex logic is client-side where it belongs

## Implementation Strategy

1. Keep route `index.tsx` files as minimal server shells
2. Move all complex logic to client components
3. Pass server data as props to client components
4. Let client components handle all state and interactivity