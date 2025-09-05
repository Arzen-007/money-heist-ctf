from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models import Team, User
from ..utils.auth import get_current_user
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class TeamCreate(BaseModel):
	name: str

class TeamUpdate(BaseModel):
	name: Optional[str] = None
	total_points: Optional[int] = None
	rank: Optional[int] = None

class TeamResponse(BaseModel):
	id: int
	name: str
	total_points: int
	rank: int

# EDIT: Team members response and endpoint
class TeamMemberResponse(BaseModel):
	id: int
	username: str
	email: str
	role: str

@router.get("/{team_id}/members", response_model=List[TeamMemberResponse])
async def get_team_members(
	team_id: int,
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db)
):
	# EDIT: Authorization - allow same team members or admins only
	role_value = getattr(current_user.role, "value", str(current_user.role))
	if current_user.team_id != team_id and role_value != "admin":
		raise HTTPException(status_code=403, detail="Not authorized to view this team's members")
	members = db.query(User).filter(User.team_id == team_id).all()
	return [
		TeamMemberResponse(
			id=m.id,
			username=m.username,
			email=m.email,
			role=str(getattr(m.role, "value", m.role)),
		)
		for m in members
	]

@router.get("/", response_model=List[TeamResponse])
async def get_teams(
	skip: int = 0,
	limit: int = 100,
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db)
):
	teams = db.query(Team).offset(skip).limit(limit).all()
	return teams

@router.get("/{team_id}", response_model=TeamResponse)
async def get_team(
	team_id: int,
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db)
):
	team = db.query(Team).filter(Team.id == team_id).first()
	if not team:
		raise HTTPException(status_code=404, detail="Team not found")
	return team

@router.post("/", response_model=TeamResponse)
async def create_team(
	team_data: TeamCreate,
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db)
):
	if current_user.role not in ["admin", "moderator"]:
		raise HTTPException(status_code=403, detail="Not enough permissions")
	
	if db.query(Team).filter(Team.name == team_data.name).first():
		raise HTTPException(status_code=400, detail="Team name already exists")
	
	team = Team(name=team_data.name)
	db.add(team)
	db.commit()
	db.refresh(team)
	return team

@router.put("/{team_id}", response_model=TeamResponse)
async def update_team(
	team_id: int,
	team_update: TeamUpdate,
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db)
):
	if current_user.role not in ["admin", "moderator"]:
		raise HTTPException(status_code=403, detail="Not enough permissions")
	
	team = db.query(Team).filter(Team.id == team_id).first()
	if not team:
		raise HTTPException(status_code=404, detail="Team not found")
	
	for field, value in team_update.dict(exclude_unset=True).items():
		setattr(team, field, value)
	
	db.commit()
	db.refresh(team)
	return team

@router.delete("/{team_id}")
async def delete_team(
	team_id: int,
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db)
):
	if current_user.role != "admin":
		raise HTTPException(status_code=403, detail="Not enough permissions")
	
	team = db.query(Team).filter(Team.id == team_id).first()
	if not team:
		raise HTTPException(status_code=404, detail="Team not found")
	
	db.delete(team)
	db.commit()
	return {"message": "Team deleted successfully"}
