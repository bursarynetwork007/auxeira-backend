-- CreateTable
CREATE TABLE "ESGPortfolioCompany" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "investorId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "investment" REAL NOT NULL,
    "currentValue" REAL NOT NULL,
    "roi" REAL NOT NULL,
    "impactScore" INTEGER NOT NULL,
    "studentsReached" INTEGER NOT NULL DEFAULT 0,
    "teachersTrained" INTEGER NOT NULL DEFAULT 0,
    "schoolsSupported" INTEGER NOT NULL DEFAULT 0,
    "sdgAlignment" TEXT NOT NULL DEFAULT '[]',
    "literacyGain" REAL,
    "numeracyGain" REAL,
    "digitalLiteracy" REAL,
    "genderParity" REAL,
    "status" TEXT NOT NULL,
    "lastUpdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextMilestone" TEXT,
    "riskLevel" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "ESGPortfolioCompany_investorId_idx" ON "ESGPortfolioCompany"("investorId");

-- CreateIndex
CREATE INDEX "ESGPortfolioCompany_impactScore_idx" ON "ESGPortfolioCompany"("impactScore");
