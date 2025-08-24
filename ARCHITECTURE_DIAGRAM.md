# React Server Components Architecture Diagram

## Current vs Target Architecture

### Current Architecture (Problematic)
```mermaid
graph TD
    A[Layout Server] --> B[ThemeProvider Client]
    B --> C[Main Content]
    C --> D[Dashboard Route Client]
    D --> E[ApplicationContainer Client]
    E --> F[Navigation Hooks Client]
    F --> G[Zustand Store Client]
    
    style A fill:#e1f5fe
    style B fill:#ffebee
    style C fill:#f3e5f5
    style D fill:#ffebee
    style E fill:#ffebee
    style F fill:#ffebee
    style G fill:#ffebee
    
    classDef server fill:#e1f5fe,stroke:#01579b
    classDef client fill:#ffebee,stroke:#c62828
    classDef mixed fill:#f3e5f5,stroke:#7b1fa2
```

### Target Architecture (Clean Separation)
```mermaid
graph TD
    A[Layout Server] --> B[Page Shell Server]
    B --> C[Static Content Server]
    B --> D[Client Boundary]
    D --> E[Interactive Wrapper Client]
    E --> F[Navigation Client]
    E --> G[Theme Provider Client]
    E --> H[Application Logic Client]
    F --> I[Zustand Store Client]
    
    style A fill:#e1f5fe
    style B fill:#e1f5fe
    style C fill:#e1f5fe
    style D fill:#fff3e0
    style E fill:#ffebee
    style F fill:#ffebee
    style G fill:#ffebee
    style H fill:#ffebee
    style I fill:#ffebee
    
    classDef server fill:#e1f5fe,stroke:#01579b
    classDef client fill:#ffebee,stroke:#c62828
    classDef boundary fill:#fff3e0,stroke:#ef6c00
```

## Component Responsibilities

### Server Components
- **Layout**: HTML structure, meta tags, scripts
- **Page Shells**: Static content, data fetching from Rust handlers
- **Content Components**: Static UI elements, data presentation

### Client Components  
- **Interactive Wrappers**: Components that need state/effects
- **Navigation System**: Routing, active states, user interactions
- **Theme Provider**: localStorage access, DOM manipulation
- **Database Clients**: WASM modules, real-time queries

## Data Flow Pattern
```mermaid
sequenceDiagram
    participant Server
    participant Client
    participant Browser
    
    Server->>Server: Fetch data from Rust handlers
    Server->>Server: Render page shell with static content
    Server->>Browser: Send HTML with server data
    Browser->>Client: Hydrate client components
    Client->>Client: Initialize state from server props
    Client->>Client: Handle user interactions