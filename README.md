# MindMate AI 

MindMate AI is a compassionate and empathetic mental wellness companion application designed to provide conversational support, holistic mood analysis, and personalized wellness recommendations. It acts as a supportive companion for emotional reflection and self-care.

## Features

- **AI-Powered Wellness Companion**: A conversational AI chatbot powered by the **Ollama Phi-3** model that offers empathetic, non-judgmental, and supportive mental wellness discussions.
- **Real-Time Mental State Analysis**: Automatically analyzes user inputs (chats and journals) to compute key mental health indicators such as:
  - **Rumination Scores**
  - **Emotional Clarity**
  - **Specific Emotion Labels** (e.g., Anxious, Sad, Hopeful, Peaceful)
- **Smart Journaling & Trend Mapping**: Users can log their daily thoughts in a journal. The system analyzes these entries and maps emotional trends over time, presenting them on a visually engaging dashboard.
- **Personalized Music Recommendations**: Suggests curated wellness music (integrated with YouTube) tailored to the user's currently detected emotional state to aid in coping and relaxation.

## Tech Stack

**Backend System**
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) for high-performance, asynchronous REST APIs.
- **Database**: SQLite/PostgreSQL with **SQLAlchemy (Async)** and **aiosqlite** for robust data modeling.
- **AI Integration**: **Ollama** running locally (Phi-3) for sophisticated natural language understanding and generation without compromising user privacy.

**Frontend Application**
- **Framework**: Vite + TypeScript (React/Vue environment)
- **State & UI**: Modern component-based architecture designed for a responsive and calming user experience.

## How It Works

MindMate securely maintains your chat and journal histories. Every interaction is passed through an offline-capable AI model that performs holistic analysis of your mental state. Based on these interactions, it dynamically adjusts its personalized music recommendations and updates your mental wellness dashboard with insightful trends to help you understand your emotional patterns over time.

---
*Disclaimer: MindMate AI is a supportive tool for emotional reflection and self-care. It is not a replacement for professional mental health services, diagnosis, or treatment.*
