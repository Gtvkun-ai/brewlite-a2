# Kế hoạch kiểm thử (Test Plan) – BrewLite Assignment 2

> Người phụ trách: G (G-01). Đối chiếu FR/NFR theo `docs/requirements/srs.md` và hợp đồng API `docs/architecture/api-contracts.md` (v1.0.0).
> Ma trận truy vết: `docs/traceability-matrix.md`.

## 1. Quy ước

| Ký hiệu | Ý nghĩa |
|---|---|
| ✅ Pass | Đã chạy, kết quả khớp Expected, có bằng chứng |
| ⏳ Chờ | Chưa chạy được (thiếu API hoặc code của owner khác) |
| ⛔ Hoãn | Ngoài phạm vi bàn giao (DEFERRED) |

Phạm vi và nguồn dữ liệu:
- Unit/UI test: dữ liệu giả (mock) trong chính file test, không gọi API thật.
- Integration/E2E: dùng tài khoản và sản phẩm seed riêng cho test (không dùng chung dữ liệu dev), do `apps/api/prisma/seed.ts` cung cấp.
- Mã tiền tệ: chuỗi số nguyên VND theo contract (ví dụ `"100000"`).

## 2. Các ca kiểm thử

| ID | FR/NFR | Loại | Kịch bản | Expected | Actual | Trạng thái | Bằng chứng |
|---|---|---|---|---|---|---|---|
| TC-01 | FR-06 | Unit | Trang `/orders` có dữ liệu | Hiện mã đơn, trạng thái, ngày, tổng tiền | Khớp Expected | ✅ Pass | `orders.test.tsx`, PR #3 |
| TC-02 | NFR-03 | Unit | `/orders` ở trạng thái Loading, Empty, Error + Retry | Đúng 3 trạng thái; Retry gọi lại fetch | Khớp Expected | ✅ Pass | `orders.test.tsx` |
| TC-03 | FR-06 | Unit | `/orders/[id]` hiển thị stepper, món, tổng tiền | Stepper đúng bước hiện tại; món có size/topping | Khớp Expected | ✅ Pass | `order-detail.test.tsx` |
| TC-04 | FR-06, FR-07 | Unit | Stepper theo từng trạng thái (PENDING, PREPARING, COMPLETED) | Bước đã xong, hiện tại, sắp tới đúng | Khớp Expected | ✅ Pass | `order-stepper.test.tsx` |
| TC-05 | FR-06 | Unit | Đơn `PAYMENT_FAILED` hoặc `CANCELLED` | Hiện khối trạng thái lỗi thay cho stepper | Khớp Expected | ✅ Pass | `order-stepper.test.tsx` |
| TC-06 | NFR-02 | Unit | Gọi `/orders` khi chưa đăng nhập (401) | Báo cần đăng nhập, không hiện dữ liệu đơn | Khớp Expected | ✅ Pass | `orders.test.tsx` |
| TC-07 | NFR-02 | Unit | Xem chi tiết đơn của người khác (403) | Báo không có quyền, không hiện dữ liệu đơn | Khớp Expected | ✅ Pass | `order-detail.test.tsx` |
| TC-08 | FR-06, NFR-02 | API | User A gọi `GET /orders/:id` của user B | `403 ORDER_ACCESS_DENIED`, không lộ dữ liệu | Chưa có API | ⏳ Chờ | Chờ owner C |
| TC-09 | FR-06 | API | `GET /orders` chỉ trả đơn của chính user, mới nhất trước | Danh sách đúng user, sắp xếp giảm dần theo ngày | Chưa có API | ⏳ Chờ | Chờ owner C |
| TC-10 | FR-05 | E2E | Happy path: giỏ hàng, tạo đơn, thanh toán thành công | Đơn `PENDING` rồi `PAID`, có mã đơn, xuất hiện trong lịch sử | Chưa chạy | ⏳ Chờ | `checkout-flow.spec.ts` (khung) |
| TC-11 | FR-05 | E2E/API | Payment failure: `accountRef` kết thúc `0000` | `Payment FAILED`, `Order PAYMENT_FAILED`, hoàn tồn kho, giữ giỏ hàng | Chưa chạy | ⏳ Chờ | Chờ C, D |
| TC-12 | FR-05, NFR-05 | Integration | Retry: gửi lại cùng `Idempotency-Key` và cùng payload | Trả kết quả cũ, không trừ tiền lần hai, chỉ 1 đơn | Chưa chạy | ⏳ Chờ | Chờ D |
| TC-13 | NFR-05 | Integration | Cùng `Idempotency-Key` nhưng khác payload | `409 IDEMPOTENCY_KEY_PAYLOAD_MISMATCH` | Chưa chạy | ⏳ Chờ | Chờ D |
| TC-14 | FR-05 | Integration | Thanh toán đơn đã `PAID` | `400 ORDER_ALREADY_PAID` | Chưa chạy | ⏳ Chờ | Chờ D |
| TC-15 | FR-05, NFR-05 | Integration | Hết hàng khi tạo đơn | `400 OUT_OF_STOCK`, tồn kho không đổi, không tạo đơn | Chưa chạy | ⏳ Chờ | Chờ C |
| TC-16 | NFR-02 | Integration | Gọi `POST /orders` không có token | `401 UNAUTHORIZED` | Khớp Expected | ✅ Pass | `orders.security.spec.ts` |
| TC-17 | FR-07 | API | Nhân viên chuyển `PAID` sang `PREPARING`; khách gọi `PATCH` | Staff thành công (200); khách bị chặn (403); chuyển sai trả 400 | Khớp Expected | ✅ Pass | `orders.security.spec.ts`, `orders.service.spec.ts` |
| TC-18 | NFR-03 | Thủ công | Xem `/orders` ở 375px và 430px; ngắt mạng | Layout không vỡ; có thông báo lỗi thân thiện và nút Retry | Chưa chạy | ⏳ Chờ | Ảnh chụp, bổ sung sau |
| TC-19 | NFR-04 | Smoke | `GET /health` | `200 OK`, database `up` | Chưa chạy | ⏳ Chờ | Chờ D |
| TC-20 | FR-08 | Unit | Áp mã ưu đãi | Giảm tiền theo voucher | Không áp dụng | ⛔ Hoãn | `api-contracts.md` mục 1.2 |
| TC-21 | FR-02, NFR-03 | Unit | `/products/[id]` chọn Size Regular/Large (+10.000đ), Topping và các trạng thái Loading/Error/Retry/404/Out of stock | Giá tính lại tức thời đúng công thức; nút Retry hoạt động; món hết hàng khóa nút thêm | Khớp Expected | ✅ Pass | `apps/web/__tests__/cart.test.tsx` (`WEB-T02`) |
| TC-22 | FR-03 | Unit | Quản lý giỏ hàng (`CartContext`, `/cart`, `CartDrawer`): thêm/tăng/giảm/xóa/clear, gộp dòng cùng cấu hình, tách dòng khác cấu hình, xuất payload cho F | Cùng cấu hình gộp số lượng; khác cấu hình tách dòng; payload chỉ gửi `productId/quantity/selectedSize/selectedToppings` | Khớp Expected | ✅ Pass | `apps/web/__tests__/cart.test.tsx` (`WEB-T03`) |
| TC-23 | FR-03, FR-05, NFR-03 | Integration | E-20 Regression: Chọn Large+topping -> checkout có cùng cấu hình; thanh toán thất bại giữ giỏ & retry; thanh toán thành công xóa giỏ đúng 1 lần; đối soát sync giá và tồn kho với server | Giữ nguyên cấu hình món và ghi chú sang checkout; lỗi thanh toán bảo toàn giỏ 100%; thành công clear giỏ; tự động cập nhật giá và loại bỏ món hết hàng | Khớp Expected | ✅ Pass | `apps/web/__tests__/cart.test.tsx` (`WEB-T03`), `checkout.test.tsx` |

## 3. Ghi chú

- Các ca TC-08 đến TC-19 phụ thuộc API của B, C, D (Sprint 2). Khi API sẵn sàng, đổi `NEXT_PUBLIC_USE_FIXTURES=false`, chạy lại và điền Actual kèm log hoặc ảnh.
- Khung E2E: `tests/e2e/checkout-flow.spec.ts`. Các ca chưa chạy được đánh dấu `test.fixme` kèm lý do, không tính là pass.
- Quy ước Mock Gateway: `accountRef` kết thúc bằng `0000` sẽ giả lập thanh toán thất bại (theo `api-contracts.md`).