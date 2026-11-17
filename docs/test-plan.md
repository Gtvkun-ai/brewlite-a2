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
| TC-10 | FR-05, FR-06 | E2E | Từ menu, tùy chỉnh món, giỏ hàng, tạo đơn và thanh toán | Mở chi tiết đúng mã đơn, thấy trạng thái `PAID` | Chrome desktop với Ví và viewport mobile với Thẻ đã thấy chi tiết đơn sau thanh toán | ✅ Pass | [Nghiệm thu Chrome thật](evidence/demo-acceptance-2026-11-14/AUDIT.md#2-đối-chiếu-yêu-cầu) |
| TC-11 | FR-05, NFR-05 | E2E/API | Thanh toán bị từ chối, sau đó thử lại trên cùng đơn | Hoàn kho khi `FAILED`. Lần thử mới dùng key mới, chuyển `SUCCESS` và giữ đúng một lượt trừ kho | Chuỗi `FAILED → SUCCESS` trên cùng order ID. Tồn kho sau lỗi bằng ban đầu, sau thành công giảm 1 | ✅ Pass | [Kết quả retry](evidence/demo-acceptance-2026-11-14/payment-retry.json) |
| TC-12 | FR-05, NFR-05 | Integration | Gửi lại `POST /payments` với cùng `Idempotency-Key` và nội dung | Cùng kết quả và mã giao dịch, đúng một bản ghi thanh toán, tồn kho sau replay giữ nguyên | Cả hai trả 200 với cùng `paymentId` và `transactionRef`, PostgreSQL có 1 bản ghi, kho vẫn 1 | ✅ Pass | [Nghiệm thu Postman + PostgreSQL](evidence/postman-acceptance-2026-11-17/README.md) |
| TC-13 | FR-05, NFR-05 | Integration | Gửi lại `POST /payments` với cùng key và đổi `accountRef` | `409 IDEMPOTENCY_KEY_PAYLOAD_MISMATCH` | HTTP 409 và mã lỗi đúng | ✅ Pass | [Nghiệm thu Postman](evidence/postman-acceptance-2026-11-17/README.md) |
| TC-14 | FR-05 | Integration | Thanh toán đơn đã `PAID` | `400 ORDER_ALREADY_PAID` | Chưa chạy | ⏳ Chờ | Chờ D |
| TC-15 | FR-05, NFR-05 | Integration | Hết hàng khi tạo đơn | `400 OUT_OF_STOCK` và yêu cầu bị từ chối không tạo thêm đơn | Ca tranh kho 2/2 tạo đúng một đơn, yêu cầu còn lại trả `400 OUT_OF_STOCK` | ✅ Pass | [Nghiệm thu Postman](evidence/postman-acceptance-2026-11-17/README.md) |
| TC-16 | NFR-02 | Integration | Gọi `POST /orders` không có token | `401 UNAUTHORIZED` | Khớp Expected | ✅ Pass | `orders.security.spec.ts` |
| TC-17 | FR-07 | API | Nhân viên chuyển `PAID` sang `PREPARING`; khách gọi `PATCH` | Staff thành công (200); khách bị chặn (403); chuyển sai trả 400 | Khớp Expected | ✅ Pass | `orders.security.spec.ts`, `orders.service.spec.ts` |
| TC-18 | NFR-03 | Thủ công | Xem `/orders` ở 375px và 430px; ngắt mạng | Layout không vỡ; có thông báo lỗi thân thiện và nút Retry | Chưa chạy | ⏳ Chờ | Ảnh chụp, bổ sung sau |
| TC-19 | NFR-04 | Smoke | `GET /health` | `200 OK`, database `up` | Kiểm tra health và PostgreSQL thành công trên API demo cục bộ | ✅ Pass | [Log nghiệm thu Postman](evidence/postman-acceptance-2026-11-17/newman.txt) |
| TC-20 | FR-08 | Unit | Áp mã ưu đãi | Giảm tiền theo voucher | Không áp dụng | ⛔ Hoãn | `api-contracts.md` mục 1.2 |
| TC-21 | FR-02, NFR-03 | Unit | `/products/[id]` chọn Size Regular/Large (+10.000đ), Topping và các trạng thái Loading/Error/Retry/404/Out of stock | Giá tính lại tức thời đúng công thức; nút Retry hoạt động; món hết hàng khóa nút thêm | Khớp Expected | ✅ Pass | `apps/web/__tests__/cart.test.tsx` (`WEB-T02`) |
| TC-22 | FR-03 | Unit | Quản lý giỏ hàng (`CartContext`, `/cart`, `CartDrawer`): thêm/tăng/giảm/xóa/clear, gộp dòng cùng cấu hình, tách dòng khác cấu hình, xuất payload cho F | Cùng cấu hình gộp số lượng; khác cấu hình tách dòng; payload chỉ gửi `productId/quantity/selectedSize/selectedToppings` | Khớp Expected | ✅ Pass | `apps/web/__tests__/cart.test.tsx` (`WEB-T03`) |
| TC-23 | FR-03, FR-05, NFR-03 | Integration | E-20 Regression: Chọn Large+topping -> checkout có cùng cấu hình; thanh toán thất bại giữ giỏ & retry; thanh toán thành công xóa giỏ đúng 1 lần; đối soát sync giá và tồn kho với server | Giữ nguyên cấu hình món và ghi chú sang checkout; lỗi thanh toán bảo toàn giỏ 100%; thành công clear giỏ; tự động cập nhật giá và loại bỏ món hết hàng | Khớp Expected | ✅ Pass | `apps/web/__tests__/cart.test.tsx` (`WEB-T03`), `checkout.test.tsx` |
| TC-24 | FR-05, NFR-05 | Integration | Kho còn 2 bánh, hai khách đặt 2 bánh đồng thời | Một đơn được tạo, một yêu cầu hết hàng. Kho giảm từ 2 xuống 0 rồi về 2 khi hủy đơn | HTTP 201 và `400 OUT_OF_STOCK`, API báo kho `2 → 0 → 2` | ✅ Pass | [Nghiệm thu Postman](evidence/postman-acceptance-2026-11-17/README.md) |

## 3. Ghi chú

- Các ca luồng thật được chạy với `NEXT_PUBLIC_USE_FIXTURES=false`. Bảng ghi rõ ca nào có bằng chứng trên môi trường demo.
- Bộ E2E API thật nằm ở `tests/real-browser/demo-acceptance.spec.ts`. Các ca khung `test.fixme` trong `tests/e2e/checkout-flow.spec.ts` giữ trạng thái skip.
- Quy ước Mock Gateway: `accountRef` kết thúc bằng `0000` sẽ giả lập thanh toán thất bại (theo `api-contracts.md`).
