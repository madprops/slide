import time
import math
import threading
import numpy as np
from typing import List, Dict, Any
from astroquery.simbad import Simbad
from astropy.coordinates import SkyCoord
import astropy.units as u

# CONFIGURATION
# ------------------------------------------------------------------------------
START_RA = 180.0
START_DEC = 30.0
SEARCH_RADIUS_DEG = 2.0
FETCH_INTERVAL = 60  # seconds
OUTPUT_FILE = "status.txt"
DRIFT_AMOUNT = 2.0

# EXPANDABLE LISTS
# Add as many options as you want here. The code automatically scales to the list size.
WAVEFORMS = [
  "sine",
  "sawtooth",
  "square",
  "triangle"
]

DRUM_BANKS = [
  "RolandTR909",
  "YamahaRY30",
  "linndrum",
  "RolandTR808"
  "CasioRZ1",
  "KorgM1",
  "AlesisSR16",
  "AJKPercusyn",
  "RhodesPolaris",
  "RhythmAce",
]

class SkyScanner:
  def __init__(self):
    self.stop_event = threading.Event()
    self.thread = None
    self.current_ra = START_RA
    self.is_running = False

  def normalize_value(self, value: float, min_val: float, max_val: float) -> float:
    if math.isnan(value):
      return 0.5

    norm = (value - min_val) / (max_val - min_val)
    return max(0.0, min(1.0, norm))

  def get_safe_float(self, row, col_name):
    """Safely extracts a float from a masked numpy array row."""
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
    """Tries to find the star's name/ID from available columns."""
    candidates = ["MAIN_ID", "ID", "main_id", "id", "TYC", "HIP", "HD"]

    for c in candidates:
      if c in row.colnames:
        val = row[c]

        if isinstance(val, bytes):
          return val.decode("utf-8")

        return str(val)

    return str(row[0])

  def get_normalized_star_data(self, ra: float) -> List[Dict[str, Any]]:
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

        processed_stars.append({
          "name": self.get_star_name(row),
          "music_vol": round(norm_vol, 3),
          "music_tone": round(norm_tone, 3),
        })

      processed_stars.sort(key=lambda x: x["music_vol"], reverse=True)
      return processed_stars

    except Exception as e:
      print(f"Simbad Query Error: {e}")
      return []

  def get_option_by_data(self, value_0_to_1, options_list):
    """Maps a 0.0-1.0 value to an index in the list."""
    if not options_list:
      return "sine" # Fallback

    # Scale value to list length (e.g., 0.99 * 4 = 3.96 -> int 3)
    index = int(value_0_to_1 * len(options_list))

    # Clamp to ensure we don't go out of bounds (handle 1.0 case)
    index = max(0, min(index, len(options_list) - 1))

    return options_list[index]

  def generate_strudel_code(self, stars):
    if not stars:
      # Default fallback
      return f'stack(note("c2").s("{WAVEFORMS[0]}").lpf(200).gain(0.3).slow(4)).room(2)'

    lead_star = stars[0]
    avg_tone = sum(s["music_tone"] for s in stars) / len(stars)

    # --- DYNAMIC SELECTION ---
    # Map Tone (Color) -> Waveform
    selected_waveform = self.get_option_by_data(avg_tone, WAVEFORMS)

    # Map Volume (Brightness) -> Drum Bank
    selected_bank = self.get_option_by_data(lead_star["music_vol"], DRUM_BANKS)

    cpm_val = 50 + int(lead_star["music_vol"] * 100)
    cutoff_val = 200 + int(avg_tone * 3800)

    drone_layer = f'  note("c2").s("{selected_waveform}").lpf({cutoff_val}).gain(0.4).slow(2)'

    if lead_star["music_vol"] < 0.3:
      beat_pattern = "bd(3,8)"
    elif lead_star["music_vol"] < 0.7:
      beat_pattern = "bd hh"
    else:
      beat_pattern = "bd [sd, hh] bd hh"

    beat_layer = f'  s("{beat_pattern}").bank("{selected_bank}").lpf({cutoff_val * 2}).gain(0.6)'

    scale_degrees = [0, 3, 5, 7, 10, 12]
    melody_notes = []

    for s in stars[:4]:
      scale_idx = int(s["music_tone"] * (len(scale_degrees) - 1))
      degree = scale_degrees[scale_idx]
      melody_notes.append(str(degree))

    seq_str = " ".join(melody_notes)
    effect = ".jux(rev)" if (avg_tone > 0.6) else ""

    # Melody always uses sine for contrast against the drone
    melody_layer = f'  note("{seq_str}").scale("c3 minor").s("sine").delay(0.5).gain(0.5){effect}'

    strudel_code = f"""
cpm({cpm_val})

stack(
{drone_layer},
{beat_layer},
{melody_layer}
).room(1.5).clip(1)
"""
    return strudel_code.strip()

  def run_loop(self):
    print(f"--- Sky Scanner Initialized ---")
    print(f"Waveforms available: {WAVEFORMS}")
    print(f"Banks available: {DRUM_BANKS}")
    print(f"Waiting {FETCH_INTERVAL}s before first scan...")

    while not self.stop_event.is_set():
      if self.stop_event.wait(FETCH_INTERVAL):
        break

      try:
        print(f"\nScanning RA: {self.current_ra:.2f}...")
        stars = self.get_normalized_star_data(self.current_ra)

        if stars:
          print(f"  > Found {len(stars)} stars.")
          lead = stars[0]

          # Calculate what was selected just for logging visibility
          avg_tone = sum(s["music_tone"] for s in stars) / len(stars)
          curr_wave = self.get_option_by_data(avg_tone, WAVEFORMS)
          curr_bank = self.get_option_by_data(lead["music_vol"], DRUM_BANKS)

          print(f"  > Lead: {lead['name']}")
          print(f"  > Selected: {curr_wave} (via Tone {avg_tone:.2f}) | {curr_bank} (via Vol {lead['music_vol']:.2f})")
        else:
          print("  > Deep Space (Silence or Network Timeout)")

        code = self.generate_strudel_code(stars)

        with open(OUTPUT_FILE, "w") as f:
          f.write(code)

      except Exception as e:
        print(f"Critical Loop Error: {e}")
        print("Continuing to next iteration...")

      self.current_ra = (self.current_ra + DRIFT_AMOUNT) % 360.0

    print("--- Sky Scanner Stopped ---")

  def start(self):
    if self.is_running:
      print("Scanner is already running.")
      return

    self.stop_event.clear()
    self.is_running = True
    self.thread = threading.Thread(target=self.run_loop, daemon=True)
    self.thread.start()

  def stop(self):
    if not self.is_running:
      return

    print("Stopping scanner...")
    self.stop_event.set()
    self.thread.join()
    self.is_running = False

def start() -> SkyScanner:
  scanner = SkyScanner()
  scanner.start()
  return scanner