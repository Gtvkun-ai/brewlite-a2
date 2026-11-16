# BrewLite — Báo cáo audit nghiệm thu demo

Ngày nghiệm thu: **14/11/2026**, giờ Việt Nam. Tổng hợp lúc 21:51:36 14/11/2026. Kết luận: **PASS toàn bộ yêu cầu chức năng đã giao**, gồm điểm cộng Admin.

## 1. Phạm vi và môi trường

- Kế hoạch: [demo-acceptance-plan.md](../../demo-acceptance-plan.md); [ma trận truy vết](../../traceability-matrix.md).
- Web production build: http://localhost:3100; NestJS API: http://localhost:3101; PostgreSQL 16: database riêng `brewlite_demo` ở `127.0.0.1:55432`.
- Dữ liệu menu/đơn/thanh toán/quản trị được gửi qua HTTP thật và lưu PostgreSQL. `NEXT_PUBLIC_USE_FIXTURES=false`. Cổng thanh toán ở phía máy chủ là mô phỏng theo đề bài.
- Google Chrome **có cửa sổ hiển thị**, desktop 1440×1000 và viewport mobile 390×844; viewport mobile được kiểm tra trong Chrome desktop, chưa kiểm tra trên điện thoại vật lý.
- Browser suite tắt service worker để kết quả nhất quán. [Kiểm tra riêng ranh giới cache](service-worker-boundary.json) xác nhận API và trang động không bị SW cache. Chưa nghiệm thu cài PWA/offline shell toàn diện.
- Chạy local trên nhánh `feature/admin-frontend`; kết quả này không đại diện cho deployment live hay CI từ xa.

## 2. Đối chiếu yêu cầu

| Yêu cầu | Kết quả và bằng chứng |
|---|---|
| Cuộn menu, chuyển Cà phê / Trà / Bánh | PASS. Đếm số món theo dữ liệu API khi chọn từng danh mục. [Cà phê](screenshots/desktop-01-menu-Coffee.png), [Trà](screenshots/desktop-01-menu-Tea.png), [Bánh](screenshots/desktop-01-menu-Pastry.png). |
| Cà phê muối: đường 70%, đá 50%, Large, topping | PASS. [Ảnh cấu hình](screenshots/desktop-02-customization-70-50-large-topping.png); giữ cấu hình sau reload, gửi `selectedSugar=70`, `selectedIce=LESS`, `selectedSize=LARGE`, `TRAN_CHAU`. |
| Cart Drawer trượt ra, tự tính tổng | PASS. [Giỏ hàng](screenshots/desktop-03-cart-drawer-54000.png). Giá 39.000 + Large 10.000 + trân châu 5.000 = **54.000đ**; tăng 2 ly thành 108.000đ, giảm về 54.000đ; Escape đóng được. |
| Tiến hành đặt hàng → Thẻ/Ví → Xác nhận thanh toán | PASS. [Ví desktop](screenshots/desktop-04-wallet-checkout.png), [Thẻ mobile](screenshots/mobile-03-card-checkout.png). API tự tính tiền; payload khách không gửi tổng giá. |
| Tự chuyển chi tiết, mã đơn, stepper thời gian thực | PASS. Đơn **BL-20261114-Q2TW** tự chuyển đúng ID, quan sát PAID → PREPARING → READY → COMPLETED không reload. Sau reload vẫn COMPLETED. [Chi tiết dữ liệu](desktop-flow.json). |
| Admin đăng nhập đúng tài khoản | PASS. `admin@brewlite.vn / Password123!`, vào `/admin/products` ngay sau login. [Trang quản trị](screenshots/admin-01-products.png). |
| Admin bật/tắt Còn hàng/Hết hàng | PASS. PATCH thật; phiên khách độc lập tải lại menu thấy hết món và nút thêm bị khóa. Bật lại sau test. [Admin tắt món](screenshots/admin-02-salt-unavailable.png), [khách hết món](screenshots/admin-03-customer-out-of-stock.png). |
| Admin thêm 1 món mới | PASS. Thêm **Trà sen demo 50605**, SKU `AUD-1794667850605`, 42.000đ, tồn 12 bằng form ở viewport 390px; DB lưu và khách tải lại thấy món. [Form](screenshots/admin-04-create-product-form.png), [menu khách](screenshots/admin-06-new-product-customer-menu.png). |
| Mobile | PASS. Menu, tùy biến, drawer, checkout, chi tiết và form Admin không tràn ngang ở 390px. Kết quả chi tiết đơn: scrollWidth=390, viewport=390. [Ảnh](screenshots/mobile-04-order-detail.png). |

