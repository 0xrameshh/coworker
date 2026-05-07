use napi::Error as NapiError;
use napi_derive::napi;
use rusqlite::{Connection, params};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;

// Global database connection (lazy initialized)
lazy_static::lazy_static! {
    static ref DB: Mutex<Option<Connection>> = Mutex::new(None);
}

fn get_db_path() -> PathBuf {
    let home = dirs::home_dir().unwrap_or_default();
    home.join(".coworker").join("search.db")
}

fn ensure_db() -> Result<(), NapiError> {
    let mut db_lock = DB.lock().map_err(|e| NapiError::from_reason(e.to_string()))?;
    if db_lock.is_none() {
        let db_path = get_db_path();
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| NapiError::from_reason(e.to_string()))?;
        }
        let conn = Connection::open(&db_path).map_err(|e| NapiError::from_reason(e.to_string()))?;
        init_schema(&conn)?;
        *db_lock = Some(conn);
    }
    Ok(())
}

fn init_schema(conn: &Connection) -> Result<(), NapiError> {
    // Main messages table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            metadata TEXT
        )",
        [],
    ).map_err(|e| NapiError::from_reason(e.to_string()))?;

    // FTS5 virtual table for full-text search
    conn.execute(
        "CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(
            id,
            session_id,
            role,
            content,
            content='messages',
            content_rowid='rowid'
        )",
        [],
    ).map_err(|e| NapiError::from_reason(e.to_string()))?;

    // Triggers to keep FTS in sync
    conn.execute_batch(
        "CREATE TRIGGER IF NOT EXISTS messages_ai AFTER INSERT ON messages BEGIN
            INSERT INTO messages_fts(rowid, id, session_id, role, content)
            VALUES (new.rowid, new.id, new.session_id, new.role, new.content);
        END;
        CREATE TRIGGER IF NOT EXISTS messages_ad AFTER DELETE ON messages BEGIN
            INSERT INTO messages_fts(messages_fts, rowid, id, session_id, role, content)
            VALUES ('delete', old.rowid, old.id, old.session_id, old.role, old.content);
        END;
        CREATE TRIGGER IF NOT EXISTS messages_au AFTER UPDATE ON messages BEGIN
            INSERT INTO messages_fts(messages_fts, rowid, id, session_id, role, content)
            VALUES ('delete', old.rowid, old.id, old.session_id, old.role, old.content);
            INSERT INTO messages_fts(rowid, id, session_id, role, content)
            VALUES (new.rowid, new.id, new.session_id, new.role, new.content);
        END;"
    ).map_err(|e| NapiError::from_reason(e.to_string()))?;

    // Sessions table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            cwd TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            summary TEXT,
            tags TEXT
        )",
        [],
    ).map_err(|e| NapiError::from_reason(e.to_string()))?;

    // Index for fast session lookups
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id)",
        [],
    ).map_err(|e| NapiError::from_reason(e.to_string()))?;

    Ok(())
}

#[derive(Serialize, Deserialize)]
#[napi(object)]
pub struct SearchResult {
    pub id: String,
    pub session_id: String,
    pub role: String,
    pub content: String,
    pub snippet: String,
    pub rank: f64,
    pub timestamp: i64,
}

#[derive(Serialize, Deserialize)]
#[napi(object)]
pub struct MessageInput {
    pub id: String,
    pub session_id: String,
    pub role: String,
    pub content: String,
    pub timestamp: i64,
    pub metadata: Option<String>,
}

#[derive(Serialize, Deserialize)]
#[napi(object)]
pub struct SessionInput {
    pub id: String,
    pub title: String,
    pub cwd: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

/// Initialize the search database
#[napi]
pub fn search_init() -> napi::Result<bool> {
    ensure_db()?;
    Ok(true)
}

/// Index a message for search
#[napi]
pub fn search_index_message(message: MessageInput) -> napi::Result<bool> {
    ensure_db()?;
    let db_lock = DB.lock().map_err(|e| NapiError::from_reason(e.to_string()))?;
    let conn = db_lock.as_ref().ok_or_else(|| NapiError::from_reason("Database not initialized"))?;

    conn.execute(
        "INSERT OR REPLACE INTO messages (id, session_id, role, content, timestamp, metadata)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            message.id,
            message.session_id,
            message.role,
            message.content,
            message.timestamp,
            message.metadata
        ],
    ).map_err(|e| NapiError::from_reason(e.to_string()))?;

    Ok(true)
}

