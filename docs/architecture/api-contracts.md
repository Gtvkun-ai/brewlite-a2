# Hợp đồng Giao diện Lập trình Ứng dụng (API Contracts) & Shared Types

> **Dự án:** BrewLite – Assignment 2 (Requirements to Deployment)  
> **Phiên bản:** 1.0.0 (Chốt bởi Tech Lead A – A-00)  
> **Ngày phê duyệt:** 04/11/2026 (Hiệu lực: Sprint 2 đến kỳ bàn giao 13/11/2026)  
> **Tài liệu tham chiếu:** SRS (`docs/requirements/srs.md`), Task 1.3 (`docs/requirements/use-case-checkout.md`), Class Diagram (`docs/diagrams/class-domain.puml`).

---

## 1. Quyết định Kiến trúc Trọng tâm (Architectural Decisions)

### 1.1. Luồng Đặt hàng và Thanh toán 2 bước (Decoupled Checkout Flow)
* **Vấn đề phát hiện:** Bản đặc tả ban đầu `use-case-checkout.md` mô tả gộp `POST /orders/checkout` trong 1 transaction bao trùm cả gọi cổng thanh toán. Điều này vi phạm nguyên tắc phân tách trách nhiệm (Separation of Concerns) và gây lock tài nguyên database kéo dài khi cổng thanh toán phản hồi chậm.
* **Quyết định chính thức:** Phân tách thành **2 endpoint độc lập**:
  1. `POST /orders`: Tạo đơn hàng ở trạng thái `PENDING`, tính giá phía server, và **tạm giữ tồn kho (Reservation)** bằng atomic update trong `prisma.$transaction`.
  2. `POST /payments`: Thực hiện thanh toán qua cổng mô phỏng với header `Idempotency-Key`.
* **Cơ chế bù trừ (Compensation / Reversal):**
  * Nếu thanh toán **SUCCESS**: Cập nhật `Payment` $\rightarrow$ `SUCCESS`, `Order` $\rightarrow$ `PAID`. Giữ nguyên việc trừ tồn kho.
  * Nếu thanh toán **FAILED**: Cập nhật `Payment` $\rightarrow$ `FAILED`, `Order` $\rightarrow$ `PAYMENT_FAILED`. **Tự động hoàn kho (Compensation):** cộng lại số lượng `stockQuantity` cho các sản phẩm trong đơn trong cùng transaction. Giữ nguyên giỏ hàng ở Client để khách hàng có thể chọn phương thức khác hoặc thử lại.

### 1.2. Chuẩn hóa Enum & Kiểu Dữ liệu Wire
* **Role:** `CUSTOMER`, `BARISTA`, `MANAGER`, `ADMIN`. (Đăng ký công khai mặc định là `CUSTOMER`).
* **OrderStatus:** `PENDING`, `PAID`, `PREPARING`, `READY`, `COMPLETED`, `CANCELLED`, `PAYMENT_FAILED`.
* **PaymentStatus:** `PENDING`, `SUCCESS`, `FAILED`, `REFUNDED`.
* **PaymentMethod:** `E_WALLET`, `CREDIT_CARD`, `DOMESTIC_ATM`, `CASH`. (Bản online hỗ trợ `E_WALLET`, `CREDIT_CARD`, `DOMESTIC_ATM` qua mock gateway).
* **Kiểu tiền tệ trên Wire:** Chuỗi số nguyên VNĐ (định dạng String hoặc Number chuẩn không phần thập phân, ví dụ `"45000"` hoặc `45000`). Tuyệt đối không dùng số thực thả nổi (floating-point).

### 1.3. Bảng phụ thu Size & Topping
* **Size:**
  * `REGULAR` (Size M / Tiêu chuẩn): `+0đ`
  * `LARGE` (Size L / Lớn): `+10,000đ`
* **Topping:**
  * `TRAN_CHAU` (Trân châu đen): `+5,000đ`
  * `KEM_CHEESE` (Kem Cheese Macchiato): `+10,000đ`
  * `THACH_DAO` (Thạch đào): `+7,000đ`
* **Công thức đơn giá phía Server (Server-authoritative Pricing):**
  $$\text{unitPrice} = \text{basePrice} + \text{sizeSurcharge} + \sum \text{toppingSurcharge}$$
  $$\text{itemTotal} = \text{unitPrice} \times \text{quantity}$$
  $$\text{totalAmount} = \sum \text{itemTotal} - \text{discountAmount}$$
  *(Phạm vi bàn giao 13/11: $\text{discountAmount} = 0$, chức năng Promotion FR-08 được đánh dấu DEFERRED).*

---

## 2. Đặc tả Chi tiết các API Endpoints

### 2.1. Module Catalog (Sản phẩm & Menu - FR-01, FR-02)

