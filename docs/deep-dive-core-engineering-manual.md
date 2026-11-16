# CẨM NANG NGHIÊN CỨU TẬN LÕI ĐỒ ÁN BREWLITE
## (Deep-Dive Core Engineering Manual – Dành cho Buổi Bảo vệ 30 – 60 Phút)

> **Môn học:** Công nghệ Phần mềm (Software Engineering) – ĐH Sài Gòn (SGU)  
> **Dự án:** BrewLite – Assignment 2 (Requirements to Deployment)  
> **Mục tiêu:** Trang bị kiến thức chiều sâu ở mức độ "Hiểu đến từng dòng code, từng gói tin mạng và từng câu lệnh SQL" để tự tin làm chủ buổi bảo vệ kéo dài từ 30 đến 60 phút trước những câu hỏi phản biện hóc búa nhất của Hội đồng.

---

## 1. PHÂN BỔ CẤU TRÚC BUỔI BẢO VỆ 30 – 60 PHÚT

Trong một buổi bảo vệ chuyên sâu 30–60 phút, Thầy Cô sẽ không chỉ ngồi nghe slide. Buổi thi sẽ diễn ra theo 3 giai đoạn:

```
[ GIAI ĐOẠN 1: BÁO CÁO TỔNG QUAN ] (10 - 15 phút)
  - Slide: Bối cảnh, Scope MVP, 5 Task CNPM, Traceability Matrix.
  - Sơ đồ Kiến trúc & Sequence Diagram.
             │
             ▼
[ GIAI ĐOẠN 2: LIVE DEMO TOÀN DIỆN ] (10 - 15 phút)
  - Demo luồng người dùng trên Mobile View (Vercel).
  - Demo 4 ca khó: Test A (sửa giá), Test B (hủy đơn), Test C (concurrency).
  - Chạy toàn bộ 243 tests trên Terminal.
             │
             ▼
[ GIAI ĐOẠN 3: VẤN ĐÁP KỸ THUẬT CHUYÊN SÂU (CODE & DB AUDIT) ] (20 - 30 phút)
  - "Mở code chỗ này cho Thầy xem!"
  - "Tại sao chỗ này dùng Transaction mà không dùng Lock?"
  - "Giải thích Request Lifecycle từ NestJS xuống PostgreSQL."
  - "Tại sao tiền tệ không dùng Float?"
```

---

## 2. LÕI TẦNG 1: FRONTEND (NEXT.JS 15 PWA & REACT STATE)

### 2.1. Server Components vs Client Components (`'use client'`)
* **Bản chất:**
  * Next.js App Router mặc định mọi component là **Server Component (RSC)**. RSC được render ra HTML sẵn trên server, không tải thêm mã JavaScript của thư viện về trình duyệt $\to$ Tải trang cực nhanh, SEO tối đa, bảo mật API keys.
  * Các file có tương tác người dùng (như nút bấm, form, hook `useState`, `useEffect`, `useContext`) bắt buộc phải khai báo `'use client'` ở đầu file (ví dụ: `ProductOptionSelector.tsx`, `CartContext.tsx`, `checkout/page.tsx`).
* **Câu hỏi hội đồng:** *"Tại sao trang Menu không render 100% Client-side?"*
  * **Trả lời:** *"Dạ danh mục món ít biến động nên SSR/Server Component giúp trang Menu hiển thị gần như tức thì (FCP < 1s), giảm tải xử lý cho điện thoại khách hàng. Chỉ những component cần chọn Size, Topping mới dùng Client Component."*

### 2.2. Quản lý trạng thái Giỏ hàng (`CartContext.tsx`)
* **Tại sao dùng React Context API mà không dùng Redux Toolkit hay Zustand?**
  * Đồ án ưu tiên tính **gọn nhẹ, không bloat thư viện**. Giỏ hàng cà phê có cấu trúc dữ liệu đơn giản: mảng các `CartItem`. Context API có sẵn trong React là đủ, kết hợp đồng bộ hóa với `localStorage` để khách F5 không mất giỏ hàng.
* **Cơ chế Gộp dòng (Item Deduplication):**
  * Nếu khách chọn cùng `productId`, cùng `selectedSize` và cùng danh sách `selectedToppings` $\to$ Tăng `quantity`.
  * Nếu khác size hoặc khác topping $\to$ Tạo thành dòng mới riêng biệt.

