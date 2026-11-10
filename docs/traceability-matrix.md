# Bảng Ma trận Truy vết Yêu cầu (Traceability Matrix)

> **Môn học:** Công nghệ Phần mềm  
> **Dự án:** BrewLite – Assignment 2 (Requirements to Deployment)  
> **Tài liệu tham chiếu:** Đề bài Assignment 2 – Mục 8.1 (Truy vết bắt buộc)  
> **Cập nhật:** Sprint 2 (Tích hợp thành phần từ Tech Lead A, Backend B, Frontend F và QA G)

---

## 1. Mục đích
Ma trận truy vết (Traceability Matrix) liên kết hai chiều giữa các **Yêu cầu chức năng (FR)**, **Yêu cầu phi chức năng (NFR)** được đặc tả trong SRS với **Use-case / User Story**, **Sơ đồ thiết kế (Activity, Sequence, Class, Deployment Diagrams)**, **Thành phần mã nguồn / API Endpoints** và các **Bộ kiểm thử tự động (Unit, Integration, E2E Tests)**.

Tài liệu này đảm bảo:
* Mọi yêu cầu nghiệp vụ đều được mô hình hóa và hiện thực đầy đủ.
* Mọi API và chức năng đều có bài test kiểm chứng tương ứng.
* Không có tính năng thừa thãi hoặc yêu cầu bị bỏ sót trong suốt hai Sprint.

---

## 2. Bảng Ma trận Truy vết Chức năng (Functional Requirements Matrix)

**Chú giải trạng thái:** ✅ Đã kiểm chứng (code trên nhánh + test pass) · 🟡 Đang tích hợp (code hoàn tất, chờ backend live) · ⏳ Kế hoạch tiếp theo · ⛔ Hoãn (Deferred theo `api-contracts.md`).

| Mã yêu cầu | Use-case / User Story | Thiết kế / Sơ đồ tham chiếu | Thành phần mã nguồn / Code / API | Mã kiểm thử (Test Cases) | Trạng thái hiện thực |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **FR-01** | **US-01: Xem menu đồ uống**<br>_Khách hàng duyệt danh mục món và lọc theo loại đồ uống._ | • `docs/diagrams/activity-checkout.puml`<br>• `docs/diagrams/class-domain.puml`<br>• `docs/diagrams/use-case-system.puml` | • **API:** `GET /products`, `GET /products/:id`<br>• **Web:** `apps/web/app/page.tsx`, `ProductCard.tsx` | • `API-T01` (`products.service.spec.ts`, `products.controller.spec.ts`)<br>• `WEB-T01` (`menu.test.tsx` - kiểm tra hiển thị món) | ✅ **Sprint 1 (Hoàn thành)** |
| **FR-02** | **US-02: Tùy biến món & Size/Topping**<br>_Khách hàng chọn size (REGULAR/LARGE) và topping (TRAN_CHAU, KEM_CHEESE, THACH_DAO)._ | • `docs/diagrams/activity-checkout.puml`<br>• `docs/diagrams/class-domain.puml`<br>• `docs/diagrams/use-case-checkout.puml` | • **Web:** `apps/web/app/products/[id]/page.tsx`, `apps/web/components/ProductOptionSelector.tsx` | • `WEB-T02` (`apps/web/__tests__/cart.test.tsx` - 7 unit tests chọn size, tính phụ thu topping, estados Loading/Error/Retry/404) | ✅ **Sprint 1–2 (E-10 Hoàn thành)** |
| **FR-03** | **US-03: Quản lý giỏ hàng**<br>_Thêm món, cập nhật số lượng, xóa món, hiển thị tổng tiền._ | • `docs/diagrams/activity-checkout.puml`<br>• `docs/diagrams/class-domain.puml`<br>• `docs/diagrams/use-case-checkout.puml` | • **Web:** `apps/web/context/CartContext.tsx`, `apps/web/app/cart/page.tsx`, `apps/web/components/CartDrawer.tsx`, `apps/web/components/Navbar.tsx` | • `WEB-T03` (`apps/web/__tests__/cart.test.tsx`, `checkout.test.tsx`, `auth.test.tsx` - gộp/tách dòng, tăng/giảm/xóa/clear, payload handoff) | ✅ **Sprint 1–2 (E + F Hoàn thành)** |
| **FR-04** | **US-04: Xác thực & Đăng nhập JWT**<br>_Đăng ký, đăng nhập tài khoản và lưu access token JWT._ | • `docs/diagrams/sequence-checkout.puml`<br>• `docs/diagrams/class-domain.puml` | • **API:** `POST /auth/register`, `POST /auth/login`<br>• **Auth Module:** `apps/api/src/auth/`<br>• **Web:** `apps/web/app/login/page.tsx`, `register/page.tsx`, `AuthContext.tsx` | • `API-T02` (`auth.service.spec.ts`)<br>• `WEB-T04-AUTH` (`auth.test.tsx` - 10 unit tests pass) | ✅ **Sprint 2 (B + F Hoàn thành)** |
| **FR-05** | **UC-01: Đặt đơn & Thanh toán mô phỏng**<br>_Tạo đơn hàng kèm transaction, thanh toán qua Ví MoMo/VNPay/Thẻ có Idempotency._ | • `docs/diagrams/sequence-checkout.puml`<br>• `docs/diagrams/class-domain.puml`<br>• `docs/diagrams/activity-checkout.puml` | • **API (C+D):** `POST /orders`, `POST /payments`<br>• **Web:** `apps/web/app/checkout/page.tsx`, `apps/web/lib/checkout-api.ts` | • `WEB-T05-CHECKOUT` (`checkout.test.tsx` - 9 unit tests pass)<br>• `INT-T01` & `INT-T02` (`orders.service.spec.ts`, `payments.service.spec.ts` - 17 unit tests pass) | ✅ **Sprint 2 (C + D + F Hoàn thành, Live Staging)** |
| **FR-06** | **US-05: Theo dõi trạng thái & Lịch sử đơn**<br>_Xem trạng thái đơn hàng thời gian thực và danh sách đơn đã đặt._ | • `docs/diagrams/activity-checkout.puml`<br>• `docs/diagrams/sequence-checkout.puml`<br>• `docs/diagrams/class-domain.puml` | • **Web:** `apps/web/app/orders/page.tsx`, `apps/web/app/orders/[id]/page.tsx`, `OrderStepper.tsx`<br>• **API Client:** `apps/web/lib/orders-api.ts` | • `WEB-T06-ORDERS` (`orders.test.tsx`, `order-detail.test.tsx`, `order-stepper.test.tsx` - 16 unit tests pass) | ✅ **Sprint 2 (G Hoàn thành UI)** |
| **FR-07** | **US-06: Cập nhật trạng thái đơn (Staff)**<br>_Nhân viên quầy cập nhật trạng thái PREPARING -> READY -> COMPLETED._ | • `docs/diagrams/class-domain.puml` (Role: BARISTA, OrderStatus)<br>• `docs/diagrams/use-case-system.puml` | • **API:** `PATCH /orders/:id/status` (Yêu cầu role BARISTA/ADMIN) | • `API-T04` (Test phân quyền RBAC và chuyển trạng thái hợp lệ) | ⏳ **Kế hoạch Sprint 2 (C-20)** |
| **FR-08** | **US-07: Áp dụng mã ưu đãi (Promotion)**<br>_Khách nhập voucher giảm giá trừ trực tiếp vào đơn hàng._ | • `docs/diagrams/class-domain.puml` (Promotion) | • **API:** `POST /promotions/validate` | • `API-T05` (Test voucher hợp lệ) | ⛔ **Hoãn (Deferred ngoài 13/11)** |

