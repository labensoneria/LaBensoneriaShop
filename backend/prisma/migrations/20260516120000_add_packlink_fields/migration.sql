-- AlterTable
ALTER TABLE "Product" ADD COLUMN "weightGrams" INTEGER NOT NULL DEFAULT 250;

-- AlterTable
ALTER TABLE "Order"
  ADD COLUMN "deliveryType" TEXT,
  ADD COLUMN "packlinkServiceId" INTEGER,
  ADD COLUMN "packlinkCarrierName" TEXT,
  ADD COLUMN "packlinkServiceName" TEXT,
  ADD COLUMN "packlinkShipmentRef" TEXT,
  ADD COLUMN "packlinkTrackingNumber" TEXT,
  ADD COLUMN "packlinkTrackingUrl" TEXT,
  ADD COLUMN "packlinkLabelUrl" TEXT,
  ADD COLUMN "pickupPointId" TEXT,
  ADD COLUMN "pickupPointName" TEXT,
  ADD COLUMN "pickupPointAddress" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_packlinkShipmentRef_key" ON "Order"("packlinkShipmentRef");
