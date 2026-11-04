/**
 * Shared Domain Types for BrewLite API
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

export type PaymentMethod = 'E_WALLET' | 'CREDIT_CARD' | 'DOMESTIC_ATM' | 'CASH';

export type ItemSize = 'REGULAR' | 'LARGE';

export type ToppingCode = 'TRAN_CHAU' | 'KEM_CHEESE' | 'THACH_DAO';

export const SIZE_SURCHARGE: Record<ItemSize, number> = {
  REGULAR: 0,
  LARGE: 10000,
};

export const TOPPING_SURCHARGE: Record<ToppingCode, number> = {
  TRAN_CHAU: 5000,
  KEM_CHEESE: 10000,
  THACH_DAO: 7000,
};

export interface UserPayload {
  sub: string;
  email: string;
  fullName: string;
  role: Role;
}

