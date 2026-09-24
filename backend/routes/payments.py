import hashlib
import hmac
import json
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Request

from models.payment import (
    InitializePaymentRequest,
    VerifyPaymentResponse,
)
from services.paystack_service import (
    PaystackError,
    initialize_transaction,
    verify_transaction,
)
from services.payment_service import (
    mark_order_paid_from_payment,
)
from utils.rate_limit import limiter
from utils.supabase import select, update, rpc

import os
from dotenv import load_dotenv

load_dotenv()

PAYSTACK_SECRET_KEY = os.getenv(
    "PAYSTACK_SECRET_KEY"
)


router = APIRouter(
    prefix="/api/payments",
    tags=["Payments"],
)


@router.post("/initialize")
@limiter.limit("5/minute")
async def initialize_payment(
    request: Request,
    payment_request: InitializePaymentRequest,
):
    try:
        orders = await select(
            "orders",
            columns=(
                "id,order_number,email,total,"
                "payment_status,payment_reference"
            ),
            filters={"id": payment_request.order_id},
        )

        if not orders:
            raise HTTPException(
                status_code=404,
                detail="Order not found.",
            )

        order = orders[0]

        if str(
            order.get("payment_status", "")
        ).lower() == "paid":
            raise HTTPException(
                status_code=400,
                detail="This order has already been paid.",
            )

        order_email = str(
            order.get("email") or ""
        ).strip()

        if not order_email:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Order does not have a valid "
                    "email address."
                ),
            )

        total = float(
            order.get("total") or 0
        )

        if total <= 0:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Order total must be greater "
                    "than zero."
                ),
            )

        # Reuse an existing reference so repeated checkout
        # attempts cannot create a new Paystack transaction.
        existing_reference = str(
            order.get("payment_reference") or ""
        ).strip()

        if existing_reference:
            try:
                existing_payment = (
                    await verify_transaction(
                        existing_reference
                    )
                )

                if (
                    str(
                        existing_payment.get("status")
                        or ""
                    ).lower()
                    == "success"
                ):
                    await mark_order_paid_from_payment(
                        existing_reference,
                        existing_payment,
                    )

                    raise HTTPException(
                        status_code=400,
                        detail=(
                            "A payment has already "
                            "been received for this order."
                        ),
                    )

            except HTTPException:
                raise

            except PaystackError as exc:
                print(
                    "EXISTING PAYMENT CHECK ERROR:",
                    exc,
                )

            except Exception as exc:
                print(
                    "EXISTING PAYMENT CHECK ERROR:",
                    exc,
                )

        amount_kobo = round(
            total * 100
        )

        if existing_reference:
            payment_reference = existing_reference
        else:
            candidate_reference = (
                f"{order['order_number']}"
                f"-PAY-{uuid4().hex[:10].upper()}"
            )

            claimed_reference = await rpc(
                "claim_payment_reference",
                {
                    "p_order_id": payment_request.order_id,
                    "p_reference": candidate_reference,
                },
            )

            payment_reference = str(
                claimed_reference or ""
            ).strip()

            if not payment_reference:
                raise HTTPException(
                    status_code=409,
                    detail=(
                        "Unable to reserve a payment reference. "
                        "Please try again."
                    ),
                )

        channel_map = {
            "card": "card",
            "transfer": "bank_transfer",
            "bank": "bank",
            "ussd": "ussd",
        }

        selected_method = (
            payment_request.payment_method
            .lower()
            .strip()
        )

        if selected_method not in channel_map:
            raise HTTPException(
                status_code=400,
                detail="Unsupported payment method.",
            )

        payment = await initialize_transaction(
            email=order_email,
            amount=amount_kobo,
            reference=payment_reference,
            channels=[
                channel_map[selected_method]
            ],
        )

        reference = payment["reference"]

        await update(
            "orders",
            {"id": payment_request.order_id},
            {
                "payment_reference": reference,
                "payment_method": selected_method,
            },
        )

        return {
            "success": True,
            "order_id": payment_request.order_id,
            "order_number": order["order_number"],
            "reference": reference,
            "authorization_url": payment.get(
                "authorization_url"
            ),
            "access_code": payment.get(
                "access_code"
            ),
            "amount": amount_kobo,
            "currency": "NGN",
        }

    except HTTPException:
        raise

    except PaystackError as exc:
        print(
            "PAYSTACK INITIALIZE ERROR:",
            exc,
        )
        raise HTTPException(
            status_code=502,
            detail=(
                "Unable to initialize "
                "Paystack payment."
            ),
        ) from exc

    except Exception as exc:
        print(
            "INITIALIZE PAYMENT ERROR:",
            exc,
        )
        raise HTTPException(
            status_code=500,
            detail="Unable to initialize payment.",
        ) from exc


