// Simple SPA server using Axum directly (no Tuono SSR)
use axum::{
    routing::get,
    Router,
    http::StatusCode,
    response::{Html, IntoResponse},
    extract::Request,
    body::Body,
    serve,
};
use tokio::net::TcpListener;
use tokio::fs;
use std::path::Path;
use tower_http::services::ServeDir;

// API route imports  
#[path="routes/api/health_check.rs"]
mod api_health_check;

#[tokio::main]
async fn main() {
    println!("🚀 SPA Server starting...");

    let router = Router::new()
        // API routes
        .route("/api/health_check", get(api_health_check::get_tuono_internal_api))
        // Serve static assets from dist directory
        .nest_service("/assets", ServeDir::new("dist/assets"))
        .nest_service("/favicon.ico", ServeDir::new("dist/favicon.ico"))
        .nest_service("/icon.png", ServeDir::new("dist/icon.png"))
        .nest_service("/react.svg", ServeDir::new("dist/react.svg"))
        .nest_service("/rust.svg", ServeDir::new("dist/rust.svg"))
        // SPA fallback - serve index.html for all other routes
        .fallback(serve_spa);

    let listener = TcpListener::bind("0.0.0.0:31334").await.unwrap();
    println!("  Production SPA server at: http://0.0.0.0:31334");
    
    serve(listener, router).await.unwrap();
}

// Serve SPA - return index.html for all non-API routes (client-side routing)
async fn serve_spa(_req: Request<Body>) -> impl IntoResponse {
    match serve_file("dist/index.html").await {
        Ok(content) => Html(content),
        Err(_) => {
            Html("<h1>404 - SPA Not Found</h1>".to_string())
        }
    }
}

// Helper function to read file content
async fn serve_file(file_path: &str) -> Result<String, std::io::Error> {
    if Path::new(file_path).exists() {
        fs::read_to_string(file_path).await
    } else {
        Err(std::io::Error::new(
            std::io::ErrorKind::NotFound,
            "File not found"
        ))
    }
}
