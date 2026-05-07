import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from database import Base


def generate_uuid():
    return str(uuid.uuid4())


def get_utc_now():
    return datetime.now(timezone.utc)


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, nullable=False, index=True)
    title = Column(String, default="New chat")
    created_at = Column(DateTime, default=get_utc_now)

    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", lazy="selectin")


class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=generate_uuid)
    conversation_id = Column(String, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    role = Column(String, nullable=False)  # "user" or "assistant"
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=get_utc_now)

    conversation = relationship("Conversation", back_populates="messages")


class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, nullable=False, index=True)
    content = Column(Text, nullable=False)
    mood = Column(String, nullable=False)
    rumination_score = Column(Integer, nullable=True)
    emotion_clarity_score = Column(Integer, nullable=True)
    emotion_label = Column(String, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)


class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, nullable=False, index=True)
    user_text = Column(Text, nullable=False)
    rumination_score = Column(Integer, default=0)
    emotion_clarity_score = Column(Integer, default=0)
    emotion_label = Column(String, default="Unknown")
    raw_analysis = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)


class Song(Base):
    __tablename__ = "songs"

    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, nullable=False)
    artist = Column(String, nullable=False)
    category = Column(String, nullable=False)  # "Mood Boost", "Calm", etc.
    youtube_id = Column(String, nullable=True)
    thumbnail_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)


class RecommendationLog(Base):
    __tablename__ = "recommendation_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, nullable=False, index=True)
    song_id = Column(String, ForeignKey("songs.id", ondelete="CASCADE"), nullable=False)
    mood_context = Column(String, nullable=True)  # Snapshot of current mood when recommended
    created_at = Column(DateTime, default=get_utc_now)
