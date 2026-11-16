# BỘ SLIDE THUYẾT TRÌNH TỔNG QUÁT & KỊCH BẢN GIAO MIC ĐA NĂNG: BREWLITE (A1 & A2)
## The Universal Master Slide Deck & Dual-Mode Presentation Playbook

> **Mục đích tài liệu:** Bản thiết kế toàn bộ 13 Slide trình chiếu chuẩn Hội đồng SGU kèm kịch bản lời thoại kép:
> * **Chế độ 1 (Giao Mic - 7 Người):** Phân vai chi tiết cho từng bạn nói từ 1.5 – 3 phút, có câu dẫn trao mic mượt mà.
> * **Chế độ 2 (Leader "Cân Team" / Câu Giờ):** Nếu các bạn khác bị run, quên bài hoặc chỉ có 1 người nói được, Leader dùng kịch bản này để nói liền mạch 20–30 phút mà không bị khựng, không ai nhận ra nhóm bị bể bài!

---

# MỤC LỤC 13 SLIDE TRÌNH CHIẾU

* [SLIDE 01: TRANG TIÊU ĐỀ & ĐỘI NGŨ THỰC HIỆN](#slide-01-trang-tiêu-đề--đội-ngũ-thực-hiện)
* [SLIDE 02: BỐI CẢNH THỰC TẾ & BÀI TOÁN TỬ HUYỆT F&B](#slide-02-bối-cảnh-thực-tế--bài-toán-tử-huyệt-fb)
* [SLIDE 03: BƯỚC NHẢY VỌT KIẾN TRÚC: TỪ PROTOTYPE A1 ĐẾN ENTERPRISE A2](#slide-03-bước-nhảy-vọt-kiến-trúc-từ-prototype-a1-đến-enterprise-a2)
* [SLIDE 04: KIẾN TRÚC HỆ THỐNG PHÂN TẦNG & MÔ HÌNH HÓA UML](#slide-04-kiến-trúc-hệ-thống-phân-tầng--mô-hình-hóa-uml)
* [SLIDE 05: DATA MODELING AN TOÀN: CUID CHỐNG IDOR & DECIMAL NGÂN HÀNG](#slide-05-data-modeling-an-toàn-cuid-chống-idor--decimal-ngân-hàng)
* [SLIDE 06: TRÁI TIM HỆ THỐNG: CONCURRENCY CONTROL & ATOMIC SQL CAS](#slide-06-trái-tim-hệ-thống-concurrency-control--atomic-sql-cas)
* [SLIDE 07: BỘ TỨ THẨM TRA NGHIỆM THU (AUDIT TESTS A, B, C, D)](#slide-07-bộ-tứ-thẩm-tra-nghiệm-thu-audit-tests-a-b-c-d)
* [SLIDE 08: CỔNG THANH TOÁN MOCK GATEWAY & IDEMPOTENCY CHỐNG TRỪ TIỀN 2 LẦN](#slide-08-cổng-thanh-toán-mock-gateway--idempotency-chống-trừ-tiền-2-lần)
* [SLIDE 09: FRONTEND WEB PWA: CARTCONTEXT & SERVER-AUTHORITATIVE PRICING](#slide-09-frontend-web-pwa-cartcontext--server-authoritative-pricing)
* [SLIDE 10: CHECKOUT AN TOÀN & TRÌNH DUYỆT THẬT PLAYWRIGHT E2E](#slide-10-checkout-an-toàn--trình-duyệt-thật-playwright-e2e)
* [SLIDE 11: ĐẢM BẢO CHẤT LƯỢNG (QA), MA TRẬN TRUY VẾT & 269 TESTS](#slide-11-đảm-bảo-chất-lượng-qa-ma-trận-truy-vết--269-tests)
* [SLIDE 12: HẠ TẦNG CLOUD PRODUCTION & ZERO-DOWNTIME KEEP-ALIVE](#slide-12-hạ-tầng-cloud-production--zero-downtime-keep-alive)
* [SLIDE 13: BIỂU DIỄN KIỂM THỬ CHỦ ĐỘNG & BẮT ĐẦU VẤN ĐÁP Q&A](#slide-13-biểu-diễn-kiểm-thử-chủ-động--bắt-đầu-vấn-đáp-qa)

---

### SLIDE 01: TRANG TIÊU ĐỀ & ĐỘI NGŨ THỰC HIỆN
* **Nội dung trên Slide:**
  * Tên đề tài: **BrewLite – Hệ Thống Bán Lẻ & Thanh Toán Cà Phê Trực Tuyến**
  * Chuyển hóa Kỹ nghệ Phần mềm: *Từ Assignment 1 (Prototype) đến Assignment 2 (Production-Ready)*
  * Danh sách 7 Thành viên kèm Role chuẩn A–G:
    * Thành viên A: Tech Lead & DevOps
    * Thành viên B: Auth & Security
    * Thành viên C: Orders & Inventory Concurrency
    * Thành viên D: Payments & Mock Gateway
    * Thành viên E: Options & Cart Management UI
    * Thành viên F: Auth UI & Checkout Flow
    * Thành viên G: Orders UI, KDS Stepper & QA

---

### SLIDE 02: BỐI CẢNH THỰC TẾ & BÀI TOÁN TỬ HUYỆT F&B
* **Nội dung trên Slide:**
  * Nỗi đau giờ cao điểm F&B: Xếp hàng 10–15 phút, 30% khách rời đi vì chờ lâu.
  * 3 Rủi ro Kỹ thuật cốt lõi:
    1. **Gian lận giá:** Khách hàng can thiệp sửa giá rẻ trên Web Client.
    2. **Âm kho do tranh chấp (Race Condition):** 50 người cùng tranh mua 2 ly nước cuối cùng.
    3. **Lệch số liệu tồn kho & BOM:** Không đồng bộ giữa ly nước bán ra và nguyên vật liệu pha chế.
* **🎤 LỜI THOẠI GIAO MIC (Thành viên A - Leader | 2 phút):**
  > *"Kính thưa Thầy Cô trong Hội đồng phản biện, bài toán F&B giờ cao điểm không đơn thuần là dựng một website bán hàng. Thách thức kỹ thuật lớn nhất là: Làm sao phục vụ hàng trăm giao dịch đồng thời mà không bao giờ để âm kho, không bị gian lận giá và đảm bảo tính toàn vẹn tài chính ACID. Đó chính là lý do dự án BrewLite ra đời."*
* **🛡️ KỊCH BẢN LEADER CÂU GIỜ (Nói sâu thêm 1 phút):**
  > *"Tại Việt Nam, các chuỗi như The Coffee House hay Highlands từng đối mặt với tổn thất hàng tỷ đồng vì hệ thống POS bị treo lúc khuyến mãi. Vì vậy, nhóm chúng em tiếp cận đề tài này dưới góc độ Kỹ nghệ Phần mềm khắt khe: Không làm tính năng tràn lan, mà tập trung làm chủ hoàn toàn độ tin cậy của lõi giao dịch (Core POS Hardening)."*
* **👉 CÂU GIAO MIC:** *"Sau đây, xin mời bạn [Tên Thành viên A/Leader] phân tích bước chuyển mình kiến trúc từ A1 sang A2."*

---

### SLIDE 03: BƯỚC NHẢY VỌT KIẾN TRÚC: TỪ PROTOTYPE A1 ĐẾN ENTERPRISE A2
* **Nội dung trên Slide:** Bảng đối chiếu 5 trụ cột tiến hóa:
  * *Repo Structure:* Polyrepo $\implies$ **Turborepo Monorepo** (Chia sẻ Type an toàn 100%).
  * *Entity ID:* `Int` autoincrement $\implies$ **CUID** (Triệt tiêu lỗ hổng IDOR).
  * *Currency:* `Int` VND $\implies$ **Decimal NUMERIC(12,2)** (Chuẩn ngân hàng, loại bỏ trôi dấu chấm động IEEE 754).
  * *Concurrency:* Optimistic Lock (Retry loop 3 lần) $\implies$ **Atomic SQL CAS** (Zero-retry, không nghẽn Event Loop).
  * *Frontend:* Zustand $\implies$ **Next.js 15 Pure Context API + React Server Components (RSC)**.
* **🎤 LỜI THOẠI GIAO MIC (Thành viên A | 2 phút):**
  > *"Ở Assignment 1, nhóm dừng lại ở mức mô phỏng học thuật: Polyrepo rời rạc, dùng ID tự tăng và vòng lặp thử lại 3 lần. Bước sang Assignment 2, nhóm tái cấu trúc toàn diện thành Enterprise Monorepo, chuyển sang mã hóa CUID chống đoán ID và dùng Atomic CAS trừ kho trực tiếp ở đĩa cứng, giúp hệ thống chịu tải tăng gấp 10 lần."*
* **🛡️ KỊCH BẢN LEADER CÂU GIỜ:**
  > *"Sự khác biệt lớn nhất giữa một lập trình viên học việc và một kỹ sư phần mềm chính là việc hiểu rõ tác hại của Technical Debt. Vòng lặp retry ở A1 ngốn cạn DB Connection Pool khi tải cao, trong khi Atomic CAS ở A2 giải quyết xung đột trong 1 chu kỳ máy tính của PostgreSQL."*
* **👉 CÂU GIAO MIC:** *"Để bảo vệ người dùng và phân quyền, xin mời bạn [Tên Thành viên B] trình bày về Bảo mật & Xác thực."*

---

### SLIDE 04: KIẾN TRÚC HỆ THỐNG PHÂN TẦNG & MÔ HÌNH HÓA UML
* **Nội dung trên Slide:**
  * Sơ đồ phân tầng: Client Layer (PWA Vercel) $\to$ Ingress Security (ValidationPipe, JWT) $\to$ Business Logic (NestJS) $\to$ Persistence (Prisma, PostgreSQL).
  * 5 Sơ đồ UML chuẩn IEEE: Use Case, Activity (Swimlanes), Sequence (ACID), Class (ERD), State Machine.
* **🎤 LỜI THOẠI GIAO MIC (Thành viên B | 2.5 phút):**
  > *"Phân hệ Xác thực được xây dựng theo triết lý Phòng thủ đa tầng (Defense-in-Depth). Mật khẩu người dùng được băm an toàn qua thuật toán Bcrypt 12 vòng salt. Sau khi đăng nhập, hệ thống cấp phát JWT Bearer Token phi trạng thái (Stateless), giúp giải phóng Database khỏi Session. Các API quản trị được bảo vệ nghiêm ngặt qua RolesGuard RBAC, chỉ cấp quyền cho vai trò BARISTA và ADMIN."*
* **🛡️ KỊCH BẢN LEADER CÂU GIỜ:**
  > *"Đặc biệt, hệ thống áp dụng Global ValidationPipe cấu hình `whitelist: true` và `forbidNonWhitelisted: true`. Bất kỳ request nào chứa trường lạ ngoài DTO đều bị từ chối ngay từ cổng Ingress, không cho phép tiếp cận tầng nghiệp vụ."*
* **👉 CÂU GIAO MIC:** *"Tiếp theo, xin mời bạn [Tên Thành viên C] trình bày về Trái tim của hệ thống: Đặt hàng và Concurrency."*

---

### SLIDE 05: DATA MODELING AN TOÀN: CUID CHỐNG IDOR & DECIMAL NGÂN HÀNG
* **Nội dung trên Slide:**
  * Đoạn code so sánh Prisma Schema:
    * A1: `id Int @default(autoincrement())` & `basePrice Int`.
    * A2: `id String @default(cuid())` & `basePrice Decimal`.
  * Minh họa lỗ hổng IDOR: Đoán link `order/101` $\to$ bị chặn hoàn toàn khi đổi sang `order/cm3u4k...`.
  * Minh họa sai số IEEE 754: $0.1 + 0.2 = 0.30000000000000004$ bị triệt tiêu bởi `Decimal(12,2)`.
* **🎤 LỜI THOẠI GIAO MIC (Thành viên C | 2 phút):**
  > *"Tại tầng dữ liệu, nhóm quyết định thay thế toàn bộ khóa chính số nguyên tự tăng bằng CUID để triệt tiêu hoàn toàn lỗ hổng IDOR. Đồng thời, toàn bộ trường tiền tệ được chuẩn hóa thành Decimal kiểu NUMERIC(12,2) trong PostgreSQL, đảm bảo tính toán chiết khấu và thuế chính xác tuyệt đối đến từng đồng lẻ."*
* **🛡️ KỊCH BẢN LEADER CÂU GIỜ:**
  > *"Trong kiểm toán tài chính doanh nghiệp, việc trôi dấu chấm động là lỗi không thể chấp nhận. Việc dùng Decimal đảm bảo mọi con số xuất báo cáo tài chính khớp từng đồng với dữ liệu ghi nhận tại cổng thanh toán."*
* **👉 CÂU GIAO MIC:** *"Bây giờ, chúng ta sẽ đi vào phần phức tạp nhất của đề tài: Cơ chế Trừ kho nguyên tử chống Race Condition."*

---

### SLIDE 06: TRÁI TIM HỆ THỐNG: CONCURRENCY CONTROL & ATOMIC SQL CAS
* **Nội dung trên Slide:**
  * Sơ đồ Sequence Transaction trừ kho có điều kiện:
    ```sql
    UPDATE "Product" SET "stockQuantity" = "stockQuantity" - 2 
    WHERE "id" = 'prod_123' AND "stockQuantity" >= 2 AND "isAvailable" = true;
    ```
  * So sánh cơ chế Row-Level Exclusive Lock của Postgres vs Vòng lặp Retry của Node.js.
  * Bản đồ chống Deadlock: Sắp xếp tài nguyên đồng nhất qua `demandMap`.
* **🎤 LỜI THOẠI GIAO MIC (Thành viên C | 3 phút):**
  > *"Khi 2 khách hàng cùng tranh chấp 2 ly nước cuối cùng, Transaction nào chạm tới trước sẽ chiếm Row-Level Exclusive Lock. Transaction 1 kiểm tra 2 >= 2 thành công, trừ kho về 0. Transaction 2 chờ lock nhả ra thì thấy kho còn 0, điều kiện 0 >= 2 sai, số dòng cập nhật count = 0. Hệ thống lập tức Rollback và trả về 400 OUT_OF_STOCK, đảm bảo kho không bao giờ âm!"*
* **🛡️ KỊCH BẢN LEADER CÂU GIỜ:**
  > *"Đồng thời, để tránh nguy cơ Deadlock khi giỏ hàng có nhiều món khác nhau, nhóm đã nhóm số lượng theo demandMap và sắp xếp duyệt trừ kho theo thứ tự ID ổn định, triệt tiêu hoàn toàn chu trình chờ khóa (No Circular Wait)."*
* **👉 CÂU GIAO MIC:** *"Đây cũng chính là nền tảng để giải quyết trọn vẹn Bộ Tứ Thẩm Tra Nghiệm Thu của Thầy Cô."*

---

### SLIDE 07: BỘ TỨ THẨM TRA NGHIỆM THU (AUDIT TESTS A, B, C, D)
* **Nội dung trên Slide:** 4 Khối hộp giải pháp cho 4 yêu cầu gắt gao của Giảng viên:
  * **Test A (Chống sửa giá):** ValidationPipe chặn trường `price` lạ + Server tự tra cứu Database tính đơn giá.
  * **Test B (Hủy đơn đã thanh toán):** Transaction hoàn kho + Đổi Payment sang `REFUND_PENDING`.
  * **Test C (Tranh chấp 2 ly cuối):** Atomic CAS bảo vệ tồn kho dừng đúng số 0.
  * **Test D (Định lượng BOM):** Khả năng phục vụ = $\min(\text{Kho}_i / \text{Định mức}_i)$, trừ cốt trà, sữa, trân châu đồng thời.
* **🎤 LỜI THOẠI GIAO MIC (Thành viên C hoặc D | 3 phút):**
  > *"Kính thưa Thầy Cô, 4 kịch bản này là linh hồn của hệ thống: Ở Test A, dù khách có sửa giá 1.000đ trên Web thì Server vẫn lấy giá niêm yết trong Database để nhân tiền. Ở Test B, khách hủy đơn đã trả tiền thì kho tự động cộng trả lại và kích hoạt luồng hoàn tiền. Ở Test C và D, mọi giao dịch đều tuân thủ nguyên tắc ACID tuyệt đối."*
* **🛡️ KỊCH BẢN LEADER CÂU GIỜ:**
  > *"Toàn bộ 4 kịch bản này không chỉ nằm trên giấy, mà đã được viết thành các bài test tự động Supertest pass 100%, sẵn sàng biểu diễn trước mắt Thầy Cô bất cứ lúc nào."*
* **👉 CÂU GIAO MIC:** *"Tiếp theo, xin mời bạn [Tên Thành viên D] trình bày về Cổng thanh toán và Cơ chế chống trừ tiền 2 lần."*

---

### SLIDE 08: CỔNG THANH TOÁN MOCK GATEWAY & IDEMPOTENCY CHỐNG TRỪ TIỀN 2 LẦN
* **Nội dung trên Slide:**
  * Cơ chế Idempotency RFC 7231 với khóa UUIDv4.
  * Kiểm tra khớp Payload `isPayloadMatch` chống tráo đổi món cùng key.
  * Giả lập thanh toán Mock Gateway: Thẻ kết thúc `0000` $\to$ Báo lỗi số dư; Thẻ hợp lệ $\to$ Sinh mã `MOCK-TIMESTAMP`.
* **🎤 LỜI THOẠI GIAO MIC (Thành viên D | 2.5 phút):**
  > *"Để chống tình trạng mạng lag khiến người dùng bấm nút thanh toán nhiều lần gây trừ tiền 2 lần, mỗi phiên đặt hàng Web sinh một mã Idempotency-Key UUIDv4. Tại orders.service.ts, nếu key đã tồn tại và khớp payload, hệ thống trả về ngay đơn hàng cũ mà không trừ kho hay trừ tiền lần hai. Nếu dùng lại key cũ nhưng sửa món, hệ thống ném lỗi 409 Conflict chống gian lận."*
* **🛡️ KỊCH BẢN LEADER CÂU GIỜ:**
  > *"Khóa Idempotency-Key còn được đặt ràng buộc @unique ở tầng Database, tạo nên lớp bảo vệ phần cứng vững chắc ngăn chặn hoàn toàn các request trùng lọt lưới."*
* **👉 CÂU GIAO MIC:** *"Về phía người dùng, giao diện Web được thiết kế an toàn như thế nào? Xin mời bạn [Tên Thành viên E]."*

---

### SLIDE 09: FRONTEND WEB PWA: CARTCONTEXT & SERVER-AUTHORITATIVE PRICING
* **Nội dung trên Slide:**
  * Kiến trúc `CartContext.tsx` trên Next.js 15 App Router & React Server Components.
  * Thuật toán `sanitizeToppings`: Khử trùng lặp và sắp xếp Topping để so sánh gộp món chuẩn xác.
  * Hàm `getOrderItemsPayload()`: **Chỉ gửi `productId, quantity, size, toppings` — Tuyệt đối 0% gửi giá.**
* **🎤 LỜI THOẠI GIAO MIC (Thành viên E | 2.5 phút):**
  > *"Ở Frontend, nhóm chuyển từ Zustand sang Pure React Context API để tối ưu hoàn hảo cho Next.js 15 và tránh lỗi Hydration Mismatch. Giỏ hàng hỗ trợ tùy biến Size Large cộng 10k, Toppings cộng 5k đến 10k. Điểm quan trọng nhất là hàm bàn giao payload cho API tuyệt đối không gửi giá từ Client, bảo vệ hệ thống ngay từ tầng gốc."*
* **🛡️ KỊCH BẢN LEADER CÂU GIỜ:**
  > *"Giỏ hàng còn có khả năng tự phục hồi khi F5 trang nhờ đồng bộ LocalStorage an toàn, và tự động đối soát với Catalog để cảnh báo nếu có món vừa hết hàng trong lúc khách đang chọn món."*
* **👉 CÂU GIAO MIC:** *"Để xem luồng đặt hàng trực quan trên trình duyệt thật, xin mời bạn [Tên Thành viên F] trình bày về Checkout & Playwright."*

---

### SLIDE 10: CHECKOUT AN TOÀN & TRÌNH DUYỆT THẬT PLAYWRIGHT E2E
* **Nội dung trên Slide:**
  * Cơ chế khóa nút Submit chống Double-Click tức thì.
  * Màn hình Thanh toán quét mã VietQR tự động cập nhật trạng thái.
  * Kiểm thử toàn trình E2E bằng Playwright: Mô phỏng người dùng thật click chuột từ A đến Z.
* **🎤 LỜI THOẠI GIAO MIC (Thành viên F | 2.5 phút):**
  > *"Tại màn hình Checkout, nút Đặt hàng lập tức bị khóa và chuyển sang trạng thái Loading khi người dùng bấm vào, ngăn chặn triệt để hành vi double-click. Toàn bộ luồng từ duyệt món đến thanh toán thành công đã được tự động hóa bằng bộ test Playwright E2E chạy trên trình duyệt Chromium thật."*
* **🛡️ KỊCH BẢN LEADER CÂU GIỜ:**
  > *"Nhóm đã cấu hình Playwright với chế độ UI tương tác, cho phép theo dõi từng mili-giây hành vi người dùng, bắt trọn các sự kiện mạng và chứng minh độ tin cậy tuyệt đối của giao diện Web."*
* **👉 CÂU GIAO MIC:** *"Về công tác Đảm bảo chất lượng và KDS Barista, xin mời bạn [Tên Thành viên G] trình bày."*

---

### SLIDE 11: ĐẢM BẢO CHẤT LƯỢNG (QA), MA TRẬN TRUY VẾT & 269 TESTS
* **Nội dung trên Slide:**
  * KDS Barista: Màn hình điều phối chế biến, thanh Stepper 4 bước thời gian thực (`PAID ➔ PREPARING ➔ READY ➔ COMPLETED`).
  * Ma trận truy vết hai chiều (Traceability Matrix RTM): 100% Yêu cầu SRS $\to$ Mã nguồn $\to$ Test Case.
  * Tổng kết 269 bài test tự động: 157 API Tests + 112 Web Tests + 1 E2E Suite $\implies$ **100% PASS**.
* **🎤 LỜI THOẠI GIAO MIC (Thành viên G | 2 phút):**
  > *"Phân hệ KDS giúp Barista cập nhật tiến độ chế biến và khách hàng theo dõi đơn hàng thời gian thực qua Stepper 4 bước. Về mặt QA, nhóm đã hoàn thiện Ma trận truy vết hai chiều liên kết toàn bộ 10 FRs và 5 NFRs sang mã nguồn và 269 bài test tự động, bảo vệ hệ thống toàn diện trước mọi nguy cơ hồi quy (Regression)."*
* **🛡️ KỊCH BẢN LEADER CÂU GIỜ:**
  > *"Tính truy vết hai chiều đảm bảo mỗi dòng code sinh ra đều phục vụ một yêu cầu nghiệp vụ cụ thể, không có code thừa và không có tính năng nào bị bỏ sót kiểm thử."*
* **👉 CÂU GIAO MIC:** *"Hệ thống này được triển khai trên môi trường Cloud như thế nào? Xin mời Leader tổng kết."*

---

### SLIDE 12: HẠ TẦNG CLOUD PRODUCTION & ANTI-COLD-START
* **Nội dung trên Slide:**
  * Sơ đồ Hạ tầng Đám mây: Vercel Edge (Frontend) + Render Cloud (Backend Docker) + PostgreSQL Managed DB.
  * Pipeline CI/CD 4 bước tự động trên GitHub Actions (Lint, Type-check, Unit Test, Build).
  * Giải pháp Anti-Cold-Start: Uptime Cron Job ping `/health` mỗi 10 phút, loại bỏ độ trễ khởi động nguội.
* **🎤 LỜI THOẠI TỔNG KẾT (Leader | 2 phút):**
  > *"Hệ thống BrewLite hiện đang chạy thật 100% trên Cloud với tên miền HTTPS công khai. Để khắc phục hiện tượng Sleep Mode của Cloud miễn phí, nhóm đã lập trình một Cron Job tự động ping endpoint `/health` mỗi 10 phút, giữ cho máy chủ luôn ở trạng thái 'nóng' sẵn sàng phục vụ."*

---

### SLIDE 13: BIỂU DIỄN KIỂM THỬ CHỦ ĐỘNG & BẮT ĐẦU VẤN ĐÁP Q&A
* **Nội dung trên Slide:**
  * Bảng điều khiển kiểm thử tự động `test-suite.bat`.
  * Trực quan hóa Cơ sở dữ liệu Prisma Studio (`localhost:5555`).
  * Tuyên bố chuyển sang phần Thẩm định & Hỏi đáp (Q&A).
* **🎤 LỜI THOẠI "CHỦ ĐỘNG TẤN CÔNG" CỦA LEADER (2 phút):**
  > *"Kính thưa Thầy Cô, thay vì chỉ nói lý thuyết, bây giờ nhóm em xin phép **CHỦ ĐỘNG BẬT BỘ KIỂM THỬ TỰ ĐỘNG** để Thầy Cô cùng chứng kiến:
  > (Leader mở file `test-suite.bat`, bấm phím 1 chạy 269 tests pass xanh lá cây trong 20s).
  > Toàn bộ 269 tests kiểm tra bảo mật, giao dịch tài chính và trừ kho đều vượt qua 100%. Nhóm chúng em xin chân thành cảm ơn Thầy Cô và sẵn sàng bước vào phần Vấn đáp ạ!"*

---

# CẨM NANG "CỨU NGUY" KHI THÀNH VIÊN BỊ RUN HOẶC QUÊN BÀI:

Khi bạn phụ trách một Slide bị ngập ngừng quá 3 giây, **Leader lập tức đưa tay ra hiệu và nói câu thần chú:**
> *"Dạ xin phép Thầy Cô cho em xin bổ sung nhanh một chi tiết kỹ thuật cốt lõi ở phần này mà bạn [Tên] vừa nhắc đến..."*  
*(Sau đó Leader đọc ngay **KỊCH BẢN CÂU GIỜ** đã viết sẵn ở Slide đó. Cả Hội đồng sẽ thấy nhóm cực kỳ đoàn kết, chuyên nghiệp và không hề có một giây chết nào trên sân khấu!)*
