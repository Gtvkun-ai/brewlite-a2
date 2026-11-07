# Bảng Ma trận Truy vết Yêu cầu (Traceability Matrix)

> **Môn học:** Công nghệ Phần mềm  
> **Dự án:** BrewLite – Assignment 2 (Requirements to Deployment)  
> **Tài liệu tham chiếu:** Đề bài Assignment 2 – Mục 8.1 (Truy vết bắt buộc)

---

## 1. Mục đích
Ma trận truy vết (Traceability Matrix) liên kết hai chiều giữa các **Yêu cầu chức năng (FR)**, **Yêu cầu phi chức năng (NFR)** được đặc tả trong SRS với **Use-case / User Story**, **Sơ đồ thiết kế (Activity, Sequence, Class, Deployment Diagrams)**, **Thành phần mã nguồn / API Endpoints** và các **Bộ kiểm thử tự động (Unit, Integration, E2E Tests)**.

Tài liệu này đảm bảo:
* Mọi yêu cầu nghiệp vụ đều được mô hình hóa và hiện thực đầy đủ.
* Mọi API và chức năng đều có bài test kiểm chứng tương ứng.
* Không có tính năng thừa thãi hoặc yêu cầu bị bỏ sót trong suốt hai Sprint.

---

## 2. Bảng Ma trận Truy vết Chức năng (Functional Requirements Matrix)

| Mã yêu cầu | Use-case / User Story | Thiết kế / Sơ đồ tham chiếu | Thành phần mã nguồn / Code / API | Mã kiểm thử (Test Cases) | Trạng thái hiện thực |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **FR-01** | **US-01: Xem menu đồ uống**<br>*Khách hàng duyệt danh mục món và lọc theo loại đồ uống.* | • `Activity-01` (Activity checkout/browse)<br>• `Class-01` (Class User, Product, Category)<br>• `UseCase-System` | • **API:** `GET /products`, `GET /products/:id`<br>• **Web:** `apps/web/app/page.tsx`, `ProductCard.tsx` | • `API-T01` (`products.service.spec.ts`, `products.controller.spec.ts`)<br>• `WEB-T01` (`menu.test.tsx` - kiểm tra hiển thị món) |  **Sprint 1 (Hoàn thành)** |
| **FR-02** | **US-02: Tùy biến món & Size/Topping**<br>*Khách hàng chọn size (S/M/L), topping, đá, đường và ghi chú.* | • `Activity-01`<br>• `Class-01` (ProductSize, ProductTopping)<br>• `UseCase-Checkout` | • **Web:** `apps/web/app/products/[id]/page.tsx`, `ProductOptionSelector.tsx` | • `WEB-T02` (Unit test chọn size & tính phụ thu topping) | ⏳ **Sprint 2 (Đang triển khai)** |
| **FR-03** | **US-03: Quản lý giỏ hàng**<br>*Thêm món, cập nhật số lượng, xóa món, hiển thị tổng tiền.* | • `Activity-01`<br>• `Class-01` (OrderItem, Order)<br>• `UseCase-Checkout` | • **Web:** `apps/web/context/CartContext.tsx`, `CartDrawer.tsx` | • `WEB-T03` (Unit test tính tổng tiền, tăng giảm số lượng, clear cart) | ⏳ **Sprint 2 (Đang triển khai)** |
| **FR-04** | **US-04: Xác thực & Đăng nhập JWT**<br>*Đăng ký, đăng nhập tài khoản và lưu access token JWT.* | • `Sequence-01` (Kiểm tra JWT & Validate dữ liệu)<br>• `Class-01` (User, Role) | • **API:** `POST /auth/register`, `POST /auth/login`<br>• **Auth Module:** `apps/api/src/auth/`<br>• **Web:** `apps/web/app/login/page.tsx`, `apps/web/app/register/page.tsx`<br>• **Context:** `apps/web/context/AuthContext.tsx`<br>• **Navbar:** `apps/web/components/Navbar.tsx` | • `API-T02` (`auth.service.spec.ts`)<br>• `WEB-T04-AUTH` (`apps/web/__tests__/auth.test.tsx`: test form hợp lệ/sai, lỗi 401/409, login/logout, navbar user & cart badge) |  **Hoàn thành (Role F)** |
| **FR-05** | **UC-01: Đặt đơn & Thanh toán mô phỏng**<br>*Tạo đơn hàng kèm transaction, thanh toán qua Ví MoMo/VNPay/Thẻ.* | • `Sequence-01` (Checkout, alt nhánh thẻ/ví, Idempotency, Transaction)<br>• `Class-01` (Order, OrderItem, Payment, PaymentStatus)<br>• `Activity-01` | • **API:** `POST /orders`, `POST /payments`<br>• **Web:** `apps/web/app/checkout/page.tsx`<br>• **Checkout Client:** `apps/web/lib/checkout-api.ts`<br>• **Cart State:** `apps/web/context/CartContext.tsx` | • `INT-T01` (Integration test tạo đơn)<br>• `INT-T02` (Test Idempotency key)<br>• `WEB-T05-CHECKOUT` (`apps/web/__tests__/checkout.test.tsx`: test bảo vệ checkout, double click, giữ orderId/key khi retry, 401/400 out-of-stock, clear cart khi PAID) |  **Hoàn thành (Role F)** |
| **FR-06** | **US-05: Theo dõi trạng thái & Lịch sử đơn**<br>*Xem trạng thái đơn hàng thời gian thực và danh sách đơn đã đặt.* | • `Activity-01`<br>• `Sequence-01` (Thông báo kết quả cuối cùng)<br>• `Class-01` (OrderStatus enum) | • **API:** `GET /orders`, `GET /orders/:id`<br>• **Web:** `apps/web/app/orders/[id]/page.tsx`, `orders/page.tsx`<br>• **Checkout Nav:** Link trực tiếp sang `/orders/[id]` sau khi thanh toán thành công | • `API-T03` (`orders.service.spec.ts` - get order history)<br>• `WEB-T04` (`orders.test.tsx`, `order-detail.test.tsx`, `order-stepper.test.tsx`) |  **Hoàn thành (Role G & F)** |
| **FR-07** | **US-06: Cập nhật trạng thái đơn (Staff)**<br>*Nhân viên quầy cập nhật trạng thái PREPARING -> READY -> COMPLETED.* | • `Class-01` (Role: ADMIN/STAFF)<br>• `UseCase-System` | • **API:** `PATCH /orders/:id/status` (Yêu cầu quyền Staff) | • `API-T04` (Test phân quyền RBAC và chuyển trạng thái hợp lệ) | ⏳ **Sprint 2 (Đang triển khai)** |
| **FR-08** | **US-07: Áp dụng mã ưu đãi (Promotion)**<br>*Khách nhập voucher giảm giá trừ trực tiếp vào đơn hàng.* | • `Class-01` (Promotion, Order.discountAmount) | • **API:** `POST /promotions/validate` | • `API-T05` (Test voucher hợp lệ, hết hạn, minOrderAmount) | ⏳ **Sprint 2 (Đang triển khai)** |

