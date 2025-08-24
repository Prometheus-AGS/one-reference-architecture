# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a cross-platform ONE reference architecture using shared Rust handlers between Tuono web and Tauri desktop applications. The project demonstrates unified business logic, OpenAI-compatible AI integration, MCP tool calling, and RAG capabilities.

## Development Commands

### Essential Commands
- `pnpm dev` - Start Tuono web development server (port 3000)
- `pnpm build` - Build the web application for production
- `pnpm start` - Run production build (requires `cargo run --release`)
- `pnpm dev:tauri` - Start Tauri desktop development
- `pnpm build:tauri` - Build Tauri desktop application

### Package Management Rules
- **MANDATORY**: Use `pnpm` exclusively - NEVER use `npm` or `yarn`
- Install dependencies: `pnpm install`
- Add dependencies: `pnpm add <package>`
- Add dev dependencies: `pnpm add -D <package>`

## Architecture Pattern

### Shared Rust Handlers Architecture
**MANDATORY**: All business logic implemented in shared Rust library (`rust-lib/`) consumed by both platforms:

```
┌─────────────────┐  ┌─────────────────┐
│   Tuono Web     │  │  Tauri Desktop  │
│   (Axum HTTP)   │  │   (IPC Calls)   │
└─────────────────┘  └─────────────────┘
         │                      │
         ▼                      ▼
┌─────────────────────────────────────────┐
│        Shared Rust Handlers            │
│     (rust-lib/src/{ai,api,mcp,rag})    │
└─────────────────────────────────────────┘
```

### Cross-Platform Component Consistency
**MANDATORY**: Identical React components for both web and desktop:
- **Web**: Uses Tuono routing with Axum handlers
- **Desktop**: Uses React Router 7 with IPC wrapper around same handlers
- **No Duplication**: Single set of components, routes, and business logic

### Key Architectural Files
- `rust-lib/src/` - Shared Rust handlers (ai.rs, mcp.rs, rag.rs, lib.rs)
- `src/routes/` - React route components (shared by both platforms)
- `src/tauri-main.tsx` - Tauri-specific React Router entry point
- `src-tauri/src/lib.rs` - IPC commands wrapping shared handlers
- `src-tauri/src/ai_proxy.rs` - AI streaming HTTP proxy for desktop

### Data Flow Pattern
```
React Components → Platform API (HTTP/IPC) → Shared Rust Handlers → Response
```

## Coding Standards

### TypeScript Rules
- **FORBIDDEN**: `any` type (implicit or explicit) - NEVER use `any[]`, `@ts-ignore`, etc.
- **MANDATORY**: Components NEVER access stores directly - use hooks only
- **REQUIRED**: Strict type checking, explicit return types for all functions

```typescript
// ❌ FORBIDDEN
const user = userStore.getUser();
const data: any = response.data;

// ✅ REQUIRED  
const { user } = useUser();
interface ResponseData { items: Item[]; }
const data: ResponseData = response.data;
```

### Rust Standards
- **FORBIDDEN**: `.unwrap()` or `.expect()` in production handlers
- **REQUIRED**: Proper `Result<T, E>` handling with custom error types using `thiserror`
- **REQUIRED**: All handlers return Axum-compatible types

```rust
// ✅ REQUIRED pattern
#[derive(thiserror::Error, Debug)]
pub enum ApiError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
}

pub async fn get_user(id: &str) -> Result<User, ApiError> {
    let user = database::fetch_user(id).await?;
    user.ok_or_else(|| ApiError::NotFound)
}
```

### IPC Development Rules
- **REQUIRED**: Descriptive command names (`get_user_profile`, not `handle_data`)
- **REQUIRED**: Consistent error handling with structured error types
- **PATTERN**: Validate input → Call shared handler → Map errors

## Technology Stack

