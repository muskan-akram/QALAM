import os
import asyncio
import logging
import psycopg2
import psycopg2.extras

logger = logging.getLogger(__name__)


class Database:
    def __init__(self):
        self.dsn = os.getenv(
            "DATABASE_URL", "postgresql://postgres:PAK1947%40ind@localhost:5432/qalam"
        )
        self.conn = None

    async def connect(self):
        loop = asyncio.get_event_loop()
        self.conn = await loop.run_in_executor(
            None,
            lambda: psycopg2.connect(
                self.dsn, cursor_factory=psycopg2.extras.RealDictCursor
            ),
        )
        logger.info("AI DB connected")

    async def disconnect(self):
        if self.conn:
            self.conn.close()

    async def fetch_books(self):
        loop = asyncio.get_event_loop()

        def _q():
            with self.conn.cursor() as c:
                c.execute("""
                    SELECT id,title,author,isbn,genre,tags,description,
                           available_copies,cover_url,location,published_year
                    FROM books ORDER BY title
                """)
                return c.fetchall()

        try:
            rows = await loop.run_in_executor(None, _q)
            return [dict(r) for r in rows]
        except Exception as e:
            logger.error(f"fetch_books error: {e}")
            try:
                self.conn.rollback()
            except Exception:
                pass
            return []