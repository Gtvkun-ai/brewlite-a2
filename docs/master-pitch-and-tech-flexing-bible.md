# KINH THÁNH PITCHING & MÚA CÔNG NGHỆ THƯỢNG THỪA
## (The Master Pitch, Architecture & Tech-Flexing Bible – Production Grade)

> **Dự án:** BrewLite – Assignment 1 & Assignment 2  
> **Khoa CNTT – Đại học Sài Gòn (SGU)**  
> **Mục tiêu:** Trang bị toàn bộ từ vựng, kịch bản, bản chất kỹ thuật và nghệ thuật dẫn dắt để biến buổi bảo vệ 30–60 phút thành một buổi thuyết trình công nghệ đỉnh cao, bảo vệ tuyệt đối điểm số trước mọi câu hỏi phản biện của Hội đồng.

---

## MỤC LỤC TỪ A ĐẾN Z

1. **Chương 1: Tư duy Pitching "Enterprise Grade" – Định vị lại đồ án**
2. **Chương 2: Bộ từ điển "Múa công nghệ" (Translating Student Code to Architect Language)**
3. **Chương 3: Bóc tách Tận lõi 5 Tầng Công nghệ & Quyết định Thiết kế (ADRs)**
4. **Chương 4: Kế thừa & Chuyển dịch toàn diện từ A1 lên A2**
5. **Chương 5: Bảng đối soát từng mũi tên trên Sơ đồ UML sang Dòng Code thực tế**
6. **Chương 6: Bản đồ Tọa độ 269 Bài Test & Cách chứng minh 4 Ca Thẩm tra (TEST A, B, C, D)**
7. **Chương 7: Kịch bản Mở màn & Dẫn dắt Live Demo kịch tính từng phút (Timeline 45 phút)**
8. **Chương 8: Cẩm nang Phản đòn Vấn đáp (Defensive Jujitsu) – 20 Câu hỏi hóc búa nhất**

---

## CHƯƠNG 1: TƯ DUY PITCHING "ENTERPRISE GRADE" – ĐỊNH VỊ LẠI ĐỒ ÁN

### 1.1. Sai lầm chí mạng của sinh viên khi đi bảo vệ đồ án:
* Nói như đang đọc lại tài liệu: *"Hệ thống tụi em có 6 chức năng: xem menu, giỏ hàng, đặt hàng..."* $\to$ **Thầy Cô nghe chán và bắt đầu soi lỗi.**
* Dùng từ ngữ đơn giản: *"Em làm cái hàm này để trừ tiền"*, *"Em dùng Prisma cho tiện"*.
* Phòng thủ bị động: Đợi thầy cô hỏi gì mới trả lời nấy, trả lời cụt ngủn "có" hoặc "không".

### 1.2. Phong cách "Senior Principal Architect / Startup Founder":
* **Đặt vấn đề ở tầm vĩ mô (Industry Pain Point):** Biến việc bán cà phê thành bài toán **"High-Concurrency Retail Transaction Engine & Real-time Order Fulfillment"**.
* **Nhấn mạnh vào Trade-off (Sự đánh đổi kỹ thuật):** Không có giải pháp hoàn hảo, chỉ có giải pháp phù hợp nhất với bối cảnh bài toán (định lý CAP, PACELC, ACID vs BASE).
* **Chủ động "bẫy" hội đồng:** Tự mình nêu ra những ca khó (concurrency, race condition, idempotency, security) trước khi thầy cô kịp hỏi. Khi bạn tự nêu ra và tự demo cách giải quyết, hội đồng sẽ mặc định bạn đã làm chủ 100% hệ thống.

---

## CHƯƠNG 2: BỘ TỪ ĐIỂN "MÚA CÔNG NGHỆ" (STUDENT $\to$ SENIOR ARCHITECT)

Khi nói chuyện với Thầy Cô, hãy "nâng cấp" toàn bộ từ vựng theo bảng chuẩn này:

