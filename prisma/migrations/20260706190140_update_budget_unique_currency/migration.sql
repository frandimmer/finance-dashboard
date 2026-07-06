/*
  Warnings:

  - A unique constraint covering the columns `[userId,categoryId,currency,month,year]` on the table `Budget` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Budget_userId_categoryId_month_year_key";

-- CreateIndex
CREATE UNIQUE INDEX "Budget_userId_categoryId_currency_month_year_key" ON "Budget"("userId", "categoryId", "currency", "month", "year");