---

## 3. Bảng Ma trận Truy vết Phi Chức năng (Non-Functional Requirements Matrix)

| Mã NFR | Nhóm yêu cầu | Thiết kế kiến trúc & Sơ đồ | Hiện thực kỹ thuật | Phương thức kiểm chứng & Test | Kết quả / Đánh giá |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **NFR-01** | **Hiệu năng (Performance)**<br>*API response time $\le 500\text{ms}$; Web tải nhanh.* | • `ADR-001` (Monorepo caching)<br>• `Deployment-01` (CDN Next.js) | • NestJS Fastify/Express tối ưu Prisma query với index.<br>• Next.js Server Components & Image Optimization. | • Đo benchmark phản hồi API trong unit/integration test.<br>• Đo Lighthouse Performance $\ge 80$. |  Đạt yêu cầu |
| **NFR-02** | **Bảo mật (Security)**<br>*Băm mật khẩu, JWT Auth, chống lộ Secret.* | • `Sequence-01` (JWT check & validate)<br>• `ADR-003` (Modular Backend) | • Băm password bằng Bcrypt (salt = 10).<br>• `JwtAuthGuard` & `ValidationPipe` với class-validator.<br>• `.gitignore` chặn toàn bộ file `.env`. | • Test đăng nhập sai pass bị từ chối 401.<br>• Quét Git repository không có secret hardcode. |  Đạt yêu cầu |
| **NFR-03** | **Tính khả dụng & Mobile-first**<br>*3 trạng thái Loading, Empty, Error.* | • `Activity-01`<br>• `ADR-002` (Next.js PWA) | • Tailwind CSS mobile-first (viewport 375px+).<br>• Các component chuẩn hóa: `LoadingSpinner`, `EmptyState`, `ErrorState` có nút Retry. | • Unit test `menu.test.tsx` giả lập cả 3 trạng thái Loading, Empty, Error. |  Đạt yêu cầu |
| **NFR-04** | **Khả năng triển khai & Tin cậy**<br>*Docker compose local, Health check, CI/CD.* | • `Deployment-01` (Production deployment diagram)<br>• `ADR-004` (PostgreSQL & Prisma) | • `docker-compose.yml` (Web, API, Postgres).<br>• Endpoint `GET /health` trả về trạng thái service + DB.<br>• GitHub Actions Pipeline (`.github/workflows/ci.yml`). | • Chạy `docker compose up` không lỗi.<br>• Test pipeline CI 4 bước: Install, Lint, Test, Build. |  Đạt yêu cầu |
| **NFR-05** | **Toàn vẹn dữ liệu (Data Integrity)**<br>*ACID Transaction & Idempotency.* | • `Sequence-01` (Transaction & Idempotency)<br>• `ADR-005` (Mock Payment) | • `prisma.$transaction` khi tạo đơn và trừ `stockQuantity`.<br>• Lưu `idempotencyKey` trong bảng `Payment` để chống trừ tiền 2 lần.<br>• Client frontend giữ nguyên `orderId` và `Idempotency-Key` khi retry. | • `INT-T02`: Gửi 2 request thanh toán trùng key, chỉ tính tiền 1 lần.<br>• `WEB-T05-CHECKOUT`: Frontend không re-create đơn hàng khi thanh toán retry. |  Đạt yêu cầu |

