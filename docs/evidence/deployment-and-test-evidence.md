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