---

## 3. LÕI TẦNG 2: BACKEND (NESTJS REQUEST LIFECYCLE & IOC)

Khi một HTTP Request gửi đến NestJS, nó đi qua **7 trạm kiểm soát** theo thứ tự nghiêm ngặt:

```
[ Request từ Client ]
       │
       ▼
 1. Middleware (CORS, Logger, Express json parser)
       │
       ▼
 2. Guards (JwtAuthGuard ➔ RolesGuard)
       │ (Kiểm tra token hợp lệ và quyền hạn)
       ▼
 3. Interceptors (Pre-controller: Logging, Metrics)
       │
       ▼
 4. Pipes (ValidationPipe: Whitelist DTO, Transform)
       │ (Chặn trường rác, ép kiểu dữ liệu)
       ▼
 5. Controller (Định tuyến route, gọi Service tương ứng)
       │
       ▼
 6. Service (Xử lý nghiệp vụ lõi & Database Transaction)
       │
       ▼
 7. Exception Filters (Bắt lỗi và chuẩn hóa JSON response trả về Client)
```

### 3.1. Bí mật của `ValidationPipe` trong `main.ts`
Trong file `apps/api/src/main.ts`:
```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,              // (1) Tự động gạt bỏ các thuộc tính không khai báo trong DTO
    forbidNonWhitelisted: true,   // (2) NÉM LỖI 400 ngay lập tức nếu client gửi thuộc tính lạ
    transform: true,              // (3) Tự động ép kiểu chuỗi sang số/boolean theo DTO
  }),
);
```
👉 **Tại sao có Test A?** Chính cờ `forbidNonWhitelisted: true` là "lá chắn thép" phát hiện ra hacker chèn thêm trường `price: 1000` vào DTO và quăng ra lỗi `400 Bad Request: property price should not exist`.

### 3.2. Dependency Injection (DI) & Inversion of Control (IoC)
* Các Service (`OrdersService`, `PrismaService`, `PaymentsService`) được đánh dấu bằng `@Injectable()`.
* NestJS tự động quản lý vòng đời (Lifecycle) và tiêm (inject) các instance vào Controller thông qua constructor:
  ```typescript
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
  ) {}
  ```
* **Lợi ích khi kiểm thử:** Khi viết Unit Test (`orders.service.spec.ts`), chúng ta có thể dễ dàng mock `PrismaService` bằng một object giả mà không cần bật Database thật!

---

## 4. LÕI TẦNG 3: CƠ SỞ DỮ LIỆU & TOÀN VẸN DỮ LIỆU (PRISMA & POSTGRESQL)

### 4.1. Tại sao dùng kiểu `Decimal` cho Tiền tệ mà KHÔNG DÙNG `Float`?
* Trong `apps/api/prisma/schema.prisma`:
  `basePrice Decimal`, `subTotal Decimal`, `totalAmount Decimal`.
* **Bản chất khoa học máy tính:**
  * Kiểu `Float` / `Double` biểu diễn số thực theo chuẩn **IEEE 754** (dùng nhị phân mũ). Trong máy tính, phép tính `0.1 + 0.2` sẽ ra `0.30000000000000004`. Trong tài chính, nếu dùng Float sẽ gây sai lệch tiền lẻ và thất thoát doanh thu khi cộng dồn hàng nghìn đơn.
  * Kiểu `Decimal` trong PostgreSQL tương ứng với kiểu dữ liệu `NUMERIC(precision, scale)`, lưu trữ số thực dưới dạng chuỗi số học cố định, **chính xác tuyệt đối 100% đến từng đồng**.

### 4.2. Bản chất của `Prisma.$transaction` (ACID)
Trong `orders.service.ts`:
```typescript
const result = await this.prisma.$transaction(async (tx) => { ... });
```
* **A (Atomicity - Nguyên tử):** Nếu bước trừ kho thành công nhưng bước tạo đơn lỗi, toàn bộ thao tác tự động Rollback, không có dữ liệu rác.
* **C (Consistency - Nhất quán):** Ràng buộc khóa ngoại (`userId` trỏ tới `User.id`, `productId` trỏ tới `Product.id`) luôn toàn vẹn.
* **I (Isolation - Cô lập):** PostgreSQL sử dụng mức cô lập mặc định là **Read Committed**.
* **D (Durability - Bền vững):** Khi transaction commit thành công, dữ liệu được ghi vào nhật ký WAL (Write-Ahead Logging) trên ổ cứng NVMe, dù server cúp điện đột ngột cũng không mất dữ liệu.

