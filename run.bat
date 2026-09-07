@echo off
cd /d "%~dp0"
title KineChart - He Thong Bang Gia (Port 8888)
color 0A

echo =======================================================
echo          KINECHART - KHOI DONG SIEU TOC (1S)
echo                 (MAY CHU CONG: 8888)
echo =======================================================
echo.

:: 1. Kiem tra Python
python --version > NUL 2>&1
if errorlevel 1 goto missing_python

:: 2. Don dep va giai phong port 8888 triet de
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8888 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" > NUL 2>&1
taskkill /f /im python.exe /fi "WINDOWTITLE eq SieuCoPhieu5*" > NUL 2>&1
taskkill /f /fi "WINDOWTITLE eq SieuCoPhieu5*" > NUL 2>&1
timeout /t 1 /nobreak > NUL

:: 3. Khoi dong Scraper & Backend (Dung cmd /k de khong bao gio bi tu dong tat cua so)
start "SieuCoPhieu5 Scraper" cmd /k "title SieuCoPhieu5 Scraper && python scrape_sieucophieu.py"
start "SieuCoPhieu5 Backend" cmd /k "title SieuCoPhieu5 Backend && python -m uvicorn main:app --host 127.0.0.1 --port 8888 --reload"

echo =======================================================
echo [OK] Backend dang chay tai http://127.0.0.1:8888
echo [OK] He thong khoi dong thanh cong trong 1 giay!
echo =======================================================
echo.
echo Dang mo trinh duyet...

:: Cho 2s de Backend khoi dong va mo trinh duyet
timeout /t 2 /nobreak > NUL
start http://127.0.0.1:8888/

echo.
color 0E
echo =======================================================
echo     BAM MOT PHIM BAT KY VAO DAY DE TAT TAT CA MAY CHU
echo =======================================================
pause > NUL

echo.
echo Dang don dep va tat cac tien trinh ngam...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8888 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" > NUL 2>&1
taskkill /f /im python.exe /fi "WINDOWTITLE eq SieuCoPhieu5*" > NUL 2>&1
taskkill /f /fi "WINDOWTITLE eq SieuCoPhieu5*" > NUL 2>&1
echo [OK] Da tat toan bo he thong an toan!
timeout /t 1 > NUL
exit /b

:missing_python
color 0C
echo [Loi] May tinh cua ban chua cai dat Python!
echo Vui long tai va cai dat Python tai: https://www.python.org/downloads/
echo.
pause
exit /b
