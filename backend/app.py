from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from routes.orders import router as orders_router
from utils.rate_limit import limiter
from routes.payments import router as payments_router
from routes.storage import router as storage_router
from routes.tracking import router as tracking_router
from routes.newsletter import router as newsletter_router
from routes.admin_orders import router as admin_orders_router
from routes.currency import router as currency_router

SERVER_STARTED_AT = datetime.now(timezone.utc)

app = FastAPI(
    title="TboyArts API",
    description="Backend API for the TboyArts art e-commerce platform",
    version="1.0.0",
)

app.state.limiter = limiter
app.add_exception_handler(
    RateLimitExceeded,
    _rate_limit_exceeded_handler,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
                "https://tboyarts.netlify.app",
        "https://tboyarts.shop",
        "https://www.tboyarts.shop",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(orders_router)
app.include_router(payments_router)
app.include_router(storage_router)
app.include_router(tracking_router)
app.include_router(newsletter_router)
app.include_router(admin_orders_router)
app.include_router(currency_router)


@app.get("/api/monitor")
async def monitor_check():
    return {
        "success": True,
        "status": "online",
        "started_at": SERVER_STARTED_AT.isoformat(),
        "server_time": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/api/health")
async def health_check():
    return {
        "success": True,
        "message": "TboyArts backend is running",
        "started_at": SERVER_STARTED_AT.isoformat(),
    }
