use std::time::Duration;
use axum::{Router, response::Response, http::StatusCode};
use tower::ServiceBuilder;
use tower_http::cors::CorsLayer;
use tokio::net::TcpListener;

pub struct AIProxyServer {
    port: u16,
    is_running: bool,
    server_handle: Option<tokio::task::JoinHandle<()>>,
}

impl AIProxyServer {
    pub fn new() -> Self {
        Self {
            port: 8080, // Different port from main app
            is_running: false,
            server_handle: None,
        }
    }

    pub async fn start(&mut self) -> Result<u16, Box<dyn std::error::Error + Send + Sync>> {
        log::info!("🤖 Starting AI Proxy server on port {}", self.port);
        
        let app = self.create_ai_router().await?;
        
        let addr = std::net::SocketAddr::from(([127, 0, 0, 1], self.port));
        let listener = TcpListener::bind(addr).await?;
        let actual_port = listener.local_addr()?.port();
        
        if actual_port != self.port {
            log::info!("📍 AI Proxy bound to port {} (requested {})", actual_port, self.port);
            self.port = actual_port;
        }
        
        // Start the server in a background task
        let handle = tokio::spawn(async move {
            log::info!("🚀 Starting AI Proxy server...");
            
            if let Err(e) = axum::serve(listener, app).await {
                log::error!("❌ AI Proxy server error: {}", e);
            } else {
                log::info!("✅ AI Proxy server started successfully");
            }
        });
        
        self.server_handle = Some(handle);
        
        // Wait a moment for the server to start
        tokio::time::sleep(Duration::from_millis(500)).await;
        
        // Verify the server is responding
        if self.verify_server_health().await {
            log::info!("✅ AI Proxy server is healthy on port {}", self.port);
            self.is_running = true;
            Ok(self.port)
        } else {
            Err("Failed to start AI Proxy server".into())
        }
    }

    async fn create_ai_router(&self) -> Result<Router, Box<dyn std::error::Error + Send + Sync>> {
        log::info!("🏗️ Building AI Proxy router...");
        
        let app = Router::new()
            // OpenAI-compatible endpoints for assistant-ui/ag-ui
            .route("/v1/chat/completions", axum::routing::post(shared_handlers::ai::chat_completions_handler))
            // Legacy endpoints
            .route("/ai/chat", axum::routing::post(shared_handlers::ai::ai_chat_handler))
            .route("/ai/stream", axum::routing::post(shared_handlers::ai::ai_stream_handler))
            .route("/ai/health", axum::routing::get(shared_handlers::ai::ai_health_handler))
            .layer(ServiceBuilder::new().layer(CorsLayer::permissive()));
        
        log::info!("✅ AI Proxy router created");
        Ok(app)
    }

    async fn verify_server_health(&self) -> bool {
        let client = reqwest::Client::builder()
            .timeout(Duration::from_secs(5))
            .build()
            .unwrap();
        
        let url = format!("http://127.0.0.1:{}/ai/health", self.port);
        
        for attempt in 1..=5 {
            match client.get(&url).send().await {
                Ok(response) => {
                    if response.status().is_success() {
                        log::info!("🩺 AI Proxy health check passed (attempt {})", attempt);
                        return true;
                    }
                }
                Err(e) => {
                    log::warn!("🩺 AI Proxy health check failed (attempt {}): {}", attempt, e);
                    tokio::time::sleep(Duration::from_millis(200)).await;
                }
            }
        }
        
        log::error!("❌ AI Proxy health check failed after 5 attempts");
        false
    }

    pub fn get_port(&self) -> u16 {
        self.port
    }

    pub fn get_base_url(&self) -> String {
        format!("http://127.0.0.1:{}", self.port)
    }

    pub async fn stop(&mut self) {
        log::info!("🛑 Stopping AI Proxy server...");
        
        if let Some(handle) = self.server_handle.take() {
            handle.abort();
            log::info!("✅ AI Proxy server stopped");
        }
        
        self.is_running = false;
    }

    pub fn is_running(&self) -> bool {
        self.is_running
    }
}

impl Drop for AIProxyServer {
    fn drop(&mut self) {
        log::info!("🗑️ AIProxyServer dropped");
        if let Some(handle) = self.server_handle.take() {
            handle.abort();
        }
    }
}

// AI handlers now use shared library - removed local implementations

// Tauri command to get the AI proxy server URL
#[tauri::command]
pub async fn get_ai_proxy_url(
    server: tauri::State<'_, std::sync::Arc<tokio::sync::RwLock<Option<AIProxyServer>>>>
) -> Result<String, String> {
    let server_guard = server.read().await;
    if let Some(ref server) = *server_guard {
        Ok(server.get_base_url())
    } else {
        Err("AI Proxy server not initialized".to_string())
    }
}

// Tauri command to check if AI proxy server is running
#[tauri::command]
pub async fn is_ai_proxy_running(
    server: tauri::State<'_, std::sync::Arc<tokio::sync::RwLock<Option<AIProxyServer>>>>
) -> Result<bool, String> {
    let server_guard = server.read().await;
    if let Some(ref server) = *server_guard {
        Ok(server.is_running())
    } else {
        Ok(false)
    }
}