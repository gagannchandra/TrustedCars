"""cars composite indexes and enums

Revision ID: eeabc673a01f
Revises: e49a30202d8f
Create Date: 2026-06-17 19:49:49.317278

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'eeabc673a01f'
down_revision: Union[str, None] = 'e49a30202d8f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    fuel_enum = postgresql.ENUM('petrol', 'diesel', 'electric', 'hybrid', name='fuel_type_enum')
    fuel_enum.create(op.get_bind())
    op.execute('ALTER TABLE cars ALTER COLUMN fuel_type TYPE fuel_type_enum USING fuel_type::text::fuel_type_enum')

    trans_enum = postgresql.ENUM('manual', 'automatic', name='transmission_enum')
    trans_enum.create(op.get_bind())
    op.execute('ALTER TABLE cars ALTER COLUMN transmission TYPE transmission_enum USING transmission::text::transmission_enum')

    body_enum = postgresql.ENUM('sedan', 'suv', 'hatchback', 'truck', 'coupe', 'wagon', 'convertible', 'van', name='body_type_enum')
    body_enum.create(op.get_bind())
    op.execute('ALTER TABLE cars ALTER COLUMN body_type TYPE body_type_enum USING body_type::text::body_type_enum')

    op.create_index('ix_cars_status_city', 'cars', ['status', 'city'], unique=False)
    op.create_index('ix_cars_status_make', 'cars', ['status', 'make'], unique=False)
    op.create_index('ix_cars_status_price', 'cars', ['status', 'asking_price'], unique=False)

def downgrade() -> None:
    op.drop_index('ix_cars_status_price', table_name='cars')
    op.drop_index('ix_cars_status_make', table_name='cars')
    op.drop_index('ix_cars_status_city', table_name='cars')
    
    op.execute('ALTER TABLE cars ALTER COLUMN body_type TYPE VARCHAR(50)')
    op.execute('DROP TYPE body_type_enum')
    
    op.execute('ALTER TABLE cars ALTER COLUMN transmission TYPE VARCHAR(50)')
    op.execute('DROP TYPE transmission_enum')
    
    op.execute('ALTER TABLE cars ALTER COLUMN fuel_type TYPE VARCHAR(50)')
    op.execute('DROP TYPE fuel_type_enum')
