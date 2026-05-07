/**
 * MCP Configuration Management
 *
 * Handles loading/saving MCP server configurations from:
 * - ~/.coworker/mcp.json (global config)
 * - .coworker/mcp.json (project-level config)
 */

import { app } from "electron";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { homedir } from "os";

export interface McpServerConfig {
  /** Unique identifier for the server */
  id: string;
  /** Display name */
  name: string;
  /** Whether the server is enabled */
  enabled: boolean;
  /** Server type: 'builtin' | 'stdio' | 'sse' */
  type: "builtin" | "stdio" | "sse";
  /** For stdio: command to run */
  command?: string;
  /** For stdio: command arguments */
  args?: string[];
  /** For sse: server URL */
  url?: string;
  /** Environment variables to pass */
  env?: Record<string, string>;
  /** Server description */
  description?: string;
}

export interface McpConfig {
  /** Version of the config schema */
  version: number;
  /** Configured MCP servers */
  servers: McpServerConfig[];
}

const DEFAULT_CONFIG: McpConfig = {
  version: 1,
  servers: [
    // MCP servers from Claude Code (~/.claude/settings.json) are loaded automatically
    // via settingSources: ['user', 'project'] in runner.ts
    //
    // Add custom MCP servers here if you want Coworker-specific ones:
    // {
    //   id: "my-custom-mcp",
    //   name: "My Custom MCP",
    //   enabled: true,
    //   type: "stdio",
    //   command: "npx",
    //   args: ["-y", "@my-org/my-mcp-server"]
    // }
  ]
};

function getGlobalConfigPath(): string {
  const coworkerDir = join(homedir(), ".coworker");
  return join(coworkerDir, "mcp.json");
}

function getProjectConfigPath(cwd: string): string {
  return join(cwd, ".coworker", "mcp.json");
}

export function loadMcpConfig(cwd?: string): McpConfig {
  const globalPath = getGlobalConfigPath();
  const projectPath = cwd ? getProjectConfigPath(cwd) : null;

  let config = { ...DEFAULT_CONFIG, servers: [...DEFAULT_CONFIG.servers] };

  // Load global config
  if (existsSync(globalPath)) {
    try {
      const globalConfig = JSON.parse(readFileSync(globalPath, "utf-8")) as McpConfig;
      // Merge servers, avoiding duplicates by id
      const serverIds = new Set(config.servers.map(s => s.id));
      for (const server of globalConfig.servers || []) {
        if (!serverIds.has(server.id)) {
          config.servers.push(server);
          serverIds.add(server.id);
        }
      }
    } catch (error) {
      console.error("[mcp] Failed to load global config:", error);
    }
  }

  // Load project config (takes precedence)
  if (projectPath && existsSync(projectPath)) {
    try {
      const projectConfig = JSON.parse(readFileSync(projectPath, "utf-8")) as McpConfig;
      // Merge servers, project config can override global
      const serverMap = new Map(config.servers.map(s => [s.id, s]));
      for (const server of projectConfig.servers || []) {
        serverMap.set(server.id, server);
      }
      config.servers = Array.from(serverMap.values());
    } catch (error) {
      console.error("[mcp] Failed to load project config:", error);
    }
  }

  return config;
}

export function saveMcpConfig(config: McpConfig, global = true): void {
  const configPath = getGlobalConfigPath();
  const dir = dirname(configPath);

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
}

export function getEnabledServers(config: McpConfig): McpServerConfig[] {
  return config.servers.filter(s => s.enabled);
}
