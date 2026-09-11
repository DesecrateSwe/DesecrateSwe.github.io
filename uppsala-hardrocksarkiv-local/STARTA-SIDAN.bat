@echo off
cd /d "%~dp0"
title Uppsala Hardrocksarkiv v2.4 - localhost:8084
start "" http://localhost:8084
py -m http.server 8084
pause
