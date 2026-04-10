@echo off
TITLE Ashtadisha Dev Server
echo Starting Ashtadisha Local Server...
echo ---------------------------------
powershell -ExecutionPolicy Bypass -Command "if (where.exe python) { python server.py } else { powershell -ExecutionPolicy Bypass -File server.ps1 }"
pause
