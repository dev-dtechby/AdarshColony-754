-- CreateTable
CREATE TABLE `VehicleRentVehicle` (
    `id` VARCHAR(191) NOT NULL,
    `ownerLedgerId` VARCHAR(191) NOT NULL,
    `vehicleNo` VARCHAR(191) NOT NULL,
    `vehicleName` VARCHAR(191) NOT NULL,
    `rentBasis` ENUM('HOURLY', 'MONTHLY') NOT NULL DEFAULT 'HOURLY',
    `hourlyRate` DECIMAL(12, 2) NULL,
    `monthlyRate` DECIMAL(12, 2) NULL,
    `agreementUrl` VARCHAR(191) NULL,
    `agreementPublicId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `VehicleRentVehicle_ownerLedgerId_idx`(`ownerLedgerId`),
    UNIQUE INDEX `VehicleRentVehicle_ownerLedgerId_vehicleNo_key`(`ownerLedgerId`, `vehicleNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VehicleRentLog` (
    `id` VARCHAR(191) NOT NULL,
    `vehicleId` VARCHAR(191) NOT NULL,
    `siteId` VARCHAR(191) NOT NULL,
    `entryDate` DATETIME(3) NOT NULL,
    `startMeter` DECIMAL(12, 2) NOT NULL,
    `endMeter` DECIMAL(12, 2) NOT NULL,
    `workingHour` DECIMAL(12, 2) NOT NULL,
    `dieselExp` DECIMAL(12, 2) NOT NULL,
    `generatedAmt` DECIMAL(12, 2) NOT NULL,
    `paymentAmt` DECIMAL(12, 2) NOT NULL,
    `balanceAmt` DECIMAL(12, 2) NOT NULL,
    `remarks` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `VehicleRentLog_siteId_idx`(`siteId`),
    INDEX `VehicleRentLog_vehicleId_idx`(`vehicleId`),
    INDEX `VehicleRentLog_entryDate_idx`(`entryDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `VehicleRentVehicle` ADD CONSTRAINT `VehicleRentVehicle_ownerLedgerId_fkey` FOREIGN KEY (`ownerLedgerId`) REFERENCES `Ledger`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VehicleRentLog` ADD CONSTRAINT `VehicleRentLog_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `VehicleRentVehicle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VehicleRentLog` ADD CONSTRAINT `VehicleRentLog_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
