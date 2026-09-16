from fastapi import APIRouter, Depends, HTTPException

from models.admin_order import UpdateOrderStatusRequest
from services.admin_auth_service import require_authenticated_admin
from services.admin_order_email_service import (
    AdminOrderEmailError,
    send_completed_order_email,
)
from utils.supabase import select, update


router = APIRouter(
    prefix="/api/admin/orders",
    tags=["Admin Orders"],
)


@router.patch("/{order_id}/status")
async def update_order_status_endpoint(
    order_id: str,
    request: UpdateOrderStatusRequest,
    _user: dict = Depends(require_authenticated_admin),
):
    try:
        orders = await select(
            "orders",
            columns="id,order_number,status",
            filters={"id": order_id},
        )

        if not orders:
            raise HTTPException(
                status_code=404,
                detail="Order not found.",
            )

        current_status = str(
            orders[0].get("status") or ""
        ).lower()

        new_status = request.status

        updated_rows = await update(
            "orders",
            {"id": order_id},
            {
                "status": new_status,
            },
        )

        if not updated_rows:
            raise HTTPException(
                status_code=404,
                detail="Order could not be updated.",
            )

        notification = {
            "sent": False,
            "skipped": True,
        }

        if (
            new_status == "completed"
            and current_status != "completed"
        ):
            try:
                await send_completed_order_email(
                    order_id
                )

                notification = {
                    "sent": True,
                    "skipped": False,
                }

            except AdminOrderEmailError as exc:
                print(
                    "ADMIN COMPLETED ORDER EMAIL ERROR:",
                    exc,
                )

                notification = {
                    "sent": False,
                    "skipped": False,
                    "error": str(exc),
                }

        return {
            "success": True,
            "order": updated_rows[0],
            "notification": notification,
        }

    except HTTPException:
        raise

    except Exception as exc:
        print(
            "ADMIN ORDER STATUS UPDATE ERROR:",
            exc,
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to update order status.",
        ) from exc
