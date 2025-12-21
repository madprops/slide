from __future__ import annotations

import os
import threading
import logging
import random
from pathlib import Path

from flask import Blueprint, Response  # type: ignore

bp = Blueprint("auto", __name__)

from watchdog.events import FileSystemEventHandler  # type: ignore
from watchdog.observers import Observer  # type: ignore
from litellm import completion  # type: ignore
from typing import Any

import utils

MINUTES = 5
MAX_HISTORY = 3
USE_INSTRUCTIONS = False
DIRECTOR_INTENSITY = "medium"
USE_DIRECTOR = True

GOOGLE_MODEL = "gemini/gemini-2.0-flash"
CLAUDE_MODEL = "anthropic/claude-sonnet-4-20250514"
MODEL = os.getenv("LITELLM_MODEL", CLAUDE_MODEL)

GOOGLE_API_KEY = ""
CLAUDE_API_KEY = ""
GOOGLE_API_KEY_FILE = os.getenv("LITELLM_KEY_FILE", "keys/google_api_key.txt")
CLAUDE_API_KEY_FILE = os.getenv("LITELLM_KEY_FILE", "keys/claude_api_key.txt")
STATE_FILE = os.getenv("STATE_FILE", "status.txt")
INSTRUCTIONS = ""
INSTRUCTIONS_FILE = os.getenv("INSTRUCTIONS_FILE", "instructions.txt")

REQUEST_INTERVAL_MINUTES = max(
    1, int(os.getenv("REQUEST_INTERVAL_MINUTES", f"{MINUTES}"))
)

DEFAULT_ANSWER = ""

STOP_EVENT = threading.Event()
ANSWER_LOCK = threading.Lock()
WORKER_THREAD: threading.Thread | None = None
STATUS_OBSERVER: Any = None
HISTORY: list[str] = []


PROMPT = """
This is a program that writes strudel.cc patterns using the strudel syntax (or tidal notation).
Your aim is to generate pure strudel code I can run in the evaluator.
Each beat should be around 5-10 seconds in length.
Please try to keep a progression that makes sense.
Please try to make pleasant beats, in the vein of lo-fi hip-hop or futurebeats.
Don't try overly complex beats, to avoid syntax errors (this is important).
The beats shouldn't be too rough and avoid overpowered screeching/highs.
Response format: Just the raw syntax.
""".strip()

# Directives focused on the beat and timing
RHYTHMIC_STRATEGIES = [
    "Mutate the Euclidean rhythm: change the numbers inside the struct() string (e.g., <3, 5> to <4, 7>).",
    "Alter the flow: change the speed using slow() or fast() on a specific layer.",
    "sparsify the beat: add a mask() to randomly mute steps in the drum pattern.",
    "Syncopation: shift the timing of the melody using late() or early().",
]

# Directives focused on sound design and atmosphere
TIMBRAL_STRATEGIES = [
    "Darken the tone: apply a lpf() (low pass filter) with a variable cutoff.",
    "Change the texture: swap the sound source s() (e.g., from 'sawtooth' to 'square' or a different drum bank).",
    "Add space: introduce reverb using room() or specific delay() settings.",
    "Grittiness: add distortion using distort() or bitcrush effects.",
]

# Directives focused on musical progression
STRUCTURAL_STRATEGIES = [
    "Harmonic shift: transpose the note() pattern or change the scale definition.",
    "Breakdown: remove the kick drum layer entirely for one cycle.",
    "Build tension: slowly increase the gain() while increasing the filter cutoff.",
    "Call and response: duplicate a layer but offset it using off().",
]


@bp.route("/status", methods=["GET"])  # type: ignore
def get_status() -> Response:
    """Expose the most recent status as plain text."""

    status = read_status_file()

    if status == DEFAULT_ANSWER and len(HISTORY):
        status = HISTORY[-1]

    return Response(status, mimetype="text/plain")


