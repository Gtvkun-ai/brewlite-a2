# BẢN ĐỒ TỔNG QUÁT CỰC ĐẠI: ĐỐI SOÁT TOÀN DIỆN A1 – A2 & VỊ TRÍ BỘ KIỂM THỬ
## (The Ultimate Master Blueprint: A1 vs A2, Architecture & Full Test Suite Map)

> **Dành cho:** Thành viên bảo vệ đồ án Công nghệ Phần mềm – ĐH Sài Gòn (SGU)  
> **Mục tiêu:** Xâu chuỗi toàn bộ hệ thống, xóa bỏ cảm giác "hiểu tùm lum", định vị chính xác từng file test và hiểu rõ sự tiến hóa từ A1 lên A2.

---

## 1. VÌ SAO BẠN BỊ CẢM GIÁC "HIỂU TÙM LUM"? VÀ ĐÂU LÀ "SỢI CHỈ ĐỎ"?

Bạn thấy rối vì trong đầu bạn đang bị lẫn lộn giữa:
1. Hai phiên bản đồ án (**A1** và **A2**) nằm ở hai thư mục khác nhau.
2. Nhiều tầng kỹ thuật (**Next.js, Zustand/Context, NestJS Controller, Guard, Service, Prisma, PostgreSQL**).
3. Hàng chục file test rải rác ở khắp nơi (`__tests__`, `spec.ts`, `tests/e2e`).

### 🗝️ "Sợi chỉ đỏ" duy nhất xâu chuỗi tất cả:
> **MỌI THỨ TRONG BREWLITE ĐỀU XOAY QUANH VÒNG ĐỜI CỦA 1 ĐƠN HÀNG.**  
> Nếu bạn bám chặt vào hành trình của 1 ly cà phê từ lúc khách bấm chọn $\to$ trừ kho $\to$ thanh toán $\to$ barista pha chế $\to$ hoàn tất (hoặc hủy đơn), bạn sẽ thấy **mọi file code và mọi file test đều sinh ra chỉ để phục vụ và bảo vệ hành trình này!**

---

## 2. SƠ ĐỒ TỔNG QUÁT CỰC DÀI (GIANT MASTER FLOWCHART)

Sơ đồ này mô tả toàn bộ vòng đời của hệ thống: từ Client $\to$ Gateways $\to$ Backend Modules $\to$ Database $\to$ Bộ kiểm thử $\to$ Triển khai Cloud.

