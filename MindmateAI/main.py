import logging
import re
import httpx
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
from contextlib import asynccontextmanager

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

import database
from database import get_db
from models import Conversation, Message, JournalEntry, AnalysisResult, Song, RecommendationLog
from auth import get_current_user_id

# Configure logging (logger is imported from database.py but can be further configured)
logging.basicConfig(level=logging.INFO)


# ======================== Lifespan ========================

@asynccontextmanager
async def lifespan(app: FastAPI):
    await database.init_db()
    # Seed songs if table is empty
    async with database.async_session() as db:
        result = await db.execute(select(Song))
        if not result.scalars().first():
            database.logger.info("Seeding initial songs database...")
            initial_songs = [
                Song(title="Weightless", artist="Marconi Union", category="Calm", youtube_id="UfcAVejslrU"),
                Song(title="Sunset Lover", artist="Petit Biscuit", category="Calm", youtube_id="U5NfO9Z7U-0"),
                Song(title="Clair de Lune", artist="Debussy", category="Calm", youtube_id="WNcsUNKlAKw"),
                Song(title="Arz Kiya Hai", artist="Anuv Jain", category="Calm", youtube_id="jKqCewZvECA"),
                Song(title="Happy", artist="Pharrell Williams", category="Happy", youtube_id="ZbZSe6N_BXs"),
                Song(title="Walking on Sunshine", artist="Katrina & The Waves", category="Happy", youtube_id="iPUmE-tne5U"),
                Song(title="Matargashti", artist="Ranbir Kapoor, Deepika Padukone", category="Happy", youtube_id="iid7cxx0keU"),
                Song(title="Senorita", artist="Zindagi Na Milegi Dobara", category="Happy", youtube_id="2Z0Put0teCM"),
                Song(title="Dandelions", artist="Ruth B.", category="Happy", youtube_id="WgTMeICssXY"),
                Song(title="Breathe Me", artist="Sia", category="Anxious", youtube_id="ghPcYqn0p4Q"),
                Song(title="Holocene", artist="Bon Iver", category="Anxious", youtube_id="TWcyIpul868"),
                Song(title="Fix You", artist="Coldplay", category="Sad", youtube_id="k4V3Mo61fJM"),
                Song(title="The Night We Met", artist="Lord Huron", category="Sad", youtube_id="KtlgYxa6BMU"),
                Song(title="Let Her Go", artist="Passenger", category="Sad", youtube_id="HTcL9WkB_wg"),
                Song(title="Kun Faya Kun", artist="Rockstar", category="Calm", youtube_id="JRtxglJGupY"),
                Song(title="Udd Gaye", artist="Ritviz", category="Happy", youtube_id="Umqb9KENgmk"),
                Song(title="Kabira", artist="Yeh Jawaani Hai Deewani", category="Calm", youtube_id="jHNNMj5bNQw"),
                Song(title="Comfortably Numb", artist="Pink Floyd", category="Numb", youtube_id="x-xTttimcNk"),
                Song(title="Mad World", artist="Gary Jules", category="Numb", youtube_id="4N3N1MlvKw4"),
                Song(title="Let It Be", artist="The Beatles", category="Frustrated", youtube_id="QDYfEBY9NM4"),
                Song(title="Imagine", artist="John Lennon", category="Frustrated", youtube_id="YkgkThdzX-8")
            ]
            db.add_all(initial_songs)
            await db.commit()
    yield


app = FastAPI(title="MindMate AI Backend", lifespan=lifespan)

# CORS Fix: Avoid "*" with allow_credentials=True
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ======================== Schemas ========================

class ChatRequest(BaseModel):
    conversation_id: str
    message: str
    history: List[dict] = []


class JournalRequest(BaseModel):
    content: str
    mood: str


class AnalyzeRequest(BaseModel):
    text: str


class SongResponse(BaseModel):
    title: str
    artist: str
    category: str
    youtube_id: str
    thumbnail_url: Optional[str] = None


