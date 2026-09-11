@echo off
cd /d "%~dp0"
title Uppsala Hardrocksarkiv v2.7 - localhost:8087
start "" http://localhost:8087
py -m http.server 8087
pause
