/*
  Warnings:

  - The `contentType` column on the `Message` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "MessageContentType" AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'FILE', 'SYSTEM', 'URL');

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "contentType",
ADD COLUMN     "contentType" "MessageContentType" NOT NULL DEFAULT 'TEXT';
