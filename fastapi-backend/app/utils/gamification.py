from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import math
from ..models import User, Challenge, Submission
from ..core.database import get_db
from sqlalchemy.orm import Session
from sqlalchemy import func

class GamificationEngine:
    def __init__(self):
        # XP multipliers for different actions
        self.xp_multipliers = {
            'challenge_solve': 1.0,
            'first_blood': 1.5,  # First to solve a challenge
            'speed_bonus': 1.2,  # Solve within time limit
            'streak_bonus': 1.1,  # Part of solving streak
            'team_bonus': 1.05,  # Team member bonus
            'daily_login': 10,
            'weekly_streak': 50,
            'monthly_streak': 200
        }

        # Level XP requirements (cumulative)
        self.level_xp_requirements = {}
        for level in range(1, 101):  # Up to level 100
            self.level_xp_requirements[level] = 100 * (level ** 1.5)

        # Badge definitions
        self.badges = {
            'first_solve': {'name': 'Pioneer', 'description': 'First to solve any challenge', 'icon': '🏆'},
            'speed_demon': {'name': 'Speed Demon', 'description': 'Solve challenge in under 5 minutes', 'icon': '⚡'},
            'streak_master': {'name': 'Streak Master', 'description': 'Maintain 7-day solving streak', 'icon': '🔥'},
            'team_player': {'name': 'Team Player', 'description': 'Help team solve 10 challenges', 'icon': '🤝'},
            'perfectionist': {'name': 'Perfectionist', 'description': 'Solve 10 challenges without hints', 'icon': '💎'},
            'marathon_runner': {'name': 'Marathon Runner', 'description': 'Solve 50 challenges', 'icon': '🏃'},
            'category_master': {'name': 'Category Master', 'description': 'Solve all challenges in a category', 'icon': '👑'}
        }

    def calculate_challenge_xp(self, challenge: Challenge, user: User, is_first_blood: bool = False,
                              solve_time: Optional[int] = None, streak_count: int = 0) -> int:
        """Calculate XP for solving a challenge"""
        base_xp = challenge.points

        # Apply multipliers
        multiplier = self.xp_multipliers['challenge_solve']

        if is_first_blood:
            multiplier *= self.xp_multipliers['first_blood']

        if solve_time and solve_time < 300:  # Under 5 minutes
            multiplier *= self.xp_multipliers['speed_bonus']

        if streak_count >= 3:
            multiplier *= self.xp_multipliers['streak_bonus']

        if user.team_id:
            multiplier *= self.xp_multipliers['team_bonus']

        return int(base_xp * multiplier)

    def get_user_level(self, total_xp: int) -> Tuple[int, int, int]:
        """Get user's current level, current level XP, and XP needed for next level"""
        level = 1
        for lvl, xp_required in self.level_xp_requirements.items():
            if total_xp >= xp_required:
                level = lvl
            else:
                break

        current_level_xp = self.level_xp_requirements.get(level, 0)
        next_level_xp = self.level_xp_requirements.get(level + 1, current_level_xp + 1000)

        xp_progress = total_xp - current_level_xp
        xp_needed = next_level_xp - current_level_xp

        return level, xp_progress, xp_needed

    def check_badges(self, user: User, db: Session) -> List[str]:
        """Check and award new badges to user"""
        new_badges = []

        # First solve badge
        first_solve_count = db.query(Submission)\
                             .filter(Submission.user_id == user.id)\
                             .join(Challenge, Submission.challenge_id == Challenge.id)\
                             .filter(Submission.is_first_blood == True)\
                             .count()
        if first_solve_count > 0 and 'first_solve' not in (user.badges or []):
            new_badges.append('first_solve')

        # Speed demon badge
        speed_solves = db.query(Submission)\
                        .filter(Submission.user_id == user.id)\
                        .filter(Submission.solve_time < 300)\
                        .count()
        if speed_solves >= 5 and 'speed_demon' not in (user.badges or []):
            new_badges.append('speed_demon')

        # Streak master badge
        if user.current_streak >= 7 and 'streak_master' not in (user.badges or []):
            new_badges.append('streak_master')

        # Marathon runner badge
        total_solves = db.query(Submission)\
                        .filter(Submission.user_id == user.id)\
                        .filter(Submission.status == 'correct')\
                        .count()
        if total_solves >= 50 and 'marathon_runner' not in (user.badges or []):
            new_badges.append('marathon_runner')

        # Perfectionist badge (solves without hints)
        perfect_solves = db.query(Submission)\
                          .filter(Submission.user_id == user.id)\
                          .filter(Submission.status == 'correct')\
                          .filter(Submission.hints_used == 0)\
                          .count()
        if perfect_solves >= 10 and 'perfectionist' not in (user.badges or []):
            new_badges.append('perfectionist')

        return new_badges

    def update_streaks(self, user: User, db: Session) -> Tuple[int, bool]:
        """Update user's solving streak"""
        # Get user's recent solves
        recent_solves = db.query(Submission)\
                         .filter(Submission.user_id == user.id)\
                         .filter(Submission.status == 'correct')\
                         .order_by(Submission.created_at.desc())\
                         .limit(10)\
                         .all()

        if not recent_solves:
            return 0, False

        # Check for consecutive days
        streak = 0
        last_date = None
        broke_streak = False

        for solve in recent_solves:
            solve_date = solve.created_at.date()

            if last_date is None:
                streak = 1
                last_date = solve_date
            elif solve_date == last_date:
                # Same day, don't increment streak
                continue
            elif solve_date == last_date - timedelta(days=1):
                # Consecutive day
                streak += 1
                last_date = solve_date
            else:
                # Streak broken
                broke_streak = True
                break

        # Check if streak was maintained today
        today = datetime.utcnow().date()
        if recent_solves and recent_solves[0].created_at.date() == today:
            # Has solve today, streak maintained
            pass
        elif last_date and (today - last_date).days <= 1:
            # No solve today but streak still active
            pass
        else:
            # Streak broken
            broke_streak = True
            streak = 0

        return streak, broke_streak

    def calculate_daily_xp_bonus(self, user: User) -> int:
        """Calculate daily login XP bonus"""
        base_bonus = self.xp_multipliers['daily_login']

        # Streak bonus
        if user.login_streak >= 7:
            base_bonus += self.xp_multipliers['weekly_streak']
        if user.login_streak >= 30:
            base_bonus += self.xp_multipliers['monthly_streak']

        return int(base_bonus)

    def get_leaderboard_rankings(self, db: Session, limit: int = 100) -> List[Dict]:
        """Get gamification leaderboard"""
        users = db.query(User)\
                 .filter(User.is_blocked == False)\
                 .order_by(User.xp.desc())\
                 .limit(limit)\
                 .all()

        rankings = []
        for i, user in enumerate(users, 1):
            level, xp_progress, xp_needed = self.get_user_level(user.xp)
            rankings.append({
                'rank': i,
                'user_id': user.id,
                'username': user.username,
                'xp': user.xp,
                'level': level,
                'xp_progress': xp_progress,
                'xp_needed': xp_needed,
                'badges': user.badges or [],
                'streak': user.current_streak,
                'team_name': user.team.name if user.team else None
            })

        return rankings

    def get_user_stats(self, user: User, db: Session) -> Dict:
        """Get comprehensive user gamification stats"""
        level, xp_progress, xp_needed = self.get_user_level(user.xp)

        # Get solve statistics
        total_solves = db.query(Submission)\
                        .filter(Submission.user_id == user.id)\
                        .filter(Submission.status == 'correct')\
                        .count()

        first_bloods = db.query(Submission)\
                        .filter(Submission.user_id == user.id)\
                        .filter(Submission.is_first_blood == True)\
                        .count()

        # Get category breakdown
        category_stats = db.query(
            Challenge.category,
            func.count(Submission.id).label('solves')
        )\
        .join(Submission, Challenge.id == Submission.challenge_id)\
        .filter(Submission.user_id == user.id)\
        .filter(Submission.status == 'correct')\
        .group_by(Challenge.category)\
        .all()

        return {
            'level': level,
            'xp': user.xp,
            'xp_progress': xp_progress,
            'xp_needed': xp_needed,
            'total_solves': total_solves,
            'first_bloods': first_bloods,
            'current_streak': user.current_streak,
            'longest_streak': user.longest_streak,
            'badges': user.badges or [],
            'category_breakdown': {cat: count for cat, count in category_stats},
            'rank': self.get_user_rank(user.id, db)
        }

    def get_user_rank(self, user_id: int, db: Session) -> int:
        """Get user's current rank"""
        user_xp = db.query(User.xp).filter(User.id == user_id).scalar()
        if user_xp is None:
            return 0

        higher_xp_count = db.query(User)\
                           .filter(User.xp > user_xp)\
                           .filter(User.is_blocked == False)\
                           .count()

        return higher_xp_count + 1

# Global gamification engine instance
gamification_engine = GamificationEngine()
