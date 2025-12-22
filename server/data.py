import os
import json
import logging
from pathlib import Path

beat_title = ""
beat_code = ""
status_path = os.getenv("STATE_FILE", "status.json")


def persist_status() -> None:
    """Persist the latest beat data as JSON so it can be served without a fresh fetch."""
    path = Path(status_path)

    payload = {"title": beat_title, "code": beat_code}

    try:
        # Convert dictionary to a JSON-formatted string
        json_data = json.dumps(payload, indent=2)
        path.write_text(json_data, encoding="utf-8")

    except OSError as exc:
        logging.warning("Failed to write status file %s: %s", path, exc)


def read_status_file() -> None:
    global beat_title
    global beat_code

    """Read JSON from disk and update the data object attributes."""
    path = Path(status_path)

    try:
        content = path.read_text(encoding="utf-8")

        # Parse the JSON string into a dictionary
        parsed_json = json.loads(content)
        beat_title = parsed_json.get("title", "")
        beat_code = parsed_json.get("code", "")

    except FileNotFoundError:
        beat_title = ""
        beat_code = ""

    except (json.JSONDecodeError, OSError) as exc:
        logging.warning("Failed to read or parse status file %s: %s", path, exc)
        beat_title = ""
        beat_code = ""