def get_director_instruction(intensity: str = "medium") -> str:
    """
    Selects a strategy and appends an intensity modifier to guide the AI.
    """
    # Combine all strategies or select based on a 'mode' if you add that later
    all_strategies = RHYTHMIC_STRATEGIES + TIMBRAL_STRATEGIES + STRUCTURAL_STRATEGIES
    selected_strategy = random.choice(all_strategies)

    modifier = ""

    if intensity == "high":
        modifier = "Make the change drastic and immediately noticeable."
    elif intensity == "low":
        modifier = "Make the change very subtle, almost imperceptible."
    else:
        modifier = "Ensure the evolution feels organic and smooth."

    return f"DIRECTOR'S INSTRUCTION: {selected_strategy} \nINTENSITY: {modifier} "


def run_ai_prompt() -> str:
    """Send the hardcoded prompt through LiteLLM and capture the text body."""

    utils.echo("Getting answer")
    model = resolve_model_name(MODEL)

    messages = [
        {"role": "system", "content": "Respond with clear, user-friendly summaries."},
        {"role": "user", "content": make_prompt()},
    ]

    response = completion(
        model=model,
        messages=messages,
        api_key=get_api_key(),
        timeout=30,
    )

    message = response.choices[0].message  # pyright: ignore[reportAttributeAccessIssue]

    content = (
        message.get("content")
        if isinstance(message, dict)
        else getattr(message, "content", "")
    )

    if content:
        return utils.strip_markdown_code_fences(content)

    return "Received empty response from model."


def make_prompt() -> str:
    items = [PROMPT]

    if USE_INSTRUCTIONS:
        instructions = f"""Here are the instructions on how to write strudel code:

{INSTRUCTIONS}
		""".strip()

        items.append(instructions)

    if len(HISTORY) > 0:
        beats = f"""Here are the last {len(HISTORY)} beats (from older to newer):

{get_beats()}
		""".strip()

        items.append(beats)

    if USE_DIRECTOR:
        instruct = get_director_instruction(DIRECTOR_INTENSITY)
        items.append(instruct)

    return "\n\n".join(items).strip()


def get_api_key() -> str:
    if "gemini" in MODEL:
        return GOOGLE_API_KEY

    if "claude" in MODEL:
        return CLAUDE_API_KEY

    return ""


def get_beats() -> str:
    with ANSWER_LOCK:
        beats = list(HISTORY[-MAX_HISTORY:])

    s = ""

    if len(beats) > 0:
        for i, beat in enumerate(beats):
            s += f"\n\nBEAT {i + 1}:\n\n"
            s += beat
    else:
        s = "There is no history yet, this is the first beat."

    return s.strip()


def background_worker() -> None:
    """Continuously refresh the cached answer on a fixed cadence."""

    interval_seconds = REQUEST_INTERVAL_MINUTES * 60

    while not STOP_EVENT.wait(interval_seconds):
        try:
            answer = run_ai_prompt()
        except Exception:
            logging.exception("AI request failed")
            answer = "Error collecting answer"

        with ANSWER_LOCK:
            record_history(answer)

        persist_answer(answer)


def start_worker_if_needed() -> None:
    global WORKER_THREAD

    if WORKER_THREAD and WORKER_THREAD.is_alive():
        return

    WORKER_THREAD = threading.Thread(
        target=background_worker, name="ai-poller", daemon=True
    )

    WORKER_THREAD.start()


def start_auto() -> None:
    """Start watching status.txt for external changes."""

    global STATUS_OBSERVER

    if STATUS_OBSERVER and STATUS_OBSERVER.is_alive():
        return

    status_path = Path(STATE_FILE)
    watch_dir = str(status_path.parent.resolve())
    status_filename = status_path.name

    handler = StatusFileHandler(status_filename)
    STATUS_OBSERVER = Observer()
    STATUS_OBSERVER.schedule(handler, watch_dir, recursive=False)
    STATUS_OBSERVER.start()
    logging.info("Started watching %s for changes", STATE_FILE)


