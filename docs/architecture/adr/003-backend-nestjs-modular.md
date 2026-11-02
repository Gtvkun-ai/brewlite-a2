# ADR 003: Kiến trúc Phân lớp Modular cho Backend NestJS

* **Trạng thái:** Được chấp thuận (Accepted)
* **Ngày quyết định:** 2026-11-02
* **Người quyết định:** Nhóm phát triển BrewLite

## Ngữ cảnh (Context)
Hệ thống backend cần xử lý đồng thời nhiều nghiệp vụ: xác thực danh tính, tra cứu menu, quản lý giỏ hàng, đặt hàng, trừ tồn kho và thanh toán. Backend cần đảm bảo tính mở rộng cao, dễ viết unit/integration test độc lập.

## Quyết định (Decision)
Áp dụng **Kiến trúc Modular** của **NestJS**:
* Chia nhỏ hệ thống thành các Module độc lập theo Domain: `AuthModule`, `CatalogModule`, `OrderModule`, `PaymentModule`, `HealthModule`.
* Áp dụng Dependency Injection để tách rời Controller, Service và Repository/Prisma.
* Sử dụng `class-validator` và `ValidationPipe` để tự động kiểm tra tính hợp lệ của DTO đầu vào.

## Hệ quả (Consequences)
* **Tích cực:** Mã nguồn gọn gàng, rõ ràng, phân định ranh giới trách nhiệm (Separation of Concerns), dễ dàng mock service để viết unit test.
* **Tiêu cực:** Số lượng file cấu hình (module, controller, service, dto) nhiều hơn mô hình script đơn lẻ.
