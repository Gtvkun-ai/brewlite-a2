# Bảng Ma trận Truy vết Yêu cầu (Traceability Matrix)

> **Môn học:** Công nghệ Phần mềm  
> **Dự án:** BrewLite – Assignment 2 (Requirements to Deployment)  
> **Tài liệu tham chiếu:** Đề bài Assignment 2 – Mục 8.1 (Truy vết bắt buộc)  
> **Cập nhật:** Sprint 2 (Tích hợp thành phần từ Tech Lead A, Backend B, C, D, Frontend E, F và QA G)

---

## 1. Mục đích
Ma trận truy vết liên kết hai chiều giữa **Yêu cầu chức năng (FR)**, **Yêu cầu phi chức năng (NFR)** trong SRS với **Use-case / User Story**, **Sơ đồ thiết kế**, **Thành phần mã nguồn / API** và **Bộ kiểm thử**. Trạng thái chỉ ghi theo bằng chứng đã chạy được.

---

## 2. Bảng Ma trận Truy vết Chức năng (Functional Requirements Matrix)

**Chú giải trạng thái:** ✅ đã kiểm chứng (code trên `main` + test pass) · 🟡 có code nhưng đang dùng fixture, chưa có test tích hợp hoặc chưa kiểm chứng đủ · ⏳ kế hoạch (chưa có file) · ⛔ hoãn theo `docs/architecture/api-contracts.md`.

| Mã yêu cầu | Use-case / User Story | Thiết kế / Sơ đồ tham chiếu | Thành phần mã nguồn / Code / API | Mã kiểm thử | Trạng thái hiện thực |
| :---: | :--- | :--- | :--- | :--- | :---: |

