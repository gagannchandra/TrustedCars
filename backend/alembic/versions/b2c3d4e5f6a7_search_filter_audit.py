"""search filter audit

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-06-20 14:35:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import TSVECTOR


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Enums
    op.execute("COMMIT")
    op.execute("ALTER TYPE fuel_type_enum ADD VALUE IF NOT EXISTS 'cng'")
    op.execute("ALTER TYPE body_type_enum ADD VALUE IF NOT EXISTS 'mpv'")
    op.execute("ALTER TYPE body_type_enum ADD VALUE IF NOT EXISTS 'pickup'")
    op.execute("BEGIN")

    # 2. Add search_vector
    op.add_column('cars', sa.Column('search_vector', TSVECTOR, nullable=True))
    
    op.execute("""
    UPDATE cars SET search_vector = to_tsvector('english', 
        coalesce(make, '') || ' ' || coalesce(model, '') || ' ' || coalesce(variant, '') || ' ' || coalesce(city, '')
    )
    """)
    
    op.execute("""
    CREATE OR REPLACE FUNCTION cars_search_vector_update() RETURNS trigger AS $$
    BEGIN
      NEW.search_vector := to_tsvector('english',
        coalesce(NEW.make, '') || ' ' || coalesce(NEW.model, '') || ' ' || coalesce(NEW.variant, '') || ' ' || coalesce(NEW.city, '')
      );
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """)
    op.execute("""
    CREATE TRIGGER cars_search_vector_trigger
    BEFORE INSERT OR UPDATE ON cars
    FOR EACH ROW EXECUTE FUNCTION cars_search_vector_update();
    """)
    
    # 3. Drop useless indexes
    op.execute("DROP INDEX IF EXISTS ix_cars_make_pattern")
    op.execute("DROP INDEX IF EXISTS ix_cars_model_pattern")
    op.execute("DROP INDEX IF EXISTS ix_cars_variant_pattern")
    op.execute("DROP INDEX IF EXISTS ix_cars_city_pattern")
    op.execute("DROP INDEX IF EXISTS ix_cars_state_pattern")

    op.execute("DROP INDEX IF EXISTS ix_cars_status_city")
    op.execute("DROP INDEX IF EXISTS ix_cars_status_make")
    op.execute("DROP INDEX IF EXISTS ix_cars_status_price")
    
    # 4. Create new indexes
    op.execute("CREATE INDEX ix_cars_make_lower ON cars (lower(make)) WHERE deleted_at IS NULL")
    op.execute("CREATE INDEX ix_cars_model_lower ON cars (lower(model)) WHERE deleted_at IS NULL")
    op.execute("CREATE INDEX ix_cars_variant_lower ON cars (lower(variant)) WHERE deleted_at IS NULL")
    op.execute("CREATE INDEX ix_cars_city_lower ON cars (lower(city)) WHERE deleted_at IS NULL")
    op.execute("CREATE INDEX ix_cars_state_lower ON cars (lower(state)) WHERE deleted_at IS NULL")
    
    op.execute("CREATE INDEX ix_cars_search_vector ON cars USING gin(search_vector) WHERE deleted_at IS NULL")

    op.execute("""
        CREATE INDEX ix_cars_active_city ON cars (city, asking_price)
        WHERE status = 'active' AND moderation_status != 'hidden' AND deleted_at IS NULL
    """)
    op.execute("""
        CREATE INDEX ix_cars_active_make ON cars (make, asking_price)
        WHERE status = 'active' AND moderation_status != 'hidden' AND deleted_at IS NULL
    """)
    op.execute("""
        CREATE INDEX ix_cars_active_price ON cars (asking_price)
        WHERE status = 'active' AND moderation_status != 'hidden' AND deleted_at IS NULL
    """)
    op.execute("""
        CREATE INDEX ix_cars_active_year ON cars (year, asking_price)
        WHERE status = 'active' AND moderation_status != 'hidden' AND deleted_at IS NULL
    """)
    op.execute("""
        CREATE INDEX ix_cars_active_created_at ON cars (created_at)
        WHERE status = 'active' AND moderation_status != 'hidden' AND deleted_at IS NULL
    """)
    op.execute("""
        CREATE INDEX ix_cars_active_make_model ON cars (make, model)
        WHERE status = 'active' AND moderation_status != 'hidden' AND deleted_at IS NULL
    """)

    op.create_index('ix_cars_dealership_id', 'cars', ['dealership_id'], unique=False)


def downgrade() -> None:
    pass
