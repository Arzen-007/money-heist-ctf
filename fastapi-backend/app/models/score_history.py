from sqlalchemy import Column, BigInteger, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base

class ScoreHistory(Base):
    __tablename__ = "score_history"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    team_id = Column(BigInteger, ForeignKey("teams.id"), nullable=True)
    delta = Column(Integer, nullable=True)
    reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    team = relationship("Team")
