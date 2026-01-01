import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ================= EXCEL EXPORT ================= */
export const exportSiteExpenseToExcel = (
  data: any[],
  fileName: string
) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Site Expenses"
  );

  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

/* ================= PDF EXPORT ================= */
export const exportSiteExpenseToPDF = (
  data: any[],
  fileName: string
) => {
  const doc = new jsPDF("l", "mm", "a4"); // Landscape

  autoTable(doc, {
    head: [
      ["Site", "Date", "Expense", "Summary", "Payment", "Amount"],
    ],
    body: data.map((row) => [
      row.Site,
      row.Date,
      row.Expense,
      row.Summary,
      row.Payment,
      row.Amount,
    ]),
    styles: {
      fontSize: 9,
      cellPadding: 3,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: "bold",
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 25 },
      2: { cellWidth: 40 },
      3: { cellWidth: 60 },
      4: { cellWidth: 35 },
      5: { cellWidth: 25, halign: "right" },
    },
    margin: { top: 12 },
  });

  doc.save(`${fileName}.pdf`);
};
