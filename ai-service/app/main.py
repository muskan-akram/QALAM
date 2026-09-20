import os
import uuid
import logging
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from app.database    import Database
from app.embedder    import Embedder
from app.recommender import BookRecommender
from app.chatbot     import ChatBot

logging.basicConfig(level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)

db:          Optional[Database]         = None
embedder:    Optional[Embedder]         = None
recommender: Optional[BookRecommender]  = None
chatbot:     Optional[ChatBot]          = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global db, embedder, recommender, chatbot
    logger.info("Starting QALAM AI Service…")
    db = Database()
    await db.connect()
    embedder    = Embedder(os.getenv("MODEL_NAME", "all-MiniLM-L6-v2"))
    recommender = BookRecommender(db, embedder)
    await recommender.build_index()
    chatbot     = ChatBot(recommender)
    logger.info("AI Service ready")
    yield
    await db.disconnect()
    logger.info("AI Service stopped")

app = FastAPI(title="QALAM AI Service", version="2.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# ── Pydantic Models ──────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    user_id: Optional[str] = None
    history: List[dict] = []
    session_id: Optional[str] = None

class RecRequest(BaseModel):
    query: str
    top_k: int = 5

class SessionCreateRequest(BaseModel):
    user_id: str
    label: Optional[str] = None

class SessionRenameRequest(BaseModel):
    label: str

class MessageSaveRequest(BaseModel):
    session_id: str
    user_id: str
    role: str
    content: str
    recommendations: List[Dict[str, Any]] = []

# ── In-memory session store (replace with DB table for production) ─────────
# Structure: { user_id: { session_id: { label, created_at, messages: [] } } }
_sessions: Dict[str, Dict[str, Any]] = {}


def _get_user_sessions(user_id: str) -> Dict:
    if user_id not in _sessions:
        _sessions[user_id] = {}
    return _sessions[user_id]


def _auto_label(first_user_message: str) -> str:
    """Generate a session label from the first user message (like ChatGPT)."""
    msg = first_user_message.strip()
    # Capitalize first letter, truncate to ~35 chars at word boundary
    words = msg.split()
    label = ""
    for w in words:
        if len(label) + len(w) + 1 > 35:
            break
        label = (label + " " + w).strip()
    return label[:35] if label else "New Chat"


# ── Health ───────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    total = len(recommender.books) if recommender else 0
    return {"status": "ok", "service": "QALAM AI", "books_indexed": total}


# ── Chat ─────────────────────────────────────────────────────────────────────

@app.post("/chat")
async def chat(req: ChatRequest):
    if not chatbot:
        raise HTTPException(503, "AI service not ready")
    reply, recs = await chatbot.respond(req.message, req.history)

    # Auto-save to session if session_id + user_id provided
    if req.session_id and req.user_id:
        user_sess = _get_user_sessions(req.user_id)
        if req.session_id in user_sess:
            sess = user_sess[req.session_id]
            # Auto-name session from first user message
            if sess.get("label", "").startswith("New Chat") and req.message.strip():
                sess["label"] = _auto_label(req.message)
            sess["messages"].append({
                "id": str(uuid.uuid4()),
                "role": "user",
                "content": req.message,
                "recommendations": [],
                "timestamp": datetime.utcnow().isoformat(),
            })
            sess["messages"].append({
                "id": str(uuid.uuid4()),
                "role": "assistant",
                "content": reply,
                "recommendations": recs,
                "timestamp": datetime.utcnow().isoformat(),
            })
            sess["updated_at"] = datetime.utcnow().isoformat()

    return {"reply": reply, "recommendations": recs}


# ── Session Management ────────────────────────────────────────────────────────

@app.get("/sessions/{user_id}")
async def list_sessions(user_id: str):
    """Return all sessions for a user, sorted newest first."""
    user_sess = _get_user_sessions(user_id)
    sessions = []
    for sid, sess in user_sess.items():
        sessions.append({
            "id": sid,
            "label": sess.get("label", "New Chat"),
            "created_at": sess.get("created_at", ""),
            "updated_at": sess.get("updated_at", ""),
            "message_count": len(sess.get("messages", [])),
            "preview": _session_preview(sess),
        })
    sessions.sort(key=lambda s: s.get("updated_at", ""), reverse=True)
    return {"sessions": sessions}


@app.post("/sessions/{user_id}")
async def create_session(user_id: str, req: SessionCreateRequest):
    """Create a new named session."""
    sid = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    user_sess = _get_user_sessions(user_id)
    user_sess[sid] = {
        "label": req.label or "New Chat",
        "created_at": now,
        "updated_at": now,
        "messages": [],
    }
    return {"session_id": sid, "label": user_sess[sid]["label"]}


@app.get("/sessions/{user_id}/{session_id}")
async def get_session(user_id: str, session_id: str):
    """Get full message history for a session."""
    user_sess = _get_user_sessions(user_id)
    if session_id not in user_sess:
        raise HTTPException(404, "Session not found")
    sess = user_sess[session_id]
    return {
        "id": session_id,
        "label": sess.get("label", "New Chat"),
        "messages": sess.get("messages", []),
        "created_at": sess.get("created_at", ""),
    }


@app.patch("/sessions/{user_id}/{session_id}")
async def rename_session(user_id: str, session_id: str, req: SessionRenameRequest):
    """Rename a session."""
    user_sess = _get_user_sessions(user_id)
    if session_id not in user_sess:
        raise HTTPException(404, "Session not found")
    user_sess[session_id]["label"] = req.label
    return {"session_id": session_id, "label": req.label}


@app.delete("/sessions/{user_id}/{session_id}")
async def delete_session(user_id: str, session_id: str):
    """Delete a session."""
    user_sess = _get_user_sessions(user_id)
    if session_id in user_sess:
        del user_sess[session_id]
    return {"deleted": session_id}


def _session_preview(sess: dict) -> str:
    messages = sess.get("messages", [])
    for m in reversed(messages):
        if m.get("role") == "assistant":
            content = m.get("content", "")
            # Strip markdown bold/italic for preview
            content = content.replace("**", "").replace("*", "")
            return content[:60] + ("…" if len(content) > 60 else "")
    return "No messages yet"


# ── Legacy history endpoint (for backward compat) ────────────────────────────

@app.get("/chatbot/history")
async def legacy_history():
    return {"history": []}


@app.post("/chatbot/message")
async def legacy_message(req: ChatRequest):
    """Legacy endpoint — proxies to /chat."""
    return await chat(req)


# ── Recommend & Reindex ───────────────────────────────────────────────────────

@app.post("/recommend")
async def recommend(req: RecRequest):
    if not recommender:
        raise HTTPException(503, "Recommender not ready")
    books = await recommender.search(req.query, req.top_k)
    return {"recommendations": books}


@app.post("/reindex")
async def reindex():
    if not recommender:
        raise HTTPException(503, "Recommender not ready")
    await recommender.build_index()
    return {"message": "Index rebuilt", "total": len(recommender.books)}