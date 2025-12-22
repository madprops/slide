import os

beat_title = ""
beat_code = ""
status_path = os.getenv("STATE_FILE", "status.json")


def persist_status() -> None:
    """Persist the latest beat data as JSON so it can be served without a fresh fetch."""
    path = Path(status_path)

    payload = {
        "title": beat_title,
        "code": beat_code
    }

    try:
        # Convert dictionary to a JSON-formatted string
        json_data = json.dumps(payload, indent=2)
        path.write_text(json_data, encoding="utf-8")

    except OSError as exc:
        logging.warning("Failed to write status file %s: %s", path, exc)