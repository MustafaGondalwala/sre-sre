import { createWorkflow } from "@mastra/core/workflows";
import { PinoLogger } from "@mastra/loggers";
import { 
  collectMetricsStep,
  analyzeStep,
  slackNotificationStep,
  formatOutputStep
} from "./steps";
import { 
  WorkflowInputSchema, 
  FinalOutputSchema 
} from "./schemas";

// Create logger instance
const logger = new PinoLogger({
  name: 'MonitoringWorkflow',
  level: 'info',
});

// Create the monitoring workflow
export const monitoringWorkflow = createWorkflow({
  id: "system-monitoring",
  description: "Continuous system monitoring and analysis",
  inputSchema: WorkflowInputSchema,
  outputSchema: FinalOutputSchema,
})
  .then(collectMetricsStep)
  .then(analyzeStep)
  .then(slackNotificationStep)
  .then(formatOutputStep)
  .commit();

// Log workflow creation
logger.info('🚀 Monitoring workflow created successfully', { 
  workflowId: 'system-monitoring',
  steps: ['collect-metrics', 'analyze-metrics', 'slack-notification', 'format-output']
});
