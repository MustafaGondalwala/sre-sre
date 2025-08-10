import { createStep } from "@mastra/core/workflows";
import { PinoLogger } from "@mastra/loggers";
import { 
  MetricsData, 
  AnalysisData, 
  AnalysisDataSchema,
  MetricsDataSchema
} from "../schemas";

const logger = new PinoLogger({
  name: 'AnalyzeMetricsStep',
  level: 'info',
});

export const analyzeStep = createStep({
  id: "analyze-metrics",
  description: "Analyze collected metrics to identify issues and provide recommendations",
  inputSchema: MetricsDataSchema,
  outputSchema: AnalysisDataSchema,
  execute: async (context: { input: MetricsData }): Promise<AnalysisData> => {
    const metrics = context.input;
    logger.info('🧠 Starting metrics analysis...', { timestamp: metrics.timestamp });
    
    try {
      const criticalIssues: AnalysisData['criticalIssues'] = [];
      const warnings: AnalysisData['warnings'] = [];
      const recommendations: string[] = [];
      
      // Analyze disk usage
      if (metrics.disk.status === "CRIT") {
        criticalIssues.push({
          severity: "CRITICAL",
          component: "Disk",
          description: `Critical disk usage: ${metrics.disk.highest}%`,
          recommendation: "Immediate action required: Clean up disk space or expand storage"
        });
      } else if (metrics.disk.status === "WARN") {
        warnings.push({
          component: "Disk",
          description: `High disk usage: ${metrics.disk.highest}%`,
          recommendation: "Monitor closely and plan for storage cleanup"
        });
      }
      
      // Analyze memory usage
      if (metrics.memory.status === "CRIT") {
        criticalIssues.push({
          severity: "CRITICAL",
          component: "Memory",
          description: `Critical memory usage: ${metrics.memory.usagePercent}%`,
          recommendation: "Immediate action: Restart services or add more RAM"
        });
      } else if (metrics.memory.status === "WARN") {
        warnings.push({
          component: "Memory",
          description: `High memory usage: ${metrics.memory.usagePercent}%`,
          recommendation: "Investigate memory leaks and optimize applications"
        });
      }
      
      // Analyze latency
      if (metrics.latency.status === "CRIT") {
        criticalIssues.push({
          severity: "HIGH",
          component: "Network Latency",
          description: `Critical latency: ${metrics.latency.avgMs}ms average`,
          recommendation: "Check network infrastructure and server performance"
        });
      } else if (metrics.latency.status === "WARN") {
        warnings.push({
          component: "Network Latency",
          description: `High latency: ${metrics.latency.avgMs}ms average`,
          recommendation: "Monitor network performance and optimize routing"
        });
      }
      
      // Analyze CPU usage
      if (metrics.cpu.status === "CRIT") {
        criticalIssues.push({
          severity: "HIGH",
          component: "CPU",
          description: `Critical CPU usage: ${metrics.cpu.usagePercent}%`,
          recommendation: "Investigate high-CPU processes and consider scaling"
        });
      } else if (metrics.cpu.status === "WARN") {
        warnings.push({
          component: "CPU",
          description: `High CPU usage: ${metrics.cpu.usagePercent}%`,
          recommendation: "Monitor CPU trends and optimize resource usage"
        });
      }
      
      // Analyze network health
      if (metrics.network.status === "CRIT") {
        criticalIssues.push({
          severity: "HIGH",
          component: "Network",
          description: `Network errors detected: ${metrics.network.errors}`,
          recommendation: "Check network interfaces and resolve connectivity issues"
        });
      } else if (metrics.network.status === "WARN") {
        warnings.push({
          component: "Network",
          description: `Network warnings detected`,
          recommendation: "Monitor network performance and check for packet loss"
        });
      }
      
      // Analyze processes
      if (metrics.processes.status === "CRIT") {
        criticalIssues.push({
          severity: "MEDIUM",
          component: "Processes",
          description: `Critical process count: ${metrics.processes.count}`,
          recommendation: "Investigate process proliferation and clean up zombies"
        });
      } else if (metrics.processes.status === "WARN") {
        warnings.push({
          component: "Processes",
          description: `High process count: ${metrics.processes.count}`,
          recommendation: "Monitor process trends and optimize resource usage"
        });
      }
      
      // Generate overall status
      let overallStatus: "OK" | "WARN" | "CRIT" = "OK";
      if (criticalIssues.length > 0) {
        overallStatus = "CRIT";
      } else if (warnings.length > 0) {
        overallStatus = "WARN";
      }
      
      // Generate general recommendations
      if (overallStatus === "OK") {
        recommendations.push("System is healthy, continue monitoring");
        recommendations.push("Schedule regular maintenance windows");
      } else if (overallStatus === "WARN") {
        recommendations.push("Address warnings before they become critical");
        recommendations.push("Increase monitoring frequency");
      } else {
        recommendations.push("Immediate attention required for critical issues");
        recommendations.push("Consider emergency maintenance window");
        recommendations.push("Notify on-call engineers");
      }
      
      // Calculate next check-in time based on severity
      const now = new Date();
      let nextCheckInMinutes = 30; // Default 30 minutes
      
      if (overallStatus === "CRIT") {
        nextCheckInMinutes = 5; // Check every 5 minutes for critical
      } else if (overallStatus === "WARN") {
        nextCheckInMinutes = 15; // Check every 15 minutes for warnings
      }
      
      const nextCheckIn = new Date(now.getTime() + nextCheckInMinutes * 60000).toISOString();
      
      const analysis: AnalysisData = {
        overallStatus,
        criticalIssues,
        warnings,
        recommendations,
        nextCheckIn
      };
      
      logger.info('✅ Metrics analysis completed', {
        overallStatus,
        criticalIssuesCount: criticalIssues.length,
        warningsCount: warnings.length,
        recommendationsCount: recommendations.length
      });
      
      return analysis;
      
    } catch (error) {
      logger.error('❌ Metrics analysis failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Return default analysis with error status
      return {
        overallStatus: "WARN",
        criticalIssues: [{
          severity: "HIGH",
          component: "Analysis Engine",
          description: "Failed to analyze metrics",
          recommendation: "Check analysis step implementation and logs"
        }],
        warnings: [],
        recommendations: ["Review analysis step logs", "Verify data format"],
        nextCheckIn: new Date(Date.now() + 5 * 60000).toISOString()
      };
    }
  }
});
