# High Memory Usage Runbook

## Detection
- Datadog/CloudWatch alerts: `MemoryUtilization > 90% for 5m`.
- Pods restarting with `OOMKilled` reasons.

## Impact
- Hard crashes of the API.
- 502 Bad Gateway errors for users.
- In-flight requests are dropped.

## Mitigation
1. Check APM to see if large payloads (e.g., uploading massive images) are bypassing limits.
2. Review the `database_pool_usage` metric; excessive connections consume memory.
3. Scale up memory requests/limits in Kubernetes (`resources.limits.memory`).

## Recovery
- Restarting pods clears the memory temporarily.
- If caused by a memory leak, rolling back to the previous stable release is required.

## Escalation
- Escalate to the platform team to increase memory limits permanently if base load has increased.
