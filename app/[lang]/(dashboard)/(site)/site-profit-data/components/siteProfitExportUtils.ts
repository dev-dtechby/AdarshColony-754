import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ================= COMMON FORMAT ================= */
const formatData = (data: any[]) =>
  data.map((row) => ({
    Department: row.department,
    "Site Name": row.siteName,
    Expenses: row.expenses,
    "Amount Received": row.amountReceived,
    Profit: row.profit,
    Status: row.status,
  }));

/* ================= EXCEL ================= */
export const exportSiteProfitToExcel = (
  data: any[],
  fileName: string
) => {
  const formatted = formatData(data);

  const worksheet = XLSX.utils.json_to_sheet(formatted);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Site Profit"
  );

  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

/* ================= PDF ================= */
export const exportSiteProfitToPDF = (
  data: any[],
  fileName: string
) => {
  const formatted = formatData(data);

  const doc = new jsPDF("l", "mm", "a4");

  autoTable(doc, {
    head: [
      [
        "Department",
        "Site Name",
        "Expenses",
        "Amount Received",
        "Profit",
        "Status",
      ],
    ],
    body: formatted.map((r) => [
      r["Department"],
      r["Site Name"],
      r["Expenses"],
      r["Amount Received"],
      r["Profit"],
      r["Status"],
    ]),
    styles: {
      fontSize: 9,
      cellPadding: 3,
      halign: "right",
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      halign: "center",
      fontSize: 10,
    },
    columnStyles: {
      0: { halign: "left", cellWidth: 40 },
      1: { halign: "left", cellWidth: 55 },
      2: { cellWidth: 35 },
      3: { cellWidth: 40 },
      4: { cellWidth: 30 },
      5: { halign: "center", cellWidth: 30 },
    },
    margin: { top: 15 },
  });

  doc.save(`${fileName}.pdf`);
};
