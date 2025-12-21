#!/usr/bin/env bash
cd server

# Activate the virtual environment
source venv/bin/activate

clear

# Run tools on the entire directory
ruff format .
ruff check .
mypy --strict .
pyright .

deactivate