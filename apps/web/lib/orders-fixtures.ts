import type { Order } from './types';

// FIXTURE – KHÔNG PHẢI DỮ LIỆU THẬT.
// Dùng tạm đến khi API C-10 sẵn sàng (Sprint 2).
export const ORDER_FIXTURES: Order[] = [
  {
    id: 'fx-1001',
    status: 'PREPARING',
    totalAmount: '95000.00',
    createdAt: '2026-11-06T08:15:00+07:00',
    items: [
      { productId: 'fx-p1', name: 'Cà phê sữa đá', quantity: 2, unitPrice: '35000.00' },
      { productId: 'fx-p2', name: 'Bánh croissant', quantity: 1, unitPrice: '25000.00' },
    ],
  },
  {
    id: 'fx-1002',
    status: 'COMPLETED',
    totalAmount: '45000.00',
    createdAt: '2026-11-05T14:02:00+07:00',
    items: [{ productId: 'fx-p3', name: 'Trà đào', quantity: 1, unitPrice: '45000.00' }],
  },
  {
    id: 'fx-1003',
    status: 'FAILED',
    totalAmount: '35000.00',
    createdAt: '2026-11-04T09:40:00+07:00',
    items: [{ productId: 'fx-p1', name: 'Cà phê sữa đá', quantity: 1, unitPrice: '35000.00' }],
  },
];