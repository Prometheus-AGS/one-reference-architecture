# MCP Server Architecture Guide for ONE Platform

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [MCP Server Lifecycle Management](#mcp-server-lifecycle-management)
4. [Transport Mechanisms](#transport-mechanisms)
5. [Security and Sandboxing](#security-and-sandboxing)
6. [Performance Optimization](#performance-optimization)
7. [Integration with ONE Platform](#integration-with-one-platform)
8. [Configuration Management](#configuration-management)
9. [Development Workflow](#development-workflow)
10. [Production Deployment](#production-deployment)
11. [Monitoring and Observability](#monitoring-and-observability)
12. [Troubleshooting Guide](#troubleshooting-guide)

## Executive Summary

The ONE platform implements a sophisticated MCP (Model Context Protocol) server architecture that provides secure, high-performance tool execution for both web (Tuono) and desktop (Tauri) applications. This system leverages microsandbox technology for hardware-level security isolation while maintaining sub-200ms response times through intelligent lifecycle management and VM pooling.

### Key Features

- **Universal Compatibility**: Works seamlessly across Tuono web and Tauri desktop platforms
- **Security-First Design**: Hardware-level isolation using microsandbox VMs
- **High Performance**: Sub-200ms startup times with intelligent caching strategies
- **Multi-Transport Support**: stdio, HTTP, and Server-Sent Events (SSE) protocols
- **Dynamic Lifecycle Management**: On-demand and persistent execution strategies
- **Developer-Friendly**: Hot reload, debugging tools, and comprehensive APIs

## Architecture Overview

### Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      ONE Platform                               │
├─────────────────────┬───────────────────────────────────────────┤
│    Tuono Web        │           Tauri Desktop                   │
│    (React SPA)      │         (React + Rust)                   │
└─────────────────────┴───────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Shared Rust Handlers                           │
│  ┌─────────────────────────────────────────────────────────────┤
│  │              ai.rs (OpenAI Integration)                     │
│  │  • Chat completions with tool calling                      │
│  │  • RAG context enhancement                                 │
│  │  • Tool orchestration and routing                          │
│  └─────────────────────────────────────────────────────────────┤
│  │              mcp.rs (MCP Registry & Execution)             │
│  │  • SecureMcpRegistry                                        │
│  │  • Multi-transport support                                 │
│  │  • VM lifecycle management                                 │
│  │  • Tool discovery and execution                            │
│  └─────────────────────────────────────────────────────────────┤
│  │              rag.rs (Knowledge Management)                  │
│  │  • PGLite vector database                                  │
│  │  • Document retrieval and ranking                          │
│  │  • Context augmentation                                    │
│  └─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Microsandbox MCP Runtime Layer                    │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   stdio MCP     │   HTTP MCP      │        SSE MCP              │
│   Servers       │   Servers       │       Servers               │
│                 │                 │                             │
│ ┌─────────────┐ │ ┌─────────────┐ │ ┌─────────────────────────┐ │
│ │ File Ops    │ │ │ Web APIs    │ │ │ Real-time Data          │ │
│ │ Local Tools │ │ │ Search      │ │ │ Live Feeds              │ │
│ │ Scripts     │ │ │ External    │ │ │ Event Streams           │ │
│ │ Utilities   │ │ │ Services    │ │ │ WebSocket Proxies       │ │
│ └─────────────┘ │ └─────────────┘ │ └─────────────────────────┘ │
│                 │                 │                             │
│ On-Demand       │ Persistent      │ Persistent                  │
│ Ephemeral VMs   │ Preloaded VMs   │ Streaming VMs               │
└─────────────────┴─────────────────┴─────────────────────────────┘
```

### Core Components

1. **SecureMcpRegistry**: Central registry for MCP server management
2. **Transport Abstractions**: Unified interface for stdio, HTTP, and SSE communication
3. **VM Pool Manager**: Optimized virtual machine lifecycle and resource management
4. **Tool Discovery Engine**: Dynamic tool registration and capability detection
5. **Security Manager**: Sandbox configuration and access control

## MCP Server Lifecycle Management

### Lifecycle Strategies

The ONE platform employs three distinct lifecycle strategies based on server characteristics and usage patterns:

#### 1. On-Demand Execution (stdio servers)

**Characteristics:**
- Cold start on first tool invocation
- VM destroyed after execution completes
- Optimal for infrequent, stateless operations
- 200-500ms startup latency acceptable

**Use Cases:**
- File system operations
- Data transformation scripts  
- One-time computational tasks
- Development utilities

**Implementation:**
```rust
// Example: File system MCP server configuration
McpServerConfig {
    name: "filesystem".to_string(),
    transport: TransportType::Stdio,
    container_image: None, // Trusted local binary
    auto_start: false,     // Start on-demand
    preload: false,        // No persistent VM
    // ... additional config
}
```

#### 2. Persistent Execution (HTTP servers)

**Characteristics:**
- VM started during application initialization
- Maintains persistent connection and state
- Sub-100ms response times after warm-up
- Higher resource consumption

**Use Cases:**
- Web search and scraping
- External API integrations
- Database query engines
- Complex stateful services

**Implementation:**
```rust
// Example: Web search MCP server configuration  
McpServerConfig {
    name: "web_search".to_string(),
    transport: TransportType::HTTP { port: 8080 },
    container_image: Some("mcp-web-search:latest".to_string()),
    auto_start: true,      // Start immediately
    preload: true,         // Keep VM persistent
    // ... additional config
}
```

#### 3. Streaming Execution (SSE servers)

**Characteristics:**
- Persistent VM with event stream connection
- Real-time bidirectional communication
- Optimized for continuous data flow
- Connection pooling for efficiency

**Use Cases:**
- Live data feeds
- Real-time monitoring
- Event processing
- WebSocket proxy services

### Lifecycle State Machine

```
┌─────────────┐    register_server()    ┌─────────────┐
│             ├────────────────────────►│             │
│ Unregistered│                         │ Registered  │
│             │◄────────────────────────┤ (Inactive)  │
└─────────────┘    unregister_server()  └──────┬──────┘
                                               │
                                               │ start_server()
                                               ▼
                                        ┌─────────────┐
                                        │             │
                                        │  Starting   │
                                        │             │
                                        └──────┬──────┘
                                               │
                                               │ startup_complete()
                                               ▼
┌─────────────┐    stop_server()        ┌─────────────┐
│             │◄────────────────────────┤             │
│  Stopping   │                         │   Active    │
│             ├────────────────────────►│             │
└─────────────┘    error_occurred()     └─────────────┘
       │                                       │
       │ shutdown_complete()                   │ health_check_failed()
       ▼                                       ▼
┌─────────────┐                         ┌─────────────┐
│             │                         │             │
│ Registered  │                         │    Error    │
│ (Inactive)  │                         │             │
└─────────────┘                         └─────────────┘
```

## Transport Mechanisms

### stdio Transport

**Protocol**: JSON-RPC over standard input/output pipes
**Best For**: Local, trusted tools with simple request/response patterns
**Security Level**: Medium (process isolation only)

**Communication Flow:**
1. Client sends JSON-RPC request to stdin
2. MCP server processes request
3. Server responds via stdout with JSON-RPC response
4. Process terminates or continues for next request

**Example Implementation:**
```rust
pub struct StdioTransport {
    vm: Option<Arc<Mutex<MicroVM>>>,
    process: Option<tokio::process::Child>,
    config: McpServerConfig,
}

impl McpTransport for StdioTransport {
    async fn execute(&self, method: &str, params: serde_json::Value) -> Result<serde_json::Value, String> {
        let request = serde_json::json!({
            "jsonrpc": "2.0",
            "id": Uuid::new_v4().to_string(),
            "method": method,
            "params": params
        });
        
        // Send request via stdin, read response from stdout
        // Implementation details in full code artifact
    }
}
```

### HTTP Transport

**Protocol**: REST API with JSON payloads
**Best For**: Stateful services, complex APIs, web integrations
**Security Level**: High (full VM isolation with network controls)

**Communication Flow:**
1. HTTP server starts inside microsandbox VM
2. Client makes HTTP POST to `/mcp` endpoint
3. Server processes JSON-RPC over HTTP
4. Response returned as HTTP JSON response

**Endpoint Structure:**
- `GET /health` - Health check endpoint
- `POST /mcp` - Main JSON-RPC endpoint
- `GET /capabilities` - Server capability discovery

### SSE (Server-Sent Events) Transport

**Protocol**: HTTP-based event streaming with JSON payloads  
**Best For**: Real-time data, continuous streams, live updates
**Security Level**: High (VM isolation with controlled network access)

**Communication Flow:**
1. SSE server starts inside microsandbox VM
2. Client establishes SSE connection to `/events` endpoint
3. Bidirectional communication via events and HTTP requests
4. Server pushes updates via SSE, accepts commands via HTTP POST

## Security and Sandboxing

### Microsandbox Integration

The ONE platform leverages microsandbox for hardware-level security isolation:

#### VM Configuration Levels

**Level 1: Trusted Local (No Container)**
- Direct process execution on host
- Standard OS process isolation
- File system access controls via user permissions
- Used for: Local utilities, file operations

**Level 2: Containerized Isolation**
- OCI container within microsandbox VM
- Network restrictions and firewall rules
- Controlled file system mounts
- Used for: External APIs, web services

**Level 3: Maximum Security**
- Minimal VM with stripped-down kernel
- No network access
- Ephemeral file system
- Resource limits strictly enforced
- Used for: Code execution, untrusted tools

#### Security Configuration Example

```rust
SecurityConfig {
    network_enabled: false,
    file_access: vec!["/tmp/workspace".to_string()],
    allowed_domains: vec![], // Empty = no network
    env_vars: HashMap::from([
        ("HOME".to_string(), "/tmp".to_string()),
        ("PATH".to_string(), "/usr/local/bin:/usr/bin:/bin".to_string()),
    ]),
    resource_limits: ResourceLimits {
        memory_mb: 256,
        cpu_limit: 0.5,
        timeout_seconds: 30,
    },
}
```

### Attack Surface Reduction

1. **Minimal VM Images**: Custom-built containers with only essential components
2. **Read-Only File Systems**: Immutable container images with minimal writable areas
3. **Network Segmentation**: Firewall rules restricting outbound connections
4. **Resource Quotas**: CPU, memory, and I/O throttling
5. **Audit Logging**: All MCP calls logged for security analysis

## Performance Optimization

### VM Pool Management

The system maintains a pool of pre-initialized VMs to reduce startup latency:

```rust
pub struct VmPool {
    available_vms: Vec<MicroVM>,
    active_assignments: HashMap<String, MicroVM>,
    pool_size: usize,
    vm_template_configs: HashMap<String, VMConfig>,
}

impl VmPool {
    // Get VM from pool or create new one
    pub async fn acquire_vm(&mut self, server_type: &str) -> Result<MicroVM, String> {
        if let Some(vm) = self.available_vms.pop() {
            // Reconfigure existing VM for new workload
            let config = self.vm_template_configs.get(server_type)
                .ok_or("Unknown server type")?;
            vm.reconfigure(config.clone()).await?;
            Ok(vm)
        } else {
            // Create new VM if pool is empty
            self.create_vm(server_type).await
        }
    }
    
    // Return VM to pool for reuse
    pub async fn release_vm(&mut self, mut vm: MicroVM) {
        if self.available_vms.len() < self.pool_size {
            // Reset VM state and return to pool
            if vm.reset_to_clean_state().await.is_ok() {
                self.available_vms.push(vm);
            }
        }
        // If pool is full, let VM be destroyed
    }
}
```

### Connection Pooling

- **stdio**: Process pool with pre-established pipes
- **HTTP**: HTTP/2 connection reuse with keep-alive
- **SSE**: WebSocket-style persistent connections

### Caching Strategies

1. **Tool Schema Caching**: MCP tool definitions cached after first discovery
2. **VM Image Caching**: Container images cached locally for fast startup
3. **Response Caching**: Cacheable tool responses stored with TTL
4. **Connection Pooling**: Persistent connections for HTTP/SSE transports

## Integration with ONE Platform

### Tuono Web Integration

The web platform accesses MCP servers through the shared Rust handlers via HTTP APIs:

```typescript
// Frontend TypeScript integration
export class McpClient {
    async getAvailableTools(): Promise<Tool[]> {
        const response = await fetch('/api/mcp/tools');
        return response.json();
    }
    
    async executeTool(toolName: string, args: Record<string, any>): Promise<string> {
        const response = await fetch('/api/mcp/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tool_name: toolName, arguments: args })
        });
        const result = await response.json();
        return result.success ? result.result : Promise.reject(result.error);
    }
}
```

### Tauri Desktop Integration

The desktop application has direct access to the Rust handlers:

```rust
// Tauri command for MCP tool execution
#[tauri::command]
async fn execute_mcp_tool(tool_name: String, arguments: serde_json::Value) -> Result<String, String> {
    let registry = shared_handlers::mcp::get_mcp_registry();
    
    let tool_call = ToolCall {
        id: Uuid::new_v4().to_string(),
        r#type: "function".to_string(),
        function: FunctionCall {
            name: tool_name,
            arguments: arguments.to_string(),
        },
    };
    
    registry.execute_tool_call(&tool_call).await
}
```

### AI Integration Flow

```
┌──────────────┐    1. User Query     ┌─────────────────┐
│              ├──────────────────────►│                 │
│   Client     │                       │  AI Handler     │
│ (Web/Desktop)│◄──────────────────────┤   (ai.rs)       │
└──────────────┘    8. Final Response  └─────────┬───────┘
                                                  │
                                                  │ 2. Determine Tools
                                                  ▼
                                        ┌─────────────────┐
                                        │                 │
                                        │  MCP Registry   │
                                        │   (mcp.rs)      │
                                        └─────────┬───────┘
                                                  │
                                                  │ 3. Get Available Tools
                                                  │ 4. Execute Tool Calls
                                                  ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐
│   stdio     │ │    HTTP     │ │          SSE            │
│ Transport   │ │ Transport   │ │      Transport          │
│             │ │             │ │                         │
│ ┌─────────┐ │ │ ┌─────────┐ │ │ ┌─────────────────────┐ │
│ │File Ops │ │ │ │Web APIs │ │ │ │   Real-time Data    │ │
│ └─────────┘ │ │ └─────────┘ │ │ └─────────────────────┘ │
└─────────────┘ └─────────────┘ └─────────────────────────┘
      │                │                        │
      │ 5. Execute     │ 6. Execute            │ 7. Execute
      │ in VM          │ in VM                 │ in VM
      ▼                ▼                        ▼
┌─────────────────────────────────────────────────────────┐
│          Microsandbox VM Runtime                        │
└─────────────────────────────────────────────────────────┘
```

## Configuration Management

### Server Configuration Files

MCP servers are configured via YAML files that define their execution parameters:

```yaml
# config/mcp-servers.yaml
servers:
  filesystem:
    description: "Local file system operations"
    version: "1.0.0"
    transport:
      type: "stdio"
    execution:
      type: "local"  # No containerization
      command: ["mcp-filesystem-server"]
    resources:
      memory_mb: 128
      cpu_limit: 0.5
      timeout_seconds: 30
    security:
      network_enabled: false
      file_access: ["/workspace", "/tmp"]
    lifecycle:
      auto_start: false  # On-demand execution
      preload: false
      restart_policy: "on_failure"

  web_search:
    description: "Web search and scraping"
    version: "1.0.0"
    transport:
      type: "http"
      port: 8080
    execution:
      type: "container"
      image: "mcp-web-search:latest"
      command: ["mcp-web-server", "--port", "8080"]
    resources:
      memory_mb: 512
      cpu_limit: 1.0
      timeout_seconds: 60
    security:
      network_enabled: true
      allowed_domains: ["*.google.com", "*.bing.com"]
      env_vars:
        SEARCH_API_KEY: "${SEARCH_API_KEY}"
    lifecycle:
      auto_start: true   # Start immediately
      preload: true      # Keep persistent
      restart_policy: "always"
```

### Environment-Specific Configuration

```yaml
# config/environments/development.yaml
settings:
  vm_pool_size: 2
  health_check_interval: 60  # Longer interval for dev
  log_level: "debug"
  hot_reload: true

servers:
  filesystem:
    security:
      file_access: ["/workspace", "/tmp", "/Users/dev/projects"]
  
# config/environments/production.yaml  
settings:
  vm_pool_size: 5
  health_check_interval: 30
  log_level: "info"
  metrics_enabled: true
  
servers:
  filesystem:
    security:
      file_access: ["/app/workspace", "/tmp"]
```

### Dynamic Configuration Updates

The system supports runtime configuration updates for non-security-critical settings:

```rust
// API endpoint for configuration updates
#[post("/api/mcp/config")]
async fn update_server_config(config: McpServerConfig) -> Result<Json<Value>, String> {
    let registry = get_mcp_registry();
    
    // Validate configuration
    validate_server_config(&config)?;
    
    // Apply non-security updates without restart
    if let Some(server) = registry.get_server_mut(&config.name) {
        // Update resource limits, timeouts, etc.
        server.config.resources = config.resources;
        
        // Security changes require restart
        if server.config.security != config.security {
            registry.restart_server(&config.name).await?;
        }
    }
    
    Ok(Json(json!({"status": "updated"})))
}
```

## Development Workflow

### Local Development Setup

1. **Install Dependencies**:
   ```bash
   # Install microsandbox (platform-specific)
   cargo install microsandbox-cli
   
   # Build container images
   docker build -t mcp-web-search:latest containers/web-search/
   docker build -t mcp-filesystem:latest containers/filesystem/
   ```

2. **Development Configuration**:
   ```yaml
   # config/environments/development.yaml
   settings:
     hot_reload: true
     auto_restart_on_failure: true
     log_level: "debug"
     dev_mode: true
   ```

3. **Run Development Server**:
   ```bash
   RUST_LOG=debug cargo run
   ```

### Hot Reload Development

During development, MCP servers can be hot-reloaded without restarting the main application:

```rust
#[cfg(debug_assertions)]
pub async fn watch_for_server_changes() {
    use notify::{Watcher, RecursiveMode, watcher};
    use std::sync::mpsc::channel;
    use std::time::Duration;
    
    let (tx, rx) = channel();
    let mut watcher = watcher(tx, Duration::from_secs(2)).unwrap();
    
    // Watch for changes in MCP server directories
    watcher.watch("./containers/", RecursiveMode::Recursive).unwrap();
    watcher.watch("./config/", RecursiveMode::Recursive).unwrap();
    
    loop {
        match rx.recv() {
            Ok(event) => {
                log::info!("Detected change: {:?}", event);
                // Rebuild and restart affected servers
                reload_changed_servers(event).await;
            }
            Err(e) => log::error!("Watch error: {:?}", e),
        }
    }
}
```

### Testing Framework

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use tokio_test;
    
    #[tokio::test]
    async fn test_stdio_server_lifecycle() {
        let mut registry = SecureMcpRegistry::new();
        
        let config = McpServerConfig {
            name: "test_server".to_string(),
            transport: TransportType::Stdio,
            // ... test configuration
        };
        
        // Test registration
        registry.register_server(config).await.unwrap();
        assert_eq!(registry.servers.len(), 1);
        
        // Test startup
        registry.start_server("test_server").await.unwrap();
        let server = registry.servers.get("test_server").unwrap();
        assert!(matches!(server.status, McpServerStatus::Active));
        
        // Test tool execution
        let tool_call = create_test_tool_call();
        let result = registry.execute_tool_call(&tool_call).await.unwrap();
        assert!(!result.is_empty());
        
        // Test shutdown
        registry.stop_server("test_server").await.unwrap();
    }
    
    #[tokio::test]
    async fn test_vm_pool_management() {
        let mut pool = VmPool::new(2);
        
        let config = VMConfig::default();
        let vm1 = pool.acquire_vm("test_type").await.unwrap();
        let vm2 = pool.acquire_vm("test_type").await.unwrap();
        
        // Pool should be empty now
        assert_eq!(pool.available_vms.len(), 0);
        
        // Return VMs to pool
        pool.release_vm(vm1).await;
        pool.release_vm(vm2).await;
        
        // Pool should be full again
        assert_eq!(pool.available_vms.len(), 2);
    }
}
```

### Debugging Tools

```bash
# View MCP server status
curl http://localhost:3000/api/mcp/status | jq

# List available tools
curl http://localhost:3000/api/mcp/tools | jq

# Execute a tool manually
curl -X POST http://localhost:3000/api/mcp/execute \
  -H "Content-Type: application/json" \
  -d '{"tool_name": "read_file", "arguments": {"path": "/tmp/test.txt"}}'

# View server logs
tail -f logs/mcp-servers.log

# Monitor VM resource usage
microsandbox ps --format json
```

## Production Deployment

### Container Registry Setup

```bash
# Build and push MCP server images
docker build -t your-registry.com/mcp-web-search:v1.0.0 containers/web-search/
docker push your-registry.com/mcp-web-search:v1.0.0

docker build -t your-registry.com/mcp-filesystem:v1.0.0 containers/filesystem/
docker push your-registry.com/mcp-filesystem:v1.0.0
```

### Production Configuration

```yaml
# config/environments/production.yaml
settings:
  vm_pool_size: 10
  health_check_interval: 30
  max_concurrent_executions: 50
  log_level: "info"
  metrics_enabled: true
  telemetry:
    prometheus_endpoint: ":9090/metrics"
    jaeger_endpoint: "http://jaeger:14268/api/traces"

servers:
  web_search:
    execution:
      image: "your-registry.com/mcp-web-search:v1.0.0"
    resources:
      memory_mb: 1024  # Increased for production load
      cpu_limit: 2.0
    security:
      allowed_domains: 
        - "api.search.com"
        - "*.googleapis.com"
      rate_limiting:
        requests_per_minute: 100
```

### Health Checks and Monitoring

```rust
// Comprehensive health check endpoint
#[get("/api/health")]
async fn health_check() -> Json<Value> {
    let registry = get_mcp_registry();
    let servers = registry.get_servers();
    
    let mut healthy_count = 0;
    let mut server_status = Vec::new();
    
    for server in servers {
        let is_healthy = match &server.status {
            McpServerStatus::Active => {
                // Additional health verification
                if let Some(transport) = registry.transports.get(&server.name) {
                    transport.is_healthy()
                } else {
                    false
                }
            }
            _ => false,
        };
        
        if is_healthy {
            healthy_count += 1;
        }
        
        server_status.push(json!({
            "name": server.name,
            "status": server.status,
            "healthy": is_healthy,
            "uptime": calculate_uptime(&server.name),
            "memory_usage": get_memory_usage(&server.name),
        }));
    }
    
    let overall_health = if healthy_count == servers.len() && !servers.is_empty() {
        "healthy"
    } else if healthy_count > 0 {
        "degraded"
    } else {
        "unhealthy"
    };
    
    Json(json!({
        "status": overall_health,
        "servers": server_status,
        "healthy_count": healthy_count,
        "total_count": servers.len(),
        "vm_pool_size": registry.vm_pool.available_vms.len(),
        "timestamp": chrono::Utc::now().to_rfc3339()
    }))
}
```

### Metrics and Observability

```rust
// Prometheus metrics integration
use prometheus::{Counter, Histogram, Gauge, register_counter, register_histogram, register_gauge};

lazy_static! {
    static ref TOOL_EXECUTIONS: Counter = register_counter!(
        "mcp_tool_executions_total",
        "Total number of MCP tool executions"
    ).unwrap();
    
    static ref TOOL_EXECUTION_DURATION: Histogram = register_histogram!(
        "mcp_tool_execution_duration_seconds",
        "Duration of MCP tool executions"
    ).unwrap();
    
    static ref ACTIVE_VMS: Gauge = register_gauge!(
        "mcp_active_vms",
        "Number of active microsandbox VMs"
    ).unwrap();
}

// Instrumented tool execution
pub async fn execute_tool_call_instrumented(&self, tool_call: &ToolCall) -> Result<String, String> {
    let start_time = std::time::Instant::now();
    TOOL_EXECUTIONS.inc();
    
    let result = self.execute_tool_call(tool_call).await;
    
    let duration = start_time.elapsed().as_secs_f64();
    TOOL_EXECUTION_DURATION.observe(duration);
    
    result
}
```

## Monitoring and Observability

### Logging Strategy

```rust
use tracing::{info, warn, error, debug, instrument};

#[instrument(skip(self), fields(server = %server_name))]
pub async fn start_server(&mut self, server_name: &str) -> Result<(), String> {
    info!("Starting MCP server: {}", server_name);
    
    let start_time = std::time::Instant::now();
    
    // Server startup logic...
    
    let startup_duration = start_time.elapsed();
    info!(
        duration_ms = startup_duration.as_millis(),
        "MCP server started successfully"
    );
    
    Ok(())
}
```

### Structured Logging Output

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "INFO",
  "target": "shared_handlers::mcp",
  "message": "MCP server started successfully",
  "fields": {
    "server": "web_search",
    "duration_ms": 150,
    "transport": "http",
    "port": 8080
  },
  "span": {
    "name": "start_server",
    "server": "web_search"
  }
}
```

### Performance Dashboards

Key metrics to monitor:

1. **Server Health**:
   - Active/inactive server count
   - Health check success rate
   - Server restart frequency

2. **Performance Metrics**:
   - Tool execution latency (p50, p95, p99)
   - VM startup times
   - Connection pool utilization

3. **Resource Usage**:
   - VM memory consumption
   - CPU utilization per server
   - Network I/O statistics

4. **Error Tracking**:
   - Failed tool executions
   - VM startup failures
   - Transport connection errors

## Troubleshooting Guide

### Common Issues and Solutions

#### 1. Server Won't Start

**Symptoms**:
- Server status remains "Starting"
- Connection refused errors
- VM creation failures

**Debugging Steps**:
```bash
# Check server logs
tail -f logs/mcp-servers.log | grep "server_name"

# Verify container image exists
docker images | grep mcp-server-name

# Test VM creation manually
microsandbox create --image mcp-server-name:latest --memory 512

# Check resource availability
microsandbox system info
```

**Common Causes**:
- Insufficient system resources
- Missing container images
- Port conflicts
- Invalid configuration

#### 2. Tool Execution Timeouts

**Symptoms**:
- "Operation timed out" errors
- Slow response times
- Hanging tool calls

**Debugging Steps**:
```bash
# Check resource limits
curl http://localhost:3000/api/mcp/status | jq '.servers[] | select(.name=="server_name")'

# Monitor VM resource usage
microsandbox stats server_name

# Test tool execution directly
curl -X POST http://localhost:3000/api/mcp/execute \
  -H "Content-Type: application/json" \
  -d '{"tool_name": "test_tool", "arguments": {}}' \
  --max-time 30
```

**Solutions**:
- Increase timeout settings
- Optimize tool implementation
- Add more VM resources
- Implement async execution

#### 3. Memory Leaks

**Symptoms**:
- Increasing memory usage over time
- VM pool exhaustion
- Out of memory errors

**Debugging Steps**:
```bash
# Monitor memory usage trends
watch -n 5 'microsandbox ps --format "table {{.Name}}\t{{.MemUsage}}\t{{.MemLimit}}"'

# Check for VM cleanup
curl http://localhost:3000/api/mcp/status | jq '.vm_pool_size'

# Analyze heap dumps (if available)
# Platform-specific memory profiling tools
```

**Solutions**:
- Implement proper VM cleanup
- Set memory limits on containers
- Use VM pooling effectively
- Monitor and restart problematic servers

#### 4. Network Connectivity Issues

**Symptoms**:
- HTTP servers unreachable
- SSL/TLS handshake failures
- DNS resolution errors

**Debugging Steps**:
```bash
# Test network connectivity from host
curl -v http://localhost:8080/health

# Check VM network configuration
microsandbox exec server_name -- curl -v http://external-api.com

# Verify firewall rules
microsandbox network ls
```

**Solutions**:
- Configure correct port mappings
- Update allowed domains list
- Check firewall settings
- Verify DNS configuration

### Performance Optimization Checklist

- [ ] VM pool size appropriate for workload
- [ ] Container images optimized (minimal size)
- [ ] Resource limits properly configured
- [ ] Connection pooling enabled for HTTP/SSE
- [ ] Caching strategies implemented
- [ ] Health checks not too frequent
- [ ] Logging level appropriate for environment
- [ ] Metrics collection optimized

### Security Audit Checklist

- [ ] All containers run as non-root users
- [ ] Network access restricted to required domains
- [ ] File system access minimally scoped
- [ ] Environment variables properly secured
- [ ] Container images regularly updated
- [ ] Audit logging enabled
- [ ] Resource limits prevent DoS
- [ ] Secrets management implemented

---

## Conclusion

The ONE platform's MCP server architecture provides a robust, secure, and high-performance foundation for tool execution across web and desktop environments. By leveraging microsandbox technology and intelligent lifecycle management, the system achieves the optimal balance of security, performance, and developer experience.

This architecture enables:

- **Unified Development Experience**: Same tools work across Tuono web and Tauri desktop
- **Security by Design**: Hardware-level isolation for all external code execution
- **High Performance**: Sub-200ms response times through VM pooling and caching
- **Operational Excellence**: Comprehensive monitoring, logging, and debugging capabilities
- **Developer Productivity**: Hot reload, testing frameworks, and intuitive APIs

The modular design ensures that new MCP servers can be easily added, and the system can scale to support growing workloads while maintaining security and performance guarantees.
