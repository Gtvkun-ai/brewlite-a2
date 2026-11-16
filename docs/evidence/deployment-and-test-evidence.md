# TỔNG HỢP HÌNH ẢNH BẰNG CHỨNG (EVIDENCE) NỘP BÁO CÁO ĐỒ ÁN (.DOCX)

> **Dự án:** BrewLite – Hệ thống đặt món & thanh toán đồ uống trực tuyến (Assignment 2)  
> **Trường Đại học Sài Gòn (SGU) – Khoa Công nghệ Thông tin**  
> **Cập nhật:** 10/11/2026 – Hoàn thành Task A-20 (Cloud Staging Deployment)  
> **Tài liệu tham chiếu:** Đề bài Assignment 2 (Mục 8: Bằng chứng kiểm thử & Đóng gói)

---

## 1. Danh sách Hình ảnh Bằng chứng trong thư mục `docs/evidence/`

Dưới đây là các hình ảnh thực tế đã được lưu trữ trong thư mục `docs/evidence/`. Bạn chỉ cần copy/chèn các ảnh này vào file Word báo cáo (`.docx`) theo thứ tự các mục:

| STT | Tên file ảnh trong `docs/evidence/` | Mục trong báo cáo Word | Chú thích hình (Caption cho Word) |
| :---: | :--- | :--- | :--- |
| **1** | `vercel-deployment-success.png` | **Task 5.3: Triển khai Staging** | *Hình 5.1: Triển khai thành công Frontend Next.js lên Vercel Production trong 47 giây, tích hợp API Render và hiển thị Menu.* |
| **2** | `vercel-deployment-config.png` | **Task 5.3: Cấu hình Môi trường** | *Hình 5.2: Cấu hình dự án trên Vercel với Root Directory `apps/web` và biến môi trường `NEXT_PUBLIC_API_URL`.* |
| **3** | `render-env-vars-config.png` | **Task 3.2 / 5.3: Bảo mật Secret** | *Hình 5.3: Quản lý biến môi trường bảo mật trên Render (DATABASE_URL, JWT_SECRET, CORS_ORIGIN, NODE_ENV).* |
| **4** | `ci-pipeline-success.png` | **Task 4.2: CI Pipeline** | *Hình 4.1: Pipeline GitHub Actions CI tự động vượt qua 4 chặng: Install, Lint, Unit Test, Build.* |
| **5** | `ci-pipeline-success-pr.jpg` | **Task 4.2: Branch Protection** | *Hình 4.2: Pull Request vượt qua kiểm tra CI tự động trước khi merge vào nhánh chính.* |
| **6** | `ci-pipeline-failure.jpg` | **Task 4.2: CI Chặn Lỗi** | *Hình 4.3: Pipeline CI phát hiện và chặn đứng commit lỗi khi vi phạm Lint hoặc Test thất bại.* |
| **7** | `test-a-hack-price-rejected.jpg` | **Task C (FR-05): Chống sửa giá API** | *Hình 4.4: Postman gửi request chèn thêm price: 1000 bị ValidationPipe chặn đứng ngay lập tức với mã lỗi 400 Bad Request.* |
| **8** | `test-a-security-suite-pass.jpg` | **Task C (NFR-02 & FR-07): Kiểm thử HTTP** | *Hình 4.5: Bộ kiểm thử tích hợp Supertest pass 100% 5/5 kịch bản bảo vệ giá API, chặn 401 khi thiếu token và bảo vệ phân quyền Role Barista.* |
| **9** | `test-c-concurrency-postgres-pass.jpg` | **Task C (NFR-05): Tranh chấp kho PostgreSQL** | *Hình 4.6: Kết quả kiểm thử tích hợp tranh chấp tồn kho đồng thời trên PostgreSQL thật (Kịch bản 2/2 Giảng viên: 2 khách đồng thời mua 2 ly cuối).* |
| **10** | `test-c-concurrency-suite-pass.jpg` | **Task C (FR-05 & NFR-05): Hồi quy Jest** | *Hình 4.7: Bộ kiểm thử hồi quy Jest cho Orders & Stock Concurrency vượt qua 100% 9/9 kịch bản bảo vệ toàn vẹn dữ liệu ACID.* |
| **11** | [Link Video Drive](https://drive.google.com/file/d/1iFAsIiqNFGtv-MeEcuc0m2lD_6hZyDsd/view?usp=sharing) | **Task 5.4: Kiểm thử End-to-End** | *Video Demo E2E Production: Kiểm thử toàn trình đặt món, chống sửa giá Zero Client-Trust, thanh toán trực tuyến và trừ kho nguyên tử.* |

---

## 2. Nhật ký Kiểm thử Khói Thực tế trên Cloud (Smoke Test Log)

Kết quả gọi kiểm tra tự động trực tiếp trên môi trường Cloud ngày 10/11/2026:

### 2.1. API Health Check (`GET https://brewlite-a2.onrender.com/health`)
```json
{
  "status": "ok",
  "timestamp": "2026-11-10T13:44:15.773Z",
  "uptime": 908.008,
  "database": {
    "status": "up"
  }
}
```
* **Đánh giá:** HTTP 200 OK. Kết nối giữa Backend NestJS và cơ sở dữ liệu PostgreSQL an toàn qua SSL/TLS, hoạt động liên tục với uptime ổn định.

### 2.2. API Lấy danh mục món (`GET https://brewlite-a2.onrender.com/products`)
```json
[
  { "code": "CF-MILK", "name": "Cà phê sữa đá", "basePrice": 35000, "category": "Coffee", "isAvailable": true },
  { "code": "CF-AME", "name": "Americano đá", "basePrice": 40000, "category": "Coffee", "isAvailable": true },
  { "code": "CF-CAP", "name": "Cappuccino nóng/đá", "basePrice": 45000, "category": "Coffee", "isAvailable": true },
  { "code": "CF-CBR", "name": "Cold Brew truyền thống", "basePrice": 45000, "category": "Coffee", "isAvailable": true },
  { "code": "TEA-PEACH", "name": "Trà đào cam sả", "basePrice": 39000, "category": "Tea", "isAvailable": true },
  { "code": "TEA-MATCHA", "name": "Matcha Latte Nhật Bản", "basePrice": 48000, "category": "Tea", "isAvailable": true },
  { "code": "PAS-CROI", "name": "Bánh Croissant bơ Pháp", "basePrice": 30000, "category": "Pastry", "isAvailable": true }
]
```
* **Đánh giá:** 7 sản phẩm mẫu được nạp tự động (auto-seed) từ PostgreSQL theo đúng chuẩn tiền tệ VND và cấu trúc phân loại.

### 2.3. Frontend Web Status (`https://brewlite-a2.vercel.app`)
* **Mã phản hồi HTTP:** `200 OK`
* **Giao thức:** HTTPS (TLS 1.3 / SSL tự động cấp bởi Vercel Edge Network).

---

## 3. Các Hình ảnh Bổ sung Cần chụp thêm (Để hoàn thiện 100% Báo cáo)

Để bạn và nhóm không bị sót ảnh nào khi nộp file Word:

1. **Ảnh chụp Giao diện Web trên trình duyệt:**
   - Mở trình duyệt truy cập: `https://brewlite-a2.vercel.app`
   - Chụp toàn màn hình trang Menu thấy rõ thanh điều hướng (Logo BrewLite, Giỏ hàng, Nút Đăng nhập).
2. **Ảnh chụp Đăng nhập thành công:**
   - Dùng tài khoản test local tạm thời đã được tạo bằng biến môi trường; không dùng credential demo đã công khai trước đây trên dịch vụ live.
   - Chụp màn hình khi đăng nhập xong, Navbar chuyển sang hiển thị tên khách hàng và avatar. Không đưa mật khẩu hoặc JWT vào ảnh/log.
3. **Ảnh chụp Giỏ hàng & Thanh toán:**
   - Bấm thêm 1 ly cà phê sữa đá (chọn Size L, thêm Trân châu).
   - Mở Giỏ hàng chụp Drawer giỏ hàng và màn hình Checkout.
4. **Phần của Role G (Lê Thanh Nam - Task G-20):**
   - Chạy lệnh `npm run test:e2e` (Playwright) chụp kết quả pass toàn bộ kịch bản.
   - Mở Chrome DevTools $\rightarrow$ tab Lighthouse $\rightarrow$ bấm Analyze Page Load $\rightarrow$ chụp điểm Performance $\ge 80$.

---

## 4. Bằng chứng Kiểm thử End-to-End & Video Demo (Task 5.4 - Thành viên C: Phạm Minh Duy)

### 5.4. Video Demo Trực Tiếp Luồng End-to-End (E2E Flow trên Production)

* **Người thực hiện:** Phạm Minh Duy (Vai trò C — Backend Orders)
* **Môi trường kiểm thử:** Production Live
  * Frontend Web: [https://brewlite-a2.vercel.app](https://brewlite-a2.vercel.app)
  * Backend API: [https://brewlite-a2.onrender.com](https://brewlite-a2.onrender.com)
  * Database: Managed PostgreSQL (Neon / Supabase Cloud with SSL/TLS)
* **Link Video Demo E2E:** [Xem Video Demo Trực Tiếp Luồng End-to-End tại đây](https://drive.google.com/file/d/1iFAsIiqNFGtv-MeEcuc0m2lD_6hZyDsd/view?usp=sharing)

#### Chi tiết 2 kịch bản đối soát thực tế trong Video Demo:

##### 1. Kịch bản 1 — Đặt món tùy biến Topping (Cold Brew truyền thống - `CF-CLDBRW`):
* **Kiểm tra trạng thái ban đầu (Pre-check qua `GET /products`):**
  * Mã món: `CF-CLDBRW` (*Cold Brew truyền thống*)
  * Giá niêm yết gốc (`basePrice`): `45,000 VND`
  * Số lượng tồn kho ban đầu (`stockQuantity`): **`90`**
* **Thao tác nghiệp vụ End-to-End (Web -> API -> Payment):**
  * Khách hàng chọn 1 ly *Cold Brew truyền thống*, tùy biến Size M, thêm *Trân châu đen* (+5,000 VND).
  * Drawer giỏ hàng tính tổng hiển thị `50,000 VND`. Khách tiến hành thanh toán qua cổng mô phỏng `DOMESTIC_ATM`.
  * **Cơ chế Zero Client-Trust:** Phía Frontend hoàn toàn không gửi trường `price` lên server. Server NestJS tự tra cứu cơ sở dữ liệu và tính toán: `45,000 (base) + 5,000 (topping) = 50,000 VND`. Mọi request cố ý chèn `price` đều bị ValidationPipe chặn đứng ngay lập tức với lỗi `400 Bad Request`.
  * Đơn hàng tạo thành công mang mã: **`BL-20261115-1N4L`**, chuyển sang trạng thái **`PAID`** ngay sau khi xác nhận thanh toán.
* **Đối soát sau thanh toán (Post-check qua `GET /products`):**
  * Giao dịch trừ kho nguyên tử (`atomic decrement`) kích hoạt trong Prisma Database Transaction: `stockQuantity` giảm chính xác từ **`90` xuống `89`**.
  * Dữ liệu tồn kho được bảo toàn tính nhất quán tuyệt đối, loại trừ hoàn toàn rủi ro race condition hay over-selling.

##### 2. Kịch bản 2 — Đặt món tiêu chuẩn (Cà phê sữa đá - `CF-SDA`):
* **Kiểm tra trạng thái ban đầu (Pre-check qua `GET /products`):**
  * Mã món: `CF-SDA` (*Cà phê sữa đá*)
  * Giá niêm yết gốc (`basePrice`): `35,000 VND`
  * Số lượng tồn kho ban đầu (`stockQuantity`): **`100`**
* **Thao tác nghiệp vụ End-to-End (Web -> API -> Payment):**
  * Khách hàng chọn 1 ly *Cà phê sữa đá* (Size M / tiêu chuẩn, 100% đường, 100% đá, không topping phụ thu).
  * Khách tiến hành thanh toán qua cổng mô phỏng ngân hàng / ví điện tử `DOMESTIC_ATM`.
  * Server tính đúng giá niêm yết: **`35,000 VND`**. Đơn hàng thanh toán thành công, chuyển sang trạng thái **`PAID`**.
* **Đối soát sau thanh toán (Post-check qua `GET /products`):**
  * Tồn kho `stockQuantity` của `CF-SDA` giảm nguyên tử chính xác từ **`100` xuống `99`**.
  * Khách hàng được tự động chuyển hướng sang trang chi tiết đơn hàng hiển thị mã đơn, thông tin thanh toán và stepper trạng thái đơn thời gian thực (`PAID` $\rightarrow$ `PREPARING` $\rightarrow$ `READY` $\rightarrow$ `COMPLETED`).

---

## 5. Bằng chứng Kiểm thử Hồi quy Đồng thời & Tranh chấp Kho (Task C-30)

* **Người thực hiện:** Phạm Minh Duy (Vai trò C — Backend Orders & Stock)
* **File kiểm thử tích hợp chuyên biệt:** [`tests/integration/orders.spec.ts`](../../tests/integration/orders.spec.ts)
* **File hồi quy Jest CI/CD:** [`apps/api/src/orders/orders.concurrency.spec.ts`](../../apps/api/src/orders/orders.concurrency.spec.ts)
* **Báo cáo chi tiết:** [`docs/evidence/c30-orders-concurrency-regression-2026-11-12/report.md`](./c30-orders-concurrency-regression-2026-11-12/report.md)

### 5.1. Kịch bản 2/2 chuẩn của Giảng viên (TEST C — Đối soát PostgreSQL thật)
* **Tình huống:** Sản phẩm Croissant còn đúng 2 cái (`stockQuantity = 2`). Khách A và Khách B gửi 2 yêu cầu mua cùng lúc mỗi người 2 cái thông qua `Promise.all`.
* **Kết quả thực tế:**
  * Khách A thành công: Mã đơn `BL-20261115-BPC7`, giá trị 60.000 VND.
  * Khách B bị từ chối: Lỗi `400 Bad Request: OUT_OF_STOCK`.
  * Tồn kho sau kiểm thử: Giảm chính xác từ **`2` về `0`** (tuyệt đối không bị âm kho).
* **Đánh giá:** PASS 100%. Đáp ứng trọn vẹn yêu cầu phi chức năng `NFR-05` (Toàn vẹn dữ liệu ACID) và giải quyết triệt để ghi chú nợ kỹ thuật của Giảng viên.
* **Hình ảnh bằng chứng:**  
  ![Hình 4.6: Kết quả kiểm thử tích hợp tranh chấp tồn kho đồng thời trên cơ sở dữ liệu PostgreSQL thực tế](./test-c-concurrency-postgres-pass.jpg)

```text
======================================================================
STARTING INTEGRATION TEST: Orders & Stock Concurrency (Task C-30)
Database Target: postgresql://brew:***@localhost:5433/brewlite?schema=public
======================================================================
[PRE-CHECK] Mã sản phẩm: PAS-CROI | Tồn kho ban đầu: 2 ly
[USERS] Khách A: customer@brewlite.vn | Khách B: barista@brewlite.vn
[ACTION] Bắt đầu kích hoạt 2 yêu cầu đồng thời (mỗi khách mua 2 ly)...
[RESULT] Số đơn thành công: 1 | Số đơn bị từ chối: 1
 -> Đơn thành công: Mã đơn BL-20261115-BPC7 bởi Khách A
 -> Đơn bị từ chối: Lý do "OUT_OF_STOCK" cho Khách B
[POST-CHECK] Tồn kho sau giao dịch đồng thời: 0 ly (Tuyệt đối không âm)
----------------------------------------------------------------------
KẾT LUẬN KIỂM THỬ: PASS 100% (ĐẠT CHUẨN NFR-05 & GIẢNG VIÊN)
----------------------------------------------------------------------
[CLEANUP] Đã phục hồi tồn kho Croissant về mức 40 bình thường.
```

### 5.2. Bộ kiểm thử Hồi quy Jest Concurrency (9/9 Tests Pass)
* **Mục tiêu:** Kiểm tra 6 trường hợp biên: kịch bản 2/2, tải cao 10 requests, rollback đa sản phẩm, idempotency replay, RBAC và hủy đơn hoàn kho.
* **Kết quả:** 9/9 tests pass trong 2.629 giây.
* **Hình ảnh bằng chứng:**  
  ![Hình 4.7: Bộ kiểm thử hồi quy Orders & Stock Concurrency vượt qua 100% 9/9 kịch bản bảo vệ toàn vẹn dữ liệu ACID](./test-c-concurrency-suite-pass.jpg)
