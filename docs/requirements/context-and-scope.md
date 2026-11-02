# Task 1.1 – Bối cảnh, Stakeholder và Phạm vi (Context & Scope)

## 1. Vấn đề nghiệp vụ (Business Problem)
Trong mô hình kinh doanh quán cà phê và đồ uống truyền thống, các vấn đề nổi cộm bao gồm:
* **Ách tắc giờ cao điểm:** Khách hàng phải xếp hàng dài chờ gọi món và thanh toán tại quầy vào buổi sáng hoặc giờ nghỉ trưa, gây giảm sút nghiêm trọng trải nghiệm khách hàng.
* **Sai sót đơn hàng:** Nhân viên quầy nghe nhầm tùy chọn của khách (size, lượng đường, đá, topping), dẫn đến pha chế sai, lãng phí nguyên vật liệu và phát sinh chi phí bù đắp.
* **Trải nghiệm rời rạc:** Thiếu kênh đặt món tiện lợi, khách hàng không thể theo dõi trực quan trạng thái món đang được pha chế hay đã sẵn sàng để nhận.

**BrewLite** ra đời với sứ mệnh cung cấp giải pháp gọi món và thanh toán trực tuyến tinh gọn theo mô hình **Mobile-first PWA**. Khách hàng chỉ cần truy cập web app trên thiết bị di động, tự do tùy biến đồ uống, thanh toán trực tuyến mô phỏng tức thì và theo dõi trạng thái đơn hàng theo thời gian thực mà không cần cài đặt app từ App Store.

---

## 2. Bảng Stakeholder chính (Key Stakeholders)

| STT | Stakeholder | Vai trò & Trách nhiệm | Mục tiêu & Kỳ vọng |
| :---: | :--- | :--- | :--- |
| **1** | **Khách hàng**<br>*(Customer)* | Người dùng cuối đặt đồ uống qua web app trên di động. | • Xem menu trực quan kèm giá rõ ràng.<br>• Tùy chọn size, lượng đường, đá, topping dễ dàng.<br>• Đặt hàng và thanh toán nhanh chóng (Ví/Thẻ mô phỏng).<br>• Theo dõi trạng thái đơn hàng theo thời gian thực. |
| **2** | **Nhân viên quầy / Pha chế**<br>*(Barista / Cashier)* | Tiếp nhận thông tin đơn hàng, thực hiện pha chế và bàn giao cho khách. | • Nhận thông tin chi tiết từng order chính xác, hạn chế nhầm lẫn.<br>• Cập nhật trạng thái đơn (Đang pha chế ➔ Sẵn sàng lấy ➔ Đã giao).<br>• Giao diện tối giản, phản hồi tức thời. |
| **3** | **Quản lý cửa hàng**<br>*(Store Manager)* | Giám sát vận hành cửa hàng, quản lý danh mục và tồn kho nguyên liệu. | • Kiểm soát danh mục sản phẩm (bật/tắt món hết hàng).<br>• Theo dõi lịch sử giao dịch và doanh thu theo ngày.<br>• Giảm thời gian chờ trung bình của khách hàng. |
| **4** | **Giảng viên / Khách hàng nghiệm thu**<br>*(Evaluator)* | Đánh giá chất lượng kỹ thuật, tính toàn vẹn của quy trình công nghệ phần mềm. | • Dự án thực hiện tuần tự đúng 5 Task theo chuẩn SE.<br>• Mã nguồn sạch, test đầy đủ, CI/CD tự động.<br>• Có liên kết truy vết rõ ràng (Traceability Matrix).<br>• Hệ thống Production hoạt động ổn định qua HTTPS. |
| **5** | **Nhóm phát triển**<br>*(Dev Team)* | Thiết kế kiến trúc, hiện thực hóa mã nguồn, viết test và triển khai hệ thống. | • Kiến trúc Monorepo rõ ràng, dễ bảo trì.<br>• Tự động hóa kiểm thử và triển khai qua CI/CD.<br>• Dữ liệu toàn vẹn, bảo vệ bằng Transaction và Idempotency. |
| **6** | **Đơn vị thanh toán**<br>*(Payment Provider)* | Cung cấp hạ tầng thanh toán số (được mô phỏng trong đồ án). | • Xử lý giao dịch an toàn, tin cậy.<br>• Hỗ trợ Idempotency Key chống thanh toán trùng lặp.<br>• Trả về kết quả giao dịch và mã tham chiếu minh bạch. |

---

## 3. Phạm vi sản phẩm (Product Scope)

### 3.1. Phạm vi trong MVP (In-Scope for MVP)
Luồng nghiệp vụ tối thiểu end-to-end:
$$\text{Xem menu} \longrightarrow \text{Chọn tùy chọn (size/topping)} \longrightarrow \text{Giỏ hàng} \longrightarrow \text{Đặt đơn} \longrightarrow \text{Thanh toán mô phỏng} \longrightarrow \text{Theo dõi đơn}$$

