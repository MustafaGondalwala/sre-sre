# Slack Notifications Setup for SRE Monitoring

This document explains how to configure Slack notifications for the SRE monitoring workflow.

## Environment Variables

Add these environment variables to your `.env` file or system environment:

```bash
# Slack Webhook URL (required for notifications)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Slack Channel (optional, defaults to #sre-alerts)
SLACK_CHANNEL=#sre-alerts
```

## How to Get a Slack Webhook URL

1. Go to [Slack API Apps](https://api.slack.com/apps)
2. Click "Create New App" → "From scratch"
3. Give your app a name (e.g., "SRE Monitoring") and select your workspace
4. Go to "Incoming Webhooks" in the left sidebar
5. Click "Activate Incoming Webhooks"
6. Click "Add New Webhook to Workspace"
7. Select the channel where you want to receive alerts
8. Copy the webhook URL and use it as your `SLACK_WEBHOOK_URL`

## What Gets Sent to Slack

The workflow will automatically send Slack notifications when:

- **Critical issues are detected** (status = "CRIT")
- **Any component has a critical status** (disk, memory, network, processes, latency, or CPU)

## Slack Message Format

The notification includes:
- 🚨 Alert header
- Overall system status
- Summary of issues
- List of critical issues (if any)
- List of warnings (if any)
- Timestamp

## Example Slack Message

```
🚨 SRE Alert: Critical System Issues Detected

Status: CRIT
Summary: 3 critical issues require immediate attention

Critical Issues:
• Critical disk usage: 97.94% on /System/Volumes/Data
• Critical memory usage: 98.9%
• Critical process count: 816 processes

Timestamp: 2024-01-15T10:30:00.000Z
```

## Testing

To test the Slack integration:

1. Set up your environment variables
2. Run the monitoring workflow
3. Check your Slack channel for notifications

## Troubleshooting

- **No notifications received**: Check that `SLACK_WEBHOOK_URL` is set correctly
- **Permission errors**: Ensure your Slack app has permission to post to the specified channel
- **Channel not found**: Verify the channel name in `SLACK_CHANNEL` exists in your workspace
