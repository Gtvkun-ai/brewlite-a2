# KỊCH BẢN DẪN DẮT THẨM ĐỊNH KIẾN TRÚC & ĐỐI SOÁT ĐỒ ÁN BREWLITE
## (Master Walkthrough & Architecture Defense Guide)

> **Môn học:** Công nghệ Phần mềm (Software Engineering) – ĐH Sài Gòn (SGU)  
> **Dự án:** BrewLite – Assignment 2 (Requirements to Deployment)  
> **Phiên bản:** 1.0.0 (Production Release)  
> **Mục tiêu:** Cung cấp tài liệu "cầm tay chỉ việc" để nhóm tự tin dẫn dắt Giảng viên đi qua từng luồng kiến trúc, sơ đồ thiết kế, đối soát mã nguồn và kiểm chứng toàn vẹn dữ liệu.

---

## 1. CHIẾN LƯỢC "CẦM TRỊCH" BUỔI BẢO VỆ (12 – 15 PHÚT)

Giảng viên bộ môn CNPM thường có ít thời gian và chấm rất gắt gao về **tính nhất quán giữa Tài liệu và Code**. Nếu để Thầy Cô tự lật mở repo, Thầy Cô sẽ tìm những chỗ sơ hở để hỏi. **Nguyên tắc số 1: Nhóm phải chủ động dẫn dắt Thầy Cô từ đầu đến cuối theo kịch bản có sẵn.**

### Phân bổ thời gian chuẩn (15 phút):
1. **Phút 01 – 02: Định vị đồ án & Quy trình CNPM** (Tech Lead A nói):
   * Giới thiệu bài toán: Đặt món cà phê không tiền mặt, chống nghẽn quầy giờ cao điểm.
   * Nhấn mạnh: Đồ án tuân thủ nghiêm ngặt **5 Task tuần tự** và tính **Truy vết hai chiều (Traceability)** từ SRS $\to$ Sơ đồ $\to$ Code $\to$ Test $\to$ Deploy.
2. **Phút 03 – 05: Dẫn luồng Kiến trúc & Sơ đồ** (A & C nói):
   * Mở sơ đồ Sequence và Deployment để Thầy thấy bức tranh tổng thể.