---

## 4. Danh mục Mã Kiểm thử Đối soát (Test Suite Mapping)

| Mã Test | Loại kiểm thử | Đường dẫn file Test | Mục tiêu kiểm thử |
| :---: | :---: | :--- | :--- |
| `API-T01` | Unit Test | `apps/api/src/catalog/products.service.spec.ts`<br>`apps/api/src/catalog/products.controller.spec.ts` | Kiểm thử logic tìm kiếm danh mục món và chi tiết sản phẩm theo ID. |
| `WEB-T01` | Unit Test | `apps/web/__tests__/menu.test.tsx` | Kiểm thử giao diện menu mobile-first, trạng thái Loading, Empty và Error fallback. |
| `API-T02` | Unit Test | `apps/api/src/auth/auth.service.spec.ts` | Kiểm thử đăng ký, băm mật khẩu, đăng nhập và cấp phát token JWT. |
| `WEB-T04-AUTH` | Unit Test | `apps/web/__tests__/auth.test.tsx` | Kiểm thử form đăng nhập/đăng ký có validate, mã lỗi 401/409, quản lý JWT token và trạng thái Navbar / cart badge. |
| `WEB-T05-CHECKOUT` | Unit Test / Integration | `apps/web/__tests__/checkout.test.tsx`<br>`apps/web/tests/checkout.test.tsx` | Kiểm thử bảo vệ checkout, chặn giỏ rỗng, Idempotency-Key UUID, chống double-click, server-authoritative pricing, giữ giỏ & orderId khi retry, và clear giỏ sau PAID. |
| `WEB-T06-ORDERS` | Unit Test | `apps/web/__tests__/orders.test.tsx`<br>`apps/web/__tests__/order-detail.test.tsx`<br>`apps/web/__tests__/order-stepper.test.tsx` | Kiểm thử giao diện lịch sử đơn hàng, chi tiết đơn hàng và stepper trạng thái đơn của G. |
| `INT-T01` | Integration | `tests/integration/orders.spec.ts` | Kiểm thử luồng tạo đơn hàng, tính tiền, và gọi transaction cập nhật số lượng tồn kho. |
| `INT-T02` | Integration | `tests/integration/payments.spec.ts` | Kiểm thử cơ chế thanh toán mô phỏng (MoMo/VNPay/Card) và xử lý Idempotency-Key. |
| `E2E-T01` | End-to-End | `tests/e2e/checkout-flow.spec.ts` | Kiểm thử luồng hoàn chỉnh từ xem menu -> chọn size/topping -> giỏ hàng -> đặt đơn -> thanh toán thành công. |
| `SMOKE-01`| Smoke Test | `apps/api/src/health/health.controller.spec.ts` | Kiểm tra tính sẵn sàng của hệ sinh thái backend và kết nối cơ sở dữ liệu qua endpoint `/health`. |

