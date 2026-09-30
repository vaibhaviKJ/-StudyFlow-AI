from sqlalchemy import (
    Column, Integer, String, Boolean, Date, DateTime, ForeignKey, Text, Enum, func
)
from sqlalchemy.orm import relationship
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(180), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    is_pro = Column(Boolean, default=False)
    ai_sessions_used_this_month = Column(Integer, default=0)
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    last_activity_date = Column(Date, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    roadmaps = relationship("Roadmap", back_populates="owner", cascade="all, delete-orphan")


class Roadmap(Base):
    __tablename__ = "roadmaps"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    goal_text = Column(String(255), nullable=False)
    duration_days = Column(Integer, nullable=False)
    status = Column(Enum("active", "completed", "archived", name="roadmap_status"), default="active")
    created_at = Column(DateTime, server_default=func.now())

    owner = relationship("User", back_populates="roadmaps")
    days = relationship("RoadmapDay", back_populates="roadmap", cascade="all, delete-orphan", order_by="RoadmapDay.day_number")


class RoadmapDay(Base):
    __tablename__ = "roadmap_days"

    id = Column(Integer, primary_key=True, index=True)
    roadmap_id = Column(Integer, ForeignKey("roadmaps.id", ondelete="CASCADE"), nullable=False)
    day_number = Column(Integer, nullable=False)
    title = Column(String(255), nullable=False)
    summary = Column(Text)
    status = Column(Enum("locked", "pending", "in_progress", "completed", name="day_status"), default="pending")
    completed_at = Column(DateTime, nullable=True)

    roadmap = relationship("Roadmap", back_populates="days")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    roadmap_day_id = Column(Integer, ForeignKey("roadmap_days.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    score = Column(Integer, nullable=False)
    total = Column(Integer, nullable=False)
    weak_topics = Column(Text)
    taken_at = Column(DateTime, server_default=func.now())


class StudyMaterial(Base):
    __tablename__ = "study_materials"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    storage_path = Column(String(500), nullable=False)
    extracted_text = Column(Text, nullable=False)
    summary = Column(Text, nullable=False)
    important_topics = Column(Text, nullable=False, default="[]")
    flashcards = Column(Text, nullable=False, default="[]")
    created_at = Column(DateTime, server_default=func.now())
