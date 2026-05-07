//! Coworker Server - HTTP API for Electron bridge

pub mod routes;
pub mod state;

use axum::{routing::get, Router};
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing::info;

pub use state::AppState;

/// Build the Axum router with all routes
pub fn build_router(state: AppState) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    Router::new()
        .route("/health", get(|| async { "ok" }))
        .nest("/api", routes::api_routes())
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(state)
}

/// Start the server
pub async fn run(addr: SocketAddr, state: AppState) -> anyhow::Result<()> {
    let app = build_router(state);

    info!("Starting coworker-server on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
