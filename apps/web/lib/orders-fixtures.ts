import type { OrderResponse } from './types';

// FIXTURE – KHÔNG PHẢI DỮ LIỆU THẬT.
// Dựng theo OrderResponse trong docs/architecture/api-contracts.md (v1.0.0).
// Giá theo công thức: unitPrice = basePrice + phụ thu size + phụ thu topping.
export const ORDER_FIXTURES: OrderResponse[] = [
  {
    id: 'fx-1001',
    code: 'FX-20261106-001',
    status: 'PREPARING',
    subTotal: '145000',
    discountAmount: '0',
    totalAmount: '145000',
    createdAt: '2026-11-06T01:15:00.000Z',
    items: [
      {
        id: 'fx-i1',
        productId: 'fx-p1',
        productName: 'Cà phê sữa đá',
        quantity: 2,
        unitPrice: '50000', // 35000 + 10000 (LARGE) + 5000 (TRAN_CHAU)
        selectedSize: 'LARGE',
        selectedToppings: ['TRAN_CHAU'],
        itemTotal: '100000',
      },
      {
        id: 'fx-i2',
        productId: 'fx-p2',
        productName: 'Trà đào',
        quantity: 1,
        unitPrice: '45000',
        selectedSize: 'REGULAR',
        selectedToppings: [],
        itemTotal: '45000',
      },
    ],
  },
  {
    id: 'fx-1002',
    code: 'FX-20261105-001',
    status: 'COMPLETED',
    subTotal: '45000',
    discountAmount: '0',
    totalAmount: '45000',
    createdAt: '2026-11-05T07:02:00.000Z',
    items: [
      {
        id: 'fx-i3',
        productId: 'fx-p2',
        productName: 'Trà đào',
        quantity: 1,
        unitPrice: '45000',
        selectedSize: 'REGULAR',
        selectedToppings: [],
        itemTotal: '45000',
      },
    ],
  },
  {
    id: 'fx-1003',
    code: 'FX-20261104-001',
    status: 'PAYMENT_FAILED',
    subTotal: '35000',
    discountAmount: '0',
    totalAmount: '35000',
    createdAt: '2026-11-04T02:40:00.000Z',
    items: [
      {
        id: 'fx-i4',
        productId: 'fx-p1',
        productName: 'Cà phê sữa đá',
        quantity: 1,
        unitPrice: '35000',
        selectedSize: 'REGULAR',
        selectedToppings: [],
        itemTotal: '35000',
      },
    ],
  },
];