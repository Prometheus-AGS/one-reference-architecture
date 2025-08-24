+++
id = "ai-mcp-rag-standards"
title = "AI, MCP, and RAG Integration Standards"
scope = "project"
target_audience = ["developers", "ai-assistants"]
status = "active"
priority = "high"
tags = ["ai", "mcp", "rag", "microsandbox", "security", "tool-calling"]
version = "1.0.0"
created_date = "2025-01-24"
+++

# AI, MCP, and RAG Integration Standards

## OpenAI API Compatibility Requirements

### Chat Completions Handler
All AI handlers MUST be OpenAI-compatible for assistant-ui and ag-ui integration:

```rust
// ✅ MANDATORY - OpenAI-compatible response structure
#[derive(Debug, Serialize)]
pub struct ChatCompletionResponse {
    pub id: String,
    pub object: String,           // Always "chat.completion"
    pub created: u64,
    pub model: String,
    pub choices: Vec<ChatChoice>,
    pub usage: Usage,
}

#[derive(Debug, Serialize)]
pub struct ChatChoice {
    pub index: u32,
    pub message: ChatMessage,
    pub finish_reason: String,    // "stop", "length", "tool_calls", "content_filter"
}

// ✅ Support tool calling in messages
#[derive(Debug, Deserialize, Serialize)]
pub struct ChatMessage {
    pub role: String,                    // "system", "user", "assistant", "tool"
    pub content: Option<String>,
    pub tool_calls: Option<Vec<ToolCall>>,
    pub tool_call_id: Option<String>,   // For tool response messages
    pub name: Option<String>,           // For tool/function messages
}
```

### Request Processing Pipeline
```rust
// ✅ Standard AI request processing flow
pub async fn chat_completions_handler(
    Json(mut request): Json<ChatCompletionRequest>,
) -> Result<AxumJson<ChatCompletionResponse>, StatusCode> {
    
    // 1. Initialize services
    crate::mcp::initialize_default_mcp_servers();
    crate::rag::initialize_rag_service();
    
    // 2. Extract user query for RAG
    let user_query = extract_latest_user_message(&request.messages);
    
    // 3. Enhance with RAG context if available
    if !user_query.is_empty() {
        let rag_service = crate::rag::get_rag_service();
        if let Ok(context) = rag_service.retrieve_context(user_query, None).await {
            rag_service.enhance_messages_with_context(&mut request.messages, &context);
        }
    }
    
    // 4. Add available MCP tools to request
    let mcp_registry = crate::mcp::get_mcp_registry();
    if request.tools.is_none() {
        request.tools = Some(mcp_registry.get_available_tools());
    }
    
    // 5. Determine response type (tool_calls vs text)
    let response = if should_call_tools(&request) {
        generate_tool_call_response(&request).await?
    } else {
        generate_text_response(&request).await?
    };
    
    Ok(AxumJson(response))
}
```

## MCP Server Integration Standards

### Secure MCP Registry Architecture
```rust
// ✅ MCP servers MUST run in microsandbox isolation
use microsandbox::{MicroVM, VMConfig};

pub struct SecureMcpRegistry {
    servers: HashMap<String, McpServerInstance>,
    vm_pool: VMPool,
    security_policies: SecurityPolicyManager,
}

pub struct McpServerInstance {
    pub server: McpServer,
    pub vm: Option<MicroVM>,
    pub transport: McpTransport,
    pub status: McpServerStatus,
    pub security_level: SecurityLevel,
}

#[derive(Debug, Clone)]
pub enum SecurityLevel {
    Trusted,      // Local filesystem, no network
    SemiTrusted,  // Limited network access
    Untrusted,    // Full isolation, minimal resources
}
```

### MCP Transport Implementation
```rust
// ✅ Support all MCP transport types
#[derive(Debug, Clone)]
pub enum McpTransport {
    Stdio { 
        process: tokio::process::Child,
        stdin: tokio::process::ChildStdin,
        stdout: tokio::process::ChildStdout,
    },
    SSE { 
        endpoint: String, 
        client: reqwest::Client,
        event_stream: Option<EventSource>,
    },
    HTTP { 
        base_url: String, 
        client: reqwest::Client,
        auth_header: Option<String>,
    },
}

impl SecureMcpRegistry {
    // ✅ Transport-specific startup procedures
    pub async fn start_stdio_server(&mut self, config: McpServerConfig) -> Result<(), McpError> {
        let vm_config = VMConfig {
            memory_mb: 128,
            cpu_limit: 0.5,
            network_enabled: false,
            root_fs: config.container_image.clone(),
        };
        
        let vm = self.vm_pool.acquire_vm(vm_config).await?;
        let process = vm.exec_command(&config.start_command).await?;
        
        let transport = McpTransport::Stdio { process };
        self.register_server_instance(config, vm, transport).await
    }
    
    pub async fn start_sse_server(&mut self, config: McpServerConfig) -> Result<(), McpError> {
        let vm_config = VMConfig {
            memory_mb: 256,
            cpu_limit: 1.0,
            network_enabled: true,
            port_mapping: vec![(config.port, config.port)],
            root_fs: config.container_image.clone(),
        };
        
        let vm = self.vm_pool.acquire_vm(vm_config).await?;
        vm.exec_command(&config.start_command).await?;
        
        // Wait for server to be ready
        self.wait_for_server_ready(&config).await?;
        
        let transport = McpTransport::SSE {
            endpoint: format!("http://127.0.0.1:{}/events", config.port),
            client: reqwest::Client::new(),
            event_stream: None,
        };
        
        self.register_server_instance(config, vm, transport).await
    }
}
```

