from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from traffic_agent import analyze_traffic
import uvicorn

# Rate limiter setup
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="RTA UTC-UX Fusion AI Backend")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TrafficState(BaseModel):
    current_green: str
    ns_pressure: float
    ew_pressure: float
    special_vehicles: list[str] = []

@app.get("/")
@limiter.limit("60/minute")
def home(request: Request):
    return {"status": "online", "system": "UTC-UX Fusion AI"}

@app.post("/analyze")
@limiter.limit("30/minute")  # 30 requests per minute per IP
def analyze_traffic_endpoint(request: Request, state: TrafficState):
    """
    Endpoint for the frontend to send traffic state and get AI decision.
    Rate limited to 30 requests/minute per IP address.
    """
    try:
        data = state.model_dump()
        result = analyze_traffic(data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
@limiter.limit("120/minute")
def health_check(request: Request):
    """Health check endpoint for monitoring"""
    return {"status": "healthy", "rate_limits": {"analyze": "30/min", "home": "60/min"}}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
