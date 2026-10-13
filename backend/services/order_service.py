from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from uuid import uuid4

from models.order import CreateOrderRequest, OrderResponse
from utils.supabase import insert, select, update, rpc
from services.paystack_service import (
    PaystackError,
    verify_transaction,
)
from services.payment_service import (
    mark_order_paid_from_payment,
)


async def create_order(request: CreateOrderRequest) -> OrderResponse:
    from fastapi import HTTPException
    from routes.shipping import _build_package
    from services.shipping_service import ShippingError, fetch_shipping_rates

    artwork_ids = [item.artwork_id for item in request.items]
    if len(set(artwork_ids)) != len(artwork_ids):
        raise ValueError("Duplicate artwork items are not allowed.")

    artworks = await select(
        "artworks",
        columns="id,title,price,image,status,dimensions,package_weight_kg",
        in_filters={"id": artwork_ids},
    )
    artwork_map = {str(a["id"]): a for a in artworks}

    if len(artwork_map) != len(set(artwork_ids)):
        raise ValueError("One or more artworks could not be found.")

    order_items = []
    subtotal = Decimal("0")

    for requested_item in request.items:
        artwork = artwork_map.get(requested_item.artwork_id)
        if not artwork:
            raise ValueError(f"Artwork {requested_item.artwork_id} was not found.")

        status = str(artwork.get("status") or "").lower()
        if status in {"sold", "unavailable", "deleted"}:
            raise ValueError(
                f"Artwork '{artwork.get('title', 'Unknown')}' is no longer available."
            )

        raw_price = artwork.get("price")
        if raw_price is None:
            raise ValueError("An artwork is missing its price.")

        unit_price = Decimal(str(raw_price))
        if not unit_price.is_finite() or unit_price <= 0:
            raise ValueError("An artwork has an invalid price.")

        quantity = requested_item.quantity
        subtotal += unit_price * quantity
        order_items.append({
            "artwork_id": artwork["id"],
            "title": artwork.get("title") or "Untitled Artwork",
            "price": float(unit_price),
            "quantity": quantity,
            "image": artwork.get("image"),
        })

    # Rebuild package data from current database values, not browser-supplied data.
    package_items, package_dimension = _build_package(artworks, artwork_ids)

    try:
        fresh_quotes = await fetch_shipping_rates(
            receiver_address_code=request.receiver_address_code,
            package_items=package_items,
            package_dimension=package_dimension,
            delivery_instructions=request.delivery_instructions,
        )
    except HTTPException as exc:
        raise ValueError(
            "We couldn't verify the shipping quote. Please fetch shipping rates again."
        ) from exc
    except ShippingError as exc:
        raise ValueError(
            "We couldn't verify the shipping quote. Please fetch shipping rates again."
        ) from exc

    selected = next(
        (
            quote for quote in fresh_quotes.get("couriers", [])
            if str(quote.get("courier_id")) == request.shipping_courier_id
            and str(quote.get("service_code")) == request.shipping_service_code
        ),
        None,
    )
    if not selected:
        raise ValueError(
            "Your selected shipping service is no longer available. Please fetch rates again."
        )

    currency = str(selected.get("currency") or "").upper()
    if currency != "NGN":
        raise ValueError("Only NGN shipping quotes are supported for checkout.")

    verified_shipping = Decimal(str(selected.get("rate_card_amount")))
    displayed_shipping = Decimal(str(request.shipping_rate_amount))
    if (
        not verified_shipping.is_finite()
        or verified_shipping < 0
        or verified_shipping != displayed_shipping
    ):
        raise ValueError(
            "The shipping price has changed. Please fetch shipping rates again."
        )

    tax = Decimal("0")
    total = subtotal + verified_shipping + tax
    order_number = f"TB-{uuid4().hex[:6].upper()}"

    # Paystack checkout is NGN-only. The website's display currency
    # must never determine the currency or amount charged.
    payment_currency = "NGN"
    payment_exchange_rate = Decimal("1")
    payment_amount = Decimal(str(total))

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
        "shipping": float(verified_shipping),
        "tax": float(tax),
        "total": float(total),
        "payment_status": "pending",
        "status": "pending",
        "notes": "",
        "payment_method": "paystack",
        "currency": payment_currency,
        "shipping_provider": "Shipbubble",
        "shipping_quote_token": fresh_quotes.get("request_token"),
        "shipping_courier_id": selected.get("courier_id"),
        "shipping_service_code": selected.get("service_code"),
        "shipping_service_type": selected.get("service_type") or "",
        "shipping_delivery_eta": selected.get("delivery_eta") or "",
        "shipping_pickup_eta": selected.get("pickup_eta") or "",
        "shipping_quote_currency": currency,
        "actual_courier_name": None,
        "actual_courier_service": None,
    }

    transaction_result = await rpc(
        "create_order_transaction",
        {"p_order": order_data, "p_items": order_items},
    )
    if not transaction_result:
        raise RuntimeError("Failed to create order.")

    order_id = str(transaction_result["id"])
    await update(
        "orders",
        {"id": order_id},
        {
            "payment_amount": float(payment_amount),
            "payment_exchange_rate": float(payment_exchange_rate),
            "shipping_courier_name": selected.get("courier_name") or "",
        },
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
        shipping=int(verified_shipping),
        tax=int(tax),
        currency="NGN",
        payment_amount=float(payment_amount),
        payment_currency=payment_currency,
        payment_exchange_rate=float(payment_exchange_rate),
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
            "state,city,address,subtotal,shipping,tax,total,currency,"
            "payment_amount,payment_exchange_rate,"
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
        payment_amount=float(order.get("payment_amount") or order.get("total") or 0),
        payment_currency=str(order.get("currency") or "NGN").upper(),
        payment_exchange_rate=float(order.get("payment_exchange_rate") or 1),
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
            error_message = str(exc).lower()

            # A reference that Paystack confirms does not exist
            # cannot represent a successful transaction.
            if "reference not found" in error_message:
                print(
                    "Paystack has no transaction for this reference; "
                    "allowing cancellation of the unpaid order."
                )
            else:
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