---

## 3. Bảng Ma trận Truy vết Phi Chức năng (Non-Functional Requirements Matrix)

| Mã NFR | Nhóm yêu cầu | Thiết kế kiến trúc & Sơ đồ | Hiện thực kỹ thuật | Phương thức kiểm chứng & Test | Kết quả / Đánh giá |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **NFR-01** | **Hiệu năng (Performance)**<br>_API response $\le 500\text{ms}$; Web tải nhanh._ | • `ADR-001` (Monorepo caching)<br>• `Deployment-01` (CDN Next.js) | • NestJS Fastify/Express tối ưu Prisma query với index.<br>• Next.js Server Components & Image Optimization. | • Đo benchmark phản hồi API trong unit/integration test.<br>• Đo Lighthouse Performance $\ge 80$. |  Đạt yêu cầu |
| **NFR-02** | **Bảo mật (Security)**<br>_Băm mật khẩu, JWT Auth, chống lộ Secret._ | • `Sequence-01` (JWT check & validate)<br>• `ADR-003` (Modular Backend) | • Băm password bằng Bcrypt (salt = 10).<br>• `JwtAuthGuard` & `ValidationPipe` với class-validator.<br>• `.gitignore` chặn toàn bộ file `.env`. | • Test đăng nhập sai pass bị từ chối 401 (`auth.test.tsx`, `auth.service.spec.ts`).<br>• Quét Git repository không có secret hardcode. |  Đạt yêu cầu |
| **NFR-03** | **Tính khả dụng & Mobile-first**<br>_3 trạng thái Loading, Empty, Error._ | • `Activity-01`<br>• `ADR-002` (Next.js PWA) | • CSS mobile-first (viewport 375px/430px và desktop).<br>• Các component chuẩn hóa: `Loading`, `Empty`, `Error` có nút Retry trên Menu, Product Detail, Cart, Orders và Checkout. | • Unit test `menu.test.tsx`, `cart.test.tsx`, `orders.test.tsx`, `order-detail.test.tsx`, `checkout.test.tsx` giả lập cả 3 trạng thái. |  Đạt yêu cầu |
| **NFR-04** | **Khả năng triển khai & Tin cậy**<br>_Docker compose local, Health check, CI/CD._ | • `Deployment-01` (Production deployment diagram)<br>• `ADR-004` (PostgreSQL & Prisma) | • `docker-compose.yml` (Web, API, Postgres).<br>• Endpoint `GET /health` trả về trạng thái service + DB.<br>• GitHub Actions Pipeline (`.github/workflows/ci.yml`). | • Chạy `docker compose up` không lỗi.<br>• Test pipeline CI 4 bước: Install, Lint, Test, Build. |  Đạt yêu cầu |
| **NFR-05** | **Toàn vẹn dữ liệu (Data Integrity)**<br>_ACID Transaction & Idempotency._ | • `Sequence-01` (Transaction & Idempotency)<br>• `ADR-005` (Mock Payment) | • Client sinh Idempotency-Key UUID v4 cố định cho lần bấm, giữ nguyên key khi retry.<br>• Server-authoritative: không gửi giá/amount từ client.<br>• Backend dùng transaction cập nhật kho và lưu `idempotencyKey` trong `Payment`. | • Unit test `checkout.test.tsx` (kiểm tra Idempotency UUID, chống double-click, giữ orderId khi retry, clear giỏ sau PAID). |  Đạt yêu cầu Frontend |

