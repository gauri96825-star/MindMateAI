import os
import logging
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("MindMateDB")

DATABASE_URL = os.getenv("DATABASE_URL", "")

def get_engine_url(url: str) -> str:
    """Ensure the URL has the correct async driver."""
    if not url:
        return "sqlite+aiosqlite:///./mindmate.db"
    
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://") and "+asyncpg" not in url:
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url

FINAL_DB_URL = get_engine_url(DATABASE_URL)
logger.info(f"Connecting to database: {FINAL_DB_URL.split('@')[-1] if '@' in FINAL_DB_URL else FINAL_DB_URL}")

engine = create_async_engine(
    FINAL_DB_URL,
    echo=False,
    pool_pre_ping=True,
    # Only PostgreSQL supports these pool settings
    **({"pool_size": 5, "max_overflow": 10} if "postgresql" in FINAL_DB_URL else {})
)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    global engine, async_session
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("[MindMate DB] Tables created/verified successfully.")
    except Exception as e:
        logger.error(f"[MindMate DB] Failed to initialize database: {str(e)}")
        # If PostgreSQL failed, try falling back to SQLite if it wasn't already being used
        if "postgresql" in FINAL_DB_URL:
            logger.warning("[MindMate DB] Attempting fallback to SQLite...")
            sqlite_url = "sqlite+aiosqlite:///./mindmate.db"
            engine = create_async_engine(sqlite_url, echo=False)
            async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("[MindMate DB] Fallback to SQLite successful.")
