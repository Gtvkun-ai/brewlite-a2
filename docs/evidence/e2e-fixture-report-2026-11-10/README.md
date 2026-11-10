# Báo cáo kiểm thử E2E bằng dữ liệu mẫu - 10/11/2026

## 1. Môi trường kiểm thử
- Frontend: Next.js
- Công cụ kiểm thử: Playwright
- Chế độ: Fixture
- Cổng Frontend: 3100
- Backend API: Không kiểm thử API thật
- PostgreSQL / Docker: Không được sử dụng để xác nhận luồng Orders trong lần kiểm thử này

## 2. Lệnh kiểm thử
npx.cmd playwright test tests/e2e/checkout-flow.spec.ts --grep "Orders UI|test data is isolated" --workers=1

## 3. Kết quả
- Thành công: 5
- Thất bại: 0
- Tổng thời gian: Khoảng 1 phút 12 giây

## 4. Các tình huống đã kiểm thử
- TC-01: Hiển thị danh sách lịch sử đơn hàng.
- TC-03: Hiển thị chi tiết đơn hàng và tiến trình xử lý.
- TC-05: Đơn hàng PAYMENT_FAILED hiển thị trạng thái kết thúc.
- Đơn hàng không tồn tại: Hiển thị thông báo không tìm thấy và nút Retry.
- Kiểm tra dữ liệu kiểm thử được tách biệt với tài khoản dữ liệu mẫu.

## 5. Giới hạn kiểm thử
Các kiểm thử sử dụng Fixture, không xác nhận tích hợp API thật hoặc PostgreSQL.

Các tình huống tạo đơn, thanh toán, thanh toán thất bại, retry, hết hàng và phân quyền vẫn chưa được xác nhận trên môi trường tích hợp thực tế.

## 6. Bằng chứng
- index.html: Báo cáo chi tiết do Playwright tạo.
