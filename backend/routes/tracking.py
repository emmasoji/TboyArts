from fastapi import APIRouter, HTTPException, Query, Request

from utils.rate_limit import limiter
from services.tracking_service import track_order

router = APIRouter(
    prefix="/api/tracking",
    tags=["Order Tracking"],
)


@router.get("/order")
@limiter.limit("20/minute")
async def track_order_endpoint(
    request: Request,
    order_number: str | None = Query(default=None),
    email: str | None = Query(default=None),
):
    if not order_number and not email:
        raise HTTPException(
            status_code=400,
            detail="Order number or email is required.",
        )

    if order_number and email:
        raise HTTPException(
            status_code=400,
            detail="Use either order number or email, not both.",
        )

    try:
        order = await track_order(
            order_number=order_number,
            email=email,
        )

        if not order:
            raise HTTPException(
                status_code=404,
                detail="Order not found.",
            )

        return {
            "success": True,
            "order": order,
        }

    except HTTPException:
        raise

    except Exception as exc:
        print("TRACK ORDER ERROR:", exc)

        raise HTTPException(
            status_code=500,
            detail="Unable to track order.",
        ) from exc
