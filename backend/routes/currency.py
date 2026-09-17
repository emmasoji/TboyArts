from fastapi import APIRouter, HTTPException
import httpx

router = APIRouter(prefix="/api/currency", tags=["currency"])


@router.get("/rate")
async def get_currency_rate():
    url = "https://api.frankfurter.dev/v2/providers/cbn/rate/ngn/usd"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)

        if response.status_code >= 400:
            raise HTTPException(
                status_code=502,
                detail="Unable to retrieve exchange rate.",
            )

        data = response.json()
        rate = data.get("rate")

        if not isinstance(rate, (int, float)) or rate <= 0:
            raise HTTPException(
                status_code=502,
                detail="Invalid exchange rate received.",
            )

        return {
            "success": True,
            "base": "NGN",
            "currency": "USD",
            "rate": rate,
            "date": data.get("date"),
        }

    except HTTPException:
        raise
    except Exception as exc:
        print("CURRENCY RATE ERROR:", exc)
        raise HTTPException(
            status_code=502,
            detail="Unable to retrieve exchange rate.",
        ) from exc
