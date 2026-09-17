from datetime import datetime, timezone
from decimal import Decimal
from uuid import uuid4

from models.order import CreateOrderRequest, OrderResponse
from utils.supabase import insert, select, update
from services.paystack_service import (
    PaystackError,
    verify_transaction,
)
from services.payment_service import (
    mark_order_paid_from_payment,
)


async def create_order(request: CreateOrderRequest) -> OrderResponse:
    artwork_ids = [item.artwork_id for item in request.items]

    if len(set(artwork_ids)) != len(artwork_ids):
        raise ValueError("Duplicate artwork items are not allowed.")

    artworks = await select(
        "artworks",
        columns="id,title,price,image,status,shipping_fee",
        filters=None,
    )

    artwork_map = {
        str(artwork["id"]): artwork
        for artwork in artworks
    }

    order_items = []
    subtotal = Decimal("0")
    shipping = Decimal("0")

    for requested_item in request.items:
        artwork = artwork_map.get(requested_item.artwork_id)

        if not artwork:
            raise ValueError(
                f"Artwork {requested_item.artwork_id} was not found."
            )

        price = artwork.get("price")

        if price is None:
            raise ValueError(
                f"Artwork '{artwork.get('title', 'Unknown')}' has no price."
            )

        status = str(artwork.get("status") or "").lower()

        if status in {"sold", "unavailable", "deleted"}:
            raise ValueError(
                f"Artwork '{artwork.get('title', 'Unknown')}' is no longer available."
            )

        unit_price = Decimal(str(price))
        quantity = requested_item.quantity
        item_subtotal = unit_price * quantity

        subtotal += item_subtotal

        shipping_fee = Decimal(str(artwork.get("shipping_fee") or 0))
        if shipping_fee < 0:
            shipping_fee = Decimal("0")
        shipping += shipping_fee

        order_items.append(
            {
                "artwork_id": artwork["id"],
                "title": artwork.get("title"),
                "price": float(unit_price),
                "quantity": quantity,
                "image": artwork.get("image"),
            }
        )

    tax = Decimal("0")
    total = subtotal + shipping + tax

    order_number = f"TB-{uuid4().hex[:6].upper()}"

    order_data = {
        "order_number": order_number,
        "customer_name": request.customer.full_name,
        "email": str(request.customer.email),
        "phone": request.customer.phone,
        "country": request.customer.country,
        "state": request.customer.state,
        "city": request.customer.city,
        "address": request.customer.address,
        "subtotal": float(subtotal),
        "shipping": float(shipping),
        "tax": float(tax),
        "total": float(total),
        "payment_status": "pending",
        "status": "pending",
        "notes": "",
        "payment_method": "paystack",
    }

    created_orders = await insert("orders", order_data)

    if not created_orders:
        raise RuntimeError("Failed to create order.")

    created_order = created_orders[0]
    order_id = str(created_order["id"])

    for item in order_items:
        item["order_id"] = order_id

    try:
        await insert("order_items", order_items)
    except Exception:
        # Remove the orphaned order if order_items creation fails.
        # We intentionally don't silently continue with an incomplete order.
        raise RuntimeError(
            "Order was created but its artwork items could not be saved."
        )

    response_items = [
        {
            "artwork_id": str(item["artwork_id"]),
            "title": item["title"],
            "quantity": item["quantity"],
            "unit_price": int(Decimal(str(item["price"]))),
            "subtotal": int(
                Decimal(str(item["price"])) * item["quantity"]
            ),
        }
        for item in order_items
    ]

    return OrderResponse(
        order_id=order_id,
        reference=order_number,
        amount=int(total),
        shipping=int(shipping),
        tax=int(tax),
        currency="NGN",
        customer=request.customer,
        items=response_items,
        status="pending",
        payment_status="pending",
    )


