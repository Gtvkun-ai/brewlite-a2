import { Injectable } from '@nestjs/common';
import { TestDSimulationResult } from './inventory.types';

type DemoIngredient = {
  code: string;
  name: string;
  unit: string;
  stock: number;
};

const DEMO_BASELINE: DemoIngredient[] = [
  {
    code: 'ING-COFFEE-ROBUSTA',
    name: 'Cà phê hạt Robusta Buôn Ma Thuột',
    unit: 'g',
    stock: 500,
  },
  {
    code: 'ING-MILK-FRESH',
    name: 'Sữa tươi thanh trùng Đà Lạt Milk',
    unit: 'ml',
    stock: 1000,
  },
  {
    code: 'ING-SUGAR-REFINED',
    name: 'Đường mía tinh luyện Biên Hòa',
    unit: 'g',
    stock: 200,
  },
];

const REGULAR_RECIPE = [
  { code: 'ING-COFFEE-ROBUSTA', amount: 10 },
  { code: 'ING-MILK-FRESH', amount: 50 },
  { code: 'ING-SUGAR-REFINED', amount: 5 },
];

class DemoOutOfStockError extends Error {
  constructor(
    readonly ingredient: DemoIngredient,
    readonly required: number,
  ) {
    super(
      `Không đủ ${ingredient.name}. Cần ${required}${ingredient.unit}, trong kho chỉ còn ${ingredient.stock}${ingredient.unit}`,
    );
  }
}

@Injectable()
export class InventoryDemoService {
  runTestDSimulation(): TestDSimulationResult {
    // Each request receives fresh local state. This service never reads or writes PostgreSQL.
    const materials = new Map(
      DEMO_BASELINE.map((ingredient) => [ingredient.code, { ...ingredient }]),
    );
    const initialStock = this.stockSnapshot(materials);
    const logs = [
      '[BẮT ĐẦU TEST D] Chuẩn bị kho riêng: Cà phê 500g, Sữa 1.000ml, Đường 200g.',
      '[PHÂN TÍCH ĐIỂM NGHẼN] min(500/10, 1000/50, 200/5) = min(50, 20, 40) = 20 ly (Giới hạn bởi Sữa tươi).',
    ];

    for (let cup = 1; cup <= 20; cup += 1) {
      this.deductDemoRecipe(materials);
      if (cup === 1 || cup === 10 || cup === 20) {
        const milk = materials.get('ING-MILK-FRESH')!;
        const coffee = materials.get('ING-COFFEE-ROBUSTA')!;
        logs.push(
          `[ĐƠN HÀNG #${cup}] Bán thành công ly ${cup} -> Sữa còn ${milk.stock}${milk.unit}, Cà phê còn ${coffee.stock}${coffee.unit}.`,
        );
      }
    }

    logs.push('[HOÀN TẤT 20 LY] Sữa trong bộ dữ liệu mô phỏng đã chạm ngưỡng 0ml.');
    let failureAttempt: TestDSimulationResult['failureAttempt'];
    let successCount = 20;
    let status: TestDSimulationResult['status'] = 'PASS';
    try {
      this.deductDemoRecipe(materials);
      successCount += 1;
      status = 'FAIL';
      failureAttempt = {
        cupNumber: 21,
        requestedProduct: 'Cà phê sữa đá (REGULAR)',
        size: 'REGULAR',
        status: 201,
        errorCode: 'UNEXPECTED_SUCCESS',
        errorMessage: 'Ly thứ 21 không bị chặn trong bộ dữ liệu mô phỏng.',
        missingIngredient: '',
      };
      logs.push('[LỖI] Bộ mô phỏng cho phép ly thứ 21.');
    } catch (error) {
      if (!(error instanceof DemoOutOfStockError)) throw error;
      failureAttempt = {
        cupNumber: 21,
        requestedProduct: 'Cà phê sữa đá (REGULAR)',
        size: 'REGULAR',
        status: 400,
        errorCode: 'OUT_OF_STOCK_INGREDIENT',
        errorMessage: error.message,
        missingIngredient: error.ingredient.name,
      };
      logs.push(
        `[CHẶN LY THỨ 21] Bộ mô phỏng từ chối với HTTP 400 (${failureAttempt.errorCode}): ${failureAttempt.errorMessage}`,
      );
    }

    const finalStock = this.stockSnapshot(materials);
    logs.push(
      `[KẾT QUẢ KHO MÔ PHỎNG] Cà phê: ${finalStock['ING-COFFEE-ROBUSTA'].stock}g, Sữa: ${finalStock['ING-MILK-FRESH'].stock}ml, Đường: ${finalStock['ING-SUGAR-REFINED'].stock}g.`,
    );
    logs.push(
      status === 'PASS'
        ? '[NGHIỆM THU TEST D] PASS — kết quả chỉ áp dụng cho bộ dữ liệu mô phỏng.'
        : '[NGHIỆM THU TEST D] FAIL — ly thứ 21 đã vượt qua giới hạn mô phỏng.',
    );

    return {
      successCount,
      totalRequested: 21,
      failureAttempt,
      initialStock,
      finalStock,
      verifiedAt: new Date().toISOString(),
      status,
      logs,
    };
  }

  private deductDemoRecipe(materials: Map<string, DemoIngredient>): void {
    for (const recipeItem of REGULAR_RECIPE) {
      const ingredient = materials.get(recipeItem.code)!;
      if (ingredient.stock < recipeItem.amount) {
        throw new DemoOutOfStockError(ingredient, recipeItem.amount);
      }
    }
    for (const recipeItem of REGULAR_RECIPE) {
      const ingredient = materials.get(recipeItem.code)!;
      ingredient.stock -= recipeItem.amount;
    }
  }

  private stockSnapshot(materials: Map<string, DemoIngredient>) {
    const snapshot: Record<string, { name: string; stock: number; unit: string }> = {};
    for (const [code, ingredient] of materials) {
      snapshot[code] = {
        name: ingredient.name,
        stock: ingredient.stock,
        unit: ingredient.unit,
      };
    }
    return snapshot;
  }
}
