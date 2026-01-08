import random
import threading
import math
import json
import numpy as np  # type: ignore
from pathlib import Path
from typing import Any

# Only needed if you run this inside flask to prevent double-execution
from werkzeug.serving import is_running_from_reloader  # type: ignore

import utils
import data
from starnamer import StarNamer

SECONDS = 45
STARS_PATH = "data/stars.json"

# A width of 2.0 means we capture a strip 4 degrees wide total
# This is usually plenty for the Bright Star Catalog
SCAN_WIDTH_DEG = 2.0

SOUNDS = [
    "sine",
    "piano",
    "rd",
    "wind",
    "marimba",
    "vibraphone",
    "darbuka",
    "dantranh",
    "strumstick",
    "kawai",
    "piano1",
    "belltree",
    "fingercymbal",
    "glockenspiel",
    "glo",
]

BANKS = [
    "RolandTR626",
    "RolandSystem100",
    "RolandJD990",
    "YamahaRM50",
    "RhodesPolaris",
    "SakataDPM48",
    "DoepferMS404",
    "BossDR550",
    "CasioRZ1",
]

NOISE = [
    "pink",
    "brown",
    "oceandrum",
]

NOTES = [
    "~",
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
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


class Astro:
    _instance = None  # Singleton tracker

    def __new__(cls) -> "Astro":
        if cls._instance is None:
            cls._instance = super().__new__(cls)

        return cls._instance

    def __init__(self) -> None:
        # Prevent re-initialization if already running
        if hasattr(self, "initialized"):
            return

        self.stop_event = threading.Event()
        self.thread = None
        self.is_running = False
        self.initialized = True

        # RA is 0-360 (full circle)
        self.current_ra = random.uniform(0, 360)

        # DEC is -90 (South Pole) to +90 (North Pole)
        self.current_dec = random.uniform(-90, 90)

        self.ra_step = 2.0  # Move 2 degrees right per tick
        self.dec_step = 15.0  # Move 15 degrees up after full circle
        self.namer = StarNamer()
        self.read_file()

    def read_file(self) -> None:
        with Path(STARS_PATH).open("r", encoding="utf-8") as file:
            self.stars = json.load(file)

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

    def get_mag_average(self, mag_values: list[Any]) -> float:
        return float(np.mean(mag_values))

    def name(self, star: Any) -> str:
        return utils.remove_multiple_spaces(star["name"])

    def get_star_data(self, limit: int = 10) -> Any:
        # A. FETCH DATA (Using the "Nearest Neighbor" fix from before)
        # -----------------------------------------------------------
        found_stars = self.find_nearest_stars(self.current_ra, self.current_dec, limit)

        # B. UPDATE STATE (Prepare coordinates for the NEXT call)
        # -----------------------------------------------------------
        self.current_ra += self.ra_step

        # Check if we completed a full horizontal circle
        if self.current_ra >= 360:
            self.current_ra = 0  # Reset RA to start
            self.current_dec += self.dec_step  # Move Camera Up vertically

            # Check if we hit the North Pole (End of Universe)
            if self.current_dec > 90:
                # OPTION 1: Loop back to South Pole (Infinite Loop)
                self.current_dec = -90

                # OPTION 2: Bounce back down? (Requires adding a 'direction' state)
                # OPTION 3: Stop?

        return {
            "center_ra": self.current_ra,  # Return where we are looking
            "center_dec": self.current_dec,
            "stars": found_stars,
        }

    def find_nearest_stars(
        self, target_ra: float, target_dec: float, limit: int
    ) -> list[Any]:
        # ... (The logic from the previous answer goes here) ...
        # Remember: calculate distance using BOTH ra_diff and dec_diff
        candidates = []

        for star in self.stars:
            ra_diff = abs(star["ra"] - target_ra)
            if ra_diff > 180:
                ra_diff = 360 - ra_diff

            dec_diff = abs(star["dec"] - target_dec)

            # Simple score (Lower is better)
            score = ra_diff + dec_diff
            candidates.append((score, star))

        candidates.sort(key=lambda x: x[0])
        return [item[1] for item in candidates[:limit]]

    def run_loop(self) -> None:
        utils.echo("--- Astro Initialized ---")
        utils.echo(f"Waiting {SECONDS}s before first scan...")

        while not self.stop_event.is_set():
            if self.stop_event.wait(SECONDS):
                break

            try:
                utils.echo(f"\nScanning RA: {self.current_ra:.2f}...")
                star_data = self.get_star_data()
                self.make_sound(star_data)
                data.persist_status()
                utils.echo("Astro Updated.")

            except Exception as e:
                utils.echo(f"Critical Loop Error: {e}")

        utils.echo("--- Astro Stopped ---")

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

    def calculate_star_awards(
        self, stars: list[Any], ra_avg: float, dec_avg: float, mag_values: list[float]
    ) -> Any:
        north_star = stars[0]
        center_star = stars[0]
        loner_star = stars[0]
        brightest_star = stars[0]

        min_dist_to_center = float("inf")
        max_isolation_dist = -1.0
        # Initialize with the first star's magnitude (Lower magnitude = Brighter)
        min_magnitude = mag_values[0]

        # Pre-calculate cos(dec) for the average to correct the RA scale
        # (Use the average dec of the cluster for the center calculation)
        cos_dec_avg = math.cos(math.radians(dec_avg))

        for i, star in enumerate(stars):
            # 1. North Star (Valid)
            if star["dec"] > north_star["dec"]:
                north_star = star

            # 2. Brightest Star
            # Check if current star has a lower magnitude value than the current minimum
            if mag_values[i] < min_magnitude:
                min_magnitude = mag_values[i]
                brightest_star = star

            # 3. Center Star (Fixing the distance)
            # Handle RA wrap-around: min(diff, 360 - diff)
            raw_ra_diff = abs(star["ra"] - ra_avg)

            if raw_ra_diff > 180:
                raw_ra_diff = 360 - raw_ra_diff

            # Scale RA difference by cosine of declination
            adjusted_ra_diff = raw_ra_diff * cos_dec_avg
            dec_diff = star["dec"] - dec_avg

            dist_to_avg = math.sqrt((adjusted_ra_diff**2) + (dec_diff**2))

            if dist_to_avg < min_dist_to_center:
                min_dist_to_center = dist_to_avg
                center_star = star

            # 4. Loner Award
            nearest_neighbor_dist = float("inf")

            for j, other_star in enumerate(stars):
                if i == j:
                    continue

                # Local cosine correction (average of the two stars' dec)
                local_dec_rad = math.radians((star["dec"] + other_star["dec"]) / 2)
                local_cos = math.cos(local_dec_rad)

                raw_d_ra = abs(star["ra"] - other_star["ra"])

                if raw_d_ra > 180:
                    raw_d_ra = 360 - raw_d_ra

                d_ra = raw_d_ra * local_cos
                d_dec = star["dec"] - other_star["dec"]

                distance = math.sqrt((d_ra**2) + (d_dec**2))

                if distance < nearest_neighbor_dist:
                    nearest_neighbor_dist = distance

            if nearest_neighbor_dist > max_isolation_dist:
                max_isolation_dist = nearest_neighbor_dist
                loner_star = star

        return {
            "north_star": north_star,
            "center_star": center_star,
            "loner_star": loner_star,
            "brightest_star": brightest_star,
        }

    def make_sound(self, star_data: Any) -> None:
        stars = star_data["stars"]

        if not stars:
            return

        ra_values = [s["ra"] for s in stars]
        ra_avg = round(self.get_ra_average(ra_values))

        dec_values = [s["dec"] for s in stars]
        dec_avg = round(self.get_dec_average(dec_values))

        mag_values = [s["mag"] for s in stars]
        mag_avg = round(self.get_mag_average(mag_values))

        awards = self.calculate_star_awards(stars, ra_avg, dec_avg, mag_values)
        tag = f"{ra_avg}_{dec_avg}_${mag_avg}"

        rng_1 = random.Random(f"{tag}_1")
        rng_2 = random.Random(f"{tag}_2")
        rng_3 = random.Random(f"{tag}_3")

        min_cpm, max_cpm = 20, 30
        cpm = list(range(min_cpm, max_cpm + 1))

        min_p, max_p, step = 0, 1, 0.1

        points = [
            round(min_p + x * step, 1) for x in range(int((max_p - min_p) / step) + 1)
        ]

        g1 = 0.6
        g2 = 0.5

        # Helper to potentially wrap values in < > for alternation
        def p(options: list[str]) -> str:
            if rng_1.random() <= 0.8:
                return rng_2.choice(options)

            # Otherwise create an alternation sequence
            # Mode A: Simple alternation <a b>
            # Mode B: Complex alternation <a b c>
            mode = rng_1.choice(["simple", "complex"])

            val1 = rng_2.choice(options)
            val2 = rng_2.choice(options)

            if mode == "simple":
                return f"<{val1} {val2}>"

            val3 = rng_2.choice(options)
            return f"<{val1} {val2} {val3}>"

        def n() -> str:
            return p(NOTES)

        def s() -> str:
            return p(SOUNDS)

        def o() -> str:
            return p(NOISE)

        def v() -> str:
            n1 = rng_1.choice(points)
            n2 = rng_2.choice(points)
            n3 = rng_3.choice(points)
            return f"<{n1} {n2} {n3}>"

        def b() -> str:
            return p(BANKS)

        def at() -> float:
            return round(rng_1.uniform(0.1, 0.9), 1)

        def rel() -> float:
            return round(rng_2.uniform(0.5, 3.0), 1)

        def pan() -> float:
            return round(rng_3.uniform(0, 1.0), 1)

        def e() -> str:
            # 30% chance for no effect
            if rng_3.random() < 0.3:
                return ""

            chain_len = rng_3.randint(1, 2)
            chain = []

            for _ in range(chain_len):
                type_idx = rng_3.randint(0, 5)
                val: int | float

                if type_idx == 0:
                    val = rng_1.randint(200, 3000)
                    chain.append(f".lpf({val})")
                elif type_idx == 1:
                    val = rng_1.randint(100, 1000)
                    chain.append(f".hpf({val})")
                elif type_idx == 2:
                    val = round(rng_2.uniform(0.1, 0.7), 2)
                    chain.append(f".delay({val})")
                elif type_idx == 3:
                    val = rng_2.randint(3, 16)
                    chain.append(f".crush({val})")
                elif type_idx == 5:
                    char = rng_3.choice(["a", "e", "i", "o", "u"])
                    chain.append(f".vowel('{char}')")
                elif type_idx == 6:
                    val = round(rng_2.uniform(0.1, 0.5), 2)
                    chain.append(f".room({val})")
                elif type_idx == 7:
                    val = rng_1.randint(400, 2000)
                    chain.append(f".bpf({val})")
                elif type_idx == 8:
                    val = round(rng_2.uniform(0.5, 4.0), 1)
                    chain.append(f".phaser({val})")
                elif type_idx == 9:
                    val = round(rng_2.uniform(0.2, 0.8), 2)
                    chain.append(f".pan({val})")

            return "".join(chain)

        percs = [
            # With effects
            f'sound("bd hh hh hh").bank("{b()}"){e()}',
            f'sound("bd hh sd hh").bank("{b()}"){e()}',
            f'sound("bd sd bd sd").bank("{b()}"){e()}',
            f'sound("bd hh hh [sd sd]").bank("{b()}"){e()}',
            f'sound("bd [hh hh] sd hh").bank("{b()}"){e()}',
            f'sound("bd sd [bd bd] sd").bank("{b()}"){e()}',
            # Without effects
            f'sound("bd hh hh hh").bank("{b()}")',
            f'sound("bd hh sd hh").bank("{b()}")',
            f'sound("bd sd bd sd").bank("{b()}")',
            f'sound("bd hh hh [sd sd]").bank("{b()}")',
            f'sound("bd [hh hh] sd hh").bank("{b()}")',
            f'sound("bd sd [bd bd] sd").bank("{b()}")',
            # Silent
            'sound("~ ~ ~ ~")',
        ]

        def perc() -> str:
            return rng_1.choice(percs)

        name = self.namer.generate_name(ra_avg, dec_avg, mag_avg)
        data.beat_title = name
        data.beat_code = f"""/* {name}
RA: {ra_avg} | DEC: {dec_avg} | MAG: {mag_avg}
North Star: {self.name(awards["north_star"])}
Loner Star: {self.name(awards["loner_star"])}
Center Star: {self.name(awards["center_star"])}
Brightest Star: {self.name(awards["brightest_star"])} */

setcpm({rng_1.choice(cpm)})

let s1 = stack(
  note("{n()} ~ {n()} [{n()} {n()}]").sound("{s()}").pan(0).room("{v()}"){e()}.gain({g1}),
  note("[{n()} {n()} {n()}]").sound("{o()}").pan(0).gain(0.15).attack(0.05).release(0.1){e()},
  sound("brown").gain(0.1).attack({at()}).release({rel()}).pan({pan()}){e()},
  note("~ {n()} {n()} {n()} {n()} {n()}").sound("{s()}"){e()}.gain({g2})
)

let s2 = stack(
  note("{n()} ~ {n()} [{n()} {n()}]").sound("{s()}").pan(0).room("{v()}"){e()}.gain({g1}),
  note("[{n()} {n()} {n()}]").sound("{o()}").pan(0).gain(0.15).attack(0.05).release(0.1){e()},
  sound("brown").gain(0.1).attack({at()}).release({rel()}){e()},
  note("~ {n()} {n()} {n()} {n()} {n()}").sound("{s()}"){e()},
  note("f4 ~").sound("{s()}").pan(0){e()}.gain({g2})
)

let s3 = stack(
  note("{n()} ~ {n()} [{n()} {n()}]").sound("{s()}").pan(0).room("{v()}"){e()}.gain({g1}),
  note("[{n()} {n()} {n()}]").sound("{o()}").pan(sine.range(0, 1).slow(4)).gain(0.15).attack(0.05).release(0.1){e()},
  sound("brown").gain(0.1).attack({at()}).release({rel()}).pan({pan()}){e()},
  note("~ {n()} {n()} {n()} {n()} {n()}").sound("{s()}"){e()}.gain({g2})
)

let s4 = stack(
  note("eb3 ~ {n()} [{n()} {n()}]").sound("{s()}").pan(0).room("{v()}"){e()}.gain({g1}),
  note("[{n()} {n()} {n()}]").sound("{o()}").pan(0).gain(0.15).attack(0.05).release(0.1){e()},
  sound("brown").gain(0.1).attack({at()}).release({rel()}){e()},
  note("~ {n()} {n()} {n()} {n()} {n()}").sound("{s()}"){e()}.gain({g2}),
  note("{n()} ~").sound("{s()}").pan({pan()}){e()}
)

let p1 = {perc()}
let p2 = {perc()}
let p3 = {perc()}
let p4 = {perc()}

$: cat(s1, s2, s3, s4)
$: cat(p1, p2, p3, p4)
"""


ASTRO: Astro


# Modified start function for Flask safety
def start() -> None:
    global ASTRO

    # IMPORTANT: In Flask dev mode, this prevents the thread
    # from starting in the reloader (watcher) process.
    # It will only start in the actual worker process.
    if is_running_from_reloader():
        return

    utils.echo(f"🤖 Auto (astro): {SECONDS} seconds")
    ASTRO = Astro()
    ASTRO.start()


def stop() -> None:
    if ASTRO:
        ASTRO.stop()
