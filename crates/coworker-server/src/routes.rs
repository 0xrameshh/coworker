//! API routes for Coworker

use axum::{
    extract::{Path, State},
    routing::{get, post, delete},
    Json, Router,
};
use coworker_core::{files, search};
use serde::{Deserialize, Serialize};

use crate::AppState;

pub fn api_routes() -> Router<AppState> {
    Router::new()
        // File operations
        .route("/files/list", post(list_files))
        .route("/files/read", post(read_file))
        .route("/files/write", post(write_file))
        .route("/files/glob", post(glob_files))
        // Search
        .route("/search", post(search_files))
        .route("/search/find", post(find_files))
        // Sessions
        .route("/sessions", get(list_sessions))
        .route("/sessions", post(create_session))
        .route("/sessions/{id}", get(get_session))
        .route("/sessions/{id}", delete(delete_session))
        .route("/sessions/{id}/messages", get(get_messages))
}

// ============ Request/Response Types ============

#[derive(Deserialize)]
pub struct ListFilesRequest {
    pub root: String,
    pub max_depth: Option<usize>,
}

#[derive(Deserialize)]
pub struct ReadFileRequest {
    pub path: String,
    pub start: Option<usize>,
    pub end: Option<usize>,
}

#[derive(Deserialize)]
pub struct WriteFileRequest {
    pub path: String,
    pub content: String,
}

#[derive(Deserialize)]
pub struct GlobRequest {
    pub root: String,
    pub pattern: String,
}

#[derive(Deserialize)]
pub struct SearchRequest {
    pub root: String,
    pub pattern: String,
    pub case_sensitive: Option<bool>,
    pub max_results: Option<usize>,
    pub file_pattern: Option<String>,
}

#[derive(Deserialize)]
pub struct FindFilesRequest {
    pub root: String,
    pub pattern: String,
    pub max_results: Option<usize>,
}

#[derive(Deserialize)]
pub struct CreateSessionRequest {
    pub title: String,
    pub cwd: Option<String>,
}

#[derive(Serialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<T>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

impl<T> ApiResponse<T> {
    pub fn ok(data: T) -> Json<Self> {
        Json(Self {
            success: true,
            data: Some(data),
            error: None,
        })
    }

    pub fn err(error: impl ToString) -> Json<Self> {
        Json(Self {
            success: false,
            data: None,
            error: Some(error.to_string()),
        })
    }
}

// ============ Handlers ============

async fn list_files(
    Json(req): Json<ListFilesRequest>,
) -> Json<ApiResponse<Vec<files::FileInfo>>> {
    match files::list_files(&req.root, req.max_depth) {
        Ok(files) => ApiResponse::ok(files),
        Err(e) => ApiResponse::err(e),
    }
}

async fn read_file(
    Json(req): Json<ReadFileRequest>,
) -> Json<ApiResponse<files::FileContent>> {
    let result = match (req.start, req.end) {
        (Some(start), Some(end)) => files::read_file_range(&req.path, start, end),
        _ => files::read_file(&req.path),
    };

    match result {
        Ok(content) => ApiResponse::ok(content),
        Err(e) => ApiResponse::err(e),
    }
}

async fn write_file(
    Json(req): Json<WriteFileRequest>,
) -> Json<ApiResponse<()>> {
    match files::write_file(&req.path, &req.content) {
        Ok(()) => ApiResponse::ok(()),
        Err(e) => ApiResponse::err(e),
    }
}

async fn glob_files(
    Json(req): Json<GlobRequest>,
) -> Json<ApiResponse<Vec<String>>> {
    match files::glob_files(&req.root, &req.pattern) {
        Ok(files) => ApiResponse::ok(files),
        Err(e) => ApiResponse::err(e),
    }
}

async fn search_files(
    Json(req): Json<SearchRequest>,
) -> Json<ApiResponse<search::SearchResult>> {
    let options = search::SearchOptions {
        case_sensitive: req.case_sensitive.unwrap_or(false),
        max_results: req.max_results,
        file_pattern: req.file_pattern,
        context_lines: 0,
    };

    match search::search(&req.root, &req.pattern, options) {
        Ok(result) => ApiResponse::ok(result),
        Err(e) => ApiResponse::err(e),
    }
}

async fn find_files(
    Json(req): Json<FindFilesRequest>,
) -> Json<ApiResponse<Vec<String>>> {
    match search::find_files(&req.root, &req.pattern, req.max_results) {
        Ok(files) => ApiResponse::ok(files),
        Err(e) => ApiResponse::err(e),
    }
}

async fn list_sessions(
    State(state): State<AppState>,
) -> Json<ApiResponse<Vec<coworker_core::session::Session>>> {
    let store = state.session_store.lock().unwrap();
    match store.list_sessions() {
        Ok(sessions) => ApiResponse::ok(sessions),
        Err(e) => ApiResponse::err(e),
    }
}

async fn create_session(
    State(state): State<AppState>,
    Json(req): Json<CreateSessionRequest>,
) -> Json<ApiResponse<coworker_core::session::Session>> {
    let store = state.session_store.lock().unwrap();
    match store.create_session(&req.title, req.cwd.as_deref()) {
        Ok(session) => ApiResponse::ok(session),
        Err(e) => ApiResponse::err(e),
    }
}

async fn get_session(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Json<ApiResponse<Option<coworker_core::session::Session>>> {
    let store = state.session_store.lock().unwrap();
    match store.get_session(&id) {
        Ok(session) => ApiResponse::ok(session),
        Err(e) => ApiResponse::err(e),
    }
}

async fn delete_session(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Json<ApiResponse<()>> {
    let store = state.session_store.lock().unwrap();
    match store.delete_session(&id) {
        Ok(()) => ApiResponse::ok(()),
        Err(e) => ApiResponse::err(e),
    }
}

async fn get_messages(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Json<ApiResponse<Vec<coworker_core::session::Message>>> {
    let store = state.session_store.lock().unwrap();
    match store.get_messages(&id) {
        Ok(messages) => ApiResponse::ok(messages),
        Err(e) => ApiResponse::err(e),
    }
}
