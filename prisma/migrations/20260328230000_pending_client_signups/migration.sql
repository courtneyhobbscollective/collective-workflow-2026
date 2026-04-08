-- CreateEnum
CREATE TYPE "PendingClientSignupStatus" AS ENUM ('pending', 'approved', 'rejected');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;

-- CreateTable
CREATE TABLE "PendingClientSignup" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "passwordHash" TEXT NOT NULL,
    "status" "PendingClientSignupStatus" NOT NULL DEFAULT 'pending',
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "rejectionReason" TEXT,
    "createdUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PendingClientSignup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PendingClientSignup_createdUserId_key" ON "PendingClientSignup"("createdUserId");

CREATE INDEX "PendingClientSignup_email_idx" ON "PendingClientSignup"("email");

CREATE INDEX "PendingClientSignup_status_createdAt_idx" ON "PendingClientSignup"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "PendingClientSignup" ADD CONSTRAINT "PendingClientSignup_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PendingClientSignup" ADD CONSTRAINT "PendingClientSignup_createdUserId_fkey" FOREIGN KEY ("createdUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