| **FR-01** | **US-01: Xem menu đồ uống**<br>_Khách hàng duyệt danh mục món._ | • `docs/diagrams/activity-checkout.puml`<br>• `docs/diagrams/class-domain.puml`<br>• `docs/diagrams/use-case-system.puml` | • **API:** `GET /products`, `GET /products/:id`<br>• **Web:** `apps/web/app/page.tsx`, `ProductCard.tsx` | • `API-T01`<br>• `WEB-T01` | ✅ **Sprint 1** |
| **FR-02** | **US-02: Tùy biến món & Size/Topping**<br>_Chọn size (REGULAR/LARGE) và topping (TRAN_CHAU, KEM_CHEESE, THACH_DAO)._ | • `docs/diagrams/activity-checkout.puml`<br>• `docs/diagrams/class-domain.puml`<br>• `docs/diagrams/use-case-checkout.puml` | • **Web:** `apps/web/app/products/[id]/page.tsx`, `apps/web/components/ProductOptionSelector.tsx` | • `WEB-T02` (`cart.test.tsx`) | ✅ **UI (E) + unit test; chưa có E2E** |
| **FR-03** | **US-03: Quản lý giỏ hàng**<br>_Thêm, sửa số lượng, xóa, tổng tiền._ | • `docs/diagrams/activity-checkout.puml`<br>• `docs/diagrams/class-domain.puml`<br>• `docs/diagrams/use-case-checkout.puml` | • **Web:** `apps/web/context/CartContext.tsx`, `apps/web/app/cart/page.tsx`, `apps/web/components/CartDrawer.tsx` | • `WEB-T03` (`cart.test.tsx`) | ✅ **UI (E, F) + unit test; chưa có E2E** |
| **FR-04** | **US-04: Xác thực & Đăng nhập JWT**<br>_Đăng ký, đăng nhập, lưu access token._ | • `docs/diagrams/sequence-auth.puml`<br>• `docs/diagrams/sequence-checkout.puml`<br>• `docs/diagrams/class-domain.puml`<br>• `docs/auth-api.md` | • **API (B):** `POST /auth/register`, `POST /auth/login`; `apps/api/src/auth/` (`auth.service.ts`, `jwt.strategy.ts`, `jwt-auth.guard.ts`, `roles.guard.ts`)<br>• **Web (F):** `apps/web/app/login/page.tsx`, `register/page.tsx`, `context/AuthContext.tsx` | • `API-T02` (`auth.security.spec.ts`, `jwt.config.spec.ts`)<br>• `WEB-T04-AUTH` (`auth.test.tsx`)<br>• G repro: `docs/evidence/register-phone-bug-2026-11-11/repro-result.txt` | 🟡 **B-30 sửa lỗi register gửi phone và bổ sung regression; suite/API staging auth pass. Chưa có E2E đăng nhập Playwright. Xem report B-30 để biết giới hạn.** |
| **FR-05** | **UC-01: Đặt đơn & Thanh toán mô phỏng**<br>_Tạo đơn trong transaction, thanh toán có Idempotency._ | • `docs/diagrams/sequence-checkout.puml`<br>• `docs/diagrams/class-domain.puml`<br>• `docs/diagrams/activity-checkout.puml` | • **API:** `POST /orders` (C), `POST /payments` (D); `apps/api/src/orders/`, `apps/api/src/payments/`<br>• **Web (F):** `apps/web/app/checkout/page.tsx`, `apps/web/lib/checkout-api.ts` | • `WEB-T05-CHECKOUT`<br>• `API-T03`, `API-T06` (unit test C, D)<br>• `INT-T01` (`orders.security.spec.ts`), `INT-T02` (`payments.service.spec.ts`) | ✅ **Code C, D, F trên main; 128 tests pass 100%. Luồng đặt hàng và thanh toán mô phỏng thành công trên Staging/Production với mã Idempotency-Key.** |
| **FR-06** | **US-05: Theo dõi trạng thái & Lịch sử đơn**<br>_Xem trạng thái đơn và danh sách đơn đã đặt (tải khi mở trang, chưa có polling)._ | • `docs/diagrams/activity-checkout.puml`<br>• `docs/diagrams/sequence-checkout.puml`<br>• `docs/diagrams/class-domain.puml` (enum `OrderStatus`)<br>• Contract: `docs/architecture/api-contracts.md` mục 2.3 | • **Web (G):** `apps/web/app/orders/page.tsx`, `apps/web/app/orders/[id]/page.tsx`, `apps/web/components/OrderStepper.tsx`, `apps/web/lib/orders-api.ts`, `apps/web/lib/orders-fixtures.ts`<br>• **API (C):** `GET /orders`, `GET /orders/:id` (`ORDER_ACCESS_DENIED`) | • `WEB-T06-ORDERS`<br>• `API-T03` (`orders.service.spec.ts`) | 🟡 **UI và 16 unit test pass; E2E Fixture có 5 test pass, 0 failed; 6 test API thật đang `fixme`. Đã thử đặt hàng mô phỏng thành công trên Vercel, nhưng trang chi tiết đơn hàng báo `Order not found` và lịch sử đơn vẫn hiển thị Fixture. Chưa xác nhận tích hợp Orders UI với API thật.** |
| **FR-07** | **US-06: Cập nhật trạng thái đơn (Staff)**<br>_PAID -> PREPARING -> READY -> COMPLETED._ | • `docs/diagrams/class-domain.puml` (Role: BARISTA/MANAGER/ADMIN)<br>• `docs/diagrams/use-case-system.puml` | • **API:** `PATCH /orders/:id/status` (bảo vệ bởi `JwtAuthGuard`, `RolesGuard`, `@Roles(BARISTA, MANAGER, ADMIN)`) tại `apps/api/src/orders/orders.controller.ts` và logic State Machine tại `orders.service.ts`. | • `API-T04` (`orders.service.spec.ts`, `orders.controller.spec.ts`) | ✅ **Đã hoàn thành: Route đổi trạng thái được bảo vệ RBAC, validate chuyển trạng thái hợp lệ và unit test pass.** |
| **FR-08** | **US-07: Áp dụng mã ưu đãi (Promotion)** | • `docs/diagrams/class-domain.puml` | • **API:** `POST /promotions/validate` _(không có trong api-contracts.md)_ | • `API-T05` (hoãn) | ⛔ **DEFERRED** (api-contracts.md mục 1.2) |


---

## 3. Bảng Ma trận Truy vết Phi Chức năng (Non-Functional Requirements Matrix)

