/*
  Warnings:

  - A unique constraint covering the columns `[trackingCode]` on the table `Device` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `trackingCode` to the `Device` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `device` ADD COLUMN `trackingCode` VARCHAR(50) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Device_trackingCode_key` ON `Device`(`trackingCode`);
