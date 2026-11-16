/**
 * Shared Type Definitions for BrewLite Web & API
 * Specified by Tech Lead A in docs/architecture/api-contracts.md
 */

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

export type PaymentMethod =
  | 'E_WALLET'
  | 'VIETQR_MOMO'
  | 'CREDIT_CARD'
  | 'DOMESTIC_ATM'
  | 'CASH';

export type ItemSize = 'REGULAR' | 'LARGE';

export type ToppingCode = 'TRAN_CHAU' | 'KEM_CHEESE' | 'THACH_DAO';

export type SugarLevel = 0 | 50 | 70 | 100;

export type IceLevel = 'NORMAL' | 'LESS' | 'SEPARATE' | 'NONE';

export interface Product {
  id: string;
  code: string;
  name: string;
  description: string;
  basePrice: string; // Decimal string from Prisma
  imageUrl: string;
  category: string;
  isAvailable: boolean;
  stockQuantity: number;
  createdAt?: string;
}

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

export interface CartItem {
  productId: string;
  name: string;
  basePrice: string;
  size: ItemSize;
  toppings: ToppingCode[];
  sugar?: SugarLevel;
  ice?: IceLevel;
  quantity: number;
  unitPrice: string;
  itemTotal: string;
  imageUrl?: string;
  category?: string;
}

export interface CreateOrderItemDto {
  productId: string;
  quantity: number;
  selectedSize: ItemSize;
  selectedToppings: ToppingCode[];
  selectedSugar?: SugarLevel;
  selectedIce?: IceLevel;
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
  selectedSugar?: SugarLevel;
  selectedIce?: IceLevel;
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