Realtime của đơn: frontend poll API mỗi 3 giây. Khi chạy demo, `DEMO_ORDER_PROGRESSION=true` và API ngoài production chuyển trạng thái thật trong DB sau khoảng 10–12 giây/step; đây là mô phỏng quầy pha chế. Khi tắt cờ, nhân viên cập nhật trạng thái qua API có phân quyền. Menu khách được nghiệm thu sau reload; cập nhật khi focus được kiểm thử bằng unit test, không tính là cam kết realtime đa cửa sổ.

## 3. Kiểm tra lỗi và toàn vẹn dữ liệu

- [Thanh toán thất bại rồi thử lại](payment-retry.json): `DEMO-0000` bị từ chối, tồn kho được trả lại; `DEMO-1234` thành công trên **cùng đơn**, đổi khóa thanh toán và trừ kho đúng một lần.
- [Mất mạng khi theo dõi](screenshots/desktop-06-tracking-offline-retains-order.png): giữ chi tiết cũ, hiển thị mất kết nối, hồi phục và theo dõi tiếp.
- [Khách chưa login và mất mạng khi checkout](guest-offline-flow.json): giỏ được giữ sau login; mất mạng báo lỗi và không bịa giao dịch thành công; kết nối lại đặt được đơn thật.
- [API negative cases](real-api-negative-cases.json): chưa login tạo món → **401**; CUSTOMER tạo món → **403**; sửa giá qua `price=1` → **400**; đường 69% → **400**.
- [Đối chiếu trực tiếp PostgreSQL](database-verification.json): kiểm tra 4 đơn từ browser, cấu hình 70/50, tổng 54.000đ, hai lần thử thanh toán FAILED/SUCCESS, món mới và trạng thái Cà phê muối đã bật lại.
- Browser suite kiểm tra không có JavaScript `pageerror`. Các lỗi mạng cố ý tạo trong test được ghi riêng trong trace.

## 4. Kết quả kiểm chứng

| Kiểm tra | Kết quả | Log |
|---|---|---|
| Lint cả monorepo | PASS | [lint.log](checks/lint.log) |
| Backend unit/integration | **110/110 PASS** | [api-tests.log](checks/api-tests.log) |
| Frontend unit/component | **95/95 PASS** | [web-tests.log](checks/web-tests.log) |
| NestJS + Next.js production build/typecheck | PASS | [build.log](checks/build.log) |
| Chrome thật / API thật | **6/6 PASS**, 0 skip, 0 retry | [results.json](results.json), [HTML Playwright](playwright-report/index.html) |
| Fixture suite cũ | 5 PASS, **6 SKIPPED**; không tính skipped thành pass | [fixture-suite.json](fixture-suite.json) |
| git diff --check | PASS | [diff-check.log](checks/diff-check.log) |

Tổng **205** unit/integration/component test PASS. Các test thật nằm trong [demo-acceptance.spec.ts](../../../tests/real-browser/demo-acceptance.spec.ts); cấu hình [playwright.real.config.ts](../../../playwright.real.config.ts).

## 5. Lỗi đã phát hiện và xử lý

| Lỗi | Cách xử lý | Bằng chứng hồi quy |
|---|---|---|
| Đường/đá chỉ nằm trong ghi chú chung, món khác cấu hình bị gộp | Field từng item, migration bổ sung, DTO validation, nhận diện đầy đủ cấu hình | customization/cart test, orders-customization test, DB snapshot |
| Phản hồi login chỉ có token nhưng frontend tự gán CUSTOMER | Đọc profile xác thực từ /auth/me, chuẩn hóa userId → id, giữ role thật; xóa phiên không hợp lệ | auth-contract tests, admin browser |
| Thiếu accountRef và retry phát lại giao dịch FAILED | Tài khoản mô phỏng mặc định; khóa mới cho lần thử sau khi đã xác nhận FAILED | payment-retry.json |
| Thành công vẫn ở checkout; detail đứng yên | Điều hướng đúng order ID; polling có cleanup, giữ dữ liệu khi mất mạng | desktop-flow.json |
| Thiếu Cà phê muối trong seed; reseed ghi đè tồn kho | Thêm CF-SALT; seed giữ sản phẩm đã có | API catalog, DB |
| Admin mất lỗi, gửi trước xác thực, nhập 0 tồn kho thành 100 | Guard UI/API, trạng thái đang gửi, thông báo lỗi, validation và giữ 0 | admin/catalog tests |
| Form giá min=1, step=1000 chặn giá 42.000đ trước khi gọi API | Đổi bước nhập thành 1 đồng; kiểm tra native checkValidity | admin component regression, form Chrome mobile gửi POST 201 |
| Mobile tràn 614px ở viewport 390px | Navbar hai hàng, giới hạn nội dung; bảng admin cuộn ngang trong khung, form một cột | mobile-flow.json, ảnh Admin mobile |
| Đổi tab nhanh bỏ qua refresh do throttle | Bỏ throttle bỏ lượt; giữ cơ chế phản hồi mới nhất | menu regression dưới 500ms |
| API mất mạng tự trả catalog/auth/order/payment giả | Catalog/auth chỉ fixture khi bật rõ ràng; order/payment không tự tạo kết quả giả | catalog/auth/checkout API tests, guest browser |
| Demo worker có thể đụng cập nhật/hủy đơn | Hủy dùng row lock, staff update CAS; worker CAS DB, chỉ bật ngoài production | order service + worker tests |

