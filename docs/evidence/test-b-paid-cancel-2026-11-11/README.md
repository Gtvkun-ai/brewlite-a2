# Test B – Hủy đơn đã thanh toán và ghi nhận yêu cầu hoàn tiền

- **Ngày kiểm thử:** 11/11/2026
- **Môi trường:** Docker API và PostgreSQL cục bộ
- **Kết quả:** PASS – Hủy đơn và ghi nhận yêu cầu hoàn tiền đang chờ xử lý

## 1. Thông tin kiểm thử

| Thông tin | Giá trị |
|---|---|
| Mã đơn hàng | BL-20261111-ACKF |
| Order ID | cmwc7w46p0001px01t177j67h |
| Payment ID | cmwc8125l0005px01ospxy0rk |
| Sản phẩm | CF-MILK – Cà phê sữa đá |
| Số lượng | 1 |
| Tổng tiền | 35.000 VNĐ |
| Phương thức thanh toán | E_WALLET |

## 2. Các bước thực hiện và kết quả

| STT | Thao tác | Kết quả |
|---|---|---|
| 1 | Tạo đơn hàng | PENDING |
| 2 | Thanh toán bằng Mock Gateway | SUCCESS |
| 3 | Kiểm tra trạng thái đơn | PAID |
| 4 | Gửi yêu cầu hủy đơn | HTTP 200 |
| 5 | Kiểm tra trạng thái đơn sau khi hủy | CANCELLED |
| 6 | Kiểm tra trạng thái thanh toán trong PostgreSQL | REFUND_PENDING |
| 7 | Kiểm tra tồn kho sau khi hủy | Khôi phục về 99 |

## 3. Bằng chứng cơ sở dữ liệu

### 3.1. Trạng thái thanh toán

- Payment status: `REFUND_PENDING`
- Amount: `35000`

Kết quả truy vấn PostgreSQL xác nhận yêu cầu hoàn tiền đã được ghi nhận.

### 3.2. Số lượng tồn kho

| Thời điểm | Số lượng |
|---|---:|
| Trước khi tạo đơn | 99 |
| Sau khi tạo đơn | 98 |
| Sau khi hủy đơn | 99 |

Tồn kho được hoàn lại đúng 1 sản phẩm sau khi hủy đơn.

## 4. Kiểm tra mã nguồn và triển khai

- Đã bổ sung `REFUND_PENDING` vào enum `PaymentStatus`.
- Đã tạo migration `20261111130421_add_refund_pending_payment_status`.
- Đã áp dụng migration thành công.
- Đã tạo lại Prisma Client thành công.
- Đã bổ sung unit Test Bho trường hợp hủy đơn PAID.
- Kiểm thử `orders.service.spec.ts`: 19/19 test thành công.
- Build API thành công.
- Build Docker API thành công.
- Container API đã khởi động và phản hồi request.

## 5. Giới hạn kiểm thử

Mock Gateway hiện chỉ hỗ trợ thanh toán (`charge`), chưa triển khai hoàn tiền (`refund`).

Do đó:
- Đã xác nhận đơn hàng được hủy thành công.
- Đã xác nhận trạng thái thanh toán chuyển sang `REFUND_PENDING`.
- Chưa xác nhận tiền thực tế được hoàn về ví khách hàng.

Không xem `REFUND_PENDING` là bằng chứng hoàn tiền thực tế.

## 6. Kết luận

**PASS – Hủy đơn đã thanh toán và ghi nhận yêu cầu hoàn tiền đang chờ xử lý.**

Chức năng hủy đơn, cập nhật trạng thái thanh toán và khôi phục tồn kho đã được kiểm chứng trên API thực tế và PostgreSQL cục bộ.

Chức năng hoàn tiền thực tế qua cổng thanh toán vẫn chưa được triển khai và kiểm thử.

