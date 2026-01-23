-- AlterTable
ALTER TABLE `FuelStationLedger` ADD COLUMN `ownerLedgerId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `FuelStationLedger_ownerLedgerId_idx` ON `FuelStationLedger`(`ownerLedgerId`);

-- AddForeignKey
ALTER TABLE `FuelStationLedger` ADD CONSTRAINT `FuelStationLedger_ownerLedgerId_fkey` FOREIGN KEY (`ownerLedgerId`) REFERENCES `Ledger`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