#### `GET /products`
* **Mô tả:** Lấy danh sách toàn bộ sản phẩm đang kinh doanh (`isAvailable = true`).
* **Auth:** Public.
* **Response 200 OK:**
  ```json
  [
    {
      "id": "cly1234567890",
      "code": "CF-MILK",
      "name": "Cà phê sữa đá",
      "description": "Cà phê Robusta đậm đà pha phin truyền thống kết hợp sữa đặc ngọt béo.",
      "basePrice": "35000",
      "imageUrl": "/img/caphesua.jpg",
      "category": "COFFEE",
      "isAvailable": true,
      "stockQuantity": 100
    }
  ]
  ```

#### `GET /products/:id`
* **Mô tả:** Xem chi tiết một sản phẩm theo ID.
* **Auth:** Public.
* **Response 200 OK:** Trả về đối tượng sản phẩm như trên.
* **Response 404 Not Found:** `{"statusCode": 404, "errorCode": "PRODUCT_NOT_FOUND", "message": "Không tìm thấy sản phẩm"}`.

---

### 2.2. Module Auth (Xác thực & Bảo mật - FR-04 - Owner: Người B)

#### `POST /auth/register`
* **Mô tả:** Đăng ký tài khoản khách hàng mới. Mật khẩu được băm bằng `bcrypt` (salt rounds = 10).
* **Auth:** Public.
* **Request Body:**
  ```json
  {
    "email": "customer@brewlite.vn",
    "password": "Password123!",
    "fullName": "Nguyễn Văn A",
    "phone": "0901234567"
  }
  ```
* **Response 201 Created:**
  ```json
  {
    "id": "usr_cly123",
    "email": "customer@brewlite.vn",
    "fullName": "Nguyễn Văn A",
    "role": "CUSTOMER"
  }
  ```
  *(Lưu ý bảo mật: Tuyệt đối KHÔNG trả về `passwordHash`).*
* **Response 409 Conflict:** `{"statusCode": 409, "errorCode": "EMAIL_ALREADY_EXISTS", "message": "Email đã được đăng ký"}`.

#### `POST /auth/login`
* **Mô tả:** Đăng nhập xác thực và nhận JWT Bearer Token.
* **Auth:** Public.
* **Request Body:**
  ```json
  {
    "email": "customer@brewlite.vn",
    "password": "Password123!"
  }
  ```
