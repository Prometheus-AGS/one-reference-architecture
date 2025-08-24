# Microsandbox Implementation Checklist

## ✅ Phase 1: Setup Complete
- [x] Added dependencies to Cargo.toml files
- [x] Created configuration structure
- [x] Implemented stub MCP registry with transport abstractions
- [x] Added API endpoints for status and tools
- [x] Updated main.rs with MCP initialization
- [x] Created placeholder containers directory
- [x] Set up development environment configurations

## ⏳ Phase 2: Ready When You Are
- [ ] Uncomment microsandbox dependency in rust-lib/Cargo.toml
- [ ] Install microsandbox CLI tools
- [ ] Enable microsandbox in MCP registry
- [ ] Implement stdio transport with microsandbox
- [ ] Create first container (filesystem MCP server)
- [ ] Test stdio transport with real MCP server

## ⏳ Phase 3: Full Implementation  
- [ ] Implement HTTP transport
- [ ] Implement SSE transport  
- [ ] Add VM pooling
- [ ] Create production container images
- [ ] Add comprehensive error handling
- [ ] Implement health checks and monitoring

## Quick Commands for Testing Current Setup

```bash
# Build and run
cargo run

# Check status (in another terminal)
curl http://localhost:3000/api/mcp/status | jq
curl http://localhost:3000/api/mcp/tools | jq

# Test AI integration (if available)
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "test read_file tool"}'
```

## When Ready to Enable Microsandbox

1. Uncomment this line in rust-lib/Cargo.toml:
   ```toml
   microsandbox = { version = "0.3", optional = true }
   ```

2. Update the mcp feature:
   ```toml  
   mcp = ["microsandbox", "reqwest"]
   ```

3. Set enabled: true for servers in config/mcp-servers.yaml

4. Call `registry.enable_microsandbox()` in initialization code
