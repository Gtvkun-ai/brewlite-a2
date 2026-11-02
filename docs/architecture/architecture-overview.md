# Task 3.1 – Tài liệu Thiết kế Kiến trúc Hệ thống (Architecture Overview)

## 1. Phương pháp Kiến trúc (Architectural Approach)
Hệ thống **BrewLite** được thiết kế theo mô hình **Kiến trúc Phân lớp (Layered Architecture)** kết hợp nguyên lý **Domain-Driven Design (DDD)** và tổ chức dưới dạng **Monorepo**.

```text
+-------------------------------------------------------------+
|                 PRESENTATION LAYER (Next.js)                |
|  - App Router, React Components, Zustand Cart State         |
|  - Mobile-first PWA, Service Worker, Responsive Layout      |
+-------------------------------------------------------------+
                               |  HTTPS / REST JSON
                               v
+-------------------------------------------------------------+
|                  APPLICATION / API (NestJS)                 |
|  - Controllers: Auth, Catalog, Cart, Order, Payment, Health |
|  - Guards (JWT Auth), Interceptors, ValidationPipe (DTO)    |
+-------------------------------------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                    DOMAIN & SERVICE LAYER                   |
|  - Services: AuthService, CatalogService, OrderService      |
|  - Mock Payment Service, Idempotency Handler                |
+-------------------------------------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                  DATA PERSISTENCE (Prisma)                  |
|  - Prisma Client ORM, ACID Transactions ($transaction)      |
|  - PostgreSQL Database with Persistent Storage              |
+-------------------------------------------------------------+
```

---

## 2. Các Thành phần Cốt lõi (Core Components)

### 2.1. Frontend: Next.js (Mobile-first PWA)
* **Framework:** Next.js (App Router) với Server-Side Rendering (SSR) cho trang tĩnh và Client Components cho tương tác động.
* **Tối ưu di động (PWA):** Cấu hình `manifest.json`, hỗ trợ ghim ứng dụng ra màn hình chính, giao diện cảm ứng mượt mà (tap target $\ge 48\text{px}$).
* **Trạng thái giỏ hàng:** Quản lý state đồng bộ qua LocalStorage đảm bảo không mất giỏ hàng khi người dùng tải lại trang.

### 2.2. Backend: NestJS Modular Architecture
* Tổ chức mã nguồn theo các Module độc lập:
  * `AuthModule`: Đăng ký, đăng nhập, băm mật khẩu Bcrypt/Argon2 và ký JWT Token.
  * `CatalogModule`: Cung cấp danh mục sản phẩm, chi tiết món và quản lý tồn kho.
  * `OrderModule`: Xử lý tạo đơn hàng, tính tiền, áp dụng Transaction khi trừ tồn kho.
  * `PaymentModule`: Tích hợp dịch vụ thanh toán mô phỏng (Mock Gateway) với xử lý Idempotency.
  * `HealthModule`: Cung cấp endpoint `GET /health` kiểm tra tình trạng kết nối Database và bộ nhớ.

### 2.3. Cơ sở dữ liệu: PostgreSQL & Prisma Migrations
* Lưu trữ quan hệ đảm bảo toàn vẹn dữ liệu cho đơn hàng và giao dịch tài chính.
* Cơ chế **Prisma Migrate** tự động tạo mã SQL migration và phiên bản hóa cấu trúc dữ liệu qua git.

### 2.4. Dịch vụ Thanh toán Mô phỏng & Cơ chế Idempotency
* Dịch vụ thanh toán giả lập hỗ trợ thanh toán tức thì qua Ví hoặc Thẻ.
* Header `Idempotency-Key` được kiểm tra trước khi trừ tiền: nếu gặp request gửi lặp trong 5 phút, hệ thống trả về ngay kết quả đơn hàng đã tạo thay vì tạo đơn thứ hai.

### 2.5. Logging, Health Check & Quản lý Cấu hình
* **Config Management:** Sử dụng `@nestjs/config` nạp biến môi trường từ `.env`, tự động validate khi khởi động ứng dụng.
* **Health Check:** Endpoint `GET /health` phản hồi `{ status: "ok", db: "connected", uptime: ... }`.
* **Logging:** Ghi log có cấu trúc cho mỗi request API, không in thông tin nhạy cảm (mật khẩu, token) ra console.

---

## 3. Phân tích Lý do Chọn Kiến trúc & Đánh đổi (Trade-off Analysis)

| Quyết định | Ưu điểm (Pros) | Đánh đổi / Thách thức (Cons & Trade-offs) | Biện pháp giảm thiểu |
| :--- | :--- | :--- | :--- |
| **Monorepo (`apps/web`, `apps/api`)** | • Quản lý chung mã nguồn và tài liệu trong 1 repo duy nhất.<br>• Dễ dàng đồng bộ hợp đồng API (DTO/Interface).<br>• Tiện lợi cho việc kiểm thử và CI/CD. | Kích thước repo lớn hơn, cần cấu hình CI/CD đường dẫn cẩn thận. | Dùng GitHub Actions path filter (`working-directory`) riêng cho từng app. |
| **NestJS (Modular + TypeScript)** | • Cấu trúc chuẩn mực của Enterprise, dependency injection mạnh mẽ.<br>• Type-safety chặt chẽ từ DTO đến Database.<br>• Dễ dàng kiểm thử đơn vị với mock service. | Cần thời gian làm quen với Decorator, Module và DI so với Express đơn thuần. | Tuân thủ convention chuẩn của NestJS CLI. |
| **PostgreSQL + Prisma ORM** | • Hỗ trợ Transaction ACID nghiêm ngặt, chống race-condition.<br>• Type-safe client tự sinh, không lo viết sai cú pháp SQL.<br>• Migration tự động hóa an toàn. | Prisma Client có dung lượng sinh code tương đối lớn khi build. | Áp dụng multi-stage Docker build để tối ưu image size. |
