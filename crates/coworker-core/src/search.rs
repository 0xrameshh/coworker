//! Fast code search using Rust (ripgrep-style)

use crate::{CoreError, Result};
use ignore::WalkBuilder;
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchMatch {
    pub path: String,
    pub line_number: usize,
    pub line_content: String,
    pub match_start: usize,
    pub match_end: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub matches: Vec<SearchMatch>,
    pub total_matches: usize,
    pub files_searched: usize,
}

#[derive(Debug, Clone, Default)]
pub struct SearchOptions {
    pub case_sensitive: bool,
    pub max_results: Option<usize>,
    pub file_pattern: Option<String>,
    pub context_lines: usize,
}

/// Search for pattern in files (ripgrep-style)
pub fn search(root: &str, pattern: &str, options: SearchOptions) -> Result<SearchResult> {
    let root_path = Path::new(root);
    if !root_path.exists() {
        return Err(CoreError::PathNotFound(root.to_string()));
    }

    let regex = if options.case_sensitive {
        regex::Regex::new(pattern)
    } else {
        regex::RegexBuilder::new(pattern)
            .case_insensitive(true)
            .build()
    }
    .map_err(|e| CoreError::InvalidPattern(e.to_string()))?;

    let mut matches = Vec::new();
    let mut files_searched = 0;
    let max_results = options.max_results.unwrap_or(1000);

    let walker = WalkBuilder::new(root_path)
        .hidden(true)
        .git_ignore(true)
        .build();

    'outer: for entry in walker.filter_map(|e| e.ok()) {
        let path = entry.path();

        // Skip directories
        if path.is_dir() {
            continue;
        }

        // Check file pattern if specified
        if let Some(ref file_pattern) = options.file_pattern {
            let file_name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");
            if !file_name.contains(file_pattern) {
                continue;
            }
        }

        // Try to read file (skip binary files)
        let content = match std::fs::read_to_string(path) {
            Ok(c) => c,
            Err(_) => continue,
        };

        files_searched += 1;

        for (line_idx, line) in content.lines().enumerate() {
            if let Some(mat) = regex.find(line) {
                matches.push(SearchMatch {
                    path: path.to_string_lossy().to_string(),
                    line_number: line_idx + 1,
                    line_content: line.to_string(),
                    match_start: mat.start(),
                    match_end: mat.end(),
                });

                if matches.len() >= max_results {
                    break 'outer;
                }
            }
        }
    }

    let total_matches = matches.len();

    Ok(SearchResult {
        matches,
        total_matches,
        files_searched,
    })
}

/// Find files matching a pattern
pub fn find_files(root: &str, pattern: &str, max_results: Option<usize>) -> Result<Vec<String>> {
    let root_path = Path::new(root);
    if !root_path.exists() {
        return Err(CoreError::PathNotFound(root.to_string()));
    }

    let max = max_results.unwrap_or(100);
    let mut results = Vec::new();

    let walker = WalkBuilder::new(root_path)
        .hidden(true)
        .git_ignore(true)
        .build();

    for entry in walker.filter_map(|e| e.ok()) {
        let path = entry.path();
        let path_str = path.to_string_lossy();

        if path_str.contains(pattern) {
            results.push(path_str.to_string());
            if results.len() >= max {
                break;
            }
        }
    }

    Ok(results)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_search() {
        let result = search(".", "fn ", SearchOptions::default()).unwrap();
        assert!(result.files_searched > 0);
    }
}
