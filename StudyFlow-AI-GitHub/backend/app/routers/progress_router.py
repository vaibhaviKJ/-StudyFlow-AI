from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/progress", tags=["progress"])


@router.get("", response_model=schemas.ProgressOut)
def get_progress(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    roadmaps = db.query(models.Roadmap).filter(models.Roadmap.user_id == current_user.id).all()
    active_roadmaps = sum(1 for r in roadmaps if r.status == "active")

    days_total = sum(len(r.days) for r in roadmaps)
    days_completed = sum(1 for r in roadmaps for d in r.days if d.status == "completed")

    avg = db.query(func.avg(models.QuizAttempt.score * 100.0 / models.QuizAttempt.total)).filter(
        models.QuizAttempt.user_id == current_user.id
    ).scalar()

    return schemas.ProgressOut(
        current_streak=current_user.current_streak,
        longest_streak=current_user.longest_streak,
        active_roadmaps=active_roadmaps,
        days_completed=days_completed,
        days_total=days_total,
        quiz_average=round(float(avg), 1) if avg else 0.0,
    )


@router.get("/history", response_model=schemas.ProgressHistoryOut)
def get_progress_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    # Last 10 quiz attempts, oldest first, for a score-over-time chart.
    attempts = (
        db.query(models.QuizAttempt)
        .filter(models.QuizAttempt.user_id == current_user.id)
        .order_by(models.QuizAttempt.taken_at.desc())
        .limit(10)
        .all()
    )
    attempts = list(reversed(attempts))
    quiz_history = [
        schemas.QuizHistoryItem(
            taken_at=a.taken_at,
            score=a.score,
            total=a.total,
            percent=round((a.score / a.total) * 100, 1) if a.total else 0.0,
        )
        for a in attempts
    ]

    # Days completed per day over the last 7 days, for a weekly activity chart.
    today = date.today()
    week_start = today - timedelta(days=6)
    completions = (
        db.query(models.RoadmapDay)
        .join(models.Roadmap)
        .filter(
            models.Roadmap.user_id == current_user.id,
            models.RoadmapDay.status == "completed",
            models.RoadmapDay.completed_at >= week_start,
        )
        .all()
    )
    counts = {(week_start + timedelta(days=i)): 0 for i in range(7)}
    for c in completions:
        d = c.completed_at.date()
        if d in counts:
            counts[d] += 1

    weekly_activity = [
        schemas.ActivityItem(date=d, count=counts[d]) for d in sorted(counts.keys())
    ]

    return schemas.ProgressHistoryOut(quiz_history=quiz_history, weekly_activity=weekly_activity)


@router.get("/weak-areas", response_model=schemas.WeakAreasOut)
def get_weak_areas(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    # Aggregates every wrong-answer topic across all of this user's quiz
    # attempts, so they (and the AI assistant) can see what actually needs
    # revision, not just a single quiz's snapshot.
    attempts = (
        db.query(models.QuizAttempt)
        .filter(models.QuizAttempt.user_id == current_user.id)
        .all()
    )
    counts = {}
    for a in attempts:
        if not a.weak_topics:
            continue
        for topic in a.weak_topics.split(", "):
            topic = topic.strip()
            if topic:
                counts[topic] = counts.get(topic, 0) + 1

    ranked = sorted(counts.items(), key=lambda kv: kv[1], reverse=True)
    areas = [schemas.WeakAreaItem(topic=t, miss_count=c) for t, c in ranked[:10]]
    return schemas.WeakAreasOut(areas=areas, total_quizzes_taken=len(attempts))
