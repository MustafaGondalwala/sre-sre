import { z } from "zod";

// Input schema for the monitoring workflow
export const WorkflowInputSchema = z.object({
  targetUrl: z.string().url().optional().default("https://httpbin.org/delay/1"),
  checkInterval: z.number().int().min(30).max(3600).optional().default(300), // seconds
  enableNotifications: z.boolean().optional().default(true),
  thresholds: z.object({
    diskWarn: z.number().min(0).max(100).optional().default(80),
    diskCrit: z.number().min(0).max(100).optional().default(90),
    memoryWarn: z.number().min(0).max(100).optional().default(85),
    memoryCrit: z.number().min(0).max(100).optional().default(95),
    latencyWarn: z.number().min(0).max(60000).optional().default(1000),
    latencyCrit: z.number().min(0).max(60000).optional().default(5000),
  }).optional(),
});

// Schema for metrics collection step
export const MetricsDataSchema = z.object({
  timestamp: z.string(),
  disk: z.object({
    highest: z.number(),
    status: z.enum(["OK", "WARN", "CRIT"]),
    mounts: z.array(z.object({
      fs: z.string(),
      mount: z.string(),
      size: z.number(),
      used: z.number(),
      use: z.number(),
      status: z.enum(["OK", "WARN", "CRIT"])
    }))
  }),
  memory: z.object({
    usagePercent: z.number(),
    status: z.enum(["OK", "WARN", "CRIT"]),
    available: z.number(),
    total: z.number()
  }),
  latency: z.object({
    avgMs: z.number(),
    p95Ms: z.number(),
    status: z.enum(["OK", "WARN", "CRIT"]),
    samples: z.array(z.number())
  }),
  cpu: z.object({
    usagePercent: z.number(),
    status: z.enum(["OK", "WARN", "CRIT"]),
    cores: z.number(),
    model: z.string()
  }),
  network: z.object({
    status: z.enum(["OK", "WARN", "CRIT"]),
    interfaces: z.number(),
    connections: z.number(),
    errors: z.number()
  }),
  processes: z.object({
    count: z.number(),
    status: z.enum(["OK", "WARN", "CRIT"]),
    critical: z.array(z.string())
  })
});

// Schema for analysis step
export const AnalysisDataSchema = z.object({
  overallStatus: z.enum(["OK", "WARN", "CRIT"]),
  criticalIssues: z.array(z.object({
    severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
    component: z.string(),
    description: z.string(),
    recommendation: z.string()
  })),
  warnings: z.array(z.object({
    component: z.string(),
    description: z.string(),
    recommendation: z.string()
  })),
  recommendations: z.array(z.string()),
  nextCheckIn: z.string()
});

// Schema for notification step
export const NotificationDataSchema = z.object({
  sent: z.boolean(),
  channel: z.string(),
  message: z.string(),
  timestamp: z.string(),
  recipients: z.array(z.string()).optional()
});

// Final output schema for the workflow
export const FinalOutputSchema = z.object({
  workflowId: z.string(),
  executionTime: z.string(),
  status: z.enum(["SUCCESS", "FAILED", "PARTIAL"]),
  metrics: MetricsDataSchema,
  analysis: AnalysisDataSchema,
  notifications: NotificationDataSchema.optional(),
  summary: z.string(),
  nextExecution: z.string()
});

// Type exports for use in other files
export type WorkflowInput = z.infer<typeof WorkflowInputSchema>;
export type MetricsData = z.infer<typeof MetricsDataSchema>;
export type AnalysisData = z.infer<typeof AnalysisDataSchema>;
export type NotificationData = z.infer<typeof NotificationDataSchema>;
export type FinalOutput = z.infer<typeof FinalOutputSchema>;