Lịch sử chạy lỗi ban đầu: [initial-results.json](initial-results.json), [intermediate-results.json](intermediate-results.json), [focus-regression-results.json](focus-regression-results.json). Kết luận cuối dùng `results.json`; các ảnh `FAILED-*` là lịch sử, không phải ảnh kết quả cuối.

## 6. Điểm còn lại

`npm audit --omit=dev` ghi nhận **12 cảnh báo dependency**: 6 high, 4 moderate, 2 low, 0 critical. Xem [dependency-audit.json](dependency-audit.json). Một số khuyến nghị nâng major Prisma/Next.js; chưa nâng major trong nhiệm vụ này. Đây là backlog an ninh trước production, tách khỏi kết luận nghiệm thu chức năng local.

Chưa nghiệm thu thiết bị mobile vật lý, live deployment, load test hay cổng thanh toán thật. Sáu placeholder skip trong fixture suite cũ vẫn được ghi nhận skip; bộ Chrome/API thật mới cung cấp bằng chứng cho luồng đã giao.

## 7. Chạy lại và xem evidence

Từ thư mục gốc dự án:

```bash
npm install
node scripts/demo.cjs prepare
node scripts/verify-demo.cjs
node scripts/demo.cjs start
# Terminal khác, khi app đã chạy:
npx playwright test -c playwright.real.config.ts
node scripts/audit-demo-database.cjs
node scripts/render-demo-audit.cjs
npx playwright show-report docs/evidence/demo-acceptance-2026-11-14/playwright-report
```

[Báo cáo ảnh mở trực tiếp](AUDIT.html). Mỗi video và trace dưới đây được tạo bởi lần chạy Chrome cuối:

| Kịch bản | Giây | Video | Trace |
|---|---:|---|---|
| Desktop: menu, 70/50 Large topping, drawer, wallet, live order progression | 38.2 | [video](browser-artifacts/demo-acceptance-Desktop-me-5ee6c-llet-live-order-progression/video.webm) | [trace.zip](browser-artifacts/demo-acceptance-Desktop-me-5ee6c-llet-live-order-progression/trace.zip) |
| Mobile 390px: customized drink and simulated card checkout | 2.9 | [video](browser-artifacts/demo-acceptance-Mobile-390-3b020-and-simulated-card-checkout/video.webm) | [trace.zip](browser-artifacts/demo-acceptance-Mobile-390-3b020-and-simulated-card-checkout/trace.zip) |
| Payment failure and retry: same order, fresh attempt, inventory deducted once | 3.6 | [video](browser-artifacts/demo-acceptance-Payment-fa-12e0b-mpt-inventory-deducted-once/video.webm) | [trace.zip](browser-artifacts/demo-acceptance-Payment-fa-12e0b-mpt-inventory-deducted-once/trace.zip) |
| Admin: real login, availability toggle reaches customer, new product persists | 2.8 | [video](browser-artifacts/demo-acceptance-Admin-real-c7ae6-stomer-new-product-persists/video.webm) | [trace.zip](browser-artifacts/demo-acceptance-Admin-real-c7ae6-stomer-new-product-persists/trace.zip) |
| Real API negatives: unauthenticated/customer admin denied, server price and option validation | 0.8 | [video](browser-artifacts/demo-acceptance-Real-API-n-82422-price-and-option-validation/video.webm) | [trace.zip](browser-artifacts/demo-acceptance-Real-API-n-82422-price-and-option-validation/trace.zip) |
| Guest cart survives login and offline checkout never fabricates a paid order | 3.7 | [video](browser-artifacts/demo-acceptance-Guest-cart-b06d2-ver-fabricates-a-paid-order/video.webm) | [trace.zip](browser-artifacts/demo-acceptance-Guest-cart-b06d2-ver-fabricates-a-paid-order/trace.zip) |

Mở trace bằng `npx playwright show-trace <đường-dẫn-trace.zip>`. [SHA-256 manifest](manifest-sha256.json) ghi kích thước và hash các artifact để đối chiếu. Tài khoản và token trong trace chỉ thuộc database demo cục bộ.