### 4.3. Concurrency: Cập nhật có điều kiện nguyên tử vs Khóa bi quan (`SELECT FOR UPDATE`)
* **Cách 1: Khóa bi quan (`SELECT FOR UPDATE`):** Khóa cứng dòng sản phẩm lại, bắt các request khác xếp hàng đợi. Nhược điểm: Dễ gây nghẽn cổ chai (bottleneck) và Deadlock nếu nhiều người cùng xem.
* **Cách 2: Cập nhật có điều kiện nguyên tử (Hệ thống BrewLite đang dùng):**
  ```sql
  UPDATE "Product" 
  SET "stockQuantity" = "stockQuantity" - :qty 
  WHERE "id" = :id 
    AND "stockQuantity" >= :qty 
    AND "isAvailable" = true;
  ```
  * **Tại sao tối ưu hơn?** Câu lệnh này tận dụng cơ chế Row-level Lock nội tại của PostgreSQL trong thời gian cực ngắn (vài micro-giây). Nếu kho không đủ, nó trả về `count = 0` ngay lập tức mà không cần lock chờ đợi lâu, hiệu năng cao gấp nhiều lần so với khóa bi quan.

---

## 5. LÕI TẦNG 4: BẢO MẬT & XỬ LÝ THANH TOÁN (IDEMPOTENCY & AUTH)

### 5.1. Băm Mật khẩu Bcrypt (`auth.service.ts`)
* `bcrypt.hash(password, 12)`:
  * **Salt (Muối):** Sinh chuỗi ngẫu nhiên nối vào mật khẩu trước khi băm, chống hoàn toàn kỹ thuật tấn công bằng bảng tra cứu trước (Rainbow Table).
  * **12 Salt Rounds (Work Factor):** $2^{12} = 4096$ vòng băm. Thuật toán cố tình làm chậm quá trình tính toán lại (khoảng 200–300ms) để hacker không thể brute-force hàng triệu mật khẩu mỗi giây.
  * **Giới hạn 72 bytes:** Bcrypt nguyên bản bỏ qua ký tự từ byte thứ 73 trở đi. Trong `auth.service.ts`, hệ thống kiểm tra độ dài input để tránh lỗi này.

### 5.2. Cơ chế Idempotency-Key (Tránh thanh toán trùng)
* **Quy trình hoạt động:**
  1. Client sinh chuỗi ngẫu nhiên UUID v4 (ví dụ: `c8d1...`).
  2. Gửi vào Header: `Idempotency-Key: c8d1...`
  3. Server nhận request:
     * Truy vấn bảng `Order` hoặc `Payment` xem key này đã tồn tại chưa (`findUnique({ where: { idempotencyKey } })`).
     * **Nếu đã tồn tại:** Kiểm tra xem `userId` có khớp không. Nếu khớp và payload trùng khớp, trả về ngay kết quả đơn hàng cũ kèm mã HTTP 200/201 mà **không tạo đơn mới hay trừ tiền lần hai**.
     * **Nếu payload khác:** Báo lỗi `409 Conflict: IDEMPOTENCY_KEY_PAYLOAD_MISMATCH` (chống việc dùng 1 key để mua 2 món khác nhau).
     * **Nếu key chưa có:** Thực thi tạo đơn và lưu `idempotencyKey` vào Database.

---

## 6. LÕI TẦNG 5: DEVOPS, DOCKER & CI/CD CLOUD

### 6.1. Docker Multi-Stage Build (`apps/api/Dockerfile`)
* **Tại sao phải dùng Multi-stage build?**
  * Giai đoạn 1 (`builder`): Chứa toàn bộ `node_modules`, `devDependencies`, TypeScript compiler, Prisma CLI. Dung lượng container này có thể lên đến **1.2 GB**.
  * Giai đoạn 2 (`runner`): Chỉ copy code đã build (`dist/`), schema Prisma và production dependencies tối thiểu. Dung lượng giảm xuống chỉ còn khoảng **150 MB** $\to$ Triển khai cực nhanh, bảo mật (không để lại source code TypeScript và compiler trên server).
