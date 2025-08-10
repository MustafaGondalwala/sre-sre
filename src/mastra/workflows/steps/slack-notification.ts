import { createStep } from "@mastra/core/workflows";
import { PinoLogger } from "@mastra/loggers";
import { 
  AnalysisData, 
  NotificationData, 
  NotificationDataSchema,
  AnalysisDataSchema
} from "../schemas";

const logger = new PinoLogger({
  name: 'SlackNotificationStep',
  level: 'info',
});

export const slackNotificationStep = createStep({
  id: "slack-notification",
  description: "Send Slack notifications for critical issues and warnings",
  inputSchema: AnalysisDataSchema,
  outputSchema: NotificationDataSchema,
  execute: async (context: { input: AnalysisData }): Promise<NotificationData> => {
    const analysis = context.input;
    const timestamp = new Date().toISOString();
    
    logger.info('📢 Processing Slack notifications...', { 
      overallStatus: analysis.overallStatus,
      criticalIssuesCount: analysis.criticalIssues.length,
      warningsCount: analysis.warnings.length
    });
    
    try {
      // For now, we'll simulate Slack notification
      // In a real implementation, you would integrate with Slack API
      let message = "";
      let channel = "general";
      
      if (analysis.overallStatus === "CRIT") {
        channel = "alerts";
        message = `🚨 *CRITICAL ALERT* - System health check failed\n\n`;
        message += `*Critical Issues:*\n`;
        analysis.criticalIssues.forEach(issue => {
          message += `• ${issue.component}: ${issue.description}\n`;
          message += `  Recommendation: ${issue.recommendation}\n\n`;
        });
        message += `*Next Check-in:* ${analysis.nextCheckIn}\n`;
        message += `*Immediate Action Required*`;
      } else if (analysis.overallStatus === "WARN") {
        channel = "monitoring";
        message = `⚠️ *WARNING* - System health check warnings\n\n`;
        message += `*Warnings:*\n`;
        analysis.warnings.forEach(warning => {
          message += `• ${warning.component}: ${warning.description}\n`;
          message += `  Recommendation: ${warning.recommendation}\n\n`;
        });
        message += `*Next Check-in:* ${analysis.nextCheckIn}\n`;
        message += `*Monitor closely*`;
      } else {
        channel = "monitoring";
        message = `✅ *System Healthy* - All systems operational\n\n`;
        message += `*Status:* All metrics within normal ranges\n`;
        message += `*Next Check-in:* ${analysis.nextCheckIn}\n`;
        message += `*Continue monitoring*`;
      }
      
      // Add recommendations if any
      if (analysis.recommendations.length > 0) {
        message += `\n\n*Recommendations:*\n`;
        analysis.recommendations.forEach(rec => {
          message += `• ${rec}\n`;
        });
      }
      
      const notification: NotificationData = {
        sent: true, // In real implementation, this would be based on actual Slack API response
        channel,
        message,
        timestamp,
        recipients: ["sre-team", "oncall"]
      };
      
      logger.info('✅ Slack notification processed', {
        channel,
        messageLength: message.length,
        sent: notification.sent
      });
      
      return notification;
      
    } catch (error) {
      logger.error('❌ Slack notification failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Return failed notification
      return {
        sent: false,
        channel: "unknown",
        message: "Failed to send notification",
        timestamp,
        recipients: []
      };
    }
  }
});