/// Index multiple messages at once (faster for batch operations)
#[napi]
pub fn search_index_messages(messages: Vec<MessageInput>) -> napi::Result<i32> {
    ensure_db()?;
    let db_lock = DB.lock().map_err(|e| NapiError::from_reason(e.to_string()))?;
    let conn = db_lock.as_ref().ok_or_else(|| NapiError::from_reason("Database not initialized"))?;

    let mut count = 0;
    for message in messages {
        conn.execute(
            "INSERT OR REPLACE INTO messages (id, session_id, role, content, timestamp, metadata)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                message.id,
                message.session_id,
                message.role,
                message.content,
                message.timestamp,
                message.metadata
            ],
        ).map_err(|e| NapiError::from_reason(e.to_string()))?;
        count += 1;
    }

    Ok(count)
}

/// Full-text search across all messages
#[napi]
pub fn search_messages(
    query: String,
    limit: Option<i32>,
    session_id: Option<String>,
) -> napi::Result<Vec<SearchResult>> {
    ensure_db()?;
    let db_lock = DB.lock().map_err(|e| NapiError::from_reason(e.to_string()))?;
    let conn = db_lock.as_ref().ok_or_else(|| NapiError::from_reason("Database not initialized"))?;

    let limit = limit.unwrap_or(20);

    // Helper to map row to SearchResult
    fn map_row(row: &rusqlite::Row) -> rusqlite::Result<SearchResult> {
        Ok(SearchResult {
            id: row.get(0)?,
            session_id: row.get(1)?,
            role: row.get(2)?,
            content: row.get(3)?,
            timestamp: row.get(4)?,
            snippet: row.get(5)?,
            rank: row.get(6)?,
        })
    }

    if let Some(sid) = session_id {
        let sql = "SELECT
            m.id, m.session_id, m.role, m.content, m.timestamp,
            snippet(messages_fts, 3, '<mark>', '</mark>', '...', 32) as snippet,
            bm25(messages_fts) as rank
         FROM messages_fts
         JOIN messages m ON messages_fts.rowid = m.rowid
         WHERE messages_fts MATCH ?1 AND m.session_id = ?2
         ORDER BY rank
         LIMIT ?3";
        let mut stmt = conn.prepare(sql).map_err(|e| NapiError::from_reason(e.to_string()))?;
        let results: Vec<SearchResult> = stmt.query_map(params![query, sid, limit], map_row)
            .map_err(|e| NapiError::from_reason(e.to_string()))?
            .filter_map(|r| r.ok())
            .collect();
        Ok(results)
    } else {
        let sql = "SELECT
            m.id, m.session_id, m.role, m.content, m.timestamp,
            snippet(messages_fts, 3, '<mark>', '</mark>', '...', 32) as snippet,
            bm25(messages_fts) as rank
         FROM messages_fts
         JOIN messages m ON messages_fts.rowid = m.rowid
         WHERE messages_fts MATCH ?1
         ORDER BY rank
         LIMIT ?2";
        let mut stmt = conn.prepare(sql).map_err(|e| NapiError::from_reason(e.to_string()))?;
        let results: Vec<SearchResult> = stmt.query_map(params![query, limit], map_row)
            .map_err(|e| NapiError::from_reason(e.to_string()))?
            .filter_map(|r| r.ok())
            .collect();
        Ok(results)
    }
}

/// Get recent messages for context
#[napi]
pub fn search_get_context(
    session_id: String,
    limit: Option<i32>,
) -> napi::Result<Vec<SearchResult>> {
    ensure_db()?;
    let db_lock = DB.lock().map_err(|e| NapiError::from_reason(e.to_string()))?;
    let conn = db_lock.as_ref().ok_or_else(|| NapiError::from_reason("Database not initialized"))?;

    let limit = limit.unwrap_or(50);

    let mut stmt = conn.prepare(
        "SELECT id, session_id, role, content, timestamp, '' as snippet, 0.0 as rank
         FROM messages
         WHERE session_id = ?1
         ORDER BY timestamp DESC
         LIMIT ?2"
    ).map_err(|e| NapiError::from_reason(e.to_string()))?;

    let results: Vec<SearchResult> = stmt
        .query_map(params![session_id, limit], |row| {
            Ok(SearchResult {
                id: row.get(0)?,
                session_id: row.get(1)?,
                role: row.get(2)?,
                content: row.get(3)?,
                timestamp: row.get(4)?,
                snippet: row.get(5)?,
                rank: row.get(6)?,
            })
        })
        .map_err(|e| NapiError::from_reason(e.to_string()))?
        .filter_map(|r| r.ok())
        .collect();

    Ok(results)
}

