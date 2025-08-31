from sqlalchemy import Column, BigInteger, String, Boolean, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base
import enum

class MessageType(str, enum.Enum):
    text = "text"
    system = "system"
    flag = "flag"
    moderation = "moderation"

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    team_id = Column(BigInteger, ForeignKey("teams.id"), nullable=True)  # NULL => global chat
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    message_type = Column(Enum(MessageType), default=MessageType.text)
    created_at = Column(DateTime, server_default=func.now())
    deleted = Column(Boolean, default=False)

    # Relationships
    sender = relationship("User", back_populates="messages")
    team = relationship("Team", back_populates="messages")
