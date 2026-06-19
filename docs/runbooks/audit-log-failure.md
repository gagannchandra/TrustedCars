# Audit Log Failure Runbook

## Detection
- High error rate on `POST /admin/audit_logs` or internal services.
- Sentry alerts related to `AuditService.log_action`.
- `audit_log_events` metric shows 0 growth during peak hours.

## Impact
- **HIGH COMPLIANCE RISK**. Security actions are no longer being tracked.
- Admin portal may fail to load audit trails.

## Mitigation
1. Check if the database partition for `audit_logs` (if applicable) is full.
2. Verify that the RabbitMQ/Kafka queue (if audit logs become asynchronous) isn't full.

## Recovery
- Scale up database storage if the failure is due to `disk_full`.
- If a bad migration blocked inserts, run `alembic downgrade` to the last working state.

## Escalation
- Immediately escalate to Security & Compliance team, as missing audit logs may violate SLAs.
