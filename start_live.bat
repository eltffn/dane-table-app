@echo off
echo Starting Live Node server (with auto-update)...
start "Live Node Server" /min cmd /c "cd /d "%~dp0" && node server_live.js > server_live.log 2>&1"
start http://localhost:3001/index_live.html
