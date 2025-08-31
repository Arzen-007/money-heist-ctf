from sqlalchemy import Column, BigInteger, String, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base
import enum

class HintRequestStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    auto_approved = "auto_approved"

class HintRequest(Base):
    __tablename__ = "hint_requests"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    team_id = Column(BigInteger, ForeignKey("teams.id"), nullable=False)
    challenge_id = Column(BigInteger, ForeignKey("challenges.id"), nullable=False)
    hint_id = Column(BigInteger, ForeignKey("hints.id"), nullable=False)
    requested_by = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(HintRequestStatus), default=HintRequestStatus.pending)
    approved_by = Column(BigInteger, ForeignKey("users.id"), nullable=True)
    requested_at = Column(DateTime, server_default=func.now())
    resolved_at = Column(DateTime, nullable=True)
    auto_approved_at = Column(DateTime, nullable=True)
    note = Column(Text, nullable=True)

    # Relationships
    team = relationship("Team", back_populates="hint_requests")
    challenge = relationship("Challenge", back_populates="hint_requests")
    hint = relationship("Hint", back_populates="hint_requests")
    requester = relationship("User", back_populates="hint_requests")
    approver = relationship("User")
