"""create core ctf tables

Revision ID: 0001_create_core_tables
Revises:
Create Date: 2025-08-31 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0001_create_core_tables'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'users',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('username', sa.String(length=50), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('display_name', sa.String(length=255)),
        sa.Column('role', sa.Enum('player', 'admin', name='roleenum'), nullable=False, server_default='player'),
        sa.Column('team_id', sa.BigInteger(), nullable=True),
        sa.Column('xp', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('last_active', sa.DateTime(), nullable=True),
        sa.UniqueConstraint('username'),
        sa.UniqueConstraint('email'),
    )
    op.create_index('ix_users_email', 'users', ['email'])

    op.create_table(
        'teams',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('captain_id', sa.BigInteger(), nullable=True),
        sa.Column('members_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('score_points', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('hint_currency', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('free_hints_left', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.UniqueConstraint('name'),
    )
    op.create_index('ix_teams_captain', 'teams', ['captain_id'])

    op.create_table(
        'waves',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(length=100)),
        sa.Column('start_time', sa.DateTime(), nullable=True),
        sa.Column('end_time', sa.DateTime(), nullable=True),
        sa.Column('status', sa.Enum('scheduled', 'running', 'ended', name='wavestatusenum'), server_default='scheduled')
    )
    op.create_index('ix_waves_start', 'waves', ['start_time'])
    op.create_index('ix_waves_end', 'waves', ['end_time'])

    op.create_table(
        'challenges',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('category', sa.String(length=50)),
        sa.Column('difficulty', sa.Enum('easy', 'medium', 'hard', 'expert', name='difficultyenum'), server_default='medium'),
        sa.Column('base_points', sa.Integer(), nullable=False, server_default='100'),
        sa.Column('wave_id', sa.BigInteger(), nullable=False),
        sa.Column('flag_hash', sa.String(length=255)),
        sa.Column('visible', sa.Boolean(), nullable=False, server_default=sa.sql.expression.true()),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'))
    )
    op.create_index('ix_challenges_wave', 'challenges', ['wave_id'])
    op.create_index('ix_challenges_category', 'challenges', ['category'])

    op.create_table(
        'hints',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('challenge_id', sa.BigInteger(), nullable=False),
        sa.Column('hint_number', sa.SmallInteger(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('cost_type', sa.Enum('free','currency','points', name='costtypeenum'), server_default='currency'),
        sa.Column('cost_amount', sa.Integer(), nullable=False, server_default='0')
    )
    op.create_index('ix_hints_challenge', 'hints', ['challenge_id'])

    op.create_table(
        'submissions',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.BigInteger(), nullable=False),
        sa.Column('team_id', sa.BigInteger(), nullable=False),
        sa.Column('challenge_id', sa.BigInteger(), nullable=False),
        sa.Column('attempt_text', sa.String(length=1024)),
        sa.Column('correct', sa.Boolean(), nullable=False, server_default=sa.sql.expression.false()),
        sa.Column('points_awarded', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('ip', sa.String(length=50))
    )
    op.create_index('ix_submissions_team_challenge', 'submissions', ['team_id', 'challenge_id'])
    op.create_index('ix_submissions_user', 'submissions', ['user_id'])

    op.create_table(
        'score_history',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('team_id', sa.BigInteger(), nullable=True),
        sa.Column('delta', sa.Integer()),
        sa.Column('reason', sa.String(length=255)),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'))
    )
    op.create_index('ix_score_history_team', 'score_history', ['team_id'])

    op.create_table(
        'hint_requests',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('team_id', sa.BigInteger(), nullable=False),
        sa.Column('challenge_id', sa.BigInteger(), nullable=False),
        sa.Column('hint_id', sa.BigInteger(), nullable=False),
        sa.Column('requested_by', sa.BigInteger(), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='pending'),
        sa.Column('approved_by', sa.BigInteger(), nullable=True),
        sa.Column('requested_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.Column('auto_approved_at', sa.DateTime(), nullable=True),
        sa.Column('note', sa.Text(), nullable=True)
    )
    op.create_index('ix_hintreq_team', 'hint_requests', ['team_id'])
    op.create_index('ix_hintreq_requested_by', 'hint_requests', ['requested_by'])
    op.create_index('ix_hintreq_status', 'hint_requests', ['status'])

    op.create_table(
        'chat_messages',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('team_id', sa.BigInteger(), nullable=True),
        sa.Column('user_id', sa.BigInteger(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('message_type', sa.String(length=30), server_default='text'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('deleted', sa.Boolean(), server_default=sa.text('0'))
    )
    op.create_index('ix_chat_team', 'chat_messages', ['team_id'])
    op.create_index('ix_chat_user', 'chat_messages', ['user_id'])

    op.create_table(
        'audit_logs',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('actor_user_id', sa.BigInteger(), nullable=True),
        sa.Column('action_type', sa.String(length=100)),
        sa.Column('payload', sa.JSON()),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'))
    )
    op.create_index('ix_audit_actor', 'audit_logs', ['actor_user_id'])


def downgrade():
    op.drop_table('audit_logs')
    op.drop_table('chat_messages')
    op.drop_table('hint_requests')
    op.drop_table('score_history')
    op.drop_table('submissions')
    op.drop_table('hints')
    op.drop_table('challenges')
    op.drop_table('waves')
    op.drop_table('teams')
    op.drop_table('users')
    # NOTE: this downgrade does not drop the created ENUM types automatically in some DBs.