* **Response 200 OK:**
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "usr_cly123",
      "email": "customer@brewlite.vn",
      "fullName": "Nguyễn Văn A",
      "role": "CUSTOMER"
    }
  }
  ```
* **JWT Payload Specification (`UserPayload`):**
  ```json
  {
    "sub": "usr_cly123",
    "email": "customer@brewlite.vn",
    "fullName": "Nguyễn Văn A",
    "role": "CUSTOMER",
    "iat": 1730700000,
    "exp": 1730786400
  }
  ```
* **Response 401 Unauthorized:** `{"statusCode": 401, "errorCode": "INVALID_CREDENTIALS", "message": "Sai email hoặc mật khẩu"}`.

---

### 2.3. Module Orders (Tạo đơn & Quản lý đơn - FR-05, FR-06, FR-07 - Owner: Người C)

#### `POST /orders`
* **Mô tả:** Khách hàng tạo đơn hàng từ giỏ hàng. Server kiểm tra tồn kho, trừ tồn kho và ghi nhận đơn hàng `PENDING` trong một atomic transaction.
* **Auth:** Yêu cầu JWT (`Bearer <token>`).
* **Headers:** `Idempotency-Key: <UUID-v4>` (Khuyến nghị).
* **Request Body (`CreateOrderDto`):**
  ```json
  {
    "deliveryNote": "Giao tại bàn số 4",
    "items": [
      {
        "productId": "cly1234567890",
        "quantity": 2,
        "selectedSize": "LARGE",
        "selectedToppings": ["TRAN_CHAU"]
      }
    ]
  }
  ```
* **Response 201 Created (`OrderResponse`):**
  ```json
  {
    "id": "ord_cly999",
    "code": "BL-20261104-001",
    "status": "PENDING",
    "subTotal": "100000",
    "discountAmount": "0",
    "totalAmount": "100000",
    "deliveryNote": "Giao tại bàn số 4",
    "createdAt": "2026-11-04T09:00:00.000Z",
    "items": [
      {
        "id": "item_1",
        "productId": "cly1234567890",
        "productName": "Cà phê sữa đá",
        "quantity": 2,
        "unitPrice": "50000",
        "selectedSize": "LARGE",
        "selectedToppings": ["TRAN_CHAU"],
        "itemTotal": "100000"
      }
    ]
  }
  ```
* **Lỗi có thể trả về:**
  * `400 Bad Request`: `{"errorCode": "OUT_OF_STOCK", "message": "Sản phẩm Cà phê sữa đá không đủ tồn kho"}`.
  * `400 Bad Request`: `{"errorCode": "INVALID_ITEM_CONFIG", "message": "Tùy chọn size hoặc topping không hợp lệ"}`.
  * `401 Unauthorized`: Chưa truyền token hợp lệ.

#### `GET /orders`
* **Mô tả:** Lấy danh sách lịch sử đơn hàng của chính người dùng đang đăng nhập (Sắp xếp mới nhất trước).
* **Auth:** Yêu cầu JWT.
* **Response 200 OK:** Mảng danh sách các `OrderResponse`.

#### `GET /orders/:id`
* **Mô tả:** Xem chi tiết một đơn hàng. Kiểm tra nghiêm ngặt: User chỉ được xem đơn hàng do chính mình tạo (trừ Role `BARISTA`/`ADMIN`).
* **Auth:** Yêu cầu JWT.
* **Response 200 OK:** Trả về đối tượng `OrderResponse`.
* **Response 403 Forbidden:** `{"errorCode": "ORDER_ACCESS_DENIED", "message": "Bạn không có quyền xem đơn hàng này"}`.

#### `PATCH /orders/:id/status`
* **Mô tả:** Nhân viên cập nhật trạng thái chế biến đơn hàng (FR-07).
* **Auth:** Yêu cầu JWT (Role `BARISTA`, `MANAGER`, `ADMIN`).
* **State Machine hợp lệ:**
  * `PAID` $\rightarrow$ `PREPARING` $\rightarrow$ `READY` $\rightarrow$ `COMPLETED`.
  * `PENDING` / `PAID` $\rightarrow$ `CANCELLED`.
* **Request Body:** `{"status": "PREPARING"}`.
* **Response 200 OK:** Trả về đối tượng `Order` sau khi cập nhật.
* **Response 400 Bad Request:** `{"errorCode": "INVALID_STATE_TRANSITION", "message": "Không thể chuyển trạng thái từ PENDING sang COMPLETED"}`.

---

### 2.4. Module Payments (Thanh toán mô phỏng & Idempotency - FR-05 - Owner: Người D)

#### `POST /payments`
* **Mô tả:** Khách hàng thực hiện thanh toán cho một đơn hàng đang `PENDING`.
* **Auth:** Yêu cầu JWT.
* **Headers bắt buộc:** `Idempotency-Key: <UUID-v4>`.
* **Request Body (`PaymentRequest`):**
  ```json
  {
    "orderId": "ord_cly999",
    "method": "E_WALLET",
    "accountRef": "0901234567"
  }
  ```
  *(Quy ước Mock Gateway: Nếu `accountRef` kết thúc bằng `0000`, hệ thống sẽ giả lập thanh toán THẤT BẠI để phục vụ kiểm thử và demo).*
* **Quy tắc Idempotency:**
  1. Nếu request tới kèm `Idempotency-Key` đã được xử lý trước đó với **cùng payload**:
     $\rightarrow$ Trả về ngay kết quả cũ (HTTP 200 OK), không thực hiện trừ tiền hay gọi gateway lần hai.
  2. Nếu request tới kèm `Idempotency-Key` đã tồn tại nhưng **khác payload**:
     $\rightarrow$ Ném lỗi `409 Conflict` (`{"errorCode": "IDEMPOTENCY_KEY_PAYLOAD_MISMATCH"}`).
  3. Nếu đơn hàng đã ở trạng thái `PAID`:
     $\rightarrow$ Chặn lại, ném lỗi `400 Bad Request` (`{"errorCode": "ORDER_ALREADY_PAID"}`).
* **Response 200/201 (Thành công):**
  ```json
  {
    "paymentId": "pay_cly111",
    "orderId": "ord_cly999",
    "status": "SUCCESS",
    "orderStatus": "PAID",
    "amount": "100000",
    "method": "E_WALLET",
    "transactionRef": "TX-1730701234",
    "createdAt": "2026-11-04T09:01:00.000Z"
  }
  ```
* **Response 200/201 (Thất bại - Giả lập):**
  ```json
  {
    "paymentId": "pay_cly112",
    "orderId": "ord_cly999",
    "status": "FAILED",
    "orderStatus": "PAYMENT_FAILED",
    "amount": "100000",
    "method": "E_WALLET",
    "message": "Tài khoản không đủ số dư hoặc giao dịch bị từ chối"
  }
  ```
  *(Khi thất bại, Backend tự động kích hoạt Compensation hoàn trả lại số lượng tồn kho cho đơn hàng).*

---

### 2.5. Module Health Check (NFR-04 - Owner: Người D)

#### `GET /health`
* **Mô tả:** Endpoint kiểm tra sức khỏe của API server và kết nối Database (Readiness Probe cho Docker/Production).
* **Auth:** Public.
* **Response 200 OK (Khỏe mạnh):**
  ```json
  {
    "status": "ok",
    "timestamp": "2026-11-04T09:05:00.000Z",
    "uptime": 124.5,
    "database": {
      "status": "up"
    }
  }
  ```
* **Response 503 Service Unavailable (Khi mất kết nối PostgreSQL):**
  ```json
  {
    "status": "error",
    "timestamp": "2026-11-04T09:05:00.000Z",
    "database": {
      "status": "down",
      "error": "Connection to PostgreSQL failed"
    }
  }
  ```

---

## 3. Khai báo TypeScript Shared Types (Dùng chung Frontend & Backend)

Tất cả các thành viên B, C, D, E, F, G bắt buộc tuân thủ đúng các kiểu dữ liệu dưới đây:

```typescript
// Định nghĩa Enums chuẩn
export type Role = 'CUSTOMER' | 'BARISTA' | 'MANAGER' | 'ADMIN';

