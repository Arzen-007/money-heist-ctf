from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from ..core.database import get_db
from ..models import HintRequest, Hint, Challenge, Team, User
from ..utils.auth import get_current_user
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class HintRequestCreate(BaseModel):
    challenge_id: int
    hint_id: int
    pay_with: str  # 'free'|'currency'|'points'

class HintRequestResponse(BaseModel):
    id: int
    team_id: int
    challenge_id: int
    hint_id: int
    requested_by: int
    status: str
    approved_by: Optional[int]
    requested_at: str
    resolved_at: Optional[str]
    auto_approved_at: Optional[str]
    note: Optional[str]

@router.post("/", response_model=HintRequestResponse)
async def create_hint_request(
    payload: HintRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.team_id:
        raise HTTPException(status_code=403, detail="You must belong to a team to request hints.")

    # Check if hint exists and belongs to the challenge
    hint = db.query(Hint).filter(
        Hint.id == payload.hint_id,
        Hint.challenge_id == payload.challenge_id
    ).first()
    if not hint:
        raise HTTPException(status_code=404, detail="Hint not found for this challenge")

    # Create pending request
    db_hint_request = HintRequest(
        team_id=current_user.team_id,
        challenge_id=payload.challenge_id,
        hint_id=payload.hint_id,
        requested_by=current_user.id,
        status="pending"
    )
    db.add(db_hint_request)
    db.commit()
    db.refresh(db_hint_request)

    return db_hint_request

@router.post("/{request_id}/approve")
async def approve_hint_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Use raw SQL for transaction safety
    conn = db.connection()

    try:
        # Start transaction and lock the request row
        conn.execute(text("START TRANSACTION"))
        rq = conn.execute(
            text("SELECT * FROM hint_requests WHERE id = :id FOR UPDATE"),
            {"id": request_id}
        ).first()

        if not rq:
            conn.execute(text("ROLLBACK"))
            raise HTTPException(status_code=404, detail="Request not found")

        if rq.status != 'pending':
            conn.execute(text("ROLLBACK"))
            raise HTTPException(status_code=400, detail="Request not pending")

        # Check permissions
        if current_user.role.value != "admin":
            team_row = conn.execute(
                text("SELECT captain_id, free_hints_left, hint_currency FROM teams WHERE id = :tid FOR UPDATE"),
                {"tid": rq.team_id}
            ).first()

            if not team_row:
                conn.execute(text("ROLLBACK"))
                raise HTTPException(status_code=404, detail="Team not found")

            if team_row.captain_id != current_user.id:
                conn.execute(text("ROLLBACK"))
                raise HTTPException(status_code=403, detail="Only captain can approve")

            if team_row.free_hints_left <= 0:
                conn.execute(text("ROLLBACK"))
                raise HTTPException(status_code=400, detail="No free hints left")

            # Deduct free hints
            conn.execute(
                text("UPDATE teams SET free_hints_left = free_hints_left - 1 WHERE id = :tid"),
                {"tid": rq.team_id}
            )

        # Mark request approved
        conn.execute(
            text("UPDATE hint_requests SET status='approved', approved_by = :uid, resolved_at = NOW() WHERE id = :id"),
            {"uid": current_user.id, "id": request_id}
        )

        conn.execute(text("COMMIT"))
        return {"status": "ok", "message": "Hint approved and revealed."}

    except HTTPException:
        raise
    except Exception as e:
        try:
            conn.execute(text("ROLLBACK"))
        except Exception:
            pass
        raise HTTPException(status_code=500, detail="Server error")
    finally:
        db.close()

@router.post("/{request_id}/reject")
async def reject_hint_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check permissions and reject the request
    request = db.query(HintRequest).filter(HintRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")

    if current_user.role.value != "admin":
        team = db.query(Team).filter(Team.id == request.team_id).first()
        if team.captain_id != current_user.id:
            raise HTTPException(status_code=403, detail="Only captain can reject")

    request.status = "rejected"
    request.approved_by = current_user.id
    request.resolved_at = db.func.now()
    db.commit()

    return {"status": "ok", "message": "Hint request rejected."}

@router.get("/", response_model=List[HintRequestResponse])
async def get_hint_requests(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(HintRequest)

    if current_user.role.value != "admin":
        query = query.filter(HintRequest.team_id == current_user.team_id)

    if status_filter:
        query = query.filter(HintRequest.status == status_filter)

    requests = query.all()
    return requests

@router.get("/{request_id}", response_model=HintRequestResponse)
async def get_hint_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    request = db.query(HintRequest).filter(HintRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")

    if current_user.role.value != "admin" and request.team_id != current_user.team_id:
        raise HTTPException(status_code=403, detail="Access denied")

    return request
