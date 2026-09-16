from typing import Any

from services.order_confirmation_email_service import (
    OrderConfirmationEmailError,
    send_order_confirmation_email,
)
from services.admin_order_email_service import (
    AdminOrderEmailError,
    send_paid_order_admin_email,
)
from utils.supabase import select, update


async def mark_order_paid_from_payment(
    reference: str,
    payment: dict[str, Any],
) -> dict[str, Any]:
    """
    Validate a Paystack payment against its TboyArts order and
    mark the order as paid.

    This is intentionally shared by:
    - browser payment verification
    - Paystack webhook processing
    - cancellation/payment-race protection
    """

    payment_status = str(
        payment.get("status") or ""
    ).lower()

    payment_currency = str(
        payment.get("currency") or "NGN"
    ).upper()

    amount_kobo = int(
        payment.get("amount") or 0
    )

    if payment_status != "success":
        return {
            "success": False,
            "reference": reference,
            "status": payment_status,
            "message": (
                f"Payment status: "
                f"{payment_status or 'unknown'}"
            ),
        }

    if payment_currency != "NGN":
        raise ValueError(
            "Payment currency does not match the order."
        )

    orders = await select(
        "orders",
        columns=(
            "id,total,payment_status,status,"
            "payment_reference"
        ),
        filters={
            "payment_reference": reference,
        },
    )

    if not orders:
        raise LookupError(
            "Order associated with this payment was not found."
        )

    order = orders[0]

    order_total_kobo = round(
        float(order.get("total") or 0) * 100
    )

    if amount_kobo != order_total_kobo:
        raise ValueError(
            "Payment amount does not match the order total."
        )

    current_payment_status = str(
        order.get("payment_status") or ""
    ).lower()

    # Idempotent: webhook + browser verification can safely
    # process the same successful payment more than once.
    await update(
        "orders",
        {"id": order["id"]},
        {
            "payment_status": "paid",
            "status": "processing",
            "payment_method": "paystack",
            "payment_reference": reference,
        },
    )

    # The email service already protects against duplicate
    # confirmation emails using order_confirmation_email_sent_at.
    try:
        await send_order_confirmation_email(
            order_id=str(order["id"])
        )
    except OrderConfirmationEmailError as email_exc:
        print(
            "ORDER CONFIRMATION EMAIL ERROR:",
            email_exc,
        )
    except Exception as email_exc:
        print(
            "UNEXPECTED ORDER CONFIRMATION EMAIL ERROR:",
            email_exc,
        )

    # Notify the admin when payment is successfully completed.
    # This is independent of the customer confirmation email so
    # an email failure cannot undo a successful payment.
    try:
        await send_paid_order_admin_email(
            order_id=str(order["id"])
        )
    except AdminOrderEmailError as email_exc:
        print(
            "ADMIN PAID ORDER EMAIL ERROR:",
            email_exc,
        )
    except Exception as email_exc:
        print(
            "UNEXPECTED ADMIN PAID ORDER EMAIL ERROR:",
            email_exc,
        )

    return {
        "success": True,
        "reference": reference,
        "status": "success",
        "amount": amount_kobo // 100,
        "currency": payment_currency,
        "order_id": str(order["id"]),
        "already_paid": current_payment_status == "paid",
        "message": "Payment verified successfully.",
    }
