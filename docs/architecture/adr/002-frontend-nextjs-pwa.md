# ADR 002: Lựa chọn Next.js theo Định hướng Mobile-first PWA

* **Trạng thái:** Được chấp thuận (Accepted)
* **Ngày quyết định:** 2026-11-02
* **Người quyết định:** Nhóm phát triển BrewLite

## Ngữ cảnh (Context)
Khách hàng của quán cà phê thường sử dụng điện thoại thông minh để đặt đồ uống trực tiếp tại bàn hoặc trước khi đến quầy. Ứng dụng cần tải nhanh, giao diện thân thiện với màn hình cảm ứng di động và không bắt buộc khách hàng phải tải ứng dụng native từ App Store.

## Quyết định (Decision)
Sử dụng **Next.js (App Router)** kết hợp công nghệ **Progressive Web App (PWA)**:
* Thiết kế theo tư duy **Mobile-first** (giao diện tối ưu cho kích thước 375px - 430px trước, sau đó co giãn cho desktop).
* Sử dụng Web App Manifest và Service Worker để hỗ trợ cài đặt icon ra màn hình chính điện thoại.
* Tối ưu trải nghiệm với 3 trạng thái giao diện: Loading, Empty và Error (kèm nút Retry).

## Hệ quả (Consequences)
* **Tích cực:** Tối ưu chi phí phát triển (1 codebase chạy được mọi nền tảng di động và desktop), thời gian tiếp cận khách hàng nhanh chóng.
* **Tiêu cực:** Một số tính năng native chuyên sâu của iOS Safari (như Web Push nền) bị hạn chế hơn so với native app.
