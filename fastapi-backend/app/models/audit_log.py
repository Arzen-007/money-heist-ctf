from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from ..core.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String(100), nullable=False)
    admin_id = Column(Integer, ForeignKey("users.id"))
    target_id = Column(Integer)  # ID of the affected user/team/challenge
    details = Column(String(500))
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
