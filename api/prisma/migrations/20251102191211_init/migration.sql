-- AlterTable
ALTER TABLE "User" ADD COLUMN "address" TEXT;
ALTER TABLE "User" ADD COLUMN "organization" TEXT;
ALTER TABLE "User" ADD COLUMN "phone" TEXT;
ALTER TABLE "User" ADD COLUMN "timezone" TEXT;

-- AlterTable
ALTER TABLE "Wallet" ADD COLUMN "paymentMethod" TEXT;
ALTER TABLE "Wallet" ADD COLUMN "payoutDetails" TEXT;