```mermaid
flowchart TD
    subgraph CLIENT["1. TẦNG KHÁCH HÀNG (Frontend: Next.js PWA)"]
        UI_MENU["Trang Menu: apps/web/app/page.tsx<br>(Xem danh mục, giá niêm yết)"]
        UI_CUSTOM["Tùy biến món: ProductOptionSelector.tsx<br>(Chọn Size Regular/Large + Topping)"]
        UI_CART["Giỏ hàng: CartContext.tsx & cart/page.tsx<br>(Lưu LocalStorage, gộp/tách dòng)"]
        UI_AUTH["Đăng nhập/Đăng ký: login/page.tsx, register/page.tsx<br>(Lưu Bearer JWT vào AuthContext)"]
        UI_CHECKOUT["Thanh toán: checkout/page.tsx<br>(Sinh UUID Idempotency-Key, khóa nút chống double-click)"]
        UI_ORDERS["Theo dõi đơn: orders/page.tsx, OrderStepper.tsx<br>(Hiển thị Stepper 4 bước thời gian thực)"]
    end

    subgraph PIPELINE["2. KIỂM SOÁT ĐẦU VÀO (NestJS Ingress & Guards)"]
        GUARD_JWT["JwtAuthGuard (jwt-auth.guard.ts)<br>Giải mã Token, xác thực danh tính userId"]
        GUARD_ROLE["RolesGuard (roles.guard.ts)<br>Chặn Customer gọi API của Barista/Admin"]
        PIPE_VALID["ValidationPipe (main.ts)<br>Whitelist DTO, chặn đứng giá giả chèn từ client (TEST A)"]
    end

    subgraph CORE_MODULES["3. TẦNG NGHIỆP VỤ LÕI (NestJS Application Services)"]
        SVC_AUTH["AuthService (auth.service.ts)<br>- Băm mật khẩu bcrypt 12 vòng<br>- Ký JWT Access Token"]
        SVC_CATALOG["ProductsService (products.service.ts)<br>- Trả danh mục món<br>- Kiểm tra tồn kho & cờ isAvailable"]
        SVC_ORDER["OrdersService (orders.service.ts)<br>- Server-authoritative Pricing (tự tính giá từ DB)<br>- Atomic Conditional Decrement (chống bán âm kho - TEST C)<br>- Cancel & Hoàn kho (TEST B)"]
        SVC_PAY["PaymentsService (payments.service.ts)<br>- Kiểm tra Idempotency-Key (chống trừ tiền 2 lần)<br>- Gọi MockPaymentGateway mô phỏng giao dịch"]
    end

    subgraph PERSISTENCE["4. TẦNG CƠ SỞ DỮ LIỆU (PostgreSQL 16 via Prisma ORM)"]
        PRISMA_TX["Prisma.$transaction (ACID)<br>Đảm bảo toàn bộ thao tác Trừ kho + Tạo đơn + Thanh toán là nguyên tử"]
        DB_TABLES[("Bảng PostgreSQL:<br>- User (id, email, passwordHash, role)<br>- Product (id, basePrice, stockQuantity, isAvailable)<br>- Order (id, code, userId, status, totalAmount, idempotencyKey)<br>- OrderItem (id, orderId, productId, unitPrice, quantity)<br>- Payment (id, orderId, status, idempotencyKey)")]
    end

    subgraph AUDIT_TESTS["5. BỘ TỨ THẨM TRA GIẢNG VIÊN (Audit Scenarios)"]
        TEST_A["TEST A: Chống sửa giá client<br>Client chèn price: 1000 ➔ 400 Bad Request"]
        TEST_B["TEST B: Hủy đơn đã trả tiền<br>Order: CANCELLED ➔ Kho +1 ➔ Payment: REFUND_PENDING"]
        TEST_C["TEST C: Tranh chấp 2 khách mua ly cuối<br>UPDATE có WHERE stockQuantity >= qty ➔ 1 khách Win, 1 khách Out of stock"]
        TEST_D["TEST D: Định mức nguyên vật liệu BOM<br>Số ly tối đa = min(Nguyên liệu_i / Định mức_i)"]
    end

    subgraph DEPLOY["6. HẠ TẦNG TRIỂN KHAI PRODUCTION & CI/CD"]
        CI_GITHUB["GitHub Actions (.github/workflows/ci.yml)<br>Pipeline 4 bước: Install ➔ Lint ➔ Test ➔ Build"]
        CRON_PING["Keep-Alive Cron (.github/workflows/keep-alive.yml)<br>Ping /health định kỳ mỗi 14 phút chống Render ngủ đông"]
        CLOUD_VERCEL["Frontend: Vercel Edge CDN<br>https://brewlite-a2.vercel.app"]
        CLOUD_RENDER["Backend: Render Docker Container<br>https://brewlite-a2.onrender.com"]
    end

    %% Mối liên kết luồng
    UI_MENU --> UI_CUSTOM --> UI_CART --> UI_CHECKOUT
    UI_AUTH -. Cấp JWT Bearer .-> UI_CHECKOUT
    UI_CHECKOUT --> GUARD_JWT
    GUARD_JWT --> GUARD_ROLE --> PIPE_VALID
    PIPE_VALID --> SVC_ORDER
    SVC_ORDER --> SVC_CATALOG
    SVC_ORDER --> SVC_PAY
    SVC_ORDER --> PRISMA_TX
    PRISMA_TX --> DB_TABLES
    SVC_PAY --> UI_ORDERS

    %% Liên kết kiểm thử
    PIPE_VALID -. Chứng minh bởi .-> TEST_A
    SVC_ORDER -. Chứng minh bởi .-> TEST_B
    SVC_ORDER -. Chứng minh bởi .-> TEST_C
    SVC_CATALOG -. Chứng minh bởi .-> TEST_D

    %% Triển khai
    CI_GITHUB --> CLOUD_VERCEL
    CI_GITHUB --> CLOUD_RENDER
    CRON_PING -. Giữ ấm .-> CLOUD_RENDER
```

