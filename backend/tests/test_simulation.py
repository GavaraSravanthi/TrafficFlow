"""
Unit tests for TrafficFlow simulation engine, signal controller, and metrics.
"""

import pytest
from app.simulation import Simulation, simulation


@pytest.fixture(autouse=True)
def reset_simulation_state():
    """Ensure clean simulation state for every test, independent of execution order."""
    simulation.reset()
    simulation.set_strategy("fixed", fixed_duration=5, min_green=3, max_green=10)
    simulation.set_traffic(north=1, south=1, east=1, west=1)
    yield
    simulation.reset()


def test_initial_simulation_state():
    """Verify that initial simulation state is properly initialized."""
    sim = Simulation()
    state = sim.get_state()

    assert state["is_running"] is False
    assert state["tick_count"] == 0
    assert state["current_phase"] == "NS"
    assert state["phase_duration"] == 0
    assert state["strategy"] == "fixed"
    assert state["traffic_state"] == {
        "north": "green",
        "south": "green",
        "east": "red",
        "west": "red",
    }
    assert state["queues"] == {"north": 0, "south": 0, "east": 0, "west": 0}
    assert state["total_vehicles_passed"] == 0
    assert state["cumulative_waiting_time"] == 0
    assert state["average_waiting_time"] == 0.0
    assert state["max_queue_length"] == 0


def test_start_pause_and_reset_behavior():
    """Verify start, pause, and reset semantics."""
    # Starting does not reset or advance
    state = simulation.start()
    assert state["is_running"] is True
    assert state["tick_count"] == 0

    # Step advances by 1
    state = simulation.step()
    assert state["tick_count"] == 1
    assert state["is_running"] is True

    # Pausing prevents advancement
    state = simulation.pause()
    assert state["is_running"] is False
    paused_state = simulation.step()
    assert paused_state["tick_count"] == 1  # Unchanged

    # Resuming does not reset
    resumed_state = simulation.start()
    assert resumed_state["is_running"] is True
    assert resumed_state["tick_count"] == 1

    # Reset clears queues, ticks, and metrics
    reset_state = simulation.reset()
    assert reset_state["is_running"] is False
    assert reset_state["tick_count"] == 0
    assert reset_state["total_vehicles_passed"] == 0
    assert reset_state["cumulative_waiting_time"] == 0
    assert reset_state["max_queue_length"] == 0
    assert reset_state["queues"] == {"north": 0, "south": 0, "east": 0, "west": 0}


def test_vehicles_arrive_and_pass_only_from_green_approaches():
    """
    Verify vehicle arrivals and that vehicles ONLY pass from green approaches
    (up to 2 per green approach) and NEVER from red approaches.
    """
    simulation.set_traffic(north=3, south=3, east=3, west=3)
    simulation.start()

    # Initial phase is NS: North and South are green; East and West are red.
    state = simulation.step()
    assert state["tick_count"] == 1
    assert state["traffic_state"]["north"] == "green"
    assert state["traffic_state"]["south"] == "green"
    assert state["traffic_state"]["east"] == "red"
    assert state["traffic_state"]["west"] == "red"

    # 3 arrived at each approach.
    # Green approaches (N, S): 2 pass, 1 remains.
    # Red approaches (E, W): 0 pass, all 3 remain.
    assert state["queues"]["north"] == 1
    assert state["queues"]["south"] == 1
    assert state["queues"]["east"] == 3
    assert state["queues"]["west"] == 3

    assert state["total_vehicles_passed"] == 4  # 2 from north + 2 from south


def test_fixed_strategy_alternation():
    """Verify fixed strategy alternates between NS and EW after fixed_duration ticks."""
    simulation.set_strategy("fixed", fixed_duration=3)
    simulation.set_traffic(north=1, south=1, east=1, west=1)
    simulation.start()

    # Ticks 1 to 3 should be NS
    for tick in range(1, 4):
        state = simulation.step()
        assert state["current_phase"] == "NS"
        assert state["phase_duration"] == tick

    # Tick 4 switches to EW (phase_duration resets to 1)
    state = simulation.step()
    assert state["current_phase"] == "EW"
    assert state["phase_duration"] == 1

    # Ticks 5 and 6 remain EW
    state = simulation.step()
    assert state["current_phase"] == "EW"
    assert state["phase_duration"] == 2

    state = simulation.step()
    assert state["current_phase"] == "EW"
    assert state["phase_duration"] == 3

    # Tick 7 switches back to NS
    state = simulation.step()
    assert state["current_phase"] == "NS"
    assert state["phase_duration"] == 1


def test_adaptive_strategy_respects_minimum_green():
    """
    Verify adaptive strategy does not switch before min_green ticks,
    even if opposing queue is significantly larger.
    """
    # min_green = 3, max_green = 6
    simulation.set_strategy("adaptive", min_green=3, max_green=6)
    # Heavy demand on EW (5 each), zero demand on NS
    simulation.set_traffic(north=0, south=0, east=5, west=5)
    simulation.start()

    # Ticks 1, 2, 3 must stay NS due to min_green = 3
    for tick in range(1, 4):
        state = simulation.step()
        assert state["current_phase"] == "NS", f"Tick {tick} should stay NS due to min_green"
        assert state["phase_duration"] == tick

    # Tick 4: min_green has elapsed and EW combined queue (40) > NS (0)
    state = simulation.step()
    assert state["current_phase"] == "EW"
    assert state["phase_duration"] == 1


def test_adaptive_strategy_maximum_green_and_starvation_prevention():
    """
    Verify adaptive strategy enforces max_green to rotate fairly and
    prevent starving a quieter phase under persistent heavy traffic.
    """
    # min_green = 2, max_green = 4
    simulation.set_strategy("adaptive", min_green=2, max_green=4)
    # Heavy traffic on NS (5 each = 10/tick), quiet traffic on EW (1 east, 0 west = 1/tick)
    simulation.set_traffic(north=5, south=5, east=1, west=0)
    simulation.start()

    # Ticks 1 to 4: NS is green because NS queue is much larger
    for tick in range(1, 5):
        state = simulation.step()
        assert state["current_phase"] == "NS"
        assert state["phase_duration"] == tick

    # Tick 5: max_green (4) reached. Must switch to EW to prevent starving the quieter phase!
    state = simulation.step()
    assert state["current_phase"] == "EW"
    assert state["phase_duration"] == 1
    # EW receives green to clear its waiting cars
    assert state["traffic_state"]["east"] == "green"


def test_metrics_calculation_and_peak_queue():
    """Verify cumulative waiting time, average waiting time, and peak queue length."""
    # N=2, S=0, E=0, W=0
    # Green is NS. 2 arrive at North, 2 pass North. Remaining queues: all 0.
    simulation.set_traffic(north=2, south=0, east=0, west=0)
    simulation.start()

    state = simulation.step()
    assert state["total_vehicles_passed"] == 2
    assert state["max_queue_length"] == 2  # Observed 2 at arrival
    assert state["cumulative_waiting_time"] == 0  # 0 vehicles left waiting
    assert state["average_waiting_time"] == 0.0

    # Now add traffic on red approach East (3 per tick)
    simulation.set_traffic(north=0, south=0, east=3, west=0)
    state = simulation.step()
    # East has 3 vehicles waiting. None passed.
    assert state["queues"]["east"] == 3
    assert state["max_queue_length"] == 3
    assert state["cumulative_waiting_time"] == 3  # 3 vehicle-ticks waiting
    # Average waiting time: 3 cumulative waiting ticks / 2 total passed = 1.5
    assert state["average_waiting_time"] == 1.5
