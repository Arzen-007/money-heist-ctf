from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from ..core.database import Base

class Scoreboard(Base):
    __tablename__ = "scoreboards"

    id = Column(Integer, primary_key=True, index=True)
    wave = Column(String(20), nullable=False)
    type = Column(String(20), default="overall")  # overall, wave
    is_active = Column(Boolean, default=True)
    last_updated = Column(DateTime(timezone=True), server_default=func.now())
