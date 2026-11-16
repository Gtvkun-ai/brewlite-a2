# Kế hoạch thực hiện và nghiệm thu demo — 14/11/2026

Phạm vi: yêu cầu menu → tùy biến → drawer → thanh toán mô phỏng → theo dõi đơn, cộng quản trị sản phẩm. Giữ kiến trúc Next.js / NestJS / PostgreSQL; nghiệm thu bằng Chrome thật và API thật.

| Yêu cầu | Công việc | Điều kiện nghiệm thu |
|---|---|---|
| Duyệt menu | Kiểm tra danh mục Coffee / Tea / Pastry, tìm kiếm, tồn kho | Chuyển cả 3 danh mục bằng UI, món đúng nhóm |
| Tùy biến | Đường/đá theo từng dòng; size và topping; lưu localStorage và DB | Cà phê muối: 70% đường, 50% đá, Large, topping; reload giữ cấu hình |
| Drawer | Mở sau thêm món; hiệu ứng trượt; tổng giá; sửa số lượng | Giá niêm yết + Large + topping; CTA Tiến hành đặt hàng |
| Thanh toán | Thẻ/Ví mô phỏng hợp lệ; API tính giá; không tự bịa giao dịch khi mất mạng | Tạo đơn, thanh toán SUCCESS, chuyển đúng order ID |
| Theo dõi | Poll API 3s; stepper tiếng Việt; xử lý mất mạng; demo worker tùy chọn | DB PAID → PREPARING → READY → COMPLETED, browser cập nhật không reload |
| Admin | JWT và role; bật/tắt thật; tạo món; validation | admin@brewlite.vn đăng nhập, toggle đổi menu; tạo món xuất hiện phía khách |
| Chất lượng | Lint, unit/integration, build, real browser desktop/mobile | Lưu log, screenshot, video, trace, network evidence, báo cáo PASS/FAIL rõ ràng |

Không push/deploy trong phạm vi nhiệm vụ. Database demo riêng cổng 55432, web 3100, API 3101; không thay dữ liệu database có sẵn.
