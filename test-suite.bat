@echo off
chcp 65001 >nul
title BrewLite - Chuong Trinh Kiem Thu Tu Dong & Phong Thu Chu Dong (SGU)
cls

:MENU
echo ===============================================================================
echo            BREWLITE - TRÌNH ĐIỀU KHIỂN KIỂM THỬ CHỦ ĐỘNG & BẢO VỆ ĐỒ ÁN
echo ===============================================================================
echo [1] Chạy TOÀN BỘ 278 bài test tự động (166 Backend Jest + 112 Frontend Vitest)
echo [2] Chạy TEST A: Chống sửa giá API & Phân quyền Barista (orders.security.spec.ts)
echo [3] Chạy TEST B: Hủy đơn sau thanh toán & Hoàn tiền (cancelOrder - REFUND_PENDING)
echo [4] Chạy TEST C: Tranh chấp tồn kho Concurrency 2 khách mua 2 ly cuối (OUT_OF_STOCK)
echo [5] Chạy TEST D: Định mức nguyên vật liệu BOM & Nút thắt Bottleneck (inventory.service.spec.ts)
echo [6] Chạy TOÀN BỘ 112 tests Giao diện Frontend Web (Cart, Menu, Auth, Stepper, Admin, Profile)
echo [7] Bật Playwright UI Graphic Mode (Trình duyệt Chromium tự động click trực quan)
echo [8] Mở PRISMA STUDIO (Xem Database trực quan trên giao diện Web localhost:5555)
echo [9] Chạy Kiểm tra Khói API Cloud Live (curl health & products)
echo [0] Thoát
echo ===============================================================================
set /p opt=">>> Nhập lựa chọn của bạn (0-9) rồi bấm ENTER: "

if "%opt%"=="1" goto RUN_ALL
if "%opt%"=="2" goto RUN_TEST_A
if "%opt%"=="3" goto RUN_TEST_B
if "%opt%"=="4" goto RUN_TEST_C
if "%opt%"=="5" goto RUN_TEST_D
if "%opt%"=="6" goto RUN_WEB
if "%opt%"=="7" goto RUN_PLAYWRIGHT
if "%opt%"=="8" goto RUN_PRISMA
if "%opt%"=="9" goto RUN_SMOKE
if "%opt%"=="0" goto EXIT
goto MENU

:RUN_ALL
cls
echo [INFO] Đang chạy toàn bộ 269 bài test trong Monorepo...
call npm test
echo.
pause
goto MENU

:RUN_TEST_A
cls
echo [INFO] Đang chạy TEST A (Chống sửa giá & Chặn thuộc tính ngoài DTO)...
call npx --workspace=apps/api jest -t "TEST A"
echo.
pause
goto MENU

:RUN_TEST_B
cls
echo [INFO] Đang chạy TEST B (Hủy đơn & Hoàn kho & REFUND_PENDING)...
call npx --workspace=apps/api jest -t "TEST B"
echo.
pause
goto MENU

:RUN_TEST_C
cls
echo [INFO] Đang chạy TEST C (Atomic CAS Concurrency & Chống Overselling)...
call npx --workspace=apps/api jest -t "OUT_OF_STOCK"
echo.
pause
goto MENU

:RUN_TEST_D
cls
echo [INFO] Đang chạy TEST D (Định mức nguyên vật liệu BOM, Nút thắt Bottleneck & Chặn ly thứ 21)...
call npx --workspace=apps/api jest src/inventory/inventory.service.spec.ts
echo.
pause
goto MENU

:RUN_WEB
cls
echo [INFO] Đang chạy 112 bài test Frontend Web...
call npm run test --workspace=apps/web
echo.
pause
goto MENU

:RUN_PLAYWRIGHT
cls
echo [INFO] Đang khởi chạy Playwright Visual UI...
call npx playwright test --ui
echo.
pause
goto MENU

:RUN_PRISMA
cls
echo [INFO] Đang mở Prisma Studio trên cổng 5555...
echo Mở trình duyệt tại: http://localhost:5555
call npx --workspace=apps/api prisma studio
echo.
pause
goto MENU

:RUN_SMOKE
cls
echo [INFO] Đang kiểm tra API Cloud Live...
echo 1. Health check:
curl.exe -s https://brewlite-a2.onrender.com/health
echo.
echo 2. Menu Catalog:
curl.exe -s https://brewlite-a2.onrender.com/products
echo.
pause
goto MENU

:EXIT
exit
