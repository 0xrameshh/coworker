//! Application state

use coworker_core::session::SessionStore;
use std::sync::{Arc, Mutex};

#[derive(Clone)]
pub struct AppState {
    pub session_store: Arc<Mutex<SessionStore>>,
    pub data_dir: String,
}

impl AppState {
    pub fn new(data_dir: &str) -> anyhow::Result<Self> {
        let db_path = format!("{}/sessions.db", data_dir);
        let session_store = SessionStore::new(&db_path)?;

        Ok(Self {
            session_store: Arc::new(Mutex::new(session_store)),
            data_dir: data_dir.to_string(),
        })
    }
}
