/**
 * Coworker MCP Tools
 *
 * NOTE: Most tools are intentionally NOT included here because
 * Claude Agent SDK already provides them:
 * - Read, Write, Edit (file operations)
 * - Bash (command execution)
 * - Glob, Grep (file search)
 * - WebFetch, WebSearch (web access)
 *
 * Instead, Coworker inherits MCP servers from Claude Code's config
 * (like Context7 for docs) via the SDK's settingSources option.
 *
 * This file is kept minimal - only add tools here that are truly
 * unique to Coworker and not available elsewhere.
 */

import { createSdkMcpServer, tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

// Minimal Coworker-specific tools (if any needed in the future)
export const coworkerMcpServer = createSdkMcpServer({
  name: "coworker",
  version: "1.0.0",
  tools: [
    // Example: Coworker-specific tool for session management
    // tool(
    //   "coworker_get_sessions",
    //   "List all Coworker chat sessions",
    //   {},
    //   async () => ({ content: [{ type: "text", text: "Sessions list..." }] })
    // )
  ]
});
