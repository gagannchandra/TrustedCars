"""schema_guards_for_outbox_mfa_stats

Revision ID: b4d12b8f6c9a
Revises: 8c01a0f55161
Create Date: 2026-06-19 10:45:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'b4d12b8f6c9a'
down_revision: Union[str, None] = '8c01a0f55161'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS processed_events (
            event_id UUID PRIMARY KEY,
            processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        )
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS user_mfa_backup_codes (
            id UUID PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            code_hash VARCHAR(255) NOT NULL,
            used_at TIMESTAMP WITH TIME ZONE NULL,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL
        )
        """
    )
    op.execute(
        """
        CREATE UNIQUE INDEX IF NOT EXISTS uq_mfa_backup_user_code_hash
        ON user_mfa_backup_codes (user_id, code_hash)
        """
    )
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS ix_user_mfa_backup_codes_user_id
        ON user_mfa_backup_codes (user_id)
        """
    )
    op.execute(
        """
        ALTER TABLE platform_statistics
        ADD COLUMN IF NOT EXISTS total_inquiries INTEGER NOT NULL DEFAULT 0
        """
    )
    op.execute(
        """
        ALTER TABLE platform_statistics
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        """
    )


def downgrade() -> None:
    # The guarded objects belong to earlier repaired revisions on clean installs.
    # Leave them in place when stepping back from this compatibility migration.
    pass
