# Biên bản Nghiệm thu Demo & Retrospective Sprint 1 (Gate-S1)

> **Dự án:** BrewLite – Assignment 2: Requirements to Deployment  
> **Thời gian tổ chức:** 20:00 ngày 08/11/2026 (Giờ Việt Nam)  
> **Chủ trì & Quyết định:** Tech Lead A (Scrum Master & Architect)  
> **Thư ký ghi nhận Review & Retro:** Thành viên G (Frontend Orders / QA / Delivery Docs)  
> **Thành viên tham dự:** Toàn bộ nhóm phát triển (A, B, C, D, E, F, G)  
> **Căn cứ đánh giá:** Thẻ công việc A-10…G-10, `docs/architecture/api-contracts.md`, kết quả test tự động, log build và demo thực tế.

---

## 1. Trạng thái Checklist Nghiệm thu Gate-S1

| Tiêu chí nghiệm thu | Trạng thái | Đánh giá & Bằng chứng thực tế |
|---|:---:|---|
| **1. Menu / cart / auth và nền Orders / Payments / UI được demo; fixture và API thật phân biệt rõ** | [x] **ĐẠT** | • Menu (`GET /products`): Đã chạy API thật NestJS + Prisma PostgreSQL + UI Next.js.<br>• Cart: `CartContext.tsx` quản lý giỏ hàng, tính tổng tiền, cart badge real-time.<br>• Auth: API thật `POST /auth/register`, `POST /auth/login` (bcrypt băm mật khẩu, JWT token Bearer) + Auth UI form validate, lưu JWT token.<br>• Nền Orders/Payments: Khung Checkout (`/checkout`) sinh UUID `Idempotency-Key`, chống double-click, server-authoritative pricing; UI Lịch sử đơn (`/orders`, `/orders/[id]`, Stepper) có cờ `data-testid="fixture-banner"` phân biệt rạch ròi chế độ Fixture vs API thật. |
| **2. Các PR dự kiến được review, CI xanh; test/code/evidence và traceability khớp hiện trạng** | [x] **ĐẠT** | • Toàn bộ PR Sprint 1 (A-10…G-10) đã được review kỹ thuật.<br>• CI Pipeline xanh 100%: `npm test` **64/64 tests PASS** (16 API tests + 48 Web tests); `npm run lint` **0 errors, 0 warnings**; `npm run build` biên dịch thành công cả 8 routes Web và API NestJS.<br>• Ma trận truy vết (`docs/traceability-matrix.md`) và Kế hoạch kiểm thử (`docs/test-plan.md`) đã đồng bộ mã kiểm thử và mã nguồn thực tế. |
| **3. G ghi Review / Retro Sprint 1; A chốt backlog Sprint 2, rủi ro tích hợp và owner sửa lỗi** | [x] **ĐẠT** | • G đã tổng hợp đầy đủ biên bản Sprint Review và bảng Retrospective (What went well / What didn't / Action items).<br>• Tech Lead A chốt Backlog Sprint 2 (A-20…G-20), nhận diện 3 rủi ro tích hợp trọng yếu và chỉ định rõ owner chịu trách nhiệm. |

---

## 2. Chi tiết Kết quả Demo Từng Vai trò (A-10 → G-10)

### 2.1. Tech Lead A (A-10 – Kiến trúc, Module Wiring & Tích hợp)
* **Kết quả demo:** Khung monorepo chuẩn hóa npm workspaces; kiến trúc NestJS modular + Next.js App Router; chia sẻ type an toàn; điều phối luồng tích hợp và CI GitHub Actions.
* **Bằng chứng kỹ thuật:** 
  * `npm run lint`: **0 warning, 0 error**.
  * `npm test`: **64/64 tests PASS 100%**.
  * `npm run build`: Build production tối ưu, không có lỗi kiểu TypeScript.
* **Đánh giá:** **ĐẠT (Xuất sắc)**.

### 2.2. Thành viên B (B-10 – Backend Auth & JWT)
* **Kết quả demo:** API đăng ký `POST /auth/register` (kiểm tra trùng email trả `409`, băm mật khẩu bằng `bcrypt` salt 10 rounds) và đăng nhập `POST /auth/login` (cấp Bearer JWT với payload `sub`, `email`, `role`). Cung cấp `JwtAuthGuard` và decorator `@CurrentUser()` cho các module khác.
* **Bằng chứng kỹ thuật:** `src/auth/auth.security.spec.ts` pass, tài liệu `docs/auth-api.md`.
* **Đánh giá:** **ĐẠT**.

### 2.3. Thành viên C (C-10 – Backend Orders & Stock)
* **Kết quả demo:** Thiết kế DTO và controller cho `POST /orders`, logic tính giá server-side snapshot đơn hàng; cấu trúc Prisma `$transaction` kiểm tra `stockQuantity >= quantity` để chống bán vượt kho.
* **Chế độ kiểm thử:** Đã hoàn thiện unit test logic tính giá và xử lý đơn hàng; chuẩn bị kết nối DB thật trên staging ở Sprint 2.
* **Đánh giá:** **ĐẠT (Nền tảng sẵn sàng)**.

### 2.4. Thành viên D (D-10 – Backend Payments & Health Check)
* **Kết quả demo:** Mock Payment Gateway hỗ trợ các phương thức VNPay, MoMo, Thẻ tín dụng; quy ước `accountRef` kết thúc bằng `0000` mô phỏng lỗi giao dịch; endpoint `GET /health` giám sát DB connection.
* **Đánh giá:** **ĐẠT**.

### 2.5. Thành viên E (E-10 – Frontend Product Options & Cart)
* **Kết quả demo:** Quản lý trạng thái giỏ hàng `CartContext`, cập nhật số lượng món, tính tổng tiền tức thì, đồng bộ số lượng giỏ trên `Navbar`.
* **Đánh giá:** **ĐẠT**.

### 2.6. Thành viên F (F-10 – Frontend Auth UI, Navbar & Khung Checkout)
* **Kết quả demo:** Giao diện Đăng nhập/Đăng ký với validation đầy đủ; Navbar hiển thị trạng thái người dùng; Màn hình `/checkout` tuân thủ nghiêm ngặt Server-authoritative Pricing (không gửi amount từ client), sinh `Idempotency-Key` UUID v4 cố định cho mỗi phiên, chống double-click và giữ nguyên orderId khi thanh toán lỗi.
* **Bằng chứng kỹ thuật:** 19 unit tests trong `auth.test.tsx` và `checkout.test.tsx` PASS 100%.
* **Đánh giá:** **ĐẠT (Xuất sắc)**.

### 2.7. Thành viên G (G-10 – Orders UI, Test Plan & Traceability Matrix)
* **Kết quả demo:** Giao diện danh sách đơn hàng `/orders`, chi tiết đơn `/orders/[id]` kèm Stepper trạng thái (`PENDING` $\rightarrow$ `PAID` $\rightarrow$ `PREPARING` $\rightarrow$ `READY` $\rightarrow$ `COMPLETED`); hiển thị đầy đủ 3 trạng thái Mobile-first (Loading, Empty, Error + Retry); phân biệt rõ cờ Fixture Mode qua banner.
* **Bằng chứng kỹ thuật:** 16 tests Vitest PASS; lập `docs/test-plan.md` với 20 ca kiểm thử đối soát; cập nhật `docs/traceability-matrix.md`.
* **Đánh giá:** **ĐẠT (Xuất sắc)**.

---

## 3. Biên bản Sprint Retrospective (G ghi nhận)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                SPRINT 1 RETROSPECTIVE                                 │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.1. What went well (Điểm làm tốt)
1. **Tuân thủ API Contract ngay từ đầu:** Tất cả các thành viên đều bám sát `docs/architecture/api-contracts.md` (v1.0.0), giảm thiểu tối đa hiện tượng lệch trường dữ liệu giữa Web và API.
2. **Kỷ luật kiểm thử cao:** Toàn bộ code trước khi nộp đều có Unit Test đi kèm; đạt tỷ lệ 64/64 tests pass.
3. **Phân định rõ ràng giữa Fixture và API thật:** Thành viên G và F chủ động tạo chế độ Fixture giả lập UI độc lập có cờ nhận diện, giúp kiểm thử giao diện mà không bị nghẽn tiến độ khi backend đang hoàn thiện.
4. **Bảo mật và toàn vẹn dữ liệu được đặt lên hàng đầu:** Auth băm mật khẩu an toàn, Checkout không cho client truyền tiền giả mạo, sinh Idempotency-Key UUID v4.

### 3.2. What didn't go well (Khó khăn & Tồn tại)
1. **Xung đột cấu hình môi trường và Package Lockfile:** Sự khác biệt giữa môi trường Windows cục bộ và runner Ubuntu của GitHub Actions dẫn đến lỗi rollup/native bindings trên CI thời gian đầu.
2. **Xung đột file tích hợp (`app.module.ts`, `package.json`):** Việc nhiều nhánh tính năng backend cùng đăng ký module vào file gốc dẫn đến xung đột khi merge.
3. **Backend Orders & Payments cần thêm thời gian:** Logic ACID transaction khóa tồn kho và lưu idempotency constraint trên PostgreSQL phức tạp, cần được dồn lực kiểm thử tích hợp trên môi trường staging thực ở Sprint 2.

### 3.3. Action Items cho Sprint 2 (Cải tiến quy trình)
* [ ] **A:** Làm chủ chốt các file dùng chung (`apps/api/src/app.module.ts`, `package.json`, `schema.prisma`), trực tiếp rebase và merge theo thứ tự: B Auth $\rightarrow$ C Orders $\rightarrow$ D Payments.
* [ ] **C & D:** Hoàn tất API thật trước tối ngày 10/11/2026 để F và G chuyển cờ `NEXT_PUBLIC_USE_FIXTURES=false`.
* [ ] **G:** Chuyển các ca kiểm thử E2E Playwright từ `test.fixme` sang kịch bản test thật chạy trên môi trường Docker/Staging.

---

## 4. Chốt Backlog Sprint 2, Rủi ro Tích hợp & Owner Sửa lỗi (A phê duyệt)

### 4.1. Kế hoạch Phân công Backlog Sprint 2 (09/11 → 11/11/2026)

| Mã thẻ | Vai trò | Nội dung công việc Sprint 2 | Hạn chót |
|:---:|:---:|---|:---:|
| **A-20** | Tech Lead A | Docker Compose (Web, API, Postgres), staging environment, pipeline CD | 14:00 10/11 |
| **B-20** | Thành viên B | Phân quyền RBAC (`CUSTOMER`, `BARISTA`, `ADMIN`), bảo mật bảo vệ endpoint | 18:00 10/11 |
| **C-20** | Thành viên C | History API thật, State Machine đơn hàng và transaction trừ kho concurrency | 18:00 10/11 |
| **D-20** | Thành viên D | Payment Idempotency DB constraint và transaction cập nhật đơn sang `PAID` | 18:00 10/11 |
| **E-20** | Thành viên E | Tùy biến món (size Regular/Large + 10k, chọn toppings) kết nối Cart $\rightarrow$ Checkout | 18:00 10/11 |
| **F-20** | Thành viên F | Checkout API thật (kết nối chuỗi Auth $\rightarrow$ Orders $\rightarrow$ Payments $\rightarrow$ Chi tiết mã đơn) | 12:00 11/11 |
| **G-20** | Thành viên G | Orders UI thật (tắt fixture), Playwright E2E toàn luồng và đo kiểm chứng NFR | 18:00 11/11 |

### 4.2. Ma trận Rủi ro Tích hợp & Phương án Khắc phục (Risk Mitigation)

| STT | Rủi ro Tích hợp Tiềm ẩn | Mức độ | Owner chịu trách nhiệm | Giải pháp Kỹ thuật & Hạn xử lý |
|:---:|---|:---:|:---:|---|
| **R1** | **Tranh chấp tồn kho (Race condition):** Nhiều khách cùng đặt sản phẩm có số lượng tồn = 1 cùng thời điểm. | **Cao** | **Thành viên C** | Dùng Prisma `$transaction` với mệnh đề điều kiện trừ kho nguyên tử (`stockQuantity >= quantity`); nếu không thỏa mãn thì lập tức rollback và ném lỗi `400 OUT_OF_STOCK`. Hạn chót: 18:00 10/11. |
| **R2** | **Trùng Idempotency-Key nhưng khác payload:** Client gửi lại cùng một key thanh toán nhưng đổi số tiền hoặc phương thức. | **Cao** | **Thành viên D** | Lưu hash payload kèm Idempotency-Key trong DB; nếu trùng key khác payload phải trả lỗi `409 IDEMPOTENCY_KEY_PAYLOAD_MISMATCH`. Hạn chót: 18:00 10/11. |
| **R3** | **Hết hạn Token trong lúc checkout:** Token JWT hết hạn giữa bước tạo đơn và bước gọi thanh toán. | **Trung bình** | **Thành viên F & B** | Frontend interceptor bắt mã `401`, bảo lưu trạng thái đơn hàng trong session/localStorage và điều hướng người dùng đăng nhập lại an toàn mà không làm mất giỏ. Hạn chót: 12:00 11/11. |

---

## 5. Quyết định Nghiệm thu của Tech Lead A (Gate-S1 Decision)

* **Kết luận chung:** **ĐẠT YÊU CẦU NGHIỆM THU GATE-S1 (PASS)**.
* **Căn cứ quyết định:**
  1. Sản phẩm demo chạy thực tế, không có lỗi runtime cản trở luồng cốt lõi.
  2. Toàn bộ 64 bài kiểm thử tự động đều PASS (16 API tests + 48 Web tests).
  3. Mã nguồn sạch, đạt chuẩn Lint (0 lỗi) và Build thành công toàn bộ hệ thống.
  4. Phân định rạch ròi giữa dữ liệu thật và fixture giả lập, không gian dối trạng thái kiểm thử.
* **Lộ trình bàn giao tiếp theo:**
  * **Gate-S2 (Đóng băng tính năng):** 20:00 ngày 11/11/2026.
  * **Bàn giao chính thức Release:** 12/11/2026.
  * **Gate-FINAL (Chốt toàn bộ dự án):** Trước 18:00 ngày 13/11/2026. Tuyệt đối không thêm tính năng mới sau mốc Gate-S2.

*(Biên bản đã được thông qua và có hiệu lực kể từ 20:00 ngày 08/11/2026)*  
**Chủ trì:** *Tech Lead A* — **Thư ký ghi nhận:** *Thành viên G*