* **Xem danh mục món (Menu Catalog):** Hiển thị danh sách sản phẩm theo danh mục, giá tiền, hình ảnh và trạng thái còn/hết hàng.
* **Tùy biến món (Customization):** Hỗ trợ chọn size (Regular, Large), độ ngọt, đá và các loại topping kèm theo đơn giá phụ thu.
* **Quản lý giỏ hàng (Cart Management):** Thêm món, điều chỉnh số lượng, xóa món, tự động tính tổng tiền giỏ hàng.
* **Xác thực người dùng (Authentication):** Đăng ký, đăng nhập tài khoản và cấp JWT Bearer token để bảo vệ thông tin đơn hàng cá nhân.
* **Tạo đơn hàng (Order Creation):** Tạo đơn hàng kèm snapshot giá tại thời điểm đặt, áp dụng Database Transaction để đảm bảo tính toàn vẹn.
* **Thanh toán mô phỏng (Mock Payment):** Hỗ trợ thanh toán qua Ví điện tử mô phỏng (E-Wallet) hoặc Thẻ nội địa/quốc tế mô phỏng; cơ chế Idempotency chống thanh toán lặp.
* **Theo dõi & Lịch sử đơn hàng (Order Tracking & History):** Xem chi tiết đơn hàng vừa đặt, theo dõi tiến độ đơn hàng và xem lại lịch sử đơn trong tài khoản.
* **Hạ tầng & Vận hành:** Docker-compose chạy local, Health check (`GET /health`), Pipeline CI tự động và Cloud Deployment trên nền tảng công khai với HTTPS.

### 3.2. Phạm vi mở rộng trong tương lai (Future Enhancements)
* Tích hợp cổng thanh toán thực tế (VNPay Sandbox, MoMo Business, ZaloPay API).
* Thông báo đẩy qua Web Push Notifications / WebSocket khi trạng thái đơn thay đổi.
* Chương trình tích điểm thành viên (Loyalty Points) và đổi voucher giảm giá.
* Bảng điều khiển nâng cao (Analytics Dashboard) dành cho quản lý cửa hàng.

### 3.3. Nội dung không thực hiện (Out-of-Scope)
* Tích hợp dịch vụ giao hàng đường dài (tài xế xe máy bên thứ ba như GrabExpress, Ahamove). Khách hàng chỉ chọn nhận tại quầy (Take-away / Dine-in).
* Hỗ trợ thanh toán tiền mặt qua trung gian thu hộ.
* Quản lý đa chi nhánh phức tạp (Multi-branch Franchise inventory).

---

## 4. Giả định và Ràng buộc (Assumptions & Constraints)

### 4.1. Giả định (Assumptions)
1. Khách hàng sử dụng thiết bị smartphone hoặc máy tính cá nhân có kết nối Internet ổn định và trình duyệt hỗ trợ chuẩn HTML5 / PWA (Chrome, Safari, Edge).
2. Dữ liệu menu mẫu (seed data) ban đầu được khởi tạo sẵn trong cơ sở dữ liệu để phục vụ kiểm thử và đánh giá.
3. Cổng thanh toán hoạt động theo cơ chế mô phỏng an toàn (Sandbox Mock Gateway), phản hồi kết quả tức thì để kiểm chứng luồng nghiệp vụ.

### 4.2. Ràng buộc kỹ thuật & quy trình (Constraints)
1. **Frontend:** Bắt buộc sử dụng **Next.js (App Router)** theo hướng **Mobile-first PWA**.
2. **Backend:** Bắt buộc sử dụng **NestJS** theo kiến trúc Modular / Domain-driven.
3. **Cơ sở dữ liệu:** Bắt buộc sử dụng **PostgreSQL**, quản lý schema và migration thông qua **Prisma ORM**.
4. **Quy tắc thực hiện tuần tự:** Năm task phải được hoàn thành theo đúng thứ tự. Task sau chỉ được nghiệm thu khi tạo phẩm bắt buộc của task trước đã có trên kho mã nguồn với lịch sử commit rõ ràng.
5. **Môi trường Production:** Phải triển khai hệ thống lên môi trường đám mây có thể truy cập công khai qua giao thức HTTPS.

---

## 5. Rủi ro ban đầu và Phương án giảm thiểu (Risks & Mitigation)

| Rủi ro (Risk) | Mức độ | Hậu quả tiềm ẩn | Phương án giảm thiểu (Mitigation Strategy) |
| :--- | :---: | :--- | :--- |
| **Thanh toán trùng lặp do mạng chập chờn** | Cao | Khách hàng bấm gửi yêu cầu thanh toán nhiều lần gây trừ tiền 2 lần. | Triển khai cơ chế **Idempotency Key** tại Backend: nếu trùng key trong vòng 5 phút thì trả về kết quả đơn hàng đã tạo thay vì trừ tiền lần 2. |
| **Xung đột tồn kho khi nhiều khách đặt cùng lúc** | Cao | Sản phẩm hết hàng nhưng vẫn cho phép tạo đơn thành công. | Sử dụng **Database Transaction** (`prisma.$transaction`) để kiểm tra và cập nhật tồn kho nguyên tử trước khi xác nhận đơn. |
| **Lộ bí mật môi trường (.env) lên Git** | Cao | Rò rỉ thông tin kết nối Database hoặc JWT Secret. | Thiết lập file `.gitignore` nghiêm ngặt, sử dụng `.env.example` và quản lý secret qua GitHub Actions Secrets và biến môi trường của nền tảng Cloud. |
| **Cold-start / Gián đoạn dịch vụ Cloud miễn phí** | Trung bình | API phản hồi chậm lần đầu khi server khởi động lại. | Thiết lập endpoint `GET /health` và cấu hình health check tự động trong pipeline CI/CD để giám sát độ khả dụng. |
