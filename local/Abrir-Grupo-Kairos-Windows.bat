@echo off
chcp 65001 >nul
title Grupo Kairos - site local
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0servidor-windows.ps1" -Pagina grupo/
pause
