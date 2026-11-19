@echo off
chcp 65001 >nul
title Dalas Marketing - site local
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0servidor-windows.ps1"
pause
