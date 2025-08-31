from sqlalchemy import Column, BigInteger, String, Integer, DateTime, Text, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base
import enum

class Difficulty(str, enum.Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"
    expert = "expert"

class Challenge(Base):
    __tablename__ = "challenges"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    category = Column(String(50), nullable=True)
    difficulty = Column(Enum(Difficulty), default=Difficulty.medium)
    base_points = Column(Integer, nullable=False, default=100)
    wave_id = Column(BigInteger, ForeignKey("waves.id"), nullable=False)
    flag_hash = Column(String(255), nullable=True)
    visible = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    submissions = relationship("Submission", back_populates="challenge")
    hints = relationship("Hint", back_populates="challenge")
    hint_requests = relationship("HintRequest", back_populates="challenge")
    wave = relationship("Wave", back_populates="challenges")

    def calculate_dynamic_points(self):
        # Simple dynamic scoring based on solves
        # This would need to be enhanced with actual solve tracking
        return self.base_points
