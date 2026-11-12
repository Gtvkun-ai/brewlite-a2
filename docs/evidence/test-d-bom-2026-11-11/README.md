# Test D – Tính tồn kho theo định mức nguyên liệu (BOM)

- Ngày kiểm tra: 11/11/2026
- Nguồn yêu cầu: `docs/evidence/lecturer-audit-report.md`
- Phạm vi: Kiểm tra phép tính BOM theo dữ liệu định mức giả lập.

## 1. Dữ liệu đầu vào

| Nguyên liệu | Tồn kho | Định mức/ly | Số ly tối đa |
|---|---:|---:|---:|
| Cà phê | 500 g | 10 g | 50 |
| Sữa tươi | 1.000 ml | 50 ml | 20 |
| Đường | 200 g | 5 g | 40 |

## 2. Cách tính

Số ly tối đa được xác định theo nguyên liệu giới hạn:

`min(500/10, 1000/50, 200/5) = min(50, 20, 40) = 20 ly`

Sữa tươi là nguyên liệu giới hạn. Khi phục vụ 20 ly:

- Cà phê đã dùng: 200 g, còn 300 g.
- Sữa tươi đã dùng: 1.000 ml, còn 0 ml.
- Đường đã dùng: 100 g, còn 100 g.

Không thể phục vụ thêm ly thứ 21 vì đã hết sữa.

## 3. Kết quả kiểm tra

- Phép tính định mức: ĐÚNG.
- Số lượng tối đa theo dữ liệu giả lập: 20 ly.
- Nguyên liệu giới hạn: Sữa tươi.

**Trạng thái: NOT EXECUTED – Chỉ xác nhận phép tính, chưa xác nhận kiểm thử tích hợp trên hệ thống.**

## 4. Giới hạn và bằng chứng kỹ thuật

Kiểm tra `apps/api/prisma/schema.prisma` ngày 11/11/2026 cho thấy:

- Model `Product` có trường `stockQuantity` để quản lý tồn kho thành phẩm.
- Không tìm thấy model hoặc bảng riêng cho nguyên liệu, định mức công thức hay BOM.
- Database hiện có các bảng `Product`, `Order`, `OrderItem`, `Payment`, `User`, `Promotion`, `LoyaltyTransaction` và `_prisma_migrations`.

Do đó, chưa có cơ sở để khẳng định hệ thống thực tế tự động trừ cà phê, sữa và đường theo định mức BOM.

Muốn xác nhận đầy đủ Test D cần có dữ liệu BOM, logic tính tồn kho thành phẩm từ nguyên liệu và kiểm thử đặt hàng đến khi nguyên liệu giới hạn bằng 0.

## 5. Kết luận

Phép tính theo yêu cầu giảng viên cho kết quả 20 ly, giới hạn bởi sữa tươi. Tuy nhiên, đây là kết quả tính toán trên dữ liệu giả lập, không phải bằng chứng hệ thống đã triển khai và vận hành BOM.
