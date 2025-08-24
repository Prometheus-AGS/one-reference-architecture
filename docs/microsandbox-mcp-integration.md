# Microsandbox + MCP Integration Architecture

## Executive Summary

This document outlines the optimal integration approach between Microsandbox and the Model Context Protocol (MCP) framework within our ONE reference architecture. The integration provides hardware-level security isolation for MCP servers while maintaining sub-200ms startup performance and seamless communication with the shared Rust handlers.

## Microsandbox Architecture Overview

### Core Capabilities
- **Hardware-level isolation**: Uses Intel VT-x/AMD-V virtualization for complete memory and CPU isolation
- **Ultra-fast startup**: <200ms cold start times through optimized microVM initialization
- **OCI container support**: Compatible with standard container images and registries
- **Resource management**: Fine-grained CPU, memory, and network controls
- **Rust SDK**: Native Rust integration with async/await support

### Security Model
- **Zero trust**: Complete isolation between guest and host systems
- **Minimal attack surface**: Stripped-down microVM with only essential components
- **Network isolation**: Configurable networking with firewall rules
- **File system isolation**: Controlled file system access with mount points

## MCP Transport Mechanisms

### stdio Transport
- **Use case**: Local, trusted MCP servers
- **Communication**: Standard input/output pipes
- **Startup**: Direct process execution within microsandbox
- **Best for**: File system operations, local data processing

### SSE (Server-Sent Events) Transport
- **Use case**: Remote MCP servers requiring persistent connections
- **Communication**: HTTP-based event streaming
- **Startup**: HTTP server initialization within microsandbox
- **Best for**: Real-time data feeds, streaming APIs

### HTTP Transport
- **Use case**: Standard REST-based MCP servers
- **Communication**: Request/response HTTP
- **Startup**: HTTP server with defined endpoints
- **Best for**: Web APIs, database connections, external services

## Integration Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Application                       │
│  ┌─────────────────┐  ┌─────────────────┐                 │
│  │   Tuono Web     │  │  Tauri Desktop  │                 │
│  │   (React)       │  │   (React)       │                 │
│  └─────────────────┘  └─────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                 Shared Rust Handlers                       │
│  ┌─────────────────────────────────────────────────────────┤
│  │              ai.rs (OpenAI API)                         │
│  │  • chat_completions_handler                             │
│  │  • RAG context enhancement                              │
│  │  • Tool calling orchestration                           │
│  └─────────────────────────────────────────────────────────┤
│  │              mcp.rs (MCP Registry)                      │
│  │  • McpRegistry                                          │
│  │  • Tool registration                                     │
│  │  • Microsandbox integration ← NEW                       │
│  └─────────────────────────────────────────────────────────┤
│  │              rag.rs (RAG Service)                       │
│  │  • PGLite integration                                   │
│  │  • Document retrieval                                   │
│  │  • Context enhancement                                  │
│  └─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Microsandbox MCP Runtime                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  │   stdio MCP     │  │   SSE MCP       │  │  HTTP MCP       │
│  │   ┌───────────┐ │  │   ┌───────────┐ │  │  ┌────────────┐ │
│  │   │ File Ops  │ │  │   │ Live Data │ │  │  │ Web APIs   │ │
│  │   │ Local DB  │ │  │   │ Streams   │ │  │  │ External   │ │
│  │   │ Scripts   │ │  │   │ Webhooks  │ │  │  │ Services   │ │
│  │   └───────────┘ │  │   └───────────┘ │  │  └────────────┘ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘
└─────────────────────────────────────────────────────────────┘
```

### Enhanced McpRegistry Implementation

```rust
use microsandbox::{MicroVM, VMConfig, Runtime};
use tokio::process::Command;
use std::collections::HashMap;

pub struct SecureMcpRegistry {
    servers: HashMap<String, McpServerInstance>,
    runtime: microsandbox::Runtime,
}

