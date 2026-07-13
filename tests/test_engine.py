import tempfile
import unittest
from pathlib import Path

from ipebus.engine import BusGameEngine, MAX_COLLISIONS


class BusGameEngineTest(unittest.TestCase):
    def test_red_light_generates_infraction_and_collision(self) -> None:
        game = BusGameEngine()
        game.set_traffic_light_state(0, "red")
        game.command("accelerate", 31)

        self.assertEqual(1, game.infractions)
        self.assertEqual(MAX_COLLISIONS - 1, game.bus.integrity)

    def test_green_light_generates_no_infraction(self) -> None:
        game = BusGameEngine()
        game.set_traffic_light_state(0, "green")
        game.command("accelerate", 31)

        self.assertEqual(0, game.infractions)
        self.assertEqual(MAX_COLLISIONS, game.bus.integrity)

    def test_missing_mandatory_stop_is_immediate_game_over(self) -> None:
        game = BusGameEngine()
        game.current_phase_id = 3
        game._reset_phase_runtime_state()
        game.command("accelerate", 50)

        self.assertTrue(game.game_over)
        self.assertEqual("missed_mandatory_stop", game.end_reason)

    def test_pedestrian_or_cyclist_runover_limit(self) -> None:
        game = BusGameEngine()
        game.collide_with("pedestrian")
        game.collide_with("cyclist")
        game.collide_with("pedestrian")

        self.assertEqual(3, game.runovers)
        self.assertTrue(game.game_over)

    def test_curve_overspeed_triggers_collision(self) -> None:
        game = BusGameEngine()
        game.current_phase_id = 6
        game._reset_phase_runtime_state()
        game.command("accelerate", 5)
        game.command("accelerate", 5)
        game.command("accelerate", 80)

        self.assertGreaterEqual(game.collisions, 1)

    def test_dropoff_updates_balance(self) -> None:
        game = BusGameEngine()
        game.current_phase_id = 7
        game._reset_phase_runtime_state()
        game.position = 120
        game.command("stop")
        worked = game.service_stop()

        self.assertTrue(worked)
        self.assertEqual(20.0, game.balance)

    def test_double_stop_same_point_no_double_fare(self) -> None:
        game = BusGameEngine()
        game.current_phase_id = 7
        game._reset_phase_runtime_state()
        game.position = 120
        game.command("stop")
        first = game.service_stop()
        second = game.service_stop()

        self.assertTrue(first)
        self.assertFalse(second)
        self.assertEqual(20.0, game.balance)

    def test_satisfaction_zero_on_finish_prioritizes_defeat(self) -> None:
        game = BusGameEngine()
        game.current_phase_id = 7
        game._reset_phase_runtime_state()
        game._active_passengers[0].satisfaction = 0
        game._served_stops.add("S7-DROP")
        game.command("accelerate", 200)

        self.assertTrue(game.game_over)
        self.assertEqual("passenger_satisfaction_zero", game.end_reason)

    def test_garage_emergency_loan_for_repair(self) -> None:
        game = BusGameEngine()
        game.register_collision("test")
        game.register_collision("test2")
        game.balance = 5
        game.garage(repair=True)

        self.assertEqual(MAX_COLLISIONS, game.bus.integrity)
        self.assertGreater(game.loan_balance, 0)
        self.assertEqual(0.0, game.balance)

    def test_progress_is_saved_and_loaded(self) -> None:
        game = BusGameEngine()
        game.balance = 40
        game.max_phase_unlocked = 4
        game.current_phase_id = 3
        game.bus.tires_upgrade = 1

        with tempfile.TemporaryDirectory() as tmp:
            path = str(Path(tmp) / "progress.json")
            game.save_progress(path)
            loaded = BusGameEngine()
            loaded.load_progress(path)

        self.assertEqual(4, loaded.max_phase_unlocked)
        self.assertEqual(3, loaded.current_phase_id)
        self.assertEqual(40.0, loaded.balance)
        self.assertEqual(1, loaded.bus.tires_upgrade)


if __name__ == "__main__":
    unittest.main()
