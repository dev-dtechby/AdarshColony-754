import prisma from "../../lib/prisma";

export const getSiteProfitData = async () => {
  const sites = await prisma.site.findMany({
    where: {
      isDeleted: false,
    },
    include: {
      department: true, // ✅ Department name
      expenses: {
        where: { isDeleted: false },
      },
      vouchers: {
        // 🔥 Cheque Amt = Actual Amount Received
        where: {},
      },
    },
  });

  return sites.map((site) => {
    /* ================= TOTAL EXPENSE ================= */
    const totalExpense = site.expenses.reduce(
      (sum: number, e) => sum + Number(e.amount || 0),
      0
    );

    /* ================= TOTAL AMOUNT RECEIVED ================= */
    const totalReceived = site.vouchers.reduce(
      (sum: number, v) => sum + Number(v.chequeAmt || 0),
      0
    );

    return {
      siteId: site.id,
      department: site.department?.name ?? "N/A",
      siteName: site.siteName,

      expenses: totalExpense,
      amountReceived: totalReceived, // ✅ FIXED
      profit: totalReceived - totalExpense,

      status: site.status, // unchanged
    };
  });
};
