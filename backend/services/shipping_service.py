import os
from decimal import Decimal, InvalidOperation
from typing import Any

import httpx
from dotenv import load_dotenv

load_dotenv()

TERMINAL_BASE_URL = os.getenv(
    "TERMINAL_AFRICA_BASE_URL",
    "https://api.terminal.africa/v1",
).rstrip("/")

_cached_pickup_id: str | None = None
_cached_packaging_id: str | None = None


class ShippingError(Exception):
    """A safe, user-facing shipping integration error."""


def _secret_key() -> str:
    secret = os.getenv("TERMINAL_AFRICA_SECRET_KEY", "").strip()
    if not secret:
        raise ShippingError(
            "Shipping is not configured yet. Missing TERMINAL_AFRICA_SECRET_KEY."
        )
    return secret


def _headers(secret: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {secret}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


async def _request(
    method: str,
    endpoint: str,
    secret: str,
    *,
    json_body: dict[str, Any] | None = None,
    params: dict[str, Any] | None = None,
) -> dict[str, Any]:
    url = f"{TERMINAL_BASE_URL}{endpoint}"
    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.request(
                method,
                url,
                headers=_headers(secret),
                json=json_body,
                params=params,
            )
    except httpx.TimeoutException as exc:
        raise ShippingError(
            "The shipping provider took too long to respond. Please try again."
        ) from exc
    except httpx.HTTPError as exc:
        raise ShippingError(
            "Unable to contact the shipping provider right now."
        ) from exc

    try:
        data = response.json()
    except ValueError:
        data = {}

    if response.status_code >= 400:
        message = ""
        if isinstance(data, dict):
            for key in ("message", "error", "detail"):
                value = data.get(key)
                if isinstance(value, str) and value.strip():
                    message = value.strip()[:300]
                    break

        print(
            "TERMINAL AFRICA REQUEST FAILED:",
            {
                "endpoint": endpoint,
                "status": response.status_code,
                "provider_message": message or "No safe message returned",
            },
        )
        raise ShippingError(
            message
            or f"The shipping provider rejected the request (HTTP {response.status_code})."
        )

    if not isinstance(data, dict):
        raise ShippingError("The shipping provider returned an invalid response.")

    if data.get("status") is False:
        raise ShippingError(
            str(data.get("message") or "The shipping provider could not process this request.")
        )

    return data


async def _get_pickup_address_id(secret: str) -> str:
    global _cached_pickup_id

    env_id = os.getenv("TERMINAL_AFRICA_PICKUP_ADDRESS_ID", "").strip()
    if env_id:
        return env_id

    if _cached_pickup_id:
        return _cached_pickup_id

    for endpoint in ("/addresses/default/sender", "/default/sender"):
        try:
            result = await _request("GET", endpoint, secret)
            data = result.get("data") or {}
            address_id = str(data.get("address_id") or data.get("id") or "").strip()
            if address_id:
                _cached_pickup_id = address_id
                return address_id
        except ShippingError:
            continue

    result = await _request(
        "GET",
        "/addresses",
        secret,
        params={"perPage": 50, "page": 1},
    )
    data = result.get("data") or {}
    addresses = data.get("addresses") if isinstance(data, dict) else None
    if not isinstance(addresses, list):
        addresses = data if isinstance(data, list) else []

    chosen = None
    for addr in addresses:
        if isinstance(addr, dict) and addr.get("sender_default") is True:
            chosen = addr
            break
    if chosen is None and addresses and isinstance(addresses[0], dict):
        chosen = addresses[0]

    if not chosen:
        raise ShippingError(
            "No pickup address found on your Terminal Africa account. "
            "Add a sender address in the Terminal dashboard."
        )

    address_id = str(chosen.get("address_id") or chosen.get("id") or "").strip()
    if not address_id:
        raise ShippingError("Could not read pickup address id from Terminal Africa.")

    _cached_pickup_id = address_id
    return address_id


async def _get_packaging_id(secret: str) -> str:
    global _cached_packaging_id

    env_id = os.getenv("TERMINAL_AFRICA_PACKAGING_ID", "").strip()
    if env_id:
        return env_id

    if _cached_packaging_id:
        return _cached_packaging_id

    result = await _request(
        "GET",
        "/packaging",
        secret,
        params={"perPage": 50, "page": 1},
    )
    data = result.get("data") or {}
    packaging_list = data.get("packaging") if isinstance(data, dict) else None
    if not isinstance(packaging_list, list):
        packaging_list = data if isinstance(data, list) else []

    box = None
    first = None
    for pkg in packaging_list:
        if not isinstance(pkg, dict):
            continue
        if first is None:
            first = pkg
        if "box" in str(pkg.get("type") or "").lower():
            box = pkg
            break

    chosen = box or first
    if chosen:
        packaging_id = str(chosen.get("packaging_id") or chosen.get("id") or "").strip()
        if packaging_id:
            _cached_packaging_id = packaging_id
            return packaging_id

    created = await _request(
        "POST",
        "/packaging",
        secret,
        json_body={
            "name": "TboyArts Artwork Box",
            "type": "box",
            "height": 15,
            "width": 50,
            "length": 70,
            "size_unit": "cm",
            "weight": 0.5,
            "weight_unit": "kg",
        },
    )
    created_data = created.get("data") or {}
    packaging_id = str(
        created_data.get("packaging_id") or created_data.get("id") or ""
    ).strip()
    if not packaging_id:
        raise ShippingError(
            "No packaging found on Terminal Africa and could not create one."
        )

    _cached_packaging_id = packaging_id
    return packaging_id


def _split_name(full_name: str) -> tuple[str, str]:
    parts = [p for p in full_name.strip().split() if p]
    if not parts:
        return "Customer", "Customer"
    if len(parts) == 1:
        return parts[0], parts[0]
    return parts[0], " ".join(parts[1:])


def _parse_address_line(address: str) -> dict[str, str]:
    parts = [p.strip() for p in address.split(",") if p.strip()]
    country = "NG"
    state = "Lagos"
    city = "Lagos"
    line1 = address.strip() or "Address"

    if len(parts) >= 4:
        line1 = parts[0]
        city = parts[-3]
        state = parts[-2]
        country_raw = parts[-1]
        country = country_raw[:2].upper() if len(country_raw) == 2 else country_raw
    elif len(parts) == 3:
        line1, city, state = parts[0], parts[1], parts[2]
    elif len(parts) == 2:
        line1, city = parts[0], parts[1]
        state = parts[1]

    country_map = {
        "NIGERIA": "NG",
        "UNITED STATES": "US",
        "USA": "US",
        "UK": "GB",
        "UNITED KINGDOM": "GB",
        "UAE": "AE",
        "UNITED ARAB EMIRATES": "AE",
    }
    country_up = country.upper()
    country = country_map.get(country_up, country_up if len(country_up) == 2 else "NG")

    return {
        "line1": line1[:200],
        "city": (city or "Lagos")[:100],
        "state": (state or "Lagos")[:100],
        "country": country,
        "zip": "100001",
    }


async def validate_delivery_address(
    *,
    name: str,
    email: str,
    phone: str,
    address: str,
) -> dict[str, Any]:
    secret = _secret_key()
    first_name, last_name = _split_name(name)
    parsed = _parse_address_line(address)

    payload = {
        "first_name": first_name,
        "last_name": last_name,
        "name": name.strip(),
        "email": email.strip(),
        "phone": phone.strip(),
        "line1": parsed["line1"],
        "city": parsed["city"],
        "state": parsed["state"],
        "country": parsed["country"],
        "zip": parsed["zip"],
        "is_residential": True,
    }

    result = await _request("POST", "/addresses", secret, json_body=payload)
    data = result.get("data") or {}

    address_id = str(data.get("address_id") or data.get("id") or "").strip()
    if not address_id:
        raise ShippingError(
            "The shipping provider could not verify this delivery address. "
            "Please check the address and try again."
        )

    formatted = data.get("formatted_address") or ", ".join(
        p for p in [parsed["line1"], parsed["city"], parsed["state"], parsed["country"]] if p
    )

    return {
        "address_code": address_id,
        "formatted_address": formatted,
        "country": data.get("country") or parsed["country"],
        "country_code": data.get("country") or parsed["country"],
        "city": data.get("city") or parsed["city"],
        "state": data.get("state") or parsed["state"],
        "postal_code": data.get("zip") or parsed["zip"],
    }


async def _create_parcel(
    secret: str,
    packaging_id: str,
    package_items: list[dict[str, Any]],
) -> str:
    items = []
    for item in package_items:
        try:
            weight_f = float(item.get("unit_weight") or item.get("weight") or 1)
        except (TypeError, ValueError):
            weight_f = 1.0
        try:
            value_f = float(item.get("unit_amount") or item.get("value") or 1000)
        except (TypeError, ValueError):
            value_f = 1000.0

        items.append({
            "name": str(item.get("name") or "Artwork")[:120],
            "description": str(item.get("description") or item.get("name") or "Artwork")[:250],
            "weight": max(weight_f, 0.1),
            "quantity": int(item.get("quantity") or 1),
            "value": max(value_f, 1),
            "currency": "NGN",
        })

    if not items:
        raise ShippingError("There are no package items to ship.")

    total_weight = sum(i["weight"] * i["quantity"] for i in items)

    result = await _request(
        "POST",
        "/parcels",
        secret,
        json_body={
            "description": "TboyArts artwork shipment",
            "items": items,
            "packaging": packaging_id,
            "weight_unit": "kg",
            "weight": round(total_weight, 3),
        },
    )
    data = result.get("data") or {}
    parcel_id = str(data.get("parcel_id") or data.get("id") or "").strip()
    if not parcel_id:
        raise ShippingError("Unable to create parcel for shipping rates.")
    return parcel_id


async def fetch_shipping_rates(
    *,
    receiver_address_code: str | int,
    package_items: list[dict[str, Any]],
    package_dimension: dict[str, int],
    delivery_instructions: str = "",
) -> dict[str, Any]:
    secret = _secret_key()
    pickup_id = await _get_pickup_address_id(secret)
    packaging_id = await _get_packaging_id(secret)

    delivery_id = str(receiver_address_code).strip()
    if not delivery_id:
        raise ShippingError("A valid delivery address is required.")

    if not package_items:
        raise ShippingError("There are no package items to ship.")

    parcel_id = await _create_parcel(secret, packaging_id, package_items)

    result = await _request(
        "GET",
        "/rates/shipment",
        secret,
        params={
            "pickup_address": pickup_id,
            "delivery_address": delivery_id,
            "parcel_id": parcel_id,
            "currency": "NGN",
        },
    )

    rates = result.get("data")
    if not isinstance(rates, list) or not rates:
        raise ShippingError("No valid shipping quotes were returned.")

    safe_couriers = []
    request_token = ""

    for rate in rates:
        if not isinstance(rate, dict):
            continue

        rate_id = str(rate.get("rate_id") or rate.get("id") or "").strip()
        carrier_name = str(rate.get("carrier_name") or "").strip()
        carrier_slug = str(
            rate.get("carrier_slug")
            or rate.get("carrier_reference")
            or rate.get("carrier_id")
            or rate_id
        ).strip()

        if not rate_id or not carrier_name:
            continue

        try:
            amount_decimal = Decimal(str(rate.get("amount")))
        except (InvalidOperation, TypeError, ValueError):
            continue

        if not amount_decimal.is_finite() or amount_decimal < 0:
            continue

        currency = str(rate.get("currency") or "NGN").strip().upper()
        if len(currency) != 3 or not currency.isalpha():
            currency = "NGN"

        if not request_token:
            request_token = rate_id

        safe_couriers.append({
            "courier_id": carrier_slug[:100],
            "courier_name": carrier_name[:150],
            "service_code": rate_id[:100],
            "service_type": str(rate.get("type") or rate.get("cargo_type") or "")[:100],
            "rate_card_amount": float(amount_decimal),
            "currency": currency,
            "pickup_eta": rate.get("pickup_time") or rate.get("pickup_eta"),
            "delivery_eta": rate.get("delivery_time") or rate.get("delivery_eta"),
            "tracking_level": "",
        })

    if not safe_couriers:
        raise ShippingError("No usable shipping quotes were returned.")

    return {
        "request_token": request_token or "terminal",
        "couriers": safe_couriers,
        "delivery_instructions": delivery_instructions.strip()[:500],
    }