---

## 3. BẢNG SO SÁNH ĐỐI ỨNG CHI TIẾT: BREWLITE A1 vs BREWLITE A2

| Tiêu chí | BrewLite A1 (`brewlite`) | BrewLite A2 (`brewlite-a2`) | Ý nghĩa kỹ nghệ phần mềm |
| :--- | :--- | :--- | :--- |
| **Cấu trúc Repo** | Hai thư mục tách rời: `backend/` và `frontend/`. | **Monorepo chuẩn npm workspaces:** `apps/api` và `apps/web`. | Tối ưu hóa việc chia sẻ types, quản lý dependencies tập trung và build CI đồng nhất. |
| **Kiểm soát ranh giới** | Dùng script tùy biến `verify-foundation.mjs` ép import qua `public.ts`. | Sử dụng **NestJS Modular Architecture** với module encapsulation chính thống (`exports`, `imports`). | Tuân thủ chuẩn kiến trúc doanh nghiệp, giảm sự phụ thuộc vào các script tùy biến tự viết. |
| **Phạm vi tính năng** | Dàn trải rộng: có cả Rewards, Loyalty Points, Voucher GIAM10, Quản lý kho nguyên liệu BOM. | **Tập trung sâu vào MVP:** Đặt món $\to$ Giỏ hàng $\to$ Thanh toán an toàn $\to$ Lịch sử đơn. Hoãn (`Deferred`) Voucher theo `api-contracts.md`. | Đúng tinh thần Agile: Ưu tiên hoàn thiện trọn vẹn luồng cốt lõi và tính toàn vẹn dữ liệu thay vì làm nhiều mà lỗi. |
| **Tài liệu & Truy vết** | User Stories cơ bản, các file tài liệu rời rạc, chưa có ma trận truy vết chính quy. | **Hệ thống 5 Task chuẩn mực:** SRS, PlantUML Diagrams, 5 ADRs, và **Traceability Matrix (`traceability-matrix.md`)**. | Đáp ứng yêu cầu Mục 8.1 của đề bài: Mọi chức năng và test case đều truy vết được 2 chiều về Use Case và Sơ đồ thiết kế. |
| **Hạ tầng triển khai** | Chủ yếu chạy cục bộ qua `docker-compose.yml`. | **Production Cloud 100% có HTTPS:** Vercel (PWA) + Render (NestJS Docker) + PostgreSQL Cloud + GitHub Keep-Alive Cron. | Chuyển từ "phần mềm chỉ chạy ở máy tôi" sang "hệ thống thực tế phục vụ người dùng có SLA và giám sát". |
| **Bộ kiểm thử** | Unit test rời rạc (chủ yếu Vitest cục bộ). | **128 tests pass 100%:** Jest cho Backend, Vitest cho Frontend, Playwright cho E2E, Supertest cho API Security. | Đảm bảo chất lượng nghiêm ngặt trước khi merge code vào `main`. |

---

## 4. TỌA ĐỘ VÀ BẢN ĐỒ VỊ TRÍ TOÀN BỘ FILE TEST

Dưới đây là "bản đồ tọa độ" của tất cả các bài test trong dự án. Khi Thầy Cô hỏi: *"Bài test này nằm ở đâu? Chạy như thế nào?"*, bạn chỉ cần tra bảng này:

