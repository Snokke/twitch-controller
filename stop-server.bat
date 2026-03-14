@echo off
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":9999 "') do taskkill /PID %%a /F >nul 2>&1
echo Server stopped.
