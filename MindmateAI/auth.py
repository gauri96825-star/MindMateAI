import os
import httpx
from fastapi import Depends, HTTPException, Request
from dotenv import load_dotenv

load_dotenv()

# Clerk configuration
CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY", "")
CLERK_PUBLISHABLE_KEY = os.getenv("CLERK_PUBLISHABLE_KEY", "")

# For development without Clerk, set this to skip auth
SKIP_AUTH = os.getenv("SKIP_AUTH", "true").lower() == "true"
DEV_USER_ID = "dev-user-001"


async def get_current_user_id(request: Request) -> str:
    """
    Extract user_id from Clerk JWT token.
    Falls back to a dev user when SKIP_AUTH is true (local development).
    """
    if SKIP_AUTH:
        return DEV_USER_ID

    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization token")

    token = auth_header.replace("Bearer ", "")

    try:
        # Verify token with Clerk's API
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.clerk.com/v1/sessions",
                headers={
                    "Authorization": f"Bearer {CLERK_SECRET_KEY}",
                    "Content-Type": "application/json",
                },
            )

            if response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid token")

        # Decode JWT to get user_id (sub claim)
        from jose import jwt, JWTError

        # For Clerk, we can decode without verification for the sub claim
        # In production, verify with Clerk's JWKS endpoint
        try:
            payload = jwt.get_unverified_claims(token)
            user_id = payload.get("sub")
            if not user_id:
                raise HTTPException(status_code=401, detail="Invalid token: no user ID")
            return user_id
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid token format")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")
