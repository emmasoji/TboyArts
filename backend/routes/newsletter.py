from fastapi import APIRouter, Depends, HTTPException

from models.newsletter import (
    NewsletterSendRequest,
    NewsletterSubscribeRequest,
)
from services.admin_auth_service import require_authenticated_admin
from services.newsletter_service import (
    NewsletterError,
    send_newsletter,
    subscribe_and_send_welcome,
)
from utils.supabase import select, update


router = APIRouter(
    prefix="/api/newsletter",
    tags=["Newsletter"],
)


@router.post("/unsubscribe/{token}")
async def unsubscribe_newsletter_endpoint(token: str):
    token = token.strip()

    if not token:
        raise HTTPException(
            status_code=400,
            detail="Invalid unsubscribe token.",
        )

    try:
        subscribers = await select(
            "newsletter_subscribers",
            columns="id",
            filters={"unsubscribe_token": token},
        )

        if not subscribers:
            raise HTTPException(
                status_code=404,
                detail="Invalid or expired unsubscribe token.",
            )

        await update(
            "newsletter_subscribers",
            {"unsubscribe_token": token},
            {"active": False},
        )

        return {
            "success": True,
            "message": "You have been unsubscribed from marketing emails.",
        }

    except HTTPException:
        raise

    except Exception as exc:
        print("NEWSLETTER UNSUBSCRIBE ERROR:", exc)

        raise HTTPException(
            status_code=500,
            detail="Unable to process unsubscribe request.",
        ) from exc



@router.post("/subscribe")
async def subscribe_newsletter_endpoint(
    request: NewsletterSubscribeRequest,
):
    try:
        result = await subscribe_and_send_welcome(
            request.email
        )

        return {
            "success": True,
            **result,
        }

    except NewsletterError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Newsletter subscription failed: {exc}",
        ) from exc


@router.post("/send")
async def send_newsletter_endpoint(
    request: NewsletterSendRequest,
    _user: dict = Depends(require_authenticated_admin),
):
    try:
        result = await send_newsletter(
            subject=request.subject,
            html=request.html,
            from_email=request.from_email,
            from_name=request.from_name,
        )

        return {
            "success": True,
            **result,
        }

    except NewsletterError as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send newsletter: {exc}",
        ) from exc
