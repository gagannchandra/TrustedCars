# Outbox Worker Stuck Runbook

## Detection
- Metric `outbox_queue_size` constantly increasing (>100 for 5 mins).
- Metric `outbox_failed_events` spiking.
- Sentry alerts showing errors from `app.core.worker`.

## Impact
- Background tasks (emails, integrations, cascade deletes) are delayed or completely halted.
- Consistency between microservices/modules drifts.

## Mitigation
1. Check the logs for `AsyncOutboxWorker`. Are there malformed payloads causing an infinite retry loop?
2. Ensure the database is reachable (worker requires DB).
3. If an event is "poisoned", manually set its status to `failed` via the database.

## Recovery
- Restart the API pods to restart the `AsyncOutboxWorker`.
- The worker will automatically pick up `pending` and `processing` events that timed out.

## Escalation
- Escalate to the backend engineering team if the worker consistently crashes on a specific event type.
