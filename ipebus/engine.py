from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Dict, List, Optional


MAX_COLLISIONS = 3
MAX_RUNOVERS = 3
MAX_PASSENGER_SATISFACTION = 100
MIN_PASSENGER_SATISFACTION = 0


@dataclass
class TrafficLight:
    position: float
    state: str  # red | green


@dataclass
class Curve:
    position: float
    safe_speed: float


@dataclass
class Stop:
    stop_id: str
    position: float
    kind: str  # boarding | dropoff | both
    mandatory: bool = True


@dataclass
class Passenger:
    destination_stop_id: str
    fare: float
    satisfaction: int = MAX_PASSENGER_SATISFACTION


@dataclass
class Bus:
    speed: float = 0.0
    lane: int = 0
    integrity: int = MAX_COLLISIONS
    tires_upgrade: int = 0
    brakes_upgrade: int = 0


@dataclass
class Phase:
    phase_id: int
    length: float
    dominant_obstacle: str
    traffic_lights: List[TrafficLight] = field(default_factory=list)
    stops: List[Stop] = field(default_factory=list)
    curves: List[Curve] = field(default_factory=list)
    bike_lane_enabled: bool = False
    boarding_templates: Dict[str, List[Passenger]] = field(default_factory=dict)
    initial_passengers: List[Passenger] = field(default_factory=list)


