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
| **FR-04** | **US-04: Xác thực & Đăng nhập JWT**<br>_Đăng ký, đăng nhập, lưu access token._ | • `docs/diagrams/sequence-checkout.puml`<br>• `docs/diagrams/class-domain.puml`<br>• `docs/auth-api.md` | • **API (B):** `POST /auth/register`, `POST /auth/login`; `apps/api/src/auth/` (`auth.service.ts`, `jwt.strategy.ts`, `jwt-auth.guard.ts`, `roles.guard.ts`)<br>• **Web (F):** `apps/web/app/login/page.tsx`, `register/page.tsx`, `context/AuthContext.tsx` | • `API-T02` (`auth.security.spec.ts`)<br>• `WEB-T04-AUTH` (`auth.test.tsx`) | ✅ **Unit test pass; chưa có E2E đăng nhập** |
| **FR-05** | **UC-01: Đặt đơn & Thanh toán mô phỏng**<br>_Tạo đơn trong transaction, thanh toán có Idempotency._ | • `docs/diagrams/sequence-checkout.puml`<br>• `docs/diagrams/class-domain.puml`<br>• `docs/diagrams/activity-checkout.puml` | • **API:** `POST /orders` (C), `POST /payments` (D); `apps/api/src/orders/`, `apps/api/src/payments/`<br>• **Web (F):** `apps/web/app/checkout/page.tsx`, `apps/web/lib/checkout-api.ts` | • `WEB-T05-CHECKOUT`<br>• `API-T03`, `API-T06` (unit test C, D)<br>• `INT-T01`, `INT-T02` (chưa có file) | 🟡 **Code C, D, F đã có trên main; unit test đã có. Đã thực hiện một luồng đặt hàng và thanh toán mô phỏng thành công trên Vercel (đơn BL-20261110-GIV6, trạng thái PAID). Chưa xác nhận tích hợp DB thật và chưa có kết quả Integration Test INT-T01, INT-T02.** |
| **FR-06** | **US-05: Theo dõi trạng thái & Lịch sử đơn**<br>_Xem trạng thái đơn và danh sách đơn đã đặt (tải khi mở trang, chưa có polling)._ | • `docs/diagrams/activity-checkout.puml`<br>• `docs/diagrams/sequence-checkout.puml`<br>• `docs/diagrams/class-domain.puml` (enum `OrderStatus`)<br>• Contract: `docs/architecture/api-contracts.md` mục 2.3 | • **Web (G):** `apps/web/app/orders/page.tsx`, `apps/web/app/orders/[id]/page.tsx`, `apps/web/components/OrderStepper.tsx`, `apps/web/lib/orders-api.ts`, `apps/web/lib/orders-fixtures.ts`<br>• **API (C):** `GET /orders`, `GET /orders/:id` (`ORDER_ACCESS_DENIED`) | • `WEB-T06-ORDERS`<br>• `API-T03` (`orders.service.spec.ts`) | 🟡 **UI và 16 unit test pass; E2E Fixture có 5 test pass, 0 failed; 6 test API thật đang `fixme`. Đã thử đặt hàng mô phỏng thành công trên Vercel, nhưng trang chi tiết đơn hàng báo `Order not found` và lịch sử đơn vẫn hiển thị Fixture. Chưa xác nhận tích hợp Orders UI với API thật.** |
| **FR-07** | **US-06: Cập nhật trạng thái đơn (Staff)**<br>_PAID -> PREPARING -> READY -> COMPLETED._ | • `docs/diagrams/class-domain.puml` (Role: BARISTA/MANAGER/ADMIN)<br>• `docs/diagrams/use-case-system.puml` | • **API:** `PATCH /orders/:id/status` theo contract; **trên main chỉ có `PATCH /orders/:id/cancel`** | • `API-T04` (chưa có file) | ⏳ **Chưa có route đổi trạng thái (C-20)** |
| **FR-08** | **US-07: Áp dụng mã ưu đãi (Promotion)** | • `docs/diagrams/class-domain.puml` | • **API:** `POST /promotions/validate` _(không có trong api-contracts.md)_ | • `API-T05` (hoãn) | ⛔ **DEFERRED** (api-contracts.md mục 1.2) |


