import os
from typing import Any

import httpx
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL:
    raise RuntimeError("SUPABASE_URL is not configured")

if not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY is not configured")


def _headers() -> dict[str, str]:
    return {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
    }


async def select(
    table: str,
    columns: str = "*",
    filters: dict[str, Any] | None = None,
    in_filters: dict[str, list[Any]] | None = None,
) -> list[dict[str, Any]]:
    params: dict[str, str] = {
        "select": columns,
    }

    if filters:
        for column, value in filters.items():
            params[column] = f"eq.{value}"

    if in_filters:
        for column, values in in_filters.items():
            if not values:
                continue

            encoded_values = ",".join(
                str(value) for value in values
            )

            params[column] = f"in.({encoded_values})"

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(
            f"{SUPABASE_URL}/rest/v1/{table}",
            headers=_headers(),
            params=params,
        )

    if response.status_code >= 400:
        raise RuntimeError(
            f"Supabase select failed: {response.text}"
        )

    return response.json()


async def insert(
    table: str,
    data: dict[str, Any] | list[dict[str, Any]],
) -> list[dict[str, Any]]:
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{SUPABASE_URL}/rest/v1/{table}",
            headers={
                **_headers(),
                "Prefer": "return=representation",
            },
            json=data,
        )

    if response.status_code >= 400:
        raise RuntimeError(
            f"Supabase insert failed: {response.text}"
        )

    return response.json()


async def update(
    table: str,
    filters: dict[str, Any],
    data: dict[str, Any],
) -> list[dict[str, Any]]:
    params: dict[str, str] = {}

    for column, value in filters.items():
        params[column] = f"eq.{value}"

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.patch(
            f"{SUPABASE_URL}/rest/v1/{table}",
            headers={
                **_headers(),
                "Prefer": "return=representation",
            },
            params=params,
            json=data,
        )

    if response.status_code >= 400:
        raise RuntimeError(
            f"Supabase update failed: {response.text}"
        )

    return response.json()


async def rpc(
    function: str,
    params: dict[str, Any],
) -> Any:
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{SUPABASE_URL}/rest/v1/rpc/{function}",
            headers=_headers(),
            json=params,
        )

    if response.status_code >= 400:
        raise RuntimeError(
            f"Supabase RPC failed: {response.text}"
        )

    return response.json()
