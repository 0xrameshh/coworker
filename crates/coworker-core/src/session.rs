//! Session management with SQLite

use crate::Result;
use rusqlite::{Connection, params};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
    pub id: String,
    pub title: String,
    pub status: SessionStatus,
    pub cwd: Option<String>,
    pub claude_session_id: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum SessionStatus {
    Idle,
    Running,
    Completed,
    Error,
}

impl SessionStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Idle => "idle",
            Self::Running => "running",
            Self::Completed => "completed",
            Self::Error => "error",
        }
    }

    pub fn from_str(s: &str) -> Self {
        match s {
            "running" => Self::Running,
            "completed" => Self::Completed,
            "error" => Self::Error,
            _ => Self::Idle,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub id: String,
    pub session_id: String,
    pub role: String,
    pub content: String,
    pub timestamp: i64,
}

pub struct SessionStore {
    conn: Connection,
}

impl SessionStore {
    pub fn new(db_path: &str) -> Result<Self> {
        let conn = Connection::open(db_path)?;

        conn.execute_batch(
            "
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'idle',
                cwd TEXT,
                claude_session_id TEXT,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                timestamp INTEGER NOT NULL,
                FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
            ",
        )?;

        Ok(Self { conn })
    }

    pub fn create_session(&self, title: &str, cwd: Option<&str>) -> Result<Session> {
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp();

        self.conn.execute(
            "INSERT INTO sessions (id, title, status, cwd, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![id, title, "idle", cwd, now, now],
        )?;

        Ok(Session {
            id,
            title: title.to_string(),
            status: SessionStatus::Idle,
            cwd: cwd.map(String::from),
            claude_session_id: None,
            created_at: now,
            updated_at: now,
        })
    }

    pub fn get_session(&self, id: &str) -> Result<Option<Session>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, title, status, cwd, claude_session_id, created_at, updated_at FROM sessions WHERE id = ?1",
        )?;

        let session = stmt
            .query_row(params![id], |row| {
                Ok(Session {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    status: SessionStatus::from_str(&row.get::<_, String>(2)?),
                    cwd: row.get(3)?,
                    claude_session_id: row.get(4)?,
                    created_at: row.get(5)?,
                    updated_at: row.get(6)?,
                })
            })
            .ok();

        Ok(session)
    }

    pub fn list_sessions(&self) -> Result<Vec<Session>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, title, status, cwd, claude_session_id, created_at, updated_at FROM sessions ORDER BY updated_at DESC",
        )?;

        let sessions = stmt
            .query_map([], |row| {
                Ok(Session {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    status: SessionStatus::from_str(&row.get::<_, String>(2)?),
                    cwd: row.get(3)?,
                    claude_session_id: row.get(4)?,
                    created_at: row.get(5)?,
                    updated_at: row.get(6)?,
                })
            })?
            .filter_map(|r| r.ok())
            .collect();

        Ok(sessions)
    }

    pub fn update_session(&self, id: &str, status: SessionStatus) -> Result<()> {
        let now = chrono::Utc::now().timestamp();
        self.conn.execute(
            "UPDATE sessions SET status = ?1, updated_at = ?2 WHERE id = ?3",
            params![status.as_str(), now, id],
        )?;
        Ok(())
    }

    pub fn delete_session(&self, id: &str) -> Result<()> {
        self.conn.execute("DELETE FROM sessions WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn add_message(&self, session_id: &str, role: &str, content: &str) -> Result<Message> {
        let id = Uuid::new_v4().to_string();
        let timestamp = chrono::Utc::now().timestamp();

        self.conn.execute(
            "INSERT INTO messages (id, session_id, role, content, timestamp) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![id, session_id, role, content, timestamp],
        )?;

        Ok(Message {
            id,
            session_id: session_id.to_string(),
            role: role.to_string(),
            content: content.to_string(),
            timestamp,
        })
    }

    pub fn get_messages(&self, session_id: &str) -> Result<Vec<Message>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, session_id, role, content, timestamp FROM messages WHERE session_id = ?1 ORDER BY timestamp ASC",
        )?;

        let messages = stmt
            .query_map(params![session_id], |row| {
                Ok(Message {
                    id: row.get(0)?,
                    session_id: row.get(1)?,
                    role: row.get(2)?,
                    content: row.get(3)?,
                    timestamp: row.get(4)?,
                })
            })?
            .filter_map(|r| r.ok())
            .collect();

        Ok(messages)
    }
}
