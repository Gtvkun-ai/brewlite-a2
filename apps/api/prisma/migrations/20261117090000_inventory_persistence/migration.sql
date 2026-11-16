-- Persist BOM data and its audit trail in PostgreSQL.
CREATE TYPE "RecipeSize" AS ENUM ('REGULAR', 'LARGE');

CREATE TYPE "InventoryMovementType" AS ENUM (
    'OPENING',
    'RESTOCK',
    'ADJUSTMENT',
    'SALE',
    'ORDER_CANCELLED'
);

CREATE TABLE "Ingredient" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "currentStock" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "baselineStock" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "minThreshold" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Ingredient_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductRecipe" (
    "id" TEXT NOT NULL,
    "productCode" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "size" "RecipeSize" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    CONSTRAINT "ProductRecipe_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InventoryMovement" (
    "id" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "ingredientCodeSnapshot" TEXT NOT NULL,
    "ingredientNameSnapshot" TEXT NOT NULL,
    "unitSnapshot" TEXT NOT NULL,
    "type" "InventoryMovementType" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "beforeStock" DECIMAL(14,2) NOT NULL,
    "afterStock" DECIMAL(14,2) NOT NULL,
    "note" TEXT,
    "referenceKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Ingredient_code_key" ON "Ingredient"("code");
CREATE UNIQUE INDEX "ProductRecipe_productCode_size_ingredientId_key"
    ON "ProductRecipe"("productCode", "size", "ingredientId");
CREATE INDEX "ProductRecipe_ingredientId_idx" ON "ProductRecipe"("ingredientId");
CREATE UNIQUE INDEX "InventoryMovement_referenceKey_key"
    ON "InventoryMovement"("referenceKey");
CREATE INDEX "InventoryMovement_ingredientId_createdAt_idx"
    ON "InventoryMovement"("ingredientId", "createdAt");
CREATE INDEX "InventoryMovement_type_createdAt_idx"
    ON "InventoryMovement"("type", "createdAt");

ALTER TABLE "ProductRecipe"
    ADD CONSTRAINT "ProductRecipe_productCode_fkey"
    FOREIGN KEY ("productCode") REFERENCES "Product"("code")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductRecipe"
    ADD CONSTRAINT "ProductRecipe_ingredientId_fkey"
    FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryMovement"
    ADD CONSTRAINT "InventoryMovement_ingredientId_fkey"
    FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
