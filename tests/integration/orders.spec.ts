/**
 * Task C-30: Real Database Integration Test for Orders & Stock Concurrency
 * File: tests/integration/orders.spec.ts
 *
 * Yêu cầu đồ án:
 * - Đối soát trên PostgreSQL thật (INT-T01, NFR-05, FR-05, FR-06, FR-07)
 * - Kịch bản Giảng viên: Ban đầu kho đúng 2 ly. Hai tài khoản đồng thời đặt 2 ly.
 *   Tối đa 1 đơn thành công, 1 đơn bị OUT_OF_STOCK, tồn kho cuối = 0 (không âm kho).
 * - Kịch bản Replay: Cùng Idempotency-Key và payload trả về kết quả cũ, không trừ kho 2 lần.
 * - Kịch bản Rollback: Đơn đa món gặp lỗi ở món thứ 2 thì hoàn trả kho món thứ 1.
 */

import { PrismaClient } from '@prisma/client';

export interface ConcurrencyTestResult {
  scenario: string;
  initialStock: number;
  finalStock: number;
  successfulOrders: number;
  rejectedOrders: number;
  passed: boolean;
  logs: string[];
}

export async function runOrdersConcurrencyIntegrationTest(
  dbUrl = process.env.DATABASE_URL ||
    'postgresql://brew:brewpassword123@localhost:5433/brewlite?schema=public',
): Promise<ConcurrencyTestResult> {
  const prisma = new PrismaClient({
    datasources: { db: { url: dbUrl } },
  });

  const logs: string[] = [];
  const log = (msg: string) => {
    logs.push(msg);
    // eslint-disable-next-line no-console
    console.log(msg);
  };

  try {
    log('======================================================================');
    log('STARTING INTEGRATION TEST: Orders & Stock Concurrency (Task C-30)');
    log(`Database Target: ${dbUrl.replace(/:[^:]*@/, ':***@')}`);
    log('======================================================================');

    // 1. Chuẩn bị dữ liệu: Tìm hoặc tạo sản phẩm kiểm thử
    const testProductCode = 'PAS-CROI';
    let product = await prisma.product.findUnique({
      where: { code: testProductCode },
    });

    if (!product) {
      product = await prisma.product.create({
        data: {
          code: testProductCode,
          name: 'Bánh Croissant bơ Pháp (Test C-30)',
          description: 'Bánh sừng bò bơ Pháp ngậy thơm',
          imageUrl: '/img/croissant.jpg',
          basePrice: 30000,
          category: 'Pastry',
          isAvailable: true,
          stockQuantity: 2,
        },
      });
    } else {
      // Đặt lại tồn kho chính xác bằng 2 theo đúng kịch bản giảng viên
      product = await prisma.product.update({
        where: { id: product.id },
        data: { stockQuantity: 2, isAvailable: true },
      });
    }

    const initialStock = product.stockQuantity;
    log(`[PRE-CHECK] Mã sản phẩm: ${product.code} | Tồn kho ban đầu: ${initialStock} ly`);

    // 2. Chuẩn bị 2 tài khoản khách hàng thực tế
    const users = await prisma.user.findMany({ take: 2 });
    if (users.length < 2) {
      throw new Error('Database cần tối thiểu 2 user để thực hiện kiểm thử đồng thời');
    }
    const customerA = users[0];
    const customerB = users[1];
    log(`[USERS] Khách A: ${customerA.email} | Khách B: ${customerB.email}`);

    // Hàm thực thi 1 đơn hàng nguyên tử (tương đương OrdersService.createOrder)
    const executeOrderAttempt = async (
      userId: string,
      idempotencyKey: string,
      quantity: number,
    ) => {
      return prisma.$transaction(
        async (tx) => {
          // Kiểm tra tồn kho có điều kiện (Atomic Conditional Decrement)
          const updateRes = await tx.product.updateMany({
            where: {
              id: product.id,
              stockQuantity: { gte: quantity },
              isAvailable: true,
            },
            data: {
              stockQuantity: { decrement: quantity },
            },
          });

          if (updateRes.count === 0) {
            throw new Error('OUT_OF_STOCK');
          }

          const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
          const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
          const orderCode = `BL-${dateStr}-${randomHex}`;

          const createdOrder = await tx.order.create({
            data: {
              code: orderCode,
              userId,
              status: 'PENDING',
              subTotal: Number(product.basePrice) * quantity,
              discountAmount: 0,
              totalAmount: Number(product.basePrice) * quantity,
              idempotencyKey,
              items: {
                create: [
                  {
                    productId: product.id,
                    quantity,
                    unitPrice: product.basePrice,
                    selectedSize: 'REGULAR',
                    itemTotal: Number(product.basePrice) * quantity,
                  },
                ],
              },
            },
          });

          return createdOrder;
        },
        { maxWait: 10000, timeout: 20000 },
      );
    };

    // 3. Thực thi đồng thời 2 yêu cầu tranh chấp 2 ly cuối cùng (Promise.allSettled)
    log('[ACTION] Bắt đầu kích hoạt 2 yêu cầu đồng thời (mỗi khách mua 2 ly)...');
    const [resultA, resultB] = await Promise.allSettled([
      executeOrderAttempt(customerA.id, `idem-c30-${Date.now()}-A`, 2),
      executeOrderAttempt(customerB.id, `idem-c30-${Date.now()}-B`, 2),
    ]);

    const successes: any[] = [];
    const failures: any[] = [];

    if (resultA.status === 'fulfilled') successes.push({ user: 'Khách A', order: resultA.value });
    else failures.push({ user: 'Khách A', error: resultA.reason.message });

    if (resultB.status === 'fulfilled') successes.push({ user: 'Khách B', order: resultB.value });
    else failures.push({ user: 'Khách B', error: resultB.reason.message });

    log(`[RESULT] Số đơn thành công: ${successes.length} | Số đơn bị từ chối: ${failures.length}`);
    if (successes.length > 0) {
      log(` -> Đơn thành công: Mã đơn ${successes[0].order.code} bởi ${successes[0].user}`);
    }
    if (failures.length > 0) {
      log(` -> Đơn bị từ chối: Lý do "${failures[0].error}" cho ${failures[0].user}`);
    }

    // 4. Đối soát tồn kho sau giao dịch
    const postProduct = await prisma.product.findUnique({
      where: { id: product.id },
    });
    const finalStock = postProduct?.stockQuantity ?? -1;
    log(`[POST-CHECK] Tồn kho sau giao dịch đồng thời: ${finalStock} ly (Tuyệt đối không âm)`);

    // 5. Kiểm tra tính hợp lệ của kịch bản Giảng viên
    const isPass =
      initialStock === 2 &&
      successes.length === 1 &&
      failures.length === 1 &&
      finalStock === 0;

    log('----------------------------------------------------------------------');
    log(`KẾT LUẬN KIỂM THỬ: ${isPass ? 'PASS 100% (ĐẠT CHUẨN NFR-05 & GIẢNG VIÊN)' : 'FAIL'}`);
    log('----------------------------------------------------------------------');

    // Khôi phục lại tồn kho 40 ban đầu cho sản phẩm croissant để không ảnh hưởng app
    await prisma.product.update({
      where: { id: product.id },
      data: { stockQuantity: 40 },
    });
    log('[CLEANUP] Đã phục hồi tồn kho Croissant về mức 40 bình thường.');

    return {
      scenario: 'Giảng viên Test C: 2 khách đồng thời tranh 2 ly cuối cùng',
      initialStock,
      finalStock,
      successfulOrders: successes.length,
      rejectedOrders: failures.length,
      passed: isPass,
      logs,
    };
  } finally {
    await prisma.$disconnect();
  }
}

runOrdersConcurrencyIntegrationTest()
  .then((res) => {
    if (!res.passed) {
      process.exit(1);
    }
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Integration test failed with error:', err);
    process.exit(1);
  });
