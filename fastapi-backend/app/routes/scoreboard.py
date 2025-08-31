from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from ..core.database import get_db
from ..models import User, Team, Challenge, Submission
from ..utils.auth import get_current_user
from pydantic import BaseModel
from typing import List, Optional
import json

router = APIRouter()

class ScoreboardEntry(BaseModel):
    rank: int
    id: int
    username: str
    team_name: Optional[str]
    points: int
    solves: int
    last_solve: Optional[str]

class TeamScoreboardEntry(BaseModel):
    rank: int
    id: int
    name: str
    total_points: int
    member_count: int
    solves: int
    last_solve: Optional[str]

@router.get("/individual", response_model=List[ScoreboardEntry])
async def get_individual_scoreboard(
    wave: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(
        User.id,
        User.username,
        Team.name.label('team_name'),
        User.points,
        User.solves,
        User.last_solve
    ).outerjoin(Team, User.team_id == Team.id).filter(User.is_blocked == False)
    
    if wave:
        # Filter by wave-specific challenges
        wave_challenges = db.query(Challenge.id).filter(Challenge.wave == wave).subquery()
        wave_solves = db.query(
            Submission.user_id,
            func.count(Submission.id).label('wave_solves'),
            func.sum(Challenge.points).label('wave_points')
        ).join(Challenge, Submission.challenge_id == Challenge.id)\
         .filter(Submission.challenge_id.in_(wave_challenges))\
         .group_by(Submission.user_id).subquery()
        
        query = query.outerjoin(wave_solves, User.id == wave_solves.c.user_id)\
                    .add_columns(wave_solves.c.wave_points, wave_solves.c.wave_solves)
    
    if wave:
        query = query.order_by(desc('wave_points'), desc('wave_solves'), desc(User.points))
    else:
        query = query.order_by(desc(User.points), desc(User.solves), User.last_solve.desc().nulls_last())
    
    results = query.limit(limit).all()
    
    scoreboard = []
    for i, result in enumerate(results, 1):
        if wave:
            points = result.wave_points or 0
            solves = result.wave_solves or 0
        else:
            points = result.points
            solves = result.solves
            
        scoreboard.append(ScoreboardEntry(
            rank=i,
            id=result.id,
            username=result.username,
            team_name=result.team_name,
            points=points,
            solves=solves,
            last_solve=result.last_solve.isoformat() if result.last_solve else None
        ))
    
    return scoreboard

@router.get("/teams", response_model=List[TeamScoreboardEntry])
async def get_team_scoreboard(
    wave: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(
        Team.id,
        Team.name,
        Team.total_points,
        func.count(User.id).label('member_count'),
        Team.solves,
        Team.last_solve
    ).join(User, Team.id == User.team_id)\
     .filter(User.is_blocked == False)\
     .group_by(Team.id, Team.name, Team.total_points, Team.solves, Team.last_solve)
    
    if wave:
        # Filter by wave-specific challenges
        wave_challenges = db.query(Challenge.id).filter(Challenge.wave == wave).subquery()
        wave_team_stats = db.query(
            Team.id,
            func.sum(Challenge.points).label('wave_points'),
            func.count(Submission.id).label('wave_solves')
        ).join(User, Team.id == User.team_id)\
         .join(Submission, User.id == Submission.user_id)\
         .join(Challenge, Submission.challenge_id == Challenge.id)\
         .filter(Submission.challenge_id.in_(wave_challenges))\
         .group_by(Team.id).subquery()
        
        query = query.outerjoin(wave_team_stats, Team.id == wave_team_stats.c.id)\
                    .add_columns(wave_team_stats.c.wave_points, wave_team_stats.c.wave_solves)
    
    if wave:
        query = query.order_by(desc('wave_points'), desc('wave_solves'), desc(Team.total_points))
    else:
        query = query.order_by(desc(Team.total_points), desc(Team.solves), Team.last_solve.desc().nulls_last())
    
    results = query.limit(limit).all()
    
    scoreboard = []
    for i, result in enumerate(results, 1):
        if wave:
            points = result.wave_points or 0
            solves = result.wave_solves or 0
        else:
            points = result.total_points
            solves = result.solves
            
        scoreboard.append(TeamScoreboardEntry(
            rank=i,
            id=result.id,
            name=result.name,
            total_points=points,
            member_count=result.member_count,
            solves=solves,
            last_solve=result.last_solve.isoformat() if result.last_solve else None
        ))
    
    return scoreboard

@router.get("/stats")
async def get_scoreboard_stats(db: Session = Depends(get_db)):
    # Overall statistics
    total_users = db.query(User).filter(User.is_blocked == False).count()
    total_teams = db.query(Team).count()
    total_challenges = db.query(Challenge).filter(Challenge.is_active == True).count()
    total_solves = db.query(Submission).count()
    
    # Top performers
    top_user = db.query(User).filter(User.is_blocked == False)\
                            .order_by(desc(User.points)).first()
    top_team = db.query(Team).order_by(desc(Team.total_points)).first()
    
    # Recent activity
    recent_solves = db.query(Submission)\
                     .join(User, Submission.user_id == User.id)\
                     .join(Challenge, Submission.challenge_id == Challenge.id)\
                     .order_by(desc(Submission.created_at))\
                     .limit(10).all()
    
    return {
        "total_users": total_users,
        "total_teams": total_teams,
        "total_challenges": total_challenges,
        "total_solves": total_solves,
        "top_user": {
            "username": top_user.username if top_user else None,
            "points": top_user.points if top_user else 0
        },
        "top_team": {
            "name": top_team.name if top_team else None,
            "points": top_team.total_points if top_team else 0
        },
        "recent_activity": [
            {
                "username": solve.user.username,
                "challenge_title": solve.challenge.title,
                "points": solve.points_awarded,
                "timestamp": solve.created_at.isoformat()
            } for solve in recent_solves
        ]
    }

@router.get("/waves")
async def get_wave_scoreboards(db: Session = Depends(get_db)):
    waves = db.query(Challenge.wave).distinct().all()
    wave_list = [wave[0] for wave in waves if wave[0]]
    
    wave_stats = {}
    for wave in wave_list:
        wave_challenges = db.query(Challenge).filter(Challenge.wave == wave, Challenge.is_active == True).all()
        wave_solves = db.query(Submission)\
                       .join(Challenge, Submission.challenge_id == Challenge.id)\
                       .filter(Challenge.wave == wave).count()
        
        wave_stats[wave] = {
            "challenges": len(wave_challenges),
            "total_points": sum(c.points for c in wave_challenges),
            "solves": wave_solves,
            "completion_rate": wave_solves / len(wave_challenges) if wave_challenges else 0
        }
    
    return wave_stats
