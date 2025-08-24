+++
id = "architecture-patterns"
title = "Architecture Patterns and Cross-Platform Standards"
scope = "project"
target_audience = ["developers", "ai-assistants", "architects"]
status = "active"
priority = "critical"
tags = ["architecture", "cross-platform", "shared-handlers", "ipc", "axum"]
version = "1.0.0"
created_date = "2025-01-24"
+++

# Architecture Patterns and Cross-Platform Standards

## Core Architecture Principles

### Shared Rust Handlers Pattern
All business logic MUST be implemented in the shared Rust library (`rust-lib/`) and consumed by both platforms:

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

### Platform Integration Rules

#### Tuono Web Platform
```rust
// ✅ Direct Axum handler usage
use axum::{routing::get, Router};
use shared_handlers::{health_check_handler, api_data_handler};

pub fn create_api_routes() -> Router {
    Router::new()
        .route("/health", get(health_check_handler))
        .route("/api/data", get(api_data_handler))
        .route("/v1/chat/completions", post(shared_handlers::ai::chat_completions_handler))
}
```

#### Tauri Desktop Platform
```rust
// ✅ IPC wrapper calling shared handlers
#[tauri::command]
async fn get_api_data() -> Result<serde_json::Value, String> {
    match shared_handlers::api_data_handler().await {
        Ok(response) => Ok(response.0), // Extract from AxumJson wrapper
        Err(_) => Err("Failed to get API data".to_string())
    }
}
```

## Component Architecture Rules

### React Component Consistency
Both platforms MUST use identical React components and routing:

```typescript
// ✅ MANDATORY - Same components for both platforms
// src/routes/index.tsx - Used by both Tuono and Tauri
export default function IndexPage() {
  return (
    <RootClientLayout>
      <OneLandingPas3Preview />
    </RootClientLayout>
  )
}

// ✅ Tauri entry point uses same route components
// src/tauri-main.tsx
import IndexPage from './routes/index'
import DashboardPage from './routes/dashboard/index'

function TauriApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </BrowserRouter>
  )
}
```

### Layout Architecture
```typescript
// ✅ Each page includes full layout - no layout nesting differences
export default function DashboardPage() {
  return (
    <RootClientLayout> {/* Always include complete layout */}
      <div className="dashboard-content">
        {/* Page-specific content */}
      </div>
    </RootClientLayout>
  )
}
```

## State Management Architecture

### Hook-Based Store Access Pattern
```typescript
// ✅ MANDATORY - All state access through hooks
// stores/userStore.ts - Internal store implementation
class UserStore {
  private user: User | null = null;
  private listeners = new Set<() => void>();
  
  getUser(): User | null { return this.user; }
  setUser(user: User | null): void { /* implementation */ }
  subscribe(listener: () => void): () => void { /* implementation */ }
}

// hooks/useUser.ts - Public interface
export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    return userStore.subscribe(() => {
      setUser(userStore.getUser());
    });
  }, []);
  
  const updateUser = useCallback(async (updates: Partial<User>) => {
    setLoading(true);
    try {
      await api.updateUser(updates);
      // Store will be updated via subscription
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { user, loading, updateUser };
}

// ❌ FORBIDDEN - Direct store access in components
function BadComponent() {
  const user = userStore.getUser(); // ❌ NO!
  return <div>{user?.name}</div>;
}

// ✅ CORRECT - Hook-based access
function GoodComponent() {
  const { user } = useUser(); // ✅ YES!
  return <div>{user?.name}</div>;
}
```

## API Integration Patterns

### Unified API Client
```typescript
// ✅ Platform-agnostic API client
interface ApiClient {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, data: unknown): Promise<T>;
}

// Platform-specific implementations
class TauriApiClient implements ApiClient {
  async get<T>(path: string): Promise<T> {
    return invoke('api_get', { path });
  }
  
  async post<T>(path: string, data: unknown): Promise<T> {
    return invoke('api_post', { path, data });
  }
}

class WebApiClient implements ApiClient {
  async get<T>(path: string): Promise<T> {
    const response = await fetch(path);
    return response.json();
  }
  
  async post<T>(path: string, data: unknown): Promise<T> {
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  }
}
```

## IPC Development Standards

### Command Naming Conventions
```rust
// ✅ Use descriptive, action-based names
#[tauri::command]
async fn get_user_profile(user_id: String) -> Result<UserProfile, String> { }

#[tauri::command]
async fn update_user_settings(settings: UserSettings) -> Result<(), String> { }

#[tauri::command]
async fn search_documents(query: String, filters: SearchFilters) -> Result<Vec<Document>, String> { }

// ❌ FORBIDDEN - Generic or unclear names
#[tauri::command]
async fn handle_data(data: String) -> Result<String, String> { } // ❌ Too generic

#[tauri::command]
async fn do_stuff() -> Result<(), String> { } // ❌ Meaningless
```

