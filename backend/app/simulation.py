"""
Simulation state and tick execution engine for TrafficFlow.
Manages intersection queues, deterministic vehicle arrivals, and tick stepping.
"""

from typing import Any, Dict, Optional
from app.signal_controller import SignalController, StrategyType
from app.metrics import MetricsTracker


class Simulation:
    """In-memory 4-way intersection simulation manager."""

    APPROACHES = ("north", "south", "east", "west")

    def __init__(self) -> None:
        self.is_running: bool = False
        self.tick_count: int = 0
        self.queues: Dict[str, int] = {approach: 0 for approach in self.APPROACHES}
        self.arrival_rates: Dict[str, int] = {approach: 1 for approach in self.APPROACHES}
        self.controller: SignalController = SignalController()
        self.metrics: MetricsTracker = MetricsTracker()

    def start(self) -> Dict[str, Any]:
        """Start or resume the simulation without resetting accumulated state."""
        self.is_running = True
        return self.get_state()

    def pause(self) -> Dict[str, Any]:
        """Pause simulation advancement."""
        self.is_running = False
        return self.get_state()

    def reset(self) -> Dict[str, Any]:
        """
        Reset simulation state:
        Clears queues, tick count, controller timing, and waiting metrics.
        Leaves configured arrival rates and strategy settings in place.
        """
        self.is_running = False
        self.tick_count = 0
        self.queues = {approach: 0 for approach in self.APPROACHES}
        self.controller.reset()
        self.metrics.reset()
        return self.get_state()

    def set_strategy(
        self,
        strategy: StrategyType,
        fixed_duration: Optional[int] = None,
        min_green: Optional[int] = None,
        max_green: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Configure the traffic signal strategy and operational parameters."""
        self.controller.strategy = strategy
        if fixed_duration is not None:
            self.controller.fixed_duration = fixed_duration
        if min_green is not None:
            self.controller.min_green = min_green
        if max_green is not None:
            self.controller.max_green = max_green
        return self.get_state()

    def set_traffic(self, north: int, south: int, east: int, west: int) -> Dict[str, Any]:
        """Configure arrival rates for each approach (0 to 5 vehicles per tick)."""
        self.arrival_rates["north"] = north
        self.arrival_rates["south"] = south
        self.arrival_rates["east"] = east
        self.arrival_rates["west"] = west
        return self.get_state()

    def step(self) -> Dict[str, Any]:
        """
        Advance the simulation by exactly one tick if running.
        If paused, returns the current state immediately without advancing.
        """
        if not self.is_running:
            return self.get_state()

        # 1. Deterministic vehicle arrivals
        for approach in self.APPROACHES:
            self.queues[approach] += self.arrival_rates[approach]

        # Record peak queue observation after arrivals
        self.metrics.update_max_queue(self.queues)

        # 2. Update signal phase based on current queues
        self.controller.update(self.queues)

        # 3. Departures: up to 2 vehicles pass from each green approach
        vehicles_passed_this_tick = 0
        for approach in self.APPROACHES:
            if self.controller.is_green(approach):
                passed = min(self.queues[approach], 2)
                self.queues[approach] -= passed
                vehicles_passed_this_tick += passed

        # 4. Increment tick counter
        self.tick_count += 1

        # 5. Record metrics for this tick
        self.metrics.record_tick(self.queues, vehicles_passed_this_tick)

        return self.get_state()

    def get_state(self) -> Dict[str, Any]:
        """Construct the complete, consistent snapshot of the simulation state."""
        return {
            "is_running": self.is_running,
            "tick_count": self.tick_count,
            "current_phase": self.controller.current_phase,
            "phase_duration": self.controller.phase_duration,
            "strategy": self.controller.strategy,
            "traffic_state": self.controller.get_traffic_state(),
            "queues": dict(self.queues),
            "arrival_rates": dict(self.arrival_rates),
            "total_vehicles_passed": self.metrics.total_vehicles_passed,
            "cumulative_waiting_time": self.metrics.cumulative_waiting_time,
            "average_waiting_time": self.metrics.get_average_waiting_time(),
            "max_queue_length": self.metrics.max_observed_queue,
            "strategy_config": {
                "fixed_duration": self.controller.fixed_duration,
                "min_green": self.controller.min_green,
                "max_green": self.controller.max_green,
            },
        }


# Global in-memory simulation instance
simulation = Simulation()
