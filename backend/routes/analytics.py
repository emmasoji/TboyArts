from fastapi import APIRouter, HTTPException

from services.analytics_service import get_analytics_summary

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