class RecommendationResponse(BaseModel):
    categories: dict # { "For You": [Song], "Calm": [Song], ... }
    mood_summary: str


# ======================== System Prompt ========================

SYSTEM_PROMPT = """You are MindMate AI, a compassionate and empathetic mental wellness companion.

IMPORTANT RULES:
1. You ONLY discuss mental health, emotional wellbeing, stress management, mindfulness, self-care, and related topics.
2. If asked about anything unrelated to mental health (coding, math, politics, etc.), politely redirect: "I'm here to support your mental wellbeing. Let's focus on how you're feeling."
3. Always respond with warmth, empathy, and understanding.
4. Never diagnose conditions or prescribe medication.
5. For serious concerns (self-harm, suicidal thoughts), always recommend professional help and crisis hotlines.
6. Use a gentle, conversational tone - like a caring friend, not a clinical therapist.
7. Ask thoughtful follow-up questions to help users explore their feelings.
8. Suggest practical coping strategies when appropriate (breathing exercises, journaling, gratitude practice).
9. Keep responses concise but meaningful - 2-4 paragraphs maximum.
10. Validate feelings before offering suggestions.

Remember: You are NOT a replacement for professional mental health services. You are a supportive companion for emotional reflection and self-care."""


OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_CHAT_URL = "http://localhost:11434/api/chat"


# ======================== AI Utilities ========================

async def perform_ai_analysis(text: str):
    """
    Common utility to perform mental health analysis using Ollama.
    Returns (clean_score, clean_emotion, raw_analysis)
    """
    prompt = (
        f"Analyze this text for mental health indicators: '{text}'. "
        f"Provide a rumination score (0-10, where 0 is no rumination and 10 is extreme rumination), "
        f"an emotion clarity score (0-10, where 0 is very confusing/opaque emotions and 10 is perfect emotional clarity), "
        f"and a single specific emotion label (e.g., anxious, sad, hopeful, peaceful). "
        f"Also provide a very brief, clear reason (max 15 words) for these scores. "
        f"Format your response exactly like this: 'Rumination Score: X, Clarity Score: Y, Emotion: Z, Reason: R'."
    )

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                OLLAMA_URL,
                json={
                    "model": "phi3",
                    "prompt": prompt,
                    "stream": False,
                },
            )
            response.raise_for_status()
            response_data = response.json()
            ai_text = response_data.get("response", "")

        # More robust regex matching for various AI response styles
        score_match = re.search(r'(?:Rumination Score|Rumination):\s*(\d+)', ai_text, re.IGNORECASE)
        clean_score = int(score_match.group(1)) if score_match else 0
        clean_score = min(10, max(0, clean_score))

        clarity_match = re.search(r'(?:Clarity Score|Clarity):\s*(\d+)', ai_text, re.IGNORECASE)
        clean_clarity = int(clarity_match.group(1)) if clarity_match else 5 # Neutral default
        clean_clarity = min(10, max(0, clean_clarity))

        emotion_match = re.search(r'(?:Emotion|Mood):\s*([a-zA-Z]+)', ai_text, re.IGNORECASE)
        clean_emotion = emotion_match.group(1).capitalize() if emotion_match else "Unknown"

        reason_match = re.search(r'Reason:\s*(.*)', ai_text, re.IGNORECASE)
        clean_reason = reason_match.group(1).strip() if reason_match else "Based on your recent input."
        
        return clean_score, clean_clarity, clean_emotion, clean_reason

    except Exception as e:
        database.logger.error(f"AI Analysis failed: {str(e)}")
        return 0, 5, "Unknown", "Analysis currently unavailable."


