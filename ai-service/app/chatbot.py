import os
import re
import logging
from typing import List, Dict, Tuple, Any

logger = logging.getLogger(__name__)

# ── Roman Urdu / Urdu keyword maps ──────────────────────────────────────────
ROMAN_URDU_MAP = {
    r"\b(aoa|assalam\s*o?\s*alaikum|salaam|salam|assalam)\b": "GREETING",
    r"\b(hello|hi|hey|howdy|good\s+morning|good\s+evening)\b": "GREETING",
    r"\b(khuda\s*hafiz|allah\s*hafiz|bye|goodbye|shukria|shukriya|jazakallah|thanks|thank\s+you)\b": "FAREWELL",
    r"\b(seekhni|seekhna|sikhni|sikhna)\s+hai\b": "learn",
    r"\bpadh(ni|na)\s+hai\b": "read",
    r"\bmujh[ey]?\b": "",
    r"\bchahiye\b": "want",
    r"\bkitab(ein)?\b": "books",
    r"\bparh\b": "read",
    r"\b(tarikh|history)\b": "history",
    r"\b(programming|coding|code|koding)\b": "programming",
    r"\b(python|pyton|pyhon)\b": "python",
    r"\b(novel)\b": "novel",
    r"\b(machine\s*learning|ai|artificial\s*intelligence)\b": "machine learning",
}

KNOWN_BOOKS_OFFLINE = {
    "python": [
        {
            "title": "Automate the Boring Stuff with Python",
            "author": "Al Sweigart",
            "genre": "Programming",
            "description": "A beginner-friendly guide to coding.",
            "in_library": False,
        },
        {
            "title": "Python Crash Course",
            "author": "Eric Matthes",
            "genre": "Programming",
            "description": "A hands-on, project-based introduction to programming.",
            "in_library": False,
        },
    ],
    "atomic habits": [
        {
            "title": "Atomic Habits",
            "author": "James Clear",
            "genre": "Self-Help",
            "description": "Building good habits.",
            "in_library": False,
        },
    ],
}

GREETINGS = ["hello", "hi", "hey", "salam", "assalam", "aoa"]
FAREWELLS = ["bye", "goodbye", "thanks", "thank you", "shukria", "khuda hafiz"]


def _detect_lang(text: str) -> str:
    if re.search(r"[\u0600-\u06FF]", text):
        return "urdu"
    if any(w in text.lower() for w in ["mujhe", "chahiye", "kitab", "hai", "kia"]):
        return "roman_urdu"
    return "english"


SYSTEM_PROMPT = """You are QALAM — a warm, empathetic reading mentor.
Match the user's language. Recommend 2-4 books.
If library context is empty, suggest famous books from your knowledge and tag them 📌.

## LIBRARY CONTEXT
{context}
"""


class ChatBot:
    def __init__(self, recommender):
        self.rec = recommender
        self.api_key = os.getenv("OPENAI_API_KEY", "")
        self.groq_key = os.getenv("GROQ_API_KEY", "")

    def _normalize(self, text: str) -> Tuple[str, str]:
        t = text.lower().strip()
        for pattern, replacement in ROMAN_URDU_MAP.items():
            if replacement in ("GREETING", "FAREWELL"):
                if re.search(pattern, t, re.IGNORECASE):
                    return t, replacement
            else:
                t = re.sub(pattern, replacement, t, flags=re.IGNORECASE)
        return re.sub(r"\s{2,}", " ", t).strip(), ""

    def _topic(self, text: str) -> str:
        clean = re.sub(
        r"\b(recommend|suggest|find|books?|about|chahiye|mujhe|batao|is|kya|please|give|me)\b",
        "",
        text.lower(),
        ).strip()
        # If cleaning emptied the string, use the original normalized text
        return clean if len(clean) > 1 else text.lower()
        

    def _check_known_books(self, topic: str) -> list:
        t = topic.lower().strip()
        # Check for exact key matches
        for key, books in KNOWN_BOOKS_OFFLINE.items():
            if key in t or t in key:
                return books
        
        # NEW: Check if any word in the topic matches a keyword (e.g., "python books")
        topic_words = set(t.split())
        for key, books in KNOWN_BOOKS_OFFLINE.items():
            if any(word == key for word in topic_words):
                return books
        return []

    async def _call_ai(
        self, message: str, history: list, context: str, known_offline: list, lang: str
    ) -> str | None:
        offline_ctx = ""
        if known_offline:
            offline_ctx = "\n\nFamous books (📌 Not in library):\n" + "\n".join(
                f"- {b['title']} by {b['author']}" for b in known_offline
            )

        lang_hint = "\n[Reply in Roman Urdu]" if lang == "roman_urdu" else ""
        system = SYSTEM_PROMPT.format(context=context + offline_ctx) + lang_hint

        if self.groq_key:
            try:
                from groq import Groq

                client = Groq(api_key=self.groq_key)
                msgs = [{"role": "system", "content": system}]
                for h in history[-5:]:
                    msgs.append(
                        {"role": h.get("role", "user"), "content": h.get("content", "")}
                    )
                msgs.append({"role": "user", "content": message})

                chat_completion = client.chat.completions.create(
                    messages=msgs, model="llama-3.3-70b-versatile", temperature=0.7
                )
                return chat_completion.choices[0].message.content.strip()
            except Exception as e:
                logger.error(f"Groq error: {e}")
        return None

    def _rule(self, message: str, recs: list, known_offline: list, lang: str) -> str:
        if recs:
            lines = [f"📚 **{b['title']}** by {b['author']}" for b in recs[:3]]
            return "Mujhe library mein yeh books mili hain:\n\n" + "\n".join(lines)
        if known_offline:
            lines = [f"📌 **{b['title']}** by {b['author']}" for b in known_offline[:3]]
            return (
                "Library mein toh nahi hain, lekin yeh best books hain:\n\n"
                + "\n".join(lines)
            )
        return "I could not find exact matches. Try another topic!"

    async def respond(
        self, message: str, history: list
    ) -> Tuple[str, List[Dict[str, Any]]]:
        lang = _detect_lang(message)
        normalized, flag = self._normalize(message)
        topic = self._topic(normalized)

        recs = []
        known_offline = self._check_known_books(topic)

        if len(topic) > 1:
            recs = await self.rec.search(topic, top_k=5)
            # CRITICAL: Match the 0.05 threshold here too
            recs = [r for r in recs if r.get("similarity_score", 0) >= 0.05]

        context = (
            "Matches found:\n" + "\n".join(f"- {b['title']}" for b in recs)
            if recs
            else "No library matches."
        )

        reply = await self._call_ai(message, history, context, known_offline, lang)
        if not reply:
            reply = self._rule(message, recs, known_offline, lang)

        return reply, recs
