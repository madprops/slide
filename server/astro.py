import math
import threading
import numpy as np  # type: ignore
import astropy.units as u  # type: ignore
from typing import Any
from astroquery.simbad import Simbad  # type: ignore
from astropy.coordinates import SkyCoord  # type: ignore
from pathlib import Path

import utils

START_RA = 180.0
START_DEC = 30.0
SEARCH_RADIUS_DEG = 2.0
FETCH_INTERVAL = 60  # seconds
OUTPUT_FILE = "status.txt"
DRIFT_AMOUNT = 2.0

# Using softer waveforms for ambient feel
WAVEFORMS = [
    "sine",
    "triangle",
    "superpiano",  # If supported, otherwise falls back smoothly
    "organ",
]

# Using lighter, glitchier drum banks
DRUM_BANKS = [
    "RolandTR808",  # Soft kicks
    "CasioRZ1",  # Lo-fi crunch
    "AlesisSR16",
]


class SkyScanner:
    def __init__(self) -> None:
        self.stop_event = threading.Event()
        self.thread = None
        self.current_ra = START_RA
        self.is_running = False

    def normalize_value(self, value: float, min_val: float, max_val: float) -> float:
        if math.isnan(value):
            return 0.5

        norm = (value - min_val) / (max_val - min_val)
        return max(0.0, min(1.0, norm))

    def get_safe_float(self, row: Any, col_name: str) -> float:
        if col_name not in row.colnames:
            return float("nan")
        val = row[col_name]
        if np.ma.is_masked(val):
            return float("nan")
        try:
            return float(val)
        except (ValueError, TypeError):
            return float("nan")

    def get_star_name(self, row: Any) -> str:
        candidates = ["MAIN_ID", "ID", "main_id", "id", "TYC", "HIP", "HD"]
        for c in candidates:
            if c in row.colnames:
                val = row[c]
                if isinstance(val, bytes):
                    return val.decode("utf-8")
                return str(val)
        return str(row[0])

    def get_normalized_star_data(self, ra: float) -> list[dict[str, Any]]:
        custom_simbad = Simbad()
        custom_simbad.add_votable_fields("ids", "V", "B")
        coord = SkyCoord(ra=ra, dec=START_DEC, unit=(u.deg, u.deg), frame="icrs")

        try:
            table = custom_simbad.query_region(coord, radius=SEARCH_RADIUS_DEG * u.deg)
            if table is None:
                return []

            processed_stars = []
            for row in table:
                v_mag = self.get_safe_float(row, "FLUX_V")
                if math.isnan(v_mag):
                    v_mag = self.get_safe_float(row, "V")

                b_mag = self.get_safe_float(row, "FLUX_B")
                if math.isnan(b_mag):
                    b_mag = self.get_safe_float(row, "B")

                if math.isnan(v_mag):
                    continue

                norm_vol = 1.0 - self.normalize_value(v_mag, -1.5, 12.0)

                if not math.isnan(b_mag):
                    color_index = b_mag - v_mag
                    norm_tone = 1.0 - self.normalize_value(color_index, -0.5, 2.0)
                else:
                    norm_tone = 0.5

                processed_stars.append(
                    {
                        "name": self.get_star_name(row),
                        "music_vol": round(norm_vol, 3),
                        "music_tone": round(norm_tone, 3),
                    }
                )

            processed_stars.sort(key=lambda x: x["music_vol"], reverse=True)  # type: ignore
            return processed_stars

        except Exception as e:
            utils.echo(f"Simbad Query Error: {e}")
            return []

    def get_option_by_data(self, value_0_to_1: float, options_list: Any) -> Any:
        if not options_list:
            return "sine"
        index = int(value_0_to_1 * len(options_list))
        index = max(0, min(index, len(options_list) - 1))
        return options_list[index]

    def get_ambient_beat(self, vol: float, tone: float) -> str:
        """
        Generates a sparse, textural beat pattern.
        Instead of driving the song, this provides 'clicks and cuts'.
        """
        # Use lighter sounds for ambient
        kick = "bd" if vol > 0.8 else "lt"
        snare = "rm"  # Rimshot is softer than snare
        hat = "hh"

        # Use Euclidean rhythms for spacing (e.g., 3 hits in 16 steps)
        # The lower the volume, the sparser the hits.
        density = int(vol * 5) + 1  # 1 to 6 hits

        if tone < 0.4:
            # Dark ambient: slow, spacious
            pattern = f"<{kick}({density},16) {snare}({density},16,2)>"
        elif tone < 0.7:
            # Neutral: standard polymeter
            pattern = f"[{kick}({density},16), {hat}({density + 2},16)]"
        else:
            # Bright: faster, glitchier ticks
            pattern = f"[{kick}({density},16), {hat}*4]"

        return pattern

    def generate_strudel_code(self, stars: Any) -> str:
        if not stars:
            # Fallback deep space drone
            return 'note("c2").s("sine").lpf(300).gain(0.4).slow(4).room(3)'

        lead_star = stars[0]
        avg_tone = sum(s["music_tone"] for s in stars) / len(stars)
        vol = lead_star["music_vol"]

        # --- AMBIENT SETTINGS ---
        # Slower CPM for ambient feel
        cpm_val = 40 + int(vol * 40)

        # --- DRONE (The "Floor") ---
        # Low Pass Filter (LPF) ensures this stays in the bass frequencies
        # Vowel filter adds organic movement
        drone_wave = self.get_option_by_data(avg_tone, WAVEFORMS)
        drone_layer = (
            f'  note("c2").s("{drone_wave}")'
            f".lpf(300).gain(0.4).slow(4)"
            f'.vowel("{"a e i o u"[int(avg_tone * 4)]}")'
            f".pan(sine.range(0.3, 0.7).slow(8))"
        )

        # --- BEAT (The "Texture") ---
        # High Pass Filter (HPF) removes sub-bass to avoid clashing with drone
        # Very high Reverb (room) pushes it to the background
        beat_pattern = self.get_ambient_beat(vol, avg_tone)
        beat_bank = self.get_option_by_data(vol, DRUM_BANKS)
        beat_layer = (
            f'  s("{beat_pattern}").bank("{beat_bank}")'
            f".hpf(150).lpf(5000)"
            f".gain(0.25).room(2).shape(0.4)"
            f".pan(0.5)"
        )

        # --- MELODY (The "Stars") ---
        # High Pass Filter (HPF) ensures this floats ABOVE the drone
        scale_degrees = [0, 2, 4, 7, 9, 11]  # Lydian/Major pentatonic for wonder
        melody_notes = []
        melody_pans = []

        # Take top 4 stars
        active_stars = stars[:4]

        for s in active_stars:
            # Map tone to scale
            scale_idx = int(s["music_tone"] * (len(scale_degrees) - 1))
            degree = scale_degrees[scale_idx]
            melody_notes.append(str(degree))

            # Hard Pan Logic (preserved from previous step)
            raw_tone = s["music_tone"]
            if raw_tone < 0.5:
                p_val = raw_tone * 0.4  # Left
            else:
                p_val = 0.6 + ((raw_tone - 0.5) * 0.4)  # Right
            melody_pans.append(str(round(p_val, 2)))

        seq_str = " ".join(melody_notes)
        pan_str = " ".join(melody_pans)

        # Delay adds space. 'struct' locks the pan to the notes.
        melody_layer = (
            f'  note("{seq_str}").scale("Eb3 lydian").s("triangle")'
            f".hpf(600).attack(0.1).release(1.5)"
            f".gain(0.5).delay(0.5).decay(0.5)"
            f'.pan("{pan_str}")'
        )

        strudel_code = f"""
cpm({cpm_val})

stack(
{drone_layer},
{beat_layer},
{melody_layer}
).room(1.8).size(0.8)
"""
        return strudel_code.strip()

    def run_loop(self) -> None:
        utils.echo("--- Sky Scanner Initialized (Ambient Mode) ---")
        utils.echo(f"Waiting {FETCH_INTERVAL}s before first scan...")

        while not self.stop_event.is_set():
            if self.stop_event.wait(FETCH_INTERVAL):
                break

            try:
                utils.echo(f"\nScanning RA: {self.current_ra:.2f}...")
                stars = self.get_normalized_star_data(self.current_ra)

                if stars:
                    utils.echo(f"  > Found {len(stars)} stars.")
                    lead = stars[0]
                    avg_tone = sum(s["music_tone"] for s in stars) / len(stars)
                    utils.echo(f"  > Lead: {lead['name']} | Tone: {avg_tone:.2f}")

                code = self.generate_strudel_code(stars)

                with Path(OUTPUT_FILE).open("w", encoding="UTF-8") as f:
                    f.write(code)

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


def start() -> SkyScanner:
    scanner = SkyScanner()
    scanner.start()
    return scanner
