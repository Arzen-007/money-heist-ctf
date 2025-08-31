from .auth import router as auth_router
from .users import router as users_router
from .challenges import router as challenges_router
from .teams import router as teams_router
from .scoreboard import router as scoreboard_router
from .messages import router as messages_router
from .gamification import router as gamification_router

auth = auth_router
users = users_router
challenges = challenges_router
teams = teams_router
scoreboard = scoreboard_router
messages = messages_router
gamification = gamification_router
