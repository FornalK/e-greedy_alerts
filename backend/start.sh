#!/bin/bash
rm -rf /opt/venv
python -m venv /opt/venv
source /opt/venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port $PORT