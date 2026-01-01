import prisma from "../../lib/prisma";

/* =========================================================
   CREATE SITE EXPENSE
========================================================= */
export const createSiteExpense = async (data: {
  siteId: string;
  expenseDate: string;
  expenseTitle?: string;
  expenseSummary?: string;
  paymentDetails?: string;
  amount: number;
}) => {
  return prisma.siteExpense.create({
    data: {
      siteId: data.siteId,
      expenseDate: new Date(data.expenseDate),

      // ✅ SAFE STRING (NO undefined)
      expenseTitle: data.expenseTitle?.trim() || "",
      summary: data.expenseSummary?.trim() || "",
      paymentDetails: data.paymentDetails?.trim() || "",

      amount: Number(data.amount),
    },
  });
};

/* =========================================================
   GET ALL SITE EXPENSES (ACTIVE ONLY)
========================================================= */
export const getAllSiteExpenses = async () => {
  return prisma.siteExpense.findMany({
    where: { isDeleted: false },
    orderBy: { expenseDate: "desc" },
    include: {
      site: {
        select: {
          id: true,
          siteName: true,
        },
      },
    },
  });
};

/* =========================================================
   GET EXPENSES BY SITE (ACTIVE ONLY)
========================================================= */
export const getExpensesBySite = async (siteId: string) => {
  return prisma.siteExpense.findMany({
    where: {
      siteId,
      isDeleted: false,
    },
    orderBy: { expenseDate: "desc" },
  });
};

/* =========================================================
   UPDATE SITE EXPENSE
========================================================= */
export const updateSiteExpense = async (
  id: string,
  data: {
    siteId: string;
    expenseDate: string;
    expenseTitle?: string;
    expenseSummary?: string;
    paymentDetails?: string;
    amount: number;
  }
) => {
  return prisma.siteExpense.update({
    where: { id },
    data: {
      siteId: data.siteId,
      expenseDate: new Date(data.expenseDate),

      // ✅ SAFE STRING
      expenseTitle: data.expenseTitle?.trim() || "",
      summary: data.expenseSummary?.trim() || "",
      paymentDetails: data.paymentDetails?.trim() || "",

      amount: Number(data.amount),
    },
  });
};

/* =========================================================
   SOFT DELETE SITE EXPENSE
========================================================= */
export const softDeleteSiteExpense = async (id: string) => {
  return prisma.siteExpense.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });
};

/* =========================================================
   RESTORE SITE EXPENSE
========================================================= */
export const restoreSiteExpense = async (id: string) => {
  return prisma.siteExpense.update({
    where: { id },
    data: {
      isDeleted: false,
      deletedAt: null,
    },
  });
};

/* =========================================================
   HARD DELETE SITE EXPENSE
========================================================= */
export const hardDeleteSiteExpense = async (id: string) => {
  return prisma.siteExpense.delete({
    where: { id },
  });
};
