import { InventoryDemoService } from './inventory-demo.service';

describe('InventoryDemoService - kho mô phỏng tách biệt', () => {
  let service: InventoryDemoService;

  beforeEach(() => {
    service = new InventoryDemoService();
  });

  it('cho đúng 20 ly và chặn ly 21 trên dữ liệu mô phỏng', () => {
    const result = service.runTestDSimulation();

    expect(result.status).toBe('PASS');
    expect(result.successCount).toBe(20);
    expect(result.totalRequested).toBe(21);
    expect(result.failureAttempt).toMatchObject({
      cupNumber: 21,
      status: 400,
      errorCode: 'OUT_OF_STOCK_INGREDIENT',
      missingIngredient: 'Sữa tươi thanh trùng Đà Lạt Milk',
    });
    expect(result.finalStock['ING-COFFEE-ROBUSTA'].stock).toBe(300);
    expect(result.finalStock['ING-MILK-FRESH'].stock).toBe(0);
    expect(result.finalStock['ING-SUGAR-REFINED'].stock).toBe(100);
  });

  it('bắt đầu mỗi lượt chạy bằng bản sao mới của dữ liệu demo', () => {
    const first = service.runTestDSimulation();
    const second = service.runTestDSimulation();

    expect(second.initialStock).toEqual(first.initialStock);
    expect(second.finalStock).toEqual(first.finalStock);
  });
});
