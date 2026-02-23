-- AlterTable
ALTER TABLE `ColonyMember` ADD COLUMN `registeredAt` DATETIME(3) NULL,
    MODIFY `serialNo` INTEGER NULL,
    MODIFY `memberCode` VARCHAR(191) NULL;
