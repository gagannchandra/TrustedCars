# High CPU Usage Runbook

## Detection
- Datadog/CloudWatch alerts: `CPUUtilization > 85% for 5m`.
- APM tools show `request_duration_seconds` P99 spiking.

## Impact
- Increased API latency.
- Eventual HTTP 502/504 gateway timeouts.
- Worker processes crash or starve.

## Mitigation
1. Check Auto-scaling Groups (ASG) or Kubernetes HPA. Are new nodes spinning up?
2. Use APM (Sentry) to identify the endpoint causing the spike (e.g. expensive Search/Filter queries).
3. Implement temporary rate limits on the offending endpoint via WAF/API Gateway.

## Recovery
- Wait for auto-scaling to balance the load.
- If it's a code loop, rollback the latest deployment via CD pipeline.

## Escalation
- Escalate to the backend team if a specific code path is causing catastrophic CPU consumption.
