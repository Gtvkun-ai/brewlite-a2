import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InventoryMovementType,
  Prisma,
  RecipeSize,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  BottleneckForecast,
  Ingredient,
  IngredientBreakdown,
  InboundReceipt,
  ProductRecipe,
} from './inventory.types';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getMaterials(): Promise<Ingredient[]> {
    const materials = await this.prisma.ingredient.findMany({
      orderBy: { code: 'asc' },
    });
    return materials.map((material) => ({
      code: material.code,
      name: material.name,
      unit: material.unit as Ingredient['unit'],
      currentStock: Number(material.currentStock),
      baselineStock: Number(material.baselineStock),
      minThreshold: Number(material.minThreshold),
      category: material.category,
    }));
  }

  async getInboundLogs(): Promise<InboundReceipt[]> {
    const movements = await this.prisma.inventoryMovement.findMany({
      where: {
        type: { in: [InventoryMovementType.OPENING, InventoryMovementType.RESTOCK] },
      },
      orderBy: { createdAt: 'desc' },
    });
    return movements.map((movement) => ({
      id: movement.id,
      ingredientCode: movement.ingredientCodeSnapshot,
      ingredientName: movement.ingredientNameSnapshot,
      amountAdded: Number(movement.amount),
      unit: movement.unitSnapshot,
      beforeStock: Number(movement.beforeStock),
      afterStock: Number(movement.afterStock),
      supplierOrNote: movement.note ?? '',
      createdAt: movement.createdAt.toISOString(),
    }));
  }

  async restock(
    code: string,
    amountToAdd: number,
    supplierOrNote = 'Nhập bổ sung kho',
  ): Promise<{ ingredient: Ingredient; receipt: InboundReceipt }> {
    const normalizedAmount = this.roundStock(amountToAdd);
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      throw new BadRequestException('Số lượng nhập hàng phải lớn hơn 0');
    }

    return this.prisma.$transaction(async (tx) => {
      const material = await tx.ingredient.findUnique({ where: { code } });
      if (!material) {
        throw new NotFoundException(`Không tìm thấy nguyên vật liệu có mã ${code}`);
      }

      const updated = await tx.ingredient.update({
        where: { id: material.id },
        data: { currentStock: { increment: new Prisma.Decimal(normalizedAmount) } },
      });
      const afterStock = this.roundStock(Number(updated.currentStock));
      const beforeStock = this.roundStock(afterStock - normalizedAmount);
      const movement = await this.recordMovement(
        tx,
        material,
        InventoryMovementType.RESTOCK,
        normalizedAmount,
        beforeStock,
        afterStock,
        supplierOrNote,
      );

      return {
        ingredient: this.toIngredient(updated),
        receipt: {
          id: movement.id,
          ingredientCode: material.code,
          ingredientName: material.name,
          amountAdded: normalizedAmount,
          unit: material.unit,
          beforeStock,
          afterStock,
          supplierOrNote,
          createdAt: movement.createdAt.toISOString(),
        },
      };
    });
  }

  async updateMaterialStock(code: string, newStock: number): Promise<Ingredient> {
    if (!Number.isFinite(newStock) || newStock < 0) {
      throw new BadRequestException('Số lượng tồn kho phải là số không âm');
    }

    return this.prisma.$transaction(async (tx) => {
      const material = await tx.ingredient.findUnique({ where: { code } });
      if (!material) {
        throw new NotFoundException(`Không tìm thấy nguyên vật liệu có mã ${code}`);
      }

      const beforeStock = Number(material.currentStock);
      const afterStock = this.roundStock(newStock);
      const updated = await tx.ingredient.update({
        where: { id: material.id },
        data: { currentStock: new Prisma.Decimal(afterStock) },
      });

      if (beforeStock !== afterStock) {
        await this.recordMovement(
          tx,
          material,
          InventoryMovementType.ADJUSTMENT,
          Math.abs(afterStock - beforeStock),
          beforeStock,
          afterStock,
          'Điều chỉnh tồn kho thủ công',
        );
      }

      return this.toIngredient(updated);
    });
  }

  async getRecipes(): Promise<ProductRecipe[]> {
    const rows = await this.prisma.productRecipe.findMany({
      orderBy: [
        { productCode: 'asc' },
        { size: 'asc' },
        { ingredientId: 'asc' },
      ],
      include: {
        product: { select: { code: true, name: true, category: true } },
        ingredient: { select: { code: true } },
      },
    });
    const recipes = new Map<string, ProductRecipe>();

    for (const row of rows) {
      let recipe = recipes.get(row.productCode);
      if (!recipe) {
        recipe = {
          productCode: row.product.code,
          productName: row.product.name,
          category: row.product.category,
          recipes: { REGULAR: [], LARGE: [] },
        };
        recipes.set(row.productCode, recipe);
      }
      recipe.recipes[row.size].push({
        ingredientCode: row.ingredient.code,
        amount: Number(row.amount),
      });
    }
    return Array.from(recipes.values());
  }

  async hasRecipe(
    productCode: string,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<boolean> {
    const row = await tx.productRecipe.findFirst({
      where: { productCode },
      select: { id: true },
    });
    return row !== null;
  }

  async calculateBottleneck(
    productCode: string,
    size: RecipeSize = RecipeSize.REGULAR,
  ): Promise<BottleneckForecast> {
    const rows = await this.prisma.productRecipe.findMany({
      where: { productCode },
      include: {
        product: { select: { code: true, name: true } },
        ingredient: true,
      },
    });
    if (rows.length === 0) {
      throw new NotFoundException(`Không tìm thấy công thức cho mã món ${productCode}`);
    }

    const recipeRows = rows.filter((row) => row.size === size);
    if (recipeRows.length === 0) {
      throw new BadRequestException(`Chưa cấu hình định mức cho kích cỡ ${size}`);
    }

    let minCups = Number.MAX_SAFE_INTEGER;
    let bottleneckCode = '';
    let bottleneckName = '';
    const breakdown: IngredientBreakdown[] = recipeRows.map((row) => {
      const currentStock = Number(row.ingredient.currentStock);
      const amountPerCup = Number(row.amount);
      const availableCups = Math.floor(currentStock / amountPerCup);
      if (availableCups < minCups) {
        minCups = availableCups;
        bottleneckCode = row.ingredient.code;
        bottleneckName = row.ingredient.name;
      }
      return {
        ingredientCode: row.ingredient.code,
        ingredientName: row.ingredient.name,
        currentStock,
        amountPerCup,
        unit: row.ingredient.unit,
        availableCups,
        isBottleneck: false,
      };
    });

    for (const item of breakdown) {
      item.isBottleneck = item.ingredientCode === bottleneckCode;
    }
    const maxCups = Math.max(0, minCups);
    const formulaTerms = breakdown.map(
      (item) => `⌊${item.currentStock}${item.unit} / ${item.amountPerCup}${item.unit}⌋ = ${item.availableCups}`,
    );
    return {
      productCode: rows[0].product.code,
      productName: rows[0].product.name,
      size,
      maxCups,
      bottleneckIngredientCode: bottleneckCode,
      bottleneckIngredientName: bottleneckName,
      formula: `Q = min(${formulaTerms.join(', ')}) = ${maxCups} ly`,
      breakdown,
    };
  }

  async calculateAllBottlenecks(
    size: RecipeSize = RecipeSize.REGULAR,
  ): Promise<BottleneckForecast[]> {
    const recipes = await this.getRecipes();
    return Promise.all(
      recipes.map((recipe) => this.calculateBottleneck(recipe.productCode, size)),
    );
  }

  async deductRecipe(
    productCode: string,
    size: RecipeSize = RecipeSize.REGULAR,
    quantity = 1,
    tx?: Prisma.TransactionClient,
  ): Promise<{
    success: boolean;
    deducted: Array<{ name: string; amount: number; remaining: number }>;
  }> {
    if (!Number.isSafeInteger(quantity) || quantity <= 0) {
      throw new BadRequestException('Số lượng đặt phải là số nguyên dương');
    }
    const deduct = (client: Prisma.TransactionClient) =>
      this.deductRecipeInTransaction(client, productCode, size, quantity);
    return tx ? deduct(tx) : this.prisma.$transaction(deduct);
  }

  async restoreRecipe(
    productCode: string,
    size: RecipeSize = RecipeSize.REGULAR,
    quantity = 1,
    tx?: Prisma.TransactionClient,
    movementType: InventoryMovementType = InventoryMovementType.ORDER_CANCELLED,
  ): Promise<boolean> {
    if (!Number.isSafeInteger(quantity) || quantity <= 0) {
      throw new BadRequestException('Số lượng hoàn kho phải là số nguyên dương');
    }
    const restore = async (client: Prisma.TransactionClient): Promise<boolean> => {
      const recipeRows = await client.productRecipe.findMany({
        where: { productCode, size },
        orderBy: { ingredientId: 'asc' },
        include: { ingredient: true },
      });
      if (recipeRows.length === 0) return false;

      for (const row of recipeRows) {
        const amount = this.roundStock(Number(row.amount) * quantity);
        const updated = await client.ingredient.update({
          where: { id: row.ingredientId },
          data: { currentStock: { increment: new Prisma.Decimal(amount) } },
        });
        const afterStock = this.roundStock(Number(updated.currentStock));
        const beforeStock = this.roundStock(afterStock - amount);
        await this.recordMovement(
          client,
          row.ingredient,
          movementType,
          amount,
          beforeStock,
          afterStock,
          `${movementType === InventoryMovementType.PAYMENT_FAILED ? 'Hoàn kho do thanh toán thất bại' : 'Hoàn kho đơn hàng'} (${productCode}, ${size}, ${quantity})`,
        );
      }
      return true;
    };
    return tx ? restore(tx) : this.prisma.$transaction(restore);
  }

  private async deductRecipeInTransaction(
    tx: Prisma.TransactionClient,
    productCode: string,
    size: RecipeSize,
    quantity: number,
  ): Promise<{
    success: boolean;
    deducted: Array<{ name: string; amount: number; remaining: number }>;
  }> {
    const recipeRows = await tx.productRecipe.findMany({
      where: { productCode, size },
      orderBy: { ingredientId: 'asc' },
      include: { ingredient: true },
    });
    if (recipeRows.length === 0) {
      const hasAnySize = await tx.productRecipe.findFirst({
        where: { productCode },
        select: { id: true },
      });
      if (hasAnySize) {
        throw new BadRequestException(`Chưa cấu hình định mức cho kích cỡ ${size}`);
      }
      throw new NotFoundException(`Không tìm thấy công thức cho món ${productCode}`);
    }

    for (const row of recipeRows) {
      const required = this.roundStock(Number(row.amount) * quantity);
      const currentStock = Number(row.ingredient.currentStock);
      if (currentStock < required) {
        throw new BadRequestException({
          errorCode: 'OUT_OF_STOCK_INGREDIENT',
          message: `Không đủ ${row.ingredient.name}. Cần ${required}${row.ingredient.unit}, trong kho chỉ còn ${currentStock}${row.ingredient.unit}`,
          missingIngredient: row.ingredient.name,
          ingredientCode: row.ingredient.code,
          currentStock,
          requiredStock: required,
        });
      }
    }

    const deducted: Array<{ name: string; amount: number; remaining: number }> = [];
    for (const row of recipeRows) {
      const amount = this.roundStock(Number(row.amount) * quantity);
      const result = await tx.ingredient.updateMany({
        where: {
          id: row.ingredientId,
          currentStock: { gte: new Prisma.Decimal(amount) },
        },
        data: { currentStock: { decrement: new Prisma.Decimal(amount) } },
      });
      if (result.count !== 1) {
        const current = await tx.ingredient.findUnique({
          where: { id: row.ingredientId },
          select: { currentStock: true },
        });
        const currentStock = current ? Number(current.currentStock) : 0;
        throw new BadRequestException({
          errorCode: 'OUT_OF_STOCK_INGREDIENT',
          message: `Không đủ ${row.ingredient.name}. Cần ${amount}${row.ingredient.unit}, trong kho chỉ còn ${currentStock}${row.ingredient.unit}`,
          missingIngredient: row.ingredient.name,
          ingredientCode: row.ingredient.code,
          currentStock,
          requiredStock: amount,
        });
      }
      const updated = await tx.ingredient.findUnique({
        where: { id: row.ingredientId },
        select: { currentStock: true },
      });
      if (!updated) {
        throw new NotFoundException(`Nguyên liệu ${row.ingredient.code} không còn tồn tại`);
      }
      const afterStock = this.roundStock(Number(updated.currentStock));
      const beforeStock = this.roundStock(afterStock + amount);
      await this.recordMovement(
        tx,
        row.ingredient,
        InventoryMovementType.SALE,
        amount,
        beforeStock,
        afterStock,
        `Xuất kho theo BOM (${productCode}, ${size}, ${quantity})`,
      );
      deducted.push({ name: row.ingredient.name, amount, remaining: afterStock });
    }
    return { success: true, deducted };
  }

  private async recordMovement(
    tx: Prisma.TransactionClient,
    material: {
      id: string;
      code: string;
      name: string;
      unit: string;
    },
    type: InventoryMovementType,
    amount: number,
    beforeStock: number,
    afterStock: number,
    note?: string,
  ) {
    return tx.inventoryMovement.create({
      data: {
        ingredientId: material.id,
        ingredientCodeSnapshot: material.code,
        ingredientNameSnapshot: material.name,
        unitSnapshot: material.unit,
        type,
        amount: new Prisma.Decimal(this.roundStock(amount)),
        beforeStock: new Prisma.Decimal(this.roundStock(beforeStock)),
        afterStock: new Prisma.Decimal(this.roundStock(afterStock)),
        note: note ?? null,
      },
    });
  }

  private toIngredient(material: {
    code: string;
    name: string;
    unit: string;
    currentStock: Prisma.Decimal;
    baselineStock: Prisma.Decimal;
    minThreshold: Prisma.Decimal;
    category: string;
  }): Ingredient {
    return {
      code: material.code,
      name: material.name,
      unit: material.unit as Ingredient['unit'],
      currentStock: Number(material.currentStock),
      baselineStock: Number(material.baselineStock),
      minThreshold: Number(material.minThreshold),
      category: material.category,
    };
  }

  private roundStock(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
