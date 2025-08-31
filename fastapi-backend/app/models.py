from sqlalchemy import (
    Column, Integer, BigInteger, String, DateTime, Boolean, Enum, Text,
    ForeignKey, UniqueConstraint, Index, JSON
)
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.sql import func
import enum

Base = declarative_base()

class RoleEnum(str, enum.Enum):
    player = "player"
    admin = "admin"

class WaveStatusEnum(str, enum.Enum):
    scheduled = "scheduled"
    running = "running"
    ended = "ended"

class DifficultyEnum(str, enum.Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"
    expert = "expert"

class CostTypeEnum(str, enum.Enum):
    free = "free"
    currency = "currency"
    points = "points"


class User(Base):
    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    username = Column(String(50), nullable=False, unique=True)
    email = Column(String(255), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    display_name = Column(String(255))
    role = Column(Enum(RoleEnum), nullable=False, default=RoleEnum.player)
    team_id = Column(BigInteger, ForeignKey("teams.id", ondelete="SET NULL"), index=True, nullable=True)
    xp = Column(BigInteger, default=0)
    created_at = Column(DateTime(timezone=False), server_default=func.now())
    last_active = Column(DateTime(timezone=False), nullable=True)

    team = relationship("Team", back_populates="members")


class Team(Base):
    __tablename__ = "teams"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(150), nullable=False, unique=True)
    captain_id = Column(BigInteger, ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True)
    members_count = Column(Integer, default=0)
    score_points = Column(BigInteger, default=0)
    hint_currency = Column(BigInteger, default=0)    # Intel / Keys
    free_hints_left = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=False), server_default=func.now())

    captain = relationship("User", foreign_keys=[captain_id], uselist=False)
    members = relationship("User", back_populates="team", foreign_keys=[User.team_id])


class Wave(Base):
    __tablename__ = "waves"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(100))
    start_time = Column(DateTime(timezone=False), nullable=True, index=True)
    end_time = Column(DateTime(timezone=False), nullable=True, index=True)
    status = Column(Enum(WaveStatusEnum), default=WaveStatusEnum.scheduled)


class Challenge(Base):
    __tablename__ = "challenges"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    category = Column(String(50), index=True)
    difficulty = Column(Enum(DifficultyEnum), default=DifficultyEnum.medium)
    base_points = Column(Integer, nullable=False, default=100)
    wave_id = Column(BigInteger, ForeignKey("waves.id", ondelete="CASCADE"), index=True, nullable=False)
    flag_hash = Column(String(255), nullable=True)
    visible = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=False), server_default=func.now())

    wave = relationship("Wave", backref="challenges")
    hints = relationship("Hint", back_populates="challenge")


class Hint(Base):
    __tablename__ = "hints"
    __table_args__ = (Index("ix_hints_challenge_hintnum", "challenge_id", "hint_number"),)

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    challenge_id = Column(BigInteger, ForeignKey("challenges.id", ondelete="CASCADE"), nullable=False, index=True)
    hint_number = Column(Integer, nullable=False)  # 1 or 2
    content = Column(Text, nullable=False)
    cost_type = Column(Enum(CostTypeEnum), default=CostTypeEnum.currency)
    cost_amount = Column(Integer, default=0)

    challenge = relationship("Challenge", back_populates="hints")


class Submission(Base):
    __tablename__ = "submissions"
    __table_args__ = (Index("ix_submissions_team_challenge", "team_id", "challenge_id"),)

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    team_id = Column(BigInteger, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False, index=True)
    challenge_id = Column(BigInteger, ForeignKey("challenges.id", ondelete="CASCADE"), nullable=False)
    attempt_text = Column(String(1024))
    correct = Column(Boolean, default=False)
    points_awarded = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=False), server_default=func.now())
    ip = Column(String(50))

    user = relationship("User")
    team = relationship("Team")
    challenge = relationship("Challenge")


class ScoreHistory(Base):
    __tablename__ = "score_history"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    team_id = Column(BigInteger, index=True)
    delta = Column(Integer)
    reason = Column(String(255))
    created_at = Column(DateTime(timezone=False), server_default=func.now())


class HintRequest(Base):
    __tablename__ = "hint_requests"
    __table_args__ = (Index("ix_hintreq_team_status", "team_id", "status"),)

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    team_id = Column(BigInteger, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False, index=True)
    challenge_id = Column(BigInteger, ForeignKey("challenges.id", ondelete="CASCADE"), nullable=False)
    hint_id = Column(BigInteger, ForeignKey("hints.id", ondelete="CASCADE"), nullable=False)
    requested_by = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(30), default="pending", nullable=False)  # pending/approved/rejected/auto_approved
    approved_by = Column(BigInteger, nullable=True)
    requested_at = Column(DateTime(timezone=False), server_default=func.now())
    resolved_at = Column(DateTime(timezone=False), nullable=True)
    auto_approved_at = Column(DateTime(timezone=False), nullable=True)
    note = Column(Text, nullable=True)

    team = relationship("Team")
    requester = relationship("User", foreign_keys=[requested_by])


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    team_id = Column(BigInteger, ForeignKey("teams.id"), nullable=True, index=True)  # NULL => global chat
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    message_type = Column(String(30), default="text")
    created_at = Column(DateTime(timezone=False), server_default=func.now())
    deleted = Column(Boolean, default=False)


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    actor_user_id = Column(BigInteger, index=True)
    action_type = Column(String(100))
    payload = Column(JSON)
    created_at = Column(DateTime(timezone=False), server_default=func.now())
