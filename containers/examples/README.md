# MCP Server Containers

This directory will contain Docker containers for MCP servers when microsandbox is implemented.

## Planned Structure

```
containers/
├── filesystem/          # File system operations (stdio)
├── web-search/          # Web search capabilities (HTTP)
├── code-executor/       # Safe code execution (stdio, sandboxed)
├── database/            # Database operations (SSE)
└── examples/            # Example containers and templates
```

## When Ready to Implement

1. Enable microsandbox dependency in rust-lib/Cargo.toml
2. Set `enabled: true` for desired servers in config/mcp-servers.yaml
3. Build container images for each MCP server type
4. Update SecurityConfig for each server's requirements

## Current Status

- ✅ Configuration structure ready
- ✅ Transport abstractions defined  
- ✅ API routes prepared
- ⏳ Microsandbox integration pending
- ⏳ Container images pending
