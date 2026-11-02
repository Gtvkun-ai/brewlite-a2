# ADR 005: Dịch vụ Thanh toán Mô phỏng và Xử lý Idempotency

* **Trạng thái:** Được chấp thuận (Accepted)
* **Ngày quyết định:** 2026-11-02
* **Người quyết định:** Nhóm phát triển BrewLite

## Ngữ cảnh (Context)
Trong phạm vi đồ án, việc kết nối cổng thanh toán thật (như VNPay/MoMo doanh nghiệp) đòi hỏi giấy phép kinh doanh và ký quỹ. Đồng thời, mạng di động chập chờn có thể khiến khách hàng bấm thanh toán nhiều lần gây trùng lặp giao dịch.

## Quyết định (Decision)
* Xây dựng **Mock Payment Service**: mô phỏng đầy đủ quy trình xử lý thanh toán qua Ví điện tử và Thẻ ngân hàng với độ trễ thực tế, sinh mã tham chiếu giao dịch và hỗ trợ kịch bản thành công / thất bại để kiểm thử.
* Áp dụng cơ chế **Idempotency Key**: Frontend sinh UUID v4 gửi kèm header `Idempotency-Key`. Backend lưu trữ key và kết quả đơn hàng. Nếu gặp request trùng lặp, backend trả về ngay kết quả đơn ban đầu mà không tạo đơn hoặc trừ tiền lần hai.

## Hệ quả (Consequences)
* **Tích cực:** Đáp ứng trọn vẹn yêu cầu đồ án mà không phụ thuộc hạ tầng bên ngoài; kiểm chứng được khả năng chịu lỗi và tính bền bỉ của hệ thống.
* **Tiêu cực:** Dữ liệu thanh toán là giả lập, cần chuyển đổi sang Adapter thanh toán thực tế khi đưa vào kinh doanh thương mại.
