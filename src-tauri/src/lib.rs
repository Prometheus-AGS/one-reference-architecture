use std::sync::Arc;
use tokio::sync::RwLock;
use tauri::{Manager, menu::{MenuBuilder, SubmenuBuilder}};

mod ai_proxy;
use ai_proxy::AIProxyServer;

// IPC Commands using shared handlers
#[tauri::command]
async fn api_health_check() -> Result<String, String> {
    match shared_handlers::health_check_handler().await {
        Ok(_) => Ok("OK".to_string()),
        Err(_) => Err("Health check failed".to_string())
    }
}

#[tauri::command]
async fn get_api_data() -> Result<serde_json::Value, String> {
    match shared_handlers::api_data_handler().await {
        Ok(response) => Ok(response.0), // Extract inner value from AxumJson
        Err(_) => Err("Failed to get API data".to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      // Create menu with dev tools
      let view_menu = SubmenuBuilder::new(app, "View")
        .text("devtools", "Developer Tools")
        .build()?;
      
      let menu = MenuBuilder::new(app)
        .item(&view_menu)
        .build()?;
      
      app.set_menu(menu)?;
      
      // Handle menu events
      app.on_menu_event(move |_app_handle: &tauri::AppHandle, event| {
        match event.id().0.as_str() {
          "devtools" => {
            log::info!("🔧 Dev tools menu item clicked");
            if let Some(window) = _app_handle.get_webview_window("main") {
              window.open_devtools();
            }
          }
          _ => {
            println!("unexpected menu event: {}", event.id().0);
          }
        }
      });
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Initialize the AI proxy server state
      let ai_server_state: Arc<RwLock<Option<AIProxyServer>>> = Arc::new(RwLock::new(None));
      
      // Store the AI server state in Tauri's managed state
      app.manage(ai_server_state.clone());

      // Start the AI proxy server in a background task
      let ai_server_state_clone = ai_server_state.clone();
      tauri::async_runtime::spawn(async move {
        log::info!("🤖 Initializing AI Proxy server...");
        
        let mut server = AIProxyServer::new();
        match server.start().await {
          Ok(port) => {
            log::info!("✅ AI Proxy server started successfully on port {}", port);
            let mut server_guard = ai_server_state_clone.write().await;
            *server_guard = Some(server);
          }
          Err(e) => {
            log::error!("❌ Failed to start AI Proxy server: {}", e);
          }
        }
      });

      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      api_health_check,
      get_api_data,
      ai_proxy::get_ai_proxy_url,
      ai_proxy::is_ai_proxy_running
    ])
    .on_menu_event(|app, event| {
      match event.id().as_ref() {
        "devtools" => {
          log::info!("🔧 Dev tools menu item clicked");
          if let Some(window) = app.get_webview_window("main") {
            window.open_devtools();
          }
        }
        _ => {}
      }
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
