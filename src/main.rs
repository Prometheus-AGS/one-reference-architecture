// Custom server entry point with graceful shutdown handling
// This replaces the auto-generated .tuono/main.rs

use tuono_lib::{tokio, Mode, Server, axum::Router, tuono_internal_init_v8_platform};
use tuono_lib::axum::routing::get;
use tokio::signal;
use std::sync::Arc;
use tokio::sync::Notify;

const MODE: Mode = Mode::Dev;

// MODULE_IMPORTS - Only keep API routes, remove page routes for client-only mode
#[path="routes/api/health_check.rs"]
mod api_health_check;

#[tokio::main]
async fn main() {
    tuono_internal_init_v8_platform();
    
    if MODE == Mode::Prod {
        println!("\n  ⚡ Tuono v0.19.7");
    }

    // Create a shutdown signal notifier
    let shutdown = Arc::new(Notify::new());
    let shutdown_clone = shutdown.clone();

    // Spawn a task to listen for shutdown signals
    tokio::spawn(async move {
        match signal::ctrl_c().await {
            Ok(()) => {
                println!("\n🛑 Received Ctrl+C, initiating graceful shutdown...");
                shutdown_clone.notify_waiters();
            }
            Err(err) => {
                eprintln!("Unable to listen for shutdown signal: {}", err);
            }
        }
    });

    let router = Router::new()
        // ROUTE_BUILDER - Only API routes, no page routes for client-only mode
        .route("/api/health_check", get(api_health_check::get_tuono_internal_api));

    println!("🚀 Server starting... Press Ctrl+C for graceful shutdown");
    
    // Initialize and start the server
    let server = Server::init(router, MODE).await;
    
    // Start the server with graceful shutdown handling
    tokio::select! {
        _ = server.start() => {
            println!("Server has stopped");
        }
        _ = shutdown.notified() => {
            println!("🔄 Shutting down server gracefully...");
            // Perform any cleanup operations here
            println!("✅ Server shutdown complete");
        }
    }
}