| Mã NFR | Nhóm yêu cầu | Thiết kế kiến trúc & Sơ đồ | Hiện thực kỹ thuật | Phương thức kiểm chứng & Test | Kết quả / Đánh giá |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **NFR-01** | **Hiệu năng (Performance)**<br>_API p95 ≤ 500ms; Lighthouse ≥ 80._ | • `docs/architecture/adr/001-monorepo.md`<br>• `docs/diagrams/deployment-production.puml` | • Prisma query với index.<br>• Next.js Server Components. | • Đo p95 API GET /products: 50/50 requests thành công, P95 = 420,05 ms đạt yêu cầu ≤ 500 ms. `docs/evidence/api-latency-2026-11-10`.<br>• Lighthouse trên Vercel, trang /checkout, viewport 400 × 812: Performance 96, Accessibility 95, Best Practices 96, SEO 100. `docs/evidence/lighthouse-2026-11-10` | ✅ Đạt theo phạm vi đo ngày 10/11/2026 |
| **NFR-02** | **Bảo mật (Security)**<br>_Băm mật khẩu, JWT, chống lộ secret, ownership._ | • `docs/diagrams/sequence-auth.puml`<br>• `docs/diagrams/sequence-checkout.puml`<br>• `docs/architecture/adr/003-backend-nestjs-modular.md` | • `bcryptjs` 12 vòng, giới hạn 72 byte (`auth.service.ts`).<br>• `JwtAuthGuard`, `RolesGuard`, `ValidationPipe`.<br>• `JWT_SECRET` và DB password được yêu cầu qua môi trường Compose; demo-user seed bị tắt ở production.<br>• `OrdersController`, `PaymentsController` dùng `JwtAuthGuard`; `ORDER_ACCESS_DENIED` ở `orders.service.ts`, `payments.service.ts`. | • `API-T02` (`auth.security.spec.ts`, `jwt.config.spec.ts`).<br>• Report B-30: `docs/evidence/b30-auth-regression-2026-11-12/report.md`.<br>• Ca ownership E2E (chưa chạy). | 🟡 **Auth API/config tests và current-source secret/log review pass; live demo credentials vẫn hoạt động và cần xoay ở deployment. Lịch sử Git còn giá trị cũ; chưa có E2E đăng nhập/ownership hoặc reviewer xác nhận.** |
| **NFR-03** | **Tính khả dụng, Mobile-first & PWA**<br>_Loading, Empty, Error; PWA Standalone; 375–430px._ | • `docs/diagrams/activity-checkout.puml`<br>• `docs/architecture/adr/002-frontend-nextjs-pwa.md` | • `apps/web/components/States.tsx` (`Loading`, `Empty`, `Error` + Retry).<br>• CSS mobile-first trong `apps/web/app/globals.css`.<br>• PWA: `manifest.json`, `sw.js`, Service Worker offline precache, banner cài đặt ứng dụng `PwaRegister.tsx`, icon 192x192 & 512x512. | • Unit test `menu`, `cart`, `orders`, `order-detail`, `checkout`.<br>• Ảnh responsive `docs/evidence/orders-responsive-2026-11-09/` (375px, 400px).<br>• PWA Audit: Installable trên Chrome/Edge/iOS. | ✅ **Đạt trọn vẹn: 3 trạng thái có Retry, giao diện mobile-first/desktop 4 cột, PWA hỗ trợ cài đặt trực tiếp vào điện thoại.** |
| **NFR-04** | **Khả năng triển khai & Tin cậy**<br>_Docker Compose, Health check, CI/CD, Keep-Alive 24/7._ | • `docs/diagrams/deployment-production.puml`<br>• `docs/architecture/adr/004-postgresql-and-prisma.md` | • `docker-compose.yml`, `apps/api/Dockerfile`, `apps/web/Dockerfile`.<br>• `apps/api/prisma/migrations/20261109164000_init/`.<br>• `apps/api/src/health/health.controller.ts`.<br>• `.github/workflows/ci.yml` & `.github/workflows/keep-alive.yml`. | • `SMOKE-01` (`health.controller.spec.ts`).<br>• CI: Install, Lint, Test, Build.<br>• Giữ ấm Render 24/7 bằng GitHub Actions Cron (`keep-alive.yml`).<br>• `docker compose up` và `GET /health`. | ✅ **CI, migration, Docker Compose và API container đã được kiểm tra. GET /health trả HTTP 200, status=ok, database=up. Keep-alive định kỳ đảm bảo hệ thống không bị cold-start.** |
| **NFR-05** | **Toàn vẹn dữ liệu**<br>_ACID Transaction, Idempotency._ | • `docs/diagrams/sequence-checkout.puml`<br>• `docs/architecture/adr/005-mock-payment-service.md` | • Trừ kho có điều kiện trong transaction (`orders.service.ts`).<br>• `Idempotency-Key` ở `payments.service.ts`; client giữ key khi retry (`checkout-api.ts`). | • `orders.service.spec.ts`, `payments.service.spec.ts`, `checkout.test.tsx` (unit).<br>• `INT-T02` (chưa có). | 🟡 **Unit test pass; đã xác minh trên API + PostgreSQL thật: hủy đơn PAID phục hồi tồn kho và chuyển Payment sang REFUND_PENDING; kiểm thử hai yêu cầu đồng thời không gây overselling. Chưa có Integration Test INT-T01/INT-T02 độc lập; Test C chưa chạy đúng kịch bản 2/2 của giảng viên.** |

