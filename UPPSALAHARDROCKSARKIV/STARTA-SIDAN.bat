@echo off
cd /d "%~dp0"
title Uppsala Hardrocksarkiv v2.5 - localhost:8085
start "" http://localhost:8085
py -m http.server 8085
pause
