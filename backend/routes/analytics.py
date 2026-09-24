from fastapi import APIRouter, HTTPException

from services.analytics_service import (
    get_analytics_summary,
    get_realtime_analytics,
)

router = APIRouter(prefix="/api/monitor", tags=["monitor"])


@router.get("/analytics")
async def monitor_analytics():
    try:
        return get_analytics_summary()
    except Exception as exc:
        print("ANALYTICS ERROR:", exc)
        raise HTTPException(
            status_code=502,
            detail="Unable to retrieve analytics data.",
        ) from exc


@router.get("/analytics/realtime")
async def monitor_analytics_realtime():
    try:
        return get_realtime_analytics()
    except Exception as exc:
        print("REALTIME ANALYTICS ERROR:", exc)
        raise HTTPException(
            status_code=502,
            detail="Unable to retrieve realtime analytics data.",
        ) from exc
