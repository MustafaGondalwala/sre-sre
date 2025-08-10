import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import si from "systeminformation";

export const memoryTool = createTool({
  id: "memory_usage",
  description: "Get comprehensive memory usage information including RAM, swap, and cache statistics",
  inputSchema: z.object({}),
  outputSchema: z.object({
    total: z.number(),
    used: z.number(),
    available: z.number(),
    free: z.number(),
    usagePercent: z.number(),
    swap: z.object({
      total: z.number(),
      used: z.number(),
      free: z.number(),
      usagePercent: z.number()
    }),
    cache: z.number(),
    buffers: z.number(),
    active: z.number(),
    inactive: z.number()
  }),
  execute: async () => {
    try {
      const mem = await si.mem();
      
      const total = mem.total;
      const used = mem.used;
      const available = mem.available;
      const free = mem.free;
      const usagePercent = total > 0 ? ((used / total) * 100) : 0;
      
      const swap = {
        total: mem.swaptotal,
        used: mem.swapused,
        free: mem.swapfree,
        usagePercent: mem.swaptotal > 0 ? ((mem.swapused / mem.swaptotal) * 100) : 0
      };
      
      return {
        total,
        used,
        available,
        free,
        usagePercent: Math.round(usagePercent * 100) / 100,
        swap,
        cache: mem.cached || 0,
        buffers: mem.buffers || 0,
        active: mem.active || 0,
        inactive: mem.inactive || 0
      };
    } catch (error) {
      // Fallback to basic memory info if detailed info fails
      const mem = await si.mem();
      const total = mem.total;
      const used = mem.used;
      const available = mem.available || (total - used);
      const usagePercent = total > 0 ? ((used / total) * 100) : 0;
      
      return {
        total,
        used,
        available,
        free: mem.free || 0,
        usagePercent: Math.round(usagePercent * 100) / 100,
        swap: {
          total: mem.swaptotal || 0,
          used: mem.swapused || 0,
          free: mem.swapfree || 0,
          usagePercent: 0
        },
        cache: 0,
        buffers: 0,
        active: 0,
        inactive: 0
      };
    }
  }
});