3. **Phút 06 – 09: Live Demo luồng chính End-to-End** (E, F, G demo):
   * Demo trên điện thoại thật hoặc giao diện F12 Mobile (~375px) của trang production [brewlite-a2.vercel.app](https://brewlite-a2.vercel.app).
4. **Phút 10 – 12: Đột phá điểm 10 – Chứng minh 4 Ca kiểm thử khó (Lecturer Audit Tests)** (B, C, D demo):
   * TEST A: Chặn hacker sửa giá qua Postman.
   * TEST B: Hủy đơn đã trả tiền $\to$ Hoàn kho & `REFUND_PENDING`.
   * TEST C: Tranh chấp 2 khách mua ly cuối cùng $\to$ Chứng minh không âm kho.
5. **Phút 13 – 15: Giới hạn hệ thống, Bàn giao & Vấn đáp phản biện**.

---

## 2. DẪN LUỒNG KIẾN TRÚC HỆ THỐNG (ARCHITECTURE FLOW)

Khi Thầy Cô hỏi: *"Hệ thống này được tổ chức như thế nào?"*, hãy mở file `docs/architecture/architecture-overview.md` và trình bày theo mô hình 4 tầng:

```
[ LAYER 1: PRESENTATION - Next.js 15 PWA ]
  - Giao diện Mobile-first (375px - 430px), hỗ trợ cài đặt ra màn hình chính (PWA).
  - Quản lý giỏ hàng phía Client qua `CartContext` (lưu LocalStorage).
           │  HTTPS / REST API (Bearer JWT, Idempotency-Key)
           ▼
[ LAYER 2: APPLICATION CONTROLLERS - NestJS 11 ]
  - Định tuyến (Routing), Guards (JwtAuthGuard, RolesGuard).
  - ValidationPipe (Whitelist DTO, chặn trường rác/giá giả).
           │
           ▼
[ LAYER 3: DOMAIN SERVICES & TRANSACTION ]
  - OrdersService: Server-authoritative Pricing (tính giá từ DB), Atomic Stock Deduction.
  - PaymentsService: Idempotency Handler (chống trừ tiền 2 lần).
           │  Prisma ORM ($transaction ACID)
           ▼
[ LAYER 4: DATA PERSISTENCE - PostgreSQL 16 ]
  - Bảng dữ liệu quan hệ, Row-level Locking, Migrations quản lý qua Git.
```

### 5 Quyết định Kiến trúc cốt lõi (ADRs) sẵn sàng dẫn chứng:
* **ADR 001:** Dùng *Monorepo (npm workspaces)* để đồng bộ kiểu dữ liệu giữa Web và API.
* **ADR 002:** Dùng *Next.js PWA* thay vì viết Mobile App riêng (React Native/Flutter) để khách không cần cài app từ Store.
* **ADR 003:** Dùng *NestJS Modular* để phân tách ranh giới module rõ ràng.
* **ADR 004:** Dùng *PostgreSQL + Prisma ORM* để đảm bảo tính toàn vẹn giao dịch tài chính (ACID).
* **ADR 005:** Dùng *Mock Payment Service có Idempotency* để phục vụ đồ án học thuật mà vẫn đảm bảo tính an toàn thanh toán thực tế.

---

## 3. BÓC TÁCH TỪNG SƠ ĐỒ UML VÀ ÁNH XẠ CODE THỰC TẾ

### Sơ đồ 1: Activity Diagram – Luồng Khách hàng Đặt món
* **File sơ đồ:** `docs/diagrams/activity-checkout.puml`
* **Cách dẫn dắt Thầy Cô:**
  1. *"Thưa Thầy/Cô, sơ đồ Activity mô tả hành trình từ lúc khách xem danh mục đồ uống đến khi hoàn tất nhận món."*
  2. **Bước 1 (Xem menu & Tùy biến):** Chỉ vào hành động *Duyệt món* $\to$ Mở code `apps/web/app/page.tsx` và `ProductOptionSelector.tsx` (chọn size Regular/Large + Topping).
  3. **Bước 2 (Kiểm tra giỏ hàng):** Chỉ vào nhánh rẽ *Giỏ hàng rỗng / Giỏ có món* $\to$ Mở `apps/web/context/CartContext.tsx`.
  4. **Bước 3 (Thanh toán):** Chỉ vào nhánh rẽ *Thanh toán thành công / Thất bại* $\to$ Mở `apps/web/app/checkout/page.tsx`.

---

### Sơ đồ 2: Sequence Diagram – Trọng tâm Use Case Đặt hàng & Thanh toán (UC-01)
* **File sơ đồ:** `docs/diagrams/sequence-checkout.puml`
* **Cách dẫn dắt từng mũi tên sang code (Đối soát 1-1):**

| Mũi tên trên Sequence Diagram | Hành động kỹ thuật | File code & Dòng đối soát tương ứng |
| :--- | :--- | :--- |
| **Mũi tên 27 - 30:** `Customer -> UI -> API` | Khách bấm Đặt hàng; UI sinh UUID `Idempotency-Key` gửi kèm header; body KHÔNG có giá tiền. | `apps/web/app/checkout/page.tsx`<br>`apps/web/lib/checkout-api.ts` |
| **Mũi tên 33 - 35:** `API -> API (Validation)` | `JwtAuthGuard` trích xuất `userId`; `ValidationPipe` quét DTO loại bỏ thuộc tính lạ. | `apps/api/src/orders/orders.controller.ts`<br>`apps/api/src/orders/dto/create-order.dto.ts` |
| **Mũi tên 39 - 42:** `Service -> DB (Check Idempotency)` | Kiểm tra `idempotencyKey` xem đơn hàng này đã từng tạo trước đó chưa. | `apps/api/src/orders/orders.service.ts` (L63–L107) |
| **Mũi tên 44 - 49:** `Prisma $transaction` | Mở Database Transaction nguyên tử để đảm bảo toàn vẹn dữ liệu. | `apps/api/src/orders/orders.service.ts` (L120) |
| **Mũi tên 50 - 53:** `Alt: Stock <= 0` | Nếu kho không đủ, trả lỗi `400 Bad Request (OUT_OF_STOCK)`. | `apps/api/src/orders/orders.service.ts` (L173–L178) |
| **Mũi tên 54 - 64:** `tx.product.update` | Trừ kho có điều kiện nguyên tử `WHERE stockQuantity >= requiredQty`. | `apps/api/src/orders/orders.service.ts` (L162–L171) |
| **Mũi tên 65 - 79:** `processPayment` | Gọi dịch vụ thanh toán mô phỏng kèm Idempotency-Key. | `apps/api/src/payments/payments.service.ts` |
| **Mũi tên 81 - 89:** `tx.order.update` | Thanh toán thành công, cập nhật trạng thái đơn sang `PAID`. | `apps/api/src/orders/orders.service.ts` |
| **Mũi tên 107 - 108:** `Clear Cart & Stepper` | Frontend nhận kết quả 201 Created $\to$ Xóa sạch giỏ hàng $\to$ Điều hướng sang trang Stepper trạng thái. | `apps/web/context/CartContext.tsx`<br>`apps/web/app/orders/[id]/page.tsx` |

---

### Sơ đồ 3: Domain Class Diagram & Vòng đời Đơn hàng (State Machine)
* **File sơ đồ:** `docs/diagrams/class-domain.puml`
* **File code đối soát:** `apps/api/prisma/schema.prisma` và `apps/api/src/orders/orders.service.ts`
* **Cách dẫn dắt:**
  1. *"Thưa Thầy Cô, hệ thống mô hình hóa quan hệ 1-N giữa `User`, `Order`, `OrderItem`, `Product` và quan hệ 1-1 giữa `Order` và `Payment`."*
  2. Chỉ vào enum `OrderStatus` và giải thích State Machine nghiêm ngặt:
     $$\text{PENDING} \xrightarrow{\text{Thanh toán thành công}} \text{PAID} \xrightarrow{\text{Barista pha chế}} \text{PREPARING} \xrightarrow{\text{Hoàn tất}} \text{READY} \xrightarrow{\text{Giao khách}} \text{COMPLETED}$$
  3. **Nhánh hủy:** Chỉ cho phép hủy khi đơn ở trạng thái `PENDING` hoặc `PAID`. Nếu hủy ở trạng thái `PAID`, thanh toán chuyển sang `REFUND_PENDING` và kho được hoàn trả tự động. Chặn hoàn toàn việc chuyển trạng thái bất hợp lệ (ví dụ: đã `COMPLETED` thì không thể `CANCELLED`).

---

### Sơ đồ 4: Production Deployment Diagram – Môi trường Thực tế
* **File sơ đồ:** `docs/diagrams/deployment-production.puml`
* **Cách dẫn dắt:**
  1. Frontend: Triển khai trên **Vercel Edge Network**, tự động cấp chứng chỉ HTTPS/SSL.
  2. Backend: Đóng gói **Docker Container** triển khai trên **Render Web Service** tại Singapore.
  3. Database: **Managed PostgreSQL** kết nối nội bộ qua chuỗi kết nối bảo mật có SSL.
  4. Cơ chế Giữ ấm (Keep-alive): Chỉ vào file `.github/workflows/keep-alive.yml` – Giới thiệu GitHub Actions định kỳ ping `/health` mỗi 14 phút để tránh Render free-tier bị cold-start.

---

## 4. KỊCH BẢN THỰC CHIẾN: CHỨNG MINH 4 CA THẨM TRA KHÓ (TEST A – D)

### 💥 TEST A: Chống sửa giá qua API (`API-01`)
* **Cách làm:** Mở Postman hoặc Terminal, gửi request đặt hàng:
  ```json
  POST /orders
  {
    "items": [{ "productId": "prod_coffee_1", "quantity": 1, "price": 1000 }]
  }
  ```
* **Cho Thầy thấy:**
  * Máy chủ trả về ngay: `HTTP 400 Bad Request: property price should not exist`.
  * Mở file `apps/api/src/main.ts`: Chỉ vào `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })`.
  * Mở file `apps/api/src/orders/orders.service.ts`: Chỉ vào đoạn server tự đọc `product.basePrice` từ Database để tính tiền chứ không dùng giá client.

---

### 💥 TEST B: Hủy đơn đã thanh toán (`ORD-01` đến `ORD-04`)
* **Cách làm:** Đặt một đơn hàng thành công (trạng thái `PAID`), sau đó gửi lệnh gọi `PATCH /orders/:id/cancel`.
* **Cho Thầy thấy:**
  * Trạng thái đơn đổi thành: `CANCELLED`.
  * Trạng thái thanh toán đổi thành: `REFUND_PENDING` (không tự nhận đã chuyển tiền về tài khoản ngân hàng của khách).
  * Mở Database: Tồn kho của món đó tự động tăng trở lại đúng số lượng qua câu lệnh:
    `stockQuantity: { increment: item.quantity }`.

---

### 💥 TEST C: Tranh chấp tồn kho đồng thời (Concurrency - `CON-01`)
* **Cách trả lời ăn trọn điểm 10:**
  * *"Dạ thưa Thầy, ở mức phần cứng và mạng luôn có độ trễ nano-giây. Khi request chạm vào PostgreSQL, câu lệnh `UPDATE` của chúng em bắt buộc phải có điều kiện `WHERE stockQuantity >= requiredQty`. Tiến trình nào chiếm được Exclusive Row Lock của PostgreSQL trước thì cập nhật thành công (count = 1) và WIN. Tiến trình sau bị kẹt ở hàng đợi khóa, khi vào đọc lại thì kho đã bị trừ về 0 nên điều kiện WHERE bị sai (count = 0), hệ thống ném ngay lỗi `OUT_OF_STOCK` và Rollback, đảm bảo kho về 0 chứ không bao giờ bị âm ạ."*

---

### 💥 TEST D: Định mức nguyên vật liệu (BOM)
* **Cách trả lời:**
  * *"Dạ công thức hệ thống áp dụng là $\text{Số ly tối đa} = \min(\text{Nguyên liệu}_i / \text{Định mức}_i)$. Khi một nguyên liệu hạn chế chạm ngưỡng 0 thì sản phẩm tự động chuyển cờ `isAvailable = false` để ngưng nhận đơn ạ."*

---

## 5. PHÂN VAI VÀ LỜI THOẠI 60 GIÂY CHO 7 THÀNH VIÊN

* **Thành viên A (Tech Lead & DevOps):**
  > *"Em phụ trách Kiến trúc tổng thể Monorepo, Docker Compose, CI/CD Pipeline 4 bước trên GitHub Actions và triển khai Cloud HTTPS. Hệ thống đạt độ trễ p95 dưới 500ms và điểm Lighthouse mobile trên 90 điểm. Em đảm bảo mọi PR đều phải pass test trước khi vào nhánh chính."*
* **Thành viên B (Auth & Security):**
  > *"Em phụ trách Module Xác thực: Đăng ký, Đăng nhập, Băm mật khẩu bcrypt 12 rounds và JWT Guard. Em đã kiểm thử 13 ca bảo mật: chặn token giả mạo, chặn lộ mật khẩu băm, và chống người dùng tự gán quyền Admin qua API."*
* **Thành viên C (Orders & Stock):**
  > *"Em phụ trách Tạo đơn hàng, Tính giá Server-side và Trừ kho nguyên tử. Em chịu trách nhiệm Test A (chặn sửa giá qua Postman) và Test C (trừ kho có điều kiện nguyên tử để chặn đứng tình trạng bán vượt kho khi 2 người mua cùng lúc)."*
* **Thành viên D (Payments & Health Check):**
  > *"Em phụ trách Mock Payment Gateway, cơ chế Idempotency-Key và Health Check. Em đảm bảo khách bấm thanh toán 2 lần liên tiếp không bị trừ tiền 2 lần, xử lý Test B hoàn kho và chuyển trạng thái sang REFUND_PENDING khi hủy đơn."*
* **Thành viên E (Options & Cart UI):**
  > *"Em phụ trách Giao diện chọn Size, Topping và Quản lý giỏ hàng bằng React Context. Giỏ hàng hỗ trợ gộp dòng nếu trùng size/topping, lưu an toàn vào LocalStorage, và khi gửi sang bước Checkout chỉ gửi ID và số lượng chứ không gửi giá tiền."*
* **Thành viên F (Auth UI & Checkout Flow):**
  > *"Em phụ trách Form Đăng nhập/Đăng ký và Luồng Checkout. Em sinh mã Idempotency-Key UUID, khóa nút bấm chống double-click, và chỉ xóa giỏ hàng khi backend phản hồi đơn hàng đã chuyển trạng thái PAID thành công."*
* **Thành viên G (Orders UI, Traceability & QA):**
  > *"Em phụ trách Trang theo dõi đơn hàng với Stepper 4 bước thời gian thực, thiết kế Kịch bản kiểm thử E2E Playwright và phụ trách duy trì Bảng Ma trận Truy vết hai chiều kết nối từ SRS đến từng dòng code và ca test."*

---

## 6. DANH MỤC CHECKLIST TRƯỚC GIỜ BẢO VỆ

- [ ] Máy laptop đã bật sẵn Docker Desktop và chạy thử `docker compose up -d` thành công (phòng trường hợp mất mạng trường).
- [ ] Trình duyệt đã mở sẵn 4 tab:
  1. Web Vercel: `https://brewlite-a2.vercel.app` (Bật F12 chế độ Mobile 375px).
  2. Health check: `https://brewlite-a2.onrender.com/health` (Hiện `{"status":"ok"}`).
  3. GitHub Actions: Mở tab Actions thấy các workflow màu xanh lá.
  4. File `traceability-matrix.md` trong VS Code.
- [ ] Terminal mở sẵn tại thư mục `brewlite-a2`, gõ sẵn lệnh `npm run test` (chỉ cần Enter là chạy ra 243 tests pass xanh mướt).
- [ ] Chuẩn bị sẵn Postman/cURL kịch bản chèn giá giả 1.000đ để sẵn sàng biểu diễn cho Thầy xem khi được hỏi.
