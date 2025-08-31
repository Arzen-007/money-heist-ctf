from sqlalchemy import Column, BigInteger, String, Integer, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from ..core.database import Base
import enum

class HintCostType(str, enum.Enum):
    free = "free"
    currency = "currency"
    points = "points"

class Hint(Base):
    __tablename__ = "hints"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    challenge_id = Column(BigInteger, ForeignKey("challenges.id"), nullable=False)
    hint_number = Column(Integer, nullable=False)  # 1 or 2
    content = Column(Text, nullable=False)
    cost_type = Column(Enum(HintCostType), default=HintCostType.currency)
    cost_amount = Column(Integer, default=0)

    # Relationships
    challenge = relationship("Challenge", back_populates="hints")
    hint_requests = relationship("HintRequest", back_populates="hint")
