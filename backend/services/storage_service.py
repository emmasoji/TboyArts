import os
from typing import Any

import requests
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

STORAGE_BUCKET = "artworks"

LOGO_BUCKET = "Logo"
LOGO_PATH = "logo.png"

WELCOME_NEWSLETTER_BUCKET = "Newsletter"
WELCOME_NEWSLETTER_PATH = "welcome-newsletter.md"

STORAGE_LIMIT_BYTES = int(
    os.getenv(
        "STORAGE_LIMIT_BYTES",
        str(500 * 1024 * 1024),
    )
)


def _headers() -> dict[str, str]:
    if not SUPABASE_SERVICE_ROLE_KEY:
        raise RuntimeError(
            "SUPABASE_SERVICE_ROLE_KEY is not configured"
        )

    return {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    }


def _storage_headers(
    content_type: str | None = None,
    upsert: bool = False,
) -> dict[str, str]:
    headers = {
        **_headers(),
    }

    if content_type:
        headers["Content-Type"] = content_type

    if upsert:
        headers["x-upsert"] = "true"

    return headers


def _list_files(prefix: str = "") -> list[dict[str, Any]]:
    if not SUPABASE_URL:
        raise RuntimeError("SUPABASE_URL is not configured")

    url = (
        f"{SUPABASE_URL}/storage/v1/object/list/"
        f"{STORAGE_BUCKET}"
    )

    response = requests.post(
        url,
        headers={
            **_headers(),
            "Content-Type": "application/json",
        },
        json={
            "prefix": prefix,
            "limit": 1000,
            "offset": 0,
            "sortBy": {
                "column": "name",
                "order": "asc",
            },
        },
        timeout=20,
    )

    if not response.ok:
        raise RuntimeError(
            f"Supabase Storage list failed: {response.text}"
        )

    return response.json()


def _get_storage_usage(prefix: str = "") -> tuple[int, int]:
    files = _list_files(prefix)

    file_count = 0
    used_bytes = 0

    for item in files:
        name = item.get("name")

        if not name:
            continue

        metadata = item.get("metadata") or {}
        size = metadata.get("size")

        if size is not None:
            try:
                used_bytes += int(size)
                file_count += 1
            except (TypeError, ValueError):
                pass

        if metadata == {}:
            nested_count, nested_bytes = _get_storage_usage(
                f"{prefix}{name}/"
            )

            file_count += nested_count
            used_bytes += nested_bytes

    return file_count, used_bytes


def get_storage_usage() -> dict[str, Any]:
    file_count, used_bytes = _get_storage_usage()

    available_bytes = max(
        STORAGE_LIMIT_BYTES - used_bytes,
        0,
    )

    usage_percentage = (
        (used_bytes / STORAGE_LIMIT_BYTES) * 100
        if STORAGE_LIMIT_BYTES > 0
        else 0
    )

    return {
        "bucket": STORAGE_BUCKET,
        "fileCount": file_count,
        "usedBytes": used_bytes,
        "limitBytes": STORAGE_LIMIT_BYTES,
        "availableBytes": available_bytes,
        "usagePercentage": round(
            usage_percentage,
            2,
        ),
    }


def upload_logo(
    file_bytes: bytes,
    content_type: str = "image/png",
) -> dict[str, Any]:
    if not SUPABASE_URL:
        raise RuntimeError("SUPABASE_URL is not configured")

    url = (
        f"{SUPABASE_URL}/storage/v1/object/"
        f"{LOGO_BUCKET}/{LOGO_PATH}"
    )

    response = requests.post(
        url,
        headers=_storage_headers(
            content_type=content_type,
            upsert=True,
        ),
        data=file_bytes,
        timeout=30,
    )

    if not response.ok:
        raise RuntimeError(
            f"Logo upload failed: {response.text}"
        )

    return {
        "success": True,
        "bucket": LOGO_BUCKET,
        "path": LOGO_PATH,
        "url": (
            f"{SUPABASE_URL}/storage/v1/object/public/"
            f"{LOGO_BUCKET}/{LOGO_PATH}"
        ),
    }


def logo_exists() -> bool:
    if not SUPABASE_URL:
        return False

    url = (
        f"{SUPABASE_URL}/storage/v1/object/"
        f"{LOGO_BUCKET}/{LOGO_PATH}"
    )

    response = requests.head(
        url,
        headers=_headers(),
        timeout=20,
    )

    return response.ok


def upload_welcome_newsletter(
    file_bytes: bytes,
) -> dict[str, Any]:
    if not SUPABASE_URL:
        raise RuntimeError("SUPABASE_URL is not configured")

    url = (
        f"{SUPABASE_URL}/storage/v1/object/"
        f"{WELCOME_NEWSLETTER_BUCKET}/"
        f"{WELCOME_NEWSLETTER_PATH}"
    )

    response = requests.post(
        url,
        headers=_storage_headers(
            content_type="text/markdown; charset=utf-8",
            upsert=True,
        ),
        data=file_bytes,
        timeout=30,
    )

    if not response.ok:
        raise RuntimeError(
            "Welcome newsletter upload failed: "
            f"{response.text}"
        )

    return {
        "success": True,
        "bucket": WELCOME_NEWSLETTER_BUCKET,
        "path": WELCOME_NEWSLETTER_PATH,
    }


def delete_welcome_newsletter() -> dict[str, Any]:
    if not SUPABASE_URL:
        raise RuntimeError("SUPABASE_URL is not configured")

    url = (
        f"{SUPABASE_URL}/storage/v1/object/remove"
    )

    response = requests.post(
        url,
        headers={
            **_headers(),
            "Content-Type": "application/json",
        },
        json={
            "bucketId": WELCOME_NEWSLETTER_BUCKET,
            "prefixes": [WELCOME_NEWSLETTER_PATH],
        },
        timeout=30,
    )

    if not response.ok:
        raise RuntimeError(
            "Welcome newsletter deletion failed: "
            f"{response.text}"
        )

    return {
        "success": True,
        "deleted": True,
        "bucket": WELCOME_NEWSLETTER_BUCKET,
        "path": WELCOME_NEWSLETTER_PATH,
    }


def get_welcome_newsletter_markdown() -> str | None:
    if not SUPABASE_URL:
        return None

    url = (
        f"{SUPABASE_URL}/storage/v1/object/"
        f"{WELCOME_NEWSLETTER_BUCKET}/"
        f"{WELCOME_NEWSLETTER_PATH}"
    )

    response = requests.get(
        url,
        headers=_headers(),
        timeout=20,
    )

    if response.status_code == 404:
        return None

    if not response.ok:
        raise RuntimeError(
            "Welcome newsletter download failed: "
            f"{response.text}"
        )

    return response.content.decode(
        "utf-8",
        errors="replace",
    )


def welcome_newsletter_exists() -> bool:
    if not SUPABASE_URL:
        return False

    url = (
        f"{SUPABASE_URL}/storage/v1/object/"
        f"{WELCOME_NEWSLETTER_BUCKET}/"
        f"{WELCOME_NEWSLETTER_PATH}"
    )

    response = requests.head(
        url,
        headers=_headers(),
        timeout=20,
    )

    return response.ok
