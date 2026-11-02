# ADR 001: Lựa chọn Cấu trúc Monorepo cho Dự án BrewLite

* **Trạng thái:** Được chấp thuận (Accepted)
* **Ngày quyết định:** 2026-11-02
* **Người quyết định:** Nhóm phát triển BrewLite

## Ngữ cảnh (Context)
Dự án BrewLite bao gồm hai ứng dụng chính: Frontend (Next.js) và Backend (NestJS), cùng hệ thống tài liệu kỹ thuật, sơ đồ UML và kiểm thử E2E. Nhóm cần quyết định nên tách làm hai repository riêng biệt (Multi-repo) hay quản lý chung trong một kho mã nguồn duy nhất (Monorepo).

## Quyết định (Decision)
Nhóm quyết định áp dụng cấu trúc **Monorepo** theo chuẩn mục 9 của đề bài:
* `apps/web`: Mã nguồn ứng dụng Next.js.
* `apps/api`: Mã nguồn ứng dụng NestJS.
* `docs/`: Toàn bộ tài liệu đặc tả, sơ đồ, kiến trúc và ma trận truy vết.
* `tests/`: Kiểm thử tích hợp và E2E end-to-end.

## Hệ quả (Consequences)
* **Tích cực:** Quản lý phiên bản thống nhất, đơn giản hóa quy trình review Pull Request, dễ dàng đồng bộ contract giữa frontend và backend.
* **Tiêu cực:** Pipeline CI cần cấu hình `working-directory` để tránh chạy lại toàn bộ test khi chỉ sửa đổi một phía.