### 4.1. Bộ kiểm thử Backend API (`apps/api/`) – Framework: Jest & Supertest
> **Lệnh chạy:** `npm run test --workspace @brewlite/api` (68 tests PASS)

| Mã Test | Đường dẫn file Test | Lệnh chạy riêng file đó | Mục tiêu kiểm thử & Ca lỗi phát hiện |
| :---: | :--- | :--- | :--- |
| `API-T01` | `apps/api/src/catalog/products.service.spec.ts`<br>`apps/api/src/catalog/products.controller.spec.ts` | `npx jest src/catalog/products.service.spec.ts` | - Truy vấn menu đồ uống.<br>- Xem chi tiết món theo ID.<br>- Kiểm tra cờ `isAvailable` và số lượng tồn kho. |
| `API-T02` | `apps/api/src/auth/auth.security.spec.ts`<br>`apps/api/src/auth/jwt.config.spec.ts` | `npx jest src/auth/auth.security.spec.ts` | - **Bảo mật:** Băm bcrypt 12 vòng, không lộ hash.<br>- Chặn đăng ký trùng email (409 Conflict).<br>- Chặn khách hàng tự gán quyền `ADMIN`/`BARISTA`.<br>- Kiểm tra token hết hạn, sai chữ ký, thiếu Bearer header. |
| `API-T03`<br>`INT-T01` | `apps/api/src/orders/orders.service.spec.ts`<br>`apps/api/src/orders/orders.controller.spec.ts`<br>`apps/api/src/orders/orders.security.spec.ts` | `npx jest src/orders/orders.service.spec.ts` | - **TEST A (Security):** Chặn client gửi trường `price: 1000` (400 Bad Request).<br>- **TEST C (Concurrency):** Trừ kho nguyên tử, chặn 2 khách mua ly cuối cùng gây âm kho.<br>- Chặn đơn hàng không có món (empty items). |
| `API-T04` | `apps/api/src/orders/orders.service.spec.ts` (L300+) | `npx jest src/orders/orders.controller.spec.ts` | - **State Machine:** Chuyển trạng thái đơn `PAID ➔ PREPARING ➔ READY ➔ COMPLETED`.<br>- Chặn bước nhảy trạng thái sai (ví dụ: `PENDING ➔ COMPLETED`).<br>- Phân quyền RBAC: Chỉ Staff mới được cập nhật trạng thái đơn. |
| `API-T06`<br>`INT-T02` | `apps/api/src/payments/payments.service.spec.ts`<br>`apps/api/src/payments/mock-gateway.service.spec.ts` | `npx jest src/payments/payments.service.spec.ts` | - **TEST B:** Hủy đơn đã thanh toán $\to$ hoàn trả tồn kho và chuyển payment sang `REFUND_PENDING`.<br>- **Idempotency:** Bấm thanh toán 2 lần liên tiếp không bị trừ tiền 2 lần.<br>- Xử lý khi tài khoản kết thúc bằng `0000` (mô phỏng lỗi giao dịch). |
| `SMOKE-01` | `apps/api/src/health/health.controller.spec.ts` | `npx jest src/health/health.controller.spec.ts` | - Kiểm tra endpoint `/health` trả về HTTP 200.<br>- Xác nhận kết nối Database PostgreSQL đang sống (`status: ok, database: up`). |

---

### 4.2. Bộ kiểm thử Frontend Web (`apps/web/`) – Framework: Vitest & React Testing Library
> **Lệnh chạy:** `npm run test --workspace @brewlite/web` (60 tests PASS)

