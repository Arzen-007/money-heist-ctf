from sqlalchemy import Column, BigInteger, String, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base

class Submission(Base):
    __tablename__ = "submissions"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    team_id = Column(BigInteger, ForeignKey("teams.id"), nullable=False)
    challenge_id = Column(BigInteger, ForeignKey("challenges.id"), nullable=False)
    attempt_text = Column(String(1024), nullable=True)
    correct = Column(Boolean, default=False)
    points_awarded = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    ip = Column(String(50), nullable=True)

    # Relationships
    user = relationship("User", back_populates="submissions")
    challenge = relationship("Challenge", back_populates="submissions")
