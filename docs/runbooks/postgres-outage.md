# PostgreSQL Outage Runbook

## Detection
- PagerDuty alert: `Database Connection Failed`
- `GET /health/ready` returns 503 HTTP status
- Logs showing `asyncpg.exceptions.CannotConnectNowError`

## Impact
- **CRITICAL**: The entire application becomes read-only or completely inaccessible.
- Outbox events queue up in memory or fail.
- All core business flows halt.

## Mitigation
1. Check AWS RDS / DB console for automated failover status.
2. Verify network security groups/firewalls.
3. Check `database_pool_usage` metric for connection exhaustion prior to crash.

## Recovery
- Wait for automated failover to replica (usually < 2 minutes).
- If manual recovery is needed, execute the DR plan (`docs/disaster-recovery.md`).
- Restart API pods to clear bad connection pools.

## Escalation
- Immediately escalate to Principal SRE and Database Administrator.
