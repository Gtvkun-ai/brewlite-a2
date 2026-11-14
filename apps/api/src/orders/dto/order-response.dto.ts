import { OrderStatus } from '../../common/types';

export class OrderItemResponseDto {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: string;
  selectedSize: string;
  selectedToppings: string[];
  selectedSugar: number;
  selectedIce: string;
  itemTotal: string;
}

export class OrderResponseDto {
  id: string;
  code: string;
  userId: string;
  status: OrderStatus;
  subTotal: string;
  discountAmount: string;
  totalAmount: string;
  deliveryNote: string | null;
  idempotencyKey: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItemResponseDto[];
}