pub struct McpServerInstance {
    pub server: McpServer,
    pub vm: Option<MicroVM>,
    pub transport: McpTransport,
    pub status: McpServerStatus,
}

pub enum McpTransport {
    Stdio { process: tokio::process::Child },
    SSE { endpoint: String, port: u16 },
    HTTP { base_url: String, port: u16 },
}

impl SecureMcpRegistry {
    pub async fn start_server(&mut self, server_config: McpServerConfig) -> Result<(), String> {
        match server_config.transport {
            TransportType::Stdio => self.start_stdio_server(server_config).await,
            TransportType::SSE => self.start_sse_server(server_config).await,
            TransportType::HTTP => self.start_http_server(server_config).await,
        }
    }
    
    async fn start_stdio_server(&mut self, config: McpServerConfig) -> Result<(), String> {
        let vm_config = VMConfig {
            memory_mb: 128,
            cpu_limit: 0.5,
            network_enabled: false,
            root_fs: config.container_image,
        };
        
        let vm = self.runtime.create_vm(vm_config).await?;
        
        let transport = McpTransport::Stdio {
            process: vm.exec_command(&config.start_command).await?,
        };
        
        self.servers.insert(config.name.clone(), McpServerInstance {
            server: config.into(),
            vm: Some(vm),
            transport,
            status: McpServerStatus::Active,
        });
        
        Ok(())
    }
    
    async fn start_sse_server(&mut self, config: McpServerConfig) -> Result<(), String> {
        let vm_config = VMConfig {
            memory_mb: 256,
            cpu_limit: 1.0,
            network_enabled: true,
            port_mapping: vec![(config.port, config.port)],
            root_fs: config.container_image,
        };
        
        let vm = self.runtime.create_vm(vm_config).await?;
        vm.exec_command(&config.start_command).await?;
        
        let transport = McpTransport::SSE {
            endpoint: format!("http://127.0.0.1:{}/events", config.port),
            port: config.port,
        };
        
        self.servers.insert(config.name.clone(), McpServerInstance {
            server: config.into(),
            vm: Some(vm),
            transport,
            status: McpServerStatus::Active,
        });
        
        Ok(())
    }
}
```

## Startup Procedures by Transport Type

### stdio Transport Startup
1. **VM Initialization**: Create microsandbox VM with minimal resources (128MB RAM, no network)
2. **Container Loading**: Load MCP server container image
3. **Process Execution**: Start MCP server process with stdio pipes
4. **Communication Setup**: Establish bidirectional pipe communication
5. **Health Check**: Verify MCP server responds to ping

### SSE Transport Startup
1. **VM Initialization**: Create microsandbox VM with network capabilities (256MB RAM, port mapping)
2. **Container Loading**: Load MCP server container with HTTP server
3. **Server Startup**: Start HTTP server within VM on designated port
4. **SSE Endpoint**: Establish Server-Sent Events endpoint
5. **Connection Verification**: Verify SSE stream connectivity

### HTTP Transport Startup
1. **VM Initialization**: Create microsandbox VM with full HTTP capabilities (512MB RAM, port mapping)
2. **Container Loading**: Load MCP server container with REST API
3. **Service Startup**: Start HTTP service on designated port
4. **Endpoint Discovery**: Query available MCP endpoints
5. **API Verification**: Test basic HTTP connectivity and authentication

## Security Considerations

### Isolation Boundaries
- **Process isolation**: Each MCP server runs in separate microVM
- **Network isolation**: Controlled network access with firewall rules
- **File system isolation**: Read-only container images with controlled mounts
- **Resource limits**: CPU, memory, and I/O throttling

### Trust Levels
- **Trusted MCP servers**: Local file operations, system utilities
- **Semi-trusted servers**: External APIs with rate limiting
- **Untrusted servers**: Full isolation with minimal resource allocation

### Attack Surface Reduction
- **Minimal VM footprint**: Only essential components in microVM
- **No persistent storage**: Stateless servers with ephemeral file systems
- **Communication auditing**: All MCP calls logged and monitored
- **Resource monitoring**: Real-time resource usage tracking

## Performance Optimization

### VM Reuse Strategy
```rust
pub struct VMPool {
    available_vms: Vec<MicroVM>,
    active_servers: HashMap<String, MicroVM>,
    pool_size: usize,
}

