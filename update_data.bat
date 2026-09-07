@echo off
cd /d "%~dp0"
title KineChart - Cap Nhat Du Lieu Dinh Ky
color 0B

echo =======================================================
echo       CAP NHAT DU LIEU LICH SU VA DONG TIEN NGANH
echo =======================================================
echo.

echo [1/3] Cap nhat ty gia va lai suat...
python update_rates.py

echo [2/3] Cap nhat danh sach ma co phieu...
python update_symbols.py

echo [3/4] Tinh toan dong tien 1600+ co phieu va 158 nganh...
python calc_sector_history.py
python calc_sector_flow_history.py

echo [4/4] Tinh toan 4 pha luan chuyen dong tien RRG toan thi truong...
python update_rrg_cache.py

echo.
echo =======================================================
echo [OK] Hoan tat cap nhat du lieu thanh cong!
echo =======================================================
echo.
pause
