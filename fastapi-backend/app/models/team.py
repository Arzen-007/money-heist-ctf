from sqlalchemy import Column, BigInteger, String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base

class Team(Base):
    __tablename__ = "teams"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    name = Column(String(150), unique=True, index=True, nullable=False)
    captain_id = Column(BigInteger, ForeignKey("users.id"), nullable=True)
    members_count = Column(Integer, default=0)
    score_points = Column(BigInteger, default=0)
    hint_currency = Column(BigInteger, default=0)
    free_hints_left = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    members = relationship("User", back_populates="team")
    messages = relationship("ChatMessage", back_populates="team")
    hint_requests = relationship("HintRequest", back_populates="team")
    captain = relationship("User")
