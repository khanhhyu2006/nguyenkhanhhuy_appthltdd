@echo off
setlocal
cd /d "%~dp0"
php "%LOCALAPPDATA%\BillTrack\runtime\composer.phar" %*
