import { createStep } from "@mastra/core/workflows";
import { PinoLogger } from "@mastra/loggers";
import { 
  diskUtilizationTool, 
  memoryTool, 
  latencyTool, 
  cpuTool, 
  networkTool, 
  processTool 
} from "../../tools";
import { 
  WorkflowInputSchema, 
  MetricsData, 
  MetricsDataSchema 
} from "../schemas";

const logger = new PinoLogger({
  name: 'CollectMetricsStep',
  level: 'info',
});

export const collectMetricsStep = createStep({
  id: "collect-metrics",
  description: "Collect comprehensive system metrics using available monitoring tools",
  inputSchema: WorkflowInputSchema,
  outputSchema: MetricsDataSchema,
  execute: async (context: { input: any }): Promise<MetricsData> => {
    const input = context.input;
    logger.info('🔍 Starting metrics collection...', { targetUrl: input.targetUrl });
    
    try {
      // Collect all metrics in parallel for efficiency
      const [
        diskResult,
        memoryResult,
        latencyResult,
        cpuResult,
        networkResult,
        processResult
      ] = await Promise.all([
        diskUtilizationTool.execute({ context: {} }),
        memoryTool.execute({ context: {} }),
        latencyTool.execute({ 
          context: { 
            url: input.targetUrl, 
            attempts: 5, 
            timeoutMs: 10000 
          } 
        }),
        cpuTool.execute({ context: {} }),
        networkTool.execute({ context: {} }),
        processTool.execute({ context: {} })
      ]);

      // Extract the relevant data from tool results
      const metrics: MetricsData = {
        timestamp: new Date().toISOString(),
        disk: {
          highest: diskResult.highest || 0,
          status: diskResult.status || "UNKNOWN",
          mounts: diskResult.mounts || []
        },
        memory: {
          usagePercent: memoryResult.usagePercent || 0,
          status: memoryResult.status || "UNKNOWN",
          available: memoryResult.available || 0,
          total: memoryResult.total || 0
        },
        latency: {
          avgMs: latencyResult.avgMs || 0,
          p95Ms: latencyResult.p95Ms || 0,
          status: latencyResult.status || "UNKNOWN",
          samples: latencyResult.samples || []
        },
        cpu: {
          usagePercent: cpuResult.usagePercent || 0,
          status: cpuResult.status || "UNKNOWN",
          cores: cpuResult.cores || 0,
          model: cpuResult.model || "Unknown"
        },
        network: {
          status: networkResult.status || "UNKNOWN",
          interfaces: networkResult.interfaces?.length || 0,
          connections: networkResult.connections?.total || 0,
          errors: networkResult.bandwidth?.rxErrors || 0
        },
        processes: {
          count: processResult.count || 0,
          status: processResult.status || "UNKNOWN",
          critical: processResult.critical?.map(p => p.name) || []
        }
      };

      logger.info('✅ Metrics collection completed successfully', {
        diskStatus: metrics.disk.status,
        memoryStatus: metrics.memory.status,
        latencyStatus: metrics.latency.status,
        cpuStatus: metrics.cpu.status
      });

      return metrics;

    } catch (error) {
      logger.error('❌ Metrics collection failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Return default metrics with error status
      return {
        timestamp: new Date().toISOString(),
        disk: { highest: 0, status: "UNKNOWN", mounts: [] },
        memory: { usagePercent: 0, status: "UNKNOWN", available: 0, total: 0 },
        latency: { avgMs: 0, p95Ms: 0, status: "UNKNOWN", samples: [] },
        cpu: { usagePercent: 0, status: "UNKNOWN", cores: 0, model: "Unknown" },
        network: { status: "UNKNOWN", interfaces: 0, connections: 0, errors: 0 },
        processes: { count: 0, status: "UNKNOWN", critical: [] }
      };
    }
  }
});
