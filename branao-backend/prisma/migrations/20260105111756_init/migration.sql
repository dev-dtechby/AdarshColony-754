-- CreateTable
CREATE TABLE `Department` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Department_name_key`(`name`),
    INDEX `Department_isDeleted_idx`(`isDeleted`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Site` (
    `id` VARCHAR(191) NOT NULL,
    `siteName` VARCHAR(191) NOT NULL,
    `tenderNo` VARCHAR(191) NULL,
    `sdAmount` DECIMAL(18, 2) NULL,
    `status` ENUM('NOT_STARTED', 'ONGOING', 'COMPLETED', 'ON_HOLD') NOT NULL DEFAULT 'NOT_STARTED',
    `departmentId` VARCHAR(191) NULL,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Site_departmentId_idx`(`departmentId`),
    INDEX `Site_status_idx`(`status`),
    INDEX `Site_isDeleted_idx`(`isDeleted`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SiteEstimate` (
    `id` VARCHAR(191) NOT NULL,
    `siteId` VARCHAR(191) NOT NULL,
    `cement` DECIMAL(18, 2) NULL,
    `metal` DECIMAL(18, 2) NULL,
    `sand` DECIMAL(18, 2) NULL,
    `labour` DECIMAL(18, 2) NULL,
    `royalty` DECIMAL(18, 2) NULL,
    `overhead` DECIMAL(18, 2) NULL,
    `lead` DECIMAL(18, 2) NULL,
    `dressing` DECIMAL(18, 2) NULL,
    `waterCompaction` DECIMAL(18, 2) NULL,
    `loading` DECIMAL(18, 2) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SiteEstimate_siteId_key`(`siteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SiteDocument` (
    `id` VARCHAR(191) NOT NULL,
    `siteId` VARCHAR(191) NOT NULL,
    `type` ENUM('SD', 'WORK_ORDER', 'TENDER') NOT NULL,
    `url` VARCHAR(191) NULL,
    `secureUrl` VARCHAR(191) NOT NULL,
    `publicId` VARCHAR(191) NOT NULL,
    `resourceType` VARCHAR(191) NOT NULL,
    `bytes` INTEGER NULL,
    `format` VARCHAR(191) NULL,
    `originalName` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SiteDocument_siteId_type_idx`(`siteId`, `type`),
    UNIQUE INDEX `uniq_site_single_docs`(`siteId`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SiteExpense` (
    `id` VARCHAR(191) NOT NULL,
    `siteId` VARCHAR(191) NOT NULL,
    `expenseDate` DATETIME(3) NOT NULL,
    `expenseTitle` VARCHAR(191) NOT NULL,
    `summary` VARCHAR(191) NOT NULL,
    `paymentDetails` VARCHAR(191) NULL,
    `amount` DECIMAL(18, 2) NOT NULL,
    `staffExpenseId` VARCHAR(191) NULL,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SiteExpense_staffExpenseId_key`(`staffExpenseId`),
    INDEX `SiteExpense_siteId_idx`(`siteId`),
    INDEX `SiteExpense_expenseDate_idx`(`expenseDate`),
    INDEX `SiteExpense_isDeleted_idx`(`isDeleted`),
    INDEX `SiteExpense_staffExpenseId_idx`(`staffExpenseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SiteReceipt` (
    `id` VARCHAR(191) NOT NULL,
    `siteId` VARCHAR(191) NOT NULL,
    `receiptDate` DATETIME(3) NOT NULL,
    `referenceNo` VARCHAR(191) NULL,
    `receivedFrom` VARCHAR(191) NULL,
    `paymentMode` VARCHAR(191) NULL,
    `amount` DECIMAL(18, 2) NOT NULL,
    `remarks` VARCHAR(191) NULL,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SiteReceipt_siteId_idx`(`siteId`),
    INDEX `SiteReceipt_receiptDate_idx`(`receiptDate`),
    INDEX `SiteReceipt_isDeleted_idx`(`isDeleted`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `module` VARCHAR(191) NOT NULL,
    `recordId` VARCHAR(191) NOT NULL,
    `action` ENUM('CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'HARD_DELETE') NOT NULL,
    `oldData` JSON NULL,
    `newData` JSON NULL,
    `ip` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_module_idx`(`module`),
    INDEX `AuditLog_recordId_idx`(`recordId`),
    INDEX `AuditLog_action_idx`(`action`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Voucher` (
    `id` VARCHAR(191) NOT NULL,
    `voucherDate` DATETIME(3) NOT NULL,
    `siteId` VARCHAR(191) NOT NULL,
    `departmentId` VARCHAR(191) NOT NULL,
    `grossAmt` DECIMAL(18, 2) NULL,
    `withheld` DECIMAL(18, 2) NULL,
    `incomeTax` DECIMAL(18, 2) NULL,
    `revenue` DECIMAL(18, 2) NULL,
    `lwf` DECIMAL(18, 2) NULL,
    `royalty` DECIMAL(18, 2) NULL,
    `miscDeduction` DECIMAL(18, 2) NULL,
    `karmkarTax` DECIMAL(18, 2) NULL,
    `securedDeposit` DECIMAL(18, 2) NULL,
    `tdsOnGst` DECIMAL(18, 2) NULL,
    `tds` DECIMAL(18, 2) NULL,
    `performanceGuarantee` DECIMAL(18, 2) NULL,
    `gst` DECIMAL(18, 2) NULL,
    `improperFinishing` DECIMAL(18, 2) NULL,
    `otherDeduction` DECIMAL(18, 2) NULL,
    `deductionAmt` DECIMAL(18, 2) NULL,
    `chequeAmt` DECIMAL(18, 2) NOT NULL,
    `voucherFileUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Voucher_siteId_idx`(`siteId`),
    INDEX `Voucher_departmentId_idx`(`departmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LedgerType` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `LedgerType_name_key`(`name`),
    INDEX `LedgerType_isDeleted_idx`(`isDeleted`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Ledger` (
    `id` VARCHAR(191) NOT NULL,
    `ledgerTypeId` VARCHAR(191) NOT NULL,
    `siteId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NULL,
    `mobile` VARCHAR(191) NULL,
    `openingBalance` DECIMAL(18, 2) NULL,
    `closingBalance` DECIMAL(18, 2) NULL,
    `remark` VARCHAR(191) NULL,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Ledger_ledgerTypeId_idx`(`ledgerTypeId`),
    INDEX `Ledger_siteId_idx`(`siteId`),
    INDEX `Ledger_isDeleted_idx`(`isDeleted`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StaffExpense` (
    `id` VARCHAR(191) NOT NULL,
    `staffLedgerId` VARCHAR(191) NOT NULL,
    `siteId` VARCHAR(191) NULL,
    `expenseDate` DATETIME(3) NOT NULL,
    `expenseTitle` VARCHAR(191) NOT NULL,
    `summary` VARCHAR(191) NULL,
    `remark` VARCHAR(191) NULL,
    `outAmount` DECIMAL(18, 2) NULL,
    `inAmount` DECIMAL(18, 2) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MaterialSupplierLedger` (
    `id` VARCHAR(191) NOT NULL,
    `entryDate` DATETIME(3) NOT NULL,
    `receiptNo` VARCHAR(191) NULL,
    `parchiPhoto` VARCHAR(191) NULL,
    `otp` VARCHAR(191) NULL,
    `vehicleNo` VARCHAR(191) NULL,
    `vehiclePhoto` VARCHAR(191) NULL,
    `material` VARCHAR(191) NOT NULL,
    `size` VARCHAR(191) NULL,
    `qty` DECIMAL(12, 3) NOT NULL,
    `rate` DECIMAL(12, 2) NOT NULL,
    `royaltyQty` DECIMAL(12, 3) NULL,
    `royaltyRate` DECIMAL(12, 2) NULL,
    `royaltyAmt` DECIMAL(12, 2) NULL,
    `gstPercent` DECIMAL(5, 2) NULL,
    `taxAmt` DECIMAL(12, 2) NULL,
    `totalAmt` DECIMAL(12, 2) NULL,
    `paymentAmt` DECIMAL(12, 2) NULL,
    `balanceAmt` DECIMAL(12, 2) NULL,
    `remarks` VARCHAR(191) NULL,
    `ledgerId` VARCHAR(191) NOT NULL,
    `siteId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `MaterialSupplierLedger_ledgerId_idx`(`ledgerId`),
    INDEX `MaterialSupplierLedger_siteId_idx`(`siteId`),
    INDEX `MaterialSupplierLedger_entryDate_idx`(`entryDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MaterialMaster` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `MaterialMaster_name_key`(`name`),
    INDEX `MaterialMaster_isDeleted_idx`(`isDeleted`),
    INDEX `MaterialMaster_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SiteTransaction` (
    `id` VARCHAR(191) NOT NULL,
    `siteId` VARCHAR(191) NOT NULL,
    `txnDate` DATETIME(3) NOT NULL,
    `source` ENUM('SITE_EXPENSE', 'SITE_RECEIPT', 'STAFF_EXPENSE', 'MATERIAL_PURCHASE', 'VOUCHER') NOT NULL,
    `sourceId` VARCHAR(191) NOT NULL,
    `nature` ENUM('DEBIT', 'CREDIT') NOT NULL,
    `amount` DECIMAL(18, 2) NOT NULL,
    `title` VARCHAR(191) NULL,
    `remarks` VARCHAR(191) NULL,
    `meta` JSON NULL,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SiteTransaction_siteId_idx`(`siteId`),
    INDEX `SiteTransaction_txnDate_idx`(`txnDate`),
    INDEX `SiteTransaction_siteId_txnDate_idx`(`siteId`, `txnDate`),
    INDEX `SiteTransaction_source_sourceId_idx`(`source`, `sourceId`),
    INDEX `SiteTransaction_isDeleted_idx`(`isDeleted`),
    UNIQUE INDEX `SiteTransaction_source_sourceId_key`(`source`, `sourceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Site` ADD CONSTRAINT `Site_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SiteEstimate` ADD CONSTRAINT `SiteEstimate_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SiteDocument` ADD CONSTRAINT `SiteDocument_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SiteExpense` ADD CONSTRAINT `SiteExpense_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SiteExpense` ADD CONSTRAINT `SiteExpense_staffExpenseId_fkey` FOREIGN KEY (`staffExpenseId`) REFERENCES `StaffExpense`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SiteReceipt` ADD CONSTRAINT `SiteReceipt_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Voucher` ADD CONSTRAINT `Voucher_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Voucher` ADD CONSTRAINT `Voucher_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ledger` ADD CONSTRAINT `Ledger_ledgerTypeId_fkey` FOREIGN KEY (`ledgerTypeId`) REFERENCES `LedgerType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ledger` ADD CONSTRAINT `Ledger_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StaffExpense` ADD CONSTRAINT `StaffExpense_staffLedgerId_fkey` FOREIGN KEY (`staffLedgerId`) REFERENCES `Ledger`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StaffExpense` ADD CONSTRAINT `StaffExpense_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaterialSupplierLedger` ADD CONSTRAINT `MaterialSupplierLedger_ledgerId_fkey` FOREIGN KEY (`ledgerId`) REFERENCES `Ledger`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaterialSupplierLedger` ADD CONSTRAINT `MaterialSupplierLedger_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SiteTransaction` ADD CONSTRAINT `SiteTransaction_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
