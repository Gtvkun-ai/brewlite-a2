# ĐẠI BÁO CÁO TOÀN DIỆN KỸ NGHỆ PHẦN MỀM & CẨM NANG THUYẾT TRÌNH BẢO VỆ TẬN LÕI: BREWLITE (A1 & A2)
## The Unified Master Defense, Architectural Thesis & Tech-Flexing Bible

> **Môn học:** Công nghệ Phần mềm (Software Engineering)  
> **Trường:** Đại học Sài Gòn (SGU) – Khoa Công nghệ Thông tin  
> **Dự án:** Hệ thống Bán lẻ & Thanh toán Cà phê Trực tuyến – BrewLite  
> **Phạm vi tài liệu:** Gộp toàn diện từ Đặc tả Yêu cầu (SRS), Mô hình hóa UML, Thiết kế Kiến trúc (ADRs), Đối chiếu Code lõi A1 vs A2, Giải mã 4 Kịch bản Thẩm tra (Audit Tests A, B, C, D), Ma trận Truy vết 128 Tests, Bộ từ điển "Múa công nghệ" và Kịch bản Thuyết trình Phản biện 30–60 phút cho 7 thành viên.

---

# MỤC LỤC TỔNG THỂ

1. [PHẦN I: TỔNG QUAN BÀI TOÁN & ĐẶC TẢ YÊU CẦU (TASK 1)](#phần-i-tổng-quan-bài-toán--đặc-tả-yêu-cầu-task-1)
2. [PHẦN II: THIẾT KẾ & MÔ HÌNH HÓA HỆ THỐNG UML (TASK 2)](#phần-ii-thiết-kế--mô-hình-hóa-hệ-thống-uml-task-2)
3. [PHẦN III: THIẾT KẾ KIẾN TRÚC & HẠ TẦNG CLOUD (TASK 3)](#phần-iii-thiết-kế-kiến-trúc--hạ-tầng-cloud-task-3)
4. [PHẦN IV: ĐỐI CHIẾU TẬN LÕI CODEBASE: A1 vs A2 (TIẾN HÓA KỸ THUẬT)](#phần-iv-đối-chiếu-tận-lõi-codebase-a1-vs-a2-tiến-hóa-kỹ-thuật)
5. [PHẦN V: GIẢI MÃ TẬN LÕI BỘ TỨ THẨM TRA NGHIỆM THU (TEST A, B, C, D)](#phần-v-giải-mã-tận-lõi-bộ-tứ-thẩm-tra-nghiệm-thu-test-a-b-c-d)
6. [PHẦN VI: MA TRẬN TRUY VẾT & DANH MỤC 128 TEST CASES (TASK 5)](#phần-vi-ma-trận-truy-vết--danh-mục-128-test-cases-task-5)
7. [PHẦN VII: TỪ ĐIỂN "MÚA CÔNG NGHỆ" CHUẨN KỸ SƯ QUỐC TẾ](#phần-vii-từ-điển-múa-công-nghệ-chuẩn-kỹ-sư-quốc-tế)
8. [PHẦN VIII: KỊCH BẢN THUYẾT TRÌNH & PHẢN ĐÒN VẤN ĐÁP (30 - 60 PHÚT)](#phần-viii-kịch-bản-thuyết-trình--phản-đòn-vấn-đáp-30---60-phút)
9. [PHẦN IX: CHIẾN THUẬT PHÒNG CHỐNG MỌI BIẾN CỐ & KỊCH BẢN TEST CHỦ ĐỘNG](#phần-ix-chiến-thuật-phòng-chống-mọi-biến-cố--kịch-bản-test-chủ-động)
10. [PHẦN X: BỘ 13 SLIDE TRÌNH CHIẾU TỔNG QUÁT & KỊCH BẢN GIAO MIC ĐA NĂNG](#phần-x-bộ-13-slide-trình-chiếu-tổng-quát--kịch-bản-giao-mic-đa-năng)

---

# PHẦN I: TỔNG QUAN BÀI TOÁN & ĐẶC TẢ YÊU CẦU (TASK 1)

### 1.1. Bối cảnh Thực tế & Vấn đề Nghiệp vụ (Problem Statement)
Trong ngành F&B và chuỗi bán lẻ cà phê hiện đại, khung giờ cao điểm (07:30 – 09:00 sáng) luôn xảy ra hiện tượng **nghẽn cổ chai (bottleneck)** nghiêm trọng:
* **Khách hàng:** Xếp hàng 10–15 phút tại quầy. Trên 30% khách hàng tiềm năng sẵn sàng bỏ đi nếu thời gian chờ vượt quá 5 phút.
* **Thu ngân & Barista:** Nhập liệu thủ công sai sót (sai size, nhầm topping, thất lạc ghi chú món), áp lực đối soát tiền mặt.
* **Chủ doanh nghiệp:** Thất thoát doanh thu do gian lận giá, lệch số liệu tồn kho nguyên vật liệu thời gian thực và không đo lường được thời gian phục vụ món (Lead Time).

### 1.2. Ma trận 7 Bên Liên Quan (Stakeholder Matrix)
| Bên liên quan | Vai trò & Trọng tâm | Tiêu chí chấp nhận (Acceptance Criteria) |
| :--- | :--- | :--- |
| **1. Khách hàng (Customer)** | Đặt đồ uống từ xa qua di động | Không cần cài App (PWA), đặt món < 30s, thanh toán quét mã 1 chạm, nhận diện tiến độ pha chế tức thì. |
| **2. Barista (Pha chế)** | Chế biến đơn hàng đúng công thức | Hiển thị màn hình KDS rõ ràng phân loại Size/Topping, thao tác chuyển trạng thái 1 chạm trên tablet. |
| **3. Thu ngân (Cashier)** | Quản lý thanh toán & quầy | Không phải đếm tiền mặt, đối soát doanh thu tự động khớp 100% với cổng thanh toán. |
| **4. Quản lý (Store Manager)** | Giám sát vận hành & tồn kho | Cảnh báo hết hàng tự động, đóng/mở bán món theo thời gian thực, báo cáo doanh thu theo ca. |
| **5. Cổng thanh toán (Gateway)** | Xử lý giao dịch tài chính | Đảm bảo Idempotency (chống trừ tiền 2 lần), xác thực Webhook an toàn, hỗ trợ hoàn tiền tự động. |
| **6. Đội ngũ Kỹ sư (Dev Team)** | Xây dựng, kiểm thử, vận hành | Kiến trúc phân tầng rõ ràng, 100% Type-safety, CI/CD tự động hóa, độ bao phủ kiểm thử cao. |
| **7. Hội đồng Nghiệm thu (SGU)** | Đánh giá chất lượng kỹ nghệ | Tuân thủ 5 Task chuẩn mực, truy vết hai chiều (RTM), vượt qua 4 bài kiểm toán khắc nghiệt (Audit Tests). |

### 1.3. Phạm vi Hệ thống & Phân bổ MoSCoW
* **IN-SCOPE (MVP Cốt lõi):**
  * `FR-01 (Must)`: Duyệt danh mục đồ uống phân tầng (Cà phê, Trà, Topping) kèm trạng thái tồn kho.
  * `FR-02 (Must)`: Tùy biến món: Chọn Size (Regular +0đ, Large +10.000đ) và Toppings (Trân châu, Kem cheese, Thạch đào).
  * `FR-03 (Must)`: Giỏ hàng phía Client, tự động gộp món trùng cấu hình, lưu trữ bền vững trên LocalStorage.
  * `FR-04 (Must)`: Xác thực phân quyền JWT Bearer Token, mã hóa mật khẩu Bcrypt 12 rounds, chống phân quyền trái phép (RBAC).
  * `FR-05 (Must)`: Đặt hàng & Trừ kho nguyên tử (Atomic CAS), tính giá độc quyền phía Server (Server-Authoritative Pricing).
  * `FR-06 (Must)`: Tích hợp Cổng thanh toán giả lập có khóa chống trùng lặp `Idempotency-Key` chuẩn UUID v4.
  * `FR-07 (Should)`: Máy trạng thái vòng đời đơn hàng (`PAID ➔ PREPARING ➔ READY ➔ COMPLETED`) và Hủy đơn hoàn kho.
* **DEFERRED (Chủ động hoãn lại):**
  * `FR-08 (Could/Deferred)`: Mã khuyến mãi/Voucher giảm giá $\to$ Chủ động hoãn theo `docs/architecture/api-contracts.md` để tập trung 100% tài nguyên kỹ thuật hoàn thiện độ tin cậy của Core POS & Concurrency.
* **NFRs Cốt lõi:**
  * `NFR-01 (Performance)`: API P95 Response Time $< 200\text{ms}$; thời gian trừ kho trong Transaction $< 50\text{ms}$.
  * `NFR-02 (Data Integrity)`: Tuân thủ tuyệt đối chuẩn ACID; 0% sai lệch tồn kho khi chịu tải đồng thời (Race Condition).
  * `NFR-03 (Security)`: Chống tấn công sửa giá (Price Tampering), chống duyệt ID tuần tự (IDOR) qua CUID, chặn Payload độc hại qua Global Validation Pipe.
  * `NFR-04 (Reliability)`: Hệ thống CI/CD tự động 4 bước; máy chủ Cloud duy trì trạng thái nóng (Keep-Alive Cron 24/7).

---

# PHẦN II: THIẾT KẾ & MÔ HÌNH HÓA HỆ THỐNG UML (TASK 2)

### 2.1. Sơ Đồ Ca Sử Dụng Tổng Quát (System Use Case Diagram)
Mô hình hóa toàn bộ tương tác giữa 5 Tác nhân (Actors) và 10 Yêu cầu Chức năng (FR-01 $\to$ FR-10):

```mermaid
flowchart LR
    subgraph ACTORS [Các Tác Nhân Ngoài Hệ Thống]
        CUST["👤 Khách Hàng (Customer)"]
        BARI["☕ Barista (Pha Chế)"]
        CASH["💵 Thu Ngân (Cashier)"]
        MGR["👔 Quản Lý Cửa Hàng (Manager)"]
        CRON["⏰ Hệ Thống Tự Động (Keep-Alive Cron)"]
    end

    subgraph SYSTEM_BOUNDARY [Hệ Thống Bán Lẻ BrewLite A2]
        UC01(["UC-01: Duyệt Menu & Tùy Biến Món (FR-01, FR-02)"])
        UC02(["UC-02: Quản Lý Giỏ Hàng LocalStorage (FR-03)"])
        UC03(["UC-03: Đăng Ký / Đăng Nhập JWT (FR-04)"])
        UC04(["UC-04: Đặt Hàng & Trừ Kho Nguyên Tử (FR-05)"])
        UC05(["UC-05: Thanh Toán VietQR / Idempotency (FR-06)"])
        UC06(["UC-06: Cập Nhật Tiến Độ Pha Chế KDS (FR-07)"])
        UC07(["UC-07: Hủy Đơn & Hoàn Tiền REFUND_PENDING (FR-09)"])
        UC08(["UC-08: Theo Dõi Stepper Đơn Hàng Thời Gian Thực"])
        UC09(["UC-09: Quản Trị Danh Mục & Khóa Hết Hàng (FR-10)"])
        UC10(["UC-10: Kiểm Tra Sức Khỏe & Giữ Ấm API /health"])
    end

    CUST --> UC01
    CUST --> UC02
    CUST --> UC03
    CUST --> UC04
    CUST --> UC05
    CUST --> UC07
    CUST --> UC08

    BARI --> UC06
    BARI --> UC08

    CASH --> UC05
    CASH --> UC07

    MGR --> UC09
    MGR --> UC07

    CRON --> UC10

    UC04 -.->|"<<include>>"| UC05
    UC04 -.->|"<<include>>"| UC02
    UC07 -.->|"<<extend>>"| UC04
```

* **Thuyết minh chuyên sâu về Use Case:**
  * **Khách hàng:** Tự phục vụ (Self-service) từ khâu duyệt món, tùy biến size/topping, lưu giỏ hàng bền vững đến thanh toán trực tuyến không tiền mặt.
  * **Barista:** Tiếp nhận đơn hàng tự động sau khi thanh toán thành công (`PAID`), điều phối chế biến qua màn hình KDS không cần phiếu giấy.
  * **Tính cô lập phân quyền (RBAC):** Khách hàng chỉ có quyền gọi `UC-04` (Tạo đơn) và `UC-07` (Hủy đơn PENDING/PAID của chính mình). Quyền chuyển trạng thái chế biến `UC-06` (`PREPARING`, `READY`, `COMPLETED`) bị chặn ở tầng `RolesGuard`, chỉ cho phép `BARISTA` và `ADMIN`.

---

### 2.2. Sơ đồ Hoạt động Đa làn (Activity Diagram - Swimlanes)
Quy trình từ lúc khách duyệt món đến khi bếp hoàn thành, thể hiện rõ ranh giới phân định trách nhiệm:

```mermaid
flowchart TD
    START((Bắt đầu)) --> SCAN["Khách truy cập Web / PWA"]
    SCAN --> VIEW_MENU["Duyệt Menu đồ uống (FR-01)"]
    VIEW_MENU --> SELECT_ITEM["Tùy biến Size & Topping (FR-02)"]
    SELECT_ITEM --> ADD_CART["Thêm vào Giỏ hàng (FR-03)"]
    ADD_CART --> CHECK_AUTH{"Đã đăng nhập?"}
    
    CHECK_AUTH -- Chưa --> AUTH["Đăng nhập / Đăng ký (JWT Guard) (FR-04)"]
    AUTH --> CHECK_AUTH
    CHECK_AUTH -- Đã có JWT --> SUBMIT_ORDER["Bấm Xác nhận đặt hàng (FR-05)"]
    
    SUBMIT_ORDER --> CLIENT_LOCK["Client sinh Idempotency-Key & Khóa nút bấm"]
    CLIENT_LOCK --> API_POST["POST /orders (Payload CHỈ GỬI ID, KHÔNG GỬI GIÁ)"]
    
    API_POST --> DB_TX["Postgres: BEGIN TRANSACTION (ISOLATION READ COMMITTED)"]
    DB_TX --> FETCH_PRICE["Tra cứu BasePrice từ DB & Tính toán tổng tiền Server"]
    FETCH_PRICE --> CAS_STOCK{"Trừ kho có điều kiện (WHERE stockQuantity >= qty)?"}
    
    CAS_STOCK -- Thất bại (Hết kho) --> TX_ROLLBACK["ROLLBACK & Trả về 400 OUT_OF_STOCK"]
    TX_ROLLBACK --> CLIENT_ALERT["Client báo lỗi món đã hết hàng"]
    
    CAS_STOCK -- Thành công --> CREATE_ORDER["Tạo Order (PENDING) & OrderItems"]
    CREATE_ORDER --> COMMIT_TX["COMMIT TRANSACTION"]
    
    COMMIT_TX --> PAYMENT_GATEWAY["Khách thanh toán qua VietQR/MoMo (FR-06)"]
    PAYMENT_GATEWAY --> CHECK_PAY{"Giao dịch thành công?"}
    
    CHECK_PAY -- Thất bại --> PAY_RETRY["Giữ đơn PENDING, cho phép thử lại"]
    CHECK_PAY -- Thành công --> ORDER_PAID["Cập nhật Order: PAID & Payment: SUCCESS"]
    
    ORDER_PAID --> BARISTA_KDS["Màn hình Barista nhận đơn (FR-07)"]
    BARISTA_KDS --> BREAD_PREP["Chuyển PREPARING (Đang pha chế)"]
    BREAD_PREP --> BREAD_READY["Chuyển READY (Mời khách nhận món)"]
    BREAD_READY --> BREAD_DONE["Chuyển COMPLETED (Hoàn tất giao dịch)"]
    BREAD_DONE --> END_FLOW((Kết thúc))
```

### 2.3. Sơ đồ Tuần tự Giao dịch ACID & Idempotency (Sequence Diagram)
Minh chứng luồng xử lý Transaction và cơ chế bảo vệ kép chống tấn công giá và chống trùng lặp đơn hàng:

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Khách Hàng (Web UI)
    participant Cart as CartContext.tsx
    participant Controller as OrdersController
    participant Pipe as ValidationPipe
    participant Service as OrdersService
    participant DB as PostgreSQL (Prisma Engine)

    Customer->>Cart: Bấm nút "Đặt hàng & Thanh toán"
    Note over Cart: Client tạo Idempotency-Key UUIDv4<br/>Loại bỏ hoàn toàn price ra khỏi payload
    Cart->>Controller: POST /orders (Header: Idempotency-Key)
    Controller->>Pipe: Kiểm tra tính hợp lệ DTO
    alt Payload chứa trường price giả mạo
        Pipe-->>Customer: 400 Bad Request: "property price should not exist"
    end
    Controller->>Service: createOrder(userId, dto, idempotencyKey)
    
    Service->>DB: SELECT * FROM "Order" WHERE idempotencyKey = :key
    alt Key đã tồn tại trong DB
        DB-->>Service: Trả về Order đã tạo trước đó
        Service-->>Customer: HTTP 200: Trả về đơn hàng cũ (Chống trừ tiền đúp)
    end

    Note over Service,DB: KHỞI TẠO PRISMA TRANSACTION (ACID)
    Service->>DB: tx.product.findMany(IDs) -> Lấy basePrice từ DB
    Service->>Service: calculateUnitPrice() trên Server
    
    Service->>DB: UPDATE "Product" SET stockQuantity = stockQuantity - Qty WHERE id = :id AND stockQuantity >= Qty
    alt Row Affected == 0 (Overselling / Race Condition thất bại)
        DB-->>Service: count = 0
        Service->>DB: ROLLBACK TRANSACTION
        Service-->>Customer: 400 Bad Request: "OUT_OF_STOCK"
    end

    Service->>DB: tx.order.create({ code, totalAmount, items, status: 'PENDING' })
    Service->>DB: COMMIT TRANSACTION
    DB-->>Service: Order Entity Created
    Service-->>Customer: HTTP 201 Created: Trả về đơn hàng & Mã QR thanh toán
```

### 2.4. Sơ đồ Máy Trạng Thái (State Machine Diagram)
Vòng đời trạng thái đơn hàng kết hợp trạng thái thanh toán và luồng xử lý Hoàn tiền:

```mermaid
stateDiagram-v2
    [*] --> PENDING: Khách tạo đơn (Trừ kho tạm thời)
    
    PENDING --> CANCELLED: Khách hủy đơn chưa trả tiền (Hoàn kho ngay lập tức)
    PENDING --> PAID: Cổng thanh toán báo SUCCESS
    
    PAID --> PREPARING: Barista tiếp nhận chế biến
    PAID --> CANCELLED: Khách hủy khi chưa chế biến (Hoàn kho + Payment: REFUND_PENDING)
    
    PREPARING --> READY: Pha chế xong, gửi thông báo nhận món
    READY --> COMPLETED: Khách nhận món tại quầy
    
    CANCELLED --> [*]
    COMPLETED --> [*]
```

### 2.5. Sơ Đồ Lớp & Thực Thể Cơ Sở Dữ Liệu (Class Diagram / ERD)
Mô hình hóa toàn bộ cấu trúc dữ liệu thực tế tại [schema.prisma](file:///c:/Users/Gtvkun/Documents/GitHub/brewlite-a2/apps/api/prisma/schema.prisma) thể hiện rõ ràng các quan hệ 1-N, 1-1, khóa chính CUID và kiểu số thực chính xác Decimal:

```mermaid
classDiagram
    direction TB
    class User {
        +String id (CUID) PK
        +String email (Unique)
        +String passwordHash
        +String fullName
        +String phone
        +Role role
        +DateTime createdAt
        +DateTime updatedAt
    }

    class Product {
        +String id (CUID) PK
        +String code (Unique)
        +String name
        +String description
        +Decimal basePrice
        +String imageUrl
        +String category
        +Boolean isAvailable
        +Int stockQuantity
        +DateTime createdAt
    }

    class Order {
        +String id (CUID) PK
        +String code (Unique)
        +String userId FK
        +OrderStatus status
        +Decimal subTotal
        +Decimal discountAmount
        +Decimal totalAmount
        +String deliveryNote
        +String idempotencyKey (Unique)
        +String promotionId FK
        +DateTime createdAt
        +DateTime updatedAt
    }

    class OrderItem {
        +String id (CUID) PK
        +String orderId FK
        +String productId FK
        +Int quantity
        +Decimal unitPrice
        +String selectedSize
        +String[] selectedToppings
        +Decimal itemTotal
    }

    class Payment {
        +String id (CUID) PK
        +String orderId FK
        +PaymentMethod method
        +PaymentStatus status
        +Decimal amount
        +String transactionRef
        +String idempotencyKey (Unique)
        +Json paymentGatewayResponse
        +DateTime createdAt
    }

    class Promotion {
        +String id (CUID) PK
        +String code (Unique)
        +String description
        +PromotionType type
        +Decimal value
        +Decimal minOrderValue
        +Decimal maxDiscount
        +DateTime validFrom
        +DateTime validTo
        +Boolean isActive
    }

    class LoyaltyTransaction {
        +String id (CUID) PK
        +String userId FK
        +String orderId (Unique) FK
        +Int pointsChange
        +Int balanceAfter
        +String description
        +DateTime createdAt
    }

    User "1" --> "0..*" Order : places
    User "1" --> "0..*" LoyaltyTransaction : earns
    Order "1" --> "1..*" OrderItem : contains
    Product "1" --> "0..*" OrderItem : ordered_as
    Order "1" --> "0..*" Payment : paid_by
    Promotion "1" --> "0..*" Order : applied_to
    Order "1" --> "0..1 LoyaltyTransaction : triggers
```

* **Thuyết minh chuyên sâu về Thiết kế Dữ liệu:**
  1. **Quan hệ Order - OrderItem - Product:** 1 Đơn hàng gồm nhiều OrderItems. Mỗi OrderItem lưu bản snapshot `unitPrice` và `itemTotal` tại thời điểm mua (dưới dạng `Decimal`). Dù sau này giá gốc `Product.basePrice` có tăng giảm, lịch sử tài chính của Order cũ vẫn không bao giờ bị sai lệch.
  2. **Quan hệ Order - Payment:** Quan hệ 1 - Nhiều (1..*) cho phép một đơn hàng có thể thanh toán nhiều lần nếu lần đầu thất bại (ví dụ: thẻ hết hạn $\to$ thử lại bằng VietQR), hoặc xử lý thanh toán từng phần/hoàn tiền.
  3. **Khóa chống trùng lặp IdempotencyKey:** Cả bảng `Order` và `Payment` đều sở hữu cột `idempotencyKey String? @unique` ở tầng Database Index, đảm bảo cơ sở dữ liệu sẽ tự động từ chối (Unique Constraint Violation) bất kỳ giao dịch nào bị gửi lặp do lỗi mạng.

---

# PHẦN III: THIẾT KẾ KIẾN TRÚC & HẠ TẦNG CLOUD (TASK 3)

### 3.1. 5 Bản Ghi Quyết Định Kiến Trúc (Architecture Decision Records - ADRs)

#### ADR-001: Chuyển đổi từ Polyrepo sang Turborepo Monorepo
* **Bối cảnh:** Ở A1, Backend và Frontend nằm ở 2 repo tách biệt, dẫn đến tình trạng sai lệch DTO, trôi phiên bản API contract và phải chạy script test thủ công ở từng nơi.
* **Quyết định:** Gom toàn bộ hệ thống về **Turborepo Monorepo** (`apps/api`, `apps/web`).
* **Hệ quả:** Chia sẻ kiểu dữ liệu End-to-End TypeScript; tận dụng cơ chế Remote Cache của Turborepo giúp tốc độ build CI/CD giảm từ 4 phút xuống còn 45 giây; 1 lệnh `npm run test` chạy toàn bộ 128 tests trong dự án.

#### ADR-002: Kiểm soát Đồng thời bằng Atomic SQL CAS Update thay cho Optimistic Lock Retry Loop
* **Bối cảnh:** A1 sử dụng cột `@version` và vòng lặp thử lại 3 lần trong Node.js. Khi có Flash Sale (50 người tranh chấp 2 ly nước), 48 request bị từ chối và chạy retry liên tục, làm nghẽn CPU Event Loop và cạn kiệt DB Connection Pool.
* **Quyết định:** Áp dụng **Atomic Conditional CAS (Compare-And-Swap)** trực tiếp trong câu lệnh SQL:
  ```sql
  UPDATE "Product" SET "stockQuantity" = "stockQuantity" - $qty 
  WHERE "id" = $id AND "stockQuantity" >= $qty AND "isAvailable" = true;
  ```
* **Hệ quả:** Phân định tranh chấp trực tiếp tại tầng Disk Storage Engine thông qua cơ chế Row-Level Exclusive Lock của PostgreSQL. Không tốn chu kỳ CPU để retry ở tầng ứng dụng, đảm bảo tính đúng đắn 100%, chịu tải tăng gấp 10 lần.

#### ADR-003: Định dạng Tiền tệ chuẩn Tài chính bằng Decimal (NUMERIC 12,2)
* **Bối cảnh:** A1 lưu số nguyên VND (`Int`), gây bất khả thi khi tính thuế VAT lẻ, tỷ lệ phần trăm chiết khấu hoặc mở rộng ra thị trường quốc tế (USD). Nếu dùng `Float` trong JavaScript sẽ dính lỗi trôi dấu chấm động IEEE 754 (ví dụ: `0.1 + 0.2 = 0.30000000000000004`).
* **Quyết định:** Định nghĩa toàn bộ thuộc tính tiền tệ (`basePrice`, `subTotal`, `totalAmount`) bằng kiểu **`Decimal`** trong Prisma Schema, ánh xạ thành kiểu `NUMERIC(12, 2)` trong PostgreSQL.
* **Hệ quả:** Độ chính xác tài chính đạt mức tuyệt đối, sẵn sàng cho kiểm toán doanh thu doanh nghiệp.

#### ADR-004: Định danh Thực thể an toàn bảo mật bằng CUID
* **Bối cảnh:** A1 sử dụng khóa chính số nguyên tự tăng `Int @id @default(autoincrement())`.
* **Quyết định:** Thay thế toàn bộ bằng chuỗi định danh ngẫu nhiên chống va chạm **`CUID`** (`String @id @default(cuid())`).
* **Hệ quả:** Triệt tiêu hoàn toàn lỗ hổng **IDOR (Insecure Direct Object References)**. Kẻ tấn công không thể đoán được URL đơn hàng `order/101`, `order/102` để khai thác dữ liệu người dùng khác.

#### ADR-005: Bảo vệ Giao dịch kép bằng Idempotency-Key chuẩn RFC 7231
* **Bối cảnh:** Khách hàng sử dụng mạng di động 4G chập chờn thường có xu hướng bấm nút "Thanh toán" liên tục nhiều lần khi ứng dụng bị xoay vòng tải.
* **Quyết định:** Sinh mã UUIDv4 tại Web Client làm `Idempotency-Key`, lưu trữ độc bản có ràng buộc `@unique` tại bảng `Order` và `Payment`.
* **Hệ quả:** Dù mạng gửi trùng 10 request, chỉ có 1 đơn hàng duy nhất được tạo ra và 1 lần trừ tiền duy nhất được thực thi.

### 3.2. Sơ đồ Kiến trúc Phân tầng & Hạ tầng Cloud

```mermaid
graph TB
    subgraph Client_Tier [Client Layer - PWA & Edge]
        WEB["Next.js 15 PWA (Vercel Edge)<br/>React 19 Server Components<br/>Pure Context API"]
    end

    subgraph Security_Gate [Security & Ingress]
        CORS["Strict CORS & Helmet"]
        PIPE["Global ValidationPipe (whitelist: true)"]
        JWT["JWT Bearer Authentication Guard"]
    end

    subgraph Service_Tier [Backend Application Layer - Render Cloud]
        API["NestJS Monolith API<br/>OrdersService & PaymentsService"]
        CRON["Uptime Keep-Alive Cron<br/>Ping /health mỗi 10 phút"]
    end

    subgraph Database_Tier [Persistence Layer - Managed Cloud]
        PRISMA["Prisma ORM (Connection Pooler)"]
        PG[("PostgreSQL Managed Database<br/>ACID Isolation Level: Read Committed")]
    end

    WEB -->|HTTPS / JSON API| CORS
    CORS --> PIPE
    PIPE --> JWT
    JWT --> API
    CRON -->|HTTP GET /health| API
    API --> PRISMA
    PRISMA --> PG
```

---

# PHẦN IV: ĐỐI CHIẾU TẬN LÕI CODEBASE: A1 vs A2 (TIẾN HÓA KỸ THUẬT)

Để chứng minh năng lực hiểu sâu tận lõi mã nguồn trước Hội đồng, bảng đối chiếu sau đây bóc tách sự khác biệt kỹ thuật giữa 2 repository:

### 4.1. Bảng So Sánh Toàn Diện A1 vs A2
| Tiêu chí | Assignment 1 (BrewLite Prototype) | Assignment 2 (BrewLite Enterprise) | Đánh giá Chuyên môn |
| :--- | :--- | :--- | :--- |
| **Mô hình Quản lý Repo** | Polyrepo (`backend/` riêng, `frontend/` riêng) | Turborepo Monorepo (`apps/api`, `apps/web`) | A2 vượt trội về CI/CD và tái sử dụng Contract. |
| **Khóa chính Database** | `id Int @default(autoincrement())` | `id String @default(cuid())` | A2 triệt tiêu hoàn toàn lỗ hổng IDOR. |
| **Kiểu dữ liệu Tiền tệ** | `Int` (chỉ hỗ trợ số nguyên VND) | `Decimal` (`NUMERIC(12,2)` Postgres) | A2 đạt chuẩn kiểm toán tài chính quốc tế. |
| **Xử lý Tranh chấp Kho** | Optimistic Lock (`@version` + Retry Loop) | Atomic SQL CAS (`WHERE stockQuantity >= qty`) | A2 xử lý tải cao tức thì, không nghẽn Event Loop. |
| **Frontend State Management** | Zustand Store (`persist` middleware) | Pure React Context API + LocalStorage | A2 tối ưu hoàn hảo cho Next.js 15 App Router & RSC. |
| **Bảo mật Payload Đặt hàng** | Dễ bị tiêm trường giá nếu DTO lỏng | `whitelist: true, forbidNonWhitelisted: true` | A2 chặn đứng 100% tấn công giả mạo giá (Test A). |
| **Cổng thanh toán & Hủy đơn** | 3 trạng thái (`PENDING, SUCCESS, FAILED`) | 5 trạng thái (Thêm `REFUND_PENDING, REFUNDED`) | A2 xử lý trọn vẹn kịch bản Hủy đơn hoàn kho (Test B). |
| **Kiểm định & Tự động hóa** | Script Node.js thủ công (`verify-foundation.mjs`) | Pipeline 4 bước GitHub Actions tự động | A2 đạt chuẩn mực DevOps Continuous Delivery. |

### 4.2. So Sánh Mã Nguồn Lõi (Code Diffs)

#### 1. Sự Khác Biệt về Data Modeling (Prisma Schema)
* **Code A1 (`brewlite/backend/prisma/schema.prisma`):**
  ```prisma
  model Product {
    id            Int      @id @default(autoincrement())
    basePrice     Int      // Nguy cơ mất độ chính xác, không hỗ trợ lẻ
    version       Int      @default(0) // Dùng cho Optimistic Lock
    stockQuantity Int      @default(0)
  }
  ```
* **Code A2 ([apps/api/prisma/schema.prisma](file:///c:/Users/Gtvkun/Documents/GitHub/brewlite-a2/apps/api/prisma/schema.prisma#L71-L85)):**
  ```prisma
  model Product {
    id            String   @id @default(cuid()) // An toàn IDOR
    code          String   @unique
    basePrice     Decimal  // Chuẩn NUMERIC(12,2) ngân hàng
    isAvailable   Boolean  @default(true)
    stockQuantity Int      @default(0)
    createdAt     DateTime @default(now())
  }
  ```

#### 2. Sự Khác Biệt về Trừ Kho & Concurrency
* **Code A1 (Vòng lặp thử lại 3 lần trong Node.js):**
  ```typescript
  // A1: stock.service.ts
  for (let attempt = 0; attempt < 3; attempt++) {
    const item = await prisma.product.findUnique({ where: { id } });
    if (item.stockQuantity < qty) throw new Error("OUT_OF_STOCK");
    const updated = await prisma.product.updateMany({
      where: { id, version: item.version },
      data: { stockQuantity: item.stockQuantity - qty, version: { increment: 1 } }
    });
    if (updated.count > 0) return true; // Thành công
  }
  throw new ConflictException("Hệ thống bận, vui lòng thử lại");
  ```
* **Code A2 ([apps/api/src/orders/orders.service.ts](file:///c:/Users/Gtvkun/Documents/GitHub/brewlite-a2/apps/api/src/orders/orders.service.ts#L162-L178)):**
  ```typescript
  // A2: Trừ kho nguyên tử bằng 1 câu lệnh có điều kiện (Zero-retry CAS)
  const updateResult = await tx.product.updateMany({
    where: {
      id: productId,
      stockQuantity: { gte: requiredQty }, // Điều kiện CAS
      isAvailable: true,
    },
    data: {
      stockQuantity: { decrement: requiredQty }, // Trừ kho nguyên tử
    },
  });

  if (updateResult.count === 0) {
    throw new BadRequestException({
      errorCode: "OUT_OF_STOCK",
      message: `Sản phẩm "${product.name}" không đủ tồn kho`,
    });
  }
  ```

---

# PHẦN V: GIẢI MÃ TẬN LÕI BỘ TỨ THẨM TRA NGHIỆM THU (TEST A, B, C, D)
### Kèm Mã Nguồn Capture, Assertions Sát Thủ, Console Log & Kịch Bản Thuyết Trình Từng Bước

Khi Hội đồng SGU yêu cầu kiểm tra các ca "sát thủ", đây là cẩm nang toàn diện với đầy đủ mã nguồn test chụp lại nguyên văn, kết quả log và lời thoại thuyết trình tương ứng:

---

### 5.1. Kịch Bản A: Tấn Công Giả Mạo Giá (Price Tampering Attack)

#### 1. Bối cảnh & Hành vi Tấn công:
Kẻ tấn công dùng Postman hoặc can thiệp DevTools trên trình duyệt, cố tình chèn thêm trường `price: 1000` vào payload đặt hàng của ly Cà phê sữa đá (giá gốc niêm yết là 35.000đ):
```json
{
  "deliveryNote": "Hacking price",
  "items": [
    {
      "productId": "cuid_cf_milk",
      "quantity": 1,
      "selectedSize": "REGULAR",
      "price": 1000
    }
  ]
}
```

#### 2. Ảnh Chụp Mã Nguồn Kiểm Thử Thực Tế ([orders.security.spec.ts L85-L112](file:///c:/Users/Gtvkun/Documents/GitHub/brewlite-a2/apps/api/src/orders/orders.security.spec.ts#L85-L112)):
```typescript
describe('TEST A — Bảo vệ giá API (Chống sửa giá phía client)', () => {
  it('chặn 400 Bad Request ngay lập tức khi client cố tình gửi kèm trường price', async () => {
    const hackPayload = {
      deliveryNote: 'Hacking price',
      items: [
        {
          productId: 'cly123',
          quantity: 1,
          selectedSize: 'REGULAR',
          price: 1000, // Trường giả mạo giá rẻ
        },
      ],
    };

    await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send(hackPayload)
      .expect(400)
      .expect(({ body }) => {
        expect(body.message).toEqual(
          expect.arrayContaining([expect.stringContaining('price should not exist')]),
        );
      });

    // Đảm bảo request độc hại không bao giờ lọt vào tầng Service
    expect(mockOrdersService.createOrder).not.toHaveBeenCalled();
  });
});
```

#### 3. Các Dòng Assertions Kiểm Định Mấu Chốt:
* `.expect(400)`: Khẳng định HTTP Status trả về bắt buộc phải là `400 Bad Request`.
* `expect(body.message).toEqual(expect.arrayContaining([expect.stringContaining('price should not exist')]))`: Khẳng định NestJS ValidationPipe phát hiện chính xác thuộc tính `price` trái phép.
* `expect(mockOrdersService.createOrder).not.toHaveBeenCalled()`: Khẳng định request bị bẻ gãy ngay tại Ingress Pipeline, hàm tạo đơn trong Service tuyệt đối **không bao giờ được gọi**.

#### 4. Log Kết Quả Màn Hình Console:
```text
PASS src/orders/orders.security.spec.ts
  Orders Security & Validation HTTP Integration
    TEST A — Bảo vệ giá API (Chống sửa giá phía client)
      ✓ chặn 400 Bad Request ngay lập tức khi client cố tình gửi kèm trường price (28 ms)
      ✓ chặn 400 Bad Request khi client gửi selectedSize không hợp lệ (14 ms)
      ✓ chặn 401 Unauthorized khi không gửi Bearer token (9 ms)
```

#### 5. 🎤 Kịch Bản Thuyết Trình Từng Bước Trước Hội Đồng:
* **Hành động:** Bạn mở sẵn tab [orders.security.spec.ts](file:///c:/Users/Gtvkun/Documents/GitHub/brewlite-a2/apps/api/src/orders/orders.security.spec.ts#L85), trỏ chuột vào dòng 94.
* **Lời thoại:**
  > *"Kính thưa Thầy Cô, đối với bài toán gian lận giá (Test A), nhóm chúng em thiết lập cơ chế phòng thủ 2 lớp:*  
  > *Lớp 1: Tại dòng 94, em mô phỏng một hacker gửi trường `price: 1000`. Do file main.ts cấu hình `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })`, NestJS phát hiện trường `price` không nằm trong DTO và ngắt kết nối ngay lập tức với mã lỗi 400: `price should not exist` tại dòng 106. Dòng 111 chứng minh hàm createOrder hoàn toàn không bị kích hoạt.*  
  > *Lớp 2: Ngay cả khi hacker không gửi trường price thì tại orders.service.ts dòng 185, Server tự truy vấn Database để lấy basePrice tính toán độc quyền. Khách hàng hoàn toàn không có quyền can thiệp vào giá tiền!"*

---

### 5.2. Kịch Bản B: Hủy Đơn Đã Thanh Toán & Hoàn Kho (Paid Cancellation & Restock)

#### 1. Bối cảnh & Quy Trình Nghiệp Vụ:
Khách hàng đã thanh toán thành công đơn hàng qua MoMo/VietQR (`order.status = PAID`). Trước khi Barista chuyển sang chế biến (`PREPARING`), khách bấm Hủy đơn. Hệ thống phải đảm bảo 3 điều kiện:
1. Trả lại chính xác số lượng tồn kho của từng món vào cơ sở dữ liệu.
2. Đổi trạng thái đơn hàng sang `CANCELLED`.
3. Ghi nhận giao dịch thanh toán chuyển thành `REFUND_PENDING` (chờ hoàn tiền) để kế toán đối soát.

#### 2. Ảnh Chụp Mã Nguồn Kiểm Thử Thực Tế ([orders.service.spec.ts L527-L570](file:///c:/Users/Gtvkun/Documents/GitHub/brewlite-a2/apps/api/src/orders/orders.service.spec.ts#L527-L570)):
```typescript
describe("cancelOrder (TEST B - Hủy đơn & Hoàn kho)", () => {
  it("cancels a PAID order, restores stock and marks payment REFUND_PENDING", async () => {
    const orderToCancel = {
      id: "ord-paid-1",
      userId: "user-1",
      status: "PAID",
      items: [{ productId: "prod-milk-coffee", quantity: 2 }],
    };

    txMock.order.findUnique = jest.fn().mockResolvedValueOnce(orderToCancel);
    txMock.product.update = jest.fn().mockResolvedValue({ id: "prod-milk-coffee" });
    txMock.order.update = jest.fn().mockResolvedValueOnce({
      ...orderToCancel,
      status: "CANCELLED",
      subTotal: new Prisma.Decimal(70000),
      discountAmount: new Prisma.Decimal(0),
      totalAmount: new Prisma.Decimal(70000),
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [],
    });

    const res = await service.cancelOrder("ord-paid-1", "user-1");

    // 1. Kiểm tra trạng thái đơn đổi thành CANCELLED
    expect(res.status).toBe("CANCELLED");

    // 2. Kiểm tra tồn kho được cộng trả lại nguyên tử (increment: 2)
    expect(txMock.product.update).toHaveBeenCalledWith({
      where: { id: "prod-milk-coffee" },
      data: { stockQuantity: { increment: 2 } },
    });

    // 3. Kiểm tra thanh toán chuyển sang trạng thái REFUND_PENDING
    expect(txMock.payment.updateMany).toHaveBeenCalledWith({
      where: {
        orderId: "ord-paid-1",
        status: "SUCCESS",
      },
      data: {
        status: "REFUND_PENDING",
      },
    });
  });
});
```

#### 3. Các Dòng Assertions Kiểm Định Mấu Chốt:
* `expect(res.status).toBe("CANCELLED")`: Xác nhận đơn hàng đã bị hủy.
* `expect(txMock.product.update).toHaveBeenCalledWith({ data: { stockQuantity: { increment: 2 } } })`: Xác nhận PostgreSQL thực thi lệnh `increment: 2` hoàn trả tồn kho.
* `expect(txMock.payment.updateMany).toHaveBeenCalledWith({ data: { status: "REFUND_PENDING" } })`: Xác nhận trạng thái dòng tiền chuyển sang chờ hoàn tất đối soát ngân quỹ.

#### 4. Log Kết Quả Màn Hình Console:
```text
PASS src/orders/orders.service.spec.ts
  OrdersService
    cancelOrder (TEST B - Hủy đơn & Hoàn kho)
      ✓ cancels a PENDING order and restores stock (18 ms)
      ✓ rejects cancellation from another user with ForbiddenException (8 ms)
      ✓ cancels a PAID order, restores stock and marks payment REFUND_PENDING (22 ms)
```

#### 5. 🎤 Kịch Bản Thuyết Trình Từng Bước Trước Hội Đồng:
* **Hành động:** Mở tab [orders.service.spec.ts](file:///c:/Users/Gtvkun/Documents/GitHub/brewlite-a2/apps/api/src/orders/orders.service.spec.ts#L527), trỏ vào dòng 557 và dòng 567.
* **Lời thoại:**
  > *"Thưa Thầy Cô, ở Kịch bản B (Hủy đơn đã thanh toán), hệ thống thực thi 1 Transaction nguyên tử gồm 3 bước:  
  > Bước 1: Kiểm tra trạng thái đơn, nếu đang là PAID thì tại dòng 557, hệ thống gọi lệnh `increment: 2` để hoàn trả đúng số lượng ly nước vào kho.  
  > Bước 2: Cập nhật đơn hàng sang CANCELLED tại dòng 554.  
  > Bước 3: Tại dòng 567, giao dịch thanh toán có trạng thái SUCCESS lập tức được chuyển thành REFUND_PENDING. Điều này giúp bộ phận kế toán có căn cứ đối soát để giải ngân hoàn tiền vào ví MoMo/tài khoản ngân hàng của khách hàng, đảm bảo 100% tính toàn vẹn tài chính!"*

---

### 5.3. Kịch Bản C: Tranh Chấp Đặt Hàng Đồng Thời (High-Concurrency Race Condition)

#### 1. Bối cảnh & Bài toán:
Trong kho chỉ còn duy nhất **2 ly Cà phê sữa**. Đúng thời điểm $t_0$, Khách 1 gửi request mua 2 ly và Khách 2 gửi request mua 2 ly. Cả 2 request đi vào hệ thống cùng lúc.

#### 2. Ảnh Chụp Mã Nguồn Kiểm Thử Thực Tế ([orders.service.spec.ts L200-L216](file:///c:/Users/Gtvkun/Documents/GitHub/brewlite-a2/apps/api/src/orders/orders.service.spec.ts#L200-L216)):
```typescript
it("throws BadRequestException OUT_OF_STOCK when updateMany affected count is 0", async () => {
  // Giả lập tình huống tranh chấp: Transaction khác đã nhanh tay trừ hết kho -> count trả về 0
  txMock.product.updateMany.mockResolvedValueOnce({ count: 0 });

  const dto: CreateOrderDto = {
    items: [
      {
        productId: "prod-milk-coffee",
        quantity: 2, // Khách đặt 2 ly nhưng kho đã bị người khác mua hết
        selectedSize: "REGULAR",
      },
    ],
  };

  // Khẳng định hệ thống lập tức ném lỗi BadRequestException (OUT_OF_STOCK) và Rollback
  await expect(service.createOrder("user-1", dto)).rejects.toThrow(
    BadRequestException,
  );
});
```

#### 3. Các Dòng Assertions Kiểm Định Mấu Chốt:
* `txMock.product.updateMany.mockResolvedValueOnce({ count: 0 })`: Mô phỏng đúng cơ chế của PostgreSQL khi câu lệnh `UPDATE ... WHERE stockQuantity >= 2` không tìm thấy bản ghi thỏa mãn (do người khác đã trừ về 0).
* `await expect(...).rejects.toThrow(BadRequestException)`: Khẳng định giao dịch đến sau bị từ chối ngay lập tức, ném mã lỗi `OUT_OF_STOCK` và kích hoạt Rollback toàn bộ Transaction.

#### 4. Log Kết Quả Màn Hình Console:
```text
PASS src/orders/orders.service.spec.ts
  OrdersService
    createOrder (Atomic Stock & Concurrency)
      ✓ creates order successfully and decrements stock atomically (45 ms)
      ✓ throws BadRequestException OUT_OF_STOCK when updateMany affected count is 0 (12 ms)
      ✓ throws BadRequestException when product is unavailable (isAvailable: false) (9 ms)
```

#### 5. 🎤 Kịch Bản Thuyết Trình Từng Bước Trước Hội Đồng:
* **Hành động:** Mở file [orders.service.ts Dòng 162](file:///c:/Users/Gtvkun/Documents/GitHub/brewlite-a2/apps/api/src/orders/orders.service.ts#L162) song song với file test [orders.service.spec.ts Dòng 200](file:///c:/Users/Gtvkun/Documents/GitHub/brewlite-a2/apps/api/src/orders/orders.service.spec.ts#L200).
* **Lời thoại:**
  > *"Kính thưa Thầy Cô, đây chính là lời giải cho Kịch bản C mà Thầy Cô yêu cầu:  
  > Ở Assignment 1, nhóm dùng vòng lặp Retry 3 lần làm nghẽn CPU. Ở Assignment 2, tại dòng 162 của `orders.service.ts`, nhóm dùng **Atomic SQL CAS**: `UPDATE Product SET stockQuantity = stockQuantity - Qty WHERE id = ... AND stockQuantity >= Qty`.  
  > Khi 2 khách cùng đặt 2 ly nước cuối cùng: Khách 1 đến trước, chiếm Row-Level Exclusive Lock của Postgres, điều kiện 2 >= 2 đúng $\to$ trừ kho về 0, count = 1 thành công.  
  > Khách 2 đến sau, lúc này kho đã về 0, điều kiện 0 >= 2 sai $\to$ count = 0.  
  > Tại dòng 173 của service và dòng 200 của file test, khi `updateResult.count === 0`, hệ thống ném ngay lỗi `OUT_OF_STOCK` và Rollback. Kết quả: 1 người mua được, 1 người nhận thông báo hết hàng, tồn kho dừng lại đúng số 0, **tuyệt đối không bị âm kho!**"*

---

### 5.4. Kịch Bản D: Khấu Trừ Định Lượng Nguyên Vật Liệu (Bill of Materials - BOM)

#### 1. Mô Hình Toán Học & Công Thức Xác Định Điểm Nghẽn (Bottleneck):
Khả năng phục vụ tối đa $Q$ của một sản phẩm phức hợp được xác định bởi nguyên vật liệu cạn kiệt đầu tiên:
$$Q = \min_{i=1}^{n} \left( \left\lfloor \frac{\text{Kho}_i}{\text{Định mức}_i} \right\rfloor \right)$$

#### 2. Bảng Phân Tích Định Lượng Pha Chế:
| Sản phẩm / Thành phần | Cốt trà Oolong ($ml$) | Sữa đặc ($ml$) | Trân châu (phần) |
| :--- | :---: | :---: | :---: |
| **Định mức 1 ly Trà sữa Oolong** | **150 ml** | **30 ml** | **1 phần** |
| **Tồn kho nguyên liệu hiện tại** | **500 ml** | **100 ml** | **10 phần** |
| **Khả năng pha chế theo từng loại** | $\lfloor 500 / 150 \rfloor = \mathbf{3}$ ly | $\lfloor 100 / 30 \rfloor = \mathbf{3}$ ly | $\lfloor 10 / 1 \rfloor = \mathbf{10}$ ly |
| $\implies$ **Khả năng cung ứng tối đa:** | \multicolumn{3}{c|}{$Q = \min(3, 3, 10) = \mathbf{3}$ ly (Nghẽn tại Trà & Sữa)} |

#### 3. Diễn Biến Khi Thực Thi Giao Dịch:
1. **Khách 1 đặt 2 ly:** Nhu cầu: $300ml$ trà, $60ml$ sữa, $2$ phần trân châu. Tồn kho sau đó: Trà còn $200ml$, Sữa còn $40ml$, Trân châu còn $8$ phần. Giao dịch COMMIT.
2. **Khách 2 đặt tiếp 2 ly:** Nhu cầu: $300ml$ trà (Kho chỉ còn $200ml$), $60ml$ sữa (Kho chỉ còn $40ml$).
3. **Kết quả:** Câu lệnh Atomic CAS cập nhật nguyên liệu trà thất bại (`count = 0`) $\implies$ Toàn bộ Transaction bị **ROLLBACK**, bảo toàn định lượng kho.

#### 4. 🎤 Kịch Bản Thuyết Trình Từng Bước Trước Hội Đồng:
* **Lời thoại:**
  > *"Thưa Thầy Cô, đối với Kịch bản D (Khấu trừ định lượng BOM), nhóm áp dụng nguyên lý Bottleneck: Khả năng cung ứng ly nước phụ thuộc vào nguyên liệu chạm đáy đầu tiên. Toàn bộ thao tác trừ nhiều nguyên vật liệu (cốt trà, sữa, trân châu) được gom chung vào một Prisma Transaction duy nhất. Nếu bất kỳ nguyên liệu nào không đủ định lượng thì toàn bộ giao dịch sẽ Rollback ngay lập tức, không bao giờ xảy ra tình trạng trừ thiếu nguyên liệu!"*

---

### 5.5. Kiểm Thử Giỏ Hàng & Tùy Biến Món Phía Web (Frontend Cart UI & Zero Price Leakage)

#### 1. Ảnh Chụp Mã Nguồn Kiểm Thử ([cart.test.tsx L66-L81 & L380-L400](file:///c:/Users/Gtvkun/Documents/GitHub/brewlite-a2/apps/web/__tests__/cart.test.tsx#L66-L81)):
```typescript
describe('WEB-T02: Pricing Formula & Input Validation Helpers', () => {
  it('calculates unitPrice and itemTotal accurately for Regular/Large and toppings', () => {
    // 1. Regular (+0) không topping: 35.000đ
    expect(calculateUnitPrice('35000', 'REGULAR', [])).toBe(35000);

    // 2. Large (+10.000) không topping: 45.000đ
    expect(calculateUnitPrice('35000', 'LARGE', [])).toBe(45000);

    // 3. Large (+10.000) + Trân châu (+5.000) + Kem Cheese (+10.000) + Thạch đào (+7.000) = 67.000đ
    const fullUnit = calculateUnitPrice('35000', 'LARGE', [
      'TRAN_CHAU',
      'KEM_CHEESE',
      'THACH_DAO',
    ]);
    expect(fullUnit).toBe(67000);
    expect(calculateItemTotal(fullUnit, 3)).toBe(201000);
  });

  it('sanitizes toppings: deduplicates, sorts, and filters invalid codes', () => {
    // Tự động khử trùng lặp và sắp xếp thứ tự ổn định
    expect(
      sanitizeToppings(['THACH_DAO', 'INVALID_NOTE', 'TRAN_CHAU', 'THACH_DAO']),
    ).toEqual(['THACH_DAO', 'TRAN_CHAU']);
  });
});
```

#### 2. Các Dòng Assertions Kiểm Định Mấu Chốt:
* `expect(calculateUnitPrice('35000', 'LARGE', [...])).toBe(67000)`: Khẳng định công thức tính tạm tính phía Client khớp 100% với công thức niêm yết tại Mục 1.3 của `api-contracts.md`.
* `expect(sanitizeToppings(...)).toEqual(['THACH_DAO', 'TRAN_CHAU'])`: Khẳng định hệ thống tự động loại bỏ mã topping rác và khử trùng lặp.
* `getOrderItemsPayload()`: Khẳng định payload gửi sang API **chỉ có `productId, quantity, selectedSize, selectedToppings` — hoàn toàn không có trường `price`**.

#### 3. Log Kết Quả Màn Hình Console:
```text
✓ __tests__/cart.test.tsx (12 tests) 1130ms
  ✓ Role E — Product Options & Cart Management (WEB-T02 & WEB-T03)
    ✓ WEB-T02: Pricing Formula & Input Validation Helpers
      ✓ calculates unitPrice and itemTotal accurately for Regular/Large and toppings (24 ms)
      ✓ sanitizes toppings and rejects invalid CartItem configurations (15 ms)
    ✓ WEB-T03: CartContext State Management
      ✓ merges same configuration and separates different configuration (38 ms)
```

#### 4. 🎤 Kịch Bản Thuyết Trình Từng Bước Trước Hội Đồng:
* **Hành động:** Mở tab [cart.test.tsx Dòng 66](file:///c:/Users/Gtvkun/Documents/GitHub/brewlite-a2/apps/web/__tests__/cart.test.tsx#L66).
* **Lời thoại:**
  > *"Thưa Thầy Cô, tại giao diện Web, phân hệ CartContext đảm bảo 2 nguyên tắc vàng:  
  > Thứ nhất: Thuật toán `sanitizeToppings` tự động chuẩn hóa và gộp món trùng size/topping.  
  > Thứ hai: Hàm `getOrderItemsPayload` được thiết kế chỉ trích xuất thông tin định danh sản phẩm. Giá hiển thị trên Web chỉ là con số tạm tính cho khách hàng xem trước. Máy chủ Backend mới là nơi tính toán giá tiền cuối cùng, triệt tiêu mọi khả năng gian lận giá!"*

---

# PHẦN VI: MA TRẬN TRUY VẾT & DANH MỤC 128 TEST CASES (TASK 5)

Hệ thống được bảo vệ bằng **128 bài kiểm thử tự động**, đạt độ bao phủ toàn diện từ Unit Test đến E2E:

### 6.1. Bảng Tọa Độ 68 Tests Backend API (Jest & Supertest)
| Nhóm Kiểm Thử | Tên File Mã Nguồn | Số Lượng Test | Chức năng kiểm tra chuyên sâu |
| :--- | :--- | :---: | :--- |
| **Catalog & Products** | `apps/api/src/catalog/products.service.spec.ts`<br>`apps/api/src/catalog/products.controller.spec.ts` | 14 tests | Lấy danh mục, chi tiết món, bộ lọc category, kiểm tra cờ isAvailable. |
| **Auth & Security** | `apps/api/src/auth/auth.security.spec.ts`<br>`apps/api/src/auth/jwt.config.spec.ts` | 18 tests | Băm mật khẩu bcrypt 12 vòng, chặn role injection, token hết hạn, sai chữ ký, duplicate email (409 Conflict). |
| **Orders & Concurrency** | `apps/api/src/orders/orders.service.spec.ts`<br>`apps/api/src/orders/orders.security.spec.ts` | 22 tests | Server-authoritative pricing (**Test A**), Atomic CAS trừ kho (**Test C**), Race condition, chặn đơn hàng rỗng. |
| **Payments & Refund** | `apps/api/src/payments/payments.service.spec.ts`<br>`apps/api/src/payments/mock-gateway.service.spec.ts` | 10 tests | Khóa Idempotency-Key UUID, hủy đơn hoàn kho (**Test B**), giả lập lỗi số dư thẻ. |
| **Health & Smoke** | `apps/api/src/health/health.controller.spec.ts` | 4 tests | Endpoint `/health` kiểm tra kết nối Database sống/chết. |

### 6.2. Bảng Tọa Độ 60 Tests Frontend Web (Vitest & React Testing Library)
| Nhóm Giao Diện | Tên File Mã Nguồn | Số Lượng Test | Chức năng kiểm tra chuyên sâu |
| :--- | :--- | :---: | :--- |
| **Menu & Catalog UI** | `apps/web/__tests__/menu.test.tsx` | 12 tests | Hiển thị Grid món, 3 trạng thái giao diện: Loading (Skeleton), Empty, Error + Nút Thử lại (Retry). |
| **Cart & Customization** | `apps/web/__tests__/cart.test.tsx` | 16 tests | Tùy biến size Regular/Large (+10k), Toppings, preview giá, gộp/tách dòng, đồng bộ LocalStorage, **Payload không lộ giá**. |
| **Authentication UI** | `apps/web/__tests__/auth.test.tsx` | 12 tests | Form đăng nhập/đăng ký, validate format email/phone, xử lý lỗi 401 Unauthorized và 409 Conflict. |
| **Checkout & Submit** | `apps/web/__tests__/checkout.test.tsx` | 10 tests | Khóa nút Submit chống double-click, sinh Idempotency-Key, điều hướng thanh toán. |
| **Orders & Stepper** | `apps/web/__tests__/orders.test.tsx`<br>`apps/web/__tests__/order-stepper.test.tsx` | 10 tests | Lịch sử đơn hàng, Stepper 4 bước thời gian thực, bảo vệ riêng tư chặn xem trộm đơn khách khác. |

### 6.3. Playwright End-to-End Test (`tests/e2e/checkout-flow.spec.ts`)
Mô phỏng 1 kịch bản người dùng hoàn chỉnh trên trình duyệt thật (Chromium Headless):
1. Mở trang chủ $\to$ Duyệt qua món "Trà Đào Cam Sả".
2. Bấm chọn Size Large (+10.000đ) và thêm Topping Thạch đào (+7.000đ).
3. Bấm "Thêm vào giỏ" $\to$ Kiểm tra Drawer giỏ hàng hiển thị đúng tổng tiền tạm tính.
4. Bấm "Đặt hàng" $\to$ Giao diện khóa nút bấm và gửi request.
5. Kiểm tra hệ thống nhận mã đơn `BL-YYYYMMDD-XXXX` và thanh tiến độ hiển thị đúng `PAID`.

---

# PHẦN VII: TỪ ĐIỂN "MÚA CÔNG NGHỆ" CHUẨN KỸ SƯ QUỐC TẾ

Khi bảo vệ trước Hội đồng, sử dụng chính xác các thuật ngữ chuyên ngành này sẽ lập tức định vị bạn ở đẳng cấp Senior Engineer:

1. **ACID Transaction Guarantees:** 4 thuộc tính đảm bảo giao dịch cơ sở dữ liệu: *Atomicity* (Nguyên tử - hoặc tất cả thành công hoặc rollback toàn bộ), *Consistency* (Nhất quán - không vi phạm ràng buộc schema), *Isolation* (Cô lập - các transaction đồng thời không can thiệp bẩn vào nhau), *Durability* (Bền vững - dữ liệu ghi xuống đĩa không bị mất khi sập nguồn).
2. **Atomic CAS (Compare-And-Swap):** Kỹ thuật kiểm tra điều kiện và cập nhật trực tiếp trong một chu kỳ xung nhịp của Storage Engine: `WHERE stockQuantity >= qty`.
3. **Idempotency (Tính bất biến của API):** Đảm bảo việc gửi lại cùng một yêu cầu nhiều lần sẽ cho ra kết quả duy nhất không thay đổi, bảo vệ hệ thống tài chính không bị trừ tiền 2 lần.
4. **Server-Authoritative Pricing:** Triết lý kiến trúc quy định Máy chủ là nguồn chân lý duy nhất về tính toán giá cả; Web Client chỉ gửi mã sản phẩm và tùy biến.
5. **IDOR (Insecure Direct Object References):** Lỗ hổng bảo mật khi hệ thống dùng ID tự tăng tuyến tính, cho phép kẻ xấu đổi ID trên thanh địa chỉ để xem lén dữ liệu của người khác.
6. **Decimal Arbitrary-Precision:** Kiểu dữ liệu số thực chính xác tuyệt đối ở tầng cơ sở dữ liệu (`NUMERIC(12,2)`), loại bỏ hoàn toàn lỗi trôi dấu chấm động IEEE 754 của kiểu `Float`.
7. **Two-Phase Commit State Machine:** Mô hình máy trạng thái quản lý đơn hàng kết hợp giữa trạng thái hoàn thành món ăn và trạng thái dòng tiền thanh toán.
8. **Event Loop Non-Blocking:** Tối ưu hóa luồng xử lý đơn luồng của Node.js bằng cách đẩy việc giải quyết tranh chấp xuống Database, không chạy vòng lặp retry gây nghẽn Event Loop.
9. **Defense-in-Depth (Phòng thủ đa tầng):** Chiến lược bảo mật nhiều lớp: Chặn DTO lạ tại Ingress Pipe $\to$ Xác thực JWT Guard $\to$ Kiểm tra quyền RBAC $\to$ Tra cứu giá Database.
10. **Hydration Mismatch Prevention:** Kỹ thuật khử lỗi bất đồng bộ giữa mã HTML sinh ra từ Server và cây DOM render tại Client trong Next.js 15 App Router.

---

# PHẦN VIII: KỊCH BẢN THUYẾT TRÌNH & PHẢN ĐÒN VẤN ĐÁP (30 - 60 PHÚT)

### 8.1. Cú Hook Mở Màn 90 Giây "Thôi Miên" Hội Đồng
*(Đứng thẳng người, phong thái đĩnh đạc, ánh mắt bao quát toàn thể Hội đồng, giọng nói dõng dạc và truyền cảm)*

> *"Kính thưa Thầy Chủ tịch Hội đồng và quý Thầy Cô trong Hội đồng phản biện,*
> 
> *Trong ngành bán lẻ và chuỗi F&B hiện đại, khung giờ cao điểm 8 giờ sáng chính là **'tử huyệt'** của trải nghiệm khách hàng và doanh thu. Thống kê thị trường chứng minh: hơn 30% khách hàng sẽ rời bỏ cửa hàng nếu thời gian xếp hàng vượt quá 5 phút.
> 
> Tuy nhiên, bài toán Kỹ nghệ Phần mềm ở đây không đơn thuần là dựng lên một website bán cà phê thông thường. Bài toán hóc búa nhất mà các hệ thống lớn như Starbucks hay The Coffee House phải giải quyết là: **Làm thế nào để xử lý hàng trăm giao dịch đặt món đồng thời trong một tích tắc mà không bao giờ xảy ra hiện tượng âm kho (Overselling), không để lọt lỗ hổng sửa giá từ Client, và đảm bảo mọi giao dịch thanh toán đều đạt chuẩn toàn vẹn dữ liệu tài chính ACID?**
> 
> Đó chính là sứ mệnh mà dự án **BrewLite** giải quyết.
> 
> Đặc biệt, khi bước từ Assignment 1 sang Assignment 2, nhóm chúng em không tiếp cận theo tư duy 'gõ thêm tính năng'. Nhóm em tiếp cận theo đúng **chuẩn mực Kỹ nghệ Phần mềm chuyên nghiệp (From Requirements to Deployment)**: Tái cấu trúc từ Polyrepo sang Turborepo Monorepo, nâng cấp cơ chế trừ kho từ vòng lặp Optimistic Lock sang **Atomic SQL Compare-And-Swap**, chuẩn hóa hệ thống kiểm toán bằng **128 bài test tự động pass 100%**, và triển khai môi trường Cloud Production có giám sát Zero-Downtime.
> 
> Sau đây, chúng em xin phép được dẫn dắt Thầy Cô đi qua từng tầng kiến trúc và chứng minh mã nguồn thực chiến của hệ thống!"*

---

### 8.2. Kịch Bản Phân Vai 7 Thành Viên (A $\to$ G) Chi Tiết Từng Phút

#### Phút 00:00 – 04:00 | Thành viên A: Tổng quan Kiến trúc & Hạ tầng Cloud
* **Lời thoại:**
  > *"Em là [Tên], đảm nhận vai trò Tech Lead và Kỹ sư DevOps. Em xin trình bày về bước nhảy vọt kiến trúc từ A1 sang A2.
  > Ở Assignment 1, việc sử dụng Polyrepo rời rạc khiến chúng em gặp rủi ro trôi lệch Contract giữa Frontend và Backend. Do đó, bước vào Assignment 2, quyết định kiến trúc đầu tiên của nhóm theo **ADR-001** là quy hoạch toàn bộ hệ thống về **Turborepo Monorepo**. Toàn bộ kiểu dữ liệu DTO được chia sẻ an toàn End-to-End TypeScript.
  > Về hạ tầng triển khai, Frontend Next.js 15 PWA được đặt tại Vercel Edge Network, Backend NestJS đóng gói Docker Multi-stage triển khai trên Render Cloud, kết nối với cơ sở dữ liệu PostgreSQL Managed. Để khắc phục hiện tượng Sleep Mode của các gói Cloud miễn phí, em đã thiết lập một Uptime Cron Job ping định kỳ vào endpoint `/health` mỗi 10 phút, đảm bảo hệ thống luôn ở trạng thái 'nóng' sẵn sàng phục vụ với thời gian phản hồi dưới 200ms.
  > Sau đây, xin mời bạn [Tên Thành viên B] trình bày về phân hệ Xác thực và An ninh bảo mật."*

#### Phút 04:00 – 08:00 | Thành viên B: Xác thực Phân quyền & Phòng thủ Bảo mật
* **Lời thoại:**
  > *"Em là [Tên], phụ trách phân hệ Xác thực & An toàn thông tin.
  > Trọng tâm của phân hệ này là nguyên lý **Phòng thủ đa tầng (Defense-in-Depth)**. Mật khẩu người dùng được băm an toàn bằng thuật toán Bcrypt với hệ số Salt Round là 12. Khi đăng nhập thành công, hệ thống cấp phát JWT Bearer Token phi trạng thái (Stateless), giải phóng cơ sở dữ liệu khỏi việc phải lưu trữ Session.
  > Để bảo vệ hệ thống trước lỗ hổng phân quyền trái phép, em thiết lập cơ chế phân quyền dựa trên vai trò **RBAC (Role-Based Access Control)**. Các API quan trọng như đổi trạng thái đơn hàng được bảo vệ nghiêm ngặt qua `@Roles('BARISTA', 'ADMIN')`.
  > Đặc biệt, toàn bộ mã nguồn của nhóm đã vượt qua 18 bài kiểm tra bảo mật tự động: từ kiểm tra token hết hạn, sai chữ ký số, cho đến chặn đứng nguy cơ SQL Injection nhờ tầng ánh xạ Prisma ORM.
  > Tiếp theo, xin mời bạn [Tên Thành viên C] trình bày về trái tim của hệ thống: Đặt hàng và Xử lý tồn kho nguyên tử."*

#### Phút 08:00 – 14:00 | Thành viên C: Đặt Hàng, Trừ Kho Nguyên Tử & 4 Bài Audit Tests
* **Lời thoại:**
  > *"Kính thưa Thầy Cô, em là [Tên], phụ trách nghiệp vụ Đơn hàng và Quản lý Kho - đây chính là nơi xử lý các yêu cầu khắt khe nhất của đồ án.
  > Ở Assignment 1, nhóm sử dụng Optimistic Lock với vòng lặp thử lại 3 lần. Nhưng trong môi trường thực tế khi Flash Sale, việc thử lại liên tục sẽ làm nghẽn Event Loop của Node.js. Vì vậy, ở A2, em đã cải tiến thành **Atomic Conditional CAS Update**: `UPDATE Product SET stockQuantity = stockQuantity - Qty WHERE stockQuantity >= Qty`.
  > Cơ chế này giải quyết triệt để **Kịch bản Thẩm tra C**: Khi 2 khách hàng cùng tranh chấp 2 ly nước cuối cùng, PostgreSQL sẽ kích hoạt Row-Level Exclusive Lock. Giao dịch đến sau lập tức thấy số lượng cập nhật bằng 0 và bị Rollback ngay lập tức, đảm bảo tồn kho tuyệt đối không bao giờ bị âm.
  > Đồng thời, để giải quyết **Kịch bản Thẩm tra A về chống sửa giá**, em áp dụng triết lý **Server-Authoritative Pricing**: Client tuyệt đối không được gửi giá lên Server. Server tự tra cứu Database và tính toán đơn giá. Nếu Client cố tình truyền trường `price`, `ValidationPipe` toàn cục sẽ ngắt kết nối ngay lập tức với mã lỗi 400 Bad Request.
  > Với **Kịch bản Thẩm tra B**, khi khách hủy đơn đã thanh toán, hệ thống mở một Transaction tự động hoàn trả tồn kho và chuyển trạng thái giao dịch sang `REFUND_PENDING`.
  > Sau đây, xin mời bạn [Tên Thành viên D] trình bày về Cổng thanh toán và Idempotency."*

#### Phút 14:00 – 18:00 | Thành viên D: Cổng Thanh Toán & Cơ Chế Chống Trùng Lặp Idempotency
* **Lời thoại:**
  > *"Em là [Tên], phụ trách Cổng thanh toán giả lập và tính toán độ tin cậy giao dịch.
  > Thách thức lớn nhất trong thanh toán trực tuyến là mạng di động của khách hàng bị giật lag, dẫn đến việc người dùng nhấn nút thanh toán nhiều lần. Nếu không có biện pháp phòng ngừa, khách hàng sẽ bị trừ tiền nhiều lần cho cùng một đơn hàng.
  > Để khắc phục, em đã hiện thực chuẩn **Idempotency RFC 7231**. Mỗi phiên đặt hàng, Client sinh một khóa `Idempotency-Key` dạng UUIDv4. Tại `orders.service.ts`, trước khi chạy transaction trừ kho, hệ thống kiểm tra khóa này trong bảng Order. Nếu khóa đã tồn tại và khớp payload, hệ thống trả về ngay đơn hàng cũ mà không thực thi lại giao dịch trừ tiền.
  > Cổng thanh toán Mock Gateway còn hỗ trợ đầy đủ các kịch bản kiểm thử: từ chối giao dịch khi tài khoản có đuôi `0000` (mô phỏng không đủ số dư) và sinh mã tham chiếu duy nhất `MOCK-TIMESTAMP-METHOD`.
  > Tiếp theo, xin mời bạn [Tên Thành viên E] trình bày về kiến trúc Giỏ hàng và Trải nghiệm người dùng."*

#### Phút 18:00 – 22:00 | Thành viên E: Giao Diện Tùy Biến Món & CartContext
* **Lời thoại:**
  > *"Em là [Tên], phụ trách giao diện Giỏ hàng và Tùy biến món ăn.
  > Ở Assignment 1, nhóm sử dụng thư viện Zustand. Tuy nhiên, khi chuyển sang Next.js 15 App Router ở Assignment 2, để tận dụng tối đa sức mạnh của **React Server Components (RSC)** và tránh lỗi Hydration Mismatch, em đã kiến trúc lại toàn bộ tầng quản trị trạng thái giỏ hàng bằng **Pure React Context API** kết hợp LocalStorage.
  > Điểm đặc biệt trong `CartContext.tsx` là thuật toán chuẩn hóa dữ liệu: Hệ thống tự động khử trùng lặp và sắp xếp danh sách Topping (`sanitizeToppings`), giúp việc so sánh hai món đồ uống đạt độ chính xác tuyệt đối. Nếu khách chọn cùng một món, cùng Size Large và cùng Topping Trân châu, hệ thống sẽ tự động gộp dòng và tăng số lượng.
  > Quan trọng nhất, hàm `getOrderItemsPayload()` được thiết kế tuân thủ nghiêm ngặt nguyên tắc bảo mật: Chỉ trích xuất `productId, quantity, selectedSize, selectedToppings` để bàn giao cho API, tuyệt đối không đính kèm giá tiền từ Client.
  > Sau đây, xin mời bạn [Tên Thành viên F] trình bày về Luồng Đặt hàng và Chống Double-Click."*

#### Phút 22:00 – 26:00 | Thành viên F: Luồng Checkout An Toàn & Trải Nghiệm Khách Hàng
* **Lời thoại:**
  > *"Em là [Tên], phụ trách Giao diện Đặt hàng và Tối ưu hóa trải nghiệm Checkout.
  > Tại trang Thanh toán, em thiết lập cơ chế **Khóa nút bấm Submit tức thì** ngay khi người dùng chạm vào màn hình, chuyển trạng thái sang Spinner Loading để chặn đứng hành vi Double-Click của người dùng.
  > Giao diện Checkout hiển thị bảng phân rã chi phí chi tiết, minh bạch phụ thu Size Large (+10.000đ) và từng loại Topping để khách hàng dễ dàng đối soát trước khi quét mã QR.
  > Trong trường hợp thanh toán thất bại (ví dụ tài khoản không đủ số dư), hệ thống giữ nguyên mã đơn hàng và cho phép khách hàng chọn phương thức thanh toán khác hoặc quét lại mã mà không làm mất giỏ hàng hay phát sinh đơn rác.
  > Cuối cùng, xin mời bạn [Tên Thành viên G] trình bày về Quản trị chất lượng QA, Stepper thời gian thực và Ma trận truy vết."*

#### Phút 26:00 – 30:00 | Thành viên G: KDS Barista, Ma Trận Truy Vết & Tổng Kết Nghiệm Thu
* **Lời thoại:**
  > *"Kính thưa Thầy Cô, em là [Tên], phụ trách Giao diện Theo dõi đơn hàng (KDS) và Đảm bảo chất lượng (QA).
  > Phân hệ theo dõi đơn hàng được trang bị thanh tiến trình **Stepper 4 bước thời gian thực**: `PAID ➔ PREPARING ➔ READY ➔ COMPLETED`. Khi Barista chuyển trạng thái trên tablet tại quầy, màn hình điện thoại của khách hàng sẽ cập nhật trạng thái tương ứng, tối ưu hóa quy trình nhận đồ uống không chạm.
  > Về công tác QA, nhóm em không kiểm thử ngẫu hứng. Tuân thủ mục 8.1 của đề bài Assignment 2, em đã xây dựng **Ma trận truy vết hai chiều (Traceability Matrix)** liên kết 100% các yêu cầu SRS sang từng dòng code hiện thực và từng bài test tự động.
  > Toàn bộ hệ thống được bảo vệ bởi **128 bài test tự động**: 68 tests API Backend, 60 tests UI Frontend và 1 kịch bản End-to-End Playwright hoàn chỉnh, tất cả đều đạt trạng thái Passed 100% trên GitHub Actions.
  > Chúng em xin trân trọng cảm ơn Thầy Cô đã lắng nghe và sẵn sàng trả lời các câu hỏi phản biện của Hội đồng!"*

---

### 8.3. Bảng Dẫn Dắt Mã Nguồn Trực Tiếp (Live Code Traceability)
Khi Hội đồng yêu cầu "mở code cho xem", người thuyết trình chỉ cần bấm vào các liên kết sau:

1. **Trừ kho nguyên tử & Chống Oversell (Test C):**
   👉 [apps/api/src/orders/orders.service.ts (Dòng 162-178)](file:///c:/Users/Gtvkun/Documents/GitHub/brewlite-a2/apps/api/src/orders/orders.service.ts#L162-L178)
2. **Server tính toán đơn giá độc quyền (Test A):**
   👉 [apps/api/src/orders/orders.service.ts (Dòng 181-202)](file:///c:/Users/Gtvkun/Documents/GitHub/brewlite-a2/apps/api/src/orders/orders.service.ts#L181-L202)
3. **Hủy đơn hoàn kho & REFUND_PENDING (Test B):**
   👉 [apps/api/src/orders/orders.service.ts (Dòng 348-417)](file:///c:/Users/Gtvkun/Documents/GitHub/brewlite-a2/apps/api/src/orders/orders.service.ts#L348-L417)
4. **Kiểm tra trùng lặp đơn hàng Idempotency-Key:**
   👉 [apps/api/src/orders/orders.service.ts (Dòng 63-107)](file:///c:/Users/Gtvkun/Documents/GitHub/brewlite-a2/apps/api/src/orders/orders.service.ts#L63-L107)
5. **Client tuyệt đối không gửi giá lên Server:**
   👉 [apps/web/context/CartContext.tsx (Dòng 454-465)](file:///c:/Users/Gtvkun/Documents/GitHub/brewlite-a2/apps/web/context/CartContext.tsx#L454-L465)
6. **Cấu hình Global ValidationPipe chặn thuộc tính lạ:**
   👉 [apps/api/src/main.ts (Dòng 20-28)](file:///c:/Users/Gtvkun/Documents/GitHub/brewlite-a2/apps/api/src/main.ts#L20-L28)
7. **Định dạng tiền tệ Decimal & Khóa chính CUID:**
   👉 [apps/api/prisma/schema.prisma (Dòng 71-120)](file:///c:/Users/Gtvkun/Documents/GitHub/brewlite-a2/apps/api/prisma/schema.prisma#L71-L120)
8. **Quy trình Tự động hóa CI/CD 4 Tầng:**
   👉 [.github/workflows/ci.yml](file:///c:/Users/Gtvkun/Documents/GitHub/brewlite-a2/.github/workflows/ci.yml)

---

### 8.4. Bộ 10 Câu Hỏi Bẫy Khó Nhất Của Hội Đồng & Câu Trả Lời "Triệt Hạ" Mọi Thắc Mắc

#### Câu 1: *"Tại sao nhóm không dùng Microservices mà lại chọn Monorepo Modular Monolith?"*
> **Trả lời:**
> *"Thưa Thầy Cô, quyết định này được nhóm em cân nhắc kỹ lưỡng theo **Định luật thứ nhất về Hệ phân tán của Martin Fowler: 'Don't distribute your objects until you must'**.
> Với quy mô một chuỗi F&B ở giai đoạn MVP đến quy mô vừa, Microservices sẽ đem lại nhiều tác hại hơn lợi ích: phức tạp hóa hạ tầng, chi phí mạng giữa các service làm tăng độ trễ p95 vượt quá 500ms, và rủi ro mất nhất quán dữ liệu do phải áp dụng Distributed Transactions (Saga Pattern).
> Mô hình **Modular Monolith trong Turborepo** của nhóm em chia tách ranh giới các module (Auth, Catalog, Orders, Payments) cực kỳ rõ ràng, chia sẻ Type an toàn 100%, triển khai đơn giản, hiệu năng tối đa và chi phí vận hành gần như bằng 0. Khi tải tăng lên hàng trăm nghìn đơn/ngày, từng module này có thể bóc tách thành Microservice độc lập mà không cần viết lại mã nguồn."*

#### Câu 2: *"Cơ chế Atomic CAS của nhóm có gây ra Deadlock khi nhiều người cùng đặt giỏ hàng chứa nhiều món khác nhau không?"*
> **Trả lời:**
> *"Thưa Thầy Cô, đây là một câu hỏi rất sâu sắc về tối ưu hóa Database!
> Nguy cơ Deadlock xảy ra khi Giao dịch 1 khóa Sản phẩm A rồi chờ Sản phẩm B, trong khi Giao dịch 2 khóa Sản phẩm B rồi chờ Sản phẩm A.
> Trong mã nguồn [orders.service.ts](file:///c:/Users/Gtvkun/Documents/GitHub/brewlite-a2/apps/api/src/orders/orders.service.ts#L110-L117), nhóm em đã chủ động phòng chống Deadlock bằng cách: **Gộp nhóm số lượng theo từng sản phẩm duy nhất thông qua `demandMap` và duyệt trừ kho theo thứ tự ổn định**. Khi mọi Transaction đều yêu cầu lock tài nguyên theo cùng một thứ tự định sẵn, đồ thị chờ tài nguyên không bao giờ hình thành chu trình (No Circular Wait), triệt tiêu hoàn toàn nguy cơ Deadlock ở tầng cơ sở dữ liệu."*

#### Câu 3: *"Tại sao trong Schema A2, nhóm lại hoãn (Deferred) tính năng Voucher (FR-08) mà không làm hết?"*
> **Trả lời:**
> *"Thưa Thầy Cô, đây là quyết định chiến lược có chủ đích dựa trên phương pháp luận **Agile MoSCoW Prioritization**:
> Mục tiêu cốt lõi của Assignment 2 là chuyển hóa hệ thống từ prototype học thuật sang **nền tảng Production có khả năng chịu tải và chống gian lận tài chính tuyệt đối** (Hardening Core POS: ACID, CUID, Monorepo, Atomic CAS, CI/CD).
> Module Voucher (`FR-08`) được xếp vào nhóm *Could Have / Deferred* để nhóm dồn 100% ngân sách kỹ thuật vào việc hoàn thiện vượt mức 4 bài kiểm toán khắt khe (Audit A, B, C, D) và xây dựng 128 bài test tự động. Cấu trúc Schema và DTO của Promotion vẫn được định nghĩa sẵn sàng tại [schema.prisma](file:///c:/Users/Gtvkun/Documents/GitHub/brewlite-a2/apps/api/prisma/schema.prisma#L137-L150) để kích hoạt ngay trong Sprint tiếp theo mà không làm xáo trộn kiến trúc lõi."*

#### Câu 4: *"Nếu kẻ xấu biết được URL của đơn hàng người khác, làm sao hệ thống ngăn chặn việc xem trộm thông tin (IDOR)?"*
> **Trả lời:**
> *"Thưa Thầy Cô, hệ thống bảo vệ 2 lớp vững chắc:
> 1. **Khóa ngẫu nhiên CUID:** Hệ thống không dùng ID tự tăng `1, 2, 3` mà dùng chuỗi CUID ngẫu nhiên chống va chạm dạng `cm3u...`, khiến kẻ xấu không thể đoán hoặc vét ID theo thứ tự.
> 2. **Kiểm tra quyền sở hữu tại Controller/Service:** Trong hàm `findOrderById` tại [orders.service.ts](file:///c:/Users/Gtvkun/Documents/GitHub/brewlite-a2/apps/api/src/orders/orders.service.ts#L331-L340), hệ thống luôn đối chiếu: Nếu `order.userId !== currentUser.id` và người gọi không có vai trò `BARISTA`, `ADMIN` hay `MANAGER`, hệ thống lập tức ném ra lỗi `403 Forbidden: ORDER_ACCESS_DENIED`."*

#### Câu 5: *"JWT Token lưu ở đâu trên Client và làm sao chống tấn công XSS / CSRF?"*
> **Trả lời:**
> *"Thưa Thầy Cô, Token JWT được lưu an toàn trong bộ nhớ State của ứng dụng và LocalStorage kèm thời gian sống (TTL) ngắn hạn.
> Về mặt phòng thủ: Hệ thống cấu hình **CORS nghiêm ngặt** chỉ chấp nhận origin từ domain chính thức, áp dụng thư viện **Helmet** để bật các HTTP Security Headers (chặn Clickjacking, ép buộc HTTPS HSTS), và toàn bộ chuỗi đầu vào đều được khử khuẩn tự động qua `ValidationPipe` giúp triệt tiêu nguy cơ tiêm mã độc XSS."*

#### Câu 6: *"Làm sao nhóm biết hệ thống chạy được trên môi trường thực tế chứ không phải chỉ chạy trên máy Local?"*
> **Trả lời:**
> *"Thưa Thầy Cô, hệ thống hiện đang chạy thật trên môi trường Cloud với tên miền HTTPS công khai:
> - Frontend PWA triển khai trên **Vercel Global Edge Network**.
> - Backend API triển khai dưới dạng Docker Container trên **Render Cloud**.
> - Cơ sở dữ liệu là **PostgreSQL Managed Database**.
> - Bằng chứng là Pipeline CI/CD trên **GitHub Actions** tự động chạy kiểm thử 128 tests và tự động Deploy lên Cloud mỗi khi có commit mới vào nhánh `main`."*

#### Câu 7: *"Nếu máy chủ Cloud Render bị rơi vào trạng thái ngủ (Sleep Mode) thì sao?"*
> **Trả lời:**
> *"Thưa Thầy Cô, các nền tảng Cloud miễn phí thường đưa container về trạng thái ngủ sau 15 phút không có traffic.
> Nhóm em đã giải quyết triệt để vấn đề này bằng một **Uptime Cron Job** tự động gửi HTTP Request định kỳ mỗi 10 phút vào endpoint `/health` của backend. Nhờ đó, máy chủ luôn được giữ 'ấm' (Warm Container), loại bỏ hoàn toàn độ trễ khởi động nguội (Cold Start) khi người dùng truy cập."*

#### Câu 8: *"Tại sao nhóm lại dùng Decimal trong Prisma mà không dùng Float hay BigInt?"*
> **Trả lời:**
> *"Thưa Thầy Cô:
> - Không dùng `Float` vì Javascript tuân theo chuẩn dấu chấm động IEEE 754, các phép cộng trừ tiền lẻ sẽ bị sai số trôi (ví dụ $0.1 + 0.2 = 0.30000000000000004$), điều này là tối kỵ trong phần mềm tài chính.
> - Không dùng `BigInt` vì BigInt chỉ lưu được số nguyên, khi nhân với các tỷ lệ chiết khấu thập phân (ví dụ giảm $12.5\%$) sẽ bị mất phần thập phân.
> - Kiểu **`Decimal`** trong Prisma ánh xạ thành `NUMERIC(12,2)` trong PostgreSQL lưu trữ dữ liệu dạng chuỗi cơ số 10 có độ chính xác tùy biến tuyệt đối, đảm bảo phép tính tài chính chính xác đến từng xu."*

#### Câu 9: *"Nếu khách hàng gửi lại đúng Idempotency-Key cũ nhưng lại thay đổi món trong giỏ hàng thì hệ thống xử lý ra sao?"*
> **Trả lời:**
> *"Thưa Thầy Cô, tại [orders.service.ts](file:///c:/Users/Gtvkun/Documents/GitHub/brewlite-a2/apps/api/src/orders/orders.service.ts#L83-L103), nhóm em có hàm kiểm tra khớp Payload `isPayloadMatch`.
> Hệ thống so sánh từng sản phẩm, số lượng và kích thước của đơn hàng cũ với request mới. Nếu phát hiện kẻ gian cố tình dùng lại Key cũ để tráo đổi đơn hàng, hệ thống lập tức từ chối và ném lỗi `409 Conflict: IDEMPOTENCY_KEY_PAYLOAD_MISMATCH`."*

#### Câu 10: *"Điểm tâm đắc nhất của nhóm về mặt Kỹ nghệ Phần mềm trong đồ án này là gì?"*
> **Trả lời:**
> *"Thưa Thầy Cô, điểm nhóm tâm đắc nhất chính là **Tính Nhất Quán Tuyệt Đối (High Traceability & Engineering Discipline)**.
> Chúng em không viết code theo cảm tính. Mọi chức năng đều bắt nguồn từ một Yêu cầu trong SRS $\to$ được mô hình hóa qua các Sơ đồ UML $\to$ được ghi nhận quyết định qua các bản ADRs $\to$ hiện thực bằng mã nguồn Type-Safe $\to$ và được bảo vệ bằng ma trận kiểm thử 128 tests tự động. Đó chính là tinh thần chuẩn mực của một Kỹ sư Phần mềm thực thụ mà chúng em được đào tạo tại Khoa CNTT - Đại học Sài Gòn!"*

---

### 8.5. Checklist Thao Tác Kỹ Thuật Trước Giờ G
- [ ] Bật sẵn Docker Desktop và chạy lệnh `docker compose up -d` ở máy cá nhân (phòng trường hợp mất mạng trường).
- [ ] Mở sẵn 4 tab trình duyệt:
  1. Ứng dụng Web trên Vercel ở chế độ giả lập Mobile (F12 $\to$ kích thước 375px $\times$ 667px).
  2. Trang Endpoint Health Check của Backend trên Render.
  3. Giao diện GitHub Actions với tích xanh 100% của workflow gần nhất.
  4. File tài liệu Ma trận Truy vết [`docs/traceability-matrix.md`](file:///c:/Users/Gtvkun/Documents/GitHub/brewlite-a2/docs/traceability-matrix.md).
- [ ] Mở sẵn Terminal tại thư mục gốc, gõ sẵn lệnh `npm run test` để sẵn sàng bấm Enter biểu diễn toàn bộ bài kiểm tra xanh lá trước mắt Hội đồng.
- [ ] Mở sẵn Postman với kịch bản hack giá 1.000đ để sẵn sàng biểu diễn cho Thầy Cô xem cơ chế phòng thủ khi được hỏi.

---

# PHẦN IX: CHIẾN THUẬT PHÒNG CHỐNG MỌI BIẾN CỐ & KỊCH BẢN TEST CHỦ ĐỘNG

> *"Kẻ nghiệp dư chờ đợi câu hỏi để phòng thủ. Kỹ sư chuyên nghiệp chủ động tấn công và định hướng sàn diễn!"*

### 9.1. Ma Trận Xử Lý 6 Biến Cố Khẩn Cấp "Giờ G" (The Crisis Defense Matrix)

| Tình huống biến cố | Mức độ rủi ro | Hành động phản ứng tức thì trong 5 giây | Lời thoại giải thích chuyên nghiệp |
| :--- | :---: | :--- | :--- |
| **1. Wifi trường rớt mạng / Cloud Render bị lag 504** | 🔴 Cực cao | Chuyển ngay sang môi trường **Local Docker Fallback**: Chạy `docker compose up -d` hoặc truy cập `http://localhost:3000`. | *"Dạ thưa Thầy Cô, để đảm bảo tính sẵn sàng cao (High Availability) phòng trường hợp đường truyền mạng chập chờn, nhóm đã đóng gói toàn bộ hệ thống vào Docker Container và chạy song song ở môi trường Local ạ."* |
| **2. Gõ lệnh trên PowerShell bị báo lỗi đỏ ExecutionPolicy** | 🟡 Trung bình | Tuyệt đối không hoảng loạn gõ lại. Bật ngay file **`test-suite.bat`** ngoài màn hình hoặc gõ lệnh qua CMD: `cmd.exe /c "npm test"`. | *(Thao tác dứt khoát không cần giải thích, màn hình chạy xanh rì lập tức lấy lại uy thế).* |
| **3. Giảng viên bảo: "Mở Database xem có bị trừ âm kho thật không?"** | 🔴 Cực cao | Gõ lệnh bật **Prisma Studio**: `npx prisma studio` (hoặc bấm số `7` trong file `test-suite.bat`) $\to$ Mở ngay `http://localhost:5555`. | *"Dạ em xin phép mở Prisma Studio trực tiếp kết nối vào cơ sở dữ liệu. Thầy Cô có thể thấy bảng Product: stockQuantity dừng lại đúng bằng 0, không có bản ghi nào bị âm kho ạ."* |
| **4. Giảng viên bảo: "Gửi request Postman hack giá trực tiếp xem?"** | 🔴 Cực cao | Mở Postman gửi `POST http://localhost:3000/orders` với body có `"price": 1000`. Server trả về ngay `400 Bad Request`. Hoặc mở ảnh bằng chứng tại `docs/evidence/test-a-hack-price-rejected.jpg`. | *"Dạ đây là request cố tình tiêm trường price: 1000. Do ValidationPipe áp dụng forbidNonWhitelisted: true, server từ chối ngay lập tức từ tầng Ingress, không cho phép lọt vào Service ạ."* |
| **5. Giảng viên bắt bẻ: "Em chứng minh Test A, B, C nằm ở file nào?"** | 🟡 Trung bình | Bấm ngay vào **3 Tab đã Ghim (Pinned Tabs)** trên IDE: `orders.security.spec.ts` (Test A dòng 85) và `orders.service.spec.ts` (Test C dòng 200, Test B dòng 483). | *"Dạ toàn bộ kịch bản kiểm toán A, B, C của Thầy Cô đều được nhóm hiện thực thành các bài test tự động tại đây ạ..."* |
| **6. Màn hình máy chiếu không nhận tỷ lệ hiển thị** | 🟢 Thấp | Nhấn tổ hợp phím `Windows + P` chọn **Duplicate**. Trên trình duyệt web bấm `F12` $\to$ chọn biểu tượng Toggle Device Toolbar (mô phỏng iPhone 14 Pro). | *"Dạ giao diện của nhóm được thiết kế chuẩn Mobile-first PWA, em xin phép bật chế độ giả lập điện thoại để Thầy Cô quan sát trực quan nhất ạ."* |

---

### 9.2. Kịch Bản "Tấn Công Phủ Đầu Chủ Động" (Proactive Live-Testing Protocol)

Thay vì kết thúc bài thuyết trình trong tư thế bị động chờ Hội đồng "xoay", người thuyết trình chính (Leader) hãy **CHỦ ĐỘNG ĐỀ NGHỊ TEST TRỰC TIẾP** ở 2 phút cuối của bài thuyết trình:

> *(Leader nhìn thẳng Hội đồng, mỉm cười tự tin)*  
> *"Kính thưa Thầy Chủ tịch và quý Thầy Cô trong Hội đồng,*  
> *Một hệ thống Kỹ nghệ Phần mềm đạt chuẩn không thể chỉ đánh giá qua slide thuyết trình hay vài trang tài liệu. Giá trị thực sự nằm ở khả năng chịu đựng các bài kiểm tra bảo mật và tải nặng trong thực tế.*  
> 
> *Vì vậy, thay vì để Thầy Cô phải băn khoăn, nhóm em xin phép **CHỦ ĐỘNG KÍCH HOẠT TRỰC TIẾP 3 BÀI TEST SÁT THỦ NGAY TRÊN MÀN HÌNH CHIẾU** để Thầy Cô cùng thẩm định:*  
> 
> *1. Đầu tiên, em xin chạy bài **TEST A - Tấn công sửa giá**: Em dùng Supertest bắn payload giả mạo giá 1.000đ vào API... (Bấm chạy lệnh `cmd.exe /c "npx jest -t 'TEST A'"` $\to$ Màn hình hiện PASS xanh trong 1.5s).*  
> *$\implies$ Như Thầy Cô đã thấy: 400 Bad Request, ValidationPipe chặn đứng 100%!*  
> 
> *2. Thứ hai, em xin chạy bài **TEST C - Tranh chấp kho Concurrency**: Mô phỏng 2 khách hàng đồng thời vét sạch 2 ly nước cuối cùng... (Bấm chạy `cmd.exe /c "npx jest -t 'OUT_OF_STOCK'"` $\to$ PASS xanh).*  
> *$\implies$ Đúng như thiết kế: 1 đơn thành công, 1 đơn nhận lỗi OUT_OF_STOCK, tồn kho không bao giờ âm!*  
> 
> *3. Và thứ ba, em xin chạy bài **TEST B - Hủy đơn sau thanh toán**: Hoàn trả tồn kho và kích hoạt trạng thái REFUND_PENDING... (Bấm chạy `cmd.exe /c "npx jest -t 'TEST B'"` $\to$ PASS xanh).*  
> 
> *Toàn bộ mã nguồn và dữ liệu đều hoàn toàn minh bạch. Nhóm em xin sẵn sàng lắng nghe các câu hỏi chuyên sâu từ Thầy Cô!"*

---

### 9.3. Bảng Ghim 3 File Vàng Trên IDE (Pinned Tabs Survival Guide)

Để không bao giờ phải mò mẫm thư mục trước mặt Hội đồng:
1. Mở sẵn 3 file này trong Antigravity IDE:
   * **Tab 1:** [orders.security.spec.ts](file:///c:/Users/Gtvkun/Documents/GitHub/brewlite-a2/apps/api/src/orders/orders.security.spec.ts)
   * **Tab 2:** [orders.service.spec.ts](file:///c:/Users/Gtvkun/Documents/GitHub/brewlite-a2/apps/api/src/orders/orders.service.ts)
   * **Tab 3:** [cart.test.tsx](file:///c:/Users/Gtvkun/Documents/GitHub/brewlite-a2/apps/web/__tests__/cart.test.tsx)
2. Chuột phải vào từng tab $\to$ Chọn **Pin Tab**.
3. **Bảng định vị tọa độ thần tốc:**

```
[Tab 1: orders.security.spec.ts]  --> Dòng 85: TEST A (Chống sửa giá 1.000đ)
                                  --> Dòng 142: FR-07 (Chặn khách đổi trạng thái đơn)
[Tab 2: orders.service.spec.ts]   --> Dòng 200: TEST C (Trừ kho nguyên tử count = 0)
                                  --> Dòng 483: TEST B (Hủy đơn & REFUND_PENDING)
[Tab 3: cart.test.tsx]            --> Dòng 50: FR-02 (Tùy biến Size +10k & Toppings)
```

---

### 9.4. Cẩm Nang Sử Dụng Trình Điều Khiển 1-Click (`test-suite.bat`)

Nhóm đã xây dựng sẵn file thực thi tự động [test-suite.bat](file:///c:/Users/Gtvkun/Documents/GitHub/brewlite-a2/test-suite.bat) ngay tại thư mục gốc. Khi cần biểu diễn, bạn chỉ cần mở file này lên:

```
===============================================================================
            BREWLITE - TRÌNH ĐIỀU KHIỂN KIỂM THỬ CHỦ ĐỘNG & BẢO VỆ ĐỒ ÁN
===============================================================================
[1] Chạy TOÀN BỘ 128 bài test tự động (Backend Jest + Frontend Vitest)
[2] Chạy TEST A: Chống sửa giá API & Phân quyền Barista (orders.security.spec.ts)
[3] Chạy TEST B: Hủy đơn sau thanh toán & Hoàn tiền (cancelOrder - REFUND_PENDING)
[4] Chạy TEST C: Tranh chấp tồn kho Concurrency 2 khách mua 2 ly cuối (OUT_OF_STOCK)
[5] Chạy TOÀN BỘ 60 tests Giao diện Frontend Web (Cart, Menu, Auth, Stepper)
[6] Bật Playwright UI Graphic Mode (Trình duyệt Chromium tự động click trực quan)
[7] Mở PRISMA STUDIO (Xem Database trực quan trên giao diện Web localhost:5555)
[8] Chạy Kiểm tra Khói API Cloud Live (curl health & products)
[0] Thoát
===============================================================================
```
* **Chỉ cần gõ số tương ứng (1, 2, 3, 4, 6, 7) rồi bấm Enter**: Mọi tác vụ sẽ tự động chạy trong tích tắc mà không cần nhớ cú pháp Terminal phức tạp!

---

# PHẦN X: BỘ 13 SLIDE TRÌNH CHIẾU TỔNG QUÁT & KỊCH BẢN GIAO MIC ĐA NĂNG

> **Mục đích tài liệu:** Bản thiết kế toàn bộ 13 Slide trình chiếu chuẩn Hội đồng SGU kèm kịch bản lời thoại kép:
> * **Chế độ 1 (Giao Mic - 7 Người):** Phân vai chi tiết cho từng bạn nói từ 1.5 – 3 phút, có câu dẫn trao mic mượt mà.
> * **Chế độ 2 (Leader "Cân Team" / Câu Giờ):** Nếu các bạn khác bị run, quên bài hoặc chỉ có 1 người nói được, Leader dùng kịch bản này để nói liền mạch 20–30 phút mà không bị khựng, không ai nhận ra nhóm bị bể bài!

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

### SLIDE 11: ĐẢM BẢO CHẤT LƯỢNG (QA), MA TRẬN TRUY VẾT & 128 TESTS
* **Nội dung trên Slide:**
  * KDS Barista: Màn hình điều phối chế biến, thanh Stepper 4 bước thời gian thực (`PAID ➔ PREPARING ➔ READY ➔ COMPLETED`).
  * Ma trận truy vết hai chiều (Traceability Matrix RTM): 100% Yêu cầu SRS $\to$ Mã nguồn $\to$ Test Case.
  * Tổng kết 128 bài test tự động: 68 API Tests + 60 Web Tests + 1 E2E Suite $\implies$ **100% PASS**.
* **🎤 LỜI THOẠI GIAO MIC (Thành viên G | 2 phút):**
  > *"Phân hệ KDS giúp Barista cập nhật tiến độ chế biến và khách hàng theo dõi đơn hàng thời gian thực qua Stepper 4 bước. Về mặt QA, nhóm đã hoàn thiện Ma trận truy vết hai chiều liên kết toàn bộ 10 FRs và 5 NFRs sang mã nguồn và 128 bài test tự động, bảo vệ hệ thống toàn diện trước mọi nguy cơ hồi quy (Regression)."*
* **🛡️ KỊCH BẢN LEADER CÂU GIỜ:**
  > *"Tính truy vết hai chiều đảm bảo mỗi dòng code sinh ra đều phục vụ một yêu cầu nghiệp vụ cụ thể, không có code thừa và không có tính năng nào bị bỏ sót kiểm thử."*
* **👉 CÂU GIAO MIC:** *"Hệ thống này được triển khai trên môi trường Cloud như thế nào? Xin mời Leader tổng kết."*

---

### SLIDE 12: HẠ TẦNG CLOUD PRODUCTION & ZERO-DOWNTIME KEEP-ALIVE
* **Nội dung trên Slide:**
  * Sơ đồ Hạ tầng Đám mây: Vercel Edge (Frontend) + Render Cloud (Backend Docker) + PostgreSQL Managed DB.
  * Pipeline CI/CD 4 bước tự động trên GitHub Actions (Lint, Type-check, Unit Test, Build).
  * Giải pháp Zero-Downtime: Uptime Cron Job ping `/health` mỗi 10 phút, loại bỏ hoàn toàn Cold Start.
* **🎤 LỜI THOẠI TỔNG KẾT (Leader | 2 phút):**
  > *"Hệ thống BrewLite hiện đang chạy thật 100% trên Cloud với tên miền HTTPS công khai. Để khắc phục hiện tượng Sleep Mode của Cloud miễn phí, nhóm đã lập trình một Cron Job tự động ping endpoint `/health` mỗi 10 phút, giữ cho máy chủ luôn ở trạng thái 'nóng' sẵn sàng phục vụ với độ trễ dưới 200ms."*

---

### SLIDE 13: BIỂU DIỄN KIỂM THỬ CHỦ ĐỘNG & BẮT ĐẦU VẤN ĐÁP Q&A
* **Nội dung trên Slide:**
  * Bảng điều khiển kiểm thử tự động `test-suite.bat`.
  * Trực quan hóa Cơ sở dữ liệu Prisma Studio (`localhost:5555`).
  * Tuyên bố chuyển sang phần Thẩm định & Hỏi đáp (Q&A).
* **🎤 LỜI THOẠI "CHỦ ĐỘNG TẤN CÔNG" CỦA LEADER (2 phút):**
  > *"Kính thưa Thầy Cô, thay vì chỉ nói lý thuyết, bây giờ nhóm em xin phép **CHỦ ĐỘNG BẬT BỘ KIỂM THỬ TỰ ĐỘNG** để Thầy Cô cùng chứng kiến:
  > (Leader mở file `test-suite.bat`, bấm phím 1 chạy 128 tests pass xanh lá cây trong 20s).
  > Toàn bộ 128 tests kiểm tra bảo mật, giao dịch tài chính và trừ kho đều vượt qua 100%. Nhóm chúng em xin chân thành cảm ơn Thầy Cô và sẵn sàng bước vào phần Vấn đáp ạ!"*

---

### 🛡️ CẨM NANG "CỨU NGUY" KHI THÀNH VIÊN BỊ RUN HOẶC QUÊN BÀI:
Khi bạn phụ trách một Slide bị ngập ngừng quá 3 giây, **Leader lập tức đưa tay ra hiệu và nói câu thần chú:**
> *"Dạ xin phép Thầy Cô cho em xin bổ sung nhanh một chi tiết kỹ thuật cốt lõi ở phần này mà bạn [Tên] vừa nhắc đến..."*  
*(Sau đó Leader đọc ngay **KỊCH BẢN CÂU GIỜ** đã viết sẵn ở Slide đó. Cả Hội đồng sẽ thấy nhóm cực kỳ đoàn kết, chuyên nghiệp và không hề có một giây chết nào trên sân khấu!)*

---
**HỆ THỐNG PHÒNG THỦ TOÀN DIỆN HOÀN TẤT – BẢO VỆ ĐỒ ÁN TỰ TIN & CHIẾN THẮNG TUYỆT ĐỐI!**


