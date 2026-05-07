/**
 * MCP Server Loader
 *
 * The Claude Agent SDK automatically loads MCP servers from:
 * - ~/.claude/settings.json (user-level MCPs like Context7)
 * - .claude/settings.json (project-level MCPs)
 *
 * We use settingSources: ['user', 'project'] to inherit these.
 * This means Context7 and other MCPs configured via `claude mcp add`
 * will automatically work in Coworker!
 *
 * Additional Coworker-specific MCPs can be added via ~/.coworker/mcp.json
 */

import { loadMcpConfig, type McpServerConfig } from "./config.js";

/**
 * Build additional MCP servers from Coworker's own config
 * These are merged with Claude Code's MCPs by the SDK
 */
export function buildMcpServers(cwd?: string): Record<string, any> {
  const config = loadMcpConfig(cwd);
  const enabledServers = config.servers.filter(s => s.enabled);
  const mcpServers: Record<string, any> = {};

  for (const server of enabledServers) {
    // Skip builtin - we don't need duplicate tools
    if (server.type === "builtin") {
      continue;
    }

    if (server.type === "stdio" && server.command) {
      // External stdio-based MCP servers
      mcpServers[server.id] = {
        type: "stdio",
        command: server.command,
        args: server.args || [],
        env: server.env || {}
      };
    } else if (server.type === "sse" && server.url) {
      // SSE-based MCP servers (like remote Context7)
      mcpServers[server.id] = {
        type: "sse",
        url: server.url
      };
    }
  }

  return mcpServers;
}

/**
 * Get list of tools from Coworker's custom MCP servers
 * Note: Claude Code MCPs (Context7, etc.) are handled by the SDK automatically
 */
export function getAvailableTools(cwd?: string): string[] {
  // Return empty - the SDK handles tool discovery from settingSources
  // We don't need to manually list tools
  return [];
}
