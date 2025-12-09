from __future__ import annotations

import re
import os
import json
import atexit
import logging
import threading
from pathlib import Path
from typing import Any
from flask import Flask  # type: ignore
from flask import Response, send_from_directory, render_template, request
from litellm import completion  # type: ignore
from watchdog.observers import Observer  # type: ignore
from watchdog.events import FileSystemEventHandler  # type: ignore

PROMPT = """
This is a program that writes strudel.cc patterns using the strudel syntax (or tidal notation).
Each beat should be around 3-5 seconds in length.
The aim is to automate the beat changes, building upon the last section, altering it a bit,
leaving that run for an indefinite amount of time for the user to listen to,
as some sort of ambient sound machine.
Please try to keep a progression that makes sense.
Please try to make pleasant beats, in the vein of lo-fi hip-hop and experimental (futurebeats).
Don't try overly complex beats, to avoid syntax errors (this is important).
The beats shouldn't be too rough, avoid overpowered screeching/highs.
Response format: Just the raw syntax.
""".strip()

MINUTES = 5
PORT = 4242
MAX_HISTORY = 3
USE_INSTRUCTIONS = False
ENABLE_AI_INTERVAL = False

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
SONG_LIST_LIMIT = 100
CONFIG_FILE = "config/config.json"
app_config = {}

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s"
)

app = Flask(__name__)
stop_event = threading.Event()
answer_lock = threading.Lock()
worker_thread: threading.Thread | None = None
status_observer: Any = None
HISTORY: list[str] = []


def load_config() -> None:
    """Load application configuration from config.json."""

    global app_config

    config_path = Path(CONFIG_FILE)

    try:
        config_content = config_path.read_text(encoding="utf-8")
        app_config = json.loads(config_content)
        logging.info("Loaded config: %s", app_config)
    except FileNotFoundError:
        logging.warning("Config file %s not found, using defaults", CONFIG_FILE)
        app_config = {"version": "1.0"}
    except json.JSONDecodeError:
        logging.exception("Invalid JSON in config file")
        app_config = {"version": "1.0"}
    except OSError:
        logging.exception("Failed to read config file")
        app_config = {"version": "1.0"}


def strip_markdown_code_fences(text: str) -> str:
    """Remove triple-backtick markdown fences that may wrap code blocks."""

    if not text:
        return text

    lines = text.strip().splitlines()
    cleaned_lines = [line for line in lines if not line.strip().startswith("```")]

    cleaned = "\n".join(cleaned_lines).strip()
    return cleaned if cleaned else text.strip()


def resolve_model_name(raw_name: str) -> str:
    """Normalize user-provided identifiers to LiteLLM's provider format."""

    name = raw_name.strip()

    if name.startswith("google/"):
        return f"gemini/{name.split('/', 1)[1]}"

    if "/" not in name:
        return f"gemini/{name}"

    return name


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

            with answer_lock:
                record_history(content)


def start_status_watcher() -> None:
    """Start watching status.txt for external changes."""

    global status_observer

    if status_observer and status_observer.is_alive():
        return

    status_path = Path(STATE_FILE)
    watch_dir = str(status_path.parent.resolve())
    status_filename = status_path.name

    handler = StatusFileHandler(status_filename)
    status_observer = Observer()
    status_observer.schedule(handler, watch_dir, recursive=False)
    status_observer.start()
    logging.info("Started watching %s for changes", STATE_FILE)


def stop_status_watcher() -> None:
    """Stop the status file watcher."""

    global status_observer

    if status_observer:
        status_observer.stop()
        status_observer.join(timeout=2)
        status_observer = None


def get_beats() -> str:
    with answer_lock:
        beats = list(HISTORY[-MAX_HISTORY:])

    s = ""

    if len(beats) > 0:
        for i, beat in enumerate(beats):
            s += f"\n\nBEAT {i + 1}:\n\n"
            s += beat
    else:
        s = "There is no history yet, this is the first beat."

    return s.strip()


def make_prompt() -> str:
    global PROMPT

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

    PROMPT = "\n\n".join(items).strip()
    return PROMPT


def echo(s: str) -> None:
    print(s)  # noqa: T201


