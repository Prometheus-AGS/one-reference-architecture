use tuono_lib::{Request, axum::{Json, http::StatusCode}};

#[tuono_lib::api(POST)]
pub async fn completions(
    Json(request): Json<shared_handlers::ai::ChatCompletionRequest>,
) -> Result<Json<shared_handlers::ai::ChatCompletionResponse>, StatusCode> {
    // Use shared OpenAI-compatible handler
    match shared_handlers::ai::chat_completions_handler(Json(request)).await {
        Ok(response) => Ok(Json(response.0)), // Extract inner value from AxumJson
        Err(status) => Err(status)
    }
}