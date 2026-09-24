from typing import Any

from utils.supabase import select


async def track_order(
    *,
    order_number: str,
    email: str,
) -> dict[str, Any] | None:
    normalized_order_number = order_number.strip().upper()
    normalized_email = email.strip().lower()

    if not normalized_order_number or not normalized_email:
        raise ValueError("Order number and email are required.")

    orders = await select(
        "orders",
        columns=(
            "id,"
            "order_number,"
            "customer_name,"
            "email,"
            "total,"
            "payment_status,"
            "status,"
            "created_at,"
            "updated_at"
        ),
        filters={
            "order_number": normalized_order_number,
            "email": normalized_email,
        },
    )

    if not orders:
        return None

    order = orders[0]
    order_id = str(order["id"])

    order_items = await select(
        "order_items",
        columns="artwork_id,title,image,quantity",
        filters={"order_id": order_id},
    )

    return {
        "id": order_id,
        "order_number": order.get("order_number"),
        "customer_name": order.get("customer_name"),
        "total": order.get("total"),
        "payment_status": order.get("payment_status"),
        "status": order.get("status"),
        "created_at": order.get("created_at"),
        "updated_at": order.get("updated_at"),
        "items": [
            {
                "artwork_id": str(item["artwork_id"]),
                "title": item.get("title"),
                "image": item.get("image"),
                "quantity": item.get("quantity", 1),
            }
            for item in order_items
        ],
    }
