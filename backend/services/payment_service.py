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

    payment_reference = str(
        payment.get("reference") or ""
    ).strip()

    if payment_reference != reference:
        raise ValueError(
            "Payment reference does not match the requested reference."
        )

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

    orders = await select(
        "orders",
        columns=(
            "id,total,currency,payment_amount,"
            "payment_exchange_rate,country,"
            "payment_status,status,payment_reference"
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

    # Paystack payments are NGN-only, regardless of any legacy
    # currency value or display-currency preference on the order.
    expected_currency = "NGN"

    if payment_currency != expected_currency:
        raise ValueError(
            "Only NGN payments are accepted."
        )

    # The order total is the authoritative NGN amount.
    expected_amount_minor = round(
        float(order.get("total") or 0) * 100
    )

    if amount_kobo != expected_amount_minor:
        raise ValueError(
            "Payment amount does not match the order total."
        )

    country = str(order.get("country") or "").strip().lower()
    is_nigeria = country in {"nigeria", "ng"}
    payment_channel = str(payment.get("channel") or "").strip().lower()

    if not is_nigeria and payment_channel != "card":
        raise ValueError(
            "Card payment is required for international orders."
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
            "currency": payment_currency,
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
        "amount": amount_kobo / 100,
        "currency": payment_currency,
        "order_id": str(order["id"]),
        "already_paid": current_payment_status == "paid",
        "message": "Payment verified successfully.",
    }
