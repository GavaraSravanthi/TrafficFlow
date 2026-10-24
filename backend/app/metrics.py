"""
Metrics calculation module for TrafficFlow simulation.
Tracks total vehicles passed, cumulative queue-based waiting time, and max observed queue.
"""

from typing import Dict


class MetricsTracker:
    """Calculates and stores traffic flow performance metrics."""

    def __init__(self) -> None:
        self.total_vehicles_passed: int = 0
        self.cumulative_waiting_time: int = 0
        self.max_observed_queue: int = 0

    def update_max_queue(self, queues: Dict[str, int]) -> None:
        """Updates the peak queue length seen across any individual approach."""
        if queues:
            current_max = max(queues.values())
            if current_max > self.max_observed_queue:
                self.max_observed_queue = current_max

    def record_tick(self, queues_after_departure: Dict[str, int], vehicles_passed_this_tick: int) -> None:
        """
        Record traffic progression at the end of a simulation tick:
        - Increment total vehicles passed.
        - Accumulate waiting time: each waiting vehicle in queue incurs 1 tick of waiting time.
        - Track maximum observed queue.
        """
        self.total_vehicles_passed += vehicles_passed_this_tick
        self.cumulative_waiting_time += sum(queues_after_departure.values())
        self.update_max_queue(queues_after_departure)

    def get_average_waiting_time(self) -> float:
        """
        Return the average waiting time per vehicle passed.
        Returns 0.0 if no vehicles have cleared the intersection yet.
        """
        if self.total_vehicles_passed > 0:
            return round(self.cumulative_waiting_time / self.total_vehicles_passed, 2)
        return 0.0

    def reset(self) -> None:
        """Reset all metrics to initial zero values."""
        self.total_vehicles_passed = 0
        self.cumulative_waiting_time = 0
        self.max_observed_queue = 0
