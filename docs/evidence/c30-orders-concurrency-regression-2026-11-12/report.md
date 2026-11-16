# C-30 Orders / Stock Concurrency Regression — 2026-11-12

**Thành viên thực hiện:** Phạm Minh Duy (Vai trò C — Backend Orders & Stock)  
**Môi trường kiểm thử:** PostgreSQL 16 (Local Docker Compose `127.0.0.1:5433`) & Live Staging API (`https://brewlite-a2.onrender.com`)  
**Truy vết yêu cầu:** `FR-05` (Tạo đơn), `FR-06` (Lịch sử đơn), `FR-07` (State machine), `NFR-05` (Toàn vẹn dữ liệu ACID, Chống overselling & Idempotency)

---

## 1. Phạm vi và Phương pháp kiểm thử (Scope & Method)

Kiểm thử hồi quy C-30 tập trung vào các trường hợp biên và tình huống tranh chấp dữ liệu tải cao:
1. **Kịch bản 2/2 chuẩn của Giảng viên (TEST C / CON-01 đến CON-05):** Kho ban đầu đúng 2 sản phẩm. Hai tài khoản khách hàng đồng thời gửi yêu cầu mua 2 sản phẩm qua `Promise.all`. Khẳng định: 1 đơn thành công, 1 đơn bị từ chối với lỗi `400 OUT_OF_STOCK`, tồn kho cuối cùng = 0 (tuyệt đối không bị âm).
2. **Cạnh tranh tải cao (10–20 Requests Burst):** 10 yêu cầu đồng thời tranh chấp 3 sản phẩm cuối cùng. Đúng 3 đơn thành công, 7 đơn bị từ chối, kho về 0.
3. **Rollback giao dịch đa sản phẩm (All-or-Nothing ACID):** Đặt giỏ hàng gồm 2 món, trong đó 1 món hết hàng $\rightarrow$ toàn bộ transaction rollback, món còn hàng được bảo toàn kho trọn vẹn, không tạo đơn rác.
4. **Chống Replay & Trùng lặp (Idempotency Key):** Cùng key + cùng payload trả về kết quả cũ không trừ kho lần 2; cùng key + khác payload bị chặn `409 Conflict`.
5. **Vòng đời đơn hàng & Phân quyền (State Machine & RBAC):** `CUSTOMER` cấm đổi status (403), `BARISTA` cập nhật hợp lệ `PAID` $\rightarrow$ `PREPARING` $\rightarrow$ `READY` $\rightarrow$ `COMPLETED`, nhảy cóc trạng thái bị chặn 400.
6. **Hủy đơn và Hoàn kho (TEST B):** Hủy đơn `PENDING` hoặc `PAID` $\rightarrow$ Tồn kho được phục hồi nguyên tử (`increment`), thanh toán ghi nhận `REFUND_PENDING`.

---

## 2. Kết quả kiểm thử đối soát (Expected vs Actual)

| Ca kiểm thử | Trọng tâm đối soát | Kết quả mong đợi (Expected) | Kết quả thực tế (Actual) | Đánh giá |
| :--- | :--- | :--- | :--- | :---: |
| **Kịch bản Giảng viên 2/2** | Tranh chấp kho thấp (Croissant `stockQuantity = 2`) | Tối đa 1 đơn tạo thành công; 1 đơn bị từ chối `400 OUT_OF_STOCK`; tồn kho cuối = 0, không âm kho | **PASS** — Khách B tạo đơn `BL-20261115-BLSK` thành công (tổng 60.000đ); Khách A bị từ chối với lý do `OUT_OF_STOCK`. Tồn kho từ 2 về chính xác 0. | ✅ PASS |
| **Burst Concurrency (10 requests)** | 10 khách đồng thời tranh 3 ly cà phê sữa đá | Đúng 3 đơn thành công, 7 đơn bị từ chối, tồn kho về 0 | **PASS** — 3 promises fulfilled, 7 promises rejected `OUT_OF_STOCK`. `stockQuantity = 0`. | ✅ PASS |
| **Multi-item Rollback** | Giỏ hàng gồm món còn hàng + món hết hàng | Rollback toàn bộ transaction; món còn hàng không bị trừ kho | **PASS** — Ném lỗi `BadRequestException: OUT_OF_STOCK`; tồn kho món A được bảo toàn 10/10; không tạo bản ghi Order. | ✅ PASS |
| **Idempotency Replay** | Gửi lại cùng key và payload | Trả lại mã đơn cũ, không tạo đơn mới, không trừ kho | **PASS** — Trả về `ord-existing-1` (`BL-20261112-IDEM`); `$transaction` không bị gọi lại. | ✅ PASS |
| **Idempotency Conflict** | Cùng key nhưng sửa đổi quantity | Chặn đứng với HTTP 409 Conflict | **PASS** — Ném lỗi `ConflictException: IDEMPOTENCY_KEY_PAYLOAD_MISMATCH`. | ✅ PASS |
| **State Machine RBAC** | Khách hàng tự PATCH status | Chặn đứng với HTTP 403 Forbidden | **PASS** — Ném lỗi `ForbiddenException: Insufficient role`. | ✅ PASS |
| **State Transition Validation** | Nhảy cóc `PENDING` $\rightarrow$ `COMPLETED` | Chặn đứng với HTTP 400 Bad Request | **PASS** — Ném lỗi `BadRequestException: Không thể chuyển từ PENDING sang COMPLETED`. | ✅ PASS |
| **Hủy đơn hoàn kho** | Khách hủy đơn PENDING/PAID | Phục hồi tồn kho qua atomic increment | **PASS** — Đơn đổi sang `CANCELLED`; `product.update` với `stockQuantity: { increment: 2 }`. | ✅ PASS |

