"""crop area + diagnosis status/model_version

Revision ID: 0002
Revises: 0001
Create Date: 2026-11-04
"""
from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("crops", sa.Column("area_dunum", sa.Float))
    op.add_column("disease_diagnoses", sa.Column("status", sa.String(20)))
    op.add_column("disease_diagnoses", sa.Column("model_version", sa.String(50)))


def downgrade() -> None:
    op.drop_column("disease_diagnoses", "model_version")
    op.drop_column("disease_diagnoses", "status")
    op.drop_column("crops", "area_dunum")
