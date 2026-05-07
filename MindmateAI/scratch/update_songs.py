
import asyncio
from sqlalchemy import select, delete
from database import async_session
from models import Song
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

new_songs = [
    {"title": "Arz Kiya Hai", "artist": "Anuv Jain", "category": "Calm", "youtube_id": "jKqCewZvECA"},
    {"title": "Matargashti", "artist": "Ranbir Kapoor, Deepika Padukone", "category": "Happy", "youtube_id": "iid7cxx0keU"},
    {"title": "Senorita", "artist": "Zindagi Na Milegi Dobara", "category": "Happy", "youtube_id": "2Z0Put0teCM"},
    {"title": "Dandelions", "artist": "Ruth B.", "category": "Happy", "youtube_id": "WgTMeICssXY"},
    {"title": "Let Her Go", "artist": "Passenger", "category": "Sad", "youtube_id": "HTcL9WkB_wg"}
]

async def update_database():
    async with async_session() as db:
        logger.info("Checking for new songs...")
        for song_data in new_songs:
            # Check if song already exists by youtube_id
            result = await db.execute(select(Song).where(Song.youtube_id == song_data["youtube_id"]))
            existing = result.scalar_one_or_none()
            
            if not existing:
                logger.info(f"Adding new song: {song_data['title']}")
                new_song = Song(**song_data)
                db.add(new_song)
            else:
                logger.info(f"Song already exists: {song_data['title']}")
        
        await db.commit()
        logger.info("Database update complete!")

if __name__ == "__main__":
    asyncio.run(update_database())
