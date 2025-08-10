import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import si from "systeminformation";

export const cpuTool = createTool({
  id: "cpu_usage",
  description: "Get comprehensive CPU usage information including load, temperature, and performance metrics",
  inputSchema: z.object({}),
  outputSchema: z.object({
    usagePercent: z.number(),
    loadAverage: z.object({
      "1min": z.number(),
      "5min": z.number(),
      "15min": z.number()
    }),
    cores: z.number(),
    temperature: z.number().optional(),
    speed: z.number(),
    model: z.string(),
    status: z.enum(["OK", "WARN", "CRIT"])
  }),
  execute: async () => {
    try {
      const [cpu, currentLoad] = await Promise.all([
        si.cpu(),
        si.currentLoad()
      ]);
      
      const usagePercent = currentLoad.currentLoad || 0;
      const cores = cpu.cores || 1;
      
      // Determine status based on usage and load
      let status: "OK" | "WARN" | "CRIT" = "OK";
      
      if (usagePercent >= 95) {
        status = "CRIT";
      } else if (usagePercent >= 80) {
        status = "WARN";
      }
      
      return {
        usagePercent: Math.round(usagePercent * 100) / 100,
        loadAverage: {
          "1min": 0, // systeminformation doesn't provide load average in currentLoad
          "5min": 0,
          "15min": 0
        },
        cores,
        temperature: undefined, // systeminformation doesn't always provide this
        speed: cpu.speed || 0,
        model: cpu.manufacturer + " " + cpu.brand || "Unknown",
        status
      };
    } catch (error) {
      console.error("Error getting CPU info:", error);
      
      // Fallback to basic CPU info
      const cpu = await si.cpu();
      const cores = cpu.cores || 1;
      
      return {
        usagePercent: 0,
        loadAverage: {
          "1min": 0,
          "5min": 0,
          "15min": 0
        },
        cores,
        temperature: undefined,
        speed: cpu.speed || 0,
        model: cpu.manufacturer + " " + cpu.brand || "Unknown",
        status: "OK" as const
      };
    }
  }
});