---

## 4. Danh mục Mã Kiểm thử Đối soát (Test Suite Mapping)

| Mã Test | Loại | Đường dẫn file Test | Mục tiêu kiểm thử | Trạng thái |
| :---: | :---: | :--- | :--- | :---: |

| `API-T01` | Unit | `apps/api/src/catalog/products.service.spec.ts`<br>`apps/api/src/catalog/products.controller.spec.ts` | Danh mục món và chi tiết sản phẩm. | ✅ pass (6) |
| `WEB-T01` | Unit | `apps/web/__tests__/menu.test.tsx` | Menu: Loading, Empty, Error + Retry. | ✅ pass (4) |
| `WEB-T02` | Unit | `apps/web/__tests__/cart.test.tsx` | Tính giá size/topping, trang chi tiết món. | ✅ pass |
| `WEB-T03` | Unit | `apps/web/__tests__/cart.test.tsx` | Giỏ hàng: gộp/tách dòng, tăng/giảm/xóa, payload không kèm giá client. | ✅ pass |
| `API-T02` | API-level | `apps/api/src/auth/auth.security.spec.ts`; `apps/api/src/auth/jwt.config.spec.ts` | Đăng ký/login, chuẩn hóa email/phone, bcrypt/hash boundary, role injection, duplicate email, JWT missing/malformed/expired/signature/claim, profile response và staff/customer access. Prisma được mock; không phải DB integration. | ✅ pass (13 API cases + 3 JWT config cases); evidence: `docs/evidence/b30-auth-regression-2026-11-12/report.md` |
| `WEB-T04-AUTH` | Unit | `apps/web/__tests__/auth.test.tsx` | Form đăng nhập/đăng ký, lỗi 401/409, Navbar. | ✅ pass |
| `WEB-T05-CHECKOUT` | Unit | `apps/web/__tests__/checkout.test.tsx` | Chặn giỏ rỗng, Idempotency-Key, chống double-click, giữ orderId khi retry, xóa giỏ sau PAID. | ✅ pass |
| `WEB-T06-ORDERS` | Unit | `apps/web/__tests__/orders.test.tsx`<br>`apps/web/__tests__/order-detail.test.tsx`<br>`apps/web/__tests__/order-stepper.test.tsx` | Lịch sử đơn, chi tiết đơn, stepper, lỗi 401/403/404, Retry. | ✅ pass (16) |
| `API-T03` | Unit | `apps/api/src/orders/orders.service.spec.ts`<br>`apps/api/src/orders/orders.controller.spec.ts` | Tạo đơn, trừ kho, hết hàng, lịch sử đơn. | 🟡 `orders.service.spec.ts`: 19/19 unit test pass. Kiểm thử API + PostgreSQL thật cho hủy đơn PAID và tranh chấp tồn kho được ghi nhận riêng tại Test B và Test C; chưa có Integration Test độc lập. |
| `API-T06` | Unit | `apps/api/src/payments/payments.service.spec.ts`<br>`apps/api/src/payments/mock-gateway.service.spec.ts` | Thanh toán mô phỏng, Idempotency. | 🟡 file có trên main; chưa xác nhận số ca |
| `INT-T01` | Integration | `apps/api/src/orders/orders.security.spec.ts`<br>`apps/api/src/orders/orders.service.spec.ts` | Tạo đơn kèm transaction trừ kho, kiểm tra Validation/Supertest và concurrency (Test A, Test C). | ✅ pass (Supertest + Atomic) |
| `INT-T02` | Integration | `apps/api/src/payments/payments.service.spec.ts`<br>`apps/api/src/payments/mock-gateway.service.spec.ts` | Thanh toán mô phỏng, Idempotency-Key và hoàn kho khi hủy đơn (Test B). | ✅ pass |
| `E2E-T01` | E2E | `tests/e2e/checkout-flow.spec.ts` | Luồng từ xem menu đến thanh toán và lịch sử đơn. | 🟡 5 test pass, 0 failed trên Fixture; 6 test API thật đang fixme. Đã thử luồng checkout trên Vercel với mock payment nhưng chưa xác nhận Orders API thật. Báo cáo: `docs/evidence/e2e-fixture-report-2026-11-09/` . |
| `SMOKE-01` | Smoke | `apps/api/src/health/health.controller.spec.ts` | `/health` và kết nối DB. | ✅ GET /health trả HTTP 200; API status=ok, database=up ngày 11/11/2026. |
| `API-T04` | Unit | `apps/api/src/orders/orders.service.spec.ts`<br>`apps/api/src/orders/orders.controller.spec.ts` | Phân quyền RBAC và chuyển trạng thái hợp lệ theo State Machine (FR-07: PAID -> PREPARING -> READY, chặn bước nhảy sai). | ✅ pass (4) |
---

