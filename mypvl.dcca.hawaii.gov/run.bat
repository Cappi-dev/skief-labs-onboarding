@echo off
:loop
node test.js
echo ⚠️ Scraper exited. Restarting in 5 seconds...
timeout /t 5
goto loop