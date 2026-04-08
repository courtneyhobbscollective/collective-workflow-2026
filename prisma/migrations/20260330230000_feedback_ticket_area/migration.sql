-- CreateEnum
CREATE TYPE "FeedbackTicketArea" AS ENUM ('home', 'sales', 'delivery', 'comms', 'business', 'settings', 'portal', 'other');

-- AlterTable
ALTER TABLE "FeedbackTicket" ADD COLUMN "area" "FeedbackTicketArea" NOT NULL DEFAULT 'other';
