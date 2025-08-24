+++
id = "rust-standards"
title = "Rust Development Standards"
scope = "project"
target_audience = ["developers", "ai-assistants"]
status = "active"
priority = "high"
tags = ["rust", "coding-standards", "safety", "performance"]
version = "1.0.0"
created_date = "2025-01-24"
+++

# Rust Development Standards

## Core Principles

### Memory Safety First
- **NEVER** use `unsafe` blocks without explicit justification and review
- Prefer owned types (`String`, `Vec<T>`) over borrowed ones when crossing API boundaries
- Use `Arc<T>` and `Mutex<T>` for shared state instead of raw pointers
- Always handle `Result<T, E>` and `Option<T>` explicitly - no `.unwrap()` in production code

### Error Handling Standards

```rust
// ✅ CORRECT - Proper error handling
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ApiError {
    #[error("Database connection failed: {0}")]
    DatabaseError(#[from] sqlx::Error),
    #[error("Validation failed: {field}")]
    ValidationError { field: String },
    #[error("Not found: {resource}")]
    NotFound { resource: String },
}

// ✅ Function signatures with proper error types
pub async fn get_user(id: &str) -> Result<User, ApiError> {
    let user = database::fetch_user(id)
        .await
        .map_err(ApiError::DatabaseError)?;
    
    user.ok_or_else(|| ApiError::NotFound { 
        resource: format!("User with id: {}", id) 
    })
}

// ❌ FORBIDDEN - Using unwrap() or expect() in handlers
pub async fn bad_handler(id: &str) -> User {
    get_user(id).await.unwrap() // ❌ Will panic!
}
```

## Axum Handler Patterns

### Shared Handler Architecture
```rust
// ✅ Handlers must return Axum-compatible types
use axum::{response::Json as AxumJson, http::StatusCode};

pub async fn health_check_handler() -> Result<StatusCode, StatusCode> {
    log::info!("🩺 Health check requested");
    Ok(StatusCode::OK)
}

pub async fn api_data_handler() -> Result<AxumJson<ApiResponse>, StatusCode> {
    log::info!("📊 API data requested");
    
    let data = ApiResponse {
        message: "Success".to_string(),
        timestamp: chrono::Utc::now(),
        data: get_api_data().await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?,
    };
    
    Ok(AxumJson(data))
}
```

### Request/Response Types
```rust
// ✅ Use serde for serialization with proper derives
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct CreateUserRequest {
    pub name: String,
    pub email: String,
    #[serde(default)]
    pub role: UserRole,
}

#[derive(Debug, Serialize)]
pub struct UserResponse {
    pub id: String,
    pub name: String,
    pub email: String,
    pub role: UserRole,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

// ✅ Use enums for controlled vocabularies
#[derive(Debug, Serialize, Deserialize, Default)]
#[serde(rename_all = "lowercase")]
pub enum UserRole {
    Admin,
    #[default]
    User,
    Moderator,
}
```

## IPC Development Best Practices

### Tauri Command Patterns
```rust
// ✅ CORRECT - Tauri commands with proper error handling
use tauri::command;

#[command]
pub async fn get_user_data(id: String) -> Result<UserResponse, String> {
    match shared_handlers::get_user(&id).await {
        Ok(user) => Ok(user.into()), // Convert to response type
        Err(e) => {
            log::error!("Failed to get user {}: {}", id, e);
            Err(format!("Failed to get user: {}", e))
        }
    }
}

#[command]
pub async fn save_user_data(user: CreateUserRequest) -> Result<String, String> {
    // Validate input
    if user.name.trim().is_empty() {
        return Err("Name cannot be empty".to_string());
    }
    
    match shared_handlers::create_user(user).await {
        Ok(user_id) => Ok(user_id),
        Err(e) => {
            log::error!("Failed to create user: {}", e);
            Err("Failed to create user".to_string()) // Don't leak internal errors
        }
    }
}
```

### IPC Response Consistency
```rust
// ✅ Consistent response wrapper for IPC
#[derive(Serialize)]
pub struct IpcResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

impl<T> IpcResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
            timestamp: chrono::Utc::now(),
        }
    }
    
    pub fn error(message: String) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(message),
            timestamp: chrono::Utc::now(),
        }
    }
}
```

## MCP Integration Standards