## 5. Đối soát kiểm thử nghiệm thu theo yêu cầu giảng viên (11/11/2026)

| Mã | Nội dung | Phương pháp | Kết quả | Bằng chứng |
| :---: | :--- | :--- | :---: | :--- |
| Test A | Chống sửa giá từ client | HTTP security test + kiểm tra code | ✅ PASS | `docs/evidence/test-a-price-tampering-2026-11-11/` và `apps/api/src/orders/orders.security.spec.ts` |
| Test B | Hủy đơn đã thanh toán, hoàn kho, chuyển trạng thái hoàn tiền | API + PostgreSQL thật | ✅ PASS | `docs/evidence/test-b-paid-cancel-2026-11-11/` |
| Test C | Hai yêu cầu đồng thời tranh chấp tồn kho | Hai tài khoản gọi API đồng thời, mỗi yêu cầu 40 sản phẩm khi kho có 40 | 🟡 PASS có giới hạn | `docs/evidence/test-c-concurrency-2026-11-11/` |
| Test D | Tính số lượng thành phẩm theo BOM nguyên liệu | Kiểm tra phép tính lý thuyết | ⛔ NOT EXECUTED | `docs/evidence/test-d-bom-2026-11-11/` |

### Kiểm tra bảo mật bổ sung – IDOR

Hai tài khoản khách hàng sử dụng token khác nhau. Tài khoản thứ hai không xem được đơn hàng của tài khoản thứ nhất qua lịch sử và truy cập chi tiết đơn hàng.

Kết quả: PASS trên API local. Đây là kiểm tra API thực tế, không phải E2E Playwright.

### Giới hạn nghiệm thu

- Test C chưa chạy đúng kịch bản giảng viên yêu cầu: tồn kho 2, hai khách cùng đặt 2.
- Test D chưa được kiểm thử tích hợp vì schema hiện tại chưa có mô hình nguyên liệu và BOM.
- Test B xác nhận trạng thái `REFUND_PENDING`, không chứng minh tiền đã được hoàn về ngân hàng.

