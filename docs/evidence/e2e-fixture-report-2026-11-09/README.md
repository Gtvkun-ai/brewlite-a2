# Báo cáo kiểm thử E2E bằng dữ liệu mẫu - 09/11/2026

## 1. Môi trường kiểm thử
- Frontend: Next.js
- Công cụ kiểm thử: Playwright
- Chế độ: Fixture (NEXT_PUBLIC_USE_FIXTURES=true)
- Cổng Frontend: 3100
- Backend API: Không cần
- PostgreSQL / Docker: Không cần

## 2. Lệnh kiểm thử
npm.cmd run test:e2e -- --grep "Orders UI|test data is isolated"

## 3. Kết quả
- Thành công: 5
- Thất bại: 0
- Tổng thời gian: Khoảng 1 phút 30 giây

Có 6 kiểm thử E2E liên quan đến API thật đang được đánh dấu fixme,
chưa được triển khai và chưa được xác nhận hoạt động.

## 4. Các tình huống đã kiểm thử
- TC-01: Hiển thị danh sách lịch sử đơn hàng.
- TC-03: Hiển thị chi tiết đơn hàng và tiến trình xử lý.
- TC-05: Đơn hàng PAYMENT_FAILED hiển thị trạng thái kết thúc.
- Đơn hàng không tồn tại: Hiển thị thông báo không tìm thấy và nút Thử lại.
- Kiểm tra dữ liệu kiểm thử được tách biệt với tài khoản dữ liệu mẫu.

## 5. Giới hạn kiểm thử
Các kiểm thử sử dụng dữ liệu Fixture, không kết nối API thật hoặc cơ sở dữ liệu.

Kết quả này chưa chứng minh các chức năng tạo đơn hàng, thanh toán,
xử lý thanh toán thất bại, kiểm tra tồn kho và phân quyền hoạt động
trên môi trường tích hợp thực tế.

## 6. Bằng chứng
- index.html: Báo cáo chi tiết do Playwright tạo.
