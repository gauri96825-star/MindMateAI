import asyncio
from database import async_session, init_db
from models import Song
from sqlalchemy import select

async def check_songs():
    await init_db()
    async with async_session() as db:
        result = await db.execute(select(Song))
        songs = result.scalars().all()
        print(f"Total songs in DB: {len(songs)}")
        for s in songs:
            print(f"- {s.title} ({s.category})")

if __name__ == "__main__":
    asyncio.run(check_songs())
