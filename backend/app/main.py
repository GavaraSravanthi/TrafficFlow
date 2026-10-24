"""
FastAPI application for TrafficFlow simulation.
Exposes RESTful endpoints for controlling simulation state, traffic rates, and strategies.
"""

from typing import Any, Dict, Literal, Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, model_validator

from app.simulation import simulation

app = FastAPI(
    title="TrafficFlow: Smart Traffic Simulation API",
    description="Backend API for managing intersection traffic simulation, strategies, and metrics.",
    version="1.0.0",
)

# CORS configuration allowing Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class StrategyRequest(BaseModel):
    """Request model for configuring traffic signal strategy."""

    strategy: Literal["fixed", "adaptive"]
    fixed_duration: Optional[int] = Field(default=None, ge=1, description="Green duration in ticks for fixed strategy")
    min_green: Optional[int] = Field(default=None, ge=1, description="Minimum green duration for adaptive strategy")
    max_green: Optional[int] = Field(default=None, ge=1, description="Maximum green duration for adaptive strategy")

    @model_validator(mode="after")
    def validate_durations(self) -> "StrategyRequest":
        if self.min_green is not None and self.max_green is not None:
            if self.max_green < self.min_green:
                raise ValueError("max_green must be greater than or equal to min_green")
        return self


class TrafficRequest(BaseModel):
    """Request model for configuring vehicle arrival rates (0-5 per approach)."""

    north: int = Field(..., ge=0, le=5, description="Arrival rate for North approach (0-5)")
    south: int = Field(..., ge=0, le=5, description="Arrival rate for South approach (0-5)")
    east: int = Field(..., ge=0, le=5, description="Arrival rate for East approach (0-5)")
    west: int = Field(..., ge=0, le=5, description="Arrival rate for West approach (0-5)")


@app.get("/api/health", tags=["Health"])
def get_health() -> Dict[str, str]:
    """Health check endpoint to verify backend service status."""
    return {"status": "ok"}


@app.get("/api/simulation/state", tags=["Simulation"])
def get_state() -> Dict[str, Any]:
    """Retrieve the full current state of the simulation."""
    return simulation.get_state()


@app.post("/api/simulation/start", tags=["Simulation"])
def start_simulation() -> Dict[str, Any]:
    """Start or resume the simulation."""
    return simulation.start()


@app.post("/api/simulation/pause", tags=["Simulation"])
def pause_simulation() -> Dict[str, Any]:
    """Pause the simulation, preventing tick advancement."""
    return simulation.pause()


@app.post("/api/simulation/reset", tags=["Simulation"])
def reset_simulation() -> Dict[str, Any]:
    """Reset the simulation queues, tick counts, and waiting metrics."""
    return simulation.reset()


@app.post("/api/simulation/step", tags=["Simulation"])
def step_simulation() -> Dict[str, Any]:
    """
    Advance the simulation by exactly one tick if running.
    If paused, returns current state without advancing.
    """
    return simulation.step()


@app.post("/api/simulation/strategy", tags=["Simulation"])
def update_strategy(request: StrategyRequest) -> Dict[str, Any]:
    """Update the traffic signal control strategy (fixed or adaptive)."""
    # Cross-validate with existing parameters if partial update provided
    current_cfg = simulation.controller
    min_g = request.min_green if request.min_green is not None else current_cfg.min_green
    max_g = request.max_green if request.max_green is not None else current_cfg.max_green
    if max_g < min_g:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="max_green must be greater than or equal to min_green",
        )

    return simulation.set_strategy(
        strategy=request.strategy,
        fixed_duration=request.fixed_duration,
        min_green=request.min_green,
        max_green=request.max_green,
    )


@app.post("/api/simulation/traffic", tags=["Simulation"])
def update_traffic(request: TrafficRequest) -> Dict[str, Any]:
    """Update arrival rates for the four intersection approaches."""
    return simulation.set_traffic(
        north=request.north,
        south=request.south,
        east=request.east,
        west=request.west,
    )
