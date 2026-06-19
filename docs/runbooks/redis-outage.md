# Redis Outage Runbook

## Detection
- PagerDuty alert: `Redis Connection Failed`
- Metric `redis_status` drops to `0`
- Logs showing `redis.exceptions.ConnectionError`

## Impact
- Rate limiting fails (defaults to allow or deny based on config)
- Caching layer bypass leads to higher database load
- WebSockets/PubSub disconnected

## Mitigation
1. Check if the Redis process is OOM (Out Of Memory).
2. Increase Redis node size or add replicas if under heavy load.
3. Restart the Redis container/pod.

## Recovery
- Verify `GET /health/ready` returns `status: ok` for redis.
- Monitor `database_pool_usage` metric to ensure DB load stabilizes.

## Escalation
- If Redis fails to restart, escalate to Infrastructure / Platform team.
