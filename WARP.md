# WARP.md

Development rules and guidelines for the ONE Reference Architecture project.

## Project Overview

Cross-platform application with shared Rust handlers between Tuono web and Tauri desktop platforms. Features OpenAI-compatible AI integration, secure MCP tool calling, and RAG capabilities.

## Package Management

**MANDATORY**: Use `pnpm` exclusively
- Install: `pnpm install`
- Add deps: `pnpm add <package>`
- Dev deps: `pnpm add -D <package>`
- Scripts: `pnpm run <script>`

**NEVER**: Use `npm` or `yarn`

## Development Commands

```bash
# Web development
pnpm dev              # Start Tuono web server (port 3000)
pnpm build            # Build web application

# Desktop development  
pnpm dev:tauri        # Start Tauri desktop development
pnpm build:tauri      # Build desktop application

# Code quality checks
pnpm run lint         # ESLint for TypeScript
pnpm run typecheck    # TypeScript compiler check
pnpm run rust:check   # Cargo check for Rust code
pnpm run test         # Run test suite
```

## Coding Standards

### TypeScript - Absolute Rules

**FORBIDDEN**:
- `any` type (implicit or explicit)
- `any[]` arrays
- `@ts-ignore` or `@ts-nocheck`
- Direct store access in components

**REQUIRED**:
- Strict type checking enabled
- Explicit return types for all functions
- Hook-based store access only
- Proper interface definitions

```typescript
// ❌ FORBIDDEN
const user = userStore.getUser();
const data: any = response.data;

// ✅ REQUIRED
const { user } = useUser();
interface User { id: string; name: string; }
const { user }: { user: User } = useUser();
```

### Rust Standards

**FORBIDDEN**:
- `.unwrap()` or `.expect()` in production handlers
- `unsafe` blocks without justification
- Panic-prone error handling

**REQUIRED**:
- `Result<T, E>` with custom error types using `thiserror`
- Axum-compatible handler return types
- Structured logging with context
- Proper async/await patterns

```rust
// ✅ REQUIRED Pattern
#[derive(thiserror::Error, Debug)]
pub enum ApiError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    #[error("Not found: {resource}")]
    NotFound { resource: String },
}

pub async fn get_user(id: &str) -> Result<User, ApiError> {
    let user = database::fetch_user(id).await?;
    user.ok_or_else(|| ApiError::NotFound { 
        resource: "user".to_string() 
    })
}
```

## Architecture Rules

### Shared Handler Pattern

**MANDATORY**: All business logic in `rust-lib/` shared library

```
Tuono Web (HTTP) ──┐
                   ├─→ Shared Rust Handlers
Tauri Desktop (IPC)─┘
```

Both platforms call identical handler functions:

```rust
// ✅ Shared handler
pub async fn api_data_handler() -> Result<AxumJson<Value>, StatusCode> {
    // Business logic here
}

// ✅ Tuono usage
Router::new().route("/api/data", get(shared_handlers::api_data_handler))

// ✅ Tauri usage  
#[tauri::command]
async fn get_api_data() -> Result<serde_json::Value, String> {
    match shared_handlers::api_data_handler().await {
        Ok(response) => Ok(response.0),
        Err(_) => Err("Failed to get API data".to_string())
    }
}
```

### Component Consistency

**MANDATORY**: Identical React components for both platforms
- Same routing structure (React Router 7)
- Same component files in `src/routes/`
- Same layout patterns with `RootClientLayout`

### State Management Rules

**FORBIDDEN**: Direct store access in components
**REQUIRED**: Hook-based access only

```typescript
// ❌ FORBIDDEN
function BadComponent() {
  const user = userStore.getUser();
  return <div>{user?.name}</div>;
}

// ✅ REQUIRED
function GoodComponent() {
  const { user } = useUser();
  return <div>{user?.name}</div>;
}
```

## IPC Development

### Command Naming
**REQUIRED**: Descriptive, action-based names
- ✅ `get_user_profile`, `update_settings`, `search_documents`  
- ❌ `handle_data`, `do_stuff`, `process`

