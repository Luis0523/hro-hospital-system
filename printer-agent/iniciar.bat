@echo off
chcp 65001 >nul
cd /d "%~dp0"
title HRO Print Agent
node src\server.js
pause