### Tool Execution Security
```rust
// ✅ Secure tool call execution with validation
impl SecureMcpRegistry {
    pub async fn execute_tool_call(&self, tool_call: &ToolCall) -> Result<String, McpError> {
        // 1. Validate tool exists and is permitted
        let tool = self.validate_tool_access(&tool_call.function.name)?;
        
        // 2. Parse and validate arguments
        let args = self.parse_tool_arguments(&tool_call.function.arguments)?;
        self.validate_tool_arguments(&tool, &args)?;
        
        // 3. Apply security policies
        self.security_policies.validate_tool_execution(&tool, &args)?;
        
        // 4. Execute with timeout and resource limits
        let result = tokio::time::timeout(
            Duration::from_secs(30),
            self.execute_tool_in_sandbox(&tool, &args)
        ).await
        .map_err(|_| McpError::ExecutionTimeout)??;
        
        // 5. Validate and sanitize output
        self.sanitize_tool_output(result)
    }
    
    fn validate_tool_arguments(&self, tool: &McpTool, args: &serde_json::Value) -> Result<(), McpError> {
        // JSON schema validation
        let validator = jsonschema::JSONSchema::compile(&tool.schema)
            .map_err(|e| McpError::SchemaValidation(e.to_string()))?;
            
        if !validator.is_valid(args) {
            return Err(McpError::InvalidArguments(
                validator.validate(args)
                    .unwrap_err()
                    .collect::<Vec<_>>()
                    .iter()
                    .map(|e| e.to_string())
                    .collect::<Vec<_>>()
                    .join(", ")
            ));
        }
        
        // Additional safety checks
        self.check_argument_safety(args)?;
        
        Ok(())
    }
}
```

## RAG Integration Standards

### Document Storage and Retrieval
```rust
// ✅ RAG service with PGLite integration
pub struct RagService {
    config: RagConfig,
    embedding_service: Box<dyn EmbeddingService>,
    vector_store: Box<dyn VectorStore>,
}

#[derive(Debug, Clone)]
pub struct RagConfig {
    pub max_documents: usize,
    pub relevance_threshold: f32,
    pub max_context_tokens: usize,
    pub embedding_model: String,
    pub rerank_enabled: bool,
}

impl RagService {
    // ✅ Context retrieval with proper ranking
    pub async fn retrieve_context(
        &self, 
        query: &str, 
        user_id: Option<&str>
    ) -> Result<RagContext, RagError> {
        
        // 1. Generate query embedding
        let query_embedding = self.embedding_service
            .generate_embedding(query)
            .await?;
            
        // 2. Vector similarity search
        let candidates = self.vector_store
            .similarity_search(&query_embedding, self.config.max_documents * 2)
            .await?;
            
        // 3. Filter by user permissions and threshold
        let filtered = candidates.into_iter()
            .filter(|doc| doc.relevance_score >= self.config.relevance_threshold)
            .filter(|doc| self.check_user_access(doc, user_id))
            .collect::<Vec<_>>();
            
        // 4. Re-rank if enabled
        let documents = if self.config.rerank_enabled {
            self.rerank_documents(query, filtered).await?
        } else {
            filtered
        };
        
        // 5. Apply token limits
        let final_docs = self.apply_token_limits(documents)?;
        
        Ok(RagContext {
            documents: final_docs,
            query: query.to_string(),
            relevance_scores: vec![], // Populated from documents
            total_tokens: self.calculate_context_tokens(&final_docs),
        })
    }
    
    // ✅ Context injection into chat messages
    pub fn enhance_messages_with_context(
        &self, 
        messages: &mut Vec<ChatMessage>, 
        context: &RagContext
    ) {
        if context.documents.is_empty() {
            return;
        }
        
        let context_content = self.format_rag_context(context);
        
        let rag_message = ChatMessage {
            role: "system".to_string(),
            content: Some(context_content),
            tool_calls: None,
            tool_call_id: None,
            name: Some("rag_context".to_string()),
        };
        
        // Insert after existing system messages but before user messages
        let insert_pos = messages.iter()
            .position(|msg| msg.role == "user")
            .unwrap_or(messages.len());
            
        messages.insert(insert_pos, rag_message);
        
        log::info!("Enhanced messages with {} RAG documents", context.documents.len());
    }
}
```