async def perform_holistic_analysis(user_id: str, db: AsyncSession):
    """
    Analyzes user's recent history (chats and journal) for a holistic mind state.
    """
    # 1. Fetch recent messages
    msg_result = await db.execute(
        select(Message.content)
        .join(Conversation)
        .where(Conversation.user_id == user_id)
        .order_by(Message.created_at.desc())
        .limit(20)
    )
    messages = msg_result.scalars().all()
    
    # 2. Fetch recent journal entries
    jrnl_result = await db.execute(
        select(JournalEntry.content)
        .where(JournalEntry.user_id == user_id)
        .order_by(JournalEntry.created_at.desc())
        .limit(10)
    )
    journals = jrnl_result.scalars().all()

    if not messages and not journals:
        return 0, 5, "Neutral", "No history to analyze yet."

    # 3. Combine context
    context = ""
    if messages:
        context += "RECENT CHATS:\n" + "\n".join(messages) + "\n"
    if journals:
        context += "RECENT JOURNAL ENTRIES:\n" + "\n".join(journals) + "\n"

    # 4. Perform analysis
    return await perform_ai_analysis(context)


# ======================== Chat Endpoints ========================

@app.post("/chat")
async def chat(
    request: ChatRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Send a message and get AI response from Ollama Phi-3."""

    # Build conversation history for context
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in request.history[-10:]:
        messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})
    messages.append({"role": "user", "content": request.message})

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                OLLAMA_CHAT_URL,
                json={
                    "model": "phi3",
                    "messages": messages,
                    "stream": False,
                },
            )
            response.raise_for_status()
            response_data = response.json()
            ai_text = response_data.get("message", {}).get("content", "")

            if not ai_text:
                ai_text = "I'm here for you. Could you tell me more about how you're feeling?"

    except Exception as e:
        database.logger.error(f"Chat failed: {str(e)}")
        ai_text = (
            "I appreciate you reaching out. I'm having a moment of difficulty connecting, "
            "but I want you to know that your feelings matter. "
            "Could you try sharing again in a moment?"
        )

    # Save messages to database
    try:
        user_msg = Message(
            conversation_id=request.conversation_id,
            role="user",
            content=request.message,
        )
        db.add(user_msg)

        assistant_msg = Message(
            conversation_id=request.conversation_id,
            role="assistant",
            content=ai_text,
        )
        db.add(assistant_msg)

        # Trigger real-time mental health analysis for the dashboard score update
        # Using the updated function that returns (score, clarity, emotion, reason)
        rumination, clarity, emotion, reason = await perform_ai_analysis(request.message)
        
        analysis = AnalysisResult(
            user_id=user_id,
            user_text=request.message,
            rumination_score=rumination,
            emotion_clarity_score=clarity,
            emotion_label=emotion,
            raw_analysis=reason  # Use reason for the raw_analysis field
        )
        db.add(analysis)

        result = await db.execute(
            select(Conversation).where(Conversation.id == request.conversation_id)
        )
        conv = result.scalar_one_or_none()
        if conv and conv.title == "New chat":
            conv.title = request.message[:40] + ("..." if len(request.message) > 40 else "")

        await db.commit()
    except Exception as e:
        database.logger.error(f"Failed to save chat history or analysis: {str(e)}")
        # Don't fail the request if DB save fails, but log it
        pass

    return {"response": ai_text}


# ======================== Conversation Endpoints ========================

@app.get("/conversations")
async def list_conversations(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """List all conversations for the current user."""
    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == user_id)
        .order_by(Conversation.created_at.desc())
    )
    conversations = result.scalars().all()

    return {
        "conversations": [
            {
                "id": c.id,
                "title": c.title,
                "created_at": c.created_at.isoformat() if c.created_at else "",
            }
            for c in conversations
        ]
    }


@app.post("/conversations")
async def create_conversation(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Create a new conversation."""
    conv = Conversation(user_id=user_id, title="New chat")
    db.add(conv)
    await db.commit()
    await db.refresh(conv)

    welcome = Message(
        conversation_id=conv.id,
        role="assistant",
        content="Hi there! I'm MindMate, your mental wellness companion. I'm here to listen and support you. How are you feeling today?",
    )
    db.add(welcome)
    await db.commit()

    return {
        "id": conv.id,
        "title": conv.title,
        "created_at": conv.created_at.isoformat() if conv.created_at else "",
    }


@app.delete("/conversations/{conversation_id}")
async def delete_conversation_endpoint(
    conversation_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Delete a conversation and all its messages."""
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id,
        )
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    await db.delete(conv)
    await db.commit()

    return {"message": "Conversation deleted"}


@app.get("/conversations/{conversation_id}/messages")
async def get_conversation_messages(
    conversation_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get all messages for a conversation."""
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id,
        )
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
    )
    messages = result.scalars().all()

    return {
        "messages": [
            {"role": m.role, "content": m.content}
            for m in messages
        ]
    }


