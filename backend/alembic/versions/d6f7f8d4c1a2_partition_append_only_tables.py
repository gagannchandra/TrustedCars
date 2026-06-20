"""partition_append_only_tables

Revision ID: d6f7f8d4c1a2
Revises: b4d12b8f6c9a
Create Date: 2026-06-20 10:00:00.000000

"""
from typing import Sequence, Union
from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'd6f7f8d4c1a2'
down_revision: Union[str, None] = 'b4d12b8f6c9a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ---------------------------------------------------------
    # outbox_events partitioning
    # ---------------------------------------------------------
    op.execute("ALTER TABLE outbox_events RENAME TO outbox_events_old;")
    op.execute("ALTER TABLE outbox_events_old DROP CONSTRAINT outbox_events_pkey CASCADE;")
    
    op.execute("DROP INDEX IF EXISTS ix_outbox_events_event_type;")
    op.execute("DROP INDEX IF EXISTS ix_outbox_events_correlation_id;")
    op.execute("DROP INDEX IF EXISTS ix_outbox_events_causation_id;")
    op.execute("DROP INDEX IF EXISTS ix_outbox_events_idempotency_key;")
    op.execute("DROP INDEX IF EXISTS ix_outbox_events_status;")
    op.execute("DROP INDEX IF EXISTS ix_outbox_events_status_next_retry_at;")
    op.execute("DROP INDEX IF EXISTS ix_outbox_events_status_last_attempt_at;")

    op.execute("""
        CREATE TABLE outbox_events (
            id UUID NOT NULL,
            event_type VARCHAR(255) NOT NULL,
            payload TEXT NOT NULL,
            correlation_id UUID,
            causation_id UUID,
            idempotency_key VARCHAR(255),
            status outboxeventstatus NOT NULL,
            retry_count INTEGER NOT NULL,
            max_retries INTEGER NOT NULL,
            last_attempt_at TIMESTAMP WITH TIME ZONE,
            next_retry_at TIMESTAMP WITH TIME ZONE,
            error TEXT,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL,
            processed_at TIMESTAMP WITH TIME ZONE,
            PRIMARY KEY (id, created_at)
        ) PARTITION BY RANGE (created_at);
    """)

    # Create partitions
    op.execute("CREATE TABLE outbox_events_y2026m06 PARTITION OF outbox_events FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');")
    op.execute("CREATE TABLE outbox_events_y2026m07 PARTITION OF outbox_events FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');")
    op.execute("CREATE TABLE outbox_events_y2026m08 PARTITION OF outbox_events FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');")
    op.execute("CREATE TABLE outbox_events_default PARTITION OF outbox_events DEFAULT;")

    # Recreate indexes
    op.execute("CREATE INDEX ix_outbox_events_event_type ON outbox_events (event_type);")
    op.execute("CREATE INDEX ix_outbox_events_correlation_id ON outbox_events (correlation_id);")
    op.execute("CREATE INDEX ix_outbox_events_causation_id ON outbox_events (causation_id);")
    op.execute("CREATE UNIQUE INDEX ix_outbox_events_idempotency_key ON outbox_events (idempotency_key, created_at);")
    op.execute("CREATE INDEX ix_outbox_events_status ON outbox_events (status);")
    op.execute("CREATE INDEX ix_outbox_events_status_next_retry_at ON outbox_events (status, next_retry_at);")
    op.execute("CREATE INDEX ix_outbox_events_status_last_attempt_at ON outbox_events (status, last_attempt_at);")

    op.execute("INSERT INTO outbox_events SELECT * FROM outbox_events_old;")
    op.execute("DROP TABLE outbox_events_old;")

    # ---------------------------------------------------------
    # audit_logs partitioning
    # ---------------------------------------------------------
    op.execute("ALTER TABLE audit_logs RENAME TO audit_logs_old;")
    op.execute("ALTER TABLE audit_logs_old DROP CONSTRAINT audit_logs_pkey CASCADE;")
    
    op.execute("DROP INDEX IF EXISTS ix_audit_logs_user_id;")
    op.execute("DROP INDEX IF EXISTS ix_audit_logs_target_id;")
    op.execute("DROP INDEX IF EXISTS ix_audit_logs_correlation_id;")
    op.execute("DROP INDEX IF EXISTS ix_audit_logs_request_id;")
    op.execute("DROP INDEX IF EXISTS ix_audit_logs_created_id;")
    op.execute("DROP INDEX IF EXISTS ix_audit_logs_actor_created;")
    op.execute("DROP INDEX IF EXISTS ix_audit_logs_target_created;")
    op.execute("DROP INDEX IF EXISTS ix_audit_logs_action_created;")
    op.execute("DROP INDEX IF EXISTS ix_audit_logs_corr_created;")

    op.execute("""
        CREATE TABLE audit_logs (
            id UUID NOT NULL,
            user_id UUID NOT NULL,
            action VARCHAR(100) NOT NULL,
            target_id UUID,
            reason TEXT,
            details TEXT,
            correlation_id UUID,
            request_id UUID,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL,
            PRIMARY KEY (id, created_at)
        ) PARTITION BY RANGE (created_at);
    """)

    op.execute("CREATE TABLE audit_logs_y2026m06 PARTITION OF audit_logs FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');")
    op.execute("CREATE TABLE audit_logs_y2026m07 PARTITION OF audit_logs FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');")
    op.execute("CREATE TABLE audit_logs_y2026m08 PARTITION OF audit_logs FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');")
    op.execute("CREATE TABLE audit_logs_default PARTITION OF audit_logs DEFAULT;")

    op.execute("CREATE INDEX ix_audit_logs_user_id ON audit_logs (user_id);")
    op.execute("CREATE INDEX ix_audit_logs_target_id ON audit_logs (target_id);")
    op.execute("CREATE INDEX ix_audit_logs_correlation_id ON audit_logs (correlation_id);")
    op.execute("CREATE INDEX ix_audit_logs_request_id ON audit_logs (request_id);")
    op.execute("CREATE INDEX ix_audit_logs_created_id ON audit_logs (created_at, id);")
    op.execute("CREATE INDEX ix_audit_logs_actor_created ON audit_logs (user_id, created_at, id);")
    op.execute("CREATE INDEX ix_audit_logs_target_created ON audit_logs (target_id, created_at, id);")
    op.execute("CREATE INDEX ix_audit_logs_action_created ON audit_logs (action, created_at, id);")
    op.execute("CREATE INDEX ix_audit_logs_corr_created ON audit_logs (correlation_id, created_at, id);")

    op.execute("INSERT INTO audit_logs SELECT * FROM audit_logs_old;")
    op.execute("DROP TABLE audit_logs_old;")


def downgrade() -> None:
    # Downgrade involves moving data back to a non-partitioned table
    pass
