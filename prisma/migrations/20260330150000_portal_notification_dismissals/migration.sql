-- CreateTable
CREATE TABLE "PortalNotificationDismissal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortalNotificationDismissal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PortalNotificationDismissal_userId_idx" ON "PortalNotificationDismissal"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PortalNotificationDismissal_userId_key_key" ON "PortalNotificationDismissal"("userId", "key");

-- AddForeignKey
ALTER TABLE "PortalNotificationDismissal" ADD CONSTRAINT "PortalNotificationDismissal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
