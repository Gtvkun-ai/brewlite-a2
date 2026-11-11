# Test A – Chống sửa giá từ Client

- Ngày kiểm tra: 11/11/2026
- Mục tiêu: Ngăn khách hàng tự gửi giá sản phẩm không hợp lệ từ phía Client.

## Kết quả

- API sử dụng ValidationPipe với whitelist và forbidNonWhitelisted.
- Trường giá không được phép gửi từ Client bị từ chối HTTP 400.
- OrdersService lấy giá sản phẩm từ database và tính tổng tiền phía Server.
- Bộ kiểm thử HTTP/security: 5/5 ca PASS.

## Bằng chứng

- `../test-a-hack-price-rejected.jpg`: yêu cầu sửa giá bị từ chối.
- `../test-a-security-suite-pass.jpg`: kết quả bộ kiểm thử bảo mật.

**Kết luận: PASS trong phạm vi kiểm thử HTTP/security và kiểm tra logic phía Server.**
