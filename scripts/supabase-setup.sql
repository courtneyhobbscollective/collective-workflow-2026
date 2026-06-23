-- =============================================================================
-- Workflow MVP — Supabase database setup
-- =============================================================================
-- Run in: Supabase Dashboard → SQL Editor → New query
--
-- This app uses Supabase as PostgreSQL hosting. All data access goes through
-- Prisma on the server (Next.js / Netlify). Auth is app-level (bcrypt + cookies),
-- not Supabase Auth.
--
-- Recommended order:
--   1. Run SECTION 1 (schema) on a fresh Supabase project
--   2. Run SECTION 2 (RLS lockdown)
--   3. Run SECTION 3 (optional admin user) OR seed from your machine (see README note)
-- =============================================================================


-- =============================================================================
-- SECTION 1 — Full application schema (current Prisma schema)
-- =============================================================================

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'team_member', 'client');

-- CreateEnum
CREATE TYPE "PendingClientSignupStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "FeedbackTicketStatus" AS ENUM ('new', 'in_review', 'resolved', 'rejected');

-- CreateEnum
CREATE TYPE "FeedbackTicketArea" AS ENUM ('home', 'sales', 'delivery', 'comms', 'business', 'settings', 'portal', 'other');

-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('active', 'paused', 'archived');

-- CreateEnum
CREATE TYPE "ClientEngagementType" AS ENUM ('retainer', 'project');

-- CreateEnum
CREATE TYPE "ScopeType" AS ENUM ('retainer', 'project', 'ad_hoc');

-- CreateEnum
CREATE TYPE "ServiceProductKind" AS ENUM ('fixed_package', 'retainer_template');

-- CreateEnum
CREATE TYPE "BriefPriority" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "BriefStatus" AS ENUM ('draft', 'awaiting_internal_start', 'scheduled', 'in_progress', 'awaiting_client_review', 'amends_requested', 'first_round_amends', 'second_round_amends', 'approved', 'completed', 'archived');

-- CreateEnum
CREATE TYPE "BriefType" AS ENUM ('web_design_dev', 'app_dev', 'video', 'photo', 'design', 'content');

-- CreateEnum
CREATE TYPE "ScopeStatus" AS ENUM ('in_scope', 'watch_scope', 'out_of_scope', 'awaiting_admin_review');

-- CreateEnum
CREATE TYPE "DeliverableType" AS ENUM ('video', 'image', 'design', 'web', 'strategy', 'other');

-- CreateEnum
CREATE TYPE "AssignmentRole" AS ENUM ('producer', 'editor', 'shooter', 'designer', 'pm', 'other');

-- CreateEnum
CREATE TYPE "BookingType" AS ENUM ('shoot', 'edit', 'amends', 'review', 'delivery', 'internal', 'other');

-- CreateEnum
CREATE TYPE "InternalNoteType" AS ENUM ('general', 'scope', 'risk', 'handover', 'blocker');

-- CreateEnum
CREATE TYPE "ThreadType" AS ENUM ('client', 'internal');

-- CreateEnum
CREATE TYPE "ClientContactRole" AS ENUM ('point_of_contact', 'accounts_contact', 'other');

-- CreateEnum
CREATE TYPE "ClientAssetType" AS ENUM ('brand_guidelines', 'other');

-- CreateEnum
CREATE TYPE "TeamChannelMessageKind" AS ENUM ('user', 'system');

