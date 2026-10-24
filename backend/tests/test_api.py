"""
API integration tests for TrafficFlow FastAPI endpoints.
Tests health check, state, start/pause/reset, stepping, and validation error handling.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.simulation import simulation


@pytest.fixture(autouse=True)
def reset_shared_simulation():
    """Reset the shared in-memory simulation instance before and after each test."""
    simulation.reset()
    simulation.set_strategy("fixed", fixed_duration=5, min_green=3, max_green=10)
    simulation.set_traffic(north=1, south=1, east=1, west=1)
    yield
    simulation.reset()


@pytest.fixture
def client():
    """Create FastAPI test client."""
    return TestClient(app)


def test_health_endpoint(client):
    """Test GET /api/health returns 200 with status ok."""
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_initial_state_endpoint(client):
    """Test GET /api/simulation/state returns complete initial structure."""
    response = client.get("/api/simulation/state")
    assert response.status_code == 200
    data = response.json()

    assert data["is_running"] is False
    assert data["tick_count"] == 0
    assert data["current_phase"] == "NS"
    assert data["queues"] == {"north": 0, "south": 0, "east": 0, "west": 0}
    assert "traffic_state" in data
    assert "strategy_config" in data


def test_start_pause_reset_lifecycle(client):
    """Test start, pause, and reset endpoints."""
    # 1. Start
    res_start = client.post("/api/simulation/start")
    assert res_start.status_code == 200
    assert res_start.json()["is_running"] is True

    # 2. Step 1 tick
    res_step = client.post("/api/simulation/step")
    assert res_step.status_code == 200
    assert res_step.json()["tick_count"] == 1

    # 3. Pause
    res_pause = client.post("/api/simulation/pause")
    assert res_pause.status_code == 200
    assert res_pause.json()["is_running"] is False

    # 4. Step while paused does not advance
    res_step_paused = client.post("/api/simulation/step")
    assert res_step_paused.status_code == 200
    assert res_step_paused.json()["tick_count"] == 1

    # 5. Reset
    res_reset = client.post("/api/simulation/reset")
    assert res_reset.status_code == 200
    reset_data = res_reset.json()
    assert reset_data["is_running"] is False
    assert reset_data["tick_count"] == 0
    assert reset_data["total_vehicles_passed"] == 0


def test_traffic_configuration_and_queuing(client):
    """Test updating traffic arrival rates and verifying queue accumulation."""
    traffic_payload = {"north": 4, "south": 2, "east": 3, "west": 1}
    res_traffic = client.post("/api/simulation/traffic", json=traffic_payload)
    assert res_traffic.status_code == 200
    assert res_traffic.json()["arrival_rates"] == traffic_payload

    # Start and step once
    client.post("/api/simulation/start")
    res_step = client.post("/api/simulation/step")
    state = res_step.json()

    # Green is NS: North (4 arrived, 2 passed -> 2 remain), South (2 arrived, 2 passed -> 0 remain)
    # Red is EW: East (3 arrived, 0 passed -> 3 remain), West (1 arrived, 0 passed -> 1 remain)
    assert state["queues"]["north"] == 2
    assert state["queues"]["south"] == 0
    assert state["queues"]["east"] == 3
    assert state["queues"]["west"] == 1
    assert state["total_vehicles_passed"] == 4


def test_traffic_validation_out_of_range(client):
    """Test validation errors for traffic arrival rates (< 0, > 5, or invalid types)."""
    # Negative rate
    res_neg = client.post("/api/simulation/traffic", json={"north": -1, "south": 2, "east": 2, "west": 2})
    assert res_neg.status_code == 422

    # Rate above 5
    res_over = client.post("/api/simulation/traffic", json={"north": 6, "south": 2, "east": 2, "west": 2})
    assert res_over.status_code == 422

    # Non-integer rate
    res_str = client.post("/api/simulation/traffic", json={"north": "high", "south": 2, "east": 2, "west": 2})
    assert res_str.status_code == 422


def test_strategy_configuration_fixed_and_adaptive(client):
    """Test setting fixed and adaptive strategies with valid configurations."""
    # Set fixed strategy
    res_fixed = client.post(
        "/api/simulation/strategy",
        json={"strategy": "fixed", "fixed_duration": 4},
    )
    assert res_fixed.status_code == 200
    assert res_fixed.json()["strategy"] == "fixed"
    assert res_fixed.json()["strategy_config"]["fixed_duration"] == 4

    # Set adaptive strategy
    res_adaptive = client.post(
        "/api/simulation/strategy",
        json={"strategy": "adaptive", "min_green": 2, "max_green": 8},
    )
    assert res_adaptive.status_code == 200
    assert res_adaptive.json()["strategy"] == "adaptive"
    assert res_adaptive.json()["strategy_config"]["min_green"] == 2
    assert res_adaptive.json()["strategy_config"]["max_green"] == 8


def test_strategy_validation_invalid_values(client):
    """Test rejection of invalid strategy values and duration constraints."""
    # Invalid strategy name
    res_invalid_name = client.post(
        "/api/simulation/strategy",
        json={"strategy": "random_strategy"},
    )
    assert res_invalid_name.status_code == 422

    # min_green > max_green
    res_invalid_durations = client.post(
        "/api/simulation/strategy",
        json={"strategy": "adaptive", "min_green": 10, "max_green": 3},
    )
    assert res_invalid_durations.status_code == 422


def test_adaptive_strategy_via_api(client):
    """Test adaptive strategy execution through API: green limits and fair rotation."""
    # Configure adaptive strategy: min_green=2, max_green=4
    client.post(
        "/api/simulation/strategy",
        json={"strategy": "adaptive", "min_green": 2, "max_green": 4},
    )
    # Heavy demand on NS, lighter on EW
    client.post(
        "/api/simulation/traffic",
        json={"north": 5, "south": 5, "east": 1, "west": 1},
    )
    client.post("/api/simulation/start")

    # Ticks 1 to 4 should stay NS
    for tick in range(1, 5):
        res = client.post("/api/simulation/step")
        assert res.json()["current_phase"] == "NS"
        assert res.json()["phase_duration"] == tick

    # Tick 5: max_green reached, forces switch to EW for fair rotation
    res_switched = client.post("/api/simulation/step")
    data = res_switched.json()
    assert data["current_phase"] == "EW"
    assert data["phase_duration"] == 1
    assert data["traffic_state"]["east"] == "green"
    assert data["traffic_state"]["west"] == "green"