### Frontend
- **Tuono**: React meta-framework with SSR (web platform)
- **Tauri**: Desktop app framework (desktop platform)
- **React Router 7**: Client-side routing (replaces Tuono router)
- **React 19**: Latest React with server components
- **TypeScript**: Type-safe JavaScript with strict rules
- **Tailwind CSS**: Utility-first styling
- **Shadcn/UI**: Component library with Radix UI primitives
- **Zustand**: State management (accessed via hooks only)
- **PGLite**: Client-side PostgreSQL database for RAG

### Backend (Shared Rust Handlers)
- **Axum**: HTTP framework for shared handlers
- **Serde**: JSON serialization
- **Tokio**: Async runtime
- **Thiserror**: Error handling
- **Chrono**: Date/time handling
- **Microsandbox**: Secure MCP server execution

## AI/MCP/RAG Integration

### OpenAI Compatibility
- **MANDATORY**: All AI handlers must be OpenAI-compatible for assistant-ui/ag-ui
- **REQUIRED**: Support tool calling with `tool_calls` in messages
- **ENDPOINT**: `/v1/chat/completions` with proper `ChatCompletionResponse` structure

### MCP Security Requirements
- **MANDATORY**: All MCP servers run in microsandbox isolation
- **REQUIRED**: Input validation and sanitization for all tool arguments
- **REQUIRED**: Resource limits and timeouts on tool execution
- **PATTERN**: Use `SecureMcpRegistry` for all tool execution

### RAG Integration Rules
- **REQUIRED**: PGLite for client-side document storage and vector search
- **REQUIRED**: Context injection via system messages before AI calls
- **PATTERN**: `enhance_messages_with_context()` before processing requests

## Pre-commit Requirements
**MANDATORY**: All checks must pass before any commit:
```bash
pnpm run lint          # ESLint for TypeScript
pnpm run typecheck     # TypeScript compiler check
pnpm run rust:check    # Cargo check for Rust code
pnpm run test          # Run test suite
```

## File Structure Rules

### Directory Organization
```
├── rust-lib/src/          # Shared Rust handlers (MANDATORY for business logic)
│   ├── ai.rs             # OpenAI-compatible AI handlers
│   ├── mcp.rs            # MCP registry and secure tool execution  
│   ├── rag.rs            # RAG service with PGLite integration
│   └── lib.rs            # Main exports and common handlers
├── src/routes/           # React components (shared by both platforms)
├── src/tauri-main.tsx    # Tauri React Router entry point
├── src-tauri/src/        # Tauri-specific IPC wrappers and AI proxy
└── .roo/rules/           # Development rules and standards
```

### Naming Conventions
- **Components**: `PascalCase.tsx` (e.g., `UserProfile.tsx`)
- **Hooks**: `camelCase.ts` starting with `use` (e.g., `useUser.ts`)
- **Types**: `camelCase.ts` or `types.ts` (e.g., `userTypes.ts`)
- **Constants**: `UPPER_SNAKE_CASE.ts` (e.g., `API_ENDPOINTS.ts`)

## Security Requirements

### Input Validation
- **REQUIRED**: Validate all inputs at API boundaries using proper schemas
- **REQUIRED**: Use JSON schema validation for MCP tool arguments
- **REQUIRED**: Sanitize outputs from external MCP tools

### MCP Tool Execution Security
- **MANDATORY**: Execute all MCP tools in microsandbox VMs with resource limits
- **REQUIRED**: Apply security policies based on tool trust levels
- **REQUIRED**: Timeout all tool calls (default: 30 seconds max)

## Known Architecture Details

- **Hybrid AI Streaming**: IPC for regular operations, HTTP proxy for AI streaming
- **Component Consistency**: Same React components used by both web and desktop
- **Shared State**: Zustand stores accessed only through custom hooks
- **Cross-Platform Build**: Unified development experience, platform-specific production builds

This project follows a strict shared handler architecture pattern where all business logic lives in Rust and is consumed by both platforms through different transport mechanisms, ensuring complete consistency while maintaining platform-specific optimizations.