| Khi bạn định nói (Cách nói sinh viên) | Hãy thay bằng (Cách nói Senior Architect) | Bản chất kỹ thuật bên dưới |
| :--- | :--- | :--- |
| "Web em viết bằng Next.js" | *"Hệ thống Frontend triển khai theo kiến trúc **Mobile-first PWA (Progressive Web App)** trên nền tảng **Next.js 15 App Router**, tối ưu hóa **First Contentful Paint (FCP < 800ms)** và hỗ trợ **Offline Precaching** qua Service Worker."* | Server-Side Rendering (SSR) cho Menu, Client Components cho tương tác, Service Worker cache asset. |
| "Backend em viết bằng NestJS" | *"Kiến trúc Backend chuẩn **Micro-modular Monolith** áp dụng nguyên lý **Domain-Driven Design (DDD)** và **Inversion of Control (IoC)**, phân tách ranh giới nghiệp vụ (Bounded Contexts) chặt chẽ."* | Module encapsulation, Dependency Injection, Controller-Service-Repository pattern. |
| "Em dùng PostgreSQL lưu dữ liệu" | *"Hệ quản trị CSDL quan hệ chuẩn doanh nghiệp với cơ chế **Write-Ahead Logging (WAL)** và **MVCC (Multi-Version Concurrency Control)**, cam kết đảm bảo tính toàn vẹn **ACID cấp độ nghiêm ngặt** cho các giao dịch tài chính."* | Transaction bền vững, không mất dữ liệu khi crash, hỗ trợ Row-level locking. |
| "Khách bấm thanh toán 2 lần không bị trừ tiền 2 lần" | *"Hiện thực hóa **Idempotency Pattern chuẩn đặc tả IETF** với định danh **UUID v4** kết hợp kiểm tra **Payload Checksum Hash**, triệt tiêu hoàn toàn rủi ro **Double-Spending** và **Network Jitter**."* | Lưu idempotencyKey `@unique` vào bảng Payment/Order, bắt lỗi P2002 hoặc so khớp payload. |
| "Kho còn 2 ly, 2 người cùng bấm mua thì em trừ kho" | *"Xử lý bài toán **Race Condition** trong môi trường High-Concurrency bằng kỹ thuật **Atomic Conditional Compare-And-Swap (CAS)** trực tiếp ở tầng RDBMS Engine, tối ưu hóa Throughput và loại trừ triệt để nguy cơ Deadlock so với Pessimistic Lock truyền thống."* | `UPDATE "Product" SET stock = stock - qty WHERE id = :id AND stock >= qty`. |
| "Hacker sửa giá 1.000đ gửi lên em chặn lại" | *"Áp dụng mô hình bảo mật **Zero-Trust Input Validation & Server-authoritative Pricing**. Tầng Ingress chặn thuộc tính lạ bằng **DTO Whitelisting**, còn tầng Domain Logic tự tính toán lại đơn giá từ **Single Source of Truth** trong Database."* | `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })`, truy vấn `basePrice` từ PostgreSQL. |
| "Em deploy lên Vercel với Render" | *"Mô hình **Cloud-Native Hybrid Deployment**: Phân phối Frontend qua **Serverless Global Edge CDN**; Backend đóng gói **OCI-compliant Container (Docker Multi-stage)** vận hành trên PaaS kèm cơ chế **Heartbeat Telemetry Keep-Alive 24/7**."* | Docker Multi-stage giảm size từ 1.2GB về 150MB, Cron workflow ping /health mỗi 14 phút. |

---

## CHƯƠNG 3: BÓC TÁCH TẬN LÕI 5 TẦNG KIẾN TRÚC & QUYẾT ĐỊNH THIẾT KẾ (ADRS)

### 3.1. Tầng 1: Presentation Layer (Next.js 15 PWA)
* **Quyết định thiết kế (ADR-002):** Tại sao không viết Flutter/React Native mà dùng PWA?
  * *Lý do:* Khách uống cà phê vãng lai sẽ **không tải app 100MB từ App Store** chỉ để mua 1 ly nước. Mô hình PWA quét mã QR vào web ngay, cho phép ghim ra Home Screen, gửi notification, trải nghiệm mượt mà 60 FPS trên mobile.
