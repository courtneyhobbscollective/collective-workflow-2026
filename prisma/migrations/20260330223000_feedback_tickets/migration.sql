-- CreateEnum
CREATE TYPE "FeedbackTicketStatus" AS ENUM ('new', 'in_review', 'resolved', 'rejected');

-- CreateTable
CREATE TABLE "FeedbackTicket" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "role" "UserRole" NOT NULL,
    "email" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "pagePath" TEXT,
    "status" "FeedbackTicketStatus" NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedbackTicket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeedbackTicket_status_createdAt_idx" ON "FeedbackTicket"("status", "createdAt");

-- CreateIndex
CREATE INDEX "FeedbackTicket_userId_idx" ON "FeedbackTicket"("userId");

-- AddForeignKey
ALTER TABLE "FeedbackTicket" ADD CONSTRAINT "FeedbackTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