/// Find similar messages using FTS5 ranking
#[napi]
pub fn search_find_similar(
    content: String,
    limit: Option<i32>,
    exclude_session: Option<String>,
) -> napi::Result<Vec<SearchResult>> {
    ensure_db()?;
    let db_lock = DB.lock().map_err(|e| NapiError::from_reason(e.to_string()))?;
    let conn = db_lock.as_ref().ok_or_else(|| NapiError::from_reason("Database not initialized"))?;

    let limit = limit.unwrap_or(10);

    // Extract keywords from content for similarity search
    let keywords: Vec<&str> = content
        .split_whitespace()
        .filter(|w| w.len() > 3)
        .take(10)
        .collect();

    if keywords.is_empty() {
        return Ok(Vec::new());
    }

    let query = keywords.join(" OR ");

    // Helper to map row to SearchResult
    fn map_row(row: &rusqlite::Row) -> rusqlite::Result<SearchResult> {
        Ok(SearchResult {
            id: row.get(0)?,
            session_id: row.get(1)?,
            role: row.get(2)?,
            content: row.get(3)?,
            timestamp: row.get(4)?,
            snippet: row.get(5)?,
            rank: row.get(6)?,
        })
    }

    if let Some(exclude) = exclude_session {
        let sql = "SELECT
            m.id, m.session_id, m.role, m.content, m.timestamp,
            snippet(messages_fts, 3, '<mark>', '</mark>', '...', 32) as snippet,
            bm25(messages_fts) as rank
         FROM messages_fts
         JOIN messages m ON messages_fts.rowid = m.rowid
         WHERE messages_fts MATCH ?1 AND m.session_id != ?2
         ORDER BY rank
         LIMIT ?3";
        let mut stmt = conn.prepare(sql).map_err(|e| NapiError::from_reason(e.to_string()))?;
        let results: Vec<SearchResult> = stmt.query_map(params![query, exclude, limit], map_row)
            .map_err(|e| NapiError::from_reason(e.to_string()))?
            .filter_map(|r| r.ok())
            .collect();
        Ok(results)
    } else {
        let sql = "SELECT
            m.id, m.session_id, m.role, m.content, m.timestamp,
            snippet(messages_fts, 3, '<mark>', '</mark>', '...', 32) as snippet,
            bm25(messages_fts) as rank
         FROM messages_fts
         JOIN messages m ON messages_fts.rowid = m.rowid
         WHERE messages_fts MATCH ?1
         ORDER BY rank
         LIMIT ?2";
        let mut stmt = conn.prepare(sql).map_err(|e| NapiError::from_reason(e.to_string()))?;
        let results: Vec<SearchResult> = stmt.query_map(params![query, limit], map_row)
            .map_err(|e| NapiError::from_reason(e.to_string()))?
            .filter_map(|r| r.ok())
            .collect();
        Ok(results)
    }
}

/// Delete messages for a session
#[napi]
pub fn search_delete_session(session_id: String) -> napi::Result<i32> {
    ensure_db()?;
    let db_lock = DB.lock().map_err(|e| NapiError::from_reason(e.to_string()))?;
    let conn = db_lock.as_ref().ok_or_else(|| NapiError::from_reason("Database not initialized"))?;

    let count = conn.execute(
        "DELETE FROM messages WHERE session_id = ?1",
        params![session_id],
    ).map_err(|e| NapiError::from_reason(e.to_string()))?;

    conn.execute(
        "DELETE FROM sessions WHERE id = ?1",
        params![session_id],
    ).map_err(|e| NapiError::from_reason(e.to_string()))?;

    Ok(count as i32)
}

/// Get search statistics
#[napi]
pub fn search_get_stats() -> napi::Result<String> {
    ensure_db()?;
    let db_lock = DB.lock().map_err(|e| NapiError::from_reason(e.to_string()))?;
    let conn = db_lock.as_ref().ok_or_else(|| NapiError::from_reason("Database not initialized"))?;

    let message_count: i64 = conn
        .query_row("SELECT COUNT(*) FROM messages", [], |row| row.get(0))
        .map_err(|e| NapiError::from_reason(e.to_string()))?;

    let session_count: i64 = conn
        .query_row("SELECT COUNT(DISTINCT session_id) FROM messages", [], |row| row.get(0))
        .map_err(|e| NapiError::from_reason(e.to_string()))?;

    let stats = serde_json::json!({
        "message_count": message_count,
        "session_count": session_count,
    });

    Ok(stats.to_string())
}
