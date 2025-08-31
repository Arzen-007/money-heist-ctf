from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models import Challenge, Submission, User
from ..utils.auth import get_current_user
from pydantic import BaseModel
from typing import List, Optional
import json

router = APIRouter()

class ChallengeCreate(BaseModel):
    title: str
    description: str
    category: str
    difficulty: str
    points: int
    dynamic_points: Optional[bool] = False
    min_points: Optional[int] = 0
    max_points: Optional[int] = 0
    flag: str
    hints: Optional[List[str]] = []
    wave: str
    dependencies: Optional[List[int]] = []
    tags: Optional[List[str]] = []
    files: Optional[List[str]] = []
    max_attempts: Optional[int] = 0
    penalty_points: Optional[int] = 0

class ChallengeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    difficulty: Optional[str] = None
    points: Optional[int] = None
    dynamic_points: Optional[bool] = None
    min_points: Optional[int] = None
    max_points: Optional[int] = None
    flag: Optional[str] = None
    hints: Optional[List[str]] = None
    wave: Optional[str] = None
    dependencies: Optional[List[int]] = None
    tags: Optional[List[str]] = None
    files: Optional[List[str]] = None
    is_active: Optional[bool] = None
    max_attempts: Optional[int] = None
    penalty_points: Optional[int] = None

class ChallengeResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    difficulty: str
    points: int
    dynamic_points: bool
    min_points: int
    max_points: int
    solved_by: List[int]
    attempts: int
    solves: int
    is_active: bool
    wave: str
    tags: List[str]
    created_at: str

class SubmissionCreate(BaseModel):
    flag: str

@router.get("/", response_model=List[ChallengeResponse])
async def get_challenges(
    wave: Optional[str] = None,
    category: Optional[str] = None,
    difficulty: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Challenge).filter(Challenge.is_active == True)
    
    if wave:
        query = query.filter(Challenge.wave == wave)
    if category:
        query = query.filter(Challenge.category == category)
    if difficulty:
        query = query.filter(Challenge.difficulty == difficulty)
    
    challenges = query.all()
    
    # Convert solved_by from JSON string to list
    for challenge in challenges:
        challenge.solved_by = json.loads(challenge.solved_by) if challenge.solved_by else []
    
    return challenges

@router.get("/{challenge_id}", response_model=ChallengeResponse)
async def get_challenge(
    challenge_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    challenge.solved_by = json.loads(challenge.solved_by) if challenge.solved_by else []
    return challenge

@router.post("/", response_model=ChallengeResponse)
async def create_challenge(
    challenge_data: ChallengeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["admin", "moderator"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    db_challenge = Challenge(
        **challenge_data.dict(),
        hints=json.dumps(challenge_data.hints),
        dependencies=json.dumps(challenge_data.dependencies),
        tags=json.dumps(challenge_data.tags),
        files=json.dumps(challenge_data.files),
        solved_by=json.dumps([]),
        created_by=current_user.id
    )
    db.add(db_challenge)
    db.commit()
    db.refresh(db_challenge)
    db_challenge.solved_by = []
    return db_challenge

@router.put("/{challenge_id}", response_model=ChallengeResponse)
async def update_challenge(
    challenge_id: int,
    challenge_update: ChallengeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["admin", "moderator"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    update_data = challenge_update.dict(exclude_unset=True)
    for field in ['hints', 'dependencies', 'tags', 'files']:
        if field in update_data:
            update_data[field] = json.dumps(update_data[field])
    
    for field, value in update_data.items():
        setattr(challenge, field, value)
    
    db.commit()
    db.refresh(challenge)
    challenge.solved_by = json.loads(challenge.solved_by) if challenge.solved_by else []
    return challenge

@router.delete("/{challenge_id}")
async def delete_challenge(
    challenge_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    db.delete(challenge)
    db.commit()
    return {"message": "Challenge deleted successfully"}

@router.post("/{challenge_id}/submit", response_model=dict)
async def submit_flag(
    challenge_id: int,
    submission_data: SubmissionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    if not challenge.is_active:
        raise HTTPException(status_code=400, detail="Challenge is not active")
    
    # Check if user already solved this challenge
    solved_by = json.loads(challenge.solved_by) if challenge.solved_by else []
    if current_user.id in solved_by:
        return {"correct": False, "message": "Already solved"}
    
    # Check max attempts
    user_submissions = db.query(Submission).filter(
        Submission.user_id == current_user.id,
        Submission.challenge_id == challenge_id
    ).count()
    
    if challenge.max_attempts > 0 and user_submissions >= challenge.max_attempts:
        return {"correct": False, "message": "Max attempts reached"}
    
    # Create submission
    is_correct = submission_data.flag == challenge.flag
    points_awarded = 0
    
    if is_correct:
        points_awarded = challenge.points
        solved_by.append(current_user.id)
        challenge.solved_by = json.dumps(solved_by)
        challenge.solves += 1
        current_user.points += points_awarded
        current_user.xp += points_awarded
        current_user.level = current_user.xp // 100 + 1  # Simple leveling
    
    challenge.attempts += 1
    
    db_submission = Submission(
        user_id=current_user.id,
        team_id=current_user.team_id,
        challenge_id=challenge_id,
        flag=submission_data.flag,
        is_correct=is_correct,
        points_awarded=points_awarded
    )
    db.add(db_submission)
    db.commit()
    
    return {
        "correct": is_correct,
        "points": points_awarded if is_correct else 0,
        "message": "Correct flag!" if is_correct else "Incorrect flag"
    }