### Secure MCP Registry
```rust
// ✅ Safe tool execution with proper isolation
pub struct SecureMcpRegistry {
    servers: HashMap<String, McpServerInstance>,
    sandbox_runtime: microsandbox::Runtime,
}

impl SecureMcpRegistry {
    pub async fn execute_tool_safely(&self, tool_call: &ToolCall) -> Result<String, McpError> {
        let tool_name = &tool_call.function.name;
        
        let mcp_tool = self.tools.get(tool_name)
            .ok_or_else(|| McpError::ToolNotFound(tool_name.clone()))?;
            
        // Validate arguments before execution
        self.validate_tool_arguments(tool_call)?;
        
        // Execute in sandbox with timeout
        let result = tokio::time::timeout(
            Duration::from_secs(30),
            self.execute_in_sandbox(mcp_tool, tool_call)
        ).await
        .map_err(|_| McpError::ExecutionTimeout)?;
        
        result
    }
    
    fn validate_tool_arguments(&self, tool_call: &ToolCall) -> Result<(), McpError> {
        // JSON schema validation
        // Input sanitization
        // Size limits
        Ok(())
    }
}
```

## Async Programming Standards

### Proper Async Patterns
```rust
// ✅ Use structured concurrency
pub async fn fetch_user_with_posts(user_id: &str) -> Result<UserWithPosts, ApiError> {
    let (user_result, posts_result) = tokio::try_join!(
        fetch_user(user_id),
        fetch_user_posts(user_id)
    )?;
    
    Ok(UserWithPosts {
        user: user_result,
        posts: posts_result,
    })
}

// ✅ Proper resource cleanup
pub async fn process_with_cleanup<T>() -> Result<T, ProcessError> {
    let resource = acquire_resource().await?;
    
    let result = async {
        // Do work with resource
        process_data(&resource).await
    }.await;
    
    // Cleanup always happens
    cleanup_resource(resource).await?;
    
    result
}
```

## Logging and Observability

### Structured Logging
```rust
// ✅ Use structured logging with context
use log::{info, warn, error};

pub async fn handle_request(request: &Request) -> Result<Response, HandlerError> {
    let request_id = uuid::Uuid::new_v4();
    
    info!(
        request_id = %request_id,
        method = %request.method(),
        path = %request.uri().path(),
        "Processing request"
    );
    
    match process_request(request).await {
        Ok(response) => {
            info!(
                request_id = %request_id,
                status = %response.status(),
                "Request completed successfully"
            );
            Ok(response)
        }
        Err(e) => {
            error!(
                request_id = %request_id,
                error = %e,
                "Request failed"
            );
            Err(e)
        }
    }
}
```

## Performance Guidelines

### Efficient String Handling
```rust
// ✅ Prefer &str when possible, String when ownership needed
pub fn format_user_display(name: &str, email: &str) -> String {
    format!("{} <{}>", name, email)
}

// ✅ Use Cow for conditional ownership
use std::borrow::Cow;

pub fn normalize_path(path: &str) -> Cow<str> {
    if path.starts_with('/') {
        Cow::Borrowed(path)
    } else {
        Cow::Owned(format!("/{}", path))
    }
}
```

### Collection Efficiency
```rust
// ✅ Pre-allocate collections when size is known
pub fn process_items(items: &[Item]) -> Vec<ProcessedItem> {
    let mut results = Vec::with_capacity(items.len());
    
    for item in items {
        results.push(process_item(item));
    }
    
    results
}
```

## Code Organization

### Module Structure
```rust
// ✅ Clear module organization
pub mod handlers {
    pub mod api;
    pub mod ai;
    pub mod health;
}

pub mod services {
    pub mod user;
    pub mod auth;
    pub mod mcp;
}

pub mod types {
    pub mod requests;
    pub mod responses;
    pub mod errors;
}

// Re-export common items
pub use handlers::*;
pub use types::{ApiError, ApiResponse};
```

### Documentation Standards
```rust
/// Retrieves user information by ID with caching
/// 
/// # Arguments
/// 
/// * `user_id` - The unique identifier for the user
/// * `use_cache` - Whether to check cache before database lookup
/// 
/// # Returns
/// 
/// Returns `Ok(User)` if found, `Err(ApiError)` if not found or on error
/// 
/// # Examples
/// 
/// ```rust
/// let user = get_user("user123", true).await?;
/// println!("Found user: {}", user.name);
/// ```
pub async fn get_user(user_id: &str, use_cache: bool) -> Result<User, ApiError> {
    // Implementation
}
```

## Testing Standards

### Unit Test Patterns
```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_get_user_success() {
        let user = get_user("test_user", false).await;
        assert!(user.is_ok());
        
        let user = user.unwrap();
        assert_eq!(user.id, "test_user");
    }
    
    #[tokio::test]
    async fn test_get_user_not_found() {
        let result = get_user("nonexistent", false).await;
        assert!(matches!(result, Err(ApiError::NotFound { .. })));
    }
}
```