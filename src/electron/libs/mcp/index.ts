/**
 * MCP (Model Context Protocol) Support for Coworker
 *
 * This module provides:
 * 1. Built-in MCP servers (git, filesystem, lsp)
 * 2. External MCP server configuration loading
 * 3. Dynamic server management
 */

export { coworkerMcpServer } from "./coworker-tools.js";
export { loadMcpConfig, saveMcpConfig, type McpConfig, type McpServerConfig } from "./config.js";
export { buildMcpServers } from "./loader.js";
