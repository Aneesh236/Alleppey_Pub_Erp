@echo off
title Alleppey Pub ERP AI
cd /d "%~dp0backend"

echo Installing the local AI server requirements...
python -m pip install -r requirements.txt

echo.
echo Starting Alleppey Pub ERP AI at http://127.0.0.1:8000
echo Keep this window open while using the ERP.
echo.
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000

pause