---

## 3. Bảng Ma trận Truy vết Phi Chức năng (Non-Functional Requirements Matrix)

| Mã NFR | Nhóm yêu cầu | Thiết kế kiến trúc & Sơ đồ | Hiện thực kỹ thuật | Phương thức kiểm chứng & Test | Kết quả / Đánh giá |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **NFR-01** | **Hiệu năng (Performance)**<br>_API p95 ≤ 500ms; Lighthouse ≥ 80._ | • `docs/architecture/adr/001-monorepo.md`<br>• `docs/diagrams/deployment-production.puml` | • Prisma query với index.<br>• Next.js Server Components. | • Đo p95 API GET /products: 50/50 requests thành công, P95 = 420,05 ms đạt yêu cầu ≤ 500 ms. `docs/evidence/api-latency-2026-11-10`.<br>• Lighthouse trên Vercel, trang /checkout, viewport 400 × 812: Performance 96, Accessibility 95, Best Practices 96, SEO 100. `docs/evidence/lighthouse-2026-11-10` | ✅ Đạt theo phạm vi đo ngày 10/11/2026 |
| **NFR-02** | **Bảo mật (Security)**<br>_Băm mật khẩu, JWT, chống lộ secret, ownership._ | • `docs/diagrams/sequence-checkout.puml`<br>• `docs/architecture/adr/003-backend-nestjs-modular.md` | • `bcryptjs` 12 vòng, giới hạn 72 byte (`auth.service.ts`).<br>• `JwtAuthGuard`, `RolesGuard`, `ValidationPipe`.<br>• `OrdersController`, `PaymentsController` dùng `JwtAuthGuard`; `ORDER_ACCESS_DENIED` ở `orders.service.ts`, `payments.service.ts`. | • `API-T02` (8 ca).<br>• Quét secret trong repo (chưa làm).<br>• Ca ownership E2E (chưa chạy). | 🟡 **Unit test pass; còn nhánh `x-user-id` trong `common/decorators/current-user.decorator.ts`; chưa quét secret, chưa E2E** |
| **NFR-03** | **Tính khả dụng & Mobile-first**<br>_Loading, Empty, Error; 375–430px._ | • `docs/diagrams/activity-checkout.puml`<br>• `docs/architecture/adr/002-frontend-nextjs-pwa.md` | • `apps/web/components/States.tsx` (`Loading`, `Empty`, `Error` + Retry).<br>• CSS mobile-first trong `apps/web/app/globals.css`. | • Unit test `menu`, `cart`, `orders`, `order-detail`, `checkout`.<br>• Ảnh responsive `docs/evidence/orders-responsive-2026-11-09/` (375px, 400px). | 🟡 **3 trạng thái đã unit test; responsive mới kiểm tra thủ công ở 375px và 400px (trang Orders); chưa kiểm tra 430px** |
| **NFR-04** | **Khả năng triển khai & Tin cậy**<br>_Docker Compose, Health check, CI/CD._ | • `docs/diagrams/deployment-production.puml`<br>• `docs/architecture/adr/004-postgresql-and-prisma.md` | • `docker-compose.yml`, `apps/api/Dockerfile`, `apps/web/Dockerfile`.<br>• `apps/api/prisma/migrations/20261109164000_init/`.<br>• `apps/api/src/health/health.controller.ts`.<br>• `.github/workflows/ci.yml`. | • `SMOKE-01` (`health.controller.spec.ts`).<br>• CI: Install, Lint, Test, Build.<br>• `docker compose up` và `GET /health` (chưa xác nhận trong báo cáo). | 🟡 **Có CI, migration, health controller; chưa xác nhận chạy `docker compose up` và `/health`** |
| **NFR-05** | **Toàn vẹn dữ liệu**<br>_ACID Transaction, Idempotency._ | • `docs/diagrams/sequence-checkout.puml`<br>• `docs/architecture/adr/005-mock-payment-service.md` | • Trừ kho có điều kiện trong transaction (`orders.service.ts`).<br>• `Idempotency-Key` ở `payments.service.ts`; client giữ key khi retry (`checkout-api.ts`). | • `orders.service.spec.ts`, `payments.service.spec.ts`, `checkout.test.tsx` (unit).<br>• `INT-T02` (chưa có). | 🟡 **Unit test; chưa chạy tích hợp với PostgreSQL thật** |

