"""audit fixes

Revision ID: f9b8c7d6e5a4
Revises: d6f7f8d4c1a2
Create Date: 2026-06-20 12:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f9b8c7d6e5a4'
down_revision: Union[str, None] = 'd6f7f8d4c1a2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Inquiries missing foreign keys
    # Clean up orphaned rows first
    op.execute("DELETE FROM inquiry_messages WHERE sender_id NOT IN (SELECT id FROM users)")
    op.execute("DELETE FROM inquiries WHERE car_id NOT IN (SELECT id FROM cars)")
    op.execute("DELETE FROM inquiries WHERE buyer_id NOT IN (SELECT id FROM users)")
    op.execute("DELETE FROM inquiries WHERE seller_id NOT IN (SELECT id FROM users)")
    
    op.create_foreign_key(
        'fk_inquiry_messages_sender_id_users', 'inquiry_messages', 'users', ['sender_id'], ['id'], ondelete='CASCADE'
    )
    op.create_foreign_key(
        'fk_inquiries_car_id_cars', 'inquiries', 'cars', ['car_id'], ['id'], ondelete='CASCADE'
    )
    op.create_foreign_key(
        'fk_inquiries_buyer_id_users', 'inquiries', 'users', ['buyer_id'], ['id'], ondelete='CASCADE'
    )
    op.create_foreign_key(
        'fk_inquiries_seller_id_users', 'inquiries', 'users', ['seller_id'], ['id'], ondelete='CASCADE'
    )

    # 2. Add check constraints for rating
    op.create_check_constraint('chk_review_rating', 'reviews', 'rating >= 1 AND rating <= 5')
    
    # 3. Add check constraints for cars
    op.create_check_constraint('chk_car_odometer', 'cars', 'odometer_km >= 0')
    op.create_check_constraint('chk_car_asking_price', 'cars', 'asking_price > 0')
    op.create_check_constraint('chk_car_ownership_count', 'cars', 'ownership_count >= 0')
    
    # 4. Update cars indexes
    op.drop_index('ix_cars_status_city', table_name='cars')
    op.drop_index('ix_cars_status_make', table_name='cars')
    op.drop_index('ix_cars_status_price', table_name='cars')
    op.drop_index('ix_cars_fuel_type', table_name='cars')
    op.drop_index('ix_cars_transmission', table_name='cars')

    op.create_index('ix_cars_status_city', 'cars', ['status', 'city'], unique=False, postgresql_where=sa.text('deleted_at IS NULL'))
    op.create_index('ix_cars_status_make', 'cars', ['status', 'make'], unique=False, postgresql_where=sa.text('deleted_at IS NULL'))
    op.create_index('ix_cars_status_price', 'cars', ['status', 'asking_price'], unique=False, postgresql_where=sa.text('deleted_at IS NULL'))
    
    op.create_index('ix_cars_make_pattern', 'cars', ['make'], unique=False, postgresql_ops={'make': 'varchar_pattern_ops'})
    op.create_index('ix_cars_model_pattern', 'cars', ['model'], unique=False, postgresql_ops={'model': 'varchar_pattern_ops'})
    op.create_index('ix_cars_variant_pattern', 'cars', ['variant'], unique=False, postgresql_ops={'variant': 'varchar_pattern_ops'})
    op.create_index('ix_cars_city_pattern', 'cars', ['city'], unique=False, postgresql_ops={'city': 'varchar_pattern_ops'})
    op.create_index('ix_cars_state_pattern', 'cars', ['state'], unique=False, postgresql_ops={'state': 'varchar_pattern_ops'})


def downgrade() -> None:
    # 4. Downgrade indexes
    op.drop_index('ix_cars_state_pattern', table_name='cars')
    op.drop_index('ix_cars_city_pattern', table_name='cars')
    op.drop_index('ix_cars_variant_pattern', table_name='cars')
    op.drop_index('ix_cars_model_pattern', table_name='cars')
    op.drop_index('ix_cars_make_pattern', table_name='cars')

    op.drop_index('ix_cars_status_price', table_name='cars', postgresql_where=sa.text('deleted_at IS NULL'))
    op.drop_index('ix_cars_status_make', table_name='cars', postgresql_where=sa.text('deleted_at IS NULL'))
    op.drop_index('ix_cars_status_city', table_name='cars', postgresql_where=sa.text('deleted_at IS NULL'))

    op.create_index('ix_cars_status_price', 'cars', ['status', 'asking_price'], unique=False)
    op.create_index('ix_cars_status_make', 'cars', ['status', 'make'], unique=False)
    op.create_index('ix_cars_status_city', 'cars', ['status', 'city'], unique=False)
    op.create_index('ix_cars_transmission', 'cars', ['transmission'], unique=False)
    op.create_index('ix_cars_fuel_type', 'cars', ['fuel_type'], unique=False)

    # 3. Drop check constraints
    op.drop_constraint('chk_car_ownership_count', 'cars', type_='check')
    op.drop_constraint('chk_car_asking_price', 'cars', type_='check')
    op.drop_constraint('chk_car_odometer', 'cars', type_='check')

    # 2. Drop check constraint
    op.drop_constraint('chk_review_rating', 'reviews', type_='check')

    # 1. Drop foreign keys
    op.drop_constraint('fk_inquiries_seller_id_users', 'inquiries', type_='foreignkey')
    op.drop_constraint('fk_inquiries_buyer_id_users', 'inquiries', type_='foreignkey')
    op.drop_constraint('fk_inquiries_car_id_cars', 'inquiries', type_='foreignkey')
    op.drop_constraint('fk_inquiry_messages_sender_id_users', 'inquiry_messages', type_='foreignkey')
