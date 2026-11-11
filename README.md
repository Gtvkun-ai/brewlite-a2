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
* 📊 **Tài khoản Demo trải nghiệm:**
  * **Khách hàng (Customer):** `customer@brewlite.test` / `Customer@123456` *(hoặc `customer@brewlite.vn` / `Password123!`)*
  * **Nhân viên Pha chế (Barista):** `barista@brewlite.vn` / `Password123!`
  * **Quản trị viên (Admin):** `admin@brewlite.vn` / `Password123!`

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
|   |-- web/                   # Frontend: Next.js (Mobile-first PWA, App Router, Tailwind/CSS)
|   `-- api/                   # Backend: NestJS (Modular, Prisma ORM, JWT, Health Check)
|-- docs/
|   |-- requirements/          # Task 1: context-and-scope.md, srs.md, use-case-checkout.md
|   |-- diagrams/              # Task 2: Activity, Sequence, Class, Deployment (.puml & .svg)
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
  * `Sprint 2: Tích hợp E2E, Checkout & Staging` (Đang triển khai)
  * `Sprint Delivery: Production Release & Báo cáo` (Chuẩn bị nghiệm thu)
* **Phân công vai trò 7 thành viên:**
  * **A (Tech Lead & DevOps):** `Gtvkun-ai`
  * **B (Auth & Security):** `lamdat1005`
  * **C (Orders & Inventory):** `Duy-12`
  * **D (Payments & Health Check):** `hyynee`
  * **E (Product Options & Cart UI):** `hotrungtin206`
  * **F (Auth & Checkout UI):** `chigiabao` (`baonguyen17102005`)
  * **G (Orders UI, Test Plan & QA):** `nam14072006`

## 4. Authentication API

API đăng ký/đăng nhập, định dạng request/response và cách dùng JWT Bearer guard được mô tả tại [`docs/auth-api.md`](docs/auth-api.md). Cấu hình `JWT_SECRET` bằng chuỗi ngẫu nhiên tối thiểu 32 ký tự trước khi chạy API.
