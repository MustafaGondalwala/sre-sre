import { createStep } from "@mastra/core/workflows";
import { PinoLogger } from "@mastra/loggers";
import { 
  MetricsData,
  AnalysisData, 
  NotificationData,
  FinalOutput, 
  FinalOutputSchema,
  AnalysisDataSchema
} from "../schemas";

const logger = new PinoLogger({
  name: 'FormatOutputStep',
  level: 'info',
});

export const formatOutputStep = createStep({
  id: "format-output",
  description: "Format and combine all workflow results into final output",
  inputSchema: AnalysisDataSchema,
  outputSchema: FinalOutputSchema,
  execute: async (context: { input: AnalysisData }): Promise<FinalOutput> => {
    const analysis = context.input;
    const executionTime = new Date().toISOString();
    
    logger.info('📋 Formatting final workflow output...', { 
      overallStatus: analysis.overallStatus,
      timestamp: executionTime
    });
    
    try {
      // In a real workflow, we would have access to previous step outputs
      // For now, we'll create a mock final output
      const finalOutput: FinalOutput = {
        workflowId: "system-monitoring",
        executionTime,
        status: analysis.overallStatus === "CRIT" ? "FAILED" : 
                analysis.overallStatus === "WARN" ? "PARTIAL" : "SUCCESS",
        metrics: {
          timestamp: executionTime,
          disk: { highest: 0, status: "OK", mounts: [] },
          memory: { usagePercent: 0, status: "OK", available: 0, total: 0 },
          latency: { avgMs: 0, p95Ms: 0, status: "OK", samples: [] },
          cpu: { usagePercent: 0, status: "OK", cores: 0, model: "Unknown" },
          network: { status: "OK", interfaces: 0, connections: 0, errors: 0 },
          processes: { count: 0, status: "OK", critical: [] }
        },
        analysis,
        notifications: undefined, // Will be populated by previous step
        summary: `System monitoring completed with status: ${analysis.overallStatus}`,
        nextExecution: analysis.nextCheckIn
      };
      
      logger.info('✅ Final output formatted successfully', {
        workflowId: finalOutput.workflowId,
        status: finalOutput.status,
        nextExecution: finalOutput.nextExecution
      });
      
      return finalOutput;
      
    } catch (error) {
      logger.error('❌ Output formatting failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Return error output
      return {
        workflowId: "system-monitoring",
        executionTime,
        status: "FAILED",
        metrics: {
          timestamp: executionTime,
          disk: { highest: 0, status: "UNKNOWN", mounts: [] },
          memory: { usagePercent: 0, status: "UNKNOWN", available: 0, total: 0 },
          latency: { avgMs: 0, p95Ms: 0, status: "UNKNOWN", samples: [] },
          cpu: { usagePercent: 0, status: "UNKNOWN", cores: 0, model: "Unknown" },
          network: { status: "UNKNOWN", interfaces: 0, connections: 0, errors: 0 },
          processes: { count: 0, status: "UNKNOWN", critical: [] }
        },
        analysis,
        notifications: undefined,
        summary: "Workflow failed during output formatting",
        nextExecution: new Date(Date.now() + 5 * 60000).toISOString()
      };
    }
  }
});
