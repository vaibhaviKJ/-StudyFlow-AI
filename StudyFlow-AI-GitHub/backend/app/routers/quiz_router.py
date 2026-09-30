from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas, auth, ai_service
from ..database import get_db

router = APIRouter(prefix="/quiz", tags=["quiz"])


@router.post("/generate", response_model=schemas.QuizOut)
async def generate_quiz(
    payload: schemas.QuizGenerateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    day = db.query(models.RoadmapDay).join(models.Roadmap).filter(
        models.RoadmapDay.id == payload.roadmap_day_id, models.Roadmap.user_id == current_user.id
    ).first()
    if not day:
        raise HTTPException(status_code=404, detail="Roadmap day not found")

    questions = await ai_service.generate_quiz(day.title, payload.num_questions)
    return schemas.QuizOut(roadmap_day_id=day.id, questions=questions)


@router.post("/submit", response_model=schemas.QuizResultOut)
def submit_quiz(
    payload: schemas.QuizSubmitRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    score = 0
    weak_topics = []
    for q, ans in zip(payload.questions, payload.answers):
        if ans == q.correct_index:
            score += 1
        else:
            weak_topics.append(q.topic)

    attempt = models.QuizAttempt(
        roadmap_day_id=payload.roadmap_day_id,
        user_id=current_user.id,
        score=score,
        total=len(payload.questions),
        weak_topics=", ".join(sorted(set(weak_topics))) or "",
    )
    db.add(attempt)
    db.commit()

    return schemas.QuizResultOut(
        score=score,
        total=len(payload.questions),
        weak_topics=sorted(set(weak_topics)),
        streak=current_user.current_streak,
    )