### Error Handling Pattern
```rust
#[derive(serde::Serialize)]
struct IpcError {
    code: String,
    message: String,
    details: Option<serde_json::Value>,
}

#[tauri::command]
async fn safe_operation(input: String) -> Result<ResponseData, IpcError> {
    // 1. Validate input
    if input.trim().is_empty() {
        return Err(IpcError {
            code: "INVALID_INPUT".to_string(),
            message: "Input cannot be empty".to_string(),
            details: None,
        });
    }
    
    // 2. Call shared handler
    match shared_handlers::process_operation(&input).await {
        Ok(data) => Ok(data),
        Err(e) => Err(IpcError {
            code: "OPERATION_FAILED".to_string(),
            message: "Failed to process operation".to_string(),
            details: Some(serde_json::json!({ "error": e.to_string() })),
        })
    }
}
```

## AI/MCP/RAG Integration

### OpenAI Compatibility
**MANDATORY**: All AI handlers OpenAI-compatible
- Endpoint: `/v1/chat/completions`
- Support tool calling with `tool_calls` in messages
- Proper `ChatCompletionResponse` structure

### MCP Security
**MANDATORY**: All MCP servers in microsandbox isolation
- Input validation and sanitization
- Resource limits and timeouts (30s max)
- Security policies based on trust levels

```rust
// ✅ REQUIRED Pattern
impl SecureMcpRegistry {
    pub async fn execute_tool_call(&self, tool_call: &ToolCall) -> Result<String, McpError> {
        // 1. Validate tool access
        self.validate_tool_access(&tool_call.function.name)?;
        
        // 2. Sanitize arguments  
        let args = self.sanitize_tool_arguments(&tool_call.function.arguments)?;
        
        // 3. Execute in sandbox with timeout
        tokio::time::timeout(
            Duration::from_secs(30),
            self.execute_in_sandbox(tool_call, args)
        ).await?
    }
}
```

### RAG Integration
**REQUIRED**: PGLite for client-side document storage
- Context injection via system messages
- Vector search with relevance scoring
- Token limits and context management

## Pre-commit Checklist

**MANDATORY**: All must pass before commit
```bash
pnpm run lint          # ✅ ESLint clean
pnpm run typecheck     # ✅ TypeScript errors resolved  
pnpm run rust:check    # ✅ Cargo check passes
pnpm run test          # ✅ Tests passing
```

## File Structure

```
├── rust-lib/src/          # Shared Rust handlers (ALL business logic)
│   ├── ai.rs             # OpenAI-compatible AI handlers
│   ├── mcp.rs            # Secure MCP registry & tool execution
│   ├── rag.rs            # RAG service with PGLite  
│   └── lib.rs            # Common exports
├── src/routes/           # React components (shared by both platforms)
├── src/tauri-main.tsx    # Tauri React Router entry
├── src-tauri/src/        # IPC wrappers + AI proxy
└── .roo/rules/           # Development rules
```

### Naming Conventions
- Components: `PascalCase.tsx`
- Hooks: `camelCase.ts` (start with `use`)
- Types: `camelCase.ts` or `types.ts`
- Constants: `UPPER_SNAKE_CASE.ts`

## Security Requirements

### Input Validation
- Validate all API boundary inputs
- JSON schema validation for MCP tools
- Sanitize external tool outputs

### MCP Execution
- Microsandbox VMs with resource limits
- Trust-level security policies
- Mandatory timeouts on all tool calls

## Quick Reference

### Common Patterns

**Shared Handler**:
```rust
pub async fn handler_name() -> Result<AxumJson<ResponseType>, StatusCode> {
    log::info!("Handler called");
    // Business logic
    Ok(AxumJson(response_data))
}
```

**Hook Pattern**:
```typescript
export function useFeature() {
  const [state, setState] = useState();
  // Logic here
  return { state, actions };
}
```

**IPC Command**:
```rust
#[tauri::command]  
async fn command_name(input: InputType) -> Result<OutputType, String> {
    shared_handlers::handler_name(input).await
        .map_err(|e| e.to_string())
}
```

This architecture ensures complete consistency between web and desktop platforms while maintaining security, type safety, and performance standards.