from fastapi import FastAPI
from pydantic import BaseModel
from datetime import datetime

app = FastAPI(title="SmartVideo Voice", version="0.1.0")


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    provider: str = "modal"


@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(status="ok", service="smartvideo-voice", version="0.1.0", provider="modal")


class TestRequest(BaseModel):
    message: str


@app.post("/test")
async def test_endpoint(payload: TestRequest):
    return {
        "ok": True,
        "received": payload.message,
        "timestamp": datetime.utcnow().isoformat(),
    }


# Modal deployment entrypoint.
# Deploy with: modal deploy services/voice-modal/app.py
try:
    import modal

    modal_app = modal.App("smartvideo-voice")

    @modal_app.function()
    @modal.asgi_app()
    def serve_web():
        return app

except ImportError:
    # Modal SDK is optional for local development/testing.
    pass
