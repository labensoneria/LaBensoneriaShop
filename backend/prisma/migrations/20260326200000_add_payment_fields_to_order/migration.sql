-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PAID', 'FAILED', 'REFUNDED');

-- AlterTable
ALTER TABLE "Order"
ADD COLUMN "paymentStatus"           "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
ADD COLUMN "paymentProvider"         TEXT,
ADD COLUMN "stripeCheckoutSessionId" TEXT,
ADD COLUMN "stripePaymentIntentId"   TEXT,
ADD COLUMN "paidAt"                  TIMESTAMP(3),
ADD COLUMN "paymentCurrency"         TEXT,
ADD COLUMN "paymentAmount"           DECIMAL(10,2);

-- CreateIndex
CREATE UNIQUE INDEX "Order_stripeCheckoutSessionId_key" ON "Order"("stripeCheckoutSessionId");