def read_status_file() -> str:
    """Read the raw status text from disk, falling back to DEFAULT_ANSWER."""

    status_path = Path(STATE_FILE)

    try:
        return status_path.read_text(encoding="utf-8")
    except FileNotFoundError:
        return DEFAULT_ANSWER
    except OSError as exc:
        logging.warning("Failed to read status file %s: %s", status_path, exc)
        return DEFAULT_ANSWER


def load_status() -> str:
    """Return the cached AI response from disk if available."""

    cached = read_status_file()

    if not cached:
        return DEFAULT_ANSWER

    record_history(cached)
    return cached


def persist_answer(answer: str) -> None:
    """Persist the latest answer so it can be served without a fresh fetch."""

    status_path = Path(STATE_FILE)

    try:
        status_path.write_text(answer, encoding="utf-8")
    except OSError as exc:
        logging.warning("Failed to write status file %s: %s", status_path, exc)


def record_history(entry: str) -> None:
    """Keep a bounded, in-memory sequence of recent beats.

    Callers should hold answer_lock when invoking from threaded contexts.
    """

    if not entry or entry == DEFAULT_ANSWER:
        return

    HISTORY.append(entry)

    if len(HISTORY) > MAX_HISTORY:
        del HISTORY[:-MAX_HISTORY]


class StatusFileHandler(FileSystemEventHandler):  # type: ignore
    """Watch for changes to status.txt and update history."""

    def __init__(self, status_filename: str):
        super().__init__()
        self.status_filename = status_filename

    def on_modified(self, event: Any) -> None:
        if event.is_directory:
            return

        if Path(event.src_path).name == self.status_filename:
            logging.info(
                "Detected change in %s, updating history", self.status_filename
            )

            content = read_status_file()

            with ANSWER_LOCK:
                record_history(content)


def stop_status_fetcher() -> None:
    """Stop the status file fetcher."""

    global STATUS_OBSERVER

    if STATUS_OBSERVER:
        STATUS_OBSERVER.stop()
        STATUS_OBSERVER.join(timeout=2)
        STATUS_OBSERVER = None


def load_instructions() -> None:
    """Load customizable instructions used to build the AI prompt."""

    global INSTRUCTIONS

    instructions_path = Path(INSTRUCTIONS_FILE)

    try:
        instructions = instructions_path.read_text(encoding="utf-8").strip()
    except FileNotFoundError:
        return
    except OSError as exc:
        logging.warning(
            "Failed to read instructions file %s: %s", instructions_path, exc
        )

        return

    if not instructions:
        raise RuntimeError("Instructions file is empty.")

    INSTRUCTIONS = instructions


def load_api_key() -> None:
    """Load the provider key from api_key.txt, raising if it cannot be read."""

    global GOOGLE_API_KEY
    global CLAUDE_API_KEY

    key_path = Path(GOOGLE_API_KEY_FILE)
    key = ""

    try:
        key = key_path.read_text(encoding="utf-8").strip()
    except FileNotFoundError:
        pass

    if not key:
        pass

    GOOGLE_API_KEY = key
    key_path_2 = Path(CLAUDE_API_KEY_FILE)
    key_2 = ""

    try:
        key_2 = key_path_2.read_text(encoding="utf-8").strip()
    except FileNotFoundError:
        pass

    if not key_2:
        pass

    CLAUDE_API_KEY = key_2


def resolve_model_name(raw_name: str) -> str:
    """Normalize user-provided identifiers to LiteLLM's provider format."""

    name = raw_name.strip()

    if name.startswith("google/"):
        return f"gemini/{name.split('/', 1)[1]}"

    if "/" not in name:
        return f"gemini/{name}"

    return name


def shutdown_worker() -> None:
    STOP_EVENT.set()
    stop_status_fetcher()

    if WORKER_THREAD:
        WORKER_THREAD.join(timeout=2)
