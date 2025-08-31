from sqlalchemy import Column, BigInteger, String, Boolean, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base
import enum

class UserRole(str, enum.Enum):
    player = "player"
    admin = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    display_name = Column(String(255))
    role = Column(Enum(UserRole), default=UserRole.player)
    team_id = Column(BigInteger, ForeignKey("teams.id"), nullable=True)
    xp = Column(BigInteger, default=0)
    created_at = Column(DateTime, server_default=func.now())
    last_active = Column(DateTime, nullable=True)

    # Relationships
    team = relationship("Team", back_populates="members")
    submissions = relationship("Submission", back_populates="user")
    messages = relationship("ChatMessage", back_populates="sender")
    hint_requests = relationship("HintRequest", back_populates="requester")
