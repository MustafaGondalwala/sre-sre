import { createTool } from "@mastra/core/tools";
import { z } from "zod";

async function probe(url: string, timeout: number) {
  const start = Date.now();
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), timeout);
  
  try {
    const response = await fetch(url, { 
      method: "HEAD", 
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'SRE-Monitoring-Tool/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return Date.now() - start;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return timeout; // Timeout occurred
    }
    throw error; // Re-throw other errors
  } finally {
    clearTimeout(to);
  }
}

export const latencyTool = createTool({
  id: "latency_probe",
  description: "HTTP latency monitoring with comprehensive analysis including status determination and health indicators",
  inputSchema: z.object({
    url: z.string().url().default("https://httpbin.org/delay/1"),
    attempts: z.number().int().min(1).max(20).default(5),
    timeoutMs: z.number().int().min(100).max(60000).default(10000)
  }),
  outputSchema: z.object({
    url: z.string(),
    samples: z.array(z.number()),
    avgMs: z.number(),
    p95Ms: z.number(),
    p99Ms: z.number(),
    minMs: z.number(),
    maxMs: z.number(),
    status: z.enum(["OK", "WARN", "CRIT"]),
    successRate: z.number(),
    errors: z.array(z.string()),
    health: z.object({
      isStable: z.boolean(),
      hasOutliers: z.boolean(),
      recommendations: z.array(z.string())
    })
  }),
  execute: async ({ context }) => {
    const { url, attempts, timeoutMs } = context;
    const samples: number[] = [];
    const errors: string[] = [];
    let successCount = 0;
    
    // Perform latency probes
    for (let i = 0; i < attempts; i++) {
      try {
        const latency = await probe(url, timeoutMs);
        samples.push(latency);
        if (latency < timeoutMs) {
          successCount++;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`Attempt ${i + 1}: ${errorMessage}`);
        samples.push(timeoutMs); // Use timeout as failed attempt
      }
      
      // Small delay between attempts to avoid overwhelming the target
      if (i < attempts - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    if (samples.length === 0) {
      return {
        url,
        samples: [],
        avgMs: 0,
        p95Ms: 0,
        p99Ms: 0,
        minMs: 0,
        maxMs: 0,
        status: "CRIT" as const,
        successRate: 0,
        errors,
        health: {
          isStable: false,
          hasOutliers: false,
          recommendations: ["No successful latency measurements"]
        }
      };
    }
    
    // Calculate statistics
    const sorted = [...samples].sort((a, b) => a - b);
    const avg = samples.reduce((sum, val) => sum + val, 0) / samples.length;
    const min = sorted[0];
    const max = sorted[samples.length - 1];
    const p95 = sorted[Math.floor(0.95 * (sorted.length - 1))] ?? sorted[samples.length - 1];
    const p99 = sorted[Math.floor(0.99 * (sorted.length - 1))] ?? sorted[samples.length - 1];
    
    // Determine status based on thresholds
    let status: "OK" | "WARN" | "CRIT" = "OK";
    if (avg >= 5000 || p95 >= 10000) status = "CRIT";
    else if (avg >= 1000 || p95 >= 5000) status = "WARN";
    
    // Calculate success rate
    const successRate = (successCount / attempts) * 100;
    
    // Health analysis
    const isStable = max - min < avg * 0.5; // Variation less than 50% of average
    const hasOutliers = max > avg * 3; // Max is more than 3x average
    
    const recommendations = [];
    if (status === "CRIT") {
      recommendations.push("Latency is critically high - immediate investigation required");
    } else if (status === "WARN") {
      recommendations.push("Latency is elevated - monitor closely");
    }
    
    if (successRate < 100) {
      recommendations.push(`Success rate is ${successRate.toFixed(1)}% - check network connectivity`);
    }
    
    if (!isStable) {
      recommendations.push("Latency is unstable with high variance");
    }
    
    if (hasOutliers) {
      recommendations.push("High latency outliers detected - investigate network issues");
    }
    
    if (errors.length > 0) {
      recommendations.push(`Multiple errors occurred: ${errors.length} out of ${attempts} attempts`);
    }
    
    return {
      url,
      samples: samples.map(s => Math.round(s)),
      avgMs: Math.round(avg),
      p95Ms: Math.round(p95),
      p99Ms: Math.round(p99),
      minMs: Math.round(min),
      maxMs: Math.round(max),
      status,
      successRate: Math.round(successRate * 100) / 100,
      errors,
      health: {
        isStable,
        hasOutliers,
        recommendations
      }
    };
  }
});
