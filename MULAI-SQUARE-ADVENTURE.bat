@echo off
title SQUARE ADVENTURE
cd /d "%~dp0backend"
echo ==================================================
echo   SQUARE ADVENTURE - menjalankan server laptop
echo ==================================================

if not exist ".venv\Scripts\python.exe" (
  echo [1/2] Menyiapkan Python environment (sekali saja)...
  python -m venv .venv || (echo Python belum terpasang. Pasang Python 3.11+ dari python.org & pause & exit /b 1)
  ".venv\Scripts\python.exe" -m pip install -q -r requirements.txt
)
if not exist ".env" (
  copy ".env.example" ".env" >nul
  echo.
  echo [!] File backend\.env baru dibuat. Isi kredensial Supabase di file itu
  echo     lalu jalankan file ini lagi. Lihat README.md bagian Instalasi.
  notepad ".env"
  pause
  exit /b 0
)
if not exist "..\frontend\dist\index.html" (
  echo [!] Tampilan aplikasi belum dibuild. Jalankan: cd frontend ^&^& npm install ^&^& npm run build
  pause
  exit /b 1
)

echo.
echo Buka di laptop : http://localhost:8000
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do for /f "tokens=*" %%b in ("%%a") do echo Buka di HP     : http://%%b:8000  (Wi-Fi yang sama)
echo Tutup jendela ini untuk menghentikan server.
echo.
start "" http://localhost:8000
".venv\Scripts\python.exe" -m uvicorn app.main:app --host 0.0.0.0 --port 8000
pause
