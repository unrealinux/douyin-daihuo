-- CreateTable
CREATE TABLE "Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "imageUrl" TEXT,
    "category" TEXT,
    "price" REAL,
    "commissionRate" REAL,
    "dailySales" INTEGER,
    "trend" TEXT NOT NULL DEFAULT 'STEADY',
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "status" TEXT NOT NULL DEFAULT 'CANDIDATE',
    "platform" TEXT,
    "track" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ScrapeTask" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER,
    "type" TEXT NOT NULL DEFAULT 'KEYWORD',
    "keyword" TEXT,
    "url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "message" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" DATETIME,
    "finishedAt" DATETIME,
    CONSTRAINT "ScrapeTask_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScriptIdea" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER,
    "benchmarkId" INTEGER,
    "title" TEXT,
    "hook" TEXT,
    "body" TEXT NOT NULL,
    "shotScript" TEXT,
    "shots" TEXT,
    "coverPrompt" TEXT,
    "commentScript" TEXT,
    "hashtags" TEXT,
    "style" TEXT NOT NULL DEFAULT 'SPOKEN',
    "durationSec" INTEGER NOT NULL DEFAULT 30,
    "llmModel" TEXT,
    "similarity" REAL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScriptIdea_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ScriptIdea_benchmarkId_fkey" FOREIGN KEY ("benchmarkId") REFERENCES "Benchmark" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER,
    "scriptId" INTEGER,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileType" TEXT NOT NULL DEFAULT 'VIDEO',
    "size" INTEGER NOT NULL DEFAULT 0,
    "coverPath" TEXT,
    "title" TEXT,
    "tags" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Asset_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Asset_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "ScriptIdea" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Schedule" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "assetId" INTEGER NOT NULL,
    "accountId" INTEGER,
    "scheduledAt" DATETIME NOT NULL,
    "publishStatus" TEXT NOT NULL DEFAULT 'PLANNED',
    "publishUrl" TEXT,
    "publishedAt" DATETIME,
    "checklist" TEXT,
    "publishTitle" TEXT,
    "publishHashtags" TEXT,
    "commentScript" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Schedule_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Schedule_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Account" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "platform" TEXT,
    "track" TEXT,
    "handle" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "followerCount" INTEGER,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Performance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "scheduleId" INTEGER NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "favorites" INTEGER NOT NULL DEFAULT 0,
    "orderCount" INTEGER NOT NULL DEFAULT 0,
    "gmv" REAL NOT NULL DEFAULT 0,
    "commission" REAL NOT NULL DEFAULT 0,
    "completionRate" REAL,
    "threeSecRate" REAL,
    "avgWatchSec" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Performance_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Benchmark" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "platform" TEXT,
    "track" TEXT,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "url" TEXT,
    "coverPath" TEXT,
    "transcript" TEXT,
    "durationSec" INTEGER,
    "views" INTEGER,
    "likes" INTEGER,
    "favorites" INTEGER,
    "shares" INTEGER,
    "comments" INTEGER,
    "publishedAt" DATETIME,
    "hookType" TEXT,
    "breakdown" TEXT,
    "productId" INTEGER,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Benchmark_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "Product_status_idx" ON "Product"("status");

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE INDEX "Product_track_idx" ON "Product"("track");

-- CreateIndex
CREATE INDEX "Schedule_scheduledAt_idx" ON "Schedule"("scheduledAt");

-- CreateIndex
CREATE INDEX "Schedule_accountId_idx" ON "Schedule"("accountId");

-- CreateIndex
CREATE INDEX "Account_status_idx" ON "Account"("status");

-- CreateIndex
CREATE INDEX "Account_track_idx" ON "Account"("track");

-- CreateIndex
CREATE UNIQUE INDEX "Performance_scheduleId_key" ON "Performance"("scheduleId");

-- CreateIndex
CREATE INDEX "Benchmark_track_idx" ON "Benchmark"("track");

-- CreateIndex
CREATE INDEX "Benchmark_platform_idx" ON "Benchmark"("platform");