| Mã Test | Đường dẫn file Test | Lệnh chạy riêng file đó | Mục tiêu kiểm thử Component giao diện |
| :---: | :--- | :--- | :--- |
| `WEB-T01` | `apps/web/__tests__/menu.test.tsx` | `npx vitest run __tests__/menu.test.tsx` | - Hiển thị 3 trạng thái giao diện: **Loading**, **Empty** và **Error + Nút Thử lại (Retry)**.<br>- Hiển thị danh sách sản phẩm và bộ lọc danh mục. |
| `WEB-T02`<br>`WEB-T03` | `apps/web/__tests__/cart.test.tsx` | `npx vitest run __tests__/cart.test.tsx` | - Tùy biến size Regular/Large (+10.000đ) và Topping.<br>- Giỏ hàng: Gộp dòng nếu cùng tùy biến, tách dòng nếu khác.<br>- Tăng/giảm số lượng, xóa món, tính tổng tiền tức thì.<br>- Payload gửi sang Checkout **tuyệt đối không kèm giá tiền của client**. |
| `WEB-T04` | `apps/web/__tests__/auth.test.tsx` | `npx vitest run __tests__/auth.test.tsx` | - Form Đăng nhập & Đăng ký: Validate email, số điện thoại.<br>- Xử lý phản hồi lỗi từ server (401 Unauthorized, 409 Conflict).<br>- Đồng bộ trạng thái đăng nhập trên Navbar. |
| `WEB-T05` | `apps/web/__tests__/checkout.test.tsx` | `npx vitest run __tests__/checkout.test.tsx` | - Chặn đặt hàng khi giỏ rỗng.<br>- Sinh UUID v4 làm `Idempotency-Key`.<br>- Vô hiệu hóa nút Submit (disabled) chống double-click.<br>- Giữ lại `orderId` khi thanh toán thất bại để khách bấm thử lại mà không tạo đơn trùng. |
| `WEB-T06` | `apps/web/__tests__/orders.test.tsx`<br>`apps/web/__tests__/order-detail.test.tsx`<br>`apps/web/__tests__/order-stepper.test.tsx` | `npx vitest run __tests__/orders.test.tsx` | - Danh sách lịch sử đơn hàng của người dùng.<br>- Chi tiết đơn hàng theo ID.<br>- Thanh Stepper trực quan 4 bước: `PAID ➔ PREPARING ➔ READY ➔ COMPLETED`.<br>- Xử lý quyền xem (chặn 401/403) và nút Thử lại khi mất mạng. |

---

### 4.3. Kiểm thử Tích hợp Toàn diện (End-to-End) – Framework: Playwright
> **Lệnh chạy:** `npx playwright test`

| Mã Test | Đường dẫn file Test | Lệnh chạy | Hành vi người dùng được mô phỏng tự động |
| :---: | :--- | :--- | :--- |
| `E2E-T01` | `tests/e2e/checkout-flow.spec.ts` | `npx playwright test tests/e2e/checkout-flow.spec.ts` | - Mở trình duyệt Chromium tự động.<br>- Vào trang chủ $\to$ Chọn món Cà phê sữa đá $\to$ Thêm vào giỏ.<br>- Chuyển sang Giỏ hàng $\to$ Bấm Đặt hàng $\to$ Điền form Checkout.<br>- Bấm Thanh toán $\to$ Kiểm tra hiển thị màn hình thông báo Đặt hàng thành công và Stepper đơn hàng. |

---

## 5. CÔNG THỨC TRẢ LỜI "THẦY HỎI ĐÂU – CHỈ ĐÚNG ĐÓ"

Khi Thầy Cô đặt câu hỏi bất kỳ, hãy dùng "Bộ quy tắc phản xạ 3 bước":
1. **Bước 1 (Xác nhận yêu cầu):** *"Dạ thưa Thầy/Cô, yêu cầu này thuộc mã `FR-xx` (hoặc `NFR-xx`) trong Ma trận truy vết."*
2. **Bước 2 (Chỉ đúng sơ đồ & code):** *"Nó được thiết kế ở sơ đồ `docs/diagrams/...` và được hiện thực tại file `apps/...` ở dòng số `...`."*
3. **Bước 3 (Dẫn chứng bằng chứng kiểm thử):** *"Nhóm đã viết bài test tự động cho ca này tại file `apps/...spec.ts` (Mã test `...`), kết quả chạy thực tế pass 100% ạ."*