* **Khởi chạy an toàn:**
  `CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]`
  * Tự động chạy migration để nâng cấp cấu trúc database trước khi mở cổng API lắng nghe kết nối.

### 6.2. Giải pháp Giữ ấm Render (Keep-Alive Cron)
* **Vấn đề thực tế:** Render gói Free-tier sẽ tự động đưa dịch vụ vào chế độ "ngủ đông" (Spin down) nếu không có truy cập trong 15 phút. Khi có khách vào lại, thời gian khởi động lại (Cold Start) mất tới 50–90 giây.
* **Giải pháp kỹ thuật của nhóm:**
  Viết GitHub Actions Workflow định kỳ ping vào endpoint `GET /health` mỗi 14 phút trong khung giờ 07:00 – 23:00 VN:
  ```yaml
  schedule:
    - cron: '*/14 0-16 * * *'
  ```
  Nhờ đó, máy chủ Render luôn ấm (warm) 100% và phản hồi tức thì dưới 500ms trong toàn bộ thời gian đánh giá đồ án!

---

## 7. BỘ 15 CÂU HỎI "SÁT THỦ" VÀ CÂU TRẢ LỜI CHUẨN KỸ SƯ

1. **Hỏi:** *"Tại sao em không dùng RESTful thuần túy mà lại có endpoint `/orders/:id/status` dùng PATCH?"*
   * **Trả lời:** *"Dạ thưa Thầy, cập nhật trạng thái đơn là một thao tác cập nhật một phần (partial update) và tuân theo máy trạng thái hữu hạn (State Machine) được bảo vệ bởi RBAC, nên dùng động từ PATCH là chuẩn ngữ nghĩa RESTful nhất ạ."*
2. **Hỏi:** *"Nếu hệ thống có 100.000 người truy cập cùng lúc thì điểm nghẽn (bottleneck) đầu tiên nằm ở đâu?"*
   * **Trả lời:** *"Dạ điểm nghẽn đầu tiên sẽ nằm ở **Connection Pool của PostgreSQL** (mặc định khoảng 20-50 kết nối) và CPU của Database khi xử lý các câu lệnh ghi đồng thời. Giải pháp mở rộng là đặt Redis phía trước để cache danh mục menu, dùng PgBouncer để gom connection pool, và tách Database thành mô hình Read/Write Replicas ạ."*
3. **Hỏi:** *"Tại sao token JWT không lưu trong Database mà vẫn biết khi nào nó hết hạn?"*
   * **Trả lời:** *"Dạ JWT là Stateless Token. Trong payload của JWT có trường `exp` (expiration time). Khi client gửi token lên, `JwtAuthGuard` dùng secret key giải mã và kiểm tra chữ ký mã hóa (signature); nếu thời gian hiện tại lớn hơn `exp` thì thư viện tự động ném lỗi `UnauthorizedException: jwt expired` mà không cần truy vấn Database ạ."*
4. **Hỏi:** *"Làm sao đảm bảo Khách A không xem được đơn hàng của Khách B bằng cách sửa ID trên URL (Lỗ hổng IDOR)?"*
   * **Trả lời:** *"Dạ trong hàm `findOne(id, userId)` tại `orders.service.ts`, câu lệnh truy vấn luôn có điều kiện kiểm tra quyền sở hữu: nếu `order.userId !== userId` và người dùng không có role `ADMIN`/`MANAGER`, hệ thống ném ngay lỗi `ForbiddenException (ORDER_ACCESS_DENIED)` ạ."*
5. **Hỏi:** *"Tại sao nhóm hoãn (Deferred) tính năng Voucher (FR-08)?"*
   * **Trả lời:** *"Dạ theo quy trình quản trị phạm vi Agile/Scrum, nhóm ưu tiên độ tin cậy tuyệt đối cho luồng thanh toán và trừ kho trong Sprint 2. Tính năng Voucher liên quan đến kiểm tra hạn dùng, điều kiện tối thiểu và tranh chấp số lượng mã khuyến mãi, nên nhóm ghi rõ hoãn lại trong `api-contracts.md` và `traceability-matrix.md` để đảm bảo chất lượng của các tính năng cốt lõi ạ."*
