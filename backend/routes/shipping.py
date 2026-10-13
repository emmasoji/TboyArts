import os
import re
from decimal import Decimal, InvalidOperation
from typing import Any

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field

from services.shipping_service import (
    ShippingError,
    fetch_shipping_rates,
    validate_delivery_address,
)
from utils.rate_limit import limiter
from utils.supabase import select


router = APIRouter(prefix="/api/shipping", tags=["Shipping"])


class AddressValidationRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    phone: str = Field(min_length=7, max_length=30)
    address: str = Field(min_length=5, max_length=250)


class ShippingRateRequest(BaseModel):
    artwork_ids: list[str] = Field(min_length=1, max_length=30)
    receiver_address_code: int = Field(gt=0)
    delivery_instructions: str = Field(default="", max_length=500)


def _positive_decimal(value: Any, field_name: str) -> Decimal:
    try:
        result = Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        raise HTTPException(
            status_code=400,
            detail=f"Artwork {field_name} is missing or invalid.",
        )

    if not result.is_finite() or result <= 0:
        raise HTTPException(
            status_code=400,
            detail=f"Artwork {field_name} must be greater than zero.",
        )

    return result


def _parse_dimensions(value: Any) -> tuple[Decimal, Decimal]:
    """
    Parse dimensions such as '24 × 36 inches' or '60 x 90 cm'.

    Returns the two artwork dimensions in centimetres.
    This does not claim to know the packaged parcel thickness.
    """
    if not isinstance(value, str) or not value.strip():
        raise HTTPException(
            status_code=400,
            detail=(
                "An artwork is missing its dimensions. "
                "Add dimensions in the artwork details before requesting shipping."
            ),
        )

    match = re.fullmatch(
        r"\s*(\d+(?:\.\d+)?)\s*[x×*]\s*"
        r"(\d+(?:\.\d+)?)\s*"
        r"(inches|inch|in|cm|centimetres|centimeters|centimetre|centimeter)?\s*",
        value.strip(),
        flags=re.IGNORECASE,
    )

    if not match:
        raise HTTPException(
            status_code=400,
            detail=(
                "An artwork has dimensions in an unsupported format. "
                "Use a format such as '24 × 36 inches' or '60 × 90 cm'."
            ),
        )

    first = Decimal(match.group(1))
    second = Decimal(match.group(2))
    unit = (match.group(3) or "inches").lower()

    if first <= 0 or second <= 0:
        raise HTTPException(
            status_code=400,
            detail="Artwork dimensions must be greater than zero.",
        )

    if unit in {"inches", "inch", "in"}:
        first *= Decimal("2.54")
        second *= Decimal("2.54")

    return first, second



