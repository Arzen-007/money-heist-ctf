from sqlalchemy import Column, BigInteger, String, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base
import enum

class WaveStatus(str, enum.Enum):
    scheduled = "scheduled"
    running = "running"
    ended = "ended"

class Wave(Base):
    __tablename__ = "waves"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=True)
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    status = Column(Enum(WaveStatus), default=WaveStatus.scheduled)

    # Relationships
    challenges = relationship("Challenge", back_populates="wave")
