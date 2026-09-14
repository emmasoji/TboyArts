import httpx
from fastapi import Header, HTTPException

from utils.supabase import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY


async def require_authenticated_admin(
    authorization: str | None = Header(default=None),
) -> dict:
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authentication required.",
        )

    if not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication header.",
        )

    access_token = authorization[7:].strip()

    if not access_token:
        raise HTTPException(
            status_code=401,
            detail="Authentication token is missing.",
        )

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                f"{SUPABASE_URL}/auth/v1/user",
                headers={
                    "apikey": SUPABASE_SERVICE_ROLE_KEY,
                    "Authorization": f"Bearer {access_token}",
                },
            )
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=503,
            detail="Unable to verify authentication.",
        ) from exc

    if response.status_code != 200:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication session.",
        )

    try:
        user = response.json()
    except ValueError as exc:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication response.",
        ) from exc

    if not user.get("id"):
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication session.",
        )

    return user
