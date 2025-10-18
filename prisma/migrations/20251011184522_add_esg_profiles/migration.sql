-- CreateTable
CREATE TABLE "ESGInvestorProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "investorName" TEXT,
    "fundName" TEXT,
    "investorType" TEXT,
    "tier" TEXT NOT NULL DEFAULT 'free',
    "focusAreas" TEXT NOT NULL DEFAULT '[]',
    "geographicFocus" TEXT NOT NULL DEFAULT '[]',
    "ticketSize" TEXT,
    "stagePreference" TEXT NOT NULL DEFAULT '[]',
    "primarySDG" TEXT NOT NULL DEFAULT '[]',
    "impactMetrics" TEXT NOT NULL DEFAULT '[]',
    "theoryOfChange" TEXT,
    "reportingFrequency" TEXT NOT NULL DEFAULT 'daily',
    "preferredInsights" TEXT NOT NULL DEFAULT '[]',
    "narrativeStyle" TEXT NOT NULL DEFAULT 'data_driven',
    "aiPersonaType" TEXT,
    "readingLevel" TEXT NOT NULL DEFAULT 'expert',
    "preferredLength" TEXT NOT NULL DEFAULT 'concise',
    "profileCompleteness" INTEGER NOT NULL DEFAULT 0,
    "lastNudge" DATETIME,
    "nudgeCount" INTEGER NOT NULL DEFAULT 0,
    "freeReportsUsed" INTEGER NOT NULL DEFAULT 0,
    "paidReportsGenerated" INTEGER NOT NULL DEFAULT 0,
    "lastReportDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AIGeneratedReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executiveSummary" TEXT NOT NULL,
    "keyInsights" TEXT NOT NULL,
    "narrativeBody" TEXT NOT NULL,
    "dataVisualizations" TEXT NOT NULL,
    "recommendations" TEXT NOT NULL,
    "promptUsed" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL DEFAULT 'nanogpt-5',
    "tokensUsed" INTEGER,
    "generationTime" INTEGER,
    "isTeaser" BOOLEAN NOT NULL DEFAULT false,
    "teaserContent" TEXT,
    "requiresPayment" BOOLEAN NOT NULL DEFAULT false,
    "unlockPrice" REAL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "feedbackRating" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AIGeneratedReport_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "ESGInvestorProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ESGInvestorProfile_userId_key" ON "ESGInvestorProfile"("userId");

-- CreateIndex
CREATE INDEX "ESGInvestorProfile_userId_idx" ON "ESGInvestorProfile"("userId");

-- CreateIndex
CREATE INDEX "ESGInvestorProfile_tier_idx" ON "ESGInvestorProfile"("tier");

-- CreateIndex
CREATE UNIQUE INDEX "AIGeneratedReport_reportId_key" ON "AIGeneratedReport"("reportId");

-- CreateIndex
CREATE INDEX "AIGeneratedReport_investorId_idx" ON "AIGeneratedReport"("investorId");

-- CreateIndex
CREATE INDEX "AIGeneratedReport_reportType_idx" ON "AIGeneratedReport"("reportType");