* **Bản chất kỹ thuật State Management:**
  * Giỏ hàng dùng `CartContext.tsx` kết hợp `localStorage`. Tại sao không dùng Redux? Vì Redux làm phình bundle size thêm 40KB (vi phạm YAGNI - You Aren't Gonna Need It). Context API là giải pháp tối ưu cho Local Subtree State.

### 3.2. Tầng 2: Ingress & Validation Layer (NestJS Guards & Pipes)
* Vòng đời Request (Request Lifecycle):
  $$\text{Client} \to \text{CORS Middleware} \to \text{JwtAuthGuard} \to \text{RolesGuard} \to \text{ValidationPipe} \to \text{Controller}$$
* File `apps/api/src/main.ts`:
  * `whitelist: true`: Tự động loại bỏ các field thừa.
  * `forbidNonWhitelisted: true`: Ném `400 Bad Request` nếu phát hiện field lạ (Vũ khí bắt **TEST A**).
  * `transform: true`: Tự động ép kiểu chuỗi URL thành số nguyên hoặc boolean theo DTO.

### 3.3. Tầng 3: Domain & Transaction Layer (ACID)
* File `apps/api/src/orders/orders.service.ts`:
  * Sử dụng `this.prisma.$transaction(async (tx) => { ... })`.
  * **Atomicity:** Toàn bộ chuỗi thao tác: (1) Kiểm tra Idempotency $\to$ (2) Kiểm tra trạng thái món $\to$ (3) Trừ kho có điều kiện $\to$ (4) Tính giá server $\to$ (5) Tạo Order & OrderItems phải thành công cùng lúc. Bất kỳ bước nào lỗi, toàn bộ hệ thống rollback trong 1 micro-giây.

### 3.4. Tầng 4: Persistence Layer (PostgreSQL 16 & Prisma ORM)
* **Tại sao tiền tệ bắt buộc dùng `Decimal` mà không dùng `Float`?**
  * Số thực `Float` trong máy tính tuân theo chuẩn **IEEE 754** (dùng phân số nhị phân mũ). Khi cộng `0.1 + 0.2` sẽ ra `0.30000000000000004`. Trong tài chính, sai số này sẽ làm thất thoát tiền tỷ khi quy mô đơn hàng lớn.
  * `Decimal` trong Prisma ánh xạ sang `NUMERIC` trong PostgreSQL, lưu trữ dưới dạng số học cố định, **chính xác tuyệt đối 100% đến từng xu**.

### 3.5. Tầng 5: DevOps & Continuous Delivery
* File `apps/api/Dockerfile`:
  * Sử dụng **Multi-stage build**: Tách riêng giai đoạn `builder` (chứa toàn bộ compiler, TypeScript, devDependencies nặng 1.2GB) và giai đoạn `runner` (chỉ chứa `dist/`, `prisma` và production dependencies nặng 150MB).
  * Lệnh chạy: `CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]` $\to$ Đảm bảo Database luôn được nâng cấp schema tự động trước khi API khởi động.

---

## CHƯƠNG 4: KẾ THỪA & CHUYỂN DỊCH TOÀN DIỆN TỪ A1 LÊN A2

Khi Thầy Cô hỏi: *"Đồ án này khác gì Assignment 1?"*, hãy trình bày bảng đối soát 1-1 này:

| Thành phần cốt lõi | Assignment 1 (Code-first / 10 Task) | Assignment 2 (Engineering-first / 5 Task) | Ý nghĩa Kỹ nghệ phần mềm |
| :--- | :--- | :--- | :--- |
| **Mô hình dự án** | 2 thư mục rời rạc `frontend/` và `backend/`. | **Monorepo npm workspaces:** `apps/web` và `apps/api`. | Chuẩn hóa quản lý dependencies, CI/CD tập trung, build đồng nhất. |
| **Quy trình phát triển** | Code tự do theo 10 task (T1 $\to$ T10). | **5 Task chuẩn mực tuần tự:** Task 1 (SRS/MoSCoW) $\to$ Task 2 (UML) $\to$ Task 3 (ADRs) $\to$ Task 4 (Sprint 1) $\to$ Task 5 (Sprint 2/Delivery). | Đúng quy chuẩn phát triển phần mềm doanh nghiệp, có tài liệu phiên bản hóa. |
| **Tính truy vết** | Chưa có ma trận truy vết chính quy. | **Bảng Ma trận Truy vết hai chiều (`docs/traceability-matrix.md` - Mục 8.1 đề bài)**. | Kết nối 2 chiều: FR $\Longleftrightarrow$ Use Case $\Longleftrightarrow$ Diagram $\Longleftrightarrow$ Code $\Longleftrightarrow$ Test. |
| **Giải quyết Concurrency** | Optimistic lock dùng vòng lặp thử lại `for attempt < 3` (dễ nghẽn mạng). | **Atomic Conditional Update** trong SQL (`WHERE stockQuantity >= qty`). | Loại trừ vòng lặp retry, xử lý tức thì ở tầng database engine. |
| **Quản trị phạm vi (Agile)** | Cố làm cả Voucher GIAM10 và tích điểm Loyalty. | **Hoãn (DEFERRED) tính năng Voucher** theo `api-contracts.md` để tập trung 100% toàn vẹn dữ liệu cho Checkout. | Thể hiện tư duy quản lý phạm vi chuyên nghiệp, không làm ẩu làm bừa. |
| **Môi trường vận hành** | Chạy local máy cá nhân bằng Docker Compose. | **Triển khai Cloud Production thực tế có HTTPS/SSL 1.3:** Vercel (Edge CDN) + Render Docker + PostgreSQL Cloud + GitHub Keep-Alive Cron. | Đưa sản phẩm ra môi trường thực tế phục vụ người dùng cuối. |

---

## CHƯƠNG 5: BẢNG ĐỐI SOÁT TỪNG MŨI TÊN TRÊN SƠ ĐỒ UML SANG CODE

Mở sơ đồ `docs/diagrams/sequence-checkout.puml` lên màn hình chiếu, vừa chỉ tay vừa mở code:

| Mũi tên trên Sequence Diagram | Hành động kỹ thuật tương ứng | File code & Dòng đối soát thực tế |
| :--- | :--- | :--- |
| **Bước 27–30:** Customer $\to$ UI $\to$ API | Client sinh `Idempotency-Key` UUID v4, gửi body KHÔNG có giá tiền | `apps/web/app/checkout/page.tsx`<br>`apps/web/lib/checkout-api.ts` |
| **Bước 33–35:** API Ingress Validation | `JwtAuthGuard` trích xuất `userId`, `ValidationPipe` quét DTO chặn trường rác | `apps/api/src/orders/orders.controller.ts`<br>`apps/api/src/main.ts` |
| **Bước 39–42:** Check Idempotency | Tìm xem `idempotencyKey` đã tồn tại trong DB chưa, nếu có trả lại kết quả cũ | `apps/api/src/orders/orders.service.ts` (L63–L107) |
| **Bước 44–49:** Start Transaction | Khởi tạo `prisma.$transaction` để bao bọc tính toàn vẹn ACID | `apps/api/src/orders/orders.service.ts` (L120) |
| **Bước 50–53:** Alt: Stock Out | Nếu kho không đủ, ném ngay `400 Bad Request: OUT_OF_STOCK` | `apps/api/src/orders/orders.service.ts` (L173–L178) |
| **Bước 54–64:** Atomic Deduct & Pricing | Trừ kho có điều kiện `WHERE stockQuantity >= qty` và tự tính tiền từ DB | `apps/api/src/orders/orders.service.ts` (L162–L193) |
| **Bước 65–79:** Mock Payment Gateway | Gọi dịch vụ thanh toán mô phỏng kèm Idempotency-Key | `apps/api/src/payments/payments.service.ts` |
| **Bước 81–89:** Commit & Update PAID | Cập nhật `OrderStatus.PAID` và `PaymentStatus.SUCCESS` | `apps/api/src/orders/orders.service.ts` |
| **Bước 107–108:** Clear Cart & Stepper | Nhận mã 201 Created $\to$ Xóa LocalStorage giỏ hàng $\to$ Chuyển sang Stepper | `apps/web/context/CartContext.tsx`<br>`apps/web/app/orders/[id]/page.tsx` |

---

## CHƯƠNG 6: BẢN ĐỒ TỌA ĐỘ 128 TEST VÀ CÁCH CHỨNG MINH 4 CA THẨM TRA (A, B, C, D)

### 6.1. Tọa độ các bài test cốt lõi:
* **Backend Unit & Security (68 tests):** Chạy lệnh `npm run test --workspace @brewlite/api`
  * `auth.security.spec.ts`: 13 ca test băm bcrypt, role injection, JWT giả mạo.
  * `orders.service.spec.ts`: 19 ca test tính giá, trừ kho, hủy đơn.
  * `payments.service.spec.ts`: Ca test Idempotency-Key và Mock Gateway.
* **Frontend Web Component (60 tests):** Chạy lệnh `npm run test --workspace @brewlite/web`
  * `cart.test.tsx`: Test tính giá phụ thu Size/Topping, gộp/tách dòng giỏ hàng.
  * `checkout.test.tsx`: Test khóa nút Submit chống double-click, sinh Idempotency-Key.
  * `orders.test.tsx` & `order-stepper.test.tsx`: Test Stepper 4 bước và phân quyền xem đơn.
* **End-to-End Test (E2E):** Chạy lệnh `npx playwright test` mô phỏng người dùng thật.

### 6.2. Kịch bản thực chiến 4 Ca Thẩm tra của Giảng viên:
1. **TEST A (Sửa giá qua API):**
   * *Gửi Postman:* `POST /orders` chèn `price: 1000`.
   * *Kết quả:* Lập tức nhận mã `400 Bad Request: property price should not exist`. Server chứng minh không tin giá client.
2. **TEST B (Hủy đơn đã thanh toán):**
   * *Thực hiện:* Đặt đơn thành công (`PAID`), sau đó gọi lệnh hủy `PATCH /orders/:id/cancel`.
   * *Kết quả:* Đơn đổi sang `CANCELLED`, kho được hoàn trả tự động `stockQuantity: { increment: item.quantity }`, trạng thái thanh toán chuyển sang `REFUND_PENDING` (chờ xử lý hoàn tiền minh bạch, không giả mạo giao dịch ngân hàng).
3. **TEST C (Tranh chấp tồn kho đồng thời):**
   * *Thực hiện:* Kho còn 2 ly, 2 tài khoản gửi request mua 2 ly cùng lúc (`Promise.all`).
   * *Kết quả:* 1 khách mua thành công (Win), 1 khách nhận lỗi `400 OUT_OF_STOCK`, tồn kho cuối cùng về đúng 0, **tuyệt đối không âm kho**.
4. **TEST D (Định mức nguyên vật liệu BOM):**
   * *Công thức:* $\text{Số ly tối đa} = \min(\text{Nguyên liệu}_i / \text{Định mức}_i)$. Khi hết nguyên liệu hạn chế thì ngưng nhận đơn.

---

## CHƯƠNG 7: KỊCH BẢN MỞ MÀN & DẪN DẮT LIVE DEMO KỊCH TÍNH (45 PHÚT)

* **Phút 00–05: Mở màn thôi miên (The Hook)**
  * Tech Lead A đứng lên trình bày bài toán ách tắc giao dịch giờ cao điểm trong ngành F&B, khẳng định đồ án tuân thủ chuẩn Kỹ nghệ phần mềm 5 Task của Đại học Sài Gòn.
* **Phút 06–15: Trình chiếu Kiến trúc & Ánh xạ Sơ đồ UML sang Code**
  * Chiếu sơ đồ Sequence Diagram, chỉ tay vào từng mũi tên và mở trực tiếp các file code `main.ts`, `orders.service.ts`, `payments.service.ts` để chứng minh sự nhất quán 100%.
* **Phút 16–25: Live Demo Luồng Người Dùng trên Mobile View (Vercel)**
  * Bật trình duyệt chế độ Mobile 375px: Xem menu $\to$ Tùy biến Large (+10k) $\to$ Thêm giỏ $\to$ Đăng nhập $\to$ Thanh toán $\to$ Xem Stepper thời gian thực.
* **Phút 26–35: Biểu diễn 4 Ca Thẩm tra Kỹ thuật Khó (Điểm nhấn ăn trọn điểm 10)**
  * Biểu diễn Postman hack giá bị chặn (Test A).
  * Biểu diễn hủy đơn hoàn kho an toàn (Test B).
  * Chạy lệnh Terminal `npm run test` cho thấy 269 tests pass xanh 100%.
* **Phút 36–45: Vấn đáp phản biện & Kết luận**
  * Cả 7 thành viên tự tin tiếp nhận câu hỏi của Hội đồng theo cẩm nang phản đòn.

---

## CHƯƠNG 8: CẨM NANG PHẢN ĐÒN VẤN ĐÁP (20 CÂU HỎI HÓC BÚA NHẤT)

1. **Hỏi:** *"Tại sao em không dùng Microservices mà dùng Monorepo?"*
   * **Trả lời:** *"Dạ theo nguyên lý 'First Law of Distributed Objects' của Martin Fowler, Microservices phát sinh chi phí khổng lồ về Network Latency và Distributed Transactions. Với quy mô MVP, Monorepo Modular Monolith là giải pháp tối ưu nhất theo ADR-001: vừa đảm bảo ranh giới module độc lập, vừa chia sẻ types an toàn và giữ p95 latency < 500ms ạ."*
2. **Hỏi:** *"Cơ chế Idempotency-Key hoạt động thế nào nếu khách đổi món mà giữ nguyên key?"*
   * **Trả lời:** *"Dạ trong `orders.service.ts` L85-L103, hệ thống có bước kiểm tra đối khớp Payload (`isPayloadMatch`). Nếu khách dùng lại key cũ nhưng gửi danh sách món khác, hệ thống ném ngay lỗi `409 Conflict: IDEMPOTENCY_KEY_PAYLOAD_MISMATCH` để chống gian lận ạ."*
3. **Hỏi:** *"Tại sao token JWT không lưu ở Database mà vẫn biết khi nào nó hết hạn?"*
   * **Trả lời:** *"Dạ JWT là Stateless Token. Trong Payload có trường `exp`. Khi client gửi lên, `JwtAuthGuard` dùng Secret Key giải mã và kiểm tra chữ ký số; nếu `Date.now() > exp` thì thư viện tự ném lỗi `401 Unauthorized: jwt expired` mà không cần tốn tài nguyên truy vấn Database ạ."*
4. **Hỏi:** *"Làm sao chống lỗ hổng IDOR khi khách A sửa ID đơn hàng trên URL để xem trộm đơn của khách B?"*
   * **Trả lời:** *"Dạ trong mọi câu lệnh `findOne` tại `orders.service.ts`, hệ thống luôn có điều kiện kiểm tra sở hữu: nếu `order.userId !== currentUser.id` và người dùng không có role Staff/Admin, hệ thống ném ngay `403 Forbidden: ORDER_ACCESS_DENIED` ạ."*
5. **Hỏi:** *"Tại sao nhóm hoãn (Deferred) tính năng Voucher (FR-08)?"*
   * **Trả lời:** *"Dạ theo quy trình quản trị phạm vi Agile/Scrum, nhóm ưu tiên độ tin cậy tuyệt đối cho luồng thanh toán và trừ kho trong Sprint 2. Tính năng Voucher được ghi nhận hoãn lại chính thức trong `api-contracts.md` và `traceability-matrix.md` để đảm bảo chất lượng cao nhất cho các chức năng cốt lõi ạ."*
