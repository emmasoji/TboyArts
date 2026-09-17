from fastapi import APIRouter, HTTPException, Query, Request

from models.order import CreateOrderRequest, OrderResponse
from services.order_service import (
    create_order,
    get_checkout_order,
    cancel_pending_order,
)
from utils.rate_limit import limiter

router = APIRouter(prefix="/api/orders", tags=["Orders"])


@router.post("")
@limiter.limit("5/minute")
async def create_order_endpoint(request: Request, order_request: CreateOrderRequest):
    try:
        return await create_order(order_request)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        print("CREATE ORDER ERROR:", exc)
        raise HTTPException(
            status_code=500,
            detail="Unable to create order.",
        ) from exc


@router.get("/{order_id}/checkout", response_model=OrderResponse)
async def get_checkout_order_endpoint(
    order_id: str,
    email: str = Query(...),
):
    try:
        return await get_checkout_order(
            order_id=order_id,
            email=email,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        print("GET CHECKOUT ORDER ERROR:", exc)
        raise HTTPException(
            status_code=500,
            detail="Unable to recover order.",
        ) from exc


@router.post("/{order_id}/cancel")
async def cancel_pending_order_endpoint(order_id: str):
    try:
        return await cancel_pending_order(order_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        print("CANCEL ORDER ERROR:", exc)
        raise HTTPException(
            status_code=500,
            detail="Unable to cancel order.",
        ) from exc
