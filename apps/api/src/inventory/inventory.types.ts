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
  amount: number; // định lượng cho 1 ly
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