---

## 4. Danh mục Mã Kiểm thử Đối soát (Test Suite Mapping)

| Mã Test | Loại | Đường dẫn file Test | Mục tiêu kiểm thử | Trạng thái |
| :---: | :---: | :--- | :--- | :---: |

| `API-T01` | Unit | `apps/api/src/catalog/products.service.spec.ts`<br>`apps/api/src/catalog/products.controller.spec.ts` | Danh mục món và chi tiết sản phẩm. | ✅ pass (6) |
| `WEB-T01` | Unit | `apps/web/__tests__/menu.test.tsx` | Menu: Loading, Empty, Error + Retry. | ✅ pass (4) |
| `WEB-T02` | Unit | `apps/web/__tests__/cart.test.tsx` | Tính giá size/topping, trang chi tiết món. | ✅ pass |
| `WEB-T03` | Unit | `apps/web/__tests__/cart.test.tsx` | Giỏ hàng: gộp/tách dòng, tăng/giảm/xóa, payload không kèm giá client. | ✅ pass |
| `API-T02` | Unit | `apps/api/src/auth/auth.security.spec.ts` | 8 ca bảo mật auth: băm mật khẩu và không trả hash, từ chối role do client gửi, trùng email 409, đăng nhập đúng/sai, JWT hết hạn, JWT sai chữ ký, đọc profile không lộ hash, phân quyền staff/customer. | ✅ pass (8) |
| `WEB-T04-AUTH` | Unit | `apps/web/__tests__/auth.test.tsx` | Form đăng nhập/đăng ký, lỗi 401/409, Navbar. | ✅ pass |
| `WEB-T05-CHECKOUT` | Unit | `apps/web/__tests__/checkout.test.tsx` | Chặn giỏ rỗng, Idempotency-Key, chống double-click, giữ orderId khi retry, xóa giỏ sau PAID. | ✅ pass |
| `WEB-T06-ORDERS` | Unit | `apps/web/__tests__/orders.test.tsx`<br>`apps/web/__tests__/order-detail.test.tsx`<br>`apps/web/__tests__/order-stepper.test.tsx` | Lịch sử đơn, chi tiết đơn, stepper, lỗi 401/403/404, Retry. | ✅ pass (16) |
| `API-T03` | Unit | `apps/api/src/orders/orders.service.spec.ts`<br>`apps/api/src/orders/orders.controller.spec.ts` | Tạo đơn, trừ kho, hết hàng, lịch sử đơn. | 🟡 file có trên main; chưa xác nhận số ca |
| `API-T06` | Unit | `apps/api/src/payments/payments.service.spec.ts`<br>`apps/api/src/payments/mock-gateway.service.spec.ts` | Thanh toán mô phỏng, Idempotency. | 🟡 file có trên main; chưa xác nhận số ca |
| `INT-T01` | Integration | `tests/integration/orders.spec.ts` | Tạo đơn kèm transaction trừ kho với DB thật. | ⏳ chưa có file |
| `INT-T02` | Integration | `tests/integration/payments.spec.ts` | Thanh toán và Idempotency-Key với DB thật. | ⏳ chưa có file |
| `E2E-T01` | E2E | `tests/e2e/checkout-flow.spec.ts` | Luồng từ xem menu đến thanh toán và lịch sử đơn. | 🟡 5 test pass, 0 failed trên Fixture; 6 test API thật đang fixme. Đã thử luồng checkout trên Vercel với mock payment nhưng chưa xác nhận Orders API thật. Báo cáo: `docs/evidence/e2e-fixture-report-2026-11-10/` . |
| `SMOKE-01` | Smoke | `apps/api/src/health/health.controller.spec.ts` | `/health` và kết nối DB. | 🟡 file có trên main; chưa xác nhận kết quả |
| `API-T04` | Unit | (dự kiến) `apps/api/src/orders/` | Phân quyền RBAC và chuyển trạng thái hợp lệ (FR-07). | ⏳ chưa có file |
