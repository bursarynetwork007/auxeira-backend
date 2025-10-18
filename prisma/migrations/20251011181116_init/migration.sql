-- CreateTable
CREATE TABLE "DashboardLocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dashboardType" TEXT NOT NULL,
    "originalPath" TEXT NOT NULL,
    "currentPath" TEXT NOT NULL,
    "s3Bucket" TEXT,
    "cloudFrontUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastAccessed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "movedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "StartupProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "foundedDate" DATETIME NOT NULL,
    "sseScore" INTEGER NOT NULL DEFAULT 0,
    "sseScoreHistory" TEXT NOT NULL DEFAULT '[]',
    "lastSSEUpdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mrr" REAL NOT NULL DEFAULT 0,
    "arr" REAL NOT NULL DEFAULT 0,
    "growthRate" REAL NOT NULL DEFAULT 0,
    "burnRate" REAL NOT NULL DEFAULT 0,
    "runway" INTEGER NOT NULL DEFAULT 0,
    "employees" INTEGER NOT NULL DEFAULT 0,
    "customers" INTEGER NOT NULL DEFAULT 0,
    "lastMetricsUpdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "DashboardLocation_dashboardType_key" ON "DashboardLocation"("dashboardType");

-- CreateIndex
CREATE INDEX "DashboardLocation_dashboardType_idx" ON "DashboardLocation"("dashboardType");

-- CreateIndex
CREATE UNIQUE INDEX "StartupProfile_userId_key" ON "StartupProfile"("userId");

-- CreateIndex
CREATE INDEX "StartupProfile_userId_idx" ON "StartupProfile"("userId");

-- CreateIndex
CREATE INDEX "StartupProfile_lastMetricsUpdate_idx" ON "StartupProfile"("lastMetricsUpdate");
