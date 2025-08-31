from celery import Celery
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

BROKER = os.getenv("REDIS_URL", "redis://localhost:6379/0")
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://user:pass@localhost/ctf_platform")
app = Celery('tasks', broker=BROKER)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

AUTO_APPROVE_SECONDS = int(os.getenv("AUTO_APPROVE_SECONDS", "90"))

@app.task
def auto_approve_old_requests():
    db = SessionLocal()
    try:
        rows = db.execute(text("SELECT id, team_id, hint_id FROM hint_requests WHERE status='pending' AND requested_at < DATE_SUB(NOW(), INTERVAL :sec SECOND) FOR UPDATE"), {"sec": AUTO_APPROVE_SECONDS}).fetchall()
        for r in rows:
            db.execute(text("UPDATE hint_requests SET status='auto_approved', auto_approved_at = NOW() WHERE id = :id"), {"id": r.id})
            # perform deduction here (update teams table) as needed in a transaction
            print(f"Auto-approved {r.id}")
        db.commit()
    finally:
        db.close()

if __name__ == '__main__':
    auto_approve_old_requests()
