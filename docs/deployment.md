# Task 3.2 – Tài liệu và Sơ đồ Triển khai Production (Deployment)

Tài liệu này mô tả chi tiết kiến trúc triển khai thực tế của hệ thống **BrewLite** trên môi trường Production đám mây (Cloud), đáp ứng các tiêu chuẩn về bảo mật, hiệu năng và tính sẵn sàng cao.

---

## 1. Sơ đồ Triển khai Production (UML Deployment Diagram)

Sơ đồ mô tả chi tiết các nút thiết bị, vùng mạng (VPC/Private Network), container, dịch vụ đám mây và ranh giới môi trường (Local, CI/CD, Production).

![Production Deployment Diagram](../diagrams/deployment-production.svg)
*File mã nguồn PlantUML: [`docs/diagrams/deployment-production.puml`](../diagrams/deployment-production.puml)*

---

## 2. Chi tiết các Thành phần Hạ tầng (Infrastructure Components)

### 2.1. Thiết bị Người dùng (Client Device)
* **Thiết bị:** Smartphone (iOS/Android) hoặc Máy tính cá nhân chạy trình duyệt hiện đại (Chrome, Safari, Edge).
* **Ứng dụng:** Trình duyệt web / PWA cài đặt trên màn hình chính.
* **Giao thức:** Toàn bộ kết nối đến hệ thống bắt buộc chạy qua **HTTPS (Port 443 / TLS 1.3)** có chứng chỉ SSL/TLS tự động.

### 2.2. Dịch vụ Frontend (Next.js PWA Host)
* **Nền tảng:** Vercel Global Edge Network / Render Static & SSR Service.
* **Chức năng:** Phục vụ giao diện Next.js, static assets (ảnh, font, script) qua CDN toàn cầu; render Server-Side Rendering (SSR) cho trang Menu.
* **Cấu hình môi trường:** Biến `NEXT_PUBLIC_API_URL` trỏ về tên miền API Backend Production.

### 2.3. Dịch vụ Backend API (NestJS Container)
* **Nền tảng:** Render Web Service / Railway Managed Container.
* **Môi trường chạy:** Docker Container chạy bản build tối ưu của NestJS (`node:20-alpine` hoặc `node:22-alpine`).
* **Cổng dịch vụ:** Container lắng nghe cổng nội bộ `PORT=3001`, được Cloud Proxy định tuyến từ cổng HTTPS 443 bên ngoài.
* **Health Check & Giám sát:** Cấu hình Health Endpoint `GET /health` tự động kiểm tra mỗi 30 giây; hỗ trợ tự khởi động lại nếu container gặp sự cố.

### 2.4. Cơ sở dữ liệu Production (Managed PostgreSQL)
* **Nền tảng:** Supabase PostgreSQL / Render Managed Database.
* **Bộ nhớ lưu trữ:** **Persistent Storage (NVMe SSD)** đảm bảo dữ liệu không bị mất khi container API khởi động lại.
* **Bảo mật mạng:** Cơ sở dữ liệu được đặt trong mạng an toàn, yêu cầu kết nối mã hóa SSL (`sslmode=require`), không công khai cổng bừa bãi ra Internet.

### 2.5. Ranh giới Môi trường (Local vs CI vs Production)
* **Local Development:** Lập trình viên chạy ứng dụng thông qua `docker-compose.yml` gồm 3 service: `web` (cổng 3000), `api` (cổng 3001) và `postgres` (cổng 5432).
* **CI/CD Pipeline (GitHub Actions):** Tự động khởi chạy máy ảo Ubuntu sạch, nạp Postgres container để chạy lint, migration deploy, seed dữ liệu và thực thi toàn bộ test suite.
* **Production Cloud:** Hệ thống đám mây phân tán, cách ly secret qua Environment Variables của Cloud Platform, tự động triển khai mã nguồn khi bản build CI đạt chuẩn.

---

## 3. Hướng dẫn Triển khai Production lên Đám mây có HTTPS (Cloud Deployment)

Hệ thống được thiết kế để triển khai nhanh chóng, bảo mật và hoàn toàn tự động cấp chứng chỉ **HTTPS (SSL/TLS 1.3)** thông qua hai nền tảng đám mây phổ biến:

