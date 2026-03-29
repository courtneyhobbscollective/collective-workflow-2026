-- CreateEnum
CREATE TYPE "ClientEngagementType" AS ENUM ('retainer', 'project');

-- AlterTable
ALTER TABLE "Client" ADD COLUMN "engagementType" "ClientEngagementType" NOT NULL DEFAULT 'project';
