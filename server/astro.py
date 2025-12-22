import random
import threading
import gc
import numpy as np  # type: ignore
import astropy.units as u  # type: ignore
from typing import Any
from astroquery.simbad import Simbad  # type: ignore
from astropy.coordinates import SkyCoord  # type: ignore
from pathlib import Path

# Only needed if you run this inside flask to prevent double-execution
from werkzeug.serving import is_running_from_reloader  # type: ignore

import utils

START_RA = 180.0
START_DEC = 30.0
SEARCH_RADIUS_DEG = 2.0
FETCH_INTERVAL = 60  # seconds
OUTPUT_FILE = "status.txt"
DRIFT_AMOUNT = 2.0

SOUNDS = [
    "sine",
    "triangle",
    "piano",
]

BANKS = [
    "RhodesPolaris",
]

NOTES = [
    "c4",
    "e4",
    "g4",
    "a4",
    "f4",
    "d4",
    "b4",
    "c3",
    "e3",
    "g3",
    "a3",
    "f3",
    "d3",
    "b3",
    "f#4",
    "bb4",
    "c#4",
    "eb4",
    "g#4",
    "f#3",
    "bb3",
    "c#3",
    "eb3",
    "g#3",
    "c5",
    "e5",
    "g5",
    "a5",
    "f5",
    "d5",
    "b5",
    "c2",
    "e2",
    "g2",
    "a2",
    "f2",
    "d2",
    "b2",
    "f#5",
    "bb5",
    "c#5",
    "eb5",
    "g#5",
    "f#2",
    "bb2",
    "c#2",
    "eb2",
    "g#2",
    "c6",
    "e6",
    "g6",
    "a6",
    "f6",
    "d6",
    "b6",
    "c1",
    "e1",
    "g1",
    "a1",
    "f1",
    "d1",
    "b1",
    "f#6",
    "bb6",
    "c#6",
    "eb6",
    "g#6",
    "f#1",
    "bb1",
    "c#1",
    "eb1",
    "g#1",
    "c7",
    "e7",
    "g7",
    "c0",
    "e0",
    "g0",
]

NOISE = [
    "white",
    "pink",
    "brown",
]


