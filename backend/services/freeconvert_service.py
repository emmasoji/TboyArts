import asyncio
import os
from pathlib import Path
from typing import Any

import httpx
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

BASE_URL = "https://api.freeconvert.com/v1"
MAX_INPUT = 15 * 1024 * 1024
MAX_OUTPUT = 25 * 1024 * 1024


class FreeConvertError(Exception):
    pass


def _data(payload: Any) -> dict:
    if not isinstance(payload, dict):
        raise FreeConvertError("Invalid response from FreeConvert.")
    nested = payload.get("data")
    return nested if isinstance(nested, dict) else payload


def _task_id(payload: Any) -> str:
    item = _data(payload)
    task_id = item.get("id") or item.get("task_id")
    if not task_id and isinstance(item.get("result"), dict):
        task_id = item["result"].get("id")
    if not isinstance(task_id, str) or not task_id:
        raise FreeConvertError("FreeConvert did not return a task ID.")
    return task_id


def _error(response: httpx.Response) -> str:
    if response.status_code in (401, 403):
        return "FreeConvert rejected the API key. Check backend/.env."
    if response.status_code == 429:
        return "FreeConvert rate or credit limit reached. Check your account."
    if response.status_code >= 500:
        return "FreeConvert is temporarily unavailable. Try again later."
    return f"FreeConvert request failed (HTTP {response.status_code})."


async def _request(client, method, path, key, **kwargs):
    headers = {
        "Authorization": f"Bearer {key}",
        "Accept": "application/json",
    }
    if "json" in kwargs:
        headers["Content-Type"] = "application/json"

    try:
        response = await client.request(
            method, f"{BASE_URL}{path}", headers=headers, **kwargs
        )
    except httpx.HTTPError as exc:
        raise FreeConvertError(
            "Could not connect to FreeConvert. Try again."
        ) from exc

    if not response.is_success:
        raise FreeConvertError(_error(response))

    try:
        return _data(response.json())
    except ValueError as exc:
        raise FreeConvertError(
            "FreeConvert returned an invalid response."
        ) from exc


async def _wait(client, key, task_id):
    for _ in range(60):
        task = await _request(
            client, "GET", f"/process/tasks/{task_id}", key
        )
        status = str(task.get("status", "")).lower()

        if status == "completed":
            return task

        if status in {"failed", "canceled", "cancelled", "deleted"}:
            raise FreeConvertError(
                "FreeConvert could not process this image. Try another image."
            )

        await asyncio.sleep(1.5)

    raise FreeConvertError("Image conversion took too long. Try again.")


def _find_url(value):
    if isinstance(value, dict):
        for name in ("url", "download_url", "downloadUrl"):
            url = value.get(name)
            if isinstance(url, str) and url.startswith("https://"):
                return url
        for child in value.values():
            found = _find_url(child)
            if found:
                return found
    elif isinstance(value, list):
        for child in value:
            found = _find_url(child)
            if found:
                return found
    return None


async def convert_image_to_webp(image_bytes, filename, content_type):
    key = os.getenv("FREECONVERT_API_KEY", "").strip()
    if not key:
        raise FreeConvertError(
            "FreeConvert is not configured. Check backend/.env."
        )

    if not image_bytes:
        raise FreeConvertError("The uploaded image is empty.")
    if len(image_bytes) > MAX_INPUT:
        raise FreeConvertError("Images must be 15 MB or smaller.")

    suffix = Path(filename or "image").suffix.lower().lstrip(".")
    supported = {"jpg", "jpeg", "png", "webp", "bmp", "avif", "tif", "tiff"}

    if suffix not in supported:
        raise FreeConvertError(
            "Use JPG, PNG, WebP, BMP, AVIF, or TIFF. "
            "Animated GIF and SVG are not supported."
        )

    input_format = "jpg" if suffix in {"jpg", "jpeg"} else suffix
    safe_stem = Path(filename or "image").stem or "image"
    upload_name = f"{safe_stem}.{input_format}"

    async with httpx.AsyncClient(
        timeout=httpx.Timeout(60.0, connect=15.0),
        follow_redirects=True,
    ) as client:
        # Create an upload task.
        imported = await _request(
            client, "POST", "/process/import/upload", key, json={}
        )
        import_id = _task_id(imported)

        form = imported.get("result", {}).get("form", {})
        upload_url = form.get("url")
        parameters = form.get("parameters", {})

        if not isinstance(upload_url, str) or not upload_url.startswith("https://"):
            raise FreeConvertError(
                "FreeConvert did not provide a valid upload destination."
            )

        # Upload the original image to the signed FreeConvert destination.
        try:
            uploaded = await client.post(
                upload_url,
                data={str(k): str(v) for k, v in parameters.items()},
                files={
                    "file": (
                        upload_name,
                        image_bytes,
                        content_type or "application/octet-stream",
                    )
                },
            )
        except httpx.HTTPError as exc:
            raise FreeConvertError(
                "Could not upload the image to FreeConvert."
            ) from exc

        if not uploaded.is_success:
            raise FreeConvertError(
                "FreeConvert could not accept the uploaded image."
            )

        # Convert to WebP with lossy compression.
        converted = await _request(
            client,
            "POST",
            "/process/convert",
            key,
            json={
                "input": import_id,
                "input_format": input_format,
                "output_format": "webp",
                "options": {"webp_quality": 82},
            },
        )
        convert_id = _task_id(converted)
        await _wait(client, key, convert_id)

        # Ask FreeConvert for a downloadable output.
        exported = await _request(
            client,
            "POST",
            "/process/export/url",
            key,
            json={
                "input": [convert_id],
                "filename": f"{safe_stem}.webp",
            },
        )
        export_id = _task_id(exported)
        finished = await _wait(client, key, export_id)

        download_url = _find_url(finished) or _find_url(exported)
        if not download_url:
            raise FreeConvertError(
                "Conversion finished, but no download URL was returned."
            )

        try:
            download = await client.get(download_url)
        except httpx.HTTPError as exc:
            raise FreeConvertError(
                "Could not download the converted image."
            ) from exc

        if not download.is_success:
            raise FreeConvertError(
                "Could not download the converted image."
            )

        output = download.content
        if not output:
            raise FreeConvertError("FreeConvert returned an empty image.")
        if len(output) > MAX_OUTPUT:
            raise FreeConvertError("The converted image is too large.")
        if output[:4] != b"RIFF" or output[8:12] != b"WEBP":
            raise FreeConvertError(
                "FreeConvert did not return a valid WebP image."
            )

        return output