def run_ai_prompt() -> str:
    """Send the hardcoded prompt through LiteLLM and capture the text body."""

    echo("Getting answer")
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
        return strip_markdown_code_fences(content)

    return "Received empty response from model."


def get_api_key() -> str:
    if "gemini" in MODEL:
        return GOOGLE_API_KEY

    if "claude" in MODEL:
        return CLAUDE_API_KEY

    return ""


def background_worker() -> None:
    """Continuously refresh the cached answer on a fixed cadence."""

    interval_seconds = REQUEST_INTERVAL_MINUTES * 60

    while not stop_event.wait(interval_seconds):
        try:
            answer = run_ai_prompt()
        except Exception:
            logging.exception("AI request failed")
            answer = "Error collecting answer"

        with answer_lock:
            record_history(answer)

        persist_answer(answer)


def start_worker_if_needed() -> None:
    global worker_thread

    if worker_thread and worker_thread.is_alive():
        return

    worker_thread = threading.Thread(
        target=background_worker, name="ai-poller", daemon=True
    )
    worker_thread.start()


@app.route("/", methods=["GET"])  # type: ignore
def index() -> Any:
    """Serve the main HTML page."""

    song_name = request.args.get("song", "")
    song_value = re.sub(r"_+", " ", song_name) if song_name else ""

    beat_title = request.args.get("beat", "")
    beat_value = re.sub(r"_+", " ", beat_title) if beat_title else ""

    song_display = song_value or beat_value or ""

    return render_template(
        "index.jinja", song_name=song_name, song_display=song_display, config=app_config
    )


@app.route("/strudel/<path:path>", methods=["GET"])  # type: ignore
def strudel_files(path: str) -> Response:
    """Serve strudel library files."""

    return send_from_directory("strudel", path)


@app.route("/status", methods=["GET"])  # type: ignore
def get_status() -> Response:
    """Expose the most recent status as plain text."""

    status = read_status_file()

    if status == DEFAULT_ANSWER and len(HISTORY):
        status = HISTORY[-1]

    return Response(status, mimetype="text/plain")


@app.route("/dist/<path:filename>", methods=["GET"])  # type: ignore
def dist_assets(filename) -> Response:
    return send_from_directory("dist", filename)


@app.route("/css/<path:filename>", methods=["GET"])  # type: ignore
def css_assets(filename) -> Response:
    return send_from_directory("css", filename)


@app.route("/img/<path:filename>", methods=["GET"])  # type: ignore
def img_assets(filename) -> Response:
    return send_from_directory("img", filename)


@app.route("/config/<path:filename>", methods=["GET"])  # type: ignore
def config_assets(filename) -> Response:
    return send_from_directory("config", filename)


@app.route("/songs/list", methods=["GET"])  # type: ignore
def list_songs() -> Response:
    """Return list of song files without extension."""
    songs_dir = Path("songs")

    if not songs_dir.exists():
        return Response("[]", mimetype="application/json")

    song_paths = list(songs_dir.glob("*.js"))
    song_paths.sort(key=lambda path: path.stat().st_mtime, reverse=True)
    song_files = [path.stem for path in song_paths[:SONG_LIST_LIMIT]]

    return Response(json.dumps(song_files), mimetype="application/json")


@app.route("/songs/<path:filename>", methods=["GET"])  # type: ignore
def songs_assets(filename):
    return send_from_directory("songs", filename)


@app.get("/song/<path:song_name>", methods=["GET"])  # type: ignore
def song_shortcut(song_name: str):
    """Render HTML page with song name in title and meta tags."""

    song_display = re.sub(r"_+", " ", song_name)
    return render_template("index.html", song_name=song_name, song_display=song_display)


def shutdown_worker() -> None:
    stop_event.set()
    stop_status_watcher()

    if worker_thread:
        worker_thread.join(timeout=2)


def main() -> None:
    load_config()
    load_status()

    if ENABLE_AI_INTERVAL:
        load_api_key()
        load_instructions()
        start_worker_if_needed()
    else:
        logging.info("AI interval disabled; worker not started")

    start_status_watcher()
    atexit.register(shutdown_worker)
    app.run(host="0.0.0.0", port=PORT, debug=False)


if __name__ == "__main__":
    main()
