from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.orders import router as orders_router
from routes.payments import router as payments_router
from routes.storage import router as storage_router
from routes.tracking import router as tracking_router
from routes.newsletter import router as newsletter_router

app = FastAPI(
    title="TboyArts API",
    description="Backend API for the TboyArts art e-commerce platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://tboyarts.netlify.app",
        "https://tboyarts.shop",
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


@app.get("/api/health")
async def health_check():
    return {
        "success": True,
        "message": "TboyArts backend is running",
    }
