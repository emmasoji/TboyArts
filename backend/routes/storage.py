from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
)

from services.admin_auth_service import (
    require_authenticated_admin,
)

from services.storage_service import (
    delete_welcome_newsletter,
    get_storage_usage,
    get_welcome_newsletter_markdown,
    logo_exists,
    upload_logo,
    upload_welcome_newsletter,
)


router = APIRouter(
    prefix="/api/admin/storage",
    tags=["Admin Storage"],
)


# ============================================================
# STORAGE USAGE
# ============================================================

@router.get("/usage")
async def storage_usage(
    _user: dict = Depends(require_authenticated_admin),
):
    try:
        data = get_storage_usage()

        return {
            "success": True,
            **data,
        }

    except Exception as exc:
        return {
            "success": False,
            "message": str(exc),
        }


# ============================================================
# BRAND LOGO
# ============================================================

@router.get("/logo")
async def get_logo(
    _user: dict = Depends(require_authenticated_admin),
):
    exists = logo_exists()

    return {
        "exists": exists,
        "bucket": "Logo",
        "path": "logo.png",
    }


@router.post("/logo")
async def update_logo(
    file: UploadFile = File(...),
    _user: dict = Depends(require_authenticated_admin),
):
    content_type = file.content_type or ""

    if content_type not in {
        "image/png",
        "image/jpeg",
        "image/webp",
    }:
        raise HTTPException(
            status_code=400,
            detail="Logo must be a PNG, JPEG, or WebP image.",
        )

    data = await file.read()

    if not data:
        raise HTTPException(
            status_code=400,
            detail="The uploaded logo is empty.",
        )

    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Logo must be smaller than 5 MB.",
        )

    try:
        result = upload_logo(data, content_type=content_type)

        return result

    except Exception as exc:
        print("ADMIN LOGO UPLOAD ERROR:", exc)

        raise HTTPException(
            status_code=500,
            detail="Unable to update logo.",
        ) from exc


@router.get("/welcome-newsletter")
async def get_welcome_newsletter_file(
    _user: dict = Depends(require_authenticated_admin),
):
    try:
        markdown = get_welcome_newsletter_markdown()

        return {
            "exists": markdown is not None,
            "fileName": (
                "welcome-newsletter.md"
                if markdown is not None
                else None
            ),
            "markdown": markdown,
        }

    except Exception as exc:
        error_text = str(exc)

        # A missing Storage object simply means that no
        # welcome newsletter Markdown file is uploaded.
        if (
            "NoSuchKey" in error_text
            or '"statusCode":"404"' in error_text
            or "Object not found" in error_text
        ):
            return {
                "exists": False,
                "fileName": None,
                "markdown": None,
            }

        print(
            "WELCOME NEWSLETTER READ ERROR:",
            exc,
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to read welcome newsletter.",
        ) from exc


@router.post("/welcome-newsletter")
async def upload_welcome_newsletter_file(
    file: UploadFile = File(...),
    _user: dict = Depends(require_authenticated_admin),
):
    filename = (file.filename or "").lower()

    if not (
        filename.endswith(".md")
        or filename.endswith(".markdown")
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Welcome newsletter must be "
                "a Markdown (.md) file."
            ),
        )

    data = await file.read()

    if not data:
        raise HTTPException(
            status_code=400,
            detail="The Markdown file is empty.",
        )

    if len(data) > 2 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=(
                "Welcome newsletter must be "
                "smaller than 2 MB."
            ),
        )

    try:
        result = upload_welcome_newsletter(data)

        return result

    except Exception as exc:
        print(
            "WELCOME NEWSLETTER UPLOAD ERROR:",
            exc,
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to save welcome newsletter.",
        ) from exc


@router.delete("/welcome-newsletter")
async def remove_welcome_newsletter(
    _user: dict = Depends(require_authenticated_admin),
):
    try:
        return delete_welcome_newsletter()

    except Exception as exc:
        print(
            "WELCOME NEWSLETTER DELETE ERROR:",
            exc,
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to delete welcome newsletter.",
        ) from exc
