import asyncio
import sys
import os

# Add current directory to path
sys.path.append(os.getcwd())

from database import async_session, init_db
from models import Song
from sqlalchemy import select

async def check_songs():
    await init_db()
    async with async_session() as db:
        result = await db.execute(select(Song))
        songs = result.scalars().all()
        print(f"Total songs: {len(songs)}")
        for s in songs:
            print(f"- {s.title} ({s.category})")

if __name__ == "__main__":
    asyncio.run(check_songs())
