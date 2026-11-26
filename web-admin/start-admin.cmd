@echo off
setlocal
cd /d "%~dp0"
where.exe php >nul 2>&1
if errorlevel 1 (
  echo PHP is required. Add an approved PHP 8.3 or newer to PATH.
  exit /b 1
)
php artisan serve --host=127.0.0.1 --port=8766
