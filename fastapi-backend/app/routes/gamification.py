from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models import User
from ..utils.auth import get_current_user
from ..utils.gamification import gamification_engine
from pydantic import BaseModel
from typing import List, Dict, Optional

router = APIRouter()

class UserStatsResponse(BaseModel):
    level: int
    xp: int
    xp_progress: int
    xp_needed: int
    total_solves: int
    first_bloods: int
    current_streak: int
    longest_streak: int
    badges: List[str]
    category_breakdown: Dict[str, int]
    rank: int

class LeaderboardEntry(BaseModel):
    rank: int
    user_id: int
    username: str
    xp: int
    level: int
    xp_progress: int
    xp_needed: int
    badges: List[str]
    streak: int
    team_name: Optional[str]

class BadgeInfo(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    earned: bool

@router.get("/stats", response_model=UserStatsResponse)
async def get_user_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive gamification stats for current user"""
    return gamification_engine.get_user_stats(current_user, db)

@router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get gamification leaderboard"""
    return gamification_engine.get_leaderboard_rankings(db, limit)

@router.get("/badges")
async def get_available_badges(
    current_user: User = Depends(get_current_user)
):
    """Get all available badges with user's earned status"""
    badges_info = []
    user_badges = current_user.badges or []

    for badge_id, badge_data in gamification_engine.badges.items():
        badges_info.append(BadgeInfo(
            id=badge_id,
            name=badge_data['name'],
            description=badge_data['description'],
            icon=badge_data['icon'],
            earned=badge_id in user_badges
        ))

    return badges_info

@router.get("/level-progress")
async def get_level_progress(
    current_user: User = Depends(get_current_user)
):
    """Get detailed level progression information"""
    level, xp_progress, xp_needed = gamification_engine.get_user_level(current_user.xp)

    # Calculate XP needed for next few levels
    next_levels = []
    for i in range(1, 6):  # Next 5 levels
        next_level = level + i
        if next_level in gamification_engine.level_xp_requirements:
            next_level_xp = gamification_engine.level_xp_requirements[next_level]
            next_levels.append({
                'level': next_level,
                'xp_required': next_level_xp,
                'xp_needed_from_now': next_level_xp - current_user.xp
            })

    return {
        'current_level': level,
        'current_xp': current_user.xp,
        'xp_progress': xp_progress,
        'xp_needed_for_next': xp_needed,
        'progress_percentage': (xp_progress / xp_needed * 100) if xp_needed > 0 else 100,
        'next_levels': next_levels
    }

@router.get("/streaks")
async def get_streak_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get streak information and history"""
    current_streak, broke_streak = gamification_engine.update_streaks(current_user, db)

    # Get recent streak history (last 30 days)
    from datetime import datetime, timedelta
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)

    recent_activity = db.query(User)\
                       .filter(User.id == current_user.id)\
                       .first()

    # Calculate streak statistics
    streak_stats = {
        'current_streak': current_streak,
        'longest_streak': current_user.longest_streak,
        'streak_broken': broke_streak,
        'days_since_last_solve': 0,  # TODO: Calculate this
        'weekly_average': 0,  # TODO: Calculate this
        'monthly_total': 0   # TODO: Calculate this
    }

    return streak_stats

@router.get("/achievements")
async def get_achievements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's achievements and progress"""
    # Check for new badges
    new_badges = gamification_engine.check_badges(current_user, db)

    if new_badges:
        # Update user's badges
        current_badges = current_user.badges or []
        updated_badges = list(set(current_badges + new_badges))
        current_user.badges = updated_badges
        db.commit()

    # Get achievement progress
    achievements = []

    # Challenge solve milestones
    solve_counts = [10, 25, 50, 100, 250, 500, 1000]
    total_solves = db.query(User.solves).filter(User.id == current_user.id).scalar() or 0

    for count in solve_counts:
        achievements.append({
            'id': f'solves_{count}',
            'name': f'{count} Challenge Solves',
            'description': f'Solve {count} challenges',
            'progress': min(total_solves, count),
            'target': count,
            'completed': total_solves >= count,
            'icon': '🎯'
        })

    # XP milestones
    xp_milestones = [1000, 5000, 10000, 25000, 50000, 100000]
    for xp in xp_milestones:
        achievements.append({
            'id': f'xp_{xp}',
            'name': f'{xp} XP Earned',
            'description': f'Earn {xp} experience points',
            'progress': min(current_user.xp, xp),
            'target': xp,
            'completed': current_user.xp >= xp,
            'icon': '⭐'
        })

    # Level milestones
    level_milestones = [5, 10, 25, 50, 75, 100]
    current_level = gamification_engine.get_user_level(current_user.xp)[0]

    for level in level_milestones:
        achievements.append({
            'id': f'level_{level}',
            'name': f'Level {level}',
            'description': f'Reach level {level}',
            'progress': min(current_level, level),
            'target': level,
            'completed': current_level >= level,
            'icon': '🏆'
        })

    return {
        'achievements': achievements,
        'new_badges': new_badges,
        'total_completed': sum(1 for a in achievements if a['completed']),
        'total_achievements': len(achievements)
    }

@router.get("/xp-breakdown")
async def get_xp_breakdown(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed XP earnings breakdown"""
    from sqlalchemy import func
    from ..models import Submission, Challenge

    # XP from challenges
    challenge_xp = db.query(func.sum(Submission.points_awarded))\
                    .filter(Submission.user_id == current_user.id)\
                    .filter(Submission.status == 'correct')\
                    .scalar() or 0

    # XP from bonuses (first blood, speed, etc.)
    total_earned_xp = db.query(func.sum(Submission.xp_earned))\
                       .filter(Submission.user_id == current_user.id)\
                       .scalar() or 0

    bonus_xp = total_earned_xp - challenge_xp

    # Daily login bonuses
    daily_xp = gamification_engine.calculate_daily_xp_bonus(current_user)

    return {
        'total_xp': current_user.xp,
        'challenge_xp': challenge_xp,
        'bonus_xp': bonus_xp,
        'daily_login_xp': daily_xp,
        'breakdown': {
            'challenges': challenge_xp,
            'bonuses': bonus_xp,
            'daily_logins': daily_xp,
            'other': current_user.xp - challenge_xp - bonus_xp - daily_xp
        }
    }

@router.get("/rank-comparison")
async def get_rank_comparison(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Compare user's rank with nearby players"""
    user_rank = gamification_engine.get_user_rank(current_user.id, db)

    # Get players around user's rank
    offset = max(0, user_rank - 3)
    nearby_players = gamification_engine.get_leaderboard_rankings(db, limit=7)[offset:offset+7]

    return {
        'user_rank': user_rank,
        'nearby_players': nearby_players,
        'rank_change': 0  # TODO: Calculate rank change over time
    }
