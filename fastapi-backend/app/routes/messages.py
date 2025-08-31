from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from sqlalchemy import desc
from ..core.database import get_db
from ..models import ChatMessage, User
from ..utils.auth import get_current_user
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import json

router = APIRouter()

class MessageCreate(BaseModel):
    content: str
    message_type: str = "text"  # text, system, announcement
    is_private: bool = False
    recipient_id: Optional[int] = None

class MessageResponse(BaseModel):
    id: int
    content: str
    message_type: str
    sender_username: str
    sender_id: int
    recipient_username: Optional[str]
    recipient_id: Optional[int]
    is_private: bool
    created_at: str
    edited_at: Optional[str]

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.user_connections: dict[int, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.active_connections.append(websocket)
        self.user_connections[user_id] = websocket

    def disconnect(self, websocket: WebSocket, user_id: int):
        self.active_connections.remove(websocket)
        if user_id in self.user_connections:
            del self.user_connections[user_id]

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                # Remove dead connections
                if connection in self.active_connections:
                    self.active_connections.remove(connection)

    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.user_connections:
            try:
                await self.user_connections[user_id].send_json(message)
            except:
                # Remove dead connection
                if user_id in self.user_connections:
                    del self.user_connections[user_id]

manager = ConnectionManager()

@router.get("/", response_model=List[MessageResponse])
async def get_messages(
    skip: int = 0,
    limit: int = 50,
    message_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(ChatMessage).filter(ChatMessage.is_deleted == False)
    
    # Filter by message type
    if message_type:
        query = query.filter(ChatMessage.message_type == message_type)
    
    # Show only public messages and private messages involving current user
    query = query.filter(
        (ChatMessage.is_private == False) |
        (ChatMessage.sender_id == current_user.id) |
        (ChatMessage.recipient_id == current_user.id)
    )
    
    messages = query.order_by(desc(ChatMessage.created_at)).offset(skip).limit(limit).all()
    
    # Get sender and recipient usernames
    result = []
    for msg in messages:
        sender = db.query(User).filter(User.id == msg.sender_id).first()
        recipient = None
        if msg.recipient_id:
            recipient = db.query(User).filter(User.id == msg.recipient_id).first()
        
        result.append(MessageResponse(
            id=msg.id,
            content=msg.content,
            message_type=msg.message_type,
            sender_username=sender.username if sender else "Unknown",
            sender_id=msg.sender_id,
            recipient_username=recipient.username if recipient else None,
            recipient_id=msg.recipient_id,
            is_private=msg.is_private,
            created_at=msg.created_at.isoformat(),
            edited_at=msg.edited_at.isoformat() if msg.edited_at else None
        ))
    
    return result

@router.post("/", response_model=MessageResponse)
async def create_message(
    message_data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Validate recipient for private messages
    if message_data.is_private and not message_data.recipient_id:
        raise HTTPException(status_code=400, detail="Recipient is required for private messages")
    
    if message_data.recipient_id:
        recipient = db.query(User).filter(User.id == message_data.recipient_id).first()
        if not recipient:
            raise HTTPException(status_code=404, detail="Recipient not found")
    
    # Create message
    message = ChatMessage(
        content=message_data.content,
        message_type=message_data.message_type,
        sender_id=current_user.id,
        recipient_id=message_data.recipient_id,
        is_private=message_data.is_private
    )
    
    db.add(message)
    db.commit()
    db.refresh(message)
    
    # Broadcast message via WebSocket
    message_dict = {
        "id": message.id,
        "content": message.content,
        "message_type": message.message_type,
        "sender_username": current_user.username,
        "sender_id": current_user.id,
        "recipient_username": recipient.username if message_data.recipient_id and recipient else None,
        "recipient_id": message.recipient_id,
        "is_private": message.is_private,
        "created_at": message.created_at.isoformat(),
        "edited_at": None
    }
    
    if message.is_private and message.recipient_id:
        # Send to both sender and recipient
        await manager.send_personal_message(message_dict, current_user.id)
        await manager.send_personal_message(message_dict, message.recipient_id)
    else:
        # Broadcast to all
        await manager.broadcast(message_dict)
    
    return MessageResponse(**message_dict)

@router.put("/{message_id}", response_model=MessageResponse)
async def update_message(
    message_id: int,
    message_data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    message = db.query(ChatMessage).filter(ChatMessage.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Check permissions
    if message.sender_id != current_user.id and current_user.role not in ["admin", "moderator"]:
        raise HTTPException(status_code=403, detail="Not authorized to edit this message")
    
    # Update message
    message.content = message_data.content
    message.edited_at = datetime.utcnow()
    
    db.commit()
    db.refresh(message)
    
    # Get usernames
    sender = db.query(User).filter(User.id == message.sender_id).first()
    recipient = None
    if message.recipient_id:
        recipient = db.query(User).filter(User.id == message.recipient_id).first()
    
    message_dict = {
        "id": message.id,
        "content": message.content,
        "message_type": message.message_type,
        "sender_username": sender.username if sender else "Unknown",
        "sender_id": message.sender_id,
        "recipient_username": recipient.username if recipient else None,
        "recipient_id": message.recipient_id,
        "is_private": message.is_private,
        "created_at": message.created_at.isoformat(),
        "edited_at": message.edited_at.isoformat()
    }
    
    # Broadcast update
    if message.is_private and message.recipient_id:
        await manager.send_personal_message(message_dict, current_user.id)
        await manager.send_personal_message(message_dict, message.recipient_id)
    else:
        await manager.broadcast(message_dict)
    
    return MessageResponse(**message_dict)

@router.delete("/{message_id}")
async def delete_message(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    message = db.query(ChatMessage).filter(ChatMessage.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Check permissions
    if message.sender_id != current_user.id and current_user.role not in ["admin", "moderator"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this message")
    
    # Soft delete
    message.is_deleted = True
    db.commit()
    
    # Broadcast deletion
    delete_dict = {
        "type": "message_deleted",
        "message_id": message_id,
        "deleted_by": current_user.username
    }
    
    if message.is_private and message.recipient_id:
        await manager.send_personal_message(delete_dict, current_user.id)
        await manager.send_personal_message(delete_dict, message.recipient_id)
    else:
        await manager.broadcast(delete_dict)
    
    return {"message": "Message deleted successfully"}

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming messages if needed
            pass
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)

@router.get("/conversations")
async def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get unique conversation partners
    sent_messages = db.query(ChatMessage.recipient_id)\
                     .filter(ChatMessage.sender_id == current_user.id, ChatMessage.is_private == True)\
                     .distinct().subquery()
    
    received_messages = db.query(ChatMessage.sender_id)\
                         .filter(ChatMessage.recipient_id == current_user.id, ChatMessage.is_private == True)\
                         .distinct().subquery()
    
    # Combine and get user details
    conversation_user_ids = db.query(sent_messages.c.recipient_id)\
                             .union(db.query(received_messages.c.sender_id))\
                             .distinct().all()
    
    conversations = []
    for (user_id,) in conversation_user_ids:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            # Get last message
            last_message = db.query(ChatMessage)\
                           .filter(
                               ((ChatMessage.sender_id == current_user.id) & (ChatMessage.recipient_id == user_id)) |
                               ((ChatMessage.sender_id == user_id) & (ChatMessage.recipient_id == current_user.id)),
                               ChatMessage.is_private == True,
                               ChatMessage.is_deleted == False
                           )\
                           .order_by(desc(ChatMessage.created_at))\
                           .first()
            
            conversations.append({
                "user_id": user.id,
                "username": user.username,
                "last_message": last_message.content if last_message else None,
                "last_message_time": last_message.created_at.isoformat() if last_message else None,
                "unread_count": 0  # TODO: Implement unread count
            })
    
    return conversations
