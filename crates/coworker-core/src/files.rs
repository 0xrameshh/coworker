//! Fast file operations using Rust

use crate::{CoreError, Result};
use ignore::WalkBuilder;
use serde::{Deserialize, Serialize};
use std::path::Path;
use walkdir::WalkDir;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileInfo {
    pub path: String,
    pub name: String,
    pub is_dir: bool,
    pub size: Option<u64>,
    pub modified: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileContent {
    pub path: String,
    pub content: String,
    pub line_count: usize,
}

/// List files in a directory (respects .gitignore)
pub fn list_files(root: &str, max_depth: Option<usize>) -> Result<Vec<FileInfo>> {
    let root_path = Path::new(root);
    if !root_path.exists() {
        return Err(CoreError::PathNotFound(root.to_string()));
    }

    let mut files = Vec::new();
    let walker = WalkBuilder::new(root_path)
        .max_depth(max_depth)
        .hidden(false)
        .git_ignore(true)
        .build();

    for entry in walker.filter_map(|e| e.ok()) {
        let path = entry.path();
        let metadata = path.metadata().ok();

        files.push(FileInfo {
            path: path.to_string_lossy().to_string(),
            name: path
                .file_name()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_default(),
            is_dir: path.is_dir(),
            size: metadata.as_ref().map(|m| m.len()),
            modified: metadata
                .and_then(|m| m.modified().ok())
                .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                .map(|d| d.as_secs() as i64),
        });
    }

    Ok(files)
}

/// Glob pattern matching for files
pub fn glob_files(root: &str, pattern: &str) -> Result<Vec<String>> {
    let root_path = Path::new(root);
    if !root_path.exists() {
        return Err(CoreError::PathNotFound(root.to_string()));
    }

    let glob = globset::Glob::new(pattern)
        .map_err(|e| CoreError::InvalidPattern(e.to_string()))?
        .compile_matcher();

    let mut matches = Vec::new();

    for entry in WalkDir::new(root_path)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let path = entry.path();
        if glob.is_match(path) {
            matches.push(path.to_string_lossy().to_string());
        }
    }

    Ok(matches)
}

/// Read file content with line numbers
pub fn read_file(path: &str) -> Result<FileContent> {
    let content = std::fs::read_to_string(path)?;
    let line_count = content.lines().count();

    Ok(FileContent {
        path: path.to_string(),
        content,
        line_count,
    })
}

/// Read file with line range
pub fn read_file_range(path: &str, start: usize, end: usize) -> Result<FileContent> {
    let content = std::fs::read_to_string(path)?;
    let lines: Vec<&str> = content.lines().collect();
    let total_lines = lines.len();

    let start = start.saturating_sub(1).min(total_lines);
    let end = end.min(total_lines);

    let selected: String = lines[start..end].join("\n");

    Ok(FileContent {
        path: path.to_string(),
        content: selected,
        line_count: end - start,
    })
}

/// Write content to file
pub fn write_file(path: &str, content: &str) -> Result<()> {
    // Ensure parent directory exists
    if let Some(parent) = Path::new(path).parent() {
        std::fs::create_dir_all(parent)?;
    }
    std::fs::write(path, content)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_list_files() {
        let files = list_files(".", Some(1)).unwrap();
        assert!(!files.is_empty());
    }
}
