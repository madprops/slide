from __future__ import annotations

import re
import json
import atexit
import logging
from pathlib import Path
from typing import Any
from flask import Response, send_from_directory, render_template, request  # type: ignore

import auto
import utils
from app import app

PORT = 4242
SONG_LIST_LIMIT = 100
ENABLE_AI_INTERVAL = False

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s"
)


@app.route("/", methods=["GET"])  # type: ignore
def index() -> Any:
    """Serve the main HTML page."""

    song_name = request.args.get("song", "")
    song_value = re.sub(r"_+", " ", song_name) if song_name else ""
    song_value = song_value.title()

    beat_title = request.args.get("beat", "")
    beat_value = re.sub(r"_+", " ", beat_title) if beat_title else ""

    song_display = song_value or beat_value or ""

    return render_template(
        "index.jinja",
        song_name=song_name,
        song_display=song_display,
        config=utils.CONFIG,
        commit_hash=utils.COMMIT_HASH,
    )


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


@app.route("/samples/<path:filename>", methods=["GET"])  # type: ignore
def sample_assets(filename) -> Response:
    return send_from_directory("samples", filename)


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
def songs_assets(filename) -> Response:
    return send_from_directory("songs", filename)


@app.route("/song/<path:song_name>", methods=["GET"])  # type: ignore
def song_shortcut(song_name: str) -> Any:
    """Render HTML page with song name in title and meta tags."""

    song_display = re.sub(r"_+", " ", song_name)
    return render_template("index.html", song_name=song_name, song_display=song_display)


def main() -> None:
    utils.load_config()
    auto.load_status()
    utils.load_creds()
    app.secret_key = utils.CREDS["secret_key"]

    if ENABLE_AI_INTERVAL:
        auto.load_api_key()
        auto.load_instructions()
        auto.start_worker_if_needed()
    else:
        logging.info("AI interval disabled; worker not started")

    auto.start_auto()
    atexit.register(auto.shutdown_worker)
    app.run(host="0.0.0.0", port=PORT, debug=False)


if __name__ == "__main__":
    main()
