import { getStoredToken } from './auth-api';

export interface Ingredient {
  code: string;
  name: string;
  unit: 'g' | 'ml' | 'portion';
  currentStock: number;
  baselineStock: number;
  minThreshold: number;
  category: string;
}

export interface RecipeItem {
  ingredientCode: string;
  amount: number;
}

export interface ProductRecipe {
  productCode: string;
  productName: string;
  category: string;
  recipes: Record<'REGULAR' | 'LARGE', RecipeItem[]>;
}

export interface IngredientBreakdown {
  ingredientCode: string;
  ingredientName: string;
  currentStock: number;
  amountPerCup: number;
  unit: string;
  availableCups: number;
  isBottleneck: boolean;
}

export interface BottleneckForecast {
  productCode: string;
  productName: string;
  size: 'REGULAR' | 'LARGE';
  maxCups: number;
  bottleneckIngredientCode: string;
  bottleneckIngredientName: string;
  formula: string;
  breakdown: IngredientBreakdown[];
}

export interface TestDSimulationResult {
  successCount: number;
  totalRequested: number;
  failureAttempt: {
    cupNumber: number;
    requestedProduct: string;
    size: 'REGULAR' | 'LARGE';
    status: number;
    errorCode: string;
    errorMessage: string;
    missingIngredient: string;
  };
  initialStock: Record<string, { name: string; stock: number; unit: string }>;
  finalStock: Record<string, { name: string; stock: number; unit: string }>;
  verifiedAt: string;
  status: 'PASS' | 'FAIL';
  logs: string[];
}

export interface InboundReceipt {
  id: string;
  ingredientCode: string;
  ingredientName: string;
  amountAdded: number;
  unit: string;
  beforeStock: number;
  afterStock: number;
  supplierOrNote: string;
  createdAt: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function inventoryRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  if (!token) throw new Error('Vui lòng đăng nhập lại để truy cập dữ liệu kho.');
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null) as
      | { message?: string | string[] }
      | null;
    const message = Array.isArray(errorBody?.message)
      ? errorBody.message.join(', ')
      : errorBody?.message;
    throw new Error(message || `Inventory API returned ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function fetchMaterials(): Promise<Ingredient[]> {
  return inventoryRequest('/inventory/materials');
}

export function fetchBottleneckForecast(
  size: 'REGULAR' | 'LARGE' = 'REGULAR',
): Promise<BottleneckForecast[]> {
  return inventoryRequest(`/inventory/bottleneck-forecast?size=${size}`);
}

export function fetchRecipes(): Promise<ProductRecipe[]> {
  return inventoryRequest('/inventory/recipes');
}

export function updateMaterial(code: string, newStock: number): Promise<Ingredient> {
  return inventoryRequest(`/inventory/materials/${encodeURIComponent(code)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newStock }),
  });
}

export function runTestDSimulation(): Promise<TestDSimulationResult> {
  return inventoryRequest('/inventory/demo/test-d-simulation', { method: 'POST' });
}

export function fetchInboundLogs(): Promise<InboundReceipt[]> {
  return inventoryRequest('/inventory/inbound-logs');
}

export function restockMaterialApi(
  code: string,
  amountToAdd: number,
  supplierOrNote?: string,
): Promise<{ ingredient: Ingredient; receipt: InboundReceipt }> {
  return inventoryRequest('/inventory/restock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, amountToAdd, supplierOrNote }),
  });
}
