/*
  Warnings:

  - The `preferredCurrency` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('ARS', 'USD');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "preferredCurrency",
ADD COLUMN     "preferredCurrency" "Currency" NOT NULL DEFAULT 'ARS';