def _build_package(
    artworks: list[dict[str, Any]],
    requested_ids: list[str],
) -> tuple[list[dict[str, Any]], dict[str, int]]:
    """
    Estimate one shared carton for the requested artworks.

    Dimensions are artwork dimensions plus configurable clearance.
    Artwork, cardboard, and protective-material weights are estimates.
    Each package item receives its artwork estimate plus its share of
    the packaging weight, so the combined weight is not counted twice.
    """
    artwork_map = {
        str(artwork.get("id")): artwork
        for artwork in artworks
    }

    if len(artwork_map) != len(set(requested_ids)):
        raise HTTPException(
            status_code=400,
            detail="One or more requested artworks could not be found.",
        )

    def setting(name: str, default: str, *, allow_zero: bool = False) -> Decimal:
        try:
            value = Decimal(os.getenv(name, default).strip())
        except (InvalidOperation, TypeError, ValueError):
            raise HTTPException(
                status_code=500,
                detail=f"Shipping estimate setting {name} is invalid.",
            )

        if not value.is_finite() or (
            value < 0 if allow_zero else value <= 0
        ):
            raise HTTPException(
                status_code=500,
                detail=f"Shipping estimate setting {name} is invalid.",
            )
        return value

    clearance_cm = setting("SHIPBUBBLE_CARTON_CLEARANCE_CM", "5")
    carton_depth_cm = setting("SHIPBUBBLE_CARTON_DEPTH_CM", "5")
    cardboard_kg_m2 = setting("SHIPBUBBLE_CARDBOARD_KG_PER_M2", "0.5")
    artwork_kg_m2 = setting("SHIPBUBBLE_ARTWORK_KG_PER_M2", "2.0")
    protective_extra_kg = setting(
        "SHIPBUBBLE_PROTECTIVE_EXTRA_KG", "0.15", allow_zero=True
    )

    entries: list[dict[str, Any]] = []
    longest_side = Decimal("0")
    shortest_side = Decimal("0")
    total_artwork_area_m2 = Decimal("0")

    for artwork_id in requested_ids:
        artwork = artwork_map.get(artwork_id)

        if not artwork:
            raise HTTPException(
                status_code=400,
                detail="One or more requested artworks could not be found.",
            )

        status = str(artwork.get("status") or "").lower()
        if status in {"sold", "unavailable", "deleted"}:
            raise HTTPException(
                status_code=400,
                detail=f"Artwork '{artwork.get('title', 'Untitled')}' is unavailable.",
            )

        dimension_a, dimension_b = _parse_dimensions(
            artwork.get("dimensions")
        )
        area_m2 = (dimension_a * dimension_b) / Decimal("10000")

        longest_side = max(longest_side, dimension_a, dimension_b)
        shortest_side = max(
            shortest_side,
            min(dimension_a, dimension_b),
        )
        total_artwork_area_m2 += area_m2

        price = _positive_decimal(artwork.get("price"), "price")
        title = str(artwork.get("title") or "Artwork")

        entries.append({
            "name": title[:100],
            "description": f"Artwork: {title}"[:200],
            "unit_amount": float(price),
            "quantity": 1,
            "_area_m2": area_m2,
        })

    # Add clearance on both sides of the two artwork dimensions.
    # Round dimensions up because couriers quote in whole centimetres.
    carton_length = int(
        (longest_side + clearance_cm * 2).to_integral_value(
            rounding="ROUND_CEILING"
        )
    )
    carton_width = int(
        (shortest_side + clearance_cm * 2).to_integral_value(
            rounding="ROUND_CEILING"
        )
    )
    carton_height = int(
        carton_depth_cm.to_integral_value(rounding="ROUND_CEILING")
    )

    package_dimension = {
        "length": carton_length,
        "width": carton_width,
        "height": carton_height,
    }

    # Surface area of a closed rectangular carton, in square metres.
    length_m = Decimal(carton_length) / Decimal("100")
    width_m = Decimal(carton_width) / Decimal("100")
    height_m = Decimal(carton_height) / Decimal("100")
    carton_area_m2 = Decimal("2") * (
        length_m * width_m
        + length_m * height_m
        + width_m * height_m
    )

    cardboard_weight_kg = carton_area_m2 * cardboard_kg_m2
    total_packaging_weight_kg = cardboard_weight_kg + protective_extra_kg

    # Allocate the estimated packaging weight across the artworks by area.
    # Shipbubble receives each item's estimated weight once.
    for item in entries:
        item_area_m2 = item.pop("_area_m2")
        share = item_area_m2 / total_artwork_area_m2
        artwork_weight_kg = item_area_m2 * artwork_kg_m2
        allocated_packaging_kg = share * total_packaging_weight_kg
        item["unit_weight"] = float(
            (artwork_weight_kg + allocated_packaging_kg).quantize(
                Decimal("0.001")
            )
        )

    return entries, package_dimension


@router.post("/validate-address")
@limiter.limit("10/minute")
async def validate_address_endpoint(
    request: Request,
    address_request: AddressValidationRequest,
):
    try:
        return await validate_delivery_address(
            name=address_request.name,
            email=str(address_request.email),
            phone=address_request.phone,
            address=address_request.address,
        )
    except ShippingError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        print("SHIPPING ADDRESS VALIDATION ERROR:", exc)
        raise HTTPException(
            status_code=500,
            detail="Unable to validate the delivery address.",
        ) from exc


@router.post("/rates")
@limiter.limit("10/minute")
async def shipping_rates_endpoint(
    request: Request,
    rate_request: ShippingRateRequest,
):
    requested_ids = [item.strip() for item in rate_request.artwork_ids]

    if any(not artwork_id for artwork_id in requested_ids):
        raise HTTPException(
            status_code=400,
            detail="Artwork IDs cannot be empty.",
        )

    if len(set(requested_ids)) != len(requested_ids):
        raise HTTPException(
            status_code=400,
            detail="Duplicate artwork IDs are not allowed.",
        )

    try:
        artworks = await select(
            "artworks",
            columns=(
                "id,title,price,status,dimensions,package_weight_kg"
            ),
            in_filters={"id": requested_ids},
        )

        package_items, package_dimension = _build_package(
            artworks,
            requested_ids,
        )

        return await fetch_shipping_rates(
            receiver_address_code=rate_request.receiver_address_code,
            package_items=package_items,
            package_dimension=package_dimension,
            delivery_instructions=rate_request.delivery_instructions,
        )

    except HTTPException:
        raise
    except ShippingError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        print("SHIPPING RATE REQUEST ERROR:", exc)
        raise HTTPException(
            status_code=500,
            detail="Unable to fetch shipping rates.",
        ) from exc
