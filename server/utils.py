from __future__ import annotations

import subprocess
import logging
import sys
import json
from pathlib import Path

CONFIG = {}
CREDS = {}
CONFIG_FILE = "config/config.json"
CREDS_FILE = "config/creds.json"


def strip_markdown_code_fences(text: str) -> str:
    """Remove triple-backtick markdown fences that may wrap code blocks."""

    if not text:
        return text

    lines = text.strip().splitlines()
    cleaned_lines = [line for line in lines if not line.strip().startswith("```")]

    cleaned = "\n".join(cleaned_lines).strip()
    return cleaned if cleaned else text.strip()


def echo(s: str) -> None:
    print(s)  # noqa: T201


def get_git_commit_hash() -> str:
    """Retrieves the current git commit hash."""
    try:
        # Get the short hash (first 7 characters)
        return (
            subprocess.check_output(
                ["git", "rev-parse", "--short", "HEAD"], stderr=subprocess.STDOUT
            )
            .decode("utf-8")
            .strip()
        )
    except (subprocess.CalledProcessError, FileNotFoundError):
        return "unknown"


COMMIT_HASH = get_git_commit_hash()


def load_config() -> None:
    """Load application configuration from config.json"""

    global CONFIG

    config_path = Path(CONFIG_FILE)

    try:
        config_content = config_path.read_text(encoding="utf-8")
        CONFIG = json.loads(config_content)
        logging.info("Loaded config")
    except Exception as e:
        logging.critical("Config Error: %s", e, exc_info=True)
        sys.exit(1)


def load_creds() -> None:
    """Load credentials from creds.json"""

    global CREDS

    creds_path = Path(CREDS_FILE)

    try:
        creds_content = creds_path.read_text(encoding="utf-8")
        CREDS = json.loads(creds_content)
        logging.info("Loaded creds")
    except Exception as e:
        logging.critical("Creds Error: %s", e, exc_info=True)
        sys.exit(1)
