@echo off
cd /d "%~dp0"
title Uppsala Hardrocksarkiv v2.9 - localhost:8089
start "" http://localhost:8089
py -m http.server 8089
pause
