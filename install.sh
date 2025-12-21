#!/usr/bin/env bash
npm install &&
cd server &&
python3 -m venv venv &&
venv/bin/pip install -r requirements.txt &&