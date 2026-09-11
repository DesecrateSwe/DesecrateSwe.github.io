@echo off
cd /d "%~dp0"
title Uppsala Hardrocksarkiv v2.6 - localhost:8086
start "" http://localhost:8086
py -m http.server 8086
pause
