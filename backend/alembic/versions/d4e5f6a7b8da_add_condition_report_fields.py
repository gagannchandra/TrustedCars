"""Add condition report fields and amt transmission

Revision ID: d4e5f6a7b8da
Revises: d4e5f6a7b8c9
Create Date: 2026-06-20 23:50:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd4e5f6a7b8da'
down_revision = 'd4e5f6a7b8c9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new transmission enum value
    op.execute("ALTER TYPE transmission_enum ADD VALUE IF NOT EXISTS 'amt'")
    
    # Add condition report columns to cars
    op.add_column('cars', sa.Column('registration_number', sa.String(length=50), nullable=True))
    op.add_column('cars', sa.Column('color', sa.String(length=50), nullable=True))
    op.add_column('cars', sa.Column('has_service_history', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('cars', sa.Column('has_invoice', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('cars', sa.Column('has_insurance', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('cars', sa.Column('is_negotiable', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('cars', sa.Column('accident_history', sa.Boolean(), server_default='false', nullable=False))


def downgrade() -> None:
    op.drop_column('cars', 'accident_history')
    op.drop_column('cars', 'is_negotiable')
    op.drop_column('cars', 'has_insurance')
    op.drop_column('cars', 'has_invoice')
    op.drop_column('cars', 'has_service_history')
    op.drop_column('cars', 'color')
    op.drop_column('cars', 'registration_number')
    
    # Downgrading enum values in Postgres is non-trivial (can't simply DROP VALUE).
    # It requires creating a new type, altering the column to use the new type, and dropping the old type.
    # We will skip enum downgrade for simplicity as it's safe to keep the value.
    pass
