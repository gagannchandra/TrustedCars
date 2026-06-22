"""database hardening: indexes, ttl cleanup support

Revision ID: a3b4c5d6e7f8
Revises: f9b8c7d6e5a4
Create Date: 2026-06-22 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a3b4c5d6e7f8'
down_revision: Union[str, None] = 'f9b8c7d6e5a4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add index on refresh_tokens.user_id
    #    PostgreSQL does NOT auto-create indexes on FK columns.
    #    Revoking all tokens for a user (logout, password change, email change)
    #    requires a full table scan without this.
    op.create_index(
        'ix_refresh_tokens_user_id',
        'refresh_tokens',
        ['user_id'],
        unique=False,
    )

    # 2. Add index on refresh_tokens.expires_at for TTL cleanup queries
    op.create_index(
        'ix_refresh_tokens_expires_at',
        'refresh_tokens',
        ['expires_at'],
        unique=False,
    )

    # 3. Add compound index on otp_codes(email, type) for fast OTP lookup
    #    Every verify_otp call filters on both columns.
    op.create_index(
        'ix_otp_codes_email_type',
        'otp_codes',
        ['email', 'type'],
        unique=False,
    )

    # 4. Add index on otp_codes.expires_at for TTL cleanup queries
    op.create_index(
        'ix_otp_codes_expires_at',
        'otp_codes',
        ['expires_at'],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index('ix_otp_codes_expires_at', table_name='otp_codes')
    op.drop_index('ix_otp_codes_email_type', table_name='otp_codes')
    op.drop_index('ix_refresh_tokens_expires_at', table_name='refresh_tokens')
    op.drop_index('ix_refresh_tokens_user_id', table_name='refresh_tokens')