---

## 3. Nhật ký Chạy Kiểm thử Trực tiếp trên PostgreSQL (Real Integration Log)

Lệnh thực thi: `npm run test:integration` (chạy trên PostgreSQL Docker container `brewlite-db` cổng `5433`):

![Kiểm thử PostgreSQL tranh chấp kho thật](./test-c-concurrency-postgres-pass.jpg)

```text
======================================================================
STARTING INTEGRATION TEST: Orders & Stock Concurrency (Task C-30)
Database Target: postgresql://brew:***@localhost:5433/brewlite?schema=public
======================================================================
[PRE-CHECK] Mã sản phẩm: PAS-CROI | Tồn kho ban đầu: 2 ly
[USERS] Khách A: customer@brewlite.vn | Khách B: barista@brewlite.vn
[ACTION] Bắt đầu kích hoạt 2 yêu cầu đồng thời (mỗi khách mua 2 ly)...
[RESULT] Số đơn thành công: 1 | Số đơn bị từ chối: 1
 -> Đơn thành công: Mã đơn BL-20261115-BLSK bởi Khách B
 -> Đơn bị từ chối: Lý do "OUT_OF_STOCK" cho Khách A
[POST-CHECK] Tồn kho sau giao dịch đồng thời: 0 ly (Tuyệt đối không âm)
----------------------------------------------------------------------
KẾT LUẬN KIỂM THỬ: PASS 100% (ĐẠT CHUẨN NFR-05 & GIẢNG VIÊN)
----------------------------------------------------------------------
[CLEANUP] Đã phục hồi tồn kho Croissant về mức 40 bình thường.
```

---

## 4. Bằng chứng Mã nguồn liên quan

* **File kiểm thử tích hợp chuyên biệt (Đầu ra bắt buộc):** [`tests/integration/orders.spec.ts`](../../../tests/integration/orders.spec.ts)
* **Bộ hồi quy Jest CI/CD:** [`apps/api/src/orders/orders.concurrency.spec.ts`](../../../apps/api/src/orders/orders.concurrency.spec.ts) (9/9 tests pass)

![Bộ hồi quy Jest Concurrency Suite](./test-c-concurrency-suite-pass.jpg)
* **Logic trừ kho nguyên tử & ACID transaction:** [`apps/api/src/orders/orders.service.ts`](../../../apps/api/src/orders/orders.service.ts)
* **Bộ test kiểm tra chống sửa giá & phân quyền:** [`apps/api/src/orders/orders.security.spec.ts`](../../../apps/api/src/orders/orders.security.spec.ts)

---

## 5. Lệnh thực thi tái hiện (Reproduction Commands)

```powershell
# 1. Chạy bộ kiểm thử hồi quy Concurrency trong Jest (100% Pass)
npm --workspace @brewlite/api test -- --runInBand src/orders/orders.concurrency.spec.ts

# 2. Chạy kiểm thử tích hợp trực tiếp trên PostgreSQL thật (Kịch bản Giảng viên 2/2)
npm run test:integration

# 3. Chạy toàn bộ test suite của backend API (14/14 suites pass, 119/119 tests pass)
npm --workspace @brewlite/api test
```

## 6. Trạng thái bàn giao (Handoff Status)
* **Nhánh Git:** `feature/c-order`
* **Người bàn giao:** Phạm Minh Duy (Vai trò C)
* **Đánh giá:** Hoàn thành 100% nhiệm vụ C-30; giải quyết triệt để ghi chú nợ kỹ thuật kịch bản 2/2 trong ma trận truy vết.