-- CreateEnum
CREATE TYPE "LeadPipelineStatus" AS ENUM ('active', 'contacted', 'quoted', 'followed_up', 'won', 'lost');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "avatarUrl" TEXT,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL,
    "clientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "FeedbackTicket" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "role" "UserRole" NOT NULL,
    "email" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "area" "FeedbackTicketArea" NOT NULL DEFAULT 'other',
    "message" TEXT NOT NULL,
    "pagePath" TEXT,
    "status" "FeedbackTicketStatus" NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedbackTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ClientStatus" NOT NULL DEFAULT 'active',
    "engagementType" "ClientEngagementType" NOT NULL DEFAULT 'project',
    "brandSummary" TEXT,
    "email" TEXT,
    "phoneNumber" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/London',
    "relationshipContactFrequencyDays" INTEGER,
    "nextRelationshipContactDueAt" TIMESTAMP(3),
    "lastRelationshipContactAt" TIMESTAMP(3),
    "relationshipContactLastNotifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "companyName" TEXT,
    "position" TEXT,
    "phoneNumber" TEXT,
    "status" "LeadPipelineStatus" NOT NULL DEFAULT 'active',
    "lastContactedAt" TIMESTAMP(3),
    "nextFollowUpDueAt" TIMESTAMP(3),
    "followUpReminderNotifiedAt" TIMESTAMP(3),
    "quotedAt" TIMESTAMP(3),
    "followedUpAt" TIMESTAMP(3),
    "wonAt" TIMESTAMP(3),
    "lostAt" TIMESTAMP(3),
    "lostReason" TEXT,
    "notes" TEXT,
    "quoteSnapshot" JSONB,
    "contractCustomBody" TEXT,
    "convertedClientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamChannel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "clientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamChannelMember" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamChannelMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamChannelMessage" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "senderId" TEXT,
    "kind" "TeamChannelMessageKind" NOT NULL DEFAULT 'user',
    "body" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamChannelMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DmThread" (
    "id" TEXT NOT NULL,
    "lowUserId" TEXT NOT NULL,
    "highUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DmThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DmMessage" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DmMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientContact" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "title" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "role" "ClientContactRole" NOT NULL DEFAULT 'other',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientAsset" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" "ClientAssetType" NOT NULL DEFAULT 'brand_guidelines',
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceProduct" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "kind" "ServiceProductKind" NOT NULL,
    "scopeType" "ScopeType" NOT NULL,
    "serviceType" "BriefType",
    "serviceDetails" JSONB,
    "monthlyRetainer" DOUBLE PRECISION,
    "projectBudget" DOUBLE PRECISION,
    "defaultDeadlineDays" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceProductDeliverableTemplate" (
    "id" TEXT NOT NULL,
    "serviceProductId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "deliverableType" "DeliverableType" NOT NULL,
    "daysFromStart" INTEGER NOT NULL DEFAULT 7,

    CONSTRAINT "ServiceProductDeliverableTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brief" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "serviceProductId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "briefType" "BriefType" NOT NULL DEFAULT 'content',
    "typeDetails" JSONB,
    "priority" "BriefPriority" NOT NULL DEFAULT 'medium',
    "liveWorkOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "BriefStatus" NOT NULL DEFAULT 'draft',
    "scopeStatus" "ScopeStatus" NOT NULL DEFAULT 'in_scope',
    "deadline" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "reviewLink" TEXT,
    "internalDeliveryDate" TIMESTAMP(3),
    "clientDeliveryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brief_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BriefAssignment" (
    "id" TEXT NOT NULL,
    "briefId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "AssignmentRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BriefAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deliverable" (
    "id" TEXT NOT NULL,
    "briefId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "deliverableType" "DeliverableType" NOT NULL,
    "deliveryDate" TIMESTAMP(3) NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Deliverable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BriefUpdate" (
    "id" TEXT NOT NULL,
    "briefId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "visibleToClient" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BriefUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalNote" (
    "id" TEXT NOT NULL,
    "briefId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "noteType" "InternalNoteType" NOT NULL DEFAULT 'general',
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternalNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageThread" (
    "id" TEXT NOT NULL,
    "briefId" TEXT NOT NULL,
    "threadType" "ThreadType" NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarBooking" (
    "id" TEXT NOT NULL,
    "briefId" TEXT,
    "clientId" TEXT,
    "userId" TEXT,
    "bookingType" "BookingType" NOT NULL,
    "title" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "visibleToClient" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CalendarBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeLog" (
    "id" TEXT NOT NULL,
    "briefId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "daysSpent" DOUBLE PRECISION NOT NULL,
    "hoursSpent" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimeLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "href" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "briefId" TEXT,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardFeedDismissal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityLogId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DashboardFeedDismissal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortalNotificationDismissal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortalNotificationDismissal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "AiConversation_userId_lastMessageAt_idx" ON "AiConversation"("userId", "lastMessageAt");

-- CreateIndex
CREATE INDEX "AiMessage_conversationId_createdAt_idx" ON "AiMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "AiMessage_userId_createdAt_idx" ON "AiMessage"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PendingClientSignup_createdUserId_key" ON "PendingClientSignup"("createdUserId");

-- CreateIndex
CREATE INDEX "PendingClientSignup_email_idx" ON "PendingClientSignup"("email");

-- CreateIndex
CREATE INDEX "PendingClientSignup_status_createdAt_idx" ON "PendingClientSignup"("status", "createdAt");

-- CreateIndex
CREATE INDEX "FeedbackTicket_status_createdAt_idx" ON "FeedbackTicket"("status", "createdAt");

-- CreateIndex
CREATE INDEX "FeedbackTicket_userId_idx" ON "FeedbackTicket"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_convertedClientId_key" ON "Lead"("convertedClientId");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_email_idx" ON "Lead"("email");

-- CreateIndex
CREATE INDEX "Lead_nextFollowUpDueAt_idx" ON "Lead"("nextFollowUpDueAt");

-- CreateIndex
CREATE UNIQUE INDEX "TeamChannel_clientId_key" ON "TeamChannel"("clientId");

-- CreateIndex
CREATE INDEX "TeamChannelMember_userId_idx" ON "TeamChannelMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamChannelMember_channelId_userId_key" ON "TeamChannelMember"("channelId", "userId");

-- CreateIndex
CREATE INDEX "TeamChannelMessage_channelId_createdAt_idx" ON "TeamChannelMessage"("channelId", "createdAt");

-- CreateIndex
CREATE INDEX "DmThread_lowUserId_idx" ON "DmThread"("lowUserId");

-- CreateIndex
CREATE INDEX "DmThread_highUserId_idx" ON "DmThread"("highUserId");

-- CreateIndex
CREATE UNIQUE INDEX "DmThread_lowUserId_highUserId_key" ON "DmThread"("lowUserId", "highUserId");

-- CreateIndex
CREATE INDEX "DmMessage_threadId_createdAt_idx" ON "DmMessage"("threadId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ClientContact_clientId_role_key" ON "ClientContact"("clientId", "role");

-- CreateIndex
CREATE INDEX "ClientAsset_clientId_type_idx" ON "ClientAsset"("clientId", "type");

-- CreateIndex
CREATE INDEX "ServiceProductDeliverableTemplate_serviceProductId_idx" ON "ServiceProductDeliverableTemplate"("serviceProductId");

-- CreateIndex
CREATE INDEX "Brief_serviceProductId_idx" ON "Brief"("serviceProductId");

-- CreateIndex
CREATE UNIQUE INDEX "BriefAssignment_briefId_userId_role_key" ON "BriefAssignment"("briefId", "userId", "role");

-- CreateIndex
CREATE INDEX "CalendarBooking_userId_idx" ON "CalendarBooking"("userId");

-- CreateIndex
CREATE INDEX "DashboardFeedDismissal_userId_idx" ON "DashboardFeedDismissal"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DashboardFeedDismissal_userId_activityLogId_key" ON "DashboardFeedDismissal"("userId", "activityLogId");

-- CreateIndex
CREATE INDEX "PortalNotificationDismissal_userId_idx" ON "PortalNotificationDismissal"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PortalNotificationDismissal_userId_key_key" ON "PortalNotificationDismissal"("userId", "key");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiConversation" ADD CONSTRAINT "AiConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiMessage" ADD CONSTRAINT "AiMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AiConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiMessage" ADD CONSTRAINT "AiMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingClientSignup" ADD CONSTRAINT "PendingClientSignup_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingClientSignup" ADD CONSTRAINT "PendingClientSignup_createdUserId_fkey" FOREIGN KEY ("createdUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackTicket" ADD CONSTRAINT "FeedbackTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_convertedClientId_fkey" FOREIGN KEY ("convertedClientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamChannel" ADD CONSTRAINT "TeamChannel_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamChannelMember" ADD CONSTRAINT "TeamChannelMember_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "TeamChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamChannelMember" ADD CONSTRAINT "TeamChannelMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamChannelMessage" ADD CONSTRAINT "TeamChannelMessage_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "TeamChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamChannelMessage" ADD CONSTRAINT "TeamChannelMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DmThread" ADD CONSTRAINT "DmThread_lowUserId_fkey" FOREIGN KEY ("lowUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DmThread" ADD CONSTRAINT "DmThread_highUserId_fkey" FOREIGN KEY ("highUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DmMessage" ADD CONSTRAINT "DmMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "DmThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DmMessage" ADD CONSTRAINT "DmMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientContact" ADD CONSTRAINT "ClientContact_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientAsset" ADD CONSTRAINT "ClientAsset_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceProductDeliverableTemplate" ADD CONSTRAINT "ServiceProductDeliverableTemplate_serviceProductId_fkey" FOREIGN KEY ("serviceProductId") REFERENCES "ServiceProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Brief" ADD CONSTRAINT "Brief_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Brief" ADD CONSTRAINT "Brief_serviceProductId_fkey" FOREIGN KEY ("serviceProductId") REFERENCES "ServiceProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BriefAssignment" ADD CONSTRAINT "BriefAssignment_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "Brief"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BriefAssignment" ADD CONSTRAINT "BriefAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deliverable" ADD CONSTRAINT "Deliverable_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "Brief"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BriefUpdate" ADD CONSTRAINT "BriefUpdate_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "Brief"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BriefUpdate" ADD CONSTRAINT "BriefUpdate_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalNote" ADD CONSTRAINT "InternalNote_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "Brief"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalNote" ADD CONSTRAINT "InternalNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageThread" ADD CONSTRAINT "MessageThread_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "Brief"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "MessageThread"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarBooking" ADD CONSTRAINT "CalendarBooking_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "Brief"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarBooking" ADD CONSTRAINT "CalendarBooking_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarBooking" ADD CONSTRAINT "CalendarBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeLog" ADD CONSTRAINT "TimeLog_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "Brief"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeLog" ADD CONSTRAINT "TimeLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "Brief"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardFeedDismissal" ADD CONSTRAINT "DashboardFeedDismissal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardFeedDismissal" ADD CONSTRAINT "DashboardFeedDismissal_activityLogId_fkey" FOREIGN KEY ("activityLogId") REFERENCES "ActivityLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortalNotificationDismissal" ADD CONSTRAINT "PortalNotificationDismissal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- =============================================================================
-- SECTION 2 — Row Level Security (recommended)
-- =============================================================================
-- Prisma connects with the database password (postgres role), which bypasses RLS.
-- Enabling RLS blocks accidental public access via Supabase's auto-generated REST API.

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'User', 'AiConversation', 'AiMessage', 'PasswordResetToken', 'PendingClientSignup',
    'FeedbackTicket', 'Client', 'Lead', 'TeamChannel', 'TeamChannelMember',
    'TeamChannelMessage', 'DmThread', 'DmMessage', 'ClientContact', 'ClientAsset',
    'ServiceProduct', 'ServiceProductDeliverableTemplate', 'Brief', 'BriefAssignment',
    'Deliverable', 'BriefUpdate', 'InternalNote', 'MessageThread', 'Message',
    'CalendarBooking', 'TimeLog', 'Notification', 'ActivityLog',
    'DashboardFeedDismissal', 'PortalNotificationDismissal'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
  END LOOP;
END $$;


-- =============================================================================
-- SECTION 3 — Optional: first admin user
-- =============================================================================
-- Password: password123  (change immediately after first login)
-- Replace the email with your real admin address before running in production.

INSERT INTO "User" (
  "id",
  "email",
  "fullName",
  "passwordHash",
  "role",
  "createdAt",
  "updatedAt"
) VALUES (
  'admin_seed_001',
  'admin@yourdomain.com',
  'Admin User',
  '$2b$10$wh630smgEoPd.JBemx3YGuCh6zMXhcndBhaszvdQK9X60vWNIWXta',
  'admin',
  NOW(),
  NOW()
) ON CONFLICT ("email") DO NOTHING;