---

## 4. Danh mục Mã Kiểm thử Đối soát (Test Suite Mapping)

| Mã Test | Loại kiểm thử | Đường dẫn file Test | Số lượng & Mục tiêu kiểm thử | Trạng thái |
| :---: | :---: | :--- | :--- | :---: |
| `API-T01` | Unit Test | `apps/api/src/catalog/products.service.spec.ts`<br>`apps/api/src/catalog/products.controller.spec.ts` | 6 tests: Kiểm thử tìm kiếm danh mục món và chi tiết sản phẩm. | ✅ PASS |
| `WEB-T01` | Unit Test | `apps/web/__tests__/menu.test.tsx` | 4 tests: Menu mobile-first, Loading, Empty và Error fallback + Retry. | ✅ PASS |
| `WEB-T02` | Unit Test | `apps/web/__tests__/cart.test.tsx` | 7 tests: Công thức tính giá Regular/Large (+10.000đ) & Topping, lọc dữ liệu sai, trang chi tiết món (Loading/Error/Retry/404, hết hàng, đổi cấu hình tính lại giá tức thời). | ✅ PASS |
| `WEB-T03` | Unit Test | `apps/web/__tests__/cart.test.tsx` | 3 tests: Quản lý giỏ hàng (cùng cấu hình gộp dòng, khác cấu hình tách dòng, tăng/giảm/xóa/clear, empty cart, CartDrawer, và bàn giao payload cho F không kèm giá client). | ✅ PASS |
| `API-T02` | Unit Test | `apps/api/src/auth/auth.security.spec.ts` | 10 tests: Kiểm thử đăng ký, băm mật khẩu, đăng nhập, cấp phát token JWT và phân quyền RBAC. | ✅ PASS |
| `WEB-T04-AUTH` | Unit Test | `apps/web/__tests__/auth.test.tsx` | 10 tests: Form đăng nhập/đăng ký có validate, mã lỗi 401/409, quản lý JWT token và trạng thái Navbar / cart badge. | ✅ PASS |
| `WEB-T05-CHECKOUT` | Unit Test | `apps/web/__tests__/checkout.test.tsx` | 9 tests: Bảo vệ checkout, chặn giỏ rỗng, Idempotency-Key UUID, chống double-click, server-authoritative pricing, giữ giỏ & orderId khi retry, và clear giỏ sau PAID. | ✅ PASS |
| `WEB-T06-ORDERS` | Unit Test | `apps/web/__tests__/orders.test.tsx`<br>`apps/web/__tests__/order-detail.test.tsx`<br>`apps/web/__tests__/order-stepper.test.tsx` | 16 tests: Danh sách lịch sử đơn hàng, chi tiết đơn hàng, stepper trạng thái đơn và xử lý lỗi mạng. | ✅ PASS |
| `INT-T01` | Integration | `apps/api/src/orders/orders.service.spec.ts` | 10 tests: Kiểm thử luồng tạo đơn hàng, tính tiền, và gọi transaction cập nhật tồn kho. | ✅ PASS |
| `INT-T02` | Integration | `apps/api/src/payments/payments.service.spec.ts`<br>`apps/api/src/payments/mock-gateway.service.spec.ts` | 7 tests: Kiểm thử cơ chế thanh toán mô phỏng (MoMo/VNPay/Card) và xử lý Idempotency-Key. | ✅ PASS |
| `E2E-T01` | End-to-End | `tests/e2e/checkout-flow.spec.ts` | Kịch bản kiểm thử luồng hoàn chỉnh từ xem menu -> giỏ hàng -> đặt đơn -> thanh toán trên Staging (`https://brewlite-a2.vercel.app`). | 🟡 Chuyển giao Role G (Issue #24) |
| `SMOKE-01` | Smoke Test | `apps/api/src/health/health.controller.spec.ts` | Kiểm tra tính sẵn sàng của backend và kết nối DB qua `/health` (Live Staging: `https://brewlite-a2.onrender.com/health` HTTP 200 OK). | ✅ PASS |
