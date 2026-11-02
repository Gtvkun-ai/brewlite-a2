# ADR 004: Sử dụng PostgreSQL và Prisma ORM với Cơ chế Migration Tự động

* **Trạng thái:** Được chấp thuận (Accepted)
* **Ngày quyết định:** 2026-11-02
* **Người quyết định:** Nhóm phát triển BrewLite

## Ngữ cảnh (Context)
Nghiệp vụ đặt hàng và thanh toán liên quan đến tiền bạc và số lượng tồn kho của quán. Cần đảm bảo tính toàn vẹn dữ liệu (ACID), tránh hiện tượng bán quá số lượng có sẵn (overselling) và theo dõi lịch sử thay đổi schema cơ sở dữ liệu có kiểm soát phiên bản.

## Quyết định (Decision)
* Chọn **PostgreSQL** làm cơ sở dữ liệu chính.
* Sử dụng **Prisma ORM** để quản lý schema và sinh client type-safe.
* Quản lý tiến hóa dữ liệu bằng **Prisma Migrate**: mọi thay đổi cấu trúc bảng đều sinh file SQL migration trong thư mục `prisma/migrations`.
* Áp dụng `prisma.$transaction` cho luồng tạo đơn hàng và trừ tồn kho.

## Hệ quả (Consequences)
* **Tích cực:** Đảm bảo toàn vẹn dữ liệu tuyệt đối; migration có thể tái tạo tự động trên bất kỳ môi trường nào (local, CI, cloud production) qua lệnh `prisma migrate deploy`.
* **Tiêu cực:** Cần khởi chạy dịch vụ PostgreSQL khi chạy test (được giải quyết bằng Docker Compose và GitHub Actions Services).
