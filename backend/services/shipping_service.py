import os
from datetime import date, timedelta
from decimal import Decimal, InvalidOperation
from typing import Any

import httpx
from dotenv import load_dotenv

load_dotenv()

SHIPBUBBLE_BASE_URL = "https://api.shipbubble.com/v1"


class ShippingError(Exception):
    """A safe, user-facing shipping integration error."""


def _configuration() -> tuple[str, str, str]:
    api_key = os.getenv("SHIPBUBBLE_API_KEY", "").strip()
    sender_code = os.getenv("SHIPBUBBLE_SENDER_ADDRESS_CODE", "").strip()
    category_id = os.getenv("SHIPBUBBLE_CATEGORY_ID", "").strip()

    missing = []
    if not api_key:
        missing.append("SHIPBUBBLE_API_KEY")
    if not sender_code:
        missing.append("SHIPBUBBLE_SENDER_ADDRESS_CODE")
    if not category_id:
        missing.append("SHIPBUBBLE_CATEGORY_ID")

    if missing:
        raise ShippingError(
            "Shipping is not configured yet. Missing server settings: "
            + ", ".join(missing)
        )

    return api_key, sender_code, category_id


def _headers(api_key: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


async def _post_shipbubble(
    endpoint: str,
    api_key: str,
    payload: dict[str, Any],
) -> dict[str, Any]:
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{SHIPBUBBLE_BASE_URL}{endpoint}",
                headers=_headers(api_key),
                json=payload,
            )
    except httpx.TimeoutException as exc:
        raise ShippingError(
            "The shipping provider took too long to respond. Please try again."
        ) from exc
    except httpx.HTTPError as exc:
        raise ShippingError(
            "Unable to contact the shipping provider right now."
        ) from exc

    if response.status_code >= 400:
        try:
            error_data = response.json()
        except ValueError:
            error_data = {}

        message = ""
        if isinstance(error_data, dict):
            for key in ("message", "error", "detail"):
                value = error_data.get(key)
                if isinstance(value, str):
                    message = value[:300]
                    break

        print(
            "SHIPBUBBLE REQUEST FAILED:",
            {
                "endpoint": endpoint,
                "status": response.status_code,
                "provider_message": message or "No safe message returned",
            },
        )
        raise ShippingError(
            f"The shipping provider rejected the request (HTTP {response.status_code})."
        )

    try:
        result = response.json()
    except ValueError as exc:
        raise ShippingError(
            "The shipping provider returned an invalid response."
        ) from exc

    if not isinstance(result, dict) or result.get("status") != "success":
        raise ShippingError(
            "The shipping provider could not process this request."
        )

    return result


async def validate_delivery_address(
    *,
    name: str,
    email: str,
    phone: str,
    address: str,
) -> dict[str, Any]:
    api_key, _, _ = _configuration()

    result = await _post_shipbubble(
        "/shipping/address/validate",
        api_key,
        {
            "name": name,
            "email": email,
            "phone": phone,
            "address": address,
        },
    )

    data = result.get("data")
    if not isinstance(data, dict) or not data.get("address_code"):
        raise ShippingError(
            "The shipping provider could not verify this delivery address. "
            "Please check the address and try again."
        )

    # Return only the fields needed by checkout.
    return {
        "address_code": data["address_code"],
        "formatted_address": data.get("formatted_address") or address,
        "country": data.get("country"),
        "country_code": data.get("country_code"),
        "city": data.get("city"),
        "state": data.get("state"),
        "postal_code": data.get("postal_code"),
    }


async def fetch_shipping_rates(
    *,
    receiver_address_code: int,
    package_items: list[dict[str, Any]],
    package_dimension: dict[str, int],
    delivery_instructions: str = "",
) -> dict[str, Any]:
    api_key, sender_code, category_id = _configuration()

    if receiver_address_code <= 0:
        raise ShippingError("A valid delivery address is required.")

    if not package_items:
        raise ShippingError("There are no package items to ship.")

    required_dimensions = {"length", "width", "height"}
    if set(package_dimension) != required_dimensions:
        raise ShippingError(
            "Package length, width, and height are required."
        )

    if any(
        not isinstance(package_dimension[key], int)
        or package_dimension[key] <= 0
        for key in required_dimensions
    ):
        raise ShippingError(
            "Package dimensions must be positive whole numbers in centimetres."
        )

    payload: dict[str, Any] = {
        "sender_address_code": int(sender_code),
        "reciever_address_code": receiver_address_code,
        "pickup_date": (date.today() + timedelta(days=1)).isoformat(),
        "category_id": int(category_id),
        "package_items": package_items,
        "package_dimension": package_dimension,
    }

    if delivery_instructions.strip():
        payload["delivery_instructions"] = delivery_instructions.strip()[:500]

    result = await _post_shipbubble(
        "/shipping/fetch_rates",
        api_key,
        payload,
    )

    data = result.get("data")
    if not isinstance(data, dict):
        raise ShippingError("The shipping provider returned no rate data.")

    couriers = data.get("couriers")
    request_token = data.get("request_token")

    if not isinstance(couriers, list) or not request_token:
        raise ShippingError("No valid shipping quotes were returned.")

    # Only expose validated quote fields needed by checkout.
    safe_couriers = []

    for courier in couriers:
        if not isinstance(courier, dict):
            continue

        courier_id = str(courier.get("courier_id") or "").strip()
        courier_name = str(courier.get("courier_name") or "").strip()
        service_code = str(courier.get("service_code") or "").strip()

        if not courier_id or not courier_name or not service_code:
            continue

        raw_amount = courier.get("rate_card_amount")
        if raw_amount is None:
            raw_amount = courier.get("total")

        try:
            amount_decimal = Decimal(str(raw_amount))
        except (InvalidOperation, TypeError, ValueError):
            continue

        if not amount_decimal.is_finite() or amount_decimal < 0:
            continue

        raw_currency = str(
            courier.get("rate_card_currency")
            or courier.get("currency")
            or "NGN"
        ).strip().upper()

        if len(raw_currency) != 3 or not raw_currency.isalpha():
            continue

        safe_couriers.append({
            "courier_id": courier_id,
            "courier_name": courier_name[:150],
            "service_code": service_code,
            "service_type": str(courier.get("service_type") or "")[:100],
            "rate_card_amount": float(amount_decimal),
            "currency": raw_currency,
            "pickup_eta": courier.get("pickup_eta"),
            "delivery_eta": courier.get("delivery_eta"),
            "tracking_level": courier.get("tracking_level"),
        })

    if not safe_couriers:
        raise ShippingError("No usable shipping quotes were returned.")

    return {
        "request_token": str(request_token),
        "couriers": safe_couriers,
    }