### Document Processing Pipeline
```rust
// ✅ Document ingestion with proper processing
impl RagService {
    pub async fn store_document(
        &self, 
        document: Document, 
        user_id: Option<&str>
    ) -> Result<String, RagError> {
        
        // 1. Text extraction and cleaning
        let clean_text = self.clean_document_text(&document.content)?;
        
        // 2. Chunking with overlap
        let chunks = self.chunk_document(&clean_text, 512, 50)?;
        
        // 3. Generate embeddings for each chunk
        let mut chunk_embeddings = Vec::new();
        for chunk in &chunks {
            let embedding = self.embedding_service
                .generate_embedding(chunk)
                .await?;
            chunk_embeddings.push(embedding);
        }
        
        // 4. Store in vector database with metadata
        for (i, (chunk, embedding)) in chunks.iter().zip(chunk_embeddings.iter()).enumerate() {
            let chunk_doc = Document {
                id: format!("{}_{}", document.id, i),
                title: document.title.clone(),
                content: chunk.clone(),
                metadata: serde_json::json!({
                    "parent_id": document.id,
                    "chunk_index": i,
                    "user_id": user_id,
                    "source": document.metadata.get("source"),
                    "created_at": document.created_at,
                }),
                embedding: Some(embedding.clone()),
                created_at: document.created_at,
            };
            
            self.vector_store.store_document(chunk_doc).await?;
        }
        
        log::info!("Stored document {} in {} chunks", document.id, chunks.len());
        Ok(document.id)
    }
}
```

## AI Streaming Support

### Server-Sent Events Implementation
```rust
// ✅ Streaming response for real-time AI interaction
use axum::{
    response::{Response, Sse},
    extract::Path,
};
use futures::stream::{self, Stream};

pub async fn ai_stream_handler(
    Path(model): Path<String>,
    Json(request): Json<ChatCompletionRequest>,
) -> Result<Sse<impl Stream<Item = Result<Event, axum::Error>>>, StatusCode> {
    
    let response_stream = stream::unfold(
        (request, model),
        |(mut req, model)| async move {
            // Generate streaming response chunks
            match generate_stream_chunk(&mut req, &model).await {
                Ok(Some(chunk)) => {
                    let event = Event::default()
                        .data(serde_json::to_string(&chunk).unwrap_or_default());
                    Some((Ok(event), (req, model)))
                }
                Ok(None) => {
                    // End of stream
                    let event = Event::default().data("[DONE]");
                    Some((Ok(event), (req, model)))
                }
                Err(e) => {
                    let error_event = Event::default()
                        .event("error")
                        .data(format!("Error: {}", e));
                    Some((Err(axum::Error::new(e)), (req, model)))
                }
            }
        }
    );
    
    Ok(Sse::new(response_stream)
        .keep_alive(
            axum::response::sse::KeepAlive::new()
                .interval(Duration::from_secs(1))
                .text("keep-alive-text"),
        ))
}
```

## Error Handling Standards

### AI/MCP Error Types
```rust
// ✅ Comprehensive error handling for AI operations
#[derive(thiserror::Error, Debug)]
pub enum AiError {
    #[error("Model not available: {model}")]
    ModelUnavailable { model: String },
    
    #[error("Token limit exceeded: {used}/{max}")]
    TokenLimitExceeded { used: usize, max: usize },
    
    #[error("RAG context retrieval failed: {0}")]
    RagError(#[from] RagError),
    
    #[error("MCP tool execution failed: {0}")]
    McpError(#[from] McpError),
    
    #[error("Invalid request format: {0}")]
    InvalidRequest(String),
}

#[derive(thiserror::Error, Debug)]
pub enum McpError {
    #[error("Tool not found: {0}")]
    ToolNotFound(String),
    
    #[error("Execution timeout")]
    ExecutionTimeout,
    
    #[error("Security policy violation: {0}")]
    SecurityViolation(String),
    
    #[error("Sandbox initialization failed: {0}")]
    SandboxError(String),
}
```

## Performance and Monitoring

### Metrics Collection
```rust
// ✅ Comprehensive metrics for AI operations
pub struct AiMetrics {
    pub request_count: prometheus::Counter,
    pub response_time: prometheus::Histogram,
    pub token_usage: prometheus::Histogram,
    pub tool_calls: prometheus::Counter,
    pub rag_retrievals: prometheus::Counter,
    pub error_count: prometheus::CounterVec,
}

impl AiMetrics {
    pub fn record_request(&self, duration: Duration, tokens: usize, model: &str) {
        self.request_count.inc();
        self.response_time.observe(duration.as_secs_f64());
        self.token_usage.observe(tokens as f64);
        
        log::info!(
            model = model,
            duration_ms = duration.as_millis(),
            tokens = tokens,
            "AI request completed"
        );
    }
}
```