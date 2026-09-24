import os
import time
from datetime import date

from fastapi import APIRouter, Header, HTTPException, Query

from services.analytics_service import (
    get_analytics_summary,
    get_realtime_analytics,
)

router = APIRouter(prefix="/api/monitor", tags=["monitor"])

MONITOR_API_TOKEN = os.getenv("MONITOR_API_TOKEN", "").strip()
CACHE_TTL_SECONDS = 60

_analytics_cache: dict[str, tuple[float, dict]] = {}
_realtime_cache: tuple[float, dict] | None = None


def _require_monitor_token(token: str | None) -> None:
    if not MONITOR_API_TOKEN:
        raise HTTPException(
            status_code=503,
            detail="Monitor authentication is not configured.",
        )

    if not token or token != MONITOR_API_TOKEN:
        raise HTTPException(
            status_code=401,
            detail="Invalid monitor token.",
        )


@router.get("/analytics")
async def monitor_analytics(
    x_monitor_token: str | None = Header(default=None),
    start_date: date | None = Query(
        default=None,
        description="Analytics start date in YYYY-MM-DD format.",
    ),
    end_date: date | None = Query(
        default=None,
        description="Analytics end date in YYYY-MM-DD format.",
    ),
):
    _require_monitor_token(x_monitor_token)

    cache_key = (
        f"{start_date.isoformat() if start_date else 'default'}:"
        f"{end_date.isoformat() if end_date else 'default'}"
    )

    now = time.monotonic()
    cached = _analytics_cache.get(cache_key)

    if cached and now - cached[0] < CACHE_TTL_SECONDS:
        return cached[1]

    try:
        result = get_analytics_summary(
            start_date=start_date,
            end_date=end_date,
        )

        _analytics_cache[cache_key] = (
            time.monotonic(),
            result,
        )

        return result

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        print("ANALYTICS ERROR:", exc)
        raise HTTPException(
            status_code=502,
            detail="Unable to retrieve analytics data.",
        ) from exc


@router.get("/analytics/realtime")
async def monitor_analytics_realtime(
    x_monitor_token: str | None = Header(default=None),
):
    _require_monitor_token(x_monitor_token)

    global _realtime_cache

    now = time.monotonic()

    if (
        _realtime_cache
        and now - _realtime_cache[0] < CACHE_TTL_SECONDS
    ):
        return _realtime_cache[1]

    try:
        result = get_realtime_analytics()

        _realtime_cache = (
            time.monotonic(),
            result,
        )

        return result

    except Exception as exc:
        print("REALTIME ANALYTICS ERROR:", exc)
        raise HTTPException(
            status_code=502,
            detail="Unable to retrieve realtime analytics data.",
        ) from exc
