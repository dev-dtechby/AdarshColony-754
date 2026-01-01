import prisma from "../../lib/prisma";

/* =====================================================
   CREATE VOUCHER
   Used by: VoucherForm.tsx
   POST /api/vouchers
===================================================== */
export const createVoucher = async (data: any) => {
  return prisma.voucher.create({
    data: {
      voucherDate: new Date(data.voucherDate),

      siteId: data.siteId,
      departmentId: data.departmentId,

      grossAmt: data.grossAmt || null,
      withheld: data.withheld || null,
      incomeTax: data.incomeTax || null,
      revenue: data.revenue || null,
      lwf: data.lwf || null,
      royalty: data.royalty || null,
      miscDeduction: data.miscDeduction || null,
      karmkarTax: data.karmkarTax || null,
      securedDeposit: data.securedDeposit || null,
      tdsOnGst: data.tdsOnGst || null,
      tds: data.tds || null,
      performanceGuarantee: data.performanceGuarantee || null,
      gst: data.gst || null,
      improperFinishing: data.improperFinishing || null,
      otherDeduction: data.otherDeduction || null,
      deductionAmt: data.deductionAmt || null,

      // 🔥 ACTUAL AMOUNT RECEIVED
      chequeAmt: data.chequeAmt,
    },
  });
};

/* =====================================================
   GET ALL VOUCHERS
   Used by: VoucherTable.tsx
   GET /api/vouchers
===================================================== */
export const getAllVouchers = async () => {
  return prisma.voucher.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      site: {
        select: {
          id: true,
          siteName: true,
        },
      },
      department: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
};

/* =====================================================
   GET SINGLE VOUCHER
   Used by: EditVoucher.tsx
   GET /api/vouchers/:id
===================================================== */
export const getVoucherById = async (id: string) => {
  return prisma.voucher.findUnique({
    where: { id },
    include: {
      site: {
        select: {
          id: true,
          siteName: true,
        },
      },
      department: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
};

/* =====================================================
   UPDATE VOUCHER
   Used by: EditVoucher.tsx
   PUT /api/vouchers/:id
===================================================== */
export const updateVoucher = async (id: string, data: any) => {
  return prisma.voucher.update({
    where: { id },
    data: {
      voucherDate: new Date(data.voucherDate),

      siteId: data.siteId,
      departmentId: data.departmentId,

      grossAmt: data.grossAmt || null,
      withheld: data.withheld || null,
      incomeTax: data.incomeTax || null,
      revenue: data.revenue || null,
      lwf: data.lwf || null,
      royalty: data.royalty || null,
      miscDeduction: data.miscDeduction || null,
      karmkarTax: data.karmkarTax || null,
      securedDeposit: data.securedDeposit || null,
      tdsOnGst: data.tdsOnGst || null,
      tds: data.tds || null,
      performanceGuarantee: data.performanceGuarantee || null,
      gst: data.gst || null,
      improperFinishing: data.improperFinishing || null,
      otherDeduction: data.otherDeduction || null,
      deductionAmt: data.deductionAmt || null,

      chequeAmt: data.chequeAmt,
    },
  });
};

/* =====================================================
   DELETE VOUCHER (HARD DELETE)
   Used by: VoucherTable.tsx
   DELETE /api/vouchers/:id
===================================================== */
export const deleteVoucher = async (id: string) => {
  return prisma.voucher.delete({
    where: { id },
  });
};
