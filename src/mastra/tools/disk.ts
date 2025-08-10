import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import si from "systeminformation";

export const diskUtilizationTool = createTool({
  id: "disk_utilization",
  description: "Return comprehensive disk usage information including per-mount details, status, and health indicators",
  inputSchema: z.object({}),
  outputSchema: z.object({
    highest: z.number(),
    status: z.enum(["OK", "WARN", "CRIT"]),
    mounts: z.array(z.object({
      fs: z.string(),
      mount: z.string(),
      size: z.number(),
      used: z.number(),
      use: z.number(),
      status: z.enum(["OK", "WARN", "CRIT"])
    })),
    totalSize: z.number(),
    totalUsed: z.number(),
    totalAvailable: z.number(),
    health: z.object({
      hasLowSpace: z.boolean(),
      criticalMounts: z.array(z.string()),
      recommendations: z.array(z.string())
    })
  }),
  execute: async () => {
    try {
      const sizes = await si.fsSize();
      
      if (!sizes || sizes.length === 0) {
        throw new Error("No disk information available");
      }
      
      const mounts = sizes.map(d => {
        const usage = d.use || 0;
        let status: "OK" | "WARN" | "CRIT" = "OK";
        
        if (usage >= 90) status = "CRIT";
        else if (usage >= 80) status = "WARN";
        
        return {
          fs: d.fs || "unknown",
          mount: d.mount || "unknown",
          size: d.size || 0,
          used: d.used || 0,
          use: usage,
          status
        };
      });
      
      const highest = mounts.reduce((max, mount) => Math.max(max, mount.use), 0);
      
      // Determine overall status
      let overallStatus: "OK" | "WARN" | "CRIT" = "OK";
      if (highest >= 90) overallStatus = "CRIT";
      else if (highest >= 80) overallStatus = "WARN";
      
      // Calculate totals
      const totalSize = mounts.reduce((sum, mount) => sum + mount.size, 0);
      const totalUsed = mounts.reduce((sum, mount) => sum + mount.used, 0);
      const totalAvailable = totalSize - totalUsed;
      
      // Health analysis
      const criticalMounts = mounts
        .filter(mount => mount.status === "CRIT")
        .map(mount => mount.mount);
      
      const hasLowSpace = criticalMounts.length > 0;
      
      const recommendations = [];
      if (criticalMounts.length > 0) {
        recommendations.push(`Critical disk usage on: ${criticalMounts.join(", ")}`);
      }
      if (mounts.filter(m => m.status === "WARN").length > 0) {
        recommendations.push("Some mounts are approaching critical usage");
      }
      if (totalAvailable < totalSize * 0.1) {
        recommendations.push("Total available space is less than 10% of total capacity");
      }
      
      return {
        highest,
        status: overallStatus,
        mounts,
        totalSize,
        totalUsed,
        totalAvailable,
        health: {
          hasLowSpace,
          criticalMounts,
          recommendations
        }
      };
    } catch (error) {
      // Fallback with basic information
      try {
        const sizes = await si.fsSize();
        const mounts = sizes.map(d => ({
          fs: d.fs || "unknown",
          mount: d.mount || "unknown",
          size: d.size || 0,
          used: d.used || 0,
          use: d.use || 0,
          status: "OK" as const
        }));
        
        const highest = mounts.reduce((max, mount) => Math.max(max, mount.use), 0);
        
        return {
          highest,
          status: "OK" as const,
          mounts,
          totalSize: mounts.reduce((sum, mount) => sum + mount.size, 0),
          totalUsed: mounts.reduce((sum, mount) => sum + mount.used, 0),
          totalAvailable: 0,
          health: {
            hasLowSpace: false,
            criticalMounts: [],
            recommendations: []
          }
        };
      } catch (fallbackError) {
        return {
          highest: 0,
          status: "OK" as const,
          mounts: [],
          totalSize: 0,
          totalUsed: 0,
          totalAvailable: 0,
          health: {
            hasLowSpace: false,
            criticalMounts: [],
            recommendations: ["Unable to retrieve disk information"]
          }
        };
      }
    }
  }
});
