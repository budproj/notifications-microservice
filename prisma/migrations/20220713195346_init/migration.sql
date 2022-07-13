-- CreateTable
CREATE TABLE "notification" (
    "id" UUID NOT NULL,
    "messageId" UUID NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "type" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "recipientId" TEXT NOT NULL,
    "properties" JSONB,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notification_messageId_key" ON "notification"("messageId");
