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
