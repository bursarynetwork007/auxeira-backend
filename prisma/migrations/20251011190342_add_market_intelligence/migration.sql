-- CreateTable
CREATE TABLE "MarketIntelligence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sector" TEXT NOT NULL,
    "growth" REAL NOT NULL,
    "funding" REAL NOT NULL,
    "dealCount" INTEGER NOT NULL,
    "avgValuation" REAL NOT NULL,
    "momentum" TEXT NOT NULL,
    "hotKeywords" TEXT NOT NULL DEFAULT '[]',
    "emergingTrends" TEXT NOT NULL DEFAULT '[]',
    "riskFactors" TEXT NOT NULL DEFAULT '[]',
    "lastUpdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "MarketIntelligence_sector_key" ON "MarketIntelligence"("sector");

-- CreateIndex
CREATE INDEX "MarketIntelligence_sector_idx" ON "MarketIntelligence"("sector");