### IPC Error Handling
```rust
// ✅ Consistent error handling pattern
#[derive(serde::Serialize)]
struct IpcError {
    code: String,
    message: String,
    details: Option<serde_json::Value>,
}

#[tauri::command]
async fn safe_operation(input: String) -> Result<ResponseData, IpcError> {
    // Validate input
    if input.trim().is_empty() {
        return Err(IpcError {
            code: "INVALID_INPUT".to_string(),
            message: "Input cannot be empty".to_string(),
            details: None,
        });
    }
    
    // Call shared handler
    match shared_handlers::process_operation(&input).await {
        Ok(data) => Ok(data),
        Err(e) => {
            log::error!("Operation failed: {}", e);
            Err(IpcError {
                code: "OPERATION_FAILED".to_string(),
                message: "Failed to process operation".to_string(),
                details: Some(serde_json::json!({ "error": e.to_string() })),
            })
        }
    }
}
```

### IPC Performance Optimization
```rust
// ✅ Batch operations when possible
#[tauri::command]
async fn batch_update_users(updates: Vec<UserUpdate>) -> Result<Vec<String>, String> {
    shared_handlers::batch_update_users(updates).await
        .map_err(|e| format!("Batch update failed: {}", e))
}

// ✅ Use streaming for large datasets
#[tauri::command]
async fn stream_large_dataset(
    query: String,
    window: app_handle::Window
) -> Result<(), String> {
    let stream = shared_handlers::create_data_stream(&query).await?;
    
    while let Some(chunk) = stream.next().await {
        window.emit("data-chunk", &chunk)
            .map_err(|e| format!("Failed to emit chunk: {}", e))?;
    }
    
    window.emit("data-complete", ())
        .map_err(|e| format!("Failed to emit completion: {}", e))?;
        
    Ok(())
}
```

## Security Architecture

### Input Validation Standards
```rust
// ✅ Validate all inputs at API boundaries
use validator::{Validate, ValidationError};

#[derive(Deserialize, Validate)]
struct CreateUserRequest {
    #[validate(length(min = 1, max = 100))]
    name: String,
    
    #[validate(email)]
    email: String,
    
    #[validate(custom = "validate_role")]
    role: String,
}

fn validate_role(role: &str) -> Result<(), ValidationError> {
    match role {
        "admin" | "user" | "moderator" => Ok(()),
        _ => Err(ValidationError::new("invalid_role")),
    }
}

#[tauri::command]
async fn create_user(request: CreateUserRequest) -> Result<String, String> {
    // Validation happens automatically via serde + validator
    request.validate()
        .map_err(|e| format!("Validation failed: {}", e))?;
        
    shared_handlers::create_user(request).await
        .map_err(|e| format!("Failed to create user: {}", e))
}
```

### MCP Security Integration
```rust
// ✅ Secure MCP tool execution
impl SecureMcpRegistry {
    pub async fn execute_tool_securely(&self, tool_call: &ToolCall) -> Result<String, McpError> {
        // 1. Validate tool exists and is allowed
        self.validate_tool_access(&tool_call.function.name)?;
        
        // 2. Sanitize and validate arguments
        let sanitized_args = self.sanitize_tool_arguments(&tool_call.function.arguments)?;
        
        // 3. Execute in microsandbox with resource limits
        let result = self.execute_in_sandbox(tool_call, sanitized_args).await?;
        
        // 4. Validate and sanitize output
        self.sanitize_tool_output(result)
    }
}
```

## Build and Development Standards

### Development Commands
```json
// ✅ Consistent package.json scripts
{
  "scripts": {
    "dev:web": "tuono dev",
    "dev:desktop": "tauri dev",
    "build:web": "tuono build",
    "build:desktop": "tauri build",
    "lint": "eslint src/ --ext .ts,.tsx",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "rust:check": "cargo check --manifest-path rust-lib/Cargo.toml",
    "rust:test": "cargo test --manifest-path rust-lib/Cargo.toml"
  }
}
```

### Pre-commit Validation
```bash
# ✅ Always run before commits
pnpm run lint
pnpm run typecheck
pnpm run rust:check
pnpm run test
```

## Documentation Requirements

### Code Documentation
```typescript
// ✅ Document complex business logic
/**
 * Processes user authentication with MFA support
 * 
 * @param credentials - User login credentials
 * @param mfaToken - Optional MFA token for two-factor auth
 * @returns Promise resolving to authentication result with user data
 * @throws AuthenticationError when credentials are invalid
 * @throws MfaRequiredError when MFA token is required but not provided
 */
export async function authenticateUser(
  credentials: LoginCredentials,
  mfaToken?: string
): Promise<AuthResult> {
  // Implementation
}
```

### Architecture Decision Records
All significant architectural decisions must be documented in `docs/adr/` following ADR format:

```markdown
# ADR-001: Shared Rust Handlers Architecture

## Status
Accepted

## Context
Need to share business logic between Tuono web and Tauri desktop platforms...

## Decision
Implement shared Rust handlers library that both platforms consume...

## Consequences
- Positive: Consistent business logic, reduced duplication
- Negative: Additional complexity in build process
```