// AI/LLM-specific handlers compatible with assistant-ui and ag-ui
use axum::{extract::Json, http::StatusCode, response::Json as AxumJson, response::Response};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

// OpenAI-compatible request/response types for assistant-ui/ag-ui with tool calling
#[derive(Debug, Deserialize)]
pub struct ChatCompletionRequest {
    pub model: String,
    pub messages: Vec<ChatMessage>,
    pub temperature: Option<f32>,
    pub max_tokens: Option<u32>,
    pub stream: Option<bool>,
    pub tools: Option<Vec<Tool>>,
    pub tool_choice: Option<ToolChoice>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct Tool {
    pub r#type: String, // "function"
    pub function: FunctionDefinition,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct FunctionDefinition {
    pub name: String,
    pub description: String,
    pub parameters: serde_json::Value, // JSON schema
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(untagged)]
pub enum ToolChoice {
    Auto(String), // "auto", "none", "required"
    Function {
        r#type: String,
        function: FunctionChoice,
    },
}

#[derive(Debug, Deserialize, Serialize)]
pub struct FunctionChoice {
    pub name: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ChatMessage {
    pub role: String, // "system", "user", "assistant", "tool"
    pub content: Option<String>,
    pub tool_calls: Option<Vec<ToolCall>>,
    pub tool_call_id: Option<String>,
    pub name: Option<String>, // For tool messages
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ToolCall {
    pub id: String,
    pub r#type: String, // "function"
    pub function: FunctionCall,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct FunctionCall {
    pub name: String,
    pub arguments: String, // JSON string
}

#[derive(Debug, Serialize)]
pub struct ChatCompletionResponse {
    pub id: String,
    pub object: String,
    pub created: u64,
    pub model: String,
    pub choices: Vec<ChatChoice>,
    pub usage: Usage,
}

#[derive(Debug, Serialize)]
pub struct ChatChoice {
    pub index: u32,
    pub message: ChatMessage,
    pub finish_reason: String, // "stop", "length", "tool_calls", "content_filter"
}

#[derive(Debug, Serialize)]
pub struct Usage {
    pub prompt_tokens: u32,
    pub completion_tokens: u32,
    pub total_tokens: u32,
}

// OpenAI-compatible chat completions endpoint with tool calling and RAG support
pub async fn chat_completions_handler(
    Json(mut request): Json<ChatCompletionRequest>,
) -> Result<AxumJson<ChatCompletionResponse>, StatusCode> {
    log::info!(
        "🤖 OpenAI-compatible chat completion request: model={}, messages={}, tools={}",
        request.model,
        request.messages.len(),
        request.tools.as_ref().map(|t| t.len()).unwrap_or(0)
    );

    // Initialize services
    crate::mcp::initialize_default_mcp_servers();
    crate::rag::initialize_rag_service();

    let mcp_registry = crate::mcp::get_mcp_registry();
    let rag_service = crate::rag::get_rag_service();

    // Extract user query for RAG (clone to avoid borrow checker issues)
    let user_query = request
        .messages
        .iter()
        .filter(|msg| msg.role == "user")
        .last()
        .and_then(|msg| msg.content.as_ref())
        .map_or(String::new(), |v| v.clone());

    // Enhance messages with RAG context if there's a user query
    if !user_query.is_empty() {
        if let Ok(rag_context) = rag_service.retrieve_context(&user_query, None).await {
            rag_service.enhance_messages_with_context(&mut request.messages, &rag_context);
        }
    }

    // Check if this is a tool call response or if we need to make tool calls
    let has_tool_call_response = request.messages.iter().any(|msg| msg.role == "tool");

    // If no tools specified, add available MCP tools
    let available_tools = if request.tools.is_none() {
        let mcp_tools = mcp_registry.get_available_tools();
        if !mcp_tools.is_empty() {
            request.tools = Some(mcp_tools);
        }
        request.tools.as_ref()
    } else {
        request.tools.as_ref()
    };

    // Determine if we should make a tool call (mock logic for now)
    let should_call_tool = available_tools.is_some()
        && !has_tool_call_response
        && (user_query.contains("search")
            || user_query.contains("file")
            || user_query.contains("read"));

    let response = if should_call_tool && available_tools.is_some() {
        // Generate a tool call response
        let tool_calls = vec![ToolCall {
            id: format!("call_{}", chrono::Utc::now().timestamp()),
            r#type: "function".to_string(),
            function: FunctionCall {
                name: if user_query.contains("search") {
                    "search_web"
                } else {
                    "read_file"
                }
                .to_string(),
                arguments: if user_query.contains("search") {
                    serde_json::json!({"query": &user_query, "max_results": 3}).to_string()
                } else {
                    serde_json::json!({"path": "/example/file.txt"}).to_string()
                },
            },
        }];

        let response_message = ChatMessage {
            role: "assistant".to_string(),
            content: None,
            tool_calls: Some(tool_calls),
            tool_call_id: None,
            name: None,
        };

        ChatCompletionResponse {
            id: format!("chatcmpl-{}", chrono::Utc::now().timestamp()),
            object: "chat.completion".to_string(),
            created: chrono::Utc::now().timestamp() as u64,
            model: request.model.clone(),
            choices: vec![ChatChoice {
                index: 0,
                message: response_message,
                finish_reason: "tool_calls".to_string(),
            }],
            usage: Usage {
                prompt_tokens: calculate_tokens(&request.messages),
                completion_tokens: 25,
                total_tokens: calculate_tokens(&request.messages) + 25,
            },
        }
    } else {
        // Generate a regular text response
        let context_info = if request
            .messages
            .iter()
            .any(|msg| msg.name == Some("rag_context".to_string()))
        {
            " (Enhanced with RAG context from your documents)"
        } else {
            ""
        };

        let tool_info = if available_tools.is_some() {
            format!(
                " {} MCP tools are available.",
                available_tools.unwrap().len()
            )
        } else {
            String::new()
        };

        let response_message = ChatMessage {
            role: "assistant".to_string(),
            content: Some(format!(
                "This is a response from the shared Rust handler with full tool calling and RAG support. \
                 You sent {} messages to model '{}'.{}{} \
                 This response is compatible with assistant-ui and ag-ui.",
                request.messages.len(),
                request.model,
                context_info,
                tool_info
            )),
            tool_calls: None,
            tool_call_id: None,
            name: None,
        };

        ChatCompletionResponse {
            id: format!("chatcmpl-{}", chrono::Utc::now().timestamp()),
            object: "chat.completion".to_string(),
            created: chrono::Utc::now().timestamp() as u64,
            model: request.model.clone(),
            choices: vec![ChatChoice {
                index: 0,
                message: response_message,
                finish_reason: "stop".to_string(),
            }],
            usage: Usage {
                prompt_tokens: calculate_tokens(&request.messages),
                completion_tokens: 75,
                total_tokens: calculate_tokens(&request.messages) + 75,
            },
        }
    };

    Ok(AxumJson(response))
}

// Helper function to calculate tokens (rough estimation)
fn calculate_tokens(messages: &[ChatMessage]) -> u32 {
    messages
        .iter()
        .map(|msg| {
            let content_tokens = msg
                .content
                .as_ref()
                .map(|c| c.len() as u32 / 4)
                .unwrap_or(0);
            let tool_tokens = msg
                .tool_calls
                .as_ref()
                .map(|calls| calls.len() as u32 * 10)
                .unwrap_or(0);
            content_tokens + tool_tokens
        })
        .sum()
}

// Legacy AI chat handler (for backward compatibility)
pub async fn ai_chat_handler() -> Result<AxumJson<Value>, StatusCode> {
    log::info!("🤖 Legacy AI chat request received (shared handler)");

    let response = json!({
        "response": "AI chat response from shared handler",
        "model": "gpt-4",
        "streaming": false,
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "source": "Shared Rust Library"
    });

    Ok(AxumJson(response))
}

// AI streaming handler (placeholder for now)
pub async fn ai_stream_handler() -> Result<Response, StatusCode> {
    log::info!("🤖 AI stream request received (shared handler)");

    use axum::body::Body;

    let response = Response::builder()
        .header("content-type", "text/event-stream")
        .header("cache-control", "no-cache")
        .header("connection", "keep-alive")
        .body(Body::from(
            "data: {\"message\": \"AI streaming from shared handler\"}\n\n",
        ))
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(response)
}

// AI health check
pub async fn ai_health_handler() -> Result<StatusCode, StatusCode> {
    log::info!("🤖 AI health check (shared handler)");
    Ok(StatusCode::OK)
}
