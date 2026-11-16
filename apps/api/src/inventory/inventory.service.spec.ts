import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { InventoryService } from './inventory.service';

describe('InventoryService - TEST D: Quản lý tồn kho theo định mức nguyên vật liệu (BOM)', () => {
  let service: InventoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InventoryService],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    service.resetStock();
  });

  describe('1. Khởi tạo kho & Công thức định mức BOM', () => {
    it('khởi tạo đầy đủ 3 nguyên vật liệu mẫu theo chuẩn giảng viên (500g cà phê, 1000ml sữa, 200g đường)', () => {
      const materials = service.getMaterials();
      expect(materials).toHaveLength(3);

      const coffee = materials.find((m) => m.code === 'ING-COFFEE-ROBUSTA');
      const milk = materials.find((m) => m.code === 'ING-MILK-FRESH');
      const sugar = materials.find((m) => m.code === 'ING-SUGAR-REFINED');

      expect(coffee?.currentStock).toBe(500);
      expect(milk?.currentStock).toBe(1000);
      expect(sugar?.currentStock).toBe(200);
    });

    it('có công thức định mức cho Cà phê sữa (10g cà phê, 50ml sữa, 5g đường)', () => {
      const recipes = service.getRecipes();
      const cfSua = recipes.find((r) => r.productCode === 'CF-SUA');
      expect(cfSua).toBeDefined();

      const regularItems = cfSua!.recipes.REGULAR;
      expect(regularItems).toEqual([
        { ingredientCode: 'ING-COFFEE-ROBUSTA', amount: 10 },
        { ingredientCode: 'ING-MILK-FRESH', amount: 50 },
        { ingredientCode: 'ING-SUGAR-REFINED', amount: 5 },
      ]);
    });
  });

  describe('2. Phép tính điểm nghẽn Bottleneck: Q = min(Kho_i / Định mức_i)', () => {
    it('TEST D: tính toán chính xác 20 ly tối đa cho Cà phê sữa, giới hạn bởi Sữa tươi', () => {
      const forecast = service.calculateBottleneck('CF-SUA', 'REGULAR');

      expect(forecast.maxCups).toBe(20);
      expect(forecast.bottleneckIngredientCode).toBe('ING-MILK-FRESH');
      expect(forecast.bottleneckIngredientName).toContain('Sữa tươi');

      const milkBreakdown = forecast.breakdown.find(
        (b) => b.ingredientCode === 'ING-MILK-FRESH',
      );
      const coffeeBreakdown = forecast.breakdown.find(
        (b) => b.ingredientCode === 'ING-COFFEE-ROBUSTA',
      );
      const sugarBreakdown = forecast.breakdown.find(
        (b) => b.ingredientCode === 'ING-SUGAR-REFINED',
      );

      expect(coffeeBreakdown?.availableCups).toBe(50); // 500 / 10 = 50
      expect(milkBreakdown?.availableCups).toBe(20);   // 1000 / 50 = 20
      expect(sugarBreakdown?.availableCups).toBe(40);  // 200 / 5 = 40
      expect(milkBreakdown?.isBottleneck).toBe(true);
      expect(coffeeBreakdown?.isBottleneck).toBe(false);
    });

    it('tính toán điểm nghẽn chính xác cho Americano (chỉ dùng cà phê, không dùng sữa)', () => {
      const forecast = service.calculateBottleneck('CF-AME', 'REGULAR');
      // 500g / 15g = 33 ly
      expect(forecast.maxCups).toBe(33);
      expect(forecast.bottleneckIngredientCode).toBe('ING-COFFEE-ROBUSTA');
    });
  });

  describe('3. Trừ kho nguyên tử đa nguyên vật liệu (Atomic Multi-Ingredient Deduction)', () => {
    it('trừ đúng định mức nguyên liệu khi đặt 1 ly Cà phê sữa', () => {
      const result = service.deductRecipe('CF-SUA', 'REGULAR', 1);
      expect(result.success).toBe(true);

      const materials = service.getMaterials();
      const coffee = materials.find((m) => m.code === 'ING-COFFEE-ROBUSTA');
      const milk = materials.find((m) => m.code === 'ING-MILK-FRESH');
      const sugar = materials.find((m) => m.code === 'ING-SUGAR-REFINED');

      expect(coffee?.currentStock).toBe(490); // 500 - 10
      expect(milk?.currentStock).toBe(950);   // 1000 - 50
      expect(sugar?.currentStock).toBe(195);  // 200 - 5
    });

    it('ném lỗi OUT_OF_STOCK_INGREDIENT khi một nguyên liệu không đủ', () => {
      // Giảm sữa tươi xuống còn 30ml (cần 50ml)
      service.updateMaterialStock('ING-MILK-FRESH', 30);

      expect(() => {
        service.deductRecipe('CF-SUA', 'REGULAR', 1);
      }).toThrow(BadRequestException);

      try {
        service.deductRecipe('CF-SUA', 'REGULAR', 1);
      } catch (err: unknown) {
        const error = err as BadRequestException;
        const res = error.getResponse() as Record<string, unknown>;
        expect(res.errorCode).toBe('OUT_OF_STOCK_INGREDIENT');
        expect(res.missingIngredient).toContain('Sữa tươi');
      }

      // Đảm bảo tính nguyên tử: Cà phê và đường KHÔNG bị trừ khi sữa thiếu
      const materials = service.getMaterials();
      const coffee = materials.find((m) => m.code === 'ING-COFFEE-ROBUSTA');
      expect(coffee?.currentStock).toBe(500);
    });
  });

  describe('4. Kịch bản nghiệm thu TEST D chuẩn của Giảng viên (20 ly + chặn ly 21)', () => {
    it('chạy trọn vẹn mô phỏng TEST D: bán đúng 20 ly, sữa về 0, chặn ly thứ 21 với HTTP 400', () => {
      const sim = service.runTestDSimulation();

      expect(sim.status).toBe('PASS');
      expect(sim.successCount).toBe(20);
      expect(sim.totalRequested).toBe(21);

      // Kiểm tra kho cuối cùng
      expect(sim.finalStock['ING-MILK-FRESH'].stock).toBe(0); // Sữa hết nhẵn
      expect(sim.finalStock['ING-COFFEE-ROBUSTA'].stock).toBe(300); // 500 - (20 * 10) = 300g
      expect(sim.finalStock['ING-SUGAR-REFINED'].stock).toBe(100);  // 200 - (20 * 5) = 100g

      // Kiểm tra ly thứ 21 bị từ chối
      expect(sim.failureAttempt.cupNumber).toBe(21);
      expect(sim.failureAttempt.status).toBe(400);
      expect(sim.failureAttempt.errorCode).toBe('OUT_OF_STOCK_INGREDIENT');
      expect(sim.failureAttempt.missingIngredient).toContain('Sữa tươi');

      // Có đủ logs chi tiết
      expect(sim.logs.length).toBeGreaterThan(5);
      expect(sim.logs.some((l) => l.includes('CHẶN LY THỨ 21'))).toBe(true);
    });
  });

  describe('5. Điều chỉnh kho & Phục hồi kho mẫu (Reset Demo)', () => {
    it('cho phép cập nhật tồn kho thủ công và chặn số âm', () => {
      service.updateMaterialStock('ING-COFFEE-ROBUSTA', 800);
      const materials = service.getMaterials();
      const coffee = materials.find((m) => m.code === 'ING-COFFEE-ROBUSTA');
      expect(coffee?.currentStock).toBe(800);

      expect(() => {
        service.updateMaterialStock('ING-COFFEE-ROBUSTA', -10);
      }).toThrow(BadRequestException);
    });

    it('khôi phục kho về mức ban đầu sau khi chạy xong demo', () => {
      service.runTestDSimulation();
      expect(service.getMaterials().find((m) => m.code === 'ING-MILK-FRESH')?.currentStock).toBe(0);

      service.resetStock();
      expect(service.getMaterials().find((m) => m.code === 'ING-MILK-FRESH')?.currentStock).toBe(1000);
    });
  });

  describe('6. Liên kết Định mức BOM với Thành phẩm Menu & Hoàn kho hủy đơn', () => {
    it('nhận diện cả hai mã sản phẩm CF-SUA và CF-MILK cho Cà phê sữa', () => {
      expect(service.hasRecipe('CF-SUA')).toBe(true);
      expect(service.hasRecipe('CF-MILK')).toBe(true);
      expect(service.hasRecipe('PAS-CROI')).toBe(false);
    });

    it('hoàn trả đúng số lượng nguyên vật liệu khi khách hủy đơn (restoreRecipe)', () => {
      // Đặt 2 ly Cà phê sữa Regular (tiêu thụ 20g cà phê, 100ml sữa, 10g đường)
      service.deductRecipe('CF-MILK', 'REGULAR', 2);
      expect(service.getMaterials().find((m) => m.code === 'ING-MILK-FRESH')?.currentStock).toBe(900);

      // Hủy đơn -> hoàn lại kho nguyên liệu
      const restored = service.restoreRecipe('CF-MILK', 'REGULAR', 2);
      expect(restored).toBe(true);
      expect(service.getMaterials().find((m) => m.code === 'ING-MILK-FRESH')?.currentStock).toBe(1000);
      expect(service.getMaterials().find((m) => m.code === 'ING-COFFEE-ROBUSTA')?.currentStock).toBe(500);
    });
  });
});
