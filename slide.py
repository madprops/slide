"""Background AI polling service with a tiny Flask surface."""

import atexit
import logging
import os
import threading
from pathlib import Path
from typing import Dict, Optional, List

from flask import Flask, Response
from litellm import completion


PROMPT = """
This is a program that writes strudel.cc code to compose musical beats.
Each beat should be around 5-10 seconds in length.
The aim is to automate the beat changes, building upon the last section, alternating it a bit,
leaving that run for an indefinite amount of time for the user to listen to,
as some sort of ambient sound machine.
On each prompt you will receive the last 3 beats, and you will be asked to produce the followup.
There might be no history yet, in that case a starting point must be generated.
Try to keep a progression that makes sense.
Try to make pleasant beats, in the vein of lo-fi hip-hop and experimental (futurebeats).
The beats should be pleasant, not rough, avoid overpowered screeching/highs.
The response should ONLY be the code of the new beat, ready to be used in strudel,
because it's going to be plugged in directly as raw text.
Don't use backticks or any sort of markdown.
"""

MINUTES = 5
DEFAULT_MODEL = os.getenv("LITELLM_MODEL", "gemini/gemini-2.0-flash")
API_KEY_FILE = os.getenv("LITELLM_KEY_FILE", "api_key.txt")
STATE_FILE = os.getenv("STATE_FILE", "state.txt")
INSTRUCTIONS = ""
INSTRUCTIONS_FILE = os.getenv("INSTRUCTIONS_FILE", "instructions.txt")
REQUEST_INTERVAL_MINUTES = max(1, int(os.getenv("REQUEST_INTERVAL_MINUTES", f"{MINUTES}")))
DEFAULT_ANSWER = ""
PORT = 4242
MAX_HISTORY = 3

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

app = Flask(__name__)
stop_event = threading.Event()
answer_lock = threading.Lock()
worker_thread: Optional[threading.Thread] = None
LATEST_ANSWER = DEFAULT_ANSWER
HISTORY: List[str] = []


def resolve_model_name(raw_name: str) -> str:
	"""Normalize user-provided identifiers to LiteLLM's provider format."""

	name = raw_name.strip()

	if name.startswith("google/"):
		return f"gemini/{name.split('/', 1)[1]}"

	if "/" not in name:
		return f"gemini/{name}"

	return name


def load_api_key() -> str:
	"""Load the provider key from api_key.txt, raising if it cannot be read."""

	global API_KEY

	key_path = Path(API_KEY_FILE)

	try:
		key = key_path.read_text(encoding="utf-8").strip()
	except FileNotFoundError as exc:
		raise RuntimeError(f"API key file missing: {key_path}") from exc

	if not key:
		raise RuntimeError(f"API key file is empty: {key_path}")

	API_KEY = key


def load_instructions() -> str:
	"""Load customizable instructions used to build the AI prompt."""

	global INSTRUCTIONS

	instructions_path = Path(INSTRUCTIONS_FILE)

	try:
		instructions = instructions_path.read_text(encoding="utf-8").strip()
	except FileNotFoundError:
		return PROMPT.strip()
	except OSError as exc:
		logging.warning("Failed to read instructions file %s: %s", instructions_path, exc)
		return PROMPT.strip()

	if not instructions:
		raise RuntimeError(f"Instructions file is empty: {key_path}")

	INSTRUCTIONS = instructions


def load_cached_answer() -> str:
	"""Return the cached AI response from disk if available."""

	global LATEST_ANSWER

	state_path = Path(STATE_FILE)

	try:
		cached = state_path.read_text(encoding="utf-8")
	except FileNotFoundError:
		return DEFAULT_ANSWER
	except OSError as exc:
		logging.warning("Failed to read state file %s: %s", state_path, exc)
		return DEFAULT_ANSWER

	if not cached:
		return DEFAULT_ANSWER

	LATEST_ANSWER = cached
	record_history(cached)


def persist_answer(answer: str) -> None:
	"""Persist the latest answer so it can be served without a fresh fetch."""

	state_path = Path(STATE_FILE)

	try:
		state_path.write_text(answer, encoding="utf-8")
	except OSError as exc:
		logging.warning("Failed to write state file %s: %s", state_path, exc)


def record_history(entry: str) -> None:
	"""Keep a bounded, in-memory sequence of recent beats."""

	if not entry or entry == DEFAULT_ANSWER:
		return

	HISTORY.append(entry)

	if len(HISTORY) > MAX_HISTORY:
		del HISTORY[:-MAX_HISTORY]


def get_beats() -> str:
	with answer_lock:
		beats = list(HISTORY[-MAX_HISTORY:])

	s = ""

	for i, beat in enumerate(beats):
		s += f"\n\nBEAT {i + 1}:\n\n"
		s += beat

	return s.strip()


def get_prompt() -> str:
	global PROMPT
	global INSTRUCTIONS

	PROMPT = f"""{PROMPT}\n\n
	Here are the last 3 beats (from older to newer):

	{get_beats()}

	Here are the instructions on how to write strudel code:

	{INSTRUCTIONS}
	""".strip()

	return PROMPT


def run_ai_prompt() -> str:
	"""Send the hardcoded prompt through LiteLLM and capture the text body."""

	print("Getting answer")
	model = resolve_model_name(DEFAULT_MODEL)

	messages = [
		{"role": "system", "content": "Respond with clear, user-friendly summaries."},
		{"role": "user", "content": get_prompt()},
	]

	response = completion(
		model=model,
		messages=messages,
		api_key=API_KEY,
		timeout=30,
	)

	message = response.choices[0].message
	content = message.get("content") if isinstance(message, dict) else getattr(message, "content", "")

	if content:
		return content.strip()

	return "Received empty response from model."


def background_worker() -> None:
	"""Continuously refresh the cached answer on a fixed cadence."""

	global LATEST_ANSWER

	interval_seconds = REQUEST_INTERVAL_MINUTES * 60

	while not stop_event.wait(interval_seconds):
		try:
			answer = run_ai_prompt()
		except Exception as exc:
			logging.exception("AI request failed: %s", exc)
			answer = f"Error collecting answer: {exc}"

		with answer_lock:
			LATEST_ANSWER = answer
			record_history(answer)

		persist_answer(answer)


def start_worker_if_needed() -> None:
	global worker_thread

	if worker_thread and worker_thread.is_alive():
		return

	worker_thread = threading.Thread(target=background_worker, name="ai-poller", daemon=True)
	worker_thread.start()


@app.get("/state")
def get_state() -> Response:
	"""Expose the most recent AI answer as plain text."""

	with answer_lock:
		answer = LATEST_ANSWER

	return Response(answer, mimetype="text/plain")


@app.get("/healthz")
def get_health() -> Dict[str, str]:
	return {"status": "ok"}


def shutdown_worker() -> None:
	stop_event.set()

	if worker_thread:
		worker_thread.join(timeout=2)


def main() -> None:
	load_api_key()
	load_instructions()
	load_cached_answer()
	start_worker_if_needed()
	atexit.register(shutdown_worker)
	app.run(host="0.0.0.0", port=PORT, debug=False)


if __name__ == "__main__":
	main()
