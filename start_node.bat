@echo off
cd /d %~dp0
echo Starting Node server (non-live)...
start "Node Server" /min cmd /c "node server.js > server.log 2>&1"
start http://localhost:3000/index.html