export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'PAYMENT_FAILED';

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export type PaymentMethod = 'E_WALLET' | 'CREDIT_CARD' | 'DOMESTIC_ATM' | 'CASH';

export type ItemSize = 'REGULAR' | 'LARGE';

export type ToppingCode = 'TRAN_CHAU' | 'KEM_CHEESE' | 'THACH_DAO';

// User & Auth
export interface UserPayload {
  sub: string;
  email: string;
  fullName: string;
  role: Role;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: Role;
  };
}

// Cart & Pricing
export interface CartItem {
  productId: string;
  name: string;
  basePrice: string; // Chuỗi số nguyên VNĐ
  size: ItemSize;
  toppings: ToppingCode[];
  quantity: number;
  unitPrice: string; // basePrice + sizeSurcharge + toppings
  itemTotal: string; // unitPrice * quantity
  imageUrl?: string;
}

// Order DTOs
export interface CreateOrderItemDto {
  productId: string;
  quantity: number;
  selectedSize: ItemSize;
  selectedToppings: ToppingCode[];
}

export interface CreateOrderRequest {
  deliveryNote?: string;
  items: CreateOrderItemDto[];
}

export interface OrderItemResponse {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: string;
  selectedSize: ItemSize;
  selectedToppings: ToppingCode[];
  itemTotal: string;
}

export interface OrderResponse {
  id: string;
  code: string;
  status: OrderStatus;
  subTotal: string;
  discountAmount: string;
  totalAmount: string;
  deliveryNote?: string;
  createdAt: string;
  items: OrderItemResponse[];
}

// Payment DTOs
export interface PaymentRequest {
  orderId: string;
  method: PaymentMethod;
  accountRef?: string;
}

export interface PaymentResponse {
  paymentId: string;
  orderId: string;
  status: PaymentStatus;
  orderStatus: OrderStatus;
  amount: string;
  method: PaymentMethod;
  transactionRef?: string;
  message?: string;
}
```

---

## 4. Định nghĩa Mã Lỗi Ổn định (Standard Error Codes)

Client sẽ dựa vào trường `errorCode` để hiển thị giao diện phù hợp thay vì parse chuỗi message:

| HTTP Status | Mã lỗi (`errorCode`) | Trường hợp xảy ra | Xử lý khuyến nghị ở Frontend |
| :---: | :--- | :--- | :--- |
| `400` | `OUT_OF_STOCK` | Món đã hết hàng trong lúc tạo đơn | Thông báo món hết hàng, giữ giỏ hàng, cho khách đổi món. |
| `400` | `INVALID_ITEM_CONFIG` | Size/Topping gửi lên không đúng | Báo lỗi cấu hình món, load lại trang. |
| `400` | `ORDER_ALREADY_PAID` | Đơn hàng đã được thanh toán xong | Chuyển thẳng sang trang chi tiết đơn hàng `#BL-XXXX`. |
| `401` | `UNAUTHORIZED` | Thiếu hoặc hết hạn JWT Bearer token | Chuyển hướng sang `/login`, lưu lại giỏ hàng. |
| `403` | `ORDER_ACCESS_DENIED` | Xem đơn hàng của người khác | Báo lỗi không có quyền truy cập, về danh sách đơn của mình. |
| `409` | `EMAIL_ALREADY_EXISTS` | Đăng ký trùng email đã có | Báo lỗi email đã tồn tại, gợi ý đăng nhập. |
| `409` | `IDEMPOTENCY_KEY_PAYLOAD_MISMATCH` | Dùng lại key cũ nhưng đổi thông tin đơn | Tạo một Idempotency-Key mới để thanh toán. |
| `500` | `INTERNAL_SERVER_ERROR` | Lỗi máy chủ không lường trước | Báo lỗi hệ thống bận, kèm nút "Thử lại". |

