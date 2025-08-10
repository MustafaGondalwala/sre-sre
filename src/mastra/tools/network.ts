import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import si from "systeminformation";

export const networkTool = createTool({
  id: "network_monitoring",
  description: "Get comprehensive network information including interfaces, connections, and network health metrics",
  inputSchema: z.object({}),
  outputSchema: z.object({
    interfaces: z.array(z.object({
      name: z.string(),
      type: z.string(),
      ip: z.string(),
      mac: z.string(),
      speed: z.number(),
      status: z.enum(["UP", "DOWN", "UNKNOWN"])
    })),
    connections: z.object({
      total: z.number(),
      established: z.number(),
      listening: z.number(),
      timeWait: z.number(),
      closeWait: z.number()
    }),
    bandwidth: z.object({
      rxBytes: z.number(),
      txBytes: z.number(),
      rxPackets: z.number(),
      txPackets: z.number(),
      rxErrors: z.number(),
      txErrors: z.number()
    }),
    status: z.enum(["OK", "WARN", "CRIT"]),
    health: z.object({
      hasErrors: z.boolean(),
      hasHighLatency: z.boolean(),
      recommendations: z.array(z.string())
    })
  }),
  execute: async () => {
    try {
      // Get network interfaces
      const interfaces = await si.networkInterfaces();
      const networkInterfaces = interfaces.map(iface => ({
        name: iface.iface || "unknown",
        type: iface.type || "unknown",
        ip: iface.ip4 || "unknown",
        mac: iface.mac || "unknown",
        speed: iface.speed || 0,
        status: iface.operstate === "up" ? "UP" as const : 
                iface.operstate === "down" ? "DOWN" as const : "UNKNOWN" as const
      }));

      // Get network connections
      const connections = await si.networkConnections();
      const connectionStats = {
        total: connections.length,
        established: connections.filter(c => c.state === "ESTABLISHED").length,
        listening: connections.filter(c => c.state === "LISTEN").length,
        timeWait: connections.filter(c => c.state === "TIME_WAIT").length,
        closeWait: connections.filter(c => c.state === "CLOSE_WAIT").length
      };

      // Get network stats
      const networkStats = await si.networkStats();
      let bandwidth = {
        rxBytes: 0,
        txBytes: 0,
        rxPackets: 0,
        txPackets: 0,
        rxErrors: 0,
        txErrors: 0
      };

      if (networkStats.length > 0) {
        const primaryInterface = networkStats[0];
        bandwidth = {
          rxBytes: primaryInterface.rx_bytes || 0,
          txBytes: primaryInterface.tx_bytes || 0,
          rxPackets: primaryInterface.rx_packets || 0,
          txPackets: primaryInterface.tx_packets || 0,
          rxErrors: primaryInterface.rx_errors || 0,
          txErrors: primaryInterface.tx_errors || 0
        };
      }

      // Determine overall status
      let status: "OK" | "WARN" | "CRIT" = "OK";
      const recommendations: string[] = [];

      if (bandwidth.rxErrors > 100 || bandwidth.txErrors > 100) {
        status = "CRIT";
        recommendations.push("High network error rate detected");
      } else if (bandwidth.rxErrors > 10 || bandwidth.txErrors > 10) {
        status = "WARN";
        recommendations.push("Elevated network error rate");
      }

      if (connectionStats.total > 10000) {
        status = status === "OK" ? "WARN" : status;
        recommendations.push("High number of network connections");
      }

      const hasErrors = bandwidth.rxErrors > 0 || bandwidth.txErrors > 0;
      const hasHighLatency = false; // Would need additional latency testing

      return {
        interfaces: networkInterfaces,
        connections: connectionStats,
        bandwidth,
        status,
        health: {
          hasErrors,
          hasHighLatency,
          recommendations
        }
      };
    } catch (error) {
      // Fallback with basic information
      try {
        const interfaces = await si.networkInterfaces();
        const networkInterfaces = interfaces.map(iface => ({
          name: iface.iface || "unknown",
          type: iface.type || "unknown",
          ip: iface.ip4 || "unknown",
          mac: iface.mac || "unknown",
          speed: iface.speed || 0,
          status: "UNKNOWN" as const
        }));

        return {
          interfaces: networkInterfaces,
          connections: {
            total: 0,
            established: 0,
            listening: 0,
            timeWait: 0,
            closeWait: 0
          },
          bandwidth: {
            rxBytes: 0,
            txBytes: 0,
            rxPackets: 0,
            txPackets: 0,
            rxErrors: 0,
            txErrors: 0
          },
          status: "OK" as const,
          health: {
            hasErrors: false,
            hasHighLatency: false,
            recommendations: ["Limited network information available"]
          }
        };
      } catch (fallbackError) {
        return {
          interfaces: [],
          connections: {
            total: 0,
            established: 0,
            listening: 0,
            timeWait: 0,
            closeWait: 0
          },
          bandwidth: {
            rxBytes: 0,
            txBytes: 0,
            rxPackets: 0,
            txPackets: 0,
            rxErrors: 0,
            txErrors: 0
          },
          status: "OK" as const,
          health: {
            hasErrors: false,
            hasHighLatency: false,
            recommendations: ["Unable to retrieve network information"]
          }
        };
      }
    }
  }
});
