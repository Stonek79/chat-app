-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('DELETED', 'EDITED');

-- CreateTable
CREATE TABLE "MessageAction" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "messageId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "type" "ActionType" NOT NULL,
    "newContent" TEXT,

    CONSTRAINT "MessageAction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MessageAction" ADD CONSTRAINT "MessageAction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageAction" ADD CONSTRAINT "MessageAction_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
