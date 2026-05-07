//! Error types for coworker-core

use thiserror::Error;

#[derive(Error, Debug)]
pub enum CoreError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Database error: {0}")]
    Database(#[from] rusqlite::Error),

    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),

    #[error("Path not found: {0}")]
    PathNotFound(String),

    #[error("Invalid pattern: {0}")]
    InvalidPattern(String),

    #[error("Search error: {0}")]
    Search(String),
}

pub type Result<T> = std::result::Result<T, CoreError>;
