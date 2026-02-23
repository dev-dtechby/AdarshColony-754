-- CreateTable
CREATE TABLE `ColonyMember` (
    `id` VARCHAR(191) NOT NULL,
    `serialNo` INTEGER NOT NULL,
    `memberCode` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `fatherOrHusbandName` VARCHAR(191) NULL,
    `mobileNo` VARCHAR(191) NULL,
    `blockNo` INTEGER NOT NULL,
    `floor` VARCHAR(191) NULL,
    `flatNo` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ColonyMember_serialNo_key`(`serialNo`),
    UNIQUE INDEX `ColonyMember_memberCode_key`(`memberCode`),
    INDEX `ColonyMember_blockNo_idx`(`blockNo`),
    INDEX `ColonyMember_name_idx`(`name`),
    UNIQUE INDEX `ColonyMember_blockNo_flatNo_key`(`blockNo`, `flatNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
