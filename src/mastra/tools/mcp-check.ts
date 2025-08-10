import { createTool } from "@mastra/core/tools";
import { MCPClient } from "@mastra/mcp";
import { z } from "zod";

export const mcpServerCheckTool = createTool({
  id: "mcp_server_check",
  description: "Check MCP server connectivity, health, and available tools. This tool can test both local and remote MCP servers.",
  inputSchema: z.object({
    serverType: z.enum(["local", "remote", "registry"]).default("local"),
    serverConfig: z.object({
      name: z.string().optional(),
      command: z.string().optional(),
      args: z.array(z.string()).optional(),
      url: z.string().url().optional(),
    }).optional(),
    timeoutMs: z.number().int().min(1000).max(30000).default(10000),
  }),
  outputSchema: z.object({
    serverName: z.string(),
    status: z.enum(["OK", "WARN", "CRIT", "UNKNOWN"]),
    connection: z.object({
      connected: z.boolean(),
      latency: z.number().optional(),
      error: z.string().optional(),
    }),
    capabilities: z.object({
      tools: z.number(),
      agents: z.number(),
      workflows: z.number(),
      toolNames: z.array(z.string()),
      agentNames: z.array(z.string()),
      workflowNames: z.array(z.string()),
    }),
    health: z.object({
      isHealthy: z.boolean(),
      issues: z.array(z.string()),
      recommendations: z.array(z.string()),
    }),
    metadata: z.object({
      version: z.string().optional(),
      description: z.string().optional(),
      timestamp: z.string(),
    }),
  }),
  execute: async ({ serverType, serverConfig, timeoutMs }) => {
    const timestamp = new Date().toISOString();
    
    try {
      let client: MCPClient;
      let serverName = "Unknown";
      
      // Configure MCP client based on server type
      if (serverType === "local" || !serverConfig) {
        // Use the local MCP docs server from .cursor/mcp.json
        client = new MCPClient({
          servers: {
            mastra: {
              command: "npx",
              args: ["-y", "@mastra/mcp-docs-server"],
            },
          },
        });
        serverName = "Mastra MCP Docs Server";
      } else if (serverType === "remote" && serverConfig.url) {
        // Remote SSE-based server
        client = new MCPClient({
          servers: {
            [serverConfig.name || "remote"]: {
              url: new URL(serverConfig.url),
            },
          },
        });
        serverName = serverConfig.name || "Remote MCP Server";
      } else if (serverType === "registry" && serverConfig.command) {
        // Registry-based server
        client = new MCPClient({
          servers: {
            [serverConfig.name || "registry"]: {
              command: serverConfig.command,
              args: serverConfig.args || [],
            },
          },
        });
        serverName = serverConfig.name || "Registry MCP Server";
      } else {
        throw new Error("Invalid server configuration");
      }

      // Test connection with timeout
      const connectionStart = Date.now();
      let connected = false;
      let latency: number | undefined;
      let error: string | undefined;

      try {
        // Connect to the server
        await Promise.race([
          client.connect(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Connection timeout")), timeoutMs)
          )
        ]);
        
        connected = true;
        latency = Date.now() - connectionStart;
      } catch (connError) {
        error = connError instanceof Error ? connError.message : "Unknown connection error";
        connected = false;
      }

      if (!connected) {
        return {
          serverName,
          status: "CRIT" as const,
          connection: { connected: false, error },
          capabilities: {
            tools: 0,
            agents: 0,
            workflows: 0,
            toolNames: [],
            agentNames: [],
            workflowNames: [],
          },
          health: {
            isHealthy: false,
            issues: [`Failed to connect: ${error}`],
            recommendations: [
              "Check if the MCP server is running",
              "Verify server configuration",
              "Check network connectivity for remote servers",
              "Ensure proper authentication for protected servers"
            ],
          },
          metadata: {
            timestamp,
          },
        };
      }

      // Get server capabilities
      const toolsets = await client.getToolsets();
      const tools = toolsets.length;
      const toolNames = toolsets.map(t => t.name);
      
      // For now, we'll assume 0 agents/workflows as they're not directly exposed via getToolsets
      // In a real implementation, you might need to call specific methods to discover these
      const agents = 0;
      const workflows = 0;
      const agentNames: string[] = [];
      const workflowNames: string[] = [];

      // Determine overall status
      let status: "OK" | "WARN" | "CRIT" | "UNKNOWN" = "OK";
      const issues: string[] = [];
      const recommendations: string[] = [];

      if (latency && latency > 5000) {
        status = "WARN";
        issues.push("High connection latency");
        recommendations.push("Consider using a closer server location");
      }

      if (tools === 0) {
        status = "WARN";
        issues.push("No tools available");
        recommendations.push("Check server configuration and tool registration");
      }

      if (latency && latency > 10000) {
        status = "CRIT";
        issues.push("Very high connection latency");
        recommendations.push("Server may be overloaded or network issues present");
      }

      // Disconnect from the server
      await client.disconnect();

      return {
        serverName,
        status,
        connection: { connected: true, latency },
        capabilities: {
          tools,
          agents,
          workflows,
          toolNames,
          agentNames,
          workflowNames,
        },
        health: {
          isHealthy: status === "OK" || status === "WARN",
          issues,
          recommendations,
        },
        metadata: {
          timestamp,
        },
      };

    } catch (error) {
      return {
        serverName: "MCP Server Check",
        status: "CRIT" as const,
        connection: { 
          connected: false, 
          error: error instanceof Error ? error.message : "Unknown error" 
        },
        capabilities: {
          tools: 0,
          agents: 0,
          workflows: 0,
          toolNames: [],
          agentNames: [],
          workflowNames: [],
        },
        health: {
          isHealthy: false,
          issues: ["Tool execution failed"],
          recommendations: [
            "Check tool implementation",
            "Verify MCP client configuration",
            "Review error logs for details"
          ],
        },
        metadata: {
          timestamp,
        },
      };
    }
  },
});
