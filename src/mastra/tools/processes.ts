import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import si from "systeminformation";

export const processTool = createTool({
  id: "process_monitoring",
  description: "Get information about running processes, including count, critical processes, and resource usage",
  inputSchema: z.object({}),
  outputSchema: z.object({
    count: z.number(),
    critical: z.array(z.object({
      pid: z.number(),
      name: z.string(),
      cpu: z.number(),
      mem: z.number(),
      command: z.string()
    })),
    topByCpu: z.array(z.object({
      pid: z.number(),
      name: z.string(),
      cpu: z.number(),
      mem: z.number()
    })),
    topByMem: z.array(z.object({
      pid: z.number(),
      name: z.string(),
      cpu: z.number(),
      mem: z.number()
    })),
    zombieCount: z.number(),
    loadAverage: z.object({
      load1: z.number(),
      load5: z.number(),
      load15: z.number()
    })
  }),
  execute: async () => {
    try {
      // Get process list with basic info first
      const processes = await si.processes();
      
      // Get load average
      const load = await si.currentLoad();
      
      // Get detailed process info for top processes
      const topProcesses = await si.processes();
      
      // Sort by CPU and memory usage
      const topByCpu = topProcesses.list
        .filter(p => p.cpu && p.cpu > 0)
        .sort((a, b) => (b.cpu || 0) - (a.cpu || 0))
        .slice(0, 10)
        .map(p => ({
          pid: p.pid || 0,
          name: p.command?.split(' ')[0] || 'unknown',
          cpu: Math.round((p.cpu || 0) * 100) / 100,
          mem: Math.round((p.mem || 0) * 100) / 100
        }));
      
      const topByMem = topProcesses.list
        .filter(p => p.mem && p.mem > 0)
        .sort((a, b) => (b.mem || 0) - (a.mem || 0))
        .slice(0, 10)
        .map(p => ({
          pid: p.pid || 0,
          name: p.command?.split(' ')[0] || 'unknown',
          cpu: Math.round((p.cpu || 0) * 100) / 100,
          mem: Math.round((p.mem || 0) * 100) / 100
        }));
      
      // Identify critical processes (high CPU or memory usage)
      const critical = topProcesses.list
        .filter(p => (p.cpu && p.cpu > 50) || (p.mem && p.mem > 20)) // CPU > 50% or Memory > 20%
        .slice(0, 5)
        .map(p => ({
          pid: p.pid || 0,
          name: p.command?.split(' ')[0] || 'unknown',
          cpu: Math.round((p.cpu || 0) * 100) / 100,
          mem: Math.round((p.mem || 0) * 100) / 100,
          command: p.command || 'unknown'
        }));
      
      return {
        count: processes.all || 0,
        critical,
        topByCpu,
        topByMem,
        zombieCount: 0, // systeminformation doesn't provide zombie count directly
        loadAverage: {
          load1: Math.round((load.avgLoad || 0) * 100) / 100,
          load5: Math.round((load.avgLoad || 0) * 100) / 100,
          load15: Math.round((load.avgLoad || 0) * 100) / 100
        }
      };
    } catch (error) {
      // Fallback to basic process count if detailed info fails
      try {
        const processes = await si.processes();
        return {
          count: processes.all || 0,
          critical: [],
          topByCpu: [],
          topByMem: [],
          zombieCount: 0, // systeminformation doesn't provide zombie count directly
          loadAverage: {
            load1: 0,
            load5: 0,
            load15: 0
          }
        };
      } catch (fallbackError) {
        return {
          count: 0,
          critical: [],
          topByCpu: [],
          topByMem: [],
          zombieCount: 0,
          loadAverage: {
            load1: 0,
            load5: 0,
            load15: 0
          }
        };
      }
    }
  }
});