# ======================== Journal Endpoints ========================

@app.post("/journal")
async def save_journal(
    request: JournalRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Save a journal entry with automatic AI analysis."""
    # Auto-perform analysis if AI is available
    database.logger.info(f"Analyzing journal entry for user {user_id}")
    rumination, clarity, emotion, reason = await perform_ai_analysis(request.content)
    
    entry = JournalEntry(
        user_id=user_id,
        content=request.content,
        mood=request.mood,
        rumination_score=rumination,
        emotion_clarity_score=clarity,
        emotion_label=emotion
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)

    # Also log to AnalysisResult so reason is preserved
    analysis = AnalysisResult(
        user_id=user_id,
        user_text=request.content,
        rumination_score=rumination,
        emotion_clarity_score=clarity,
        emotion_label=emotion,
        raw_analysis=reason
    )
    db.add(analysis)
    await db.commit()

    return {
        "id": entry.id,
        "content": entry.content,
        "mood": entry.mood,
        "rumination_score": entry.rumination_score,
        "emotion_clarity_score": entry.emotion_clarity_score,
        "emotion_label": entry.emotion_label,
        "created_at": entry.created_at.isoformat() if entry.created_at else "",
    }


@app.get("/journal")
async def list_journal(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """List all journal entries for the current user."""
    result = await db.execute(
        select(JournalEntry)
        .where(JournalEntry.user_id == user_id)
        .order_by(JournalEntry.created_at.desc())
    )
    entries = result.scalars().all()

    return {
        "entries": [
            {
                "id": e.id,
                "content": e.content,
                "mood": e.mood,
                "rumination_score": e.rumination_score,
                "emotion_label": e.emotion_label,
                "created_at": e.created_at.isoformat() if e.created_at else "",
            }
            for e in entries
        ]
    }


# ======================== Analysis Endpoints ========================

@app.post("/analyze")
async def analyze_text(
    request: AnalyzeRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Analyze text for rumination score and emotion using Ollama Phi-3 (Stand-alone)."""
    rumination, clarity, clean_emotion, ai_text = await perform_ai_analysis(request.text)

    try:
        analysis = AnalysisResult(
            user_id=user_id,
            user_text=request.text,
            rumination_score=rumination,
            emotion_clarity_score=clarity,
            emotion_label=clean_emotion,
            raw_analysis=ai_text,
        )
        db.add(analysis)
        await db.commit()
    except Exception as e:
        database.logger.error(f"Failed to save analysis result: {str(e)}")

    return {
        "message": "Analysis complete!",
        "analysis": ai_text,
        "clean_score": rumination,
        "clean_clarity": clarity,
        "clean_emotion": clean_emotion,
    }


@app.get("/history")
async def get_history(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get analysis history for the current user."""
    result = await db.execute(
        select(AnalysisResult)
        .where(AnalysisResult.user_id == user_id)
        .order_by(AnalysisResult.created_at.desc())
    )
    entries = result.scalars().all()

    return {
        "history": [
            {
                "id": e.id,
                "timestamp": e.created_at.isoformat() if e.created_at else "",
                "text": e.user_text,
                "score": e.rumination_score,
                "clarity": e.emotion_clarity_score,
                "emotion": e.emotion_label,
            }
            for e in entries
        ]
    }


# ======================== Dashboard Endpoints ========================

@app.get("/dashboard/summary")
async def get_dashboard_summary(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get holistic summarized analysis for the user dashboard."""
    # 1. Fetch latest analysis result for the summary header
    latest_result = await db.execute(
        select(AnalysisResult)
        .where(AnalysisResult.user_id == user_id)
        .order_by(AnalysisResult.created_at.desc())
        .limit(1)
    )
    latest = latest_result.scalar_one_or_none()

    # 2. Get latest journal entries for trend mapping
    journal_result = await db.execute(
        select(JournalEntry)
        .where(JournalEntry.user_id == user_id)
        .order_by(JournalEntry.created_at.desc())
        .limit(10)
    )
    journals = journal_result.scalars().all()

    # 3. Get latest analysis results for trend mapping
    analysis_result = await db.execute(
        select(AnalysisResult)
        .where(AnalysisResult.user_id == user_id)
        .order_by(AnalysisResult.created_at.desc())
        .limit(10)
    )
    analyses = analysis_result.scalars().all()

    # 4. Combine for trend mapping
    combined = []
    for j in journals:
        combined.append({
            "timestamp": j.created_at,
            "date": j.created_at.strftime("%b %d"),
            "rumination": j.rumination_score or 0,
            "clarity": j.emotion_clarity_score or 0,
            "type": "Journal"
        })
    for a in analyses:
        combined.append({
            "timestamp": a.created_at,
            "date": a.created_at.strftime("%b %d"),
            "rumination": a.rumination_score or 0,
            "clarity": a.emotion_clarity_score or 0,
            "type": "Analysis"
        })
    
    # 5. Sort by actual timestamp to ensure correct chronological order
    combined.sort(key=lambda x: x["timestamp"], reverse=True)
    trends = combined[:7][::-1] # Last 7 in chronological order
    
    # 6. Clean up trends for JSON responsiveness (remove timestamp objects)
    for t in trends:
        t.pop("timestamp", None)

    # 7. Emotion distribution for Pie Chart
    emotions = {}
    for item in journals:
        e = item.emotion_label or "Unknown"
        emotions[e] = emotions.get(e, 0) + 1
    for item in analyses:
        e = item.emotion_label or "Unknown"
        emotions[e] = emotions.get(e, 0) + 1
    
    emotion_list = [{"name": k, "value": v} for k, v in emotions.items()]

    # Use defaults if no data exists
    return {
        "latest_rumination": latest.rumination_score if latest else 0,
        "latest_clarity": latest.emotion_clarity_score if latest else 5,
        "latest_emotion": latest.emotion_label if latest else "Neutral",
        "reason": latest.raw_analysis if latest else "Start journaling or chatting to see your mind state overview.",
        "trends": trends,
        "emotions": emotion_list
    }


@app.get("/wellness/recommendations")
async def wellness_recommendations(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get personalized wellness music based on detected mood."""
    # Get latest holistic analysis
    _, _, emotion, _ = await perform_holistic_analysis(user_id, db)
    
    # Map emotion to category
    category_map = {
        "Peaceful": "Calm", "Calm": "Calm", "Hopeful": "Happy", "Positive": "Happy",
        "Anxious": "Anxious", "Stressed": "Anxious", "Sad": "Sad", "Lonely": "Sad",
        "Numb": "Numb", "Apathetic": "Numb", "Angry": "Frustrated", "Frustrated": "Frustrated"
    }
    category = category_map.get(emotion, "Calm")

    # Fetch songs from DB
    result = await db.execute(
        select(Song).where(Song.category == category)
    )
    songs = result.scalars().all()

    return {
        "mood_summary": f"Based on your recent history, we've detected you might be feeling {emotion}. Here is some music to support you.",
        "categories": {
            "Personalized for You": [
                {
                    "title": s.title,
                    "artist": s.artist,
                    "youtube_id": s.youtube_id,
                    "thumbnail_url": f"https://img.youtube.com/vi/{s.youtube_id}/mqdefault.jpg"
                } for s in songs
            ]
        }
    }


# ======================== Health Check ========================

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "MindMate AI Backend"}