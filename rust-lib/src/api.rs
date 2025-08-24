// API-specific handlers and utilities
use axum::{response::Json as AxumJson, http::StatusCode};
use serde_json::{json, Value};

// Future: Add more sophisticated API handlers here
pub async fn api_index_handler() -> Result<AxumJson<Value>, StatusCode> {
    let data = json!({
        "api": "ONE Reference Architecture API",
        "version": "0.1.0",
        "status": "active",
        "endpoints": [
            "/api/health_check",
            "/api/data", 
            "/api/dashboard",
            "/api/database",
            "/api/data_access"
        ],
        "timestamp": chrono::Utc::now().to_rfc3339()
    });
    
    Ok(AxumJson(data))
}