-- DropForeignKey
ALTER TABLE "attachments" DROP CONSTRAINT "attachments_post_id_fkey";

-- AlterTable
ALTER TABLE "attachments" ALTER COLUMN "post_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
