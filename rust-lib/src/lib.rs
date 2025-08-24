use axum::{response::Json as AxumJson, http::StatusCode};
use serde_json::{json, Value};

pub mod api;
pub mod ai;
pub mod mcp;
pub mod rag;

// Re-export common types
pub use axum;
pub use serde_json;

// Shared business logic that both Tuono and Tauri can use
pub struct SharedHandlers;

impl SharedHandlers {
    pub fn new() -> Self {
        Self
    }
}

// API handlers that return Axum-compatible responses
pub async fn health_check_handler() -> Result<StatusCode, StatusCode> {
    log::info!("🩺 Health check requested");
    Ok(StatusCode::OK)
}

pub async fn api_data_handler() -> Result<AxumJson<Value>, StatusCode> {
    log::info!("📊 API data requested");
    
    let data = json!({
        "title": "Welcome to Rust Architecture Base!",
        "message": "This is powered by shared Rust handlers!",
        "version": "0.0.1",
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "source": "Shared Rust Library",
        "architecture": {
            "shared_handlers": true,
            "axum_compatible": true,
            "platforms": ["Tuono Web", "Tauri Desktop"]
        }
    });
    
    Ok(AxumJson(data))
}

// Dashboard data handler
pub async fn dashboard_data_handler() -> Result<AxumJson<Value>, StatusCode> {
    log::info!("📊 Dashboard data requested");
    
    let data = json!({
        "message": "Dashboard loaded successfully",
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "source": "Shared Rust handlers",
        "architecture": {
            "components": ["React", "TypeScript", "Tailwind CSS", "Zustand", "Lucide Icons"],
            "features": ["Shared Rust logic", "Axum handlers", "Cross-platform", "Unified codebase"],
            "status": "Shared handlers active"
        }
    });
    
    Ok(AxumJson(data))
}

// Database data handler
pub async fn database_data_handler() -> Result<AxumJson<Value>, StatusCode> {
    log::info!("🗄️ Database data requested");
    
    let data = json!({
        "title": "PGLite Database Demo",
        "description": "Client-side PostgreSQL database with WASM",
        "features": [
            "Client-side PostgreSQL database",
            "WASM-based execution", 
            "Real-time queries",
            "IndexedDB persistence",
            "Vector search capabilities"
        ],
        "examples": {
            "users": [
                { "id": 1, "name": "John Doe", "email": "john@example.com", "role": "admin" },
                { "id": 2, "name": "Jane Smith", "email": "jane@example.com", "role": "user" }
            ],
            "products": [
                { "id": 1, "name": "Widget A", "price": 29.99, "category": "Tools" },
                { "id": 2, "name": "Widget B", "price": 49.99, "category": "Gadgets" }
            ]
        },
        "database_info": {
            "engine": "PGLite",
            "version": "0.3.7",
            "size": "Client-side",
            "persistence": "IndexedDB"
        },
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "source": "Shared Rust handlers"
    });
    
    Ok(AxumJson(data))
}

// Data access handler
pub async fn data_access_handler() -> Result<AxumJson<Value>, StatusCode> {
    log::info!("💾 Data access requested");
    
    let data = json!({
        "message": "Data access demo (shared handlers)",
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "source": "Shared Rust handlers",
        "capabilities": {
            "file_system": {
                "status": "success",
                "project_name": "one-reference-app",
                "version": "0.0.1",
                "description": "ONE Reference App"
            },
            "system": {
                "os": "Cross-platform",
                "arch": "Universal", 
                "family": "Shared Rust",
                "current_dir": "/shared-handlers"
            },
            "environment": {
                "rust_env": "shared-library",
                "platforms": ["web", "desktop"],
                "handlers": "unified"
            }
        }
    });
    
    Ok(AxumJson(data))
}