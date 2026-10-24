"""
Traffic signal controller module for TrafficFlow.
Manages signal phases (NS / EW) and switching strategies (Fixed / Adaptive).
"""

from typing import Dict, Literal

PhaseType = Literal["NS", "EW"]
StrategyType = Literal["fixed", "adaptive"]


class SignalController:
    """Controls traffic signal phases, light states, and switching logic."""

    def __init__(
        self,
        strategy: StrategyType = "fixed",
        fixed_duration: int = 5,
        min_green: int = 3,
        max_green: int = 10,
    ) -> None:
        self.strategy: StrategyType = strategy
        self.fixed_duration: int = fixed_duration
        self.min_green: int = min_green
        self.max_green: int = max_green
        self.current_phase: PhaseType = "NS"
        self.phase_duration: int = 0

    def get_traffic_state(self) -> Dict[str, str]:
        """
        Return the light color for each approach based on the current phase:
        - NS: North & South are green, East & West are red.
        - EW: East & West are green, North & South are red.
        """
        if self.current_phase == "NS":
            return {
                "north": "green",
                "south": "green",
                "east": "red",
                "west": "red",
            }
        return {
            "north": "red",
            "south": "red",
            "east": "green",
            "west": "green",
        }

    def is_green(self, approach: str) -> bool:
        """Check if a specific approach currently has a green light."""
        traffic_state = self.get_traffic_state()
        return traffic_state.get(approach.lower()) == "green"

    def reset(self) -> None:
        """Reset signal state back to initial NS phase with 0 duration."""
        self.current_phase = "NS"
        self.phase_duration = 0

    def update(self, queues: Dict[str, int]) -> PhaseType:
        """
        Evaluate and update the signal phase for the active tick.
        Dispatches to fixed or adaptive logic according to configured strategy.
        """
        if self.strategy == "fixed":
            self._update_fixed()
        elif self.strategy == "adaptive":
            self._update_adaptive(queues)
        return self.current_phase

    def _update_fixed(self) -> None:
        """
        Fixed-time strategy:
        Alternates between NS and EW after a configurable fixed green duration.
        """
        if self.phase_duration == 0:
            self.phase_duration = 1
            return

        if self.phase_duration >= self.fixed_duration:
            self.current_phase = "EW" if self.current_phase == "NS" else "NS"
            self.phase_duration = 1
        else:
            self.phase_duration += 1

    def _update_adaptive(self, queues: Dict[str, int]) -> None:
        """
        Adaptive strategy:
        - After a minimum green duration, prioritizes the phase with the larger combined queue.
        - Enforces a maximum green duration to guarantee fair rotation and prevent starvation
          of quieter approaches.
        """
        if self.phase_duration == 0:
            self.phase_duration = 1
            return

        q_ns = queues.get("north", 0) + queues.get("south", 0)
        q_ew = queues.get("east", 0) + queues.get("west", 0)

        current_q = q_ns if self.current_phase == "NS" else q_ew
        other_q = q_ew if self.current_phase == "NS" else q_ns

        # 1. Enforce maximum green duration (prevents starvation, ensures fair rotation)
        if self.phase_duration >= self.max_green:
            self.current_phase = "EW" if self.current_phase == "NS" else "NS"
            self.phase_duration = 1
        # 2. Check if minimum green duration has been reached
        elif self.phase_duration >= self.min_green:
            if other_q > current_q:
                self.current_phase = "EW" if self.current_phase == "NS" else "NS"
                self.phase_duration = 1
            else:
                self.phase_duration += 1
        # 3. Minimum green duration not reached yet; remain in current phase
        else:
            self.phase_duration += 1
