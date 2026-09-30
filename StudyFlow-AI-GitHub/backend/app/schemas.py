from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime, date


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    is_pro: bool
    current_streak: int
    longest_streak: int
    ai_sessions_used_this_month: int

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class RoadmapRequest(BaseModel):
    goal_text: str
    duration_days: int = 30


class RoadmapDayOut(BaseModel):
    id: int
    roadmap_id: int
    day_number: int
    title: str
    summary: Optional[str] = None
    status: str
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class RoadmapOut(BaseModel):
    id: int
    goal_text: str
    duration_days: int
    status: str
    days: List[RoadmapDayOut]

    class Config:
        from_attributes = True


class QuizGenerateRequest(BaseModel):
    roadmap_day_id: int
    num_questions: int = 5


class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_index: int
    topic: str


class QuizOut(BaseModel):
    roadmap_day_id: int
    questions: List[QuizQuestion]


class QuizSubmitRequest(BaseModel):
    roadmap_day_id: int
    answers: List[int]
    questions: List[QuizQuestion]


class QuizResultOut(BaseModel):
    score: int
    total: int
    weak_topics: List[str]
    streak: int


class ProgressOut(BaseModel):
    current_streak: int
    longest_streak: int
    active_roadmaps: int
    days_completed: int
    days_total: int
    quiz_average: float


class QuizHistoryItem(BaseModel):
    taken_at: datetime
    score: int
    total: int
    percent: float


class ActivityItem(BaseModel):
    date: date
    count: int


class ProgressHistoryOut(BaseModel):
    quiz_history: List[QuizHistoryItem]
    weekly_activity: List[ActivityItem]


class WeakAreaItem(BaseModel):
    topic: str
    miss_count: int


class WeakAreasOut(BaseModel):
    areas: List[WeakAreaItem]
    total_quizzes_taken: int


class AssistantRequest(BaseModel):
    message: str
    material_id: Optional[int] = None


class AssistantReply(BaseModel):
    reply: str
    powered_by: str


class Flashcard(BaseModel):
    question: str
    answer: str


class MaterialOut(BaseModel):
    id: int
    filename: str
    summary: str
    important_topics: List[str]
    flashcards: List[Flashcard]
    created_at: datetime


class MaterialListItem(BaseModel):
    id: int
    filename: str
    important_topics: List[str]
    created_at: datetime


class MaterialQuizRequest(BaseModel):
    num_questions: int = 10


class MaterialQuizOut(BaseModel):
    roadmap_day_id: int
    questions: List[QuizQuestion]
