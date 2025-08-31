from sqlalchemy.orm import declarative_base

Base = declarative_base()

from .user import User
from .team import Team
from .challenge import Challenge
from .submission import Submission
from .chat_message import ChatMessage
from .scoreboard import Scoreboard
from .audit_log import AuditLog
from .wave import Wave
from .hint import Hint
from .hint_request import HintRequest
from .score_history import ScoreHistory
