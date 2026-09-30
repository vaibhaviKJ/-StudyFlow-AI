from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas, auth, ai_service
from ..database import get_db

router = APIRouter(prefix="/roadmap", tags=["roadmap"])

FREE_MONTHLY_AI_SESSIONS = 5


@router.post("/generate", response_model=schemas.RoadmapOut)
async def generate_roadmap(
    payload: schemas.RoadmapRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if not current_user.is_pro and current_user.ai_sessions_used_this_month >= FREE_MONTHLY_AI_SESSIONS:
        raise HTTPException(
            status_code=402,
            detail="Free plan limit reached (5 AI sessions/month). Upgrade to Pro for unlimited roadmaps.",
        )

    days_data = await ai_service.generate_roadmap(payload.goal_text, payload.duration_days)

    roadmap = models.Roadmap(
        user_id=current_user.id,
        goal_text=payload.goal_text,
        duration_days=payload.duration_days,
    )
    db.add(roadmap)
    db.flush()

    for d in days_data:
        db.add(models.RoadmapDay(
            roadmap_id=roadmap.id,
            day_number=d["day_number"],
            title=d["title"],
            summary=d.get("summary", ""),
            status="pending" if d["day_number"] > 1 else "in_progress",
        ))

    if not current_user.is_pro:
        current_user.ai_sessions_used_this_month += 1

    db.commit()
    db.refresh(roadmap)
    return roadmap


@router.get("/{roadmap_id}", response_model=schemas.RoadmapOut)
def get_roadmap(
    roadmap_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    roadmap = db.query(models.Roadmap).filter(
        models.Roadmap.id == roadmap_id, models.Roadmap.user_id == current_user.id
    ).first()
    if not roadmap:
        raise HTTPException(status_code=404, detail="Roadmap not found")
    return roadmap


@router.get("", response_model=list[schemas.RoadmapOut])
def list_roadmaps(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return db.query(models.Roadmap).filter(models.Roadmap.user_id == current_user.id).all()


@router.post("/day/{day_id}/complete", response_model=schemas.RoadmapDayOut)
def complete_day(
    day_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    from datetime import datetime, date, timedelta

    day = db.query(models.RoadmapDay).join(models.Roadmap).filter(
        models.RoadmapDay.id == day_id, models.Roadmap.user_id == current_user.id
    ).first()
    if not day:
        raise HTTPException(status_code=404, detail="Day not found")

    day.status = "completed"
    day.completed_at = datetime.utcnow()

    # unlock next day
    next_day = db.query(models.RoadmapDay).filter(
        models.RoadmapDay.roadmap_id == day.roadmap_id,
        models.RoadmapDay.day_number == day.day_number + 1,
    ).first()
    if next_day and next_day.status == "pending":
        next_day.status = "in_progress"

    # Make tomorrow's plan respond to evidence from today's quiz, rather than
    # leaving a static roadmap after the learner has revealed a knowledge gap.
    attempts = db.query(models.QuizAttempt).filter(
        models.QuizAttempt.user_id == current_user.id,
        models.QuizAttempt.roadmap_day_id == day.id,
    ).all()
    missed_topics = []
    for attempt in attempts:
        missed_topics.extend(topic.strip() for topic in (attempt.weak_topics or "").split(",") if topic.strip())
    if next_day and missed_topics:
        priority = max(set(missed_topics), key=missed_topics.count)
        prefix = f"Priority revision: {priority}. "
        if not (next_day.summary or "").startswith("Priority revision:"):
            next_day.summary = prefix + (next_day.summary or "")

    # streak logic
    today = date.today()
    if current_user.last_activity_date == today:
        pass
    elif current_user.last_activity_date == today - timedelta(days=1):
        current_user.current_streak += 1
    else:
        current_user.current_streak = 1
    current_user.last_activity_date = today
    current_user.longest_streak = max(current_user.longest_streak, current_user.current_streak)

    db.commit()
    db.refresh(day)
    return day
