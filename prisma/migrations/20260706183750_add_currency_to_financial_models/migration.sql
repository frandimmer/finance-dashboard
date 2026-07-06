/*
  Warnings:

  - The `currency` column on the `Transaction` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Budget" ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'ARS';

-- AlterTable
ALTER TABLE "RecurringTransaction" ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'ARS';

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "currency",
ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'ARS';
