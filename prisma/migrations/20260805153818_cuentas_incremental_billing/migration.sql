/*
  Warnings:

  - You are about to drop the column `publishedAt` on the `MonthlyBill` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `MonthlyBill` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BillItem" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "dayOfMonth" INTEGER,
ADD COLUMN     "excludedUserIds" TEXT[],
ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "MonthlyBill" DROP COLUMN "publishedAt",
DROP COLUMN "status";

-- DropEnum
DROP TYPE "BillStatus";
