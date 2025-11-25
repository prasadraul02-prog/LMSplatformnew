-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "trainingLevel" TEXT NOT NULL DEFAULT 'UNTRAINED',
    "department" TEXT,
    "designation" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "region" TEXT,
    "additionalData" TEXT,
    "uploadBatchId" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkshopManager" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkshopManager_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingRequest" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "originalLocation" TEXT NOT NULL,
    "trainingLocation" TEXT NOT NULL,
    "wmId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approveToken" TEXT,
    "rejectToken" TEXT,
    "requestSentAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "batchId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_employeeId_key" ON "Employee"("employeeId");

-- CreateIndex
CREATE INDEX "Employee_location_idx" ON "Employee"("location");

-- CreateIndex
CREATE INDEX "Employee_trainingLevel_idx" ON "Employee"("trainingLevel");

-- CreateIndex
CREATE UNIQUE INDEX "WorkshopManager_email_key" ON "WorkshopManager"("email");

-- CreateIndex
CREATE INDEX "WorkshopManager_location_idx" ON "WorkshopManager"("location");

-- CreateIndex
CREATE INDEX "WorkshopManager_email_idx" ON "WorkshopManager"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingRequest_approveToken_key" ON "TrainingRequest"("approveToken");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingRequest_rejectToken_key" ON "TrainingRequest"("rejectToken");

-- CreateIndex
CREATE INDEX "TrainingRequest_status_idx" ON "TrainingRequest"("status");

-- CreateIndex
CREATE INDEX "TrainingRequest_batchId_idx" ON "TrainingRequest"("batchId");

-- CreateIndex
CREATE INDEX "TrainingRequest_wmId_idx" ON "TrainingRequest"("wmId");

-- CreateIndex
CREATE UNIQUE INDEX "Location_name_key" ON "Location"("name");

-- CreateIndex
CREATE INDEX "Location_name_idx" ON "Location"("name");

-- AddForeignKey
ALTER TABLE "TrainingRequest" ADD CONSTRAINT "TrainingRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingRequest" ADD CONSTRAINT "TrainingRequest_wmId_fkey" FOREIGN KEY ("wmId") REFERENCES "WorkshopManager"("id") ON DELETE SET NULL ON UPDATE CASCADE;
