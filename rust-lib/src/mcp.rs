// MCP server registry and tool calling framework
use crate::ai::{FunctionDefinition, Tool, ToolCall};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpServer {
    pub name: String,
    pub description: String,
    pub version: String,
    pub tools: Vec<McpTool>,
    pub status: McpServerStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum McpServerStatus {
    Active,
    Inactive,
    Error(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpTool {
    pub name: String,
    pub description: String,
    pub schema: serde_json::Value,
    pub server: String, // Which MCP server provides this tool
}

#[derive(Debug, Clone)]
pub struct McpRegistry {
    servers: HashMap<String, McpServer>,
    tools: HashMap<String, McpTool>, // tool_name -> tool
}

impl McpRegistry {
    pub fn new() -> Self {
        Self {
            servers: HashMap::new(),
            tools: HashMap::new(),
        }
    }

    // Register a new MCP server
    pub fn register_server(&mut self, server: McpServer) {
        log::info!("🔌 Registering MCP server: {}", server.name);

        // Add all tools from this server to the tool registry
        for tool in &server.tools {
            self.tools.insert(tool.name.clone(), tool.clone());
        }

        self.servers.insert(server.name.clone(), server);
    }

    // Get all available tools as OpenAI-compatible Tool definitions
    pub fn get_available_tools(&self) -> Vec<Tool> {
        self.tools
            .values()
            .map(|mcp_tool| Tool {
                r#type: "function".to_string(),
                function: FunctionDefinition {
                    name: mcp_tool.name.clone(),
                    description: mcp_tool.description.clone(),
                    parameters: mcp_tool.schema.clone(),
                },
            })
            .collect()
    }

    // Execute a tool call through the appropriate MCP server
    pub async fn execute_tool_call(&self, tool_call: &ToolCall) -> Result<String, String> {
        let tool_name = &tool_call.function.name;

        if let Some(mcp_tool) = self.tools.get(tool_name) {
            log::info!(
                "🛠️ Executing tool: {} via MCP server: {}",
                tool_name,
                mcp_tool.server
            );

            // TODO: Implement actual MCP server communication via microsandbox
            // For now, return a mock response
            let mock_result = format!(
                "Tool '{}' executed with arguments: {}. (Mock result from MCP server '{}')",
                tool_name, tool_call.function.arguments, mcp_tool.server
            );

            Ok(mock_result)
        } else {
            Err(format!("Tool '{}' not found in MCP registry", tool_name))
        }
    }

    // Get list of registered servers
    pub fn get_servers(&self) -> Vec<&McpServer> {
        self.servers.values().collect()
    }

    // Remove a server and its tools
    pub fn unregister_server(&mut self, server_name: &str) {
        if let Some(server) = self.servers.remove(server_name) {
            log::info!("🔌 Unregistering MCP server: {}", server_name);

            // Remove all tools from this server
            for tool in &server.tools {
                self.tools.remove(&tool.name);
            }
        }
    }
}

// Global MCP registry (in a real app, this would be managed by DI/state management)
static mut GLOBAL_MCP_REGISTRY: Option<McpRegistry> = None;
static INIT: std::sync::Once = std::sync::Once::new();

pub fn get_mcp_registry() -> &'static mut McpRegistry {
    unsafe {
        INIT.call_once(|| {
            GLOBAL_MCP_REGISTRY = Some(McpRegistry::new());
        });
        GLOBAL_MCP_REGISTRY.as_mut().unwrap()
    }
}

// Initialize with some default MCP servers for demonstration
pub fn initialize_default_mcp_servers() {
    let registry = get_mcp_registry();

    // Example: File system MCP server
    let fs_server = McpServer {
        name: "filesystem".to_string(),
        description: "File system operations".to_string(),
        version: "1.0.0".to_string(),
        status: McpServerStatus::Active,
        tools: vec![
            McpTool {
                name: "read_file".to_string(),
                description: "Read contents of a file".to_string(),
                server: "filesystem".to_string(),
                schema: serde_json::json!({
                    "type": "object",
                    "properties": {
                        "path": {
                            "type": "string",
                            "description": "Path to the file to read"
                        }
                    },
                    "required": ["path"]
                }),
            },
            McpTool {
                name: "write_file".to_string(),
                description: "Write content to a file".to_string(),
                server: "filesystem".to_string(),
                schema: serde_json::json!({
                    "type": "object",
                    "properties": {
                        "path": {
                            "type": "string",
                            "description": "Path to the file to write"
                        },
                        "content": {
                            "type": "string",
                            "description": "Content to write to the file"
                        }
                    },
                    "required": ["path", "content"]
                }),
            },
        ],
    };

    // Example: Web search MCP server
    let web_server = McpServer {
        name: "web_search".to_string(),
        description: "Web search capabilities".to_string(),
        version: "1.0.0".to_string(),
        status: McpServerStatus::Active,
        tools: vec![McpTool {
            name: "search_web".to_string(),
            description: "Search the web for information".to_string(),
            server: "web_search".to_string(),
            schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query"
                    },
                    "max_results": {
                        "type": "integer",
                        "description": "Maximum number of results to return",
                        "default": 5
                    }
                },
                "required": ["query"]
            }),
        }],
    };

    registry.register_server(fs_server);
    registry.register_server(web_server);

    log::info!(
        "🚀 Initialized default MCP servers with {} tools",
        registry.tools.len()
    );
}
