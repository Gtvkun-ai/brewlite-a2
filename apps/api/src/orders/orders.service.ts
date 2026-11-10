import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import {
  ItemSize,
  ToppingCode,
  SIZE_SURCHARGE,
  TOPPING_SURCHARGE,
  OrderStatus,
} from '../common/types';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Sinh mã đơn hàng chuẩn format BL-YYYYMMDD-XXXX
   */
  private generateOrderCode(): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `BL-${dateStr}-${randomHex}`;
  }

  /**
   * Tính đơn giá của một item dựa trên basePrice và cấu hình phụ thu
   * unitPrice = basePrice + sizeSurcharge + sum(toppingSurcharges)
   */
  public calculateUnitPrice(
    basePrice: number,
    selectedSize: ItemSize,
    selectedToppings: ToppingCode[] = [],
  ): number {
    const sizeSurcharge = SIZE_SURCHARGE[selectedSize] ?? 0;
    const toppingsSurcharge = (selectedToppings || []).reduce(
      (sum, topping) => sum + (TOPPING_SURCHARGE[topping] ?? 0),
      0,
    );
    return basePrice + sizeSurcharge + toppingsSurcharge;
  }

  /**
   * Tạo đơn hàng mới với transaction trừ kho nguyên tử (Atomic Stock Deduction)
   */
  async createOrder(
    userId: string,
    dto: CreateOrderDto,
    headerIdempotencyKey?: string,
  ): Promise<OrderResponseDto> {
    const idempotencyKey =
      headerIdempotencyKey || dto.idempotencyKey || undefined;

    // 1. Kiểm tra Idempotency trước khi thực thi
    if (idempotencyKey) {
      const existingOrder = await this.prisma.order.findUnique({
        where: { idempotencyKey },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (existingOrder) {
        if (existingOrder.userId !== userId) {
          throw new ForbiddenException({
            errorCode: 'ORDER_ACCESS_DENIED',
            message: 'Bạn không có quyền truy cập đơn hàng này',
          });
        }
        return this.mapToResponse(existingOrder);
      }
    }

    // 2. Tính tổng số lượng yêu cầu theo từng sản phẩm để trừ kho chính xác
    const demandMap = new Map<string, number>();
    for (const item of dto.items) {
      const current = demandMap.get(item.productId) ?? 0;
      demandMap.set(item.productId, current + item.quantity);
    }

    const uniqueProductIds = Array.from(demandMap.keys());

    // 3. Thực thi trong Prisma Transaction để đảm bảo tính toàn vẹn ACID
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // 3.1. Xác thực user tồn tại
        const user = await tx.user.findUnique({
          where: { id: userId },
        });
        if (!user) {
          throw new NotFoundException({
            errorCode: 'USER_NOT_FOUND',
            message: 'Không tìm thấy thông tin người dùng',
          });
        }

        // 3.2. Lấy thông tin các sản phẩm
        const products = await tx.product.findMany({
          where: { id: { in: uniqueProductIds } },
        });

        const foundIds = new Set(products.map((p) => p.id));
        const missingIds = uniqueProductIds.filter((id) => !foundIds.has(id));
        if (missingIds.length > 0) {
          throw new NotFoundException({
            errorCode: 'PRODUCT_NOT_FOUND',
            message: `Sản phẩm với ID ${missingIds.join(', ')} không tồn tại`,
          });
        }

        const productMap = new Map(products.map((p) => [p.id, p]));

        // 3.3. Kiểm tra sản phẩm có đang kinh doanh hay không
        for (const product of products) {
          if (!product.isAvailable) {
            throw new BadRequestException({
              errorCode: 'PRODUCT_UNAVAILABLE',
              message: `Sản phẩm "${product.name}" hiện đang tạm ngưng phục vụ`,
            });
          }
        }

        // 3.4. Trừ kho có điều kiện (Conditional Update) để chống overselling
        // Bắt buộc stockQuantity >= requiredQty VÀ isAvailable = true
        for (const [productId, requiredQty] of demandMap.entries()) {
          const product = productMap.get(productId)!;
          const updateResult = await tx.product.updateMany({
            where: {
              id: productId,
              stockQuantity: { gte: requiredQty },
              isAvailable: true,
            },
            data: {
              stockQuantity: { decrement: requiredQty },
            },
          });

          if (updateResult.count === 0) {
            throw new BadRequestException({
              errorCode: 'OUT_OF_STOCK',
              message: `Sản phẩm "${product.name}" không đủ tồn kho`,
            });
          }
        }

        // 3.5. Tính toán giá tiền phía server (Server-authoritative Pricing)
        let subTotal = 0;
        const itemsToCreate = dto.items.map((item) => {
          const product = productMap.get(item.productId)!;
          const basePriceNum = Number(product.basePrice);
          const unitPriceNum = this.calculateUnitPrice(
            basePriceNum,
            item.selectedSize,
            item.selectedToppings,
          );
          const itemTotalNum = unitPriceNum * item.quantity;
          subTotal += itemTotalNum;

          return {
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: new Prisma.Decimal(unitPriceNum),
            selectedSize: item.selectedSize,
            selectedToppings: item.selectedToppings ?? [],
            itemTotal: new Prisma.Decimal(itemTotalNum),
          };
        });

        const discountAmount = 0; // FR-08 Deferred
        const totalAmount = subTotal - discountAmount;

        // 3.6. Tạo bản ghi Order & OrderItems
        const order = await tx.order.create({
          data: {
            code: this.generateOrderCode(),
            userId,
            status: 'PENDING',
            subTotal: new Prisma.Decimal(subTotal),
            discountAmount: new Prisma.Decimal(discountAmount),
            totalAmount: new Prisma.Decimal(totalAmount),
            deliveryNote: dto.deliveryNote ?? null,
            idempotencyKey: idempotencyKey ?? null,
            items: {
              create: itemsToCreate,
            },
          },
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        });

        return order;
      });

      return this.mapToResponse(result);
    } catch (error: any) {
      // Bắt trường hợp vi phạm Unique Constraint trên idempotencyKey khi có race condition
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002' &&
        idempotencyKey
      ) {
        const raceOrder = await this.prisma.order.findUnique({
          where: { idempotencyKey },
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        });
        if (raceOrder) {
          if (raceOrder.userId !== userId) {
            throw new ForbiddenException({
              errorCode: 'ORDER_ACCESS_DENIED',
              message: 'Bạn không có quyền truy cập đơn hàng này',
            });
          }
          return this.mapToResponse(raceOrder);
        }
      }

      throw error;
    }
  }

  /**
   * Lấy danh sách lịch sử đơn hàng của người dùng hiện tại
   */
  async findUserOrders(userId: string): Promise<OrderResponseDto[]> {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: { select: { name: true } },
          },
        },
      },
    });

    return orders.map((o) => this.mapToResponse(o));
  }

  /**
   * Lấy chi tiết một đơn hàng theo ID (Bảo vệ quyền riêng tư: chỉ chủ đơn hoặc Staff mới xem được)
   */
  async findOrderById(
    orderId: string,
    userId: string,
    role?: string,
  ): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: { select: { name: true } },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với mã #${orderId}`);
    }

    if (
      order.userId !== userId &&
      role !== 'BARISTA' &&
      role !== 'ADMIN' &&
      role !== 'MANAGER'
    ) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập đơn hàng của người khác',
      );
    }

    return this.mapToResponse(order);
  }

  /**
   * Hủy đơn hàng và hoàn trả số lượng tồn kho (Yêu cầu 4 của Giảng viên)
   */
  async cancelOrder(
    orderId: string,
    userId: string,
  ): Promise<OrderResponseDto> {
    return await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order) {
        throw new NotFoundException(`Không tìm thấy đơn hàng với mã #${orderId}`);
      }

      if (order.userId !== userId) {
        throw new ForbiddenException(
          'Bạn không có quyền hủy đơn hàng của người khác',
        );
      }

      if (order.status === 'CANCELLED') {
        throw new BadRequestException('Đơn hàng này đã bị hủy trước đó');
      }

      if (
        order.status !== 'PENDING' &&
        order.status !== 'PAID'
      ) {
        throw new BadRequestException(
          'Không thể hủy đơn hàng đang được chế biến hoặc đã hoàn thành',
        );
      }

      // Hoàn lại tồn kho nguyên tử
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: { increment: item.quantity },
          },
        });
      }

      // Cập nhật trạng thái đơn CANCELLED
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
        },
        include: {
          items: {
            include: {
              product: { select: { name: true } },
            },
          },
        },
      });

      // Nếu đã thanh toán, ghi nhận hoàn tiền REFUND_PENDING
      if (order.status === 'PAID') {
        await tx.payment.updateMany({
          where: { orderId, status: 'SUCCESS' },
          data: {
            status: 'REFUND_PENDING' as any,
          },
        });
      }

      return this.mapToResponse(updatedOrder);
    });
  }

  /**
   * Nhân viên cập nhật trạng thái chế biến đơn hàng (FR-07)
   * State Machine: PAID -> PREPARING -> READY -> COMPLETED
   */
  async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
  ): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: { select: { name: true } },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với mã #${orderId}`);
    }

    const currentStatus = order.status as OrderStatus;

    // Định nghĩa bảng chuyển trạng thái hợp lệ
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      PENDING: ['PAID', 'CANCELLED', 'PAYMENT_FAILED'],
      PAID: ['PREPARING', 'CANCELLED'],
      PREPARING: ['READY'],
      READY: ['COMPLETED'],
      COMPLETED: [],
      CANCELLED: [],
      PAYMENT_FAILED: [],
    };

    const allowedNext = validTransitions[currentStatus] || [];
    if (!allowedNext.includes(newStatus)) {
      throw new BadRequestException({
        errorCode: 'INVALID_STATE_TRANSITION',
        message: `Không thể chuyển trạng thái từ ${currentStatus} sang ${newStatus}`,
      });
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
      include: {
        items: {
          include: {
            product: { select: { name: true } },
          },
        },
      },
    });

    return this.mapToResponse(updatedOrder);
  }

  /**
   * Chuyển đổi Prisma Order Model sang format OrderResponseDto chuẩn
   */
  public mapToResponse(order: any): OrderResponseDto {
    return {
      id: order.id,
      code: order.code,
      userId: order.userId,
      status: order.status as OrderStatus,
      subTotal: order.subTotal.toString(),
      discountAmount: order.discountAmount.toString(),
      totalAmount: order.totalAmount.toString(),
      deliveryNote: order.deliveryNote ?? null,
      idempotencyKey: order.idempotencyKey ?? null,
      createdAt:
        order.createdAt instanceof Date
          ? order.createdAt.toISOString()
          : String(order.createdAt),
      updatedAt:
        order.updatedAt instanceof Date
          ? order.updatedAt.toISOString()
          : String(order.updatedAt),
      items: (order.items || []).map((item: any) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product?.name ?? '',
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
        selectedSize: item.selectedSize ?? 'REGULAR',
        selectedToppings: item.selectedToppings ?? [],
        itemTotal: item.itemTotal.toString(),
      })),
    };
  }
}