impl VMPool {
    pub async fn get_or_create_vm(&mut self, config: VMConfig) -> Result<MicroVM, String> {
        if let Some(vm) = self.available_vms.pop() {
            vm.reconfigure(config).await?;
            Ok(vm)
        } else {
            self.create_new_vm(config).await
        }
    }
    
    pub async fn return_vm(&mut self, vm: MicroVM) {
        vm.reset().await;
        self.available_vms.push(vm);
    }
}
```

### Connection Pooling
- **stdio**: Process pool with pre-initialized pipes
- **SSE**: Connection pool with persistent HTTP connections
- **HTTP**: HTTP client pool with keep-alive connections

## Implementation Roadmap

### Phase 1: Core Integration (1-2 weeks)
- [ ] Add microsandbox dependency to rust-lib/Cargo.toml
- [ ] Implement SecureMcpRegistry in rust-lib/src/mcp.rs
- [ ] Add VM lifecycle management
- [ ] Implement stdio transport with basic file operations MCP server

### Phase 2: Multi-Transport Support (2-3 weeks)
- [ ] Implement SSE transport for streaming MCP servers
- [ ] Implement HTTP transport for REST-based MCP servers
- [ ] Add transport auto-detection and failover
- [ ] Implement VM pool for performance optimization

### Phase 3: Production Hardening (1-2 weeks)
- [ ] Add comprehensive error handling and recovery
- [ ] Implement security monitoring and auditing
- [ ] Add resource usage metrics and alerting
- [ ] Create MCP server container templates

### Phase 4: Developer Experience (1 week)
- [ ] Add MCP server hot-reload during development
- [ ] Create debugging tools and logging
- [ ] Add performance profiling and optimization
- [ ] Create documentation and examples

## Example MCP Server Configurations

### File System MCP Server (stdio)
```rust
McpServerConfig {
    name: "filesystem".to_string(),
    transport: TransportType::Stdio,
    container_image: "mcp-filesystem:latest".to_string(),
    start_command: vec!["mcp-filesystem-server".to_string()],
    resources: ResourceLimits {
        memory_mb: 128,
        cpu_limit: 0.5,
    },
    security: SecurityConfig {
        network_enabled: false,
        file_access: vec!["/tmp".to_string()],
    },
}
```

### Web Search MCP Server (HTTP)
```rust
McpServerConfig {
    name: "web_search".to_string(),
    transport: TransportType::HTTP,
    container_image: "mcp-web-search:latest".to_string(),
    start_command: vec!["mcp-web-server", "--port", "8080".to_string()],
    port: 8080,
    resources: ResourceLimits {
        memory_mb: 512,
        cpu_limit: 1.0,
    },
    security: SecurityConfig {
        network_enabled: true,
        allowed_domains: vec!["api.search.com".to_string()],
    },
}
```

## Conclusion

The microsandbox + MCP integration provides a robust, secure, and performant foundation for tool calling in our ONE reference architecture. The approach balances security isolation with performance requirements while maintaining compatibility with both Tuono web and Tauri desktop platforms.

Key benefits:
- **Security**: Hardware-level isolation for untrusted MCP servers
- **Performance**: <200ms startup times with VM pooling
- **Flexibility**: Support for all MCP transport mechanisms
- **Scalability**: Resource-efficient VM management
- **Developer Experience**: Hot-reload and debugging tools

The implementation roadmap provides a clear path to production deployment while maintaining the existing shared Rust handlers architecture.