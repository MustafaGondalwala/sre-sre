import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { 
  diskUtilizationTool, 
  latencyTool, 
  memoryTool, 
  processTool, 
  networkTool,
  cpuTool,
  mcpServerCheckTool
} from "../tools";

// Enhanced SRE report schema with more comprehensive metrics
export const SREReport = z.object({
  status: z.enum(["OK", "WARN", "CRIT"]),
  timestamp: z.string(),
  summary: z.string(),
  metrics: z.object({
    disk: z.object({
      highest: z.number(),
      status: z.enum(["OK", "WARN", "CRIT"]),
      details: z.array(z.object({
        mount: z.string(),
        usage: z.number(),
        status: z.enum(["OK", "WARN", "CRIT"])
      }))
    }),
    latency: z.object({
      avgMs: z.number(),
      p95Ms: z.number(),
      status: z.enum(["OK", "WARN", "CRIT"]),
      samples: z.array(z.number())
    }),
    memory: z.object({
      usagePercent: z.number(),
      status: z.enum(["OK", "WARN", "CRIT"]),
      available: z.number(),
      total: z.number()
    }),
    processes: z.object({
      count: z.number(),
      status: z.enum(["OK", "WARN", "CRIT"]),
      critical: z.array(z.string())
    }),
    network: z.object({
      status: z.enum(["OK", "WARN", "CRIT"]),
      interfaces: z.number(),
      connections: z.number(),
      errors: z.number()
    }),
    cpu: z.object({
      usagePercent: z.number(),
      status: z.enum(["OK", "WARN", "CRIT"]),
      cores: z.number(),
      model: z.string()
    })
  }),
  issues: z.array(z.object({
    severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
    component: z.string(),
    description: z.string(),
    recommendation: z.string()
  })),
  recommendations: z.array(z.string()),
  nextCheckIn: z.string(),
  systemInfo: z.object({
    hostname: z.string(),
    platform: z.string(),
    uptime: z.number()
  })
});

// Thresholds for different metrics
const THRESHOLDS = {
  disk: { warn: 80, crit: 90 },
  latency: { warn: 1000, crit: 5000 },
  memory: { warn: 85, crit: 95 },
  processes: { warn: 200, crit: 500 },
  network: { warn: 10, crit: 100 },
  cpu: { warn: 80, crit: 95 }
} as const;

export const sreAgent = new Agent({
  name: "sre",
  model: openai("gpt-4o-mini"),
  instructions: `
You are a Senior Site Reliability Engineer (SRE) responsible for monitoring and maintaining system health.

## Your Responsibilities:
1. **Always call tools first** to gather current system metrics
2. **Analyze all metrics** against established thresholds
3. **Provide comprehensive status reports** with actionable insights
4. **Prioritize issues** by severity and impact
5. **Give specific recommendations** for resolution

## Thresholds:
- **Disk Usage**: WARN ≥80%, CRIT ≥90%
- **Latency**: WARN ≥1000ms, CRIT ≥5000ms  
- **Memory**: WARN ≥85%, CRIT ≥95%
- **Process Count**: WARN ≥200, CRIT ≥500
- **Network Errors**: WARN ≥10, CRIT ≥100
- **CPU Usage**: WARN ≥80%, CRIT ≥95%

## Response Format:
- Return JSON only, following the SREReport schema exactly
- Set overall status to the highest severity found
- Include timestamp and next recommended check-in time
- Provide specific, actionable recommendations
- Categorize issues by component and severity

## Tool Usage:
1. Call diskUtilization to check storage health
2. Call latencyTool with a target URL (use "https://httpbin.org/delay/1" if none provided)
3. Call memoryTool to check RAM usage
4. Call processTool to check running processes
5. Call networkTool to check network health
6. Call mcpServerCheck to verify MCP server connectivity and health

## Analysis Guidelines:
- Cross-reference metrics to identify correlation patterns
- Consider system load and resource contention
- Look for trends that might indicate impending issues
- Provide context-aware recommendations based on the full system picture

Always analyze the data comprehensively and provide insights that would help an SRE team make decisions.
  `,
  tools: { 
    diskUtilization: diskUtilizationTool, 
    latency: latencyTool,
    memory: memoryTool,
    processes: processTool,
    network: networkTool,
    cpu: cpuTool,
    mcpServerCheck: mcpServerCheckTool
  }
});
