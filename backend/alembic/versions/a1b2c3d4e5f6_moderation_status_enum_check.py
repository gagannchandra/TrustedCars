"""moderation status enum check

Revision ID: a1b2c3d4e5f6
Revises: f9b8c7d6e5a4
Create Date: 2026-06-20 14:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'f9b8c7d6e5a4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Data Migration
    op.execute("UPDATE cars SET moderation_status = 'approved' WHERE moderation_status = 'approve'")
    op.execute("UPDATE cars SET moderation_status = 'rejected' WHERE moderation_status = 'reject'")
    op.execute("UPDATE cars SET moderation_status = 'hidden' WHERE moderation_status = 'hide'")
    
    op.execute("UPDATE cars SET previous_moderation_status = 'approved' WHERE previous_moderation_status = 'approve'")
    op.execute("UPDATE cars SET previous_moderation_status = 'rejected' WHERE previous_moderation_status = 'reject'")
    op.execute("UPDATE cars SET previous_moderation_status = 'hidden' WHERE previous_moderation_status = 'hide'")

    # 2. Add Constraints
    op.create_check_constraint(
        'chk_cars_moderation_status', 
        'cars', 
        "moderation_status IN ('approved', 'rejected', 'hidden')"
    )
    op.create_check_constraint(
        'chk_cars_prev_moderation_status', 
        'cars', 
        "previous_moderation_status IN ('approved', 'rejected', 'hidden')"
    )


def downgrade() -> None:
    # 1. Drop Constraints
    op.drop_constraint('chk_cars_prev_moderation_status', 'cars', type_='check')
    op.drop_constraint('chk_cars_moderation_status', 'cars', type_='check')

    # 2. Revert Data Migration
    op.execute("UPDATE cars SET moderation_status = 'approve' WHERE moderation_status = 'approved'")
    op.execute("UPDATE cars SET moderation_status = 'reject' WHERE moderation_status = 'rejected'")
    op.execute("UPDATE cars SET moderation_status = 'hide' WHERE moderation_status = 'hidden'")
    
    op.execute("UPDATE cars SET previous_moderation_status = 'approve' WHERE previous_moderation_status = 'approved'")
    op.execute("UPDATE cars SET previous_moderation_status = 'reject' WHERE previous_moderation_status = 'rejected'")
    op.execute("UPDATE cars SET previous_moderation_status = 'hide' WHERE previous_moderation_status = 'hidden'")
