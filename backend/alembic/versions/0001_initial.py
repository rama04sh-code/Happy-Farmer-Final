"""initial schema: all 7 tables

Revision ID: 0001
Revises:
Create Date: 2026-11-04
"""
from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None

TS = sa.DateTime(timezone=True)


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column("created_at", TS, nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "farms",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("owner_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("location", sa.String(255)),
        sa.Column("area_dunum", sa.Float),
        sa.Column("created_at", TS, nullable=False),
    )
    op.create_index("ix_farms_owner_id", "farms", ["owner_id"])

    op.create_table(
        "crops",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("farm_id", sa.Integer, sa.ForeignKey("farms.id"), nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("planting_date", sa.Date, nullable=False),
        sa.Column("created_at", TS, nullable=False),
    )
    op.create_index("ix_crops_farm_id", "crops", ["farm_id"])

    op.create_table(
        "disease_diagnoses",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("crop_id", sa.Integer, sa.ForeignKey("crops.id"), nullable=False),
        sa.Column("image_path", sa.String(500), nullable=False),
        sa.Column("disease_name", sa.String(200)),
        sa.Column("confidence", sa.Float),
        sa.Column("recommendation", sa.Text),
        sa.Column("created_at", TS, nullable=False),
    )
    op.create_index("ix_disease_diagnoses_crop_id", "disease_diagnoses", ["crop_id"])

    op.create_table(
        "sensor_readings",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("farm_id", sa.Integer, sa.ForeignKey("farms.id"), nullable=False),
        sa.Column("soil_moisture", sa.Float, nullable=False),
        sa.Column("temperature", sa.Float),
        sa.Column("source", sa.String(20), nullable=False),
        sa.Column("recorded_at", TS, nullable=False),
    )
    op.create_index("ix_sensor_readings_farm_id", "sensor_readings", ["farm_id"])
    op.create_index("ix_sensor_readings_recorded_at", "sensor_readings", ["recorded_at"])

    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("farm_id", sa.Integer, sa.ForeignKey("farms.id"), nullable=False),
        sa.Column("type", sa.String(40), nullable=False),
        sa.Column("severity", sa.String(20), nullable=False),
        sa.Column("message", sa.Text, nullable=False),
        sa.Column("is_read", sa.Boolean, nullable=False),
        sa.Column("created_at", TS, nullable=False),
    )
    op.create_index("ix_notifications_farm_id", "notifications", ["farm_id"])
    op.create_index("ix_notifications_created_at", "notifications", ["created_at"])

    op.create_table(
        "yield_predictions",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("crop_id", sa.Integer, sa.ForeignKey("crops.id"), nullable=False),
        sa.Column("estimated_kg", sa.Float, nullable=False),
        sa.Column("method", sa.String(40), nullable=False),
        sa.Column("created_at", TS, nullable=False),
    )
    op.create_index("ix_yield_predictions_crop_id", "yield_predictions", ["crop_id"])


def downgrade() -> None:
    for t in ["yield_predictions", "notifications", "sensor_readings",
              "disease_diagnoses", "crops", "farms", "users"]:
        op.drop_table(t)
