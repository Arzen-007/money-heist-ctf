from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .core.database import create_tables
from .routes import auth, users, challenges, teams, scoreboard, messages, gamification

app = FastAPI(
    title="Money Heist CTF API",
    description="A Capture The Flag platform with gamification",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth, prefix="/api/auth", tags=["Authentication"])
app.include_router(users, prefix="/api/users", tags=["Users"])
app.include_router(challenges, prefix="/api/challenges", tags=["Challenges"])
app.include_router(teams, prefix="/api/teams", tags=["Teams"])
app.include_router(scoreboard, prefix="/api/scoreboard", tags=["Scoreboard"])
app.include_router(messages, prefix="/api/messages", tags=["Messages"])

@app.on_event("startup")
async def startup_event():
    # Create database tables
    create_tables()

@app.get("/")
async def root():
    return {"message": "Money Heist CTF API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
