//! Coworker CLI - Run the Rust backend server

use clap::Parser;
use std::net::SocketAddr;
use tracing::info;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[derive(Parser, Debug)]
#[command(name = "coworker")]
#[command(about = "Coworker - AI Coding Assistant Backend Server")]
struct Args {
    /// Port to listen on
    #[arg(short, long, default_value = "3141")]
    port: u16,

    /// Host to bind to
    #[arg(long, default_value = "127.0.0.1")]
    host: String,

    /// Data directory for sessions and config
    #[arg(short, long)]
    data_dir: Option<String>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize logging
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "coworker=info,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let args = Args::parse();

    // Determine data directory
    let data_dir = args.data_dir.unwrap_or_else(|| {
        dirs::data_dir()
            .map(|d| d.join("coworker").to_string_lossy().to_string())
            .unwrap_or_else(|| "./coworker-data".to_string())
    });

    // Ensure data directory exists
    std::fs::create_dir_all(&data_dir)?;
    info!("Data directory: {}", data_dir);

    // Initialize app state
    let state = coworker_server::AppState::new(&data_dir)?;

    // Start server
    let addr: SocketAddr = format!("{}:{}", args.host, args.port).parse()?;
    info!("Starting Coworker server on http://{}", addr);

    coworker_server::run(addr, state).await
}
