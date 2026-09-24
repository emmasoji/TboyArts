from datetime import date

from fastapi import APIRouter, HTTPException, Query

from services.analytics_service import (
    get_analytics_summary,
    get_realtime_analytics,
)

router = APIRouter(prefix="/api/monitor", tags=["monitor"])


@router.get("/analytics")
async def monitor_analytics(
    start_date: date | None = Query(
        default=None,
        description="Analytics start date in YYYY-MM-DD format.",
    ),
    end_date: date | None = Query(
        default=None,
        description="Analytics end date in YYYY-MM-DD format.",
    ),
):
    try:
        return get_analytics_summary(
            start_date=start_date,
            end_date=end_date,
        )
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
async def monitor_analytics_realtime():
    try:
        return get_realtime_analytics()
    except Exception as exc:
        print("REALTIME ANALYTICS ERROR:", exc)
        raise HTTPException(
            status_code=502,
            detail="Unable to retrieve realtime analytics data.",
        ) from exc
