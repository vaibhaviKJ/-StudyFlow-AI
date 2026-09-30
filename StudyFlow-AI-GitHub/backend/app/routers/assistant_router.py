from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas, auth, ai_service
from ..database import get_db

router = APIRouter(prefix="/assistant", tags=["assistant"])


def _offline_reply(message: str, weak_topics: list, active_goal: str) -> str:
    """A genuinely useful canned reply used when no AI_PROVIDER is configured.

    This is not a fake "AI" pretending to think — it's a transparent,
    rule-based helper that uses the student's actual weak-area data. It
    upgrades automatically to a real LLM the moment AI_PROVIDER is set.
    """
    m = message.lower().strip()

    if any(k in m for k in ["weak", "struggl", "bad at", "trouble"]):
        if weak_topics:
            top = ", ".join(weak_topics[:3])
            return (
                f"Based on your recent quizzes, you've missed questions most often on: {top}. "
                f"I'd suggest redoing those specific lessons before moving forward — "
                f"revisiting a topic right after missing it is one of the most effective ways to make it stick."
            )
        return "You haven't missed enough quiz questions yet for me to spot a pattern — that's a good sign! Keep going."

    if any(k in m for k in ["motivat", "give up", "hard", "difficult", "stuck"]):
        return (
            "It's normal for this to feel hard — that's usually a sign you're actually learning something new, "
            "not that something's wrong. Try breaking today's lesson into a single 10-minute block instead of "
            "the whole thing at once, and revisit your weakest quiz topic tomorrow while it's fresh."
        )

    if any(k in m for k in ["plan", "schedule", "how long", "when"]):
        return (
            f"Your current goal is: \"{active_goal}\". Stick to one day of the roadmap at a time — "
            f"the plan is deliberately paced so cramming multiple days won't actually help retention."
        )

    if any(k in m for k in ["quiz", "test", "exam"]):
        return (
            "Quizzes here regenerate fresh questions each time, so retaking one isn't about memorizing answers — "
            "it's about re-testing whether the concept actually stuck. If you're consistently missing the same "
            "topic, that's the one to slow down on."
        )

    return (
        "I can help most with: what to focus on next, why a topic feels hard, or how your weak areas are "
        "trending. Try asking something like \"what should I focus on?\" or \"why do I keep struggling with X?\""
    )


@router.post("/ask", response_model=schemas.AssistantReply)
async def ask_assistant(
    payload: schemas.AssistantRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if payload.material_id:
        material = db.query(models.StudyMaterial).filter(
            models.StudyMaterial.id == payload.material_id,
            models.StudyMaterial.user_id == current_user.id,
        ).first()
        if not material:
            raise HTTPException(status_code=404, detail="Study material not found")
        reply_text, powered_by = await ai_service.answer_from_material(
            payload.message, material.extracted_text, material.filename
        )
        return schemas.AssistantReply(reply=reply_text, powered_by=powered_by)

    # Pull real context so the reply — offline or LLM-backed — is grounded in
    # this student's actual data, not a generic canned response.
    active_roadmap = (
        db.query(models.Roadmap)
        .filter(models.Roadmap.user_id == current_user.id, models.Roadmap.status == "active")
        .order_by(models.Roadmap.created_at.desc())
        .first()
    )
    goal_text = active_roadmap.goal_text if active_roadmap else "no active goal yet"

    recent_attempts = (
        db.query(models.QuizAttempt)
        .filter(models.QuizAttempt.user_id == current_user.id)
        .order_by(models.QuizAttempt.taken_at.desc())
        .limit(5)
        .all()
    )
    weak_topics = []
    for a in recent_attempts:
        if a.weak_topics:
            weak_topics.extend([t.strip() for t in a.weak_topics.split(",") if t.strip()])

    if ai_service.AI_PROVIDER:
        prompt = (
            f"You are a supportive study coach inside an app called StudyFlow AI. "
            f"The student's current goal is: '{goal_text}'. Their recent weak quiz topics: "
            f"{', '.join(weak_topics[:5]) or 'none yet'}. Answer their question in 2-4 sentences, "
            f"warm but direct, no generic filler. Student's question: {payload.message}"
        )
        try:
            reply_text = await ai_service.call_llm(prompt)
        except Exception:
            reply_text = _offline_reply(payload.message, weak_topics, goal_text)
    else:
        reply_text = _offline_reply(payload.message, weak_topics, goal_text)

    return schemas.AssistantReply(reply=reply_text, powered_by="llm" if ai_service.AI_PROVIDER else "offline")
