import os
from typing import Any, Dict

import httpx
from dotenv import load_dotenv

load_dotenv()

PAYSTACK_BASE_URL = "https://api.paystack.co"
PAYSTACK_SECRET_KEY = os.getenv("PAYSTACK_SECRET_KEY")


class PaystackError(Exception):
    pass


def _headers() -> Dict[str, str]:
    if not PAYSTACK_SECRET_KEY:
        raise PaystackError("PAYSTACK_SECRET_KEY is not configured")

    return {
        "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}",
        "Content-Type": "application/json",
    }


async def initialize_transaction(
    email: str,
    amount: int,
    reference: str,
    callback_url: str | None = None,
    channels: list[str] | None = None,
) -> Dict[str, Any]:
    payload: Dict[str, Any] = {
        "email": email,
        "amount": amount,
        "reference": reference,
        "currency": "NGN",
    }

    if callback_url:
        payload["callback_url"] = callback_url

    if channels:
        payload["channels"] = channels

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{PAYSTACK_BASE_URL}/transaction/initialize",
                headers=_headers(),
                json=payload,
            )
    except httpx.HTTPError as exc:
        raise PaystackError(f"Unable to reach Paystack: {exc}") from exc

    try:
        data = response.json()
    except ValueError as exc:
        raise PaystackError("Paystack returned an invalid response") from exc

    if response.status_code >= 400 or not data.get("status"):
        message = data.get("message", "Paystack transaction initialization failed")
        raise PaystackError(message)

    return data["data"]


async def verify_transaction(reference: str) -> Dict[str, Any]:
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{PAYSTACK_BASE_URL}/transaction/verify/{reference}",
                headers=_headers(),
            )
    except httpx.HTTPError as exc:
        raise PaystackError(f"Unable to reach Paystack: {exc}") from exc

    try:
        data = response.json()
    except ValueError as exc:
        raise PaystackError("Paystack returned an invalid response") from exc

    if response.status_code >= 400 or not data.get("status"):
        message = data.get("message", "Paystack transaction verification failed")
        raise PaystackError(message)

    return data["data"]
