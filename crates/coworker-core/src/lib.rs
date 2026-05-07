//! Coworker Core Library
//!
//! High-performance Rust implementations for:
//! - File operations (read, write, search)
//! - Code indexing and search
//! - Session management
//! - Syntax highlighting

pub mod error;
pub mod files;
pub mod search;
pub mod session;

pub use error::{CoreError, Result};
