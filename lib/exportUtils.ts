import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ================= TRANSFORM ================= */
export const transformVoucherData = (
  data: any[]
): Record<string, any>[] => {
  return data.map((v, index) => ({
    "S.No": index + 1,
    "Voucher Date": new Date(v.voucherDate).toLocaleDateString(),
    "Site": v.site?.siteName || "",
    "Department": v.department?.name || "",

    "Gross Amt": v.grossAmt || "",
    "Withheld": v.withheld || "",
    "Income Tax": v.incomeTax || "",
    "Revenue": v.revenue || "",
    "LWF": v.lwf || "",
    "Royalty": v.royalty || "",
    "Misc Deduction": v.miscDeduction || "",
    "Karmkar Tax": v.karmkarTax || "",
    "Secured Deposit": v.securedDeposit || "",
    "TDS on GST": v.tdsOnGst || "",
    "TDS": v.tds || "",
    "Performance Guarantee": v.performanceGuarantee || "",
    "GST": v.gst || "",
    "Improper Finishing": v.improperFinishing || "",
    "Other Deduction": v.otherDeduction || "",
    "Deduction Amt": v.deductionAmt || "",
    "Cheque Amt": v.chequeAmt || "",
  }));
};

/* ================= CSV ================= */
export const exportToCSV = (
  rawData: any[],
  fileName: string
) => {
  const data = transformVoucherData(rawData);
  if (!data.length) return;

  const headers = Object.keys(data[0]);

  const csvRows = [
    headers.join(","),
    ...data.map((row: Record<string, any>) =>
      headers.map(h => `"${row[h] ?? ""}"`).join(",")
    ),
  ];

  const blob = new Blob([csvRows.join("\n")], {
    type: "text/csv",
  });

  downloadBlob(blob, `${fileName}.csv`);
};

/* ================= EXCEL ================= */
export const exportToExcel = (
  rawData: any[],
  fileName: string
) => {
  const data = transformVoucherData(rawData);
  if (!data.length) return;

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Vouchers");
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

/* ================= PDF ================= */
export const exportToPDF = (
  rawData: any[],
  fileName: string
) => {
  const data = transformVoucherData(rawData);
  if (!data.length) return;

  const doc = new jsPDF("l", "mm", "a4");

  autoTable(doc, {
    head: [Object.keys(data[0])],
    body: data.map(row => Object.values(row)),
    styles: { fontSize: 8 },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
    },
    margin: { top: 15 },
  });

  doc.save(`${fileName}.pdf`);
};

/* ================= HELPER ================= */
const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};
