
import asyncio
import re
import httpx
import json

OLLAMA_URL = "http://localhost:11434/api/generate"

async def perform_ai_analysis(text: str):
    prompt = (
        f"Analyze this text for mental health indicators: '{text}'. "
        f"Provide a rumination score (0-10, where 0 is no rumination and 10 is extreme rumination), "
        f"an emotion clarity score (0-10, where 0 is very confusing/opaque emotions and 10 is perfect emotional clarity), "
        f"and a single specific emotion label (e.g., anxious, sad, hopeful, peaceful). "
        f"Also provide a very brief, clear reason (max 15 words) for these scores. "
        f"Format your response exactly like this: 'Rumination Score: X, Clarity Score: Y, Emotion: Z, Reason: R'."
    )

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
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
            print(f"RAW AI TEXT: {ai_text}")

        score_match = re.search(r'Rumination Score:\s*(\d+)', ai_text, re.IGNORECASE)
        clean_score = int(score_match.group(1)) if score_match else 0
        
        print(f"CLEAN SCORE: {clean_score}")
        return clean_score

    except Exception as e:
        print(f"FAILED: {e}")
        return 0

if __name__ == "__main__":
    test_text = "I have been feeling very stuck lately. My thoughts keep circling back to my mistakes at work and I can't stop thinking about what I should have done differently. It's making me feel very anxious."
    asyncio.run(perform_ai_analysis(test_text))
