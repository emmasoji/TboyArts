import time

import httpx
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/currency", tags=["currency"])

RATE_CACHE_TTL = 15 * 60
_rate_cache: dict[str, object] | None = None


@router.get("/rate")
async def get_currency_rate():
    global _rate_cache

    now = time.monotonic()

    if _rate_cache is not None:
        cached_at = _rate_cache.get("cached_at")

        if isinstance(cached_at, float) and now - cached_at < RATE_CACHE_TTL:
            return {
                "success": True,
                "base": "NGN",
                "currency": "USD",
                "rate": _rate_cache["rate"],
                "date": _rate_cache["date"],
            }

    url = "https://api.frankfurter.dev/v2/providers/cbn/rate/ngn/usd"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)

        if response.status_code >= 400:
            raise HTTPException(
                status_code=502,
                detail="Unable to retrieve exchange rate.",
            )

        data = response.json()
        rate = data.get("rate")

        if not isinstance(rate, (int, float)) or rate <= 0:
            raise HTTPException(
                status_code=502,
                detail="Invalid exchange rate received.",
            )

        exchange_date = data.get("date")

        _rate_cache = {
            "rate": rate,
            "date": exchange_date,
            "cached_at": now,
        }

        return {
            "success": True,
            "base": "NGN",
            "currency": "USD",
            "rate": rate,
            "date": exchange_date,
        }

    except HTTPException:
        raise
    except Exception as exc:
        print("CURRENCY RATE ERROR:", exc)
        raise HTTPException(
            status_code=502,
            detail="Unable to retrieve exchange rate.",
        ) from exc
