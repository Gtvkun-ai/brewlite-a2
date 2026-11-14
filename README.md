# BrewLite – Requirements to Deployment (Assignment 2)

> **Môn học:** Công nghệ Phần mềm (Software Engineering)  
> **Trường Đại học Sài Gòn (SGU) – Khoa Công nghệ Thông tin**  
> **Học kỳ:** I – Năm học 2026–2027  
> **Công nghệ:** Next.js (Mobile-first PWA), NestJS, PostgreSQL (Prisma ORM), Docker & Cloud Deployment.

---

## 1. Giới thiệu dự án (Project Overview)
**BrewLite** là hệ thống gọi món và thanh toán đồ uống trực tuyến cho chuỗi quán cà phê hiện đại. Dự án tập trung giải quyết bài toán ách tắc tại quầy thanh toán vào giờ cao điểm, giảm thiểu sai sót order và mang lại trải nghiệm mượt mà, tiện lợi cho khách hàng thông qua mô hình **Mobile-first PWA** kết hợp dịch vụ thanh toán trực tuyến mô phỏng.

### 🌐 Môi trường Triển khai Trực tuyến (Production / Staging Live)
Hệ thống đã được đóng gói và triển khai trực tuyến trên Cloud với đầy đủ chứng chỉ bảo mật HTTPS (SSL/TLS 1.3):
* 🚀 **Frontend Web Application (Next.js PWA):** [https://brewlite-a2.vercel.app](https://brewlite-a2.vercel.app)
* ☕ **Backend API (NestJS Modular):** [https://brewlite-a2.onrender.com](https://brewlite-a2.onrender.com)
* 💓 **Health Check Endpoint:** [https://brewlite-a2.onrender.com/health](https://brewlite-a2.onrender.com/health)
* 📹 **Video Demo Trực tiếp Luồng End-to-End:** *(Đang cập nhật link video demo)*
* 🔐 Tài khoản seeded phục vụ demo local được mô tả trong [`docs/auth-api.md`](docs/auth-api.md); không dùng credential mẫu với dịch vụ live.

Dự án Assignment 2 thực hiện quy trình kỹ nghệ phần mềm hoàn chỉnh theo 5 Task tuần tự:
1. **Task 1 – Khai thác và đặc tả yêu cầu**: Bối cảnh, Stakeholders, Phạm vi (MVP, In-scope, Out-of-scope), SRS rút gọn (FR, NFR, MoSCoW, Acceptance Criteria) và Đặc tả Use-case trọng tâm.
2. **Task 2 – Mô hình hóa hệ thống**: Activity Diagram, Sequence Diagram và Domain Class Diagram (PlantUML & SVG).
3. **Task 3 – Thiết kế kiến trúc**: Kiến trúc C4 / Phân lớp, ADRs (Architecture Decision Records) và UML Deployment Diagram cho môi trường Production thực tế.
4. **Task 4 – Triển khai Sprint 1**: Monorepo `apps/web` & `apps/api`, MVP Xem menu, Pipeline CI tự động (`Install -> Lint -> Unit Test -> Build`).
5. **Task 5 – Triển khai Sprint 2, CI/CD và Delivery**: Hoàn thiện toàn bộ luồng End-to-End (Cart, Checkout, Payment, History), Continuous Delivery (Docker, Database Migration, Smoke Test) và triển khai Production trực tuyến có HTTPS.

---

## 2. Cấu trúc Repository (Repository Structure)
Tuân thủ cấu trúc chuẩn Monorepo theo quy định của đề bài:

```text
brewlite/
|-- apps/
|   |-- web/                   # Frontend: Next.js (Mobile-first PWA, App Router, Pure CSS)
|   `-- api/                   # Backend: NestJS (Modular, Prisma ORM, JWT, Health Check)
|-- docs/
|   |-- requirements/          # Task 1: context-and-scope.md, srs.md, use-case-checkout.md
|   |-- diagrams/              # Task 2: Activity, Sequence, Class, Deployment (.puml, .svg, .png)
|   |-- architecture/          # Task 3: Quyết định kiến trúc & ADRs (001-monorepo.md, ...)
|   |-- traceability-matrix.md # Mục 8: Bảng ma trận truy vết (FR -> UC -> Diagram -> Code -> Test)
|   `-- deployment.md          # Chi tiết thiết kế và quy trình triển khai Production
|-- tests/                     # Integration test và End-to-End smoke test
|-- .github/workflows/         # Pipeline CI/CD tự động
|-- docker-compose.yml         # Khởi chạy toàn bộ hệ thống (Web, API, DB) tại local
|-- .env.example               # Mẫu cấu hình biến môi trường
`-- README.md                  # Tài liệu hướng dẫn chính của dự án
```

---

## 3. Quy chuẩn làm việc nhóm (Team Workflow & Conventions)

### 3.1. Chiến lược Branch và Pull Request
* Nhánh chính: `main` (chỉ chứa mã nguồn ổn định, đã pass toàn bộ CI).
* Nhánh phát triển tính năng: `sprint-1/mvp-menu`, `sprint-2/checkout-delivery`, `feature/<feature-name>`.
* **Quy tắc bắt buộc:** Mọi thay đổi code và tài liệu **không được push trực tiếp lên main**, bắt buộc mở **Pull Request (PR)**.
* Pipeline CI tự động kích hoạt khi mở PR: PR **không được merge** nếu Lint, Unit Test hoặc Build thất bại.

### 3.2. Quy ước Commit (Conventional Commits)
* `feat:` Thêm tính năng mới (vd: `feat: add order creation api with transaction`)
* `fix:` Sửa lỗi hệ thống (vd: `fix: handle idempotency payment conflict`)
* `docs:` Cập nhật tài liệu, sơ đồ (vd: `docs(task-1): complete srs and scope specification`)
* `test:` Thêm hoặc cập nhật test (vd: `test: add integration test for checkout flow`)
* `refactor:` Tái cấu trúc code mà không thay đổi tính năng
* `chore:` Cập nhật cấu hình build, dependencies, workflow

### 3.3. Định nghĩa hoàn thành (Definition of Done - DoD)
Một User Story / Task được coi là hoàn thành khi:
1. Mã nguồn tuân thủ coding conventions, không có lỗi Lint / TypeCheck.
2. Đã viết Unit Test và Integration Test tương ứng, độ bao phủ đạt yêu cầu.
3. Toàn bộ test suite chạy pass cục bộ và trên GitHub Actions CI.
4. Đã cập nhật ma trận truy vết (`traceability-matrix.md`) và tài liệu liên quan.
5. Pull Request được review và merge vào nhánh chính thông qua quy trình CI xanh.

### 3.4. Quản lý dự án & Product Backlog (Task 4.1)
Nhóm triển khai quản lý dự án linh hoạt (Agile/Scrum) với sự đồng bộ chặt chẽ giữa Trello Board và GitHub Issues:
* **Trello Board (Công khai):** [BrewLite A2 | 7 người | 04/11–13/11/2026](https://trello.com/b/WicUBZYp/brewlite-a2-7-ng%C6%B0%E1%BB%9Di-04-11-12-12-2026)
  * Cấu trúc đầy đủ 8 cột: *00 Đọc trước*, *01 Chuẩn bị (PREP)*, *02 Sprint 1*, *03 Sprint 2*, *04 Delivery*, *05 Đang làm*, *06 Review & kiểm thử*, *07 Hoàn thành*.
  * Tổng cộng 31 User Stories / Kỹ thuật với thời gian ước lượng (timebox), Definition of Done (DoD) và mã truy vết (FR/NFR).
* **GitHub Issues & Milestones:** Toàn bộ Backlog được đồng bộ trực tiếp lên tab [GitHub Issues](https://github.com/Gtvkun-ai/brewlite-a2/issues) và phân bổ theo 3 Milestones:
  * `Sprint 1: Nền tảng, MVP Menu & CI` (Đã hoàn thành)
  * `Sprint 2: Tích hợp E2E, Checkout & Staging` (Đã hoàn thành)
  * `Sprint Delivery: Production Release & Báo cáo` (Chuẩn bị nghiệm thu)
* **Phân công vai trò 7 thành viên:**
  * **A (Tech Lead & DevOps):** `Gtvkun-ai`
  * **B (Auth & Security):** `lamdat1005`
  * **C (Orders & Inventory):** `Duy-12`
  * **D (Payments & Health Check):** `hyynee`
  * **E (Product Options & Cart UI):** `hotrungtin206`
  * **F (Auth & Checkout UI):** `chigiabao` (`baonguyen17102005`)
  * **G (Orders UI, Test Plan & QA):** `nam14072006`

---

## 4. Hướng dẫn Cài đặt & Khởi chạy Cục bộ (Local Setup & Run)

Hệ thống cung cấp hai phương thức khởi chạy để bất kỳ người đánh giá nào cũng có thể kiểm tra:

### 4.1. Phương thức 1: Khởi chạy bằng Docker Compose (Khuyến nghị - Nhanh nhất)
Yêu cầu: Đã cài đặt Docker Desktop.

```bash
# 1. Clone repository
git clone https://github.com/Gtvkun-ai/brewlite-a2.git
cd brewlite-a2

# 2. Tạo file cấu hình môi trường từ file mẫu
cp .env.example .env

# 3. Khởi chạy toàn bộ hệ thống (PostgreSQL, NestJS API, Next.js Web)
docker compose up --build -d

# 4. Kiểm tra trạng thái các container đang chạy
docker compose ps
```
Truy cập các dịch vụ:
* 🌐 **Frontend Web:** [http://localhost:3000](http://localhost:3000)
* ☕ **Backend API:** [http://localhost:3001](http://localhost:3001)
* 💓 **Health Check:** [http://localhost:3001/health](http://localhost:3001/health)
* Dừng hệ thống khi không dùng: `docker compose down`

### 4.2. Phương thức 2: Chạy trực tiếp bằng Node.js / npm (Native Development)
Yêu cầu: Node.js >= 22, PostgreSQL đang chạy cục bộ (cổng 5432).

```bash
# 1. Cài đặt toàn bộ dependencies trong monorepo
npm install

# 2. Cấu hình biến môi trường
cp .env.example .env
# Chỉnh sửa DATABASE_URL và JWT_SECRET trong .env cho phù hợp máy cá nhân

# 3. Sinh Prisma Client và nạp dữ liệu mẫu vào Database
npm --workspace @brewlite/api run postinstall
npx --workspace @brewlite/api prisma db push
npx --workspace @brewlite/api prisma db seed

# 4. Khởi chạy song song Backend API và Frontend Web
npm run dev --workspaces
# Hoặc khởi chạy riêng từng dịch vụ ở 2 terminal độc lập:
# Terminal 1: npm run dev --workspace @brewlite/api   (cổng 3001)
# Terminal 2: npm run dev --workspace @brewlite/web   (cổng 3000)
```

---

## 5. Hướng dẫn Kiểm thử Hệ thống (Testing Guide)

Dự án duy trì bộ kiểm thử tự động toàn diện bao phủ toàn bộ logic nghiệp vụ, bảo mật và giao diện:

```bash
# 1. Kiểm tra chuẩn mã nguồn (Linting)
npm run lint

# 2. Chạy toàn bộ Unit Tests (Cả Backend API và Frontend Web - 128 tests pass 100%)
npm run test

# 3. Chạy riêng kiểm thử Backend API (68 Jest tests: Auth, Catalog, Orders, Payments, Health)
npm run test --workspace @brewlite/api

# 4. Chạy riêng kiểm thử Frontend Web (60 Vitest tests: Menu, Cart, Auth, Checkout, Orders)
npm run test --workspace @brewlite/web

# 5. Chạy kiểm thử End-to-End bằng Playwright
npx playwright test
```

### 🔬 Báo cáo Đối soát Kiểm thử Nghiệm thu Giảng viên
Nhóm đã thực hiện và lưu trữ chi tiết bằng chứng 4 kịch bản kiểm thử tình huống khó theo yêu cầu của Giảng viên tại [`docs/evidence/lecturer-audit-report.md`](docs/evidence/lecturer-audit-report.md):
* **TEST A — Sửa giá qua API:** Chặn gian lận giá, máy chủ từ chối 400 Bad Request và tự tính toán lại đơn giá từ DB niêm yết.
* **TEST B — Hủy đơn đã trả tiền:** Hoàn trả tồn kho an toàn bằng transaction và chuyển trạng thái thanh toán sang `REFUND_PENDING`.
* **TEST C — Tranh chấp tồn kho đồng thời:** Dùng câu lệnh cập nhật tồn kho có điều kiện nguyên tử, chặn đứng triệt để tình trạng bán vượt kho khi 2 khách cùng mua 2 ly cuối cùng.
* **TEST D — Định mức nguyên vật liệu (BOM):** Xác định khả năng phục vụ theo số lượng nguyên liệu giới hạn nhỏ nhất.

---

## 6. Hướng dẫn Đóng gói & Build (Build Guide)

```bash
# Build toàn bộ monorepo (NestJS API dist + Next.js PWA production bundle)
npm run build

# Build Docker image riêng cho Backend API
docker build -t brewlite-api:latest -f apps/api/Dockerfile .

# Build Docker image riêng cho Frontend Web
docker build -t brewlite-web:latest -f apps/web/Dockerfile .
```

---

## 7. Quy trình Triển khai Production & Quay lui (Deployment & Rollback)

Chi tiết thiết kế và sơ đồ hạ tầng đám mây xem tại [`docs/deployment.md`](docs/deployment.md).

### 7.1. Kiến trúc Triển khai Cloud (CI/CD)
* **Frontend Web:** Triển khai tự động trên **Vercel** qua Edge CDN toàn cầu với SSL tự động.
* **Backend API:** Đóng gói Docker Container triển khai trên **Render Web Service** (khu vực Singapore).
* **Cơ sở dữ liệu:** PostgreSQL lưu trữ trên NVMe SSD Persistent Storage, kết nối SSL nội bộ an toàn.
* **Giữ ấm hệ thống:** GitHub Actions Cron Workflow ([`keep-alive.yml`](.github/workflows/keep-alive.yml)) ping endpoint `/health` định kỳ mỗi 14 phút trong khung giờ 07:00–23:00 VN để tránh cold-start của Render free-tier.

### 7.2. Kiểm thử Khói sau Triển khai (Post-Deployment Smoke Test)
```bash
# 1. Kiểm tra liveness và database connection
curl -i https://brewlite-a2.onrender.com/health
# Kết quả mong đợi: HTTP 200 OK, {"status":"ok","database":{"status":"up"}}

# 2. Kiểm tra truy vấn danh mục đồ uống
curl -i https://brewlite-a2.onrender.com/products
# Kết quả mong đợi: HTTP 200 OK, danh sách sản phẩm hiển thị đầy đủ

# 3. Kiểm tra ứng dụng Web trực tiếp
# Mở https://brewlite-a2.vercel.app trên trình duyệt, kiểm tra menu hiển thị, thêm món vào giỏ hàng và mở giỏ hàng.
```

### 7.3. Quy trình Quay lui khi Sự cố (Rollback Procedure)
Khi phiên bản mới phát hiện lỗi nghiêm trọng trên môi trường production:
1. **Quay lui Frontend trên Vercel:**
   * Truy cập Vercel Dashboard ➔ Chọn Project `brewlite-a2` ➔ Tab **Deployments**.
   * Chọn bản deploy ổn định trước đó ➔ Bấm menu 3 chấm ➔ Chọn **Promote to Production** (Hoàn tất tức thì trong 5 giây mà không cần build lại mã nguồn).
2. **Quay lui Backend trên Render:**
   * Truy cập Render Dashboard ➔ Chọn Service `brewlite-api` ➔ Tab **Events / Deploys**.
   * Chọn bản deploy thành công trước đó ➔ Bấm **Rollback to this deploy**.
3. **Quay lui Database Migration (Nếu có sự cố cấu trúc):**
   ```bash
   npx --workspace @brewlite/api prisma migrate resolve --rolled-back <migration_name>
   ```

---

## 8. Ma trận Truy vết Yêu cầu (Traceability Matrix)

Hệ thống đáp ứng đầy đủ tính truy vết hai chiều theo quy định tại **Mục 8.1** của đề bài. Toàn bộ yêu cầu chức năng (FR), yêu cầu phi chức năng (NFR), Use-case, Sơ đồ thiết kế, Code API và Bộ test được đối soát chi tiết tại:  
👉 [`docs/traceability-matrix.md`](docs/traceability-matrix.md)

---

## 9. Thông tin Phát hành (Release Notes)
* **Phiên bản hiện tại:** `v1.0.0`
* **Git Tag:** `v1.0.0`
* **Tài liệu bàn giao Sprint:**
  * Sprint 1 Review & Retro: [`docs/sprint1-review-retro.md`](docs/sprint1-review-retro.md)
  * Sprint 2 Review & Delivery: [`docs/review-sprint2-B-F.md`](docs/review-sprint2-B-F.md)
  * Báo cáo nghiệm thu Giảng viên: [`docs/evidence/lecturer-audit-report.md`](docs/evidence/lecturer-audit-report.md)