@router.get(
    "/verify/{reference}",
    response_model=VerifyPaymentResponse,
)
@limiter.limit("10/minute")
async def verify_payment(
    request: Request,
    reference: str,
):
    try:
        payment = await verify_transaction(
            reference
        )

        result = (
            await mark_order_paid_from_payment(
                reference,
                payment,
            )
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

        return VerifyPaymentResponse(
            success=result["success"],
            reference=reference,
            status=payment_status,
            amount=amount_kobo // 100,
            currency=payment_currency,
            message=result["message"],
        )

    except HTTPException:
        raise

    except LookupError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except PaystackError as exc:
        print(
            "PAYSTACK VERIFY ERROR:",
            exc,
        )
        raise HTTPException(
            status_code=502,
            detail=(
                "Unable to verify "
                "Paystack payment."
            ),
        ) from exc

    except Exception as exc:
        print(
            "VERIFY PAYMENT ERROR:",
            exc,
        )
        raise HTTPException(
            status_code=500,
            detail="Unable to verify payment.",
        ) from exc


@router.post("/webhook")
async def paystack_webhook(request: Request):
    """
    Receive Paystack webhook events.

    Paystack signs the raw request body using
    HMAC-SHA512 with PAYSTACK_SECRET_KEY.
    """

    if not PAYSTACK_SECRET_KEY:
        print(
            "PAYSTACK WEBHOOK ERROR: "
            "PAYSTACK_SECRET_KEY is not configured"
        )

        raise HTTPException(
            status_code=500,
            detail="Paystack webhook is not configured.",
        )

    raw_body = await request.body()

    signature = request.headers.get(
        "x-paystack-signature"
    )

    if not signature:
        raise HTTPException(
            status_code=401,
            detail="Missing Paystack signature.",
        )

    expected_signature = hmac.new(
        PAYSTACK_SECRET_KEY.encode("utf-8"),
        raw_body,
        hashlib.sha512,
    ).hexdigest()

    if not hmac.compare_digest(
        signature,
        expected_signature,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid Paystack signature.",
        )

    try:
        payload = json.loads(
            raw_body.decode("utf-8")
        )
    except (UnicodeDecodeError, json.JSONDecodeError):
        raise HTTPException(
            status_code=400,
            detail="Invalid webhook payload.",
        )

    event = str(
        payload.get("event") or ""
    ).lower()

    # We only need successful payment events.
    if event != "charge.success":
        return {
            "success": True,
            "received": True,
            "processed": False,
            "event": event,
        }

    data = payload.get("data") or {}

    reference = str(
        data.get("reference") or ""
    ).strip()

    if not reference:
        print(
            "PAYSTACK WEBHOOK: "
            "charge.success without reference"
        )

        return {
            "success": True,
            "received": True,
            "processed": False,
        }

    try:
        result = (
            await mark_order_paid_from_payment(
                reference,
                data,
            )
        )

        print(
            "PAYSTACK WEBHOOK PROCESSED:",
            reference,
            result,
        )

        return {
            "success": True,
            "received": True,
            "processed": True,
            "reference": reference,
        }

    except LookupError as exc:
        # Return 200 so Paystack does not endlessly retry
        # an event for an order that TboyArts cannot find.
        print(
            "PAYSTACK WEBHOOK ORDER NOT FOUND:",
            reference,
            exc,
        )

        return {
            "success": True,
            "received": True,
            "processed": False,
            "reference": reference,
            "message": str(exc),
        }

    except ValueError as exc:
        print(
            "PAYSTACK WEBHOOK VALIDATION ERROR:",
            reference,
            exc,
        )

        return {
            "success": True,
            "received": True,
            "processed": False,
            "reference": reference,
            "message": str(exc),
        }

    except Exception as exc:
        # A genuine server-side processing failure should
        # return non-2xx so Paystack can retry the webhook.
        print(
            "PAYSTACK WEBHOOK PROCESSING ERROR:",
            exc,
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to process Paystack webhook.",
        ) from exc