async def get_checkout_order(
    order_id: str,
    email: str,
) -> OrderResponse:
    orders = await select(
        "orders",
        columns=(
            "id,order_number,customer_name,email,phone,country,"
            "state,city,address,subtotal,shipping,tax,total,"
            "payment_status,status,payment_method,payment_reference"
        ),
        filters={"id": order_id},
    )

    if not orders:
        raise LookupError("Order not found.")

    order = orders[0]

    if str(order.get("email", "")).strip().lower() != email.strip().lower():
        raise LookupError("Order not found.")

    status = str(order.get("status") or "").lower()
    payment_status = str(order.get("payment_status") or "").lower()

    if status == "cancelled" or payment_status == "cancelled":
        raise LookupError("This order has been cancelled.")

    order_items = await select(
        "order_items",
        columns="artwork_id,title,image,quantity,price",
        filters={"order_id": order_id},
    )

    response_items = []

    for item in order_items:
        quantity = int(item.get("quantity") or 0)
        price = float(item.get("price") or 0)

        response_items.append({
            "artwork_id": str(item["artwork_id"]),
            "title": item.get("title") or "Untitled Artwork",
            "quantity": quantity,
            "unit_price": price,
            "subtotal": price * quantity,
        })

    customer = {
        "full_name": order.get("customer_name") or "",
        "email": order.get("email") or "",
        "phone": order.get("phone") or "",
        "address": order.get("address") or "",
        "city": order.get("city") or "",
        "state": order.get("state") or "",
        "country": order.get("country") or "Nigeria",
    }

    return OrderResponse(
        order_id=str(order["id"]),
        reference=order.get("order_number") or "",
        amount=int(float(order.get("total") or 0)),
        shipping=int(float(order.get("shipping") or 0)),
        tax=int(float(order.get("tax") or 0)),
        currency="NGN",
        customer=customer,
        items=response_items,
        status=status or "pending",
        payment_status=payment_status or "pending",
        payment_reference=order.get("payment_reference"),
    )


async def cancel_pending_order(order_id: str):
    orders = await select(
        "orders",
        columns=(
            "id,payment_status,status,"
            "payment_reference"
        ),
        filters={"id": order_id},
    )

    if not orders:
        raise LookupError("Order not found.")

    order = orders[0]

    current_status = str(
        order.get("status") or ""
    ).lower()

    current_payment_status = str(
        order.get("payment_status") or ""
    ).lower()

    payment_reference = str(
        order.get("payment_reference") or ""
    ).strip()

    if current_payment_status == "paid":
        raise ValueError(
            "A paid order cannot be cancelled."
        )

    if current_status in {
        "processing",
        "shipping",
        "completed",
    }:
        raise ValueError(
            "This order can no longer be cancelled."
        )

    # If Paystack already has a payment reference,
    # verify it before allowing cancellation.
    #
    # This prevents a successful payment from being
    # cancelled while the webhook/browser verification
    # has not updated Supabase yet.
    if payment_reference:
        try:
            payment = await verify_transaction(
                payment_reference
            )

            payment_status = str(
                payment.get("status") or ""
            ).lower()

            if payment_status == "success":
                await mark_order_paid_from_payment(
                    payment_reference,
                    payment,
                )

                raise ValueError(
                    "A payment has already been "
                    "received for this order."
                )

        except ValueError:
            raise

        except PaystackError as exc:
            print(
                "PAYSTACK CANCELLATION CHECK ERROR:",
                exc,
            )

            raise ValueError(
                "We could not confirm the payment status. "
                "Please try cancelling the order again."
            ) from exc

        except Exception as exc:
            print(
                "PAYMENT CANCELLATION CHECK ERROR:",
                exc,
            )

            raise ValueError(
                "We could not confirm the payment status. "
                "Please try cancelling the order again."
            ) from exc

    await update(
        "orders",
        {"id": order_id},
        {
            "status": "cancelled",
            "payment_status": "cancelled",
        },
    )

    return {
        "success": True,
        "message": "Order cancelled.",
        "order_id": order_id,
    }