class SkyScanner:
    _instance = None  # Singleton tracker

    def __new__(cls) -> "SkyScanner":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self) -> None:
        # Prevent re-initialization if already running
        if hasattr(self, "initialized"):
            return

        self.stop_event = threading.Event()
        self.thread = None
        self.current_ra = START_RA
        self.is_running = False

        # Init Simbad ONCE
        self.simbad = Simbad()
        self.simbad.add_votable_fields("ids", "V", "B")

        # Disable caching to prevent memory bloat over time
        # Type checkers often miss these dynamic attributes in astroquery
        # pyright: ignore[reportAttributeAccessIssue]
        self.simbad.cache_location = None  # pyright: ignore
        self.simbad.TIMEOUT = 30  # pyright: ignore

        self.initialized = True

    def get_ra_average(self, ra_values: list[Any]) -> float:
        # Convert degrees to radians
        ra_rad = np.deg2rad(ra_values)

        # Convert to unit vectors (x, y)
        x = np.cos(ra_rad)
        y = np.sin(ra_rad)

        # Average the vectors
        avg_x = np.mean(x)
        avg_y = np.mean(y)

        # Convert back to angle in degrees
        avg_ra_rad = np.arctan2(avg_y, avg_x)
        avg_ra_deg = np.rad2deg(avg_ra_rad) % 360

        return float(avg_ra_deg)

    def get_dec_average(self, dec_values: list[Any]) -> float:
        return float(np.mean(dec_values))

    def get_value(self, c: str) -> float:
        if c is None:
            return 0.5

        if isinstance(c, bytes):
            return float(c.decode("utf-8"))

        return float(c)

    def get_star_data(self, ra: float) -> Any:
        coord = SkyCoord(ra=ra, dec=START_DEC, unit=(u.deg, u.deg), frame="icrs")

        try:
            # Use the persistent instance
            table = self.simbad.query_region(coord, radius=SEARCH_RADIUS_DEG * u.deg)

            if table is None:
                return {}

            stars = []

            for row in table:
                star = {
                    "ra": float(row["ra"]),
                    "dec": float(row["dec"]),
                }
                stars.append(star)

            # Explicitly clear the heavy Astropy table from memory
            del table

            return stars

        except Exception as e:
            utils.echo(f"Simbad Query Error: {e}")
            return {}

    def run_loop(self) -> None:
        utils.echo("--- Sky Scanner Initialized (Ambient Mode) ---")
        utils.echo(f"Waiting {FETCH_INTERVAL}s before first scan...")

        while not self.stop_event.is_set():
            if self.stop_event.wait(FETCH_INTERVAL):
                break

            try:
                utils.echo(f"\nScanning RA: {self.current_ra:.2f}...")
                stars = self.get_star_data(self.current_ra)
                code = self.make_sound(stars)

                # Force garbage collection to clean up Astropy/NumPy temporaries
                gc.collect()

                if code:
                    with Path(OUTPUT_FILE).open("w", encoding="UTF-8") as f:
                        f.write(code)
                        utils.echo("Wrote to status file.")

            except Exception as e:
                utils.echo(f"Critical Loop Error: {e}")

            self.current_ra = (self.current_ra + DRIFT_AMOUNT) % 360.0

        utils.echo("--- Sky Scanner Stopped ---")

    def start(self) -> None:
        if self.is_running:
            return

        self.stop_event.clear()
        self.is_running = True
        self.thread = threading.Thread(target=self.run_loop, daemon=True)  # type: ignore

        if self.thread:
            self.thread.start()

    def stop(self) -> None:
        if not self.is_running:
            return

        self.stop_event.set()

        if self.thread:
            self.thread.join()

        self.is_running = False

    def make_sound(self, stars: Any) -> str:
        if not stars:
            return ""

        ra_values = [s["ra"] for s in stars]
        ra_avg = self.get_ra_average(ra_values)

        dec_values = [s["dec"] for s in stars]
        dec_avg = self.get_dec_average(dec_values)

        rng_1 = random.Random(f"{ra_avg}_{dec_avg}_1")
        rng_2 = random.Random(f"{ra_avg}_{dec_avg}_2")
        rng_3 = random.Random(f"{ra_avg}_{dec_avg}_3")

        min_cpm, max_cpm = 18, 28
        cpm = list(range(min_cpm, max_cpm + 1))

        min_p, max_p, step = 0, 1, 0.1
        points = [
            round(min_p + x * step, 1) for x in range(int((max_p - min_p) / step) + 1)
        ]

        def n() -> str:
            return rng_2.choice(NOTES)

        def s() -> str:
            return rng_3.choice(SOUNDS)

        def o() -> str:
            return rng_1.choice(NOISE)

        def v() -> str:
            n1 = rng_1.choice(points)
            n2 = rng_2.choice(points)
            n3 = rng_3.choice(points)
            return f"<{n1} {n2} {n3}>"

        # (Your sound generation string matches original...)
        return f"""
setcpm({rng_1.choice(cpm)})

let s1 = stack(
    note("{n()} ~ {n()} [{n()} {n()}]").sound("{s()}").pan(0).room("{v()}"),
    note("[{n()} {n()} {n()}]").sound("{o()}").pan(0).gain(0.4),
    sound("brown").gain(0.4).pan(1),
    note("~ {n()} {n()} {n()} {n()} {n()}").sound("{s()}"),
)

let s2 = stack(
    note("{n()} ~ {n()} [{n()} {n()}]").sound("{s()}").pan(0).room("{v()}"),
    note("[{n()} {n()} {n()}]").sound("{o()}").pan(0).gain(0.4),
    sound("brown").gain(0.4),
    note("~ {n()} {n()} {n()} {n()} {n()}").sound("{s()}"),
    note("f4 ~").sound("{s()}").pan(0),
)

let s3 = stack(
    note("{n()} ~ {n()} [{n()} {n()}]").sound("{s()}").pan(0).room("{v()}"),
    note("[{n()} {n()} {n()}]").sound("{o()}").pan(sine.range(0, 1).slow(4)).gain(0.2),
    sound("brown").gain(0.4).pan(1),
    note("~ {n()} {n()} {n()} {n()} {n()}").sound("{s()}"),
)

let s4 = stack(
    note("eb3 ~ {n()} [{n()} {n()}]").sound("{s()}").pan(0).room("{v()}"),
    note("[{n()} {n()} {n()}]").sound("{o()}").pan(0).gain(0.4),
    sound("brown").gain(0.4),
    note("~ {n()} {n()} {n()} {n()} {n()}").sound("{s()}"),
    note("{n()} ~").sound("{s()}").pan(1),
)

cat(s1, s2, s3, s4)
"""


# Modified start function for Flask safety
def start() -> SkyScanner:
    # IMPORTANT: In Flask dev mode, this prevents the thread
    # from starting in the reloader (watcher) process.
    # It will only start in the actual worker process.
    if is_running_from_reloader():
        return None  # type: ignore

    scanner = SkyScanner()
    scanner.start()
    return scanner
