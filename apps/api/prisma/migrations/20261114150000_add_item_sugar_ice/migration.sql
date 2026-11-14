-- Defaults preserve existing order lines. Customizations belong to each drink.
ALTER TABLE "OrderItem"
  ADD COLUMN "selectedSugar" INTEGER NOT NULL DEFAULT 100,
  ADD COLUMN "selectedIce" TEXT NOT NULL DEFAULT 'NORMAL';

ALTER TABLE "OrderItem"
  ADD CONSTRAINT "OrderItem_selectedSugar_check" CHECK ("selectedSugar" IN (0, 50, 70, 100)),
  ADD CONSTRAINT "OrderItem_selectedIce_check" CHECK ("selectedIce" IN ('NORMAL', 'LESS', 'SEPARATE', 'NONE'));