class BusGameEngine:
    def __init__(self, phases: Optional[Dict[int, Phase]] = None) -> None:
        self.phases = phases or self.default_phases()
        self.current_phase_id = 1
        self.max_phase_unlocked = 1
        self.bus = Bus()
        self.balance = 0.0
        self.loan_balance = 0.0
        self.position = 0.0
        self.collisions = 0
        self.runovers = 0
        self.infractions = 0
        self.game_over = False
        self.phase_completed = False
        self.end_reason: Optional[str] = None
        self._served_stops: set[str] = set()
        self._active_passengers: List[Passenger] = []
        self._reset_phase_runtime_state()

    def _reset_phase_runtime_state(self) -> None:
        phase = self.current_phase
        self.position = 0.0
        self.bus.speed = 0.0
        self.bus.lane = 0
        self.collisions = 0
        self.runovers = 0
        self.infractions = 0
        self.game_over = False
        self.phase_completed = False
        self.end_reason = None
        self._served_stops = set()
        self._active_passengers = [
            Passenger(
                destination_stop_id=p.destination_stop_id,
                fare=p.fare,
                satisfaction=p.satisfaction,
            )
            for p in phase.initial_passengers
        ]

    @property
    def current_phase(self) -> Phase:
        return self.phases[self.current_phase_id]

    @staticmethod
    def default_phases() -> Dict[int, Phase]:
        return {
            1: Phase(
                phase_id=1,
                length=100,
                dominant_obstacle="semaforos",
                traffic_lights=[TrafficLight(30, "red"), TrafficLight(60, "green"), TrafficLight(85, "red")],
            ),
            2: Phase(phase_id=2, length=120, dominant_obstacle="pedestres"),
            3: Phase(
                phase_id=3,
                length=140,
                dominant_obstacle="paradas",
                stops=[Stop("S3-A", 40, "boarding"), Stop("S3-B", 110, "dropoff")],
                boarding_templates={"S3-A": [Passenger(destination_stop_id="S3-B", fare=12.0)]},
            ),
            4: Phase(
                phase_id=4,
                length=150,
                dominant_obstacle="ciclovia",
                bike_lane_enabled=True,
                stops=[Stop("S4-A", 60, "boarding")],
                boarding_templates={"S4-A": [Passenger(destination_stop_id="S4-A", fare=8.0)]},
            ),
            5: Phase(phase_id=5, length=170, dominant_obstacle="trafego-pesado"),
            6: Phase(
                phase_id=6,
                length=180,
                dominant_obstacle="curvas-fechadas",
                curves=[Curve(90, safe_speed=4.0), Curve(130, safe_speed=3.5)],
            ),
            7: Phase(
                phase_id=7,
                length=180,
                dominant_obstacle="desembarques",
                stops=[Stop("S7-DROP", 120, "dropoff")],
                initial_passengers=[Passenger(destination_stop_id="S7-DROP", fare=20.0)],
            ),
            8: Phase(
                phase_id=8,
                length=220,
                dominant_obstacle="final-combinado",
                bike_lane_enabled=True,
                traffic_lights=[TrafficLight(40, "green"), TrafficLight(150, "red")],
                curves=[Curve(180, safe_speed=3.0)],
                stops=[Stop("S8-A", 70, "boarding"), Stop("S8-B", 200, "dropoff")],
                boarding_templates={"S8-A": [Passenger(destination_stop_id="S8-B", fare=25.0)]},
            ),
        }

    def command(self, action: str, intensity: float = 1.0) -> None:
        if self.game_over or self.phase_completed:
            return

        prev_speed = self.bus.speed
        if action == "accelerate":
            self.bus.speed += max(0.0, intensity)
        elif action == "brake":
            braking_power = intensity * (1 + (self.bus.brakes_upgrade * 0.25))
            self.bus.speed = max(0.0, self.bus.speed - braking_power)
        elif action == "left":
            self.bus.lane = max(-1, self.bus.lane - 1)
        elif action == "right":
            self.bus.lane = min(1, self.bus.lane + 1)
        elif action == "stop":
            self.bus.speed = 0.0
        elif action == "service_stop":
            self.service_stop()
        else:
            raise ValueError(f"Unknown action: {action}")

        self._update_passenger_comfort(action, prev_speed)
        self._advance_and_validate()

    def _update_passenger_comfort(self, action: str, prev_speed: float) -> None:
        if not self._active_passengers:
            return
        if action in {"left", "right"} and self.bus.speed > 4:
            self._apply_satisfaction_delta(-10)
        if action == "brake" and (prev_speed - self.bus.speed) >= 2:
            self._apply_satisfaction_delta(-15)

    def _apply_satisfaction_delta(self, delta: int) -> None:
        for passenger in self._active_passengers:
            passenger.satisfaction = min(
                MAX_PASSENGER_SATISFACTION,
                max(MIN_PASSENGER_SATISFACTION, passenger.satisfaction + delta),
            )

    def _advance_and_validate(self) -> None:
        previous_position = self.position
        self.position += self.bus.speed

        self._check_traffic_lights(previous_position)
        self._check_missed_stops(previous_position)
        self._check_curves(previous_position)

        if self.position >= self.current_phase.length and not self.game_over:
            if any(passenger.satisfaction <= 0 for passenger in self._active_passengers):
                self._end_game("passenger_satisfaction_zero")
                return
            self.phase_completed = True
            self.max_phase_unlocked = min(8, max(self.max_phase_unlocked, self.current_phase_id + 1))

    def _check_traffic_lights(self, previous_position: float) -> None:
        for light in self.current_phase.traffic_lights:
            crossed = previous_position < light.position <= self.position
            if crossed and light.state == "red":
                self.infractions += 1
                self.register_collision("red_light_infraction")

    def _check_missed_stops(self, previous_position: float) -> None:
        for stop in self.current_phase.stops:
            if not stop.mandatory or stop.stop_id in self._served_stops:
                continue
            if previous_position < (stop.position - 1.0) and self.position > (stop.position + 1.0):
                self._end_game("missed_mandatory_stop")
                return

    def _check_curves(self, previous_position: float) -> None:
        tire_bonus = self.bus.tires_upgrade * 0.5
        for curve in self.current_phase.curves:
            crossed = previous_position < curve.position <= self.position
            if crossed and self.bus.speed > (curve.safe_speed + tire_bonus):
                self.register_collision("curve_skid")

    def service_stop(self) -> bool:
        if self.bus.speed != 0:
            return False
        current = self._current_stop()
        if not current:
            return False
        if current.stop_id in self._served_stops:
            return False

        self._served_stops.add(current.stop_id)

        if current.kind in {"boarding", "both"}:
            for template in self.current_phase.boarding_templates.get(current.stop_id, []):
                self._active_passengers.append(
                    Passenger(destination_stop_id=template.destination_stop_id, fare=template.fare)
                )
        if current.kind in {"dropoff", "both"}:
            remaining: List[Passenger] = []
            for passenger in self._active_passengers:
                if passenger.destination_stop_id == current.stop_id:
                    self.balance += passenger.fare
                else:
                    remaining.append(passenger)
            self._active_passengers = remaining

        return True

    def _current_stop(self) -> Optional[Stop]:
        for stop in self.current_phase.stops:
            if abs(self.position - stop.position) <= 1.0:
                return stop
        return None

    def set_traffic_light_state(self, light_index: int, state: str) -> None:
        self.current_phase.traffic_lights[light_index].state = state

    def collide_with(self, obstacle_type: str) -> None:
        if obstacle_type in {"pedestrian", "cyclist"}:
            self.runovers += 1
            if self.runovers >= MAX_RUNOVERS:
                self._end_game("runover_limit_reached")
        else:
            self.register_collision(f"collision_{obstacle_type}")

    def invade_bike_lane(self, cyclist_present: bool) -> None:
        if self.current_phase.bike_lane_enabled and cyclist_present:
            self.collide_with("cyclist")

    def register_collision(self, reason: str) -> None:
        self.collisions += 1
        self.bus.integrity = max(0, self.bus.integrity - 1)
        if self.collisions >= MAX_COLLISIONS:
            self._end_game(reason)

    def _end_game(self, reason: str) -> None:
        self.game_over = True
        self.end_reason = reason

    def next_phase(self) -> bool:
        if not self.phase_completed:
            return False
        if self.current_phase_id >= 8:
            return False
        self.current_phase_id += 1
        self._reset_phase_runtime_state()
        return True

    def garage(self, repair: bool = True, upgrade_tires: bool = False, upgrade_brakes: bool = False) -> None:
        if repair and self.bus.integrity < MAX_COLLISIONS:
            repair_cost = (MAX_COLLISIONS - self.bus.integrity) * 20
            if self.balance < repair_cost:
                loan = repair_cost - self.balance
                self.loan_balance += loan
                self.balance += loan
            self.balance -= repair_cost
            self.bus.integrity = MAX_COLLISIONS

        if upgrade_tires and self.balance >= 50:
            self.balance -= 50
            self.bus.tires_upgrade += 1

        if upgrade_brakes and self.balance >= 50:
            self.balance -= 50
            self.bus.brakes_upgrade += 1

    def save_progress(self, path: str) -> None:
        payload = {
            "current_phase_id": self.current_phase_id,
            "max_phase_unlocked": self.max_phase_unlocked,
            "balance": self.balance,
            "loan_balance": self.loan_balance,
            "bus": asdict(self.bus),
        }
        Path(path).write_text(json.dumps(payload), encoding="utf-8")

    def load_progress(self, path: str) -> None:
        payload = json.loads(Path(path).read_text(encoding="utf-8"))
        self.current_phase_id = int(payload["current_phase_id"])
        self.max_phase_unlocked = int(payload["max_phase_unlocked"])
        self.balance = float(payload["balance"])
        self.loan_balance = float(payload.get("loan_balance", 0.0))
        self.bus = Bus(**payload["bus"])
        self._reset_phase_runtime_state()
