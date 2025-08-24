use tuono_lib::Request;
use tuono_lib::axum::http::StatusCode;

#[tuono_lib::api(GET)]
pub async fn health_check(_req: Request) -> StatusCode {
    // Use shared handler logic
    match shared_handlers::health_check_handler().await {
        Ok(status) => status,
        Err(status) => status
    }
}
