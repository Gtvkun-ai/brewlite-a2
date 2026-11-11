# Test C – Tranh chấp tồn kho đồng thời

- Ngày kiểm tra: 11/11/2026
- Môi trường: Local API + PostgreSQL qua Docker Compose

## 1. Kết quả kiểm thử thực tế

Sản phẩm: Croissant

- Tồn kho trước kiểm thử: 40
- Khách hàng 1 gửi yêu cầu đặt 40 sản phẩm.
- Khách hàng 2 đồng thời gửi yêu cầu đặt 40 sản phẩm.
- Khách hàng 1: tạo đơn thành công, mã `BL-20261111-CIXS`.
- Khách hàng 2: bị từ chối với lỗi `OUT_OF_STOCK`.
- Tồn kho sau hai yêu cầu: 0.
- Sau khi hủy đơn của khách hàng 1, tồn kho được phục hồi về 40.

## 2. Đánh giá

- Chỉ một yêu cầu được tạo đơn thành công.
- Không xảy ra bán vượt tồn kho.
- Tồn kho không bị âm.
- Hủy đơn PENDING phục hồi số lượng kho.

**Kết quả: PASS cho kịch bản tranh chấp 40 sản phẩm trên API thực tế.**

## 3. Khác biệt với kịch bản giảng viên

Kịch bản yêu cầu trong `lecturer-audit-report.md` là:

- Tồn kho ban đầu đúng 2 sản phẩm.
- Hai tài khoản đồng thời đặt mỗi tài khoản 2 sản phẩm.
- Chỉ một yêu cầu thành công, tồn kho cuối bằng 0.

Kịch bản trên chưa được chạy đúng nguyên văn. Bằng chứng hiện tại xác nhận nguyên tắc chống overselling trong tình huống 40/40, không thay thế hoàn toàn kịch bản 2/2.

## 4. Bằng chứng mã nguồn liên quan

- `apps/api/src/orders/orders.service.ts`
- `apps/api/src/orders/orders.service.spec.ts`

Không sử dụng kết quả unit test thay thế cho kết quả API thực tế.