### 3.1. Bước 1: Khởi tạo Cơ sở dữ liệu PostgreSQL (Supabase / Render Managed)
1. Đăng ký/Đăng nhập vào [Render.com](https://render.com) hoặc [Supabase.com](https://supabase.com).
2. Tạo mới một **PostgreSQL Database** với tên `brewlite-db`.
3. Lấy chuỗi kết nối an toàn: `postgresql://user:password@host:5432/brewlite-db?sslmode=require`.
4. Cơ sở dữ liệu được lưu trên Persistent NVMe SSD, bảo đảm an toàn dữ liệu và không mở cổng trực tiếp ra ngoài Internet.

### 3.2. Bước 2: Triển khai Backend API lên Render (Web Service có HTTPS)
1. Trên Render Dashboard, chọn **New** ➔ **Web Service** ➔ Kết nối với GitHub Repository `Gtvkun-ai/brewlite-a2`.
2. Cấu hình triển khai:
   * **Name:** `brewlite-api`
   * **Region:** Singapore (Southeast Asia - tối ưu độ trễ cho người dùng Việt Nam).
   * **Branch:** `main`
   * **Root Directory:** Để trống (sử dụng Dockerfile từ root) hoặc chọn `apps/api`.
   * **Environment:** `Docker` (Render tự động tìm `apps/api/Dockerfile`).
   * **Health Check Path:** `/health` (Render tự động kiểm tra mỗi 30 giây để đảm bảo uptime).
3. Thiết lập biến môi trường (Environment Variables) bảo mật:
   * `DATABASE_URL`: `postgresql://...` (lấy từ Bước 1)
   * `JWT_SECRET`: Chuỗi ngẫu nhiên tối thiểu 32 ký tự (ví dụ: `brewlite-production-secret-jwt-key-2026-sgu`).
   * `PORT`: `3001`
   * `CORS_ORIGIN`: `https://brewlite-web.vercel.app` (hoặc domain frontend tương ứng).
4. Bấm **Create Web Service**. Render tự động build và cấp URL HTTPS công khai:
   👉 **`https://brewlite-a2.onrender.com`** (Kiểm tra `/health` trả về `{ status: "ok", uptime: ..., database: { status: "up" } }`).

### 3.3. Bước 3: Triển khai Frontend Next.js lên Vercel (Edge CDN có HTTPS)
1. Đăng nhập vào [Vercel.com](https://vercel.com) bằng tài khoản GitHub.
2. Bấm **Add New Project** ➔ Chọn kho mã nguồn `Gtvkun-ai/brewlite-a2`.
3. Cấu hình dự án:
   * **Framework Preset:** `Next.js`
   * **Root Directory:** Bấm Edit ➔ Chọn `apps/web`.
4. Thiết lập biến môi trường:
   * `NEXT_PUBLIC_API_URL`: `https://brewlite-a2.onrender.com` (URL Backend từ Bước 2).
5. Bấm **Deploy**. Vercel tự động build và phân phối qua mạng lưới Edge CDN toàn cầu với HTTPS tự động:
   👉 **`https://brewlite-a2.vercel.app`**.

---

## 4. Hướng dẫn Khởi chạy Hệ thống Cục bộ (Local Docker Compose)

Để một người không thuộc nhóm có thể clone repository và chạy toàn bộ hệ thống ngay trên máy cá nhân:

```bash
# 1. Clone repository
git clone https://github.com/Gtvkun-ai/brewlite-a2.git
cd brewlite-a2

# 2. Khởi chạy toàn bộ hệ sinh thái (Database, API, Web) bằng Docker Compose
docker compose up --build -d

# 3. Kiểm tra trạng thái các container đang chạy
docker compose ps
```

* **Frontend Web:** Truy cập tại [http://localhost:3000](http://localhost:3000)
* **Backend API:** Truy cập tại [http://localhost:3001](http://localhost:3001)
* **API Health Check:** [http://localhost:3001/health](http://localhost:3001/health)
* **PostgreSQL:** Cổng `5432` (`POSTGRES_USER=brew`, `POSTGRES_DB=brewlite`)

Dừng hệ thống khi không sử dụng:
```bash
docker compose down
```

---

## 5. Quy trình Kiểm thử Khói & Quay lui (Smoke Test & Rollback Procedure)

### 5.1. Kiểm thử khói sau triển khai (Post-deployment Smoke Test)
Sau khi hoàn tất cập nhật phiên bản mới trên Production, thực hiện kiểm tra nhanh 3 bước:
1. **Kiểm tra liveness & DB connection:**
   ```bash
   curl -i https://brewlite-a2.onrender.com/health
   # Kỳ vọng: HTTP 200 OK, {"status":"ok","database":{"status":"up"}}
   ```
2. **Kiểm tra truy vấn Menu:**
   ```bash
   curl -i https://brewlite-a2.onrender.com/products
   # Kỳ vọng: HTTP 200 OK, danh sách sản phẩm mẫu hiển thị đầy đủ.
   ```
3. **Kiểm tra giao diện người dùng:** Mở trình duyệt truy cập `https://brewlite-a2.vercel.app`, kiểm tra menu tải nhanh dưới 1.5 giây, thêm món vào giỏ hàng và mở giỏ hàng không bị lỗi mạng.

### 5.2. Quy trình Quay lui khi gặp sự cố (Rollback Procedure)
Khi phiên bản mới gặp lỗi nghiêm trọng (crash, hỏng database migration, lỗi thanh toán):
1. **Quay lui Frontend trên Vercel:**
   * Truy cập Vercel Dashboard ➔ Tab **Deployments**.
   * Tìm bản deployment trước đó đang hoạt động ổn định.
   * Bấm vào menu 3 chấm ➔ Chọn **Promote to Production** (Thực hiện tức thì trong 5 giây mà không cần build lại mã nguồn).
2. **Quay lui Backend trên Render:**
   * Truy cập Render Dashboard ➔ Service `brewlite-api` ➔ Tab **Events / Deploys**.
   * Chọn bản deploy thành công trước đó ➔ Bấm **Rollback to this deploy**.
3. **Quay lui Database Migration (Nếu có sự cố cấu trúc bảng):**
   * Kết nối vào database qua psql hoặc lệnh CLI:
     ```bash
     npx prisma migrate resolve --rolled-back <migration_name>
     ```
   * Áp dụng file migration khôi phục đã chuẩn bị sẵn để bảo vệ toàn vẹn dữ liệu đơn hàng và người dùng.